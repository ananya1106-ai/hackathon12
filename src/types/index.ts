export type CommodityType = 'Rice' | 'Wheat' | 'Sugar' | 'Coarse Grains' | 'Pulses';

export type BatchStatus = 'Eligible' | 'Quarantined' | 'Damaged' | 'Exhausted';

export type QualityGrade = 'Grade-I (FAQ)' | 'Grade-II' | 'Sub-Standard';

export interface StockMovement {
  id: string;
  date: string;
  action: 'RECEIPT' | 'DISPATCH' | 'STATUS_CHANGE' | 'ADJUSTMENT';
  quantityBags: number;
  quantityQtl: number;
  referenceId: string;
  user: string;
  notes?: string;
}

export interface Batch {
  id: string; // e.g. BATCH-2026-RC-001
  commodity: CommodityType;
  variety: string; // e.g. 'Grade A - Boiled', 'Raw Common', 'Sharbati Lokwan'
  receivedDate: string; // YYYY-MM-DD
  expiryDate?: string;
  initialBags: number;
  availableBags: number;
  bagWeightKg: number; // e.g. 50 kg
  totalReceivedQtl: number; // bags * kg / 100
  availableQtl: number;
  depotLocation: string; // e.g. 'Godown-4, Bay B-12'
  warehouseName: string; // e.g. 'State Civil Supplies Central Depot'
  moisturePercentage: number; // e.g. 11.8%
  qualityInspectionGrade: QualityGrade;
  status: BatchStatus;
  statusReason?: string;
  supplierSource: string; // e.g. 'FCI Regional Hub, Raichur'
  stockAgeDays: number;
  notes?: string;
  movements: StockMovement[];
  isDemo?: boolean;
}

export interface AllocationItem {
  batchId: string;
  commodity: CommodityType;
  variety: string;
  receivedDate: string;
  availableBags: number;
  allocatedBags: number;
  allocatedQtl: number;
  remainingBagsAfter: number;
  depotLocation: string;
  stockAgeDays: number;
  isFullyExhausted: boolean;
}

export interface ExcludedBatchItem {
  batch: Batch;
  reason: string;
  category: 'QUARANTINED' | 'DAMAGED' | 'EXPIRED' | 'EXHAUSTED' | 'DIFF_COMMODITY' | 'DIFF_VARIETY' | 'OTHER';
}

export interface FifoPreviewResult {
  success: boolean;
  error?: string;
  commodity: CommodityType;
  variety: string;
  requestedBags: number;
  totalEligibleAvailableBags: number;
  shortageBags: number;
  allocations: AllocationItem[];
  allEligibleBatches: Batch[];
  excludedBatches: ExcludedBatchItem[];
}

export interface DispatchRecord {
  challanNumber: string; // e.g. PDS-CH-2026-0842
  idempotencyKey?: string;
  issuerUid?: string;
  depotId?: string;
  depotName?: string;
  timestamp: string; // ISO string
  commodity: CommodityType;
  variety: string;
  totalBags: number;
  totalQtl: number;
  destinationFpsId: string; // Fair Price Shop ID
  destinationName: string; // FPS Name or Centre
  destinationDistrict: string;
  destinationAddress: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  transporterAgency: string;
  gatePassNo: string;
  allocatedBatches: Array<{
    batchId: string;
    bags: number;
    qtl: number;
    receivedDate: string;
    bay: string;
    stockAgeDays: number;
  }>;
  status: 'Dispatched' | 'In Transit' | 'Delivered';
  dispatchedBy: string;
  authorizedBy: string;
  remarks?: string;
  isDemo: boolean;
}

export type UserRole =
  | 'Administrator'
  | 'Warehouse Operator'
  | 'Ration Shop Dealer';

export function normalizeUserRole(role: unknown): UserRole {
  if (role === 'Administrator') return 'Administrator';
  if (role === 'Ration Shop Dealer' || role === 'PDS Officer' || role === 'FPS Dealer') {
    return 'Ration Shop Dealer';
  }
  // Safe default: Depot Manager, Warehouse Manager, Depot Operator, Vigilance Auditor all normalize to Warehouse Operator
  // Never silently grant Administrator
  return 'Warehouse Operator';
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  avatar?: string;
  lastLogin?: string;
  emailVerified?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: 'STOCK_RECEIPT' | 'FIFO_DISPATCH' | 'STATUS_CHANGE' | 'BATCH_UPDATE' | 'DEMO_RESET' | 'RECONCILIATION' | 'FIFO_EXCEPTION' | 'APPROVAL' | 'RETURN_LOGGED';
  entity: string;
  referenceId: string;
  result: 'SUCCESS' | 'WARNING' | 'REJECTED';
  details: string;
}

export interface FairPriceShop {
  id: string;
  code: string;
  name: string;
  taluk: string;
  district: string;
  dealerName: string;
  contactNumber: string;
  activeCardsCount: number;
}

export interface ReconciliationRecord {
  id: string;
  batchId: string;
  commodity: CommodityType;
  variety: string;
  bay: string;
  systemBags: number;
  physicalCountedBags: number;
  varianceBags: number;
  varianceQtl: number;
  reconciledDate: string;
  auditorName: string;
  status: 'Reconciled' | 'Discrepancy' | 'Pending Approval' | 'Adjusted';
  varianceReason?: string;
}

export interface FifoException {
  id: string;
  timestamp: string;
  requestedCommodity: CommodityType;
  requestedVariety: string;
  requestedBags: number;
  skippedBatchId: string;
  skippedBatchAgeDays: number;
  allocatedBatchId: string;
  allocatedBatchAgeDays: number;
  justificationReason: string;
  requestedBy: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvalRemarks?: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'FIFO_EXCEPTION' | 'STOCK_ADJUSTMENT' | 'QUARANTINE_RELEASE' | 'OVERSIZE_DISPATCH';
  title: string;
  requestedBy: string;
  requestedRole: UserRole;
  requestedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  details: string;
  impact: string;
  referenceId: string;
  reviewedBy?: string;
  reviewedDate?: string;
  remarks?: string;
}

export interface DeliveryTrackingRecord {
  id: string;
  challanNumber: string;
  vehicleNumber: string;
  transporter: string;
  driverName: string;
  driverPhone: string;
  destinationFps: string;
  commodity: string;
  bags: number;
  dispatchedAt: string;
  estimatedDeliveryAt: string;
  currentMilestone: 'Gate Pass Issued' | 'Weighbridge Exit' | 'In Transit' | 'Arrived at FPS' | 'Inspected & Unloaded' | 'Delivered Verified';
  status: 'In Transit' | 'Delivered' | 'Delayed' | 'Exception';
  gpsLocation: string;
  otpVerified: boolean;
  transitUpdates: Array<{
    time: string;
    location: string;
    statusNote: string;
  }>;
}

export interface ReturnDiscrepancyRecord {
  id: string;
  challanNumber: string;
  fpsName: string;
  commodity: CommodityType;
  dispatchedBags: number;
  receivedBags: number;
  damagedBags: number;
  missingBags: number;
  shortageWeightKg: number;
  reportDate: string;
  discrepancyType: 'Transit Moisture Loss' | 'Bag Tear / Spillage' | 'Damaged by Water' | 'Count Shortage';
  status: 'Logged' | 'Under Investigation' | 'Restocked / Reconciled' | 'Claim Filed';
  notes: string;
}

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  category: 'FIFO_BYPASS' | 'WEIGHT_VARIANCE' | 'DUPLICATE_CHALLAN' | 'MOISTURE_SURGE' | 'RAPID_DISPATCH';
  affectedBatchId?: string;
  affectedChallan?: string;
  status: 'Active' | 'Investigating' | 'Resolved';
  actionRecommended: string;
}

export interface DepotSettings {
  depotName: string;
  depotCode: string;
  district: string;
  state: string;
  totalCapacityBags: number;
  maxMoistureAllowedPercent: number;
  mandatoryManagerApprovalBagsThreshold: number;
  ageingWarningDays: number;
  ageingCriticalDays: number;
  operatingHours: string;
  officerInCharge: string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  condition: string;
  approverRole: UserRole;
  isActive: boolean;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
}
