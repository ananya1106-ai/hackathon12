import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Batch,
  DispatchRecord,
  AuditLog,
  AllocationItem,
  UserRole,
  FairPriceShop,
  CommodityType,
  BatchStatus,
  ReconciliationRecord,
  FifoException,
  ApprovalRequest,
  DeliveryTrackingRecord,
  ReturnDiscrepancyRecord,
  AnomalyAlert,
  DepotSettings,
  ApprovalRule,
  UserAccount,
  FifoPreviewResult,
  ExcludedBatchItem,
} from '../types';
import {
  INITIAL_BATCHES,
  INITIAL_DISPATCHES,
  INITIAL_AUDIT_LOGS,
  INITIAL_FAIR_PRICE_SHOPS,
  INITIAL_RECONCILIATIONS,
  INITIAL_FIFO_EXCEPTIONS,
  INITIAL_APPROVAL_REQUESTS,
  INITIAL_DELIVERY_TRACKING,
  INITIAL_RETURN_DISCREPANCIES,
  INITIAL_ANOMALIES,
  DEFAULT_DEPOT_SETTINGS,
  INITIAL_APPROVAL_RULES,
  calculateAgeDays,
  DEMO_USERS,
} from '../data/mockData';
import {
  auth,
  db,
  isFirebaseConfigured,
  missingConfigKeys,
  testFirestoreConnection,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  applyActionCode,
  reload,
  sendPasswordResetEmail,
  getActionCodeSettings,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  FirebaseConnectionStatus,
  SafeFirebaseDiagnostic,
  getSafeFirebaseDiagnostic,
} from '../lib/firebase';
import {
  batchesRepository,
  dispatchesRepository,
  auditLogsRepository,
  stockTransactionsRepository,
  commoditiesRepository,
  fairPriceShopsRepository,
  reconciliationsRepository,
  fifoExceptionsRepository,
  depotSettingsRepository,
  executeAtomicFifoTransaction,
} from '../repositories';

interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

interface AppContextType {
  // Data
  batches: Batch[];
  dispatches: DispatchRecord[];
  auditLogs: AuditLog[];
  fairPriceShops: FairPriceShop[];
  currentRole: UserRole;
  toasts: ToastNotification[];
  activeChallan: DispatchRecord | null;
  theme: 'light' | 'dark';

  // Authentication & Top-Level Page Navigation
  isAuthenticated: boolean;
  currentUser: UserAccount | null;
  activeView: 'landing' | 'auth' | 'app' | 'verify-email';
  setActiveView: (view: 'landing' | 'auth' | 'app' | 'verify-email') => void;
  preselectedAuthRole: UserRole | null;
  setPreselectedAuthRole: (role: UserRole | null) => void;
  navigateToAuthWithRole: (role: UserRole) => void;
  login: (credentials: { role: UserRole; email: string; password?: string }) => Promise<{ success: boolean; error?: string; errorCode?: string; verified?: boolean }>;
  signup: (credentials: { role: UserRole; name: string; email: string; password: string }) => Promise<{ success: boolean; error?: string; errorCode?: string; emailSent?: boolean }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Email Verification
  isEmailVerified: boolean;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  checkVerificationStatus: (silent?: boolean) => Promise<{ isVerified: boolean; error?: string }>;
  verificationState: { status: 'verifying' | 'success' | 'error' | null; error?: string } | null;

  // Safe Firebase Security Diagnostics
  lastAuthErrorCode: string | null;
  safeDiagnostic: SafeFirebaseDiagnostic;
  firebaseStatus: FirebaseConnectionStatus;
  runConnectionTest: () => Promise<FirebaseConnectionStatus>;

  // Extended Operational Data
  reconciliations: ReconciliationRecord[];
  fifoExceptions: FifoException[];
  approvalRequests: ApprovalRequest[];
  deliveryTracking: DeliveryTrackingRecord[];
  returnDiscrepancies: ReturnDiscrepancyRecord[];
  anomalies: AnomalyAlert[];
  depotSettings: DepotSettings;
  approvalRules: ApprovalRule[];

  // Theme
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Role
  setCurrentRole: (role: UserRole) => void;

  // Toast
  addToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Challan Preview
  setActiveChallan: (challan: DispatchRecord | null) => void;

  // FIFO Calculation
  calculateFifoPreview: (
    commodity: CommodityType,
    variety: string,
    requestedBags: number
  ) => FifoPreviewResult;

  // Actions
  executeDispatch: (params: {
    commodity: CommodityType;
    variety: string;
    requestedBags: number;
    destinationFpsId: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    transporterAgency: string;
    remarks?: string;
    idempotencyKey?: string;
  }) => Promise<{ success: boolean; challan?: DispatchRecord; error?: string }>;

  seedHackathonDemoData: () => Promise<{ success: boolean; count: number; error?: string }>;
  clearDemoInventory: () => Promise<{ success: boolean; error?: string }>;
  isSeedingDemo: boolean;

  addStockReceipt: (newBatch: Omit<Batch, 'id' | 'availableBags' | 'availableQtl' | 'totalReceivedQtl' | 'stockAgeDays' | 'movements'>) => {
    success: boolean;
    batchId?: string;
    error?: string;
  };

  updateBatchStatus: (
    batchId: string,
    newStatus: BatchStatus,
    reason: string
  ) => { success: boolean; error?: string };

  editBatchMetadata: (
    batchId: string,
    updates: { depotLocation?: string; notes?: string; moisturePercentage?: number }
  ) => { success: boolean; error?: string };

  // New Workflow Actions
  addReconciliation: (rec: Omit<ReconciliationRecord, 'id' | 'reconciledDate' | 'status'> & { varianceReason?: string }) => void;
  reviewReconciliation: (id: string, action: 'Approve' | 'Reject', notes: string) => void;
  requestFifoException: (params: {
    requestedCommodity: CommodityType;
    requestedVariety: string;
    requestedBags: number;
    skippedBatchId: string;
    allocatedBatchId: string;
    justificationReason: string;
  }) => { success: boolean; exceptionId?: string; error?: string };
  reviewFifoException: (id: string, decision: 'Approved' | 'Rejected', remarks: string) => void;
  reviewApprovalRequest: (id: string, decision: 'Approved' | 'Rejected', remarks: string) => void;
  updateDeliveryMilestone: (id: string, milestone: DeliveryTrackingRecord['currentMilestone'], note: string) => void;
  addReturnDiscrepancy: (item: Omit<ReturnDiscrepancyRecord, 'id' | 'reportDate' | 'status'> & { status?: ReturnDiscrepancyRecord['status'] }) => void;
  resolveAnomaly: (id: string, note: string) => void;
  updateDepotSettings: (newSettings: Partial<DepotSettings>) => void;
  toggleApprovalRule: (id: string) => void;

  resetDemoData: () => void;
}

const STORAGE_KEY_PREFIX = 'smartpds_v1_';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<Batch[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}batches`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return isFirebaseConfigured ? [] : INITIAL_BATCHES;
  });

  const [dispatches, setDispatches] = useState<DispatchRecord[]>(() => {
    if (isFirebaseConfigured) return [];
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}dispatches`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    if (isFirebaseConfigured) return [];
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}audit_logs`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  const [fairPriceShops, setFairPriceShops] = useState<FairPriceShop[]>(INITIAL_FAIR_PRICE_SHOPS);
  const [currentRole, setCurrentRole] = useState<UserRole>('Administrator');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [activeChallan, setActiveChallan] = useState<DispatchRecord | null>(null);

  // Top-Level App & Authentication State
  const [activeView, setActiveView] = useState<'landing' | 'auth' | 'app' | 'verify-email'>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [preselectedAuthRole, setPreselectedAuthRole] = useState<UserRole | null>(null);
  const [verificationState, setVerificationState] = useState<{
    status: 'verifying' | 'success' | 'error' | null;
    error?: string;
  } | null>(null);

  // Extended Operational Data States
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}reconciliations`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_RECONCILIATIONS;
  });

  const [fifoExceptions, setFifoExceptions] = useState<FifoException[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}fifo_exceptions`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_FIFO_EXCEPTIONS;
  });

  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}approval_requests`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_APPROVAL_REQUESTS;
  });

  const [deliveryTracking, setDeliveryTracking] = useState<DeliveryTrackingRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}delivery_tracking`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_DELIVERY_TRACKING;
  });

  const [returnDiscrepancies, setReturnDiscrepancies] = useState<ReturnDiscrepancyRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}return_discrepancies`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_RETURN_DISCREPANCIES;
  });

  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}anomalies`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_ANOMALIES;
  });

  const [depotSettings, setDepotSettings] = useState<DepotSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}depot_settings`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_DEPOT_SETTINGS;
  });

  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}approval_rules`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_APPROVAL_RULES;
  });

  // Theme Mode State with persistence (Default to Dark Navy theme on first visit)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('smartpds_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    } catch {
      // Fallback
    }
    return 'dark';
  });

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('smartpds_theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('smartpds_theme', next);
      } catch (e) {
        console.error('Failed to save theme to localStorage', e);
      }
      return next;
    });
  }, []);

  // Sync class 'dark' on <html> element instantly
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}batches`, JSON.stringify(batches));
    } catch (err) {
      console.error('Failed to save batches to localStorage', err);
    }
  }, [batches]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}dispatches`, JSON.stringify(dispatches));
    } catch (err) {
      console.error('Failed to save dispatches to localStorage', err);
    }
  }, [dispatches]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}audit_logs`, JSON.stringify(auditLogs));
    } catch (err) {
      console.error('Failed to save auditLogs to localStorage', err);
    }
  }, [auditLogs]);

  // Synchronize with Cloud Firestore repositories when Firebase is configured
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    // Load persisted depot settings if present
    depotSettingsRepository.getSettings().then((settings) => {
      if (settings) setDepotSettings(settings);
    }).catch((err) => console.warn('[SmartPDS]: Depot settings fetch note:', err));

    const unsubBatches = batchesRepository.subscribe(
      (remoteBatches) => {
        setBatches(remoteBatches || []);
      },
      (err) => console.warn('[SmartPDS]: Batches Firestore sync note:', err)
    );

    const unsubDispatches = dispatchesRepository.subscribe(
      (remoteDispatches) => {
        setDispatches(remoteDispatches || []);
      },
      (err) => console.warn('[SmartPDS]: Dispatches Firestore sync note:', err)
    );

    const unsubAudit = auditLogsRepository.subscribe(
      (remoteLogs) => {
        setAuditLogs(remoteLogs || []);
      },
      (err) => console.warn('[SmartPDS]: Audit logs Firestore sync note:', err)
    );

    const unsubShops = fairPriceShopsRepository.subscribe(
      (remoteShops) => {
        if (remoteShops && remoteShops.length > 0) {
          setFairPriceShops(remoteShops);
        }
      },
      (err) => console.warn('[SmartPDS]: FairPriceShops Firestore sync note:', err)
    );

    const unsubReconciliations = reconciliationsRepository.subscribe(
      (remoteRecs) => {
        if (remoteRecs && remoteRecs.length > 0) {
          setReconciliations(remoteRecs);
        }
      },
      (err) => console.warn('[SmartPDS]: Reconciliations Firestore sync note:', err)
    );

    const unsubExceptions = fifoExceptionsRepository.subscribe(
      (remoteExcs) => {
        if (remoteExcs && remoteExcs.length > 0) {
          setFifoExceptions(remoteExcs);
        }
      },
      (err) => console.warn('[SmartPDS]: FIFO Exceptions Firestore sync note:', err)
    );

    return () => {
      unsubBatches();
      unsubDispatches();
      unsubAudit();
      unsubShops();
      unsubReconciliations();
      unsubExceptions();
    };
  }, []);

  const addToast = useCallback((type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message, timestamp: Date.now() }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [isSeedingDemo, setIsSeedingDemo] = useState<boolean>(false);

  // Strict FIFO Allocation Calculation (Deterministic, Oldest First, Excludes Damaged, Quarantined & Expired)
  const calculateFifoPreview = useCallback(
    (commodity: CommodityType, variety: string, requestedBags: number): FifoPreviewResult => {
      const excludedBatches: ExcludedBatchItem[] = [];
      const eligibleBatches: Batch[] = [];

      const nowTime = Date.now();
      for (const b of batches) {
        if (b.commodity !== commodity) {
          excludedBatches.push({
            batch: b,
            category: 'DIFF_COMMODITY',
            reason: `Commodity mismatch: batch is ${b.commodity}, requested ${commodity}`,
          });
          continue;
        }

        if (variety !== 'ALL' && b.variety !== variety) {
          excludedBatches.push({
            batch: b,
            category: 'DIFF_VARIETY',
            reason: `Variety mismatch: batch is ${b.variety}, requested ${variety}`,
          });
          continue;
        }

        if (b.status === 'Quarantined') {
          excludedBatches.push({
            batch: b,
            category: 'QUARANTINED',
            reason: `Quarantine hold: ${b.statusReason || 'Moisture/inspection clearance pending'}`,
          });
          continue;
        }

        if (b.status === 'Damaged') {
          excludedBatches.push({
            batch: b,
            category: 'DAMAGED',
            reason: `Physical damage / spoiled: ${b.statusReason || 'Declared unfit for PDS distribution'}`,
          });
          continue;
        }

        if (b.status === 'Exhausted' || b.availableBags <= 0) {
          excludedBatches.push({
            batch: b,
            category: 'EXHAUSTED',
            reason: 'Lot exhausted: 0 available bags remaining in stack',
          });
          continue;
        }

        if (b.expiryDate && new Date(b.expiryDate).getTime() < nowTime) {
          excludedBatches.push({
            batch: b,
            category: 'EXPIRED',
            reason: `Expired lot: reached expiration limit on ${b.expiryDate}`,
          });
          continue;
        }

        if (b.status !== 'Eligible') {
          excludedBatches.push({
            batch: b,
            category: 'OTHER',
            reason: `Status restricted: currently marked as ${b.status}`,
          });
          continue;
        }

        eligibleBatches.push(b);
      }

      // Sort strictly by receivedDate ASC (Oldest first) with deterministic tie-breaker
      const sortedBatches = [...eligibleBatches].sort((a, b) => {
        const dateA = new Date(a.receivedDate).getTime();
        const dateB = new Date(b.receivedDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return a.id.localeCompare(b.id);
      });

      const totalEligibleAvailableBags = sortedBatches.reduce((acc, b) => acc + b.availableBags, 0);
      const shortageBags = Math.max(0, requestedBags - totalEligibleAvailableBags);

      if (requestedBags <= 0) {
        return {
          success: false,
          error: 'Requested quantity must be at least 1 bag.',
          commodity,
          variety,
          requestedBags: 0,
          totalEligibleAvailableBags,
          shortageBags: 0,
          allocations: [],
          allEligibleBatches: sortedBatches,
          excludedBatches,
        };
      }

      if (shortageBags > 0) {
        return {
          success: false,
          error: `Insufficient eligible stock. Requested ${requestedBags} bags, but only ${totalEligibleAvailableBags} eligible bags are available in depot (Shortfall: ${shortageBags} bags).`,
          commodity,
          variety,
          requestedBags,
          totalEligibleAvailableBags,
          shortageBags,
          allocations: [],
          allEligibleBatches: sortedBatches,
          excludedBatches,
        };
      }

      let remainingToAllocate = requestedBags;
      const allocations: AllocationItem[] = [];

      for (const batch of sortedBatches) {
        if (remainingToAllocate <= 0) break;

        const takeBags = Math.min(batch.availableBags, remainingToAllocate);
        const allocatedQtl = Number(((takeBags * batch.bagWeightKg) / 100).toFixed(2));
        const remainingBagsAfter = batch.availableBags - takeBags;

        allocations.push({
          batchId: batch.id,
          commodity: batch.commodity,
          variety: batch.variety,
          receivedDate: batch.receivedDate,
          availableBags: batch.availableBags,
          allocatedBags: takeBags,
          allocatedQtl,
          remainingBagsAfter,
          depotLocation: batch.depotLocation,
          stockAgeDays: batch.stockAgeDays || 0,
          isFullyExhausted: remainingBagsAfter === 0,
        });

        remainingToAllocate -= takeBags;
      }

      return {
        success: true,
        commodity,
        variety,
        requestedBags,
        totalEligibleAvailableBags,
        shortageBags: 0,
        allocations,
        allEligibleBatches: sortedBatches,
        excludedBatches,
      };
    },
    [batches]
  );

  // Execute Dispatch with Atomic ACID Firestore Transaction & Double-Deduction Protection
  const executeDispatch = useCallback(
    async (params: {
      commodity: CommodityType;
      variety: string;
      requestedBags: number;
      destinationFpsId: string;
      vehicleNumber: string;
      driverName: string;
      driverPhone: string;
      transporterAgency: string;
      remarks?: string;
      idempotencyKey?: string;
    }): Promise<{ success: boolean; challan?: DispatchRecord; error?: string }> => {
      // 1. Role Authorization Check: Dealers strictly blocked
      if (currentRole === 'Ration Shop Dealer') {
        addToast(
          'error',
          'Permission Denied',
          'Ration Shop Dealers hold recipient privileges and cannot authorize depot dispatches.'
        );
        return { success: false, error: 'Permission denied: Ration Shop Dealers hold recipient privileges only.' };
      }

      const fps = fairPriceShops.find((f) => f.id === params.destinationFpsId);
      if (!fps) {
        addToast('error', 'Invalid Destination', 'Selected Fair Price Shop was not found.');
        return { success: false, error: 'Invalid destination Fair Price Shop.' };
      }

      const preview = calculateFifoPreview(params.commodity, params.variety, params.requestedBags);
      if (!preview.success || preview.allocations.length === 0) {
        addToast('error', 'Allocation Failed', preview.error || 'Could not allocate required quantity.');
        return { success: false, error: preview.error };
      }

      const dispatchedBy = `${currentRole === 'Administrator' ? 'Sunil K. Verma' : 'Rajesh V.'} (${currentRole})`;
      const authorizedBy = currentRole === 'Administrator' ? 'Sunil K. Verma (Administrator)' : 'Rajesh V. (Warehouse Operator)';

      // 2. Execute Atomic ACID Transaction
      const transactionResult = await executeAtomicFifoTransaction({
        commodity: params.commodity,
        variety: params.variety,
        requestedBags: params.requestedBags,
        destinationFpsId: fps.id,
        destinationName: fps.name,
        destinationDistrict: fps.district,
        destinationAddress: `${fps.taluk}, ${fps.district} District, Karnataka`,
        vehicleNumber: params.vehicleNumber,
        driverName: params.driverName,
        driverPhone: params.driverPhone,
        transporterAgency: params.transporterAgency,
        dispatchedBy,
        authorizedBy,
        role: currentRole,
        issuerUid: currentUser?.id,
        depotId: depotSettings?.depotCode || 'DEP-HUB-04',
        depotName: depotSettings?.depotName || 'FCI District Base Depot #4, Hubballi',
        idempotencyKey: params.idempotencyKey,
        remarks: params.remarks,
        eligibleBatchesList: batches,
      });

      if (!transactionResult.success || !transactionResult.challan) {
        addToast('error', 'FIFO Transaction Failed', transactionResult.error || 'Atomic stock deduction failed.');
        return { success: false, error: transactionResult.error };
      }

      const committedChallan = transactionResult.challan;
      const committedAllocations = transactionResult.allocations || preview.allocations;

      // 3. Atomically update local cache state with committed transaction results
      setBatches((prevBatches) =>
        prevBatches.map((b) => {
          const allocation = committedAllocations.find((a) => a.batchId === b.id);
          if (!allocation) return b;

          const remainingBags = Math.max(0, b.availableBags - allocation.allocatedBags);
          const remainingQtl = Number(((remainingBags * b.bagWeightKg) / 100).toFixed(2));
          const newStatus: BatchStatus = remainingBags <= 0 ? 'Exhausted' : b.status;

          const newMovement = {
            id: `MOV-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            date: new Date().toISOString().split('T')[0],
            action: 'DISPATCH' as const,
            quantityBags: allocation.allocatedBags,
            quantityQtl: allocation.allocatedQtl,
            referenceId: committedChallan.challanNumber,
            user: `${currentRole}`,
            notes: `Dispatched ${allocation.allocatedBags} bags to ${fps.name} via Gate Pass ${committedChallan.gatePassNo}`,
          };

          return {
            ...b,
            availableBags: remainingBags,
            availableQtl: remainingQtl,
            status: newStatus,
            movements: [newMovement, ...(b.movements || [])],
          };
        })
      );

      // Append committed challan
      setDispatches((prev) => [committedChallan, ...prev]);

      // Append immutable audit log to local state
      const newAudit: AuditLog = {
        id: `AUD-${committedChallan.challanNumber}`,
        timestamp: new Date().toISOString(),
        user: dispatchedBy,
        role: currentRole,
        action: 'FIFO_DISPATCH',
        entity: 'DISPATCH',
        referenceId: committedChallan.challanNumber,
        result: 'SUCCESS',
        details: `Dispatched ${params.requestedBags} bags (${committedChallan.totalQtl} Qtl) of ${params.commodity} (${params.variety}) to ${fps.name}. FIFO batches allocated: ${committedAllocations
          .map((a) => `${a.batchId} (${a.allocatedBags} bags)`)
          .join(', ')}.`,
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      // Set active challan for instant modal/preview
      setActiveChallan(committedChallan);

      addToast(
        'success',
        'Dispatch Authorized & Confirmed',
        `Challan ${committedChallan.challanNumber} issued. ${params.requestedBags} bags deducted atomically under strict FIFO rules.`
      );

      return { success: true, challan: committedChallan };
    },
    [batches, calculateFifoPreview, currentRole, fairPriceShops, addToast]
  );

  // Explicit Hackathon Demo Data Seeding (Safe, labelled with isDemo: true, never overwrites silent prod)
  const seedHackathonDemoData = useCallback(async (): Promise<{ success: boolean; count: number; error?: string }> => {
    setIsSeedingDemo(true);
    try {
      const demoBatchesWithFlag: Batch[] = INITIAL_BATCHES.map((b) => ({
        ...b,
        isDemo: true,
      }));

      // Seed batches into Firestore if configured
      if (isFirebaseConfigured) {
        for (const b of demoBatchesWithFlag) {
          await setDoc(doc(db, 'batches', b.id), {
            ...b,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        // Also seed fair price shops so dispatch destinations exist
        for (const shop of INITIAL_FAIR_PRICE_SHOPS) {
          await setDoc(doc(db, 'fair_price_shops', shop.id), {
            ...shop,
            createdAt: serverTimestamp(),
          });
        }

        // Record seed event in audit logs
        const auditRef = doc(db, 'audit_logs', `AUD-DEMO-SEED-${Date.now()}`);
        await setDoc(auditRef, {
          id: `AUD-DEMO-SEED-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: `${currentRole === 'Administrator' ? 'Sunil K. Verma' : 'Rajesh V.'}`,
          role: currentRole,
          action: 'DEMO_SEED',
          entity: 'BATCH',
          referenceId: 'TECHTRIX-DEMO-2026',
          result: 'SUCCESS',
          details: `Explicitly seeded ${demoBatchesWithFlag.length} disposable test batches and 5 FPS network nodes for TechTrix'26 evaluation.`,
          createdAt: serverTimestamp(),
        });
      }

      setBatches(demoBatchesWithFlag);
      setFairPriceShops(INITIAL_FAIR_PRICE_SHOPS);
      addToast(
        'success',
        'Demo Data Seeded',
        `Successfully seeded ${demoBatchesWithFlag.length} hackathon test batches into inventory (marked as Demo Fixtures).`
      );
      return { success: true, count: demoBatchesWithFlag.length };
    } catch (err: any) {
      console.error('[SmartPDS]: Demo seed error:', err);
      addToast('error', 'Demo Seeding Failed', err?.message || 'Could not seed demo records to Firestore.');
      return { success: false, count: 0, error: err?.message };
    } finally {
      setIsSeedingDemo(false);
    }
  }, [currentRole, addToast]);

  // Clear disposable demo inventory
  const clearDemoInventory = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsSeedingDemo(true);
    try {
      if (isFirebaseConfigured) {
        for (const b of INITIAL_BATCHES) {
          try {
            await batchesRepository.deleteBatch(b.id);
          } catch {
            // continue
          }
        }
      }
      setBatches([]);
      addToast('info', 'Demo Inventory Cleared', 'All disposable test batches have been removed from inventory.');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    } finally {
      setIsSeedingDemo(false);
    }
  }, [addToast]);

  // Inward Stock Receipt
  const addStockReceipt = useCallback(
    (
      newBatchData: Omit<
        Batch,
        'id' | 'availableBags' | 'availableQtl' | 'totalReceivedQtl' | 'stockAgeDays' | 'movements'
      >
    ) => {
      if (currentRole === 'Ration Shop Dealer') {
        addToast('error', 'Action Restricted', 'Ration Shop Dealers hold recipient privileges and cannot record inward stock receipts.');
        return { success: false, error: 'Recipient role cannot log depot receipts.' };
      }

      const randomNum = Math.floor(100 + Math.random() * 900);
      const prefix = newBatchData.commodity === 'Rice' ? 'RC' : newBatchData.commodity === 'Wheat' ? 'WT' : 'CM';
      const batchId = `BATCH-${prefix}-2026-${randomNum}`;

      const totalReceivedQtl = Number(((newBatchData.initialBags * newBatchData.bagWeightKg) / 100).toFixed(2));
      const ageDays = calculateAgeDays(newBatchData.receivedDate);

      const newBatch: Batch = {
        ...newBatchData,
        id: batchId,
        availableBags: newBatchData.initialBags,
        totalReceivedQtl,
        availableQtl: totalReceivedQtl,
        stockAgeDays: ageDays,
        movements: [
          {
            id: `MOV-INW-${Date.now()}`,
            date: newBatchData.receivedDate,
            action: 'RECEIPT',
            quantityBags: newBatchData.initialBags,
            quantityQtl: totalReceivedQtl,
            referenceId: `INW-${Date.now().toString().slice(-4)}`,
            user: currentRole,
            notes: `Inward receipt from ${newBatchData.supplierSource}. Quality grade: ${newBatchData.qualityInspectionGrade}, Moisture: ${newBatchData.moisturePercentage}%.`,
          },
        ],
      };

      setBatches((prev) => [newBatch, ...prev]);

      const newAudit: AuditLog = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentRole === 'Administrator' ? 'Sunil K. Verma' : 'Rajesh V.',
        role: currentRole,
        action: 'STOCK_RECEIPT',
        entity: 'BATCH',
        referenceId: batchId,
        result: 'SUCCESS',
        details: `Recorded inward receipt of ${newBatchData.initialBags} bags (${totalReceivedQtl} Qtl) ${newBatchData.commodity} (${newBatchData.variety}) into ${newBatchData.depotLocation}.`,
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      if (isFirebaseConfigured) {
        batchesRepository.addBatch(newBatch).catch(console.warn);
        auditLogsRepository.addLog(newAudit).catch(console.warn);
        stockTransactionsRepository
          .recordTransaction({
            id: `TX-INW-${batchId}`,
            timestamp: new Date().toISOString(),
            date: newBatchData.receivedDate,
            action: 'RECEIPT',
            batchId,
            commodity: newBatchData.commodity,
            variety: newBatchData.variety,
            quantityBags: newBatchData.initialBags,
            quantityQtl: totalReceivedQtl,
            referenceId: batchId,
            user: String(currentRole),
            notes: `Inward intake from ${newBatchData.supplierSource}`,
            depotLocation: newBatchData.depotLocation,
          })
          .catch(console.warn);
      }

      addToast(
        'success',
        'Stock Receipt Logged',
        `New batch ${batchId} added with ${newBatchData.initialBags} bags (${totalReceivedQtl} Qtl).`
      );

      return { success: true, batchId };
    },
    [currentRole, addToast]
  );

  // Update Batch Status (e.g. Quarantining or marking Damaged)
  const updateBatchStatus = useCallback(
    (batchId: string, newStatus: BatchStatus, reason: string) => {
      if (currentRole === 'Ration Shop Dealer') {
        addToast('error', 'Role Restriction', 'Ration Shop Dealers hold recipient privileges and cannot alter depot batch status.');
        return { success: false, error: 'Ration Shop Dealers lack authorization to alter batch status.' };
      }

      let updatedBatch: Batch | null = null;

      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b;
          updatedBatch = {
            ...b,
            status: newStatus,
            statusReason: reason,
            movements: [
              {
                id: `MOV-ST-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                action: 'STATUS_CHANGE',
                quantityBags: b.availableBags,
                quantityQtl: b.availableQtl,
                referenceId: `STAT-CHG-${batchId}`,
                user: currentRole,
                notes: `Status changed from ${b.status} to ${newStatus}. Reason: ${reason}`,
              },
              ...b.movements,
            ],
          };
          return updatedBatch;
        })
      );

      const newAudit: AuditLog = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentRole === 'Administrator' ? 'Sunil K. Verma' : 'Rajesh V.',
        role: currentRole,
        action: 'STATUS_CHANGE',
        entity: 'BATCH',
        referenceId: batchId,
        result: newStatus === 'Eligible' ? 'SUCCESS' : 'WARNING',
        details: `Status altered to [${newStatus}]. Rationale: ${reason}. FIFO engine updated accordingly.`,
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      if (isFirebaseConfigured) {
        batchesRepository.updateBatchStatus(batchId, newStatus, reason, String(currentRole)).catch(console.warn);
        auditLogsRepository.addLog(newAudit).catch(console.warn);
      }

      addToast(
        newStatus === 'Eligible' ? 'success' : 'warning',
        'Batch Status Updated',
        `Batch ${batchId} marked as ${newStatus}. FIFO allocation eligibility recalculated.`
      );

      return { success: true };
    },
    [currentRole, addToast]
  );

  // Edit batch location or notes
  const editBatchMetadata = useCallback(
    (
      batchId: string,
      updates: { depotLocation?: string; notes?: string; moisturePercentage?: number }
    ) => {
      if (currentRole === 'Ration Shop Dealer') {
        addToast('error', 'Read-Only Mode', 'Ration Shop Dealers hold recipient privileges and cannot alter depot batch metadata.');
        return { success: false, error: 'Read-only mode' };
      }

      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== batchId) return b;
          return {
            ...b,
            depotLocation: updates.depotLocation ?? b.depotLocation,
            notes: updates.notes ?? b.notes,
            moisturePercentage: updates.moisturePercentage ?? b.moisturePercentage,
          };
        })
      );

      const newAudit: AuditLog = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentRole === 'Administrator' ? 'Sunil K. Verma' : 'Rajesh V.',
        role: currentRole,
        action: 'BATCH_UPDATE',
        entity: 'BATCH',
        referenceId: batchId,
        result: 'SUCCESS',
        details: `Updated metadata for batch ${batchId}. Location: ${updates.depotLocation || 'unchanged'}, Moisture: ${updates.moisturePercentage ?? 'unchanged'}%.`,
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      if (isFirebaseConfigured) {
        batchesRepository.updateBatchMetadata(batchId, updates).catch(console.warn);
        auditLogsRepository.addLog(newAudit).catch(console.warn);
      }

      addToast('info', 'Batch Updated', `Metadata saved for batch ${batchId}.`);
      return { success: true };
    },
    [currentRole, addToast]
  );

  // Workflow Handlers
  const addReconciliation = useCallback(
    (rec: Omit<ReconciliationRecord, 'id' | 'reconciledDate' | 'status'> & { varianceReason?: string }) => {
      const newRec: ReconciliationRecord = {
        id: `REC-${Date.now()}`,
        reconciledDate: new Date().toISOString().split('T')[0],
        status: rec.varianceBags === 0 ? 'Reconciled' : 'Pending Approval',
        ...rec,
      };

      setReconciliations((prev) => [newRec, ...prev]);

      const newAudit: AuditLog = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentRole === 'Administrator' ? 'Sunil K. Verma' : currentRole === 'Warehouse Operator' ? 'Rajesh V.' : 'Shankar Gowda',
        role: currentRole,
        action: 'RECONCILIATION',
        entity: 'BATCH',
        referenceId: rec.batchId,
        result: rec.varianceBags === 0 ? 'SUCCESS' : 'WARNING',
        details: `Physical count for ${rec.batchId} (${rec.commodity}): system ${rec.systemBags} vs physical ${rec.physicalCountedBags} bags (variance: ${rec.varianceBags} bags).`,
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      if (rec.varianceBags !== 0) {
        // Create an approval request for manager
        const newApr: ApprovalRequest = {
          id: `APR-${Date.now()}`,
          type: 'STOCK_ADJUSTMENT',
          title: `Stock Count Discrepancy (${rec.varianceBags} Bags ${rec.commodity})`,
          requestedBy: currentRole === 'Administrator' ? 'Sunil K. Verma' : currentRole === 'Warehouse Operator' ? 'Rajesh V.' : 'Shankar Gowda',
          requestedRole: currentRole,
          requestedDate: new Date().toISOString(),
          status: 'Pending',
          details: `Reconciliation ${newRec.id} reported physical variance of ${rec.varianceBags} bags for batch ${rec.batchId}. ${rec.varianceReason || ''}`,
          impact: `${rec.varianceBags} bags (${rec.varianceQtl} Qtl) ledger adjustment required.`,
          referenceId: newRec.id,
        };
        setApprovalRequests((prev) => [newApr, ...prev]);
      }

      if (isFirebaseConfigured) {
        reconciliationsRepository.addReconciliation(newRec).catch(console.warn);
        auditLogsRepository.addLog(newAudit).catch(console.warn);
      }

      addToast(
        rec.varianceBags === 0 ? 'success' : 'warning',
        rec.varianceBags === 0 ? 'Physical Count Tallied' : 'Discrepancy Logged',
        rec.varianceBags === 0
          ? `Batch ${rec.batchId} 100% matched system records.`
          : `Variance of ${rec.varianceBags} bags submitted for Manager authorization.`
      );
    },
    [currentRole, addToast]
  );

  const reviewReconciliation = useCallback(
    (id: string, action: 'Approve' | 'Reject', notes: string) => {
      setReconciliations((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            return {
              ...r,
              status: action === 'Approve' ? 'Adjusted' : 'Discrepancy',
              varianceReason: notes || r.varianceReason,
            };
          }
          return r;
        })
      );

      // If approved, adjust the batch bag count
      const target = reconciliations.find((r) => r.id === id);
      if (action === 'Approve' && target && target.varianceBags !== 0) {
        setBatches((prev) =>
          prev.map((b) => {
            if (b.id === target.batchId) {
              const adjustedBags = Math.max(0, b.availableBags + target.varianceBags);
              const adjustedQtl = Number(((adjustedBags * b.bagWeightKg) / 100).toFixed(2));
              return {
                ...b,
                availableBags: adjustedBags,
                availableQtl: adjustedQtl,
                movements: [
                  {
                    id: `MOV-ADJ-${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    action: 'ADJUSTMENT',
                    quantityBags: Math.abs(target.varianceBags),
                    quantityQtl: Math.abs(target.varianceQtl),
                    referenceId: target.id,
                    user: currentRole,
                    notes: `Physical reconciliation adjustment approved. ${notes}`,
                  },
                  ...b.movements,
                ],
              };
            }
            return b;
          })
        );

        if (isFirebaseConfigured && target) {
          const targetBatch = batches.find((b) => b.id === target.batchId);
          if (targetBatch) {
            const adjustedBags = Math.max(0, targetBatch.availableBags + target.varianceBags);
            batchesRepository.updateBatchMetadata(target.batchId, {}).catch(console.warn);
          }
        }
      }

      const newAudit: AuditLog = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentRole,
        role: currentRole,
        action: 'APPROVAL',
        entity: 'RECONCILIATION',
        referenceId: id,
        result: action === 'Approve' ? 'SUCCESS' : 'REJECTED',
        details: `Reconciliation ${id} ${action === 'Approve' ? 'Approved & stock adjusted' : 'Rejected'}. Notes: ${notes}`,
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      if (isFirebaseConfigured) {
        reconciliationsRepository
          .updateReconciliation(id, {
            status: action === 'Approve' ? 'Adjusted' : 'Discrepancy',
            varianceReason: notes || target?.varianceReason,
          })
          .catch(console.warn);
        auditLogsRepository.addLog(newAudit).catch(console.warn);
      }

      addToast('info', `Reconciliation ${action}d`, `Record ${id} marked as ${action === 'Approve' ? 'Adjusted' : 'Discrepancy'}.`);
    },
    [reconciliations, batches, currentRole, addToast]
  );

  const requestFifoException = useCallback(
    (params: {
      requestedCommodity: CommodityType;
      requestedVariety: string;
      requestedBags: number;
      skippedBatchId: string;
      allocatedBatchId: string;
      justificationReason: string;
    }) => {
      const skippedBatch = batches.find((b) => b.id === params.skippedBatchId);
      const allocatedBatch = batches.find((b) => b.id === params.allocatedBatchId);

      const newException: FifoException = {
        id: `EXC-${Date.now()}`,
        timestamp: new Date().toISOString(),
        requestedCommodity: params.requestedCommodity,
        requestedVariety: params.requestedVariety,
        requestedBags: params.requestedBags,
        skippedBatchId: params.skippedBatchId,
        skippedBatchAgeDays: skippedBatch?.stockAgeDays ?? 0,
        allocatedBatchId: params.allocatedBatchId,
        allocatedBatchAgeDays: allocatedBatch?.stockAgeDays ?? 0,
        justificationReason: params.justificationReason,
        requestedBy: currentRole === 'Administrator' ? 'Sunil K. Verma' : currentRole === 'Warehouse Operator' ? 'Rajesh V.' : 'Shankar Gowda',
        status: 'Pending Approval',
      };

      setFifoExceptions((prev) => [newException, ...prev]);

      // Create an approval request
      const newApr: ApprovalRequest = {
        id: `APR-${Date.now()}`,
        type: 'FIFO_EXCEPTION',
        title: `FIFO Override: Bypass ${params.skippedBatchId} for ${params.allocatedBatchId}`,
        requestedBy: newException.requestedBy,
        requestedRole: currentRole,
        requestedDate: new Date().toISOString(),
        status: 'Pending',
        details: params.justificationReason,
        impact: `Bypasses older batch (${skippedBatch?.stockAgeDays}d) for newer batch (${allocatedBatch?.stockAgeDays}d) for ${params.requestedBags} bags.`,
        referenceId: newException.id,
      };
      setApprovalRequests((prev) => [newApr, ...prev]);

      const newAudit: AuditLog = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: newException.requestedBy,
        role: currentRole,
        action: 'FIFO_EXCEPTION',
        entity: 'DISPATCH',
        referenceId: newException.id,
        result: 'WARNING',
        details: `FIFO Exception logged: ${params.justificationReason}. Bypassing batch ${params.skippedBatchId}.`,
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      if (isFirebaseConfigured) {
        fifoExceptionsRepository.addException(newException).catch(console.warn);
        auditLogsRepository.addLog(newAudit).catch(console.warn);
      }

      addToast('warning', 'FIFO Exception Logged', `Exception ${newException.id} submitted for Manager digital sign-off.`);
      return { success: true, exceptionId: newException.id };
    },
    [batches, currentRole, addToast]
  );

  const reviewFifoException = useCallback(
    (id: string, decision: 'Approved' | 'Rejected', remarks: string) => {
      setFifoExceptions((prev) =>
        prev.map((e) => {
          if (e.id === id) {
            return {
              ...e,
              status: decision,
              approvedBy: `${currentRole === 'Administrator' ? 'Sunil K. Verma' : 'Rajesh V.'} (${currentRole})`,
              approvalRemarks: remarks,
            };
          }
          return e;
        })
      );

      setApprovalRequests((prev) =>
        prev.map((a) => {
          if (a.referenceId === id) {
            return {
              ...a,
              status: decision,
              reviewedBy: currentRole,
              reviewedDate: new Date().toISOString(),
              remarks,
            };
          }
          return a;
        })
      );

      const newAudit: AuditLog = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentRole,
        role: currentRole,
        action: 'APPROVAL',
        entity: 'FIFO_EXCEPTION',
        referenceId: id,
        result: decision === 'Approved' ? 'SUCCESS' : 'REJECTED',
        details: `FIFO Exception ${id} ${decision.toLowerCase()} by ${currentRole}. Remarks: ${remarks}`,
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      if (isFirebaseConfigured) {
        fifoExceptionsRepository
          .updateException(id, {
            status: decision,
            approvedBy: `${currentRole === 'Administrator' ? 'Sunil K. Verma' : 'Rajesh V.'} (${currentRole})`,
            approvalRemarks: remarks,
          })
          .catch(console.warn);
        auditLogsRepository.addLog(newAudit).catch(console.warn);
      }

      addToast(decision === 'Approved' ? 'success' : 'error', `Exception ${decision}`, `FIFO override ${id} has been ${decision.toLowerCase()}.`);
    },
    [currentRole, addToast]
  );

  const reviewApprovalRequest = useCallback(
    (id: string, decision: 'Approved' | 'Rejected', remarks: string) => {
      const target = approvalRequests.find((a) => a.id === id);
      if (target?.type === 'FIFO_EXCEPTION') {
        reviewFifoException(target.referenceId, decision, remarks);
        return;
      }
      if (target?.type === 'STOCK_ADJUSTMENT') {
        reviewReconciliation(target.referenceId, decision === 'Approved' ? 'Approve' : 'Reject', remarks);
        return;
      }

      setApprovalRequests((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              status: decision,
              reviewedBy: currentRole,
              reviewedDate: new Date().toISOString(),
              remarks,
            };
          }
          return a;
        })
      );

      addToast('info', `Request ${decision}`, `Approval request ${id} updated.`);
    },
    [approvalRequests, currentRole, reviewFifoException, reviewReconciliation, addToast]
  );

  const updateDeliveryMilestone = useCallback(
    (id: string, milestone: DeliveryTrackingRecord['currentMilestone'], note: string) => {
      setDeliveryTracking((prev) =>
        prev.map((trk) => {
          if (trk.id === id) {
            const isDelivered = milestone === 'Delivered Verified' || milestone === 'Inspected & Unloaded';
            return {
              ...trk,
              currentMilestone: milestone,
              status: isDelivered ? 'Delivered' : trk.status,
              otpVerified: isDelivered ? true : trk.otpVerified,
              transitUpdates: [
                {
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  location: trk.destinationFps,
                  statusNote: note || `Milestone updated to ${milestone}`,
                },
                ...trk.transitUpdates,
              ],
            };
          }
          return trk;
        })
      );

      addToast('success', 'Transit Updated', `Delivery ${id} milestone set to "${milestone}".`);
    },
    [addToast]
  );

  const addReturnDiscrepancy = useCallback(
    (item: Omit<ReturnDiscrepancyRecord, 'id' | 'reportDate' | 'status'> & { status?: ReturnDiscrepancyRecord['status'] }) => {
      const newRet: ReturnDiscrepancyRecord = {
        id: `RET-${Date.now()}`,
        reportDate: new Date().toISOString().split('T')[0],
        status: item.status || 'Logged',
        ...item,
      };

      setReturnDiscrepancies((prev) => [newRet, ...prev]);

      const newAudit: AuditLog = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentRole,
        role: currentRole,
        action: 'RETURN_LOGGED',
        entity: 'DISPATCH',
        referenceId: item.challanNumber,
        result: 'WARNING',
        details: `Return/Discrepancy logged for ${item.challanNumber}: ${item.damagedBags} damaged bags, ${item.shortageWeightKg} kg shortage (${item.discrepancyType}).`,
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      addToast('warning', 'Discrepancy Recorded', `Filed return record ${newRet.id} for Challan ${item.challanNumber}.`);
    },
    [currentRole, addToast]
  );

  const resolveAnomaly = useCallback(
    (id: string, note: string) => {
      setAnomalies((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              status: 'Resolved',
              actionRecommended: `Resolved: ${note}`,
            };
          }
          return a;
        })
      );
      addToast('success', 'Anomaly Resolved', `Alert ${id} cleared from active watchlist.`);
    },
    [addToast]
  );

  const updateDepotSettings = useCallback(
    (newSettings: Partial<DepotSettings>) => {
      setDepotSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        try {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}depot_settings`, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      if (isFirebaseConfigured) {
        depotSettingsRepository.saveSettings(newSettings).catch(console.warn);
      }

      addToast('success', 'Depot Settings Saved', 'Operational thresholds and parameters updated.');
    },
    [addToast]
  );

  const toggleApprovalRule = useCallback(
    (id: string) => {
      setApprovalRules((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            return { ...r, isActive: !r.isActive };
          }
          return r;
        })
      );
      addToast('info', 'Rule Toggled', `Rule ${id} status updated.`);
    },
    [addToast]
  );

  // Reset to Demo Data
  const resetDemoData = useCallback(() => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}batches`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}dispatches`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}audit_logs`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}reconciliations`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}fifo_exceptions`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}approval_requests`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}delivery_tracking`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}return_discrepancies`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}anomalies`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}depot_settings`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}approval_rules`);

    setBatches(INITIAL_BATCHES);
    setDispatches(INITIAL_DISPATCHES);
    setReconciliations(INITIAL_RECONCILIATIONS);
    setFifoExceptions(INITIAL_FIFO_EXCEPTIONS);
    setApprovalRequests(INITIAL_APPROVAL_REQUESTS);
    setDeliveryTracking(INITIAL_DELIVERY_TRACKING);
    setReturnDiscrepancies(INITIAL_RETURN_DISCREPANCIES);
    setAnomalies(INITIAL_ANOMALIES);
    setDepotSettings(DEFAULT_DEPOT_SETTINGS);
    setApprovalRules(INITIAL_APPROVAL_RULES);

    const resetAudit: AuditLog = {
      id: `AUD-RESET-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Sunil K. Verma',
      role: 'Administrator',
      action: 'DEMO_RESET',
      entity: 'SYSTEM',
      referenceId: 'DEMO-DATA-RESET',
      result: 'SUCCESS',
      details: 'All batch registers, dispatch challans, and stock tallies restored to pristine hackathon demo dataset.',
    };
    setAuditLogs([resetAudit, ...INITIAL_AUDIT_LOGS]);
    setActiveChallan(null);

    addToast('info', 'Demo Data Restored', 'All sample batches, transactions, and FIFO registers reset to default state.');
  }, [addToast]);

  const navigateToAuthWithRole = useCallback((role: UserRole) => {
    setPreselectedAuthRole(role);
    setActiveView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Firebase status state
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseConnectionStatus>({
    isConfigured: isFirebaseConfigured,
    isConnected: false,
    projectId: 'smartipds',
    authDomain: 'smartipds.firebaseapp.com',
    missingKeys: missingConfigKeys,
  });

  const runConnectionTest = useCallback(async () => {
    const res = await testFirestoreConnection();
    setFirebaseStatus(res);
    return res;
  }, []);

  // Initial Firestore diagnostic connectivity check on mount
  useEffect(() => {
    runConnectionTest().catch((e) => {
      console.warn('[SmartPDS Firebase]: Initial connection check note:', e);
    });
  }, [runConnectionTest]);

  // Helper to dispatch verification email with action settings and domain fallback
  const sendVerificationEmailHelper = useCallback(
    async (user: any): Promise<{ success: boolean; error?: string; errorCode?: string }> => {
      if (!user) {
        return { success: false, error: 'No user session available. Please sign in.', errorCode: 'auth/no-user' };
      }
      try {
        const actionCodeSettings = getActionCodeSettings();
        try {
          await sendEmailVerification(user, actionCodeSettings);
          setLastAuthErrorCode(null);
          return { success: true };
        } catch (innerErr: any) {
          const innerCode = innerErr?.code || '';
          console.warn(
            '[SmartPDS Auth]: sendEmailVerification with action settings returned:',
            innerCode,
            innerErr?.message
          );
          // Fallback: If custom continue URI domain is not yet in Firebase Authorized Domains,
          // fallback to standard verification email which always succeeds regardless of domain whitelist!
          if (
            innerCode === 'auth/unauthorized-continue-uri' ||
            innerCode === 'auth/invalid-continue-uri' ||
            innerCode === 'auth/argument-error'
          ) {
            console.log('[SmartPDS Auth]: Retrying with standard Firebase verification template...');
            await sendEmailVerification(user);
            setLastAuthErrorCode(null);
            return { success: true };
          } else {
            throw innerErr;
          }
        }
      } catch (err: any) {
        const errorCode = err?.code || 'auth/unknown-error';
        setLastAuthErrorCode(errorCode);
        console.error('[SmartPDS Auth]: Email verification dispatch error:', errorCode, err?.message);

        let msg = err?.message || 'Failed to dispatch verification email.';
        if (errorCode === 'auth/too-many-requests') {
          msg = 'Too many requests. Firebase has rate-limited email sending. Please wait a few minutes before resending.';
        } else if (errorCode === 'auth/user-token-expired') {
          msg = 'Your session has expired. Please sign in again to request verification.';
        } else if (errorCode === 'auth/quota-exceeded') {
          msg = 'Firebase email dispatch daily quota reached for project smartipds.';
        } else if (errorCode === 'auth/network-request-failed') {
          msg = 'Network connection failed while reaching Firebase Auth.';
        }
        return { success: false, error: msg, errorCode };
      }
    },
    []
  );

  // Resend verification email with duplicate click guard, live status check, and explicit error reporting
  const resendVerificationEmail = useCallback(async (): Promise<{ success: boolean; error?: string; errorCode?: string }> => {
    if (!auth.currentUser) {
      return { success: false, error: 'No active session found. Please sign in to request a verification email.', errorCode: 'auth/no-user' };
    }

    try {
      // First reload user state to check if user already confirmed via email link
      await reload(auth.currentUser);
    } catch {
      // continue
    }

    if (auth.currentUser.emailVerified) {
      setCurrentUser((prev) => (prev ? { ...prev, emailVerified: true } : null));
      setActiveView('app');
      addToast('success', 'Email Already Confirmed', 'Your official credentials have been confirmed! Workspace unlocked.');
      return { success: true };
    }

    const res = await sendVerificationEmailHelper(auth.currentUser);
    if (res.success) {
      addToast(
        'success',
        'Verification Dispatched',
        `A statutory confirmation link has been sent to ${auth.currentUser.email}.`
      );
    } else {
      addToast('error', 'Dispatch Failed', res.error || 'Could not send verification email.');
    }
    return res;
  }, [sendVerificationEmailHelper, addToast]);

  // Check verification status by actively refreshing token via Firebase reload()
  const checkVerificationStatus = useCallback(
    async (silent: boolean = false): Promise<{ isVerified: boolean; error?: string }> => {
      if (!auth.currentUser) {
        return { isVerified: false, error: 'No active session found. Please sign in to verify your account.' };
      }

      try {
        await reload(auth.currentUser);
        const verified = auth.currentUser.emailVerified;

        if (verified) {
          setCurrentUser((prev) => (prev ? { ...prev, emailVerified: true } : null));
          setActiveView('app');
          if (!silent) {
            addToast(
              'success',
              'Credential Confirmed',
              'Email verified successfully! Full operational terminal unlocked.'
            );
          }
          return { isVerified: true };
        } else {
          if (!silent) {
            addToast(
              'warning',
              'Verification Pending',
              'Verification link has not yet been confirmed. Please check your inbox and tap the link.'
            );
          }
          return { isVerified: false };
        }
      } catch (err: any) {
        return { isVerified: false, error: err?.message || 'Failed to check verification status.' };
      }
    },
    [addToast]
  );

  // Detect and process email verification action codes from URL (mode=verifyEmail & oobCode)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');

      if (mode === 'verifyEmail' && oobCode) {
        setVerificationState({ status: 'verifying' });

        // Immediately scrub the action code from the URL bar (prevent code exposure or duplicate processing)
        const cleanPath = window.location.pathname;
        window.history.replaceState({}, document.title, cleanPath);

        (async () => {
          try {
            await applyActionCode(auth, oobCode);

            // If user is currently signed in, refresh token and profile state
            if (auth.currentUser) {
              await reload(auth.currentUser);
              setCurrentUser((prev) => (prev ? { ...prev, emailVerified: true } : null));
            }

            setVerificationState({ status: 'success' });
            addToast(
              'success',
              'Email Verified Successfully',
              'Your official civil supplies account has been verified. Terminal permissions unlocked.'
            );
            setActiveView('app');
          } catch (err: any) {
            let errorMsg = 'The verification link is invalid or has expired.';
            if (err?.code === 'auth/expired-action-code') {
              errorMsg = 'This verification link has expired. Please sign in and request a new verification email.';
            } else if (err?.code === 'auth/invalid-action-code') {
              errorMsg = 'This verification link is invalid or has already been used. Please check your verification status.';
            } else if (err?.code === 'auth/user-disabled') {
              errorMsg = 'This account has been disabled. Please contact the civil supplies administrator.';
            }

            setVerificationState({ status: 'error', error: errorMsg });
            addToast('error', 'Verification Failed', errorMsg);
            setActiveView('verify-email');
          }
        })();
      }
    } catch (e) {
      console.warn('[SmartPDS]: Verification action URL detection note:', e);
    }
  }, [addToast]);

  const [lastAuthErrorCode, setLastAuthErrorCode] = useState<string | null>(null);
  const safeDiagnostic = getSafeFirebaseDiagnostic(lastAuthErrorCode);

  // Persistent Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let role: UserRole = 'Warehouse Operator'; // Safe default non-admin role
        let name = fbUser.displayName || fbUser.email?.split('@')[0] || 'Civil Supplies Officer';
        let designation = 'Civil Supplies Operational Clearance';
        let department = 'Public Distribution Network';

        if (isFirebaseConfigured) {
          try {
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.role) role = data.role as UserRole;
              if (data.name) name = data.name;
              if (data.designation) designation = data.designation;
              if (data.department) department = data.department;
            }
          } catch (e: any) {
            console.warn('[SmartPDS Firebase]: Profile read notice:', e?.code || e?.message || e);
          }
        }

        const isVerified = fbUser.emailVerified;

        const activeUser: UserAccount = {
          id: fbUser.uid,
          name,
          email: fbUser.email || 'officer@smartpds.gov.in',
          role,
          designation,
          department,
          lastLogin: new Date().toISOString(),
          emailVerified: isVerified,
        };

        setCurrentUser(activeUser);
        setCurrentRole(role);
        setIsAuthenticated(true);
        setLastAuthErrorCode(null);

        if (!isVerified) {
          setActiveView('verify-email');
        } else {
          setActiveView((prev) => (prev === 'verify-email' || prev === 'auth' ? 'app' : prev));
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Connect Login Screen strictly to Firebase Email/Password Authentication
  const login = useCallback(
    async ({ role, email, password }: { role: UserRole; email: string; password?: string }) => {
      if (!isFirebaseConfigured) {
        const errCode = 'auth/api-key-not-configured';
        setLastAuthErrorCode(errCode);
        return {
          success: false,
          errorCode: errCode,
          error: `Firebase configuration incomplete in environment. Missing variable(s): ${missingConfigKeys.join(', ')}. Target project: "smartipds".`,
        };
      }

      if (!email || !email.trim()) {
        const errCode = 'auth/invalid-email';
        setLastAuthErrorCode(errCode);
        return { success: false, errorCode: errCode, error: 'Please enter your registered official email address.' };
      }

      if (!password || !password.trim()) {
        const errCode = 'auth/missing-password';
        setLastAuthErrorCode(errCode);
        return { success: false, errorCode: errCode, error: 'Please enter your account password.' };
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = userCredential.user;

        let loadedRole: UserRole = role || 'Warehouse Operator';
        let loadedName = fbUser.displayName || email.split('@')[0];
        let loadedDesignation = `${loadedRole} (Operational Clearance)`;
        let loadedDepartment = 'Public Distribution System';

        // Load or create Firestore user profile
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const d = userSnap.data();
            if (d.role) loadedRole = d.role as UserRole;
            if (d.name) loadedName = d.name;
            if (d.designation) loadedDesignation = d.designation;
            if (d.department) loadedDepartment = d.department;
            // Create missing profile document if it does not exist yet (e.g. pre-existing auth users)
            const safeRole: UserRole = role === 'Administrator' ? 'Warehouse Operator' : role;
            await setDoc(userRef, {
              id: fbUser.uid,
              name: loadedName,
              email: fbUser.email,
              role: safeRole,
              designation: `${safeRole} (Operational Clearance)`,
              department: loadedDepartment,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            loadedRole = safeRole;
            console.log('[SmartPDS]: Profile document created at users/' + fbUser.uid + ' during login.');
          }
        } catch (firestoreErr: any) {
          console.warn('[SmartPDS Firebase]: Firestore profile sync warning:', firestoreErr?.code || firestoreErr?.message);
        }

        const isVerified = fbUser.emailVerified;

        const finalUser: UserAccount = {
          id: fbUser.uid,
          name: loadedName,
          email: fbUser.email || email,
          role: loadedRole,
          designation: loadedDesignation,
          department: loadedDepartment,
          lastLogin: new Date().toISOString(),
          emailVerified: isVerified,
        };

        setCurrentUser(finalUser);
        setCurrentRole(loadedRole);
        setIsAuthenticated(true);
        setLastAuthErrorCode(null);

        if (!isVerified) {
          setActiveView('verify-email');
          addToast(
            'warning',
            'Email Verification Required',
            'Your official credentials require email confirmation before accessing depot operations.'
          );
        } else {
          setActiveView('app');
          addToast('success', 'Firebase Authenticated', `Welcome back, ${finalUser.name}. Session active.`);
        }

        // Immutable audit log entry
        const newAuditLog: AuditLog = {
          id: `LOG-FIREBASE-${Date.now().toString(36).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          user: finalUser.name,
          role: loadedRole,
          action: 'APPROVAL',
          entity: 'USER_SESSION',
          referenceId: finalUser.id,
          result: 'SUCCESS',
          details: `Authenticated via Firebase project "smartipds" as ${finalUser.name} (${finalUser.email}). Verified: ${isVerified}.`,
        };
        setAuditLogs((prev) => [newAuditLog, ...prev]);

        return { success: true, verified: isVerified };
      } catch (firebaseErr: any) {
        const errorCode = firebaseErr?.code || 'auth/unknown-error';
        setLastAuthErrorCode(errorCode);

        if (
          errorCode === 'auth/invalid-credential' ||
          errorCode === 'auth/wrong-password' ||
          errorCode === 'auth/user-not-found'
        ) {
          console.warn('[SmartPDS Firebase Auth]: Sign in attempt:', errorCode);
        } else {
          console.error('[SmartPDS Firebase Auth Error]:', errorCode, firebaseErr?.message || firebaseErr);
        }

        let userMessage = 'Authentication failed. Please check your credentials.';
        if (
          errorCode === 'auth/invalid-credential' ||
          errorCode === 'auth/wrong-password' ||
          errorCode === 'auth/user-not-found'
        ) {
          userMessage =
            'Invalid credentials in Firebase project smartipds. Check your email and password, or register if you do not have an account.';
        } else if (errorCode === 'auth/invalid-email') {
          userMessage = 'Please enter a valid official email address format.';
        } else if (errorCode === 'auth/user-disabled') {
          userMessage = 'This account has been disabled by security administration.';
        } else if (errorCode === 'auth/too-many-requests') {
          userMessage = 'Access temporarily restricted due to multiple failed login attempts. Please try again later.';
        } else if (errorCode === 'auth/network-request-failed') {
          userMessage = 'Network error communicating with Firebase Auth service. Check your connection.';
        } else if (errorCode === 'auth/api-key-not-valid' || errorCode.includes('api-key')) {
          userMessage = 'Invalid Firebase API Key configured. Please verify VITE_FIREBASE_API_KEY for project smartipds.';
        } else if (firebaseErr?.message) {
          userMessage = firebaseErr.message;
        }

        return { success: false, error: userMessage, errorCode };
      }
    },
    [addToast]
  );

  // Connect Signup Screen strictly to Firebase Email/Password Authentication & Firestore Profile
  const signup = useCallback(
    async ({
      role,
      name,
      email,
      password,
    }: {
      role: UserRole;
      name: string;
      email: string;
      password: string;
    }) => {
      if (!isFirebaseConfigured) {
        const errCode = 'auth/api-key-not-configured';
        setLastAuthErrorCode(errCode);
        return {
          success: false,
          errorCode: errCode,
          error: `Firebase configuration incomplete in environment. Missing variable(s): ${missingConfigKeys.join(', ')}. Target project: "smartipds".`,
        };
      }

      if (!email || !email.trim()) {
        const errCode = 'auth/invalid-email';
        setLastAuthErrorCode(errCode);
        return { success: false, errorCode: errCode, error: 'Please enter a valid official email address.' };
      }

      if (!password || password.length < 6) {
        const errCode = 'auth/weak-password';
        setLastAuthErrorCode(errCode);
        return { success: false, errorCode: errCode, error: 'Password must be at least 6 characters long.' };
      }

      // Security requirement: Disallow self-assignment of Administrator role during public signup
      const assignedRole: UserRole = role === 'Administrator' ? 'Warehouse Operator' : role;
      const designation = `${assignedRole} (Official Clearance)`;
      const department = 'State Public Distribution System';

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = userCredential.user;

        // Task 2: Create profile document at users/{uid} using authenticated Firebase UID
        // Include name, email, permitted role, and createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        try {
          await setDoc(doc(db, 'users', fbUser.uid), {
            id: fbUser.uid,
            name: name.trim(),
            email: fbUser.email || email.trim(),
            role: assignedRole,
            designation,
            department,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          console.log('[SmartPDS]: Official personnel profile document successfully created at users/' + fbUser.uid);
        } catch (firestoreWriteErr: any) {
          const fsCode = firestoreWriteErr?.code || 'firestore/write-failed';
          const fsMsg = firestoreWriteErr?.message || 'Access denied by Firestore security rules';
          console.error('[SmartPDS]: Mandatory profile creation at users/' + fbUser.uid + ' failed:', fsCode, fsMsg);
          setLastAuthErrorCode(fsCode);

          // Task 3: Handle Firestore write failures visibly. Do not show signup as fully completed if required profile creation fails.
          return {
            success: false,
            error: `User account created in Firebase Authentication, but profile creation at users/${fbUser.uid} failed: [${fsCode}] ${fsMsg}. Check Firestore security rules in Firebase Console.`,
            errorCode: fsCode,
          };
        }

        // Request statutory verification email
        const emailRes = await sendVerificationEmailHelper(fbUser);

        const newUser: UserAccount = {
          id: fbUser.uid,
          name: name.trim() || fbUser.email?.split('@')[0] || 'Civil Supplies Officer',
          email: fbUser.email || email,
          role: assignedRole,
          designation,
          department,
          lastLogin: new Date().toISOString(),
          emailVerified: fbUser.emailVerified, // false
        };

        setCurrentUser(newUser);
        setCurrentRole(assignedRole);
        setIsAuthenticated(true);
        setLastAuthErrorCode(null);
        setActiveView('verify-email'); // Direct to verification gate!

        if (emailRes.success) {
          addToast(
            'info',
            'Verification Email Sent',
            `A statutory verification link has been sent to ${email}. Please confirm your email to access the depot terminal.`
          );
        } else {
          addToast(
            'warning',
            'Account Created',
            emailRes.error || 'Account created, but verification email could not be sent. Please use the resend button.'
          );
        }

        return { success: true, emailSent: emailRes.success };
      } catch (err: any) {
        const errorCode = err?.code || 'auth/unknown-error';
        setLastAuthErrorCode(errorCode);

        if (errorCode === 'auth/email-already-in-use') {
          console.warn('[SmartPDS Firebase Auth]: Account already registered with email in project smartipds:', errorCode);
        } else {
          console.error('[SmartPDS Firebase Signup Error]:', errorCode, err?.message || err);
        }

        let msg = err?.message || 'Failed to create Firebase user account.';
        if (errorCode === 'auth/email-already-in-use') {
          msg = 'An account with this email already exists in Firebase project smartipds. Please sign in instead.';
        } else if (errorCode === 'auth/weak-password') {
          msg = 'Password is too weak. Please use at least 6 characters.';
        } else if (errorCode === 'auth/invalid-email') {
          msg = 'Please enter a valid official email address format.';
        } else if (errorCode === 'auth/operation-not-allowed') {
          msg = 'Email/Password sign-up is not enabled in Firebase Console for project smartipds.';
        } else if (errorCode === 'auth/api-key-not-valid' || errorCode.includes('api-key')) {
          msg = 'Invalid Firebase API Key configured. Please verify VITE_FIREBASE_API_KEY for project smartipds.';
        }
        return { success: false, error: msg, errorCode };
      }
    },
    [sendVerificationEmailHelper, addToast]
  );

  // Send official Password Reset Email via Firebase Auth
  const sendPasswordReset = useCallback(
    async (targetEmail: string): Promise<{ success: boolean; error?: string }> => {
      if (!targetEmail || !targetEmail.trim()) {
        return { success: false, error: 'Please enter your registered email address.' };
      }
      try {
        await sendPasswordResetEmail(auth, targetEmail.trim());
        addToast(
          'success',
          'Password Reset Email Dispatched',
          `Official password reset instructions sent to ${targetEmail.trim()}. Check your inbox.`
        );
        return { success: true };
      } catch (err: any) {
        const code = err?.code || 'auth/unknown-error';
        console.warn('[SmartPDS Auth]: Password reset notice:', code, err?.message);
        let msg = 'Could not send password reset email.';
        if (code === 'auth/user-not-found') {
          msg = 'No account found with this email in project smartipds. Please register first.';
        } else if (code === 'auth/invalid-email') {
          msg = 'Please enter a valid official email address format.';
        } else if (code === 'auth/too-many-requests') {
          msg = 'Too many password reset requests. Please wait a few minutes before trying again.';
        } else if (err?.message) {
          msg = err.message;
        }
        return { success: false, error: msg };
      }
    },
    [addToast]
  );

  const logout = useCallback(async () => {
    try {
      if (isFirebaseConfigured) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn('[SmartPDS]: Firebase signout note:', e);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveView('landing');
    setPreselectedAuthRole(null);
    setVerificationState(null);
    addToast('info', 'Signed Out', 'You have been safely signed out of SmartPDS.');
  }, [addToast]);

  return (
    <AppContext.Provider
      value={{
        batches,
        dispatches,
        auditLogs,
        fairPriceShops,
        currentRole,
        toasts,
        activeChallan,
        theme,
        isAuthenticated,
        currentUser,
        activeView,
        setActiveView,
        preselectedAuthRole,
        setPreselectedAuthRole,
        navigateToAuthWithRole,
        login,
        signup,
        sendPasswordReset,
        logout,
        isEmailVerified: Boolean(currentUser?.emailVerified),
        resendVerificationEmail,
        checkVerificationStatus,
        verificationState,
        lastAuthErrorCode,
        safeDiagnostic,
        firebaseStatus,
        runConnectionTest,
        reconciliations,
        fifoExceptions,
        approvalRequests,
        deliveryTracking,
        returnDiscrepancies,
        anomalies,
        depotSettings,
        approvalRules,
        toggleTheme,
        setTheme,
        setCurrentRole,
        addToast,
        removeToast,
        setActiveChallan,
        calculateFifoPreview,
        executeDispatch,
        addStockReceipt,
        updateBatchStatus,
        editBatchMetadata,
        addReconciliation,
        reviewReconciliation,
        requestFifoException,
        reviewFifoException,
        reviewApprovalRequest,
        updateDeliveryMilestone,
        addReturnDiscrepancy,
        resolveAnomaly,
        updateDepotSettings,
        toggleApprovalRule,
        resetDemoData,
        seedHackathonDemoData,
        clearDemoInventory,
        isSeedingDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
