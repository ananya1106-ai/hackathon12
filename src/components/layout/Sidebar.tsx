import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowRightLeft,
  FileText,
  ShieldCheck,
  Bot,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  X,
  PackagePlus,
  BookOpen,
  Scale,
  Clock,
  Sliders,
  AlertOctagon,
  CheckCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  FileScan,
  Printer,
  TrendingDown,
  Users,
  Bell,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type NavTab =
  | 'dashboard'
  // Inventory Management
  | 'inv-stock'
  | 'inv-receipts'
  | 'inv-ledger'
  | 'inv-reconciliation'
  // FIFO Operations
  | 'fifo-queue'
  | 'fifo-planning'
  | 'fifo-exceptions'
  | 'fifo-approvals'
  // Dispatch & Challans
  | 'dispatch-create'
  | 'dispatch-challans'
  | 'dispatch-tracking'
  | 'dispatch-returns'
  // AI Intelligence
  | 'ai-copilot'
  | 'ai-risk'
  | 'ai-anomaly'
  | 'ai-reader'
  // Audit & Reports
  | 'audit-trail'
  | 'rep-stock'
  | 'rep-ageing'
  | 'rep-wastage'
  // Administration
  | 'admin-users'
  | 'admin-settings'
  | 'admin-approval-rules'
  | 'admin-activity'
  // Legacy aliases
  | 'stock'
  | 'dispatch'
  | 'challans'
  | 'audit'
  | 'ai-advisor'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavSubItem {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'warning' | 'primary';
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavSubItem[];
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const {
    batches,
    dispatches,
    auditLogs,
    currentRole,
    approvalRequests,
    anomalies,
    fifoExceptions,
    deliveryTracking,
    currentUser,
    logout,
  } = useApp();

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const eligibleBatchesCount = batches.filter((b) => b.status === 'Eligible' && b.availableBags > 0).length;
  const ageingBatchesCount = batches.filter(
    (b) => b.status === 'Eligible' && b.availableBags > 0 && b.stockAgeDays >= 90
  ).length;
  const pendingApprovalsCount = approvalRequests.filter((a) => a.status === 'Pending').length;
  const activeAnomaliesCount = anomalies.filter((a) => a.status !== 'Resolved').length;
  const inTransitCount = deliveryTracking.filter((d) => d.status === 'In Transit').length;

  // Determine active parent group
  const getParentGroupId = (tab: NavTab): string => {
    if (tab === 'dashboard') return 'dashboard';
    if (['inv-stock', 'inv-receipts', 'inv-ledger', 'inv-reconciliation', 'stock'].includes(tab)) return 'inventory';
    if (['fifo-queue', 'fifo-planning', 'fifo-exceptions', 'fifo-approvals'].includes(tab)) return 'fifo';
    if (['dispatch-create', 'dispatch-challans', 'dispatch-tracking', 'dispatch-returns', 'dispatch', 'challans'].includes(tab)) return 'dispatch';
    if (['ai-copilot', 'ai-risk', 'ai-anomaly', 'ai-reader', 'ai-advisor'].includes(tab)) return 'ai';
    if (['audit-trail', 'rep-stock', 'rep-ageing', 'rep-wastage', 'audit'].includes(tab)) return 'reports';
    if (['admin-users', 'admin-settings', 'admin-approval-rules', 'admin-activity', 'settings'].includes(tab)) return 'admin';
    return 'dashboard';
  };

  const activeParent = getParentGroupId(currentTab);

  // Accordion state: by default, auto-expand active group
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    inventory: true,
    fifo: true,
    dispatch: false,
    ai: false,
    reports: false,
    admin: false,
  });

  // Automatically ensure active group is open whenever tab changes
  useEffect(() => {
    if (activeParent && activeParent !== 'dashboard') {
      setOpenGroups((prev) => ({ ...prev, [activeParent]: true }));
    }
  }, [activeParent]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'inventory',
      label: 'Inventory Management',
      icon: <Boxes className="w-4 h-4 shrink-0" />,
      badge: eligibleBatchesCount,
      items: [
        {
          id: 'inv-stock',
          label: 'Stock & Batches',
          icon: <Boxes className="w-4 h-4 shrink-0" />,
          badge: batches.length,
        },
        {
          id: 'inv-receipts',
          label: 'Inward Receipts',
          icon: <PackagePlus className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'inv-ledger',
          label: 'Stock Ledger',
          icon: <BookOpen className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'inv-reconciliation',
          label: 'Physical Reconciliation',
          icon: <Scale className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      id: 'fifo',
      label: 'FIFO Operations',
      icon: <ArrowRightLeft className="w-4 h-4 shrink-0" />,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} req` : undefined,
      items: [
        {
          id: 'fifo-queue',
          label: 'Allocation Queue',
          icon: <Clock className="w-4 h-4 shrink-0" />,
          badge: ageingBatchesCount > 0 ? `${ageingBatchesCount} due` : undefined,
          badgeVariant: ageingBatchesCount > 0 ? 'warning' : 'default',
        },
        {
          id: 'fifo-planning',
          label: 'Dispatch Planning',
          icon: <Sliders className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'fifo-exceptions',
          label: 'FIFO Exceptions',
          icon: <AlertOctagon className="w-4 h-4 shrink-0" />,
          badge: fifoExceptions.filter((e) => e.status === 'Pending Approval').length || undefined,
        },
        {
          id: 'fifo-approvals',
          label: 'Approval Requests',
          icon: <CheckCheck className="w-4 h-4 shrink-0" />,
          badge: pendingApprovalsCount || undefined,
          badgeVariant: pendingApprovalsCount > 0 ? 'warning' : 'default',
        },
      ],
    },
    {
      id: 'dispatch',
      label: 'Dispatch & Challans',
      icon: <FileText className="w-4 h-4 shrink-0" />,
      badge: dispatches.length,
      items: [
        {
          id: 'dispatch-create',
          label: 'Create Dispatch',
          icon: <ArrowRightLeft className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'dispatch-challans',
          label: 'Challan Register',
          icon: <FileText className="w-4 h-4 shrink-0" />,
          badge: dispatches.length,
        },
        {
          id: 'dispatch-tracking',
          label: 'Delivery Tracking',
          icon: <Truck className="w-4 h-4 shrink-0" />,
          badge: inTransitCount > 0 ? `${inTransitCount} live` : undefined,
        },
        {
          id: 'dispatch-returns',
          label: 'Returns & Discrepancies',
          icon: <RotateCcw className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      id: 'ai',
      label: 'AI Intelligence',
      icon: <Bot className="w-4 h-4 shrink-0" />,
      badge: activeAnomaliesCount > 0 ? `${activeAnomaliesCount} alert` : undefined,
      items: [
        {
          id: 'ai-copilot',
          label: 'AI Inventory Copilot',
          icon: <Bot className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'ai-risk',
          label: 'Stock Risk Analysis',
          icon: <Sparkles className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'ai-anomaly',
          label: 'Anomaly Detection',
          icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
          badge: activeAnomaliesCount || undefined,
          badgeVariant: activeAnomaliesCount > 0 ? 'warning' : 'default',
        },
        {
          id: 'ai-reader',
          label: 'Receipt & Challan Reader',
          icon: <FileScan className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      id: 'reports',
      label: 'Audit & Reports',
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
      badge: auditLogs.length,
      items: [
        {
          id: 'audit-trail',
          label: 'Audit Trail',
          icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
          badge: auditLogs.length,
        },
        {
          id: 'rep-stock',
          label: 'Stock Reports',
          icon: <FileText className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'rep-ageing',
          label: 'Ageing Reports',
          icon: <Clock className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'rep-wastage',
          label: 'Wastage & Loss Reports',
          icon: <TrendingDown className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      id: 'admin',
      label: 'Administration',
      icon: <Settings className="w-4 h-4 shrink-0" />,
      items: [
        {
          id: 'admin-users',
          label: 'Users & Roles',
          icon: <Users className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'admin-settings',
          label: 'Depot Settings',
          icon: <Settings className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'admin-approval-rules',
          label: 'Approval Rules',
          icon: <SlidersHorizontal className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'admin-activity',
          label: 'System Activity',
          icon: <Bell className="w-4 h-4 shrink-0" />,
        },
      ],
    },
  ];

  const isTabActive = (itemTab: NavTab): boolean => {
    if (currentTab === itemTab) return true;
    // Map legacy aliases
    if (itemTab === 'inv-stock' && currentTab === 'stock') return true;
    if (itemTab === 'dispatch-create' && currentTab === 'dispatch') return true;
    if (itemTab === 'dispatch-challans' && currentTab === 'challans') return true;
    if (itemTab === 'audit-trail' && currentTab === 'audit') return true;
    if (itemTab === 'ai-copilot' && currentTab === 'ai-advisor') return true;
    if (itemTab === 'admin-settings' && currentTab === 'settings') return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 flex flex-col bg-[#4A182A] text-[#F1F5F9] border-r border-[#263449] transition-all duration-300 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-72 max-w-[85vw] ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Main Navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#263449] shrink-0 bg-[#3B1221]">
          <button
            type="button"
            onClick={() => {
              onSelectTab('dashboard');
              onCloseMobile?.();
            }}
            className="flex items-center gap-3 overflow-hidden text-left focus:outline-none group cursor-pointer"
            title="Go to Overview Dashboard"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#2D0B19] border border-[#A9144B]/60 flex items-center justify-center shrink-0 shadow-sm group-hover:border-[#C4B5FD] transition-colors">
              <img
                src="/src/assets/images/pds_depot_seal_1792736205959.jpg"
                alt="SmartPDS Emblem"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold tracking-tight text-[#F1F5F9] whitespace-nowrap group-hover:text-[#C4B5FD] transition-colors">
                  SmartPDS
                </span>
                <span className="text-[11px] text-[#94A3B8] whitespace-nowrap truncate">
                  FIFO Commodity Engine
                </span>
              </div>
            )}
          </button>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-md text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#A9144B] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Drawer Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex lg:hidden p-1.5 rounded-md text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#A9144B] transition-colors cursor-pointer"
            title="Close navigation drawer"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warehouse Location Identifier */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-4 py-2.5 bg-[#3B1221]/80 border-b border-[#263449] shrink-0">
            <div className="text-[10px] font-semibold tracking-wider text-[#C4B5FD] uppercase">
              Depot Base
            </div>
            <div className="text-xs font-medium text-[#F1F5F9] truncate">
              FCI Base Depot #4 Hubballi
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
          {/* 1. Dashboard (Single Top-Level Item) */}
          <button
            onClick={() => {
              onSelectTab('dashboard');
              onCloseMobile?.();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left group cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-[#A9144B] text-white shadow-sm ring-1 ring-[#C4B5FD]/40'
                : 'text-[#CBD5E1] hover:bg-[#A9144B]/40 hover:text-white'
            }`}
            title={isCollapsed && !isMobileOpen ? 'Dashboard' : undefined}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentTab === 'dashboard' ? 'text-[#C4B5FD]' : ''}`} />
            {(!isCollapsed || isMobileOpen) && <span>Overview Dashboard</span>}
          </button>

          {/* 2 - 7. Accordion Groups */}
          {navGroups.map((group) => {
            const isGroupActive = activeParent === group.id;
            const isOpen = openGroups[group.id] || false;

            return (
              <div key={group.id} className="pt-1">
                {/* Group Header Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isCollapsed && !isMobileOpen) {
                      onToggleCollapse();
                    } else {
                      toggleGroup(group.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    isGroupActive
                      ? 'text-[#C4B5FD] bg-[#3B1221]'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#A9144B]/25'
                  }`}
                  title={isCollapsed && !isMobileOpen ? group.label : undefined}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span>{group.icon}</span>
                    {(!isCollapsed || isMobileOpen) && <span className="truncate">{group.label}</span>}
                  </div>

                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {group.badge !== undefined && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#3B1221] text-[#C4B5FD] rounded">
                          {group.badge}
                        </span>
                      )}
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-70" /> : <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                    </div>
                  )}
                </button>

                {/* Sub-Items List */}
                {(!isCollapsed || isMobileOpen) && isOpen && (
                  <div className="pl-3 mt-1 space-y-0.5 border-l border-[#A9144B]/35 ml-4">
                    {group.items.map((sub) => {
                      const isActive = isTabActive(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            onSelectTab(sub.id);
                            onCloseMobile?.();
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left cursor-pointer ${
                            isActive
                              ? 'bg-[#A9144B] text-white font-semibold ring-1 ring-[#C4B5FD]/40 shadow-xs'
                              : 'text-[#CBD5E1] hover:bg-[#A9144B]/30 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={isActive ? 'text-[#C4B5FD]' : 'opacity-80'}>
                              {sub.icon}
                            </span>
                            <span className="truncate">{sub.label}</span>
                          </div>

                          {sub.badge !== undefined && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-mono shrink-0 ml-1.5 ${
                                isActive
                                  ? 'bg-[#3B1221] text-[#C4B5FD]'
                                  : sub.badgeVariant === 'warning'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                  : 'bg-[#3B1221] text-[#94A3B8]'
                              }`}
                            >
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile & Role Footer */}
        <div className="p-3 border-t border-[#263449] bg-[#3B1221] shrink-0">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#2D0B19] border border-[#C4B5FD]/40 flex items-center justify-center text-[#C4B5FD] shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#F1F5F9] truncate">
                    {currentUser?.name ||
                      (currentRole === 'Administrator'
                        ? 'Sunil K. Verma'
                        : currentRole === 'Warehouse Operator'
                        ? 'Rajesh V.'
                        : 'Shankar Gowda')}
                  </div>
                  <div className="text-[11px] text-[#C4B5FD] truncate font-medium">
                    {currentRole}
                  </div>
                </div>
              )}
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <button
                type="button"
                onClick={() => logout()}
                className="p-1.5 text-[#94A3B8] hover:text-rose-400 hover:bg-[#141D2A] rounded-lg transition-colors cursor-pointer shrink-0"
                title="Sign Out to Landing Page"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
