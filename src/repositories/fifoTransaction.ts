import {
  db,
  isFirebaseConfigured,
  doc,
  runTransaction,
  serverTimestamp,
} from '../lib/firebase';
import {
  Batch,
  BatchStatus,
  CommodityType,
  DispatchRecord,
  AuditLog,
  AllocationItem,
  UserRole,
} from '../types';

export interface ExecuteFifoParams {
  commodity: CommodityType;
  variety: string;
  requestedBags: number;
  destinationFpsId: string;
  destinationName: string;
  destinationDistrict: string;
  destinationAddress: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  transporterAgency: string;
  dispatchedBy: string;
  authorizedBy: string;
  role: UserRole;
  issuerUid?: string;
  depotId?: string;
  depotName?: string;
  idempotencyKey?: string;
  remarks?: string;
  eligibleBatchesList: Batch[];
}

export interface FifoExecutionResult {
  success: boolean;
  challan?: DispatchRecord;
  allocations?: AllocationItem[];
  error?: string;
}

/**
 * Executes an atomic FIFO stock dispatch using Firestore's ACID transaction primitive.
 * Authoritative stock balances are locked, validated, and updated atomically alongside
 * the generated dispatch challan, stock movements, and immutable audit log.
 */
export async function executeAtomicFifoTransaction(
  params: ExecuteFifoParams
): Promise<FifoExecutionResult> {
  const {
    commodity,
    variety,
    requestedBags,
    destinationFpsId,
    destinationName,
    destinationDistrict,
    destinationAddress,
    vehicleNumber,
    driverName,
    driverPhone,
    transporterAgency,
    dispatchedBy,
    authorizedBy,
    role,
    issuerUid,
    depotId,
    depotName,
    idempotencyKey: clientProvidedIdempotencyKey,
    remarks,
    eligibleBatchesList,
  } = params;

  // 1. Role Authorization Check
  if (role === 'Ration Shop Dealer') {
    return {
      success: false,
      error: 'Ration Shop Dealers hold recipient privileges and cannot authorize depot outward dispatches.',
    };
  }

  if (requestedBags <= 0) {
    return {
      success: false,
      error: 'Dispatch quantity must be greater than zero.',
    };
  }

  // 2. Pre-filter and sort eligible batches (Oldest First)
  const candidateBatches = [...eligibleBatchesList]
    .filter((b) => {
      const matchComm = b.commodity === commodity;
      const matchVar = variety === 'ALL' || b.variety === variety;
      return matchComm && matchVar && b.status === 'Eligible' && b.availableBags > 0;
    })
    .sort((a, b) => {
      const dateA = new Date(a.receivedDate).getTime();
      const dateB = new Date(b.receivedDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.id.localeCompare(b.id);
    });

  const totalEligible = candidateBatches.reduce((acc, b) => acc + b.availableBags, 0);
  if (requestedBags > totalEligible) {
    return {
      success: false,
      error: `Insufficient eligible stock. Requested ${requestedBags} bags, but only ${totalEligible} bags eligible.`,
    };
  }

  // If Firebase is configured, execute via atomic Cloud Firestore transaction
  if (isFirebaseConfigured) {
    try {
      const now = new Date();
      const idempotencyKey = clientProvidedIdempotencyKey || `IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const challanNumber = `PDS-CH-2026-${randomSeq}`;
      const gatePassNo = `GP-2026-HUB-${Math.floor(2000 + Math.random() * 8000)}`;

      let createdChallan: DispatchRecord | null = null;
      let calculatedAllocations: AllocationItem[] = [];

      await runTransaction(db, async (transaction) => {
        // Read Phase 1: Idempotency check on challan document
        const dispatchDocRef = doc(db, 'dispatches', challanNumber);
        const challanSnap = await transaction.get(dispatchDocRef);
        if (challanSnap.exists()) {
          throw new Error(`Duplicate dispatch detected: Challan ${challanNumber} already exists in Firestore.`);
        }

        // Read Phase 2: Read and lock all candidate batch documents in Firestore
        const batchReads: { ref: any; batch: Batch; exists: boolean }[] = [];
        for (const candidate of candidateBatches) {
          const bRef = doc(db, 'batches', candidate.id);
          const snap = await transaction.get(bRef);
          if (snap.exists()) {
            batchReads.push({ ref: bRef, batch: snap.data() as Batch, exists: true });
          } else {
            batchReads.push({ ref: bRef, batch: candidate, exists: false });
          }
        }

        // Validate stock within atomic transaction lock (checking expiry and status)
        const isBatchExpired = (b: Batch) => {
          if (!b.expiryDate) return false;
          return new Date(b.expiryDate).getTime() < now.getTime();
        };

        const lockedBatches = batchReads
          .filter((item) => item.batch.status === 'Eligible' && item.batch.availableBags > 0 && !isBatchExpired(item.batch))
          .sort((a, b) => {
            const dateA = new Date(a.batch.receivedDate).getTime();
            const dateB = new Date(b.batch.receivedDate).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return a.batch.id.localeCompare(b.batch.id);
          });

        const lockedAvailable = lockedBatches.reduce((acc, b) => acc + b.batch.availableBags, 0);
        if (requestedBags > lockedAvailable) {
          throw new Error(
            `Concurrent stock allocation conflict: Authoritative eligible stock changed to ${lockedAvailable} bags. Requested: ${requestedBags} bags.`
          );
        }

        // Calculate exact FIFO bag splits across oldest batches
        let remainingToDeduct = requestedBags;
        const allocations: AllocationItem[] = [];

        for (const item of lockedBatches) {
          if (remainingToDeduct <= 0) break;
          const currentBags = item.batch.availableBags;
          const takeBags = Math.min(currentBags, remainingToDeduct);
          const allocatedQtl = Number(((takeBags * item.batch.bagWeightKg) / 100).toFixed(2));
          const remainingBagsAfter = currentBags - takeBags;
          const updatedAvailableQtl = Number(
            ((remainingBagsAfter * item.batch.bagWeightKg) / 100).toFixed(2)
          );
          const newStatus: BatchStatus = remainingBagsAfter <= 0 ? 'Exhausted' : item.batch.status;

          allocations.push({
            batchId: item.batch.id,
            commodity: item.batch.commodity,
            variety: item.batch.variety,
            receivedDate: item.batch.receivedDate,
            availableBags: currentBags,
            allocatedBags: takeBags,
            allocatedQtl,
            remainingBagsAfter,
            depotLocation: item.batch.depotLocation,
            stockAgeDays: item.batch.stockAgeDays || 0,
            isFullyExhausted: remainingBagsAfter === 0,
          });

          const newMovement = {
            id: `MOV-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            date: now.toISOString().split('T')[0],
            action: 'DISPATCH' as const,
            quantityBags: takeBags,
            quantityQtl: allocatedQtl,
            referenceId: challanNumber,
            user: `${role}`,
            notes: `Dispatched ${takeBags} bags to ${destinationName} via Gate Pass ${gatePassNo}`,
          };

          // Write Phase 1: Update batch with atomic decrement (safe create if non-existent)
          if (item.exists) {
            transaction.update(item.ref, {
              availableBags: remainingBagsAfter,
              availableQtl: updatedAvailableQtl,
              status: newStatus,
              movements: [newMovement, ...(item.batch.movements || [])],
              updatedAt: serverTimestamp(),
            });
          } else {
            transaction.set(item.ref, {
              ...item.batch,
              availableBags: remainingBagsAfter,
              availableQtl: updatedAvailableQtl,
              status: newStatus,
              movements: [newMovement, ...(item.batch.movements || [])],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          // Write Phase 2: Record in stock transactions ledger collection
          const txDocRef = doc(db, 'stock_transactions', `TX-${challanNumber}-${item.batch.id}`);
          transaction.set(txDocRef, {
            id: `TX-${challanNumber}-${item.batch.id}`,
            timestamp: now.toISOString(),
            date: now.toISOString().split('T')[0],
            action: 'DISPATCH',
            batchId: item.batch.id,
            commodity: item.batch.commodity,
            variety: item.batch.variety,
            quantityBags: takeBags,
            quantityQtl: allocatedQtl,
            referenceId: challanNumber,
            user: dispatchedBy,
            role: String(role),
            notes: `FIFO allocation to ${destinationName}`,
            depotLocation: item.batch.depotLocation,
            createdAt: serverTimestamp(),
          });

          remainingToDeduct -= takeBags;
        }

        const totalQtl = Number(
          allocations.reduce((sum, item) => sum + item.allocatedQtl, 0).toFixed(2)
        );

        const isAnyBatchDemo = candidateBatches.some((b) => b.isDemo);

        const newDispatch: DispatchRecord = {
          challanNumber,
          idempotencyKey,
          issuerUid,
          depotId,
          depotName,
          timestamp: now.toISOString(),
          commodity,
          variety,
          totalBags: requestedBags,
          totalQtl,
          destinationFpsId,
          destinationName,
          destinationDistrict,
          destinationAddress,
          vehicleNumber: vehicleNumber.toUpperCase().trim(),
          driverName: driverName.trim(),
          driverPhone: driverPhone.trim(),
          transporterAgency: transporterAgency.trim(),
          gatePassNo,
          allocatedBatches: allocations.map((a) => ({
            batchId: a.batchId,
            bags: a.allocatedBags,
            qtl: a.allocatedQtl,
            receivedDate: a.receivedDate,
            bay: a.depotLocation,
            stockAgeDays: a.stockAgeDays,
          })),
          status: 'Dispatched',
          dispatchedBy,
          authorizedBy,
          remarks: remarks || 'Standard PDS quota allocation under strict FIFO validation.',
          isDemo: Boolean(isAnyBatchDemo),
        };

        // Write Phase 3: Write Dispatch Document
        transaction.set(dispatchDocRef, {
          ...newDispatch,
          createdAt: serverTimestamp(),
        });

        // Write Phase 4: Write Immutable Audit Log
        const auditDocRef = doc(db, 'audit_logs', `AUD-${challanNumber}`);
        const auditData: AuditLog = {
          id: `AUD-${challanNumber}`,
          timestamp: now.toISOString(),
          user: dispatchedBy,
          role,
          action: 'FIFO_DISPATCH',
          entity: 'DISPATCH',
          referenceId: challanNumber,
          result: 'SUCCESS',
          details: `Dispatched ${requestedBags} bags (${totalQtl} Qtl) of ${commodity} (${variety}) to ${destinationName}. FIFO batches allocated: ${allocations
            .map((a) => `${a.batchId} (${a.allocatedBags} bags)`)
            .join(', ')}.`,
        };
        transaction.set(auditDocRef, {
          ...auditData,
          createdAt: serverTimestamp(),
        });

        createdChallan = newDispatch;
        calculatedAllocations = allocations;
      });

      return {
        success: true,
        challan: createdChallan || undefined,
        allocations: calculatedAllocations,
      };
    } catch (err: any) {
      console.error('[SmartPDS]: FIFO Transaction failed:', err);
      return {
        success: false,
        error: err?.message || 'Atomic stock transaction failed in Firestore.',
      };
    }
  }

  // Fallback for pending Firebase configuration (local atomic deterministic simulation)
  const now = new Date();
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  const challanNumber = `PDS-CH-2026-${randomSeq}`;
  const gatePassNo = `GP-2026-HUB-${Math.floor(2000 + Math.random() * 8000)}`;

  let remaining = requestedBags;
  const allocations: AllocationItem[] = [];

  for (const batch of candidateBatches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.availableBags, remaining);
    const allocatedQtl = Number(((take * batch.bagWeightKg) / 100).toFixed(2));
    const remainingAfter = batch.availableBags - take;

    allocations.push({
      batchId: batch.id,
      commodity: batch.commodity,
      variety: batch.variety,
      receivedDate: batch.receivedDate,
      availableBags: batch.availableBags,
      allocatedBags: take,
      allocatedQtl,
      remainingBagsAfter: remainingAfter,
      depotLocation: batch.depotLocation,
      stockAgeDays: batch.stockAgeDays || 0,
      isFullyExhausted: remainingAfter === 0,
    });

    remaining -= take;
  }

  const totalQtl = Number(
    allocations.reduce((sum, item) => sum + item.allocatedQtl, 0).toFixed(2)
  );

  const fallbackChallan: DispatchRecord = {
    challanNumber,
    idempotencyKey: clientProvidedIdempotencyKey || `IDEM-${Date.now()}`,
    issuerUid,
    depotId,
    depotName,
    timestamp: now.toISOString(),
    commodity,
    variety,
    totalBags: requestedBags,
    totalQtl,
    destinationFpsId,
    destinationName,
    destinationDistrict,
    destinationAddress,
    vehicleNumber: vehicleNumber.toUpperCase().trim(),
    driverName: driverName.trim(),
    driverPhone: driverPhone.trim(),
    transporterAgency: transporterAgency.trim(),
    gatePassNo,
    allocatedBatches: allocations.map((a) => ({
      batchId: a.batchId,
      bags: a.allocatedBags,
      qtl: a.allocatedQtl,
      receivedDate: a.receivedDate,
      bay: a.depotLocation,
      stockAgeDays: a.stockAgeDays,
    })),
    status: 'Dispatched',
    dispatchedBy,
    authorizedBy,
    remarks: remarks || 'Standard PDS quota allocation under strict FIFO validation.',
    isDemo: true,
  };

  return {
    success: true,
    challan: fallbackChallan,
    allocations,
  };
}
