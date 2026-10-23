import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Bell,
  RotateCcw,
  Shield,
  Search,
  ExternalLink,
  ChevronDown,
  Info,
  SlidersHorizontal,
  Sun,
  Moon,
  Menu,
  Home,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface TopBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSettingsModal: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  onOpenMobileNav?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettingsModal,
  globalSearchQuery,
  setGlobalSearchQuery,
  onOpenMobileNav,
}) => {
  const {
    currentRole,
    setCurrentRole,
    resetDemoData,
    auditLogs,
    batches,
    addToast,
    theme,
    toggleTheme,
    setActiveView,
    currentUser,
    logout,
  } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const tabTitles: Record<NavTab, { group: string; title: string; subtitle: string }> = {
    dashboard: {
      group: 'Overview',
      title: 'Warehouse Operations Overview',
      subtitle: 'Real-time commodity stock, ageing alerts, and FIFO queue monitoring',
    },
    // Inventory Management
    'inv-stock': {
      group: 'Inventory Management',
      title: 'Stock & Batches Register',
      subtitle: 'Comprehensive inventory register by commodity, bay stack, and moisture parameter',
    },
    'inv-receipts': {
      group: 'Inventory Management',
      title: 'Inward Receipts & Gate Verification',
      subtitle: 'Record fresh rake receipts, capture electronic moisture levels, and auto-quarantine lots',
    },
    'inv-ledger': {
      group: 'Inventory Management',
      title: 'Stock Movements & Ledger',
      subtitle: 'Double-entry traceable transaction journal tracking all inflows, outflows, and adjustments',
    },
    'inv-reconciliation': {
      group: 'Inventory Management',
      title: 'Physical Stock Reconciliation',
      subtitle: 'Floor count versus computerized balance audit and variance justification register',
    },
    // FIFO Operations
    'fifo-queue': {
      group: 'FIFO Operations',
      title: 'FIFO Allocation Priority Queue',
      subtitle: 'Deterministic rotation queue ordered strictly by arrival date (oldest stock first)',
    },
    'fifo-planning': {
      group: 'FIFO Operations',
      title: 'Dispatch Planning & Allocation Sandbox',
      subtitle: 'Simulate multi-batch allocations, model indent fulfillment, and preview drawdown impact',
    },
    'fifo-exceptions': {
      group: 'FIFO Operations',
      title: 'FIFO Exceptions & Deviation Log',
      subtitle: 'Traceable log of out-of-order allocations, physical obstacles, and bypass authorizations',
    },
    'fifo-approvals': {
      group: 'FIFO Operations',
      title: 'Approval Requests & Governance Desk',
      subtitle: 'Manager and Auditor sign-off for exceptions, variances, and quarantine status changes',
    },
    // Dispatch & Challans
    'dispatch-create': {
      group: 'Dispatch & Challans',
      title: 'Create Official Dispatch Order',
      subtitle: 'Automated oldest-batch drawdown and electronic Form PDS-12 delivery challan generator',
    },
    'dispatch-challans': {
      group: 'Dispatch & Challans',
      title: 'Digital Challans & Gate Passes Register',
      subtitle: 'Official civil supplies issue vouchers, vehicle gate passes, and delivery verification records',
    },
    'dispatch-tracking': {
      group: 'Dispatch & Challans',
      title: 'Fair Price Shop Delivery Tracking',
      subtitle: 'Real-time transit fleet status, waypoint milestones, and dealer receipt verification',
    },
    'dispatch-returns': {
      group: 'Dispatch & Challans',
      title: 'Returns & Transit Discrepancies',
      subtitle: 'Log bag damage, transit moisture loss, and return gate passes with salvage accounting',
    },
    // AI Intelligence
    'ai-copilot': {
      group: 'AI Intelligence',
      title: 'AI Inventory Copilot',
      subtitle: 'Interactive advisory desk providing instant grounded responses to grain stock queries',
    },
    'ai-risk': {
      group: 'AI Intelligence',
      title: 'Stock Risk & Ageing Projection',
      subtitle: 'Predictive analytics on grain moisture hazard, shelf-life deterioration, and buffer depletion',
    },
    'ai-anomaly': {
      group: 'AI Intelligence',
      title: 'Anomaly & Fraud Detection Scanner',
      subtitle: 'Automated scrutiny detecting balance discrepancies, bypassed FIFO rules, and weight surges',
    },
    'ai-reader': {
      group: 'AI Intelligence',
      title: 'Receipt & Challan OCR Document Reader',
      subtitle: 'Computer-vision digitization of mill rake weighbridge slips and dealer indents',
    },
    // Audit & Reports
    'audit-trail': {
      group: 'Audit & Reports',
      title: 'System Audit Ledger',
      subtitle: 'Immutable event log of inward receipts, status updates, and FIFO dispatches',
    },
    'rep-stock': {
      group: 'Audit & Reports',
      title: 'Stock Position & Valuation Report',
      subtitle: 'Official monthly closing stock summary, bay capacity utilization, and MSP valuation',
    },
    'rep-ageing': {
      group: 'Audit & Reports',
      title: 'Stock Ageing Stratification Report',
      subtitle: 'Age bracket analysis (0-30d, 31-60d, 61-90d, 90+d) and rotation priority index',
    },
    'rep-wastage': {
      group: 'Audit & Reports',
      title: 'Wastage & Loss Benchmark Analytics',
      subtitle: 'Handling loss, tare shrinkage, and transit spillage metrics against statutory limits',
    },
    // Administration
    'admin-users': {
      group: 'Administration',
      title: 'Users & Role Permission Matrix',
      subtitle: 'Segregation of duties between Administrator, Warehouse Operator, and Ration Shop Dealer',
    },
    'admin-settings': {
      group: 'Administration',
      title: 'Depot Parameters & Configuration',
      subtitle: 'FCI Hubballi Base Depot #4 parameters, godown storage limit, and working hours',
    },
    'admin-approval-rules': {
      group: 'Administration',
      title: 'Approval Rules & Escalation Thresholds',
      subtitle: 'Institutional policy gates for dispatch volumes, moisture quarantine, and variance limits',
    },
    'admin-activity': {
      group: 'Administration',
      title: 'Notifications & System Telemetry Log',
      subtitle: 'Security event logs, IoT sensor gateways, and real-time depot heartbeat monitoring',
    },
    // Legacy Aliases
    stock: {
      group: 'Inventory Management',
      title: 'Stock & Batches Register',
      subtitle: 'Manage grain batches, record inward receipts, and track moisture parameters',
    },
    dispatch: {
      group: 'Dispatch & Challans',
      title: 'Create Official Dispatch Order',
      subtitle: 'Strict oldest-first batch allocation and automated digital challan generation',
    },
    challans: {
      group: 'Dispatch & Challans',
      title: 'Digital Challans & Gate Passes',
      subtitle: 'Official PDS Form-12 dispatches, gate passes, and delivery verification',
    },
    audit: {
      group: 'Audit & Reports',
      title: 'System Audit Ledger',
      subtitle: 'Immutable event log of inward receipts, status updates, and FIFO dispatches',
    },
    'ai-advisor': {
      group: 'AI Intelligence',
      title: 'AI Inventory Copilot',
      subtitle: 'Executive stock analysis, moisture hazard alerts, and FIFO compliance reports',
    },
    settings: {
      group: 'Administration',
      title: 'Depot Parameters & Configuration',
      subtitle: 'Simulated user role switcher, demo dataset controls, and audit parameters',
    },
  };

  const currentInfo = tabTitles[currentTab] || {
    group: 'SmartPDS',
    title: 'SmartPDS',
    subtitle: 'Commodity Stock Allocation',
  };

  const roles: UserRole[] = [
    'Administrator',
    'Warehouse Operator',
    'Ration Shop Dealer',
  ];

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    setShowRoleMenu(false);
    addToast('info', 'Active Role Switched', `Now operating under simulated "${newRole}" role.`);
  };

  const handleConfirmReset = () => {
    resetDemoData();
    setShowResetConfirm(false);
  };

  const ageingBatches = batches.filter(
    (b) => b.status === 'Eligible' && b.availableBags > 0 && b.stockAgeDays >= 90
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2.5 sm:gap-4 px-3 sm:px-6 py-3 bg-[#0D1420] border-b border-[#263449] shadow-2xs transition-colors duration-200">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 max-w-[210px] sm:max-w-xs md:max-w-sm lg:max-w-md">
          {/* Mobile Navigation Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden p-1.5 -ml-1 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#141D2A] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#A9144B]"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb & Context */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] font-medium whitespace-nowrap overflow-hidden">
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className="shrink-0 hover:text-[#C4B5FD] font-semibold transition-colors cursor-pointer"
                title="Go to Overview Dashboard"
              >
                SmartPDS
              </button>
              {currentInfo.group !== 'Overview' && (
                <>
                  <span aria-hidden="true" className="text-slate-600">/</span>
                  <span className="text-[#94A3B8] truncate">{currentInfo.group}</span>
                </>
              )}
              <span aria-hidden="true" className="text-slate-600">/</span>
              <span className="text-[#C4B5FD] font-semibold truncate">{currentInfo.title}</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-[#F1F5F9] tracking-tight whitespace-nowrap truncate mt-0.5">
              {currentInfo.title}
            </h1>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md mx-2 sm:mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search batches, challans, bay numbers, or FPS..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#141D2A] hover:bg-[#1E293B] focus:bg-[#141D2A] border border-[#263449] focus:border-[#C4B5FD] text-[#F1F5F9] rounded-lg outline-none transition-all placeholder:text-[#94A3B8]/60"
            />
            {globalSearchQuery && (
              <button
                onClick={() => setGlobalSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#F1F5F9] px-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Landing Page Link Button */}
          <button
            onClick={() => setActiveView('landing')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#F1F5F9] bg-[#141D2A] hover:bg-[#1E293B] border border-[#263449] hover:border-[#C4B5FD]/50 rounded-lg transition-colors cursor-pointer"
            title="Return to Public Landing Page"
          >
            <Home className="w-3.5 h-3.5 text-[#C4B5FD]" />
            <span className="hidden sm:inline">Landing Page</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 text-[#94A3B8] hover:text-[#F1F5F9] bg-[#141D2A] hover:bg-[#1E293B] border border-[#263449] rounded-lg transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#C4B5FD] animate-in spin-in-90 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-[#C4B5FD] animate-in spin-in-90 duration-300" />
            )}
          </button>

          {/* Demo Mode Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#C4B5FD] bg-[#4A182A] border border-[#A9144B]/50 rounded-md whitespace-nowrap">
            <Shield className="w-3.5 h-3.5 text-[#C4B5FD]" />
            <span>PDS Demo Portal</span>
          </div>

          {/* Role Switcher & User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#F1F5F9] bg-[#141D2A] border border-[#263449] hover:border-[#C4B5FD]/50 rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate max-w-[100px] sm:max-w-[140px]">{currentRole}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-[#141D2A] border border-[#263449] rounded-xl shadow-2xl p-2 z-40">
                <div className="px-3 py-2 border-b border-[#263449]">
                  <div className="text-xs font-bold text-[#F1F5F9] truncate">
                    {currentUser?.name || 'Civil Supplies Officer'}
                  </div>
                  <div className="text-[11px] text-[#C4B5FD] font-mono truncate">
                    {currentRole} · {currentUser?.id || 'EMP-PDS-001'}
                  </div>
                  <div className="text-[10px] text-[#94A3B8] mt-0.5">
                    {currentUser?.department || 'Public Distribution Network'}
                  </div>
                </div>

                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Switch Role Clearance:
                </div>

                <div className="py-1 space-y-0.5">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                        currentRole === r
                          ? 'bg-[#4A182A] text-[#C4B5FD] font-semibold border border-[#A9144B]/50'
                          : 'text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{r}</span>
                      {currentRole === r && (
                        <span className="text-[10px] bg-[#A9144B] text-white px-1.5 py-0.2 rounded font-semibold shrink-0 ml-1">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#263449] px-1 space-y-1">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onOpenSettingsModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#CBD5E1] hover:text-[#C4B5FD] font-medium rounded-md hover:bg-[#1E293B] transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>Role Permission Details</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium rounded-md hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#141D2A] rounded-lg transition-colors cursor-pointer"
              title="Alerts and Activity"
              aria-label="Alerts and Activity"
            >
              <Bell className="w-4 h-4" />
              {ageingBatches.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#0D1420]" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#141D2A] border border-[#263449] rounded-xl shadow-2xl p-3 z-40">
                <div className="flex items-center justify-between pb-2 border-b border-[#263449]">
                  <span className="text-xs font-bold text-[#F1F5F9]">Depot Alerts & Activity</span>
                  <span className="text-[11px] text-[#94A3B8] font-mono tabular-nums">
                    {ageingBatches.length} alerts
                  </span>
                </div>
                <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                  {ageingBatches.length > 0 ? (
                    ageingBatches.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-xs"
                      >
                        <div className="font-semibold text-amber-300 flex items-center justify-between">
                          <span>Ageing Stock Alert</span>
                          <span className="text-[10px] font-mono text-amber-400">{b.stockAgeDays}d old</span>
                        </div>
                        <div className="text-[11px] text-amber-200 mt-1">
                          Batch <span className="font-mono font-medium">{b.id}</span> ({b.commodity}) has {b.availableBags} bags awaiting dispatch.
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#94A3B8] py-3 text-center">
                      All eligible batches are within standard freshness norms.
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#263449]">
                    <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                      Recent Activity
                    </div>
                    {auditLogs.slice(0, 2).map((log) => (
                      <div key={log.id} className="py-1 text-[11px] text-[#CBD5E1] truncate">
                        <span className="font-mono text-[#94A3B8]">
                          {log.timestamp.split('T')[1]?.slice(0, 5)}
                        </span>{' '}
                        · {log.action} ({log.referenceId})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[#F1F5F9] hover:text-[#C4B5FD] bg-[#141D2A] hover:bg-[#1E293B] border border-[#263449] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Reset to clean sample data"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span className="hidden lg:inline">Reset Demo</span>
          </button>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#141D2A] rounded-2xl border border-[#263449] shadow-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-950/60 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/50">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#F1F5F9]">Restore Demo Warehouse Data?</h3>
                <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                  This will reset all batch balances, newly created stock receipts, dispatches, and audit entries back to the pristine hackathon demo dataset.
                </p>
                <div className="mt-4 p-3 bg-[#0D1420] rounded-lg border border-[#263449] text-xs text-[#CBD5E1] space-y-1">
                  <div>· Restores B001 (100 bags) and B002 (150 bags) demo state</div>
                  <div>· Re-engages sample damaged & quarantined batches</div>
                  <div>· Preserves local simulated storage</div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#CBD5E1] hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReset}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
