import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Boxes,
  ArrowRightLeft,
  AlertTriangle,
  Clock,
  PlusCircle,
  FileText,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Scale,
  Bot,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';

interface OverviewDashboardProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenReceiptModal: () => void;
  onSelectBatchIdForDetails: (batchId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigateTab,
  onOpenReceiptModal,
  onSelectBatchIdForDetails,
}) => {
  const { batches, dispatches, setActiveChallan, fifoExceptions, approvalRequests, auditLogs } = useApp();

  // Metrics computation
  const eligibleBatches = batches.filter((b) => b.status === 'Eligible' && b.availableBags > 0);
  const totalEligibleBags = eligibleBatches.reduce((acc, b) => acc + b.availableBags, 0);
  const totalEligibleQtl = Number(
    eligibleBatches.reduce((acc, b) => acc + b.availableQtl, 0).toFixed(2)
  );

  const quarantinedBatches = batches.filter((b) => b.status === 'Quarantined');
  const damagedBatches = batches.filter((b) => b.status === 'Damaged');
  const lockedStockBags = [...quarantinedBatches, ...damagedBatches].reduce(
    (acc, b) => acc + b.availableBags,
    0
  );

  const ageingCriticalBatches = eligibleBatches.filter((b) => b.stockAgeDays >= 90);
  const ageingCriticalBags = ageingCriticalBatches.reduce((acc, b) => acc + b.availableBags, 0);

  // Oldest eligible batch in queue (FIFO Priority #1)
  const sortedEligible = [...eligibleBatches].sort((a, b) => {
    return new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime();
  });
  const topFifoBatch = sortedEligible[0];

  // Commodity breakdown
  const riceEligible = eligibleBatches.filter((b) => b.commodity === 'Rice');
  const riceBags = riceEligible.reduce((acc, b) => acc + b.availableBags, 0);
  const riceQtl = Number(riceEligible.reduce((acc, b) => acc + b.availableQtl, 0).toFixed(2));

  const wheatEligible = eligibleBatches.filter((b) => b.commodity === 'Wheat');
  const wheatBags = wheatEligible.reduce((acc, b) => acc + b.availableBags, 0);
  const wheatQtl = Number(wheatEligible.reduce((acc, b) => acc + b.availableQtl, 0).toFixed(2));

  const pendingExceptionsCount = fifoExceptions.filter((e) => e.status === 'Pending Approval').length;
  const pendingApprovalsCount = approvalRequests.filter((a) => a.status === 'Pending').length;

  // Ageing bracket breakdown
  const age0to30 = eligibleBatches.filter((b) => b.stockAgeDays <= 30).length;
  const age31to60 = eligibleBatches.filter((b) => b.stockAgeDays > 30 && b.stockAgeDays <= 60).length;
  const age61to90 = eligibleBatches.filter((b) => b.stockAgeDays > 60 && b.stockAgeDays <= 90).length;
  const age90plus = eligibleBatches.filter((b) => b.stockAgeDays > 90).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Notice with 4 Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-[#FAF2F4] dark:bg-[#0D1420] border border-[#E8CCD2] dark:border-[#263449] shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#A9144B] text-white shrink-0 mt-0.5">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#344054] dark:text-[#F1F5F9]">
                Autonomous FIFO Allocation Protocol Engaged
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                <span>98.4% FIFO Compliance</span>
              </span>
            </div>
            <p className="text-xs text-[#707887] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
              District Base Depot #4 Hubballi operates under strict National Food Security Act (NFSA) FIFO rules.
              Batches are strictly allocated by inward intake date; quarantined lots are locked.
            </p>
          </div>
        </div>

        {/* 4 Quick Actions Cluster */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('dispatch-create')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] active:bg-[#4A182A] rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            title="Launch FIFO Dispatch Wizard"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>FIFO Dispatch</span>
          </button>
          <button
            onClick={() => onNavigateTab('inv-receipts')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#344054] dark:text-[#F1F5F9] bg-white dark:bg-[#141D2A] hover:bg-[#FAF7F2] dark:hover:bg-[#1E293B] border border-[#E7E2DF] dark:border-[#263449] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Record Inward Rake Intake"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#A9144B] dark:text-[#C4B5FD]" />
            <span>Inward Receipt</span>
          </button>
          <button
            onClick={() => onNavigateTab('inv-reconciliation')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#344054] dark:text-[#F1F5F9] bg-white dark:bg-[#141D2A] hover:bg-[#FAF7F2] dark:hover:bg-[#1E293B] border border-[#E7E2DF] dark:border-[#263449] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Physical Stack Count Audit"
          >
            <Scale className="w-3.5 h-3.5 text-[#A9144B] dark:text-[#C4B5FD]" />
            <span>Reconciliation</span>
          </button>
          <button
            onClick={() => onNavigateTab('ai-copilot')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#A9144B] dark:text-[#C4B5FD] bg-[#FAF7F2] dark:bg-[#141D2A] hover:bg-[#F3EFEA] dark:hover:bg-[#1E293B] border border-[#A9144B]/30 dark:border-[#263449] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Launch AI Inventory Copilot"
          >
            <Bot className="w-3.5 h-3.5 text-[#A9144B] dark:text-[#C4B5FD]" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <button
          onClick={() => onNavigateTab('inv-stock')}
          className="p-5 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E7E2DF] dark:border-[#263449] hover:border-[#A9144B]/50 dark:hover:border-[#C4B5FD]/40 shadow-2xs text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#707887] dark:text-[#94A3B8] font-medium">
            <span className="group-hover:text-[#A9144B] dark:group-hover:text-[#C4B5FD] transition-colors">Total Allocatable Stock</span>
            <Boxes className="w-4 h-4 text-[#A9144B] dark:text-[#C4B5FD]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#344054] dark:text-[#F1F5F9] font-mono tabular-nums">
              {totalEligibleQtl.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-[#707887] dark:text-[#94A3B8]">Quintals</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-[#707887] dark:text-[#94A3B8]">
            <span className="font-mono tabular-nums font-semibold text-[#344054] dark:text-[#F1F5F9]">
              {totalEligibleBags.toLocaleString()}
            </span>
            <span>standard 50kg bags ({totalEligibleBags * 50} kg)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E7E2DF] dark:border-[#263449] flex items-center justify-between text-[11px] text-[#707887] dark:text-[#94A3B8]">
            <span>Rice: {riceQtl} Qtl</span>
            <span>Wheat: {wheatQtl} Qtl</span>
          </div>
        </button>

        {/* Active Batches */}
        <button
          onClick={() => onNavigateTab('fifo-queue')}
          className="p-5 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E7E2DF] dark:border-[#263449] hover:border-emerald-500/50 shadow-2xs text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#707887] dark:text-[#94A3B8] font-medium">
            <span className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Active Eligible Batches</span>
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#344054] dark:text-[#F1F5F9] font-mono tabular-nums">
              {eligibleBatches.length}
            </span>
            <span className="text-xs font-medium text-[#707887] dark:text-[#94A3B8]">of {batches.length} total</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <span>View FIFO queue &rarr;</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E7E2DF] dark:border-[#263449] flex items-center justify-between text-[11px] text-[#707887] dark:text-[#94A3B8]">
            <span>Locked/Quarantine:</span>
            <span className="font-mono tabular-nums font-semibold text-amber-700 dark:text-amber-400">
              {quarantinedBatches.length + damagedBatches.length} batches ({lockedStockBags} bags)
            </span>
          </div>
        </button>

        {/* Ageing Stock Alert */}
        <button
          onClick={() => onNavigateTab('rep-ageing')}
          className="p-5 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E7E2DF] dark:border-[#263449] hover:border-amber-500/50 shadow-2xs text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#707887] dark:text-[#94A3B8] font-medium">
            <span className="group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Ageing Stock Alerts (&gt;90d)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400 font-mono tabular-nums">
              {ageingCriticalBatches.length}
            </span>
            <span className="text-xs font-medium text-[#707887] dark:text-[#94A3B8]">urgent batches</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#707887] dark:text-[#94A3B8]">
            <span className="font-mono tabular-nums font-semibold text-[#344054] dark:text-[#F1F5F9]">
              {ageingCriticalBags.toLocaleString()}
            </span>
            <span>bags require priority clearance</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E7E2DF] dark:border-[#263449] flex items-center justify-between text-[11px] text-[#707887] dark:text-[#94A3B8]">
            <span>Oldest age:</span>
            <span className="font-mono tabular-nums font-bold text-amber-800 dark:text-amber-300">
              {topFifoBatch ? `${topFifoBatch.stockAgeDays} days` : 'None'}
            </span>
          </div>
        </button>

        {/* Total Dispatches */}
        <button
          onClick={() => onNavigateTab('dispatch-challans')}
          className="p-5 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E7E2DF] dark:border-[#263449] hover:border-[#A9144B]/50 dark:hover:border-[#C4B5FD]/40 shadow-2xs text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#707887] dark:text-[#94A3B8] font-medium">
            <span className="group-hover:text-[#A9144B] dark:group-hover:text-[#C4B5FD] transition-colors">Total Completed Challans</span>
            <FileText className="w-4 h-4 text-[#A9144B] dark:text-[#C4B5FD]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#344054] dark:text-[#F1F5F9] font-mono tabular-nums">
              {dispatches.length}
            </span>
            <span className="text-xs font-medium text-[#707887] dark:text-[#94A3B8]">challans issued</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#707887] dark:text-[#94A3B8]">
            <span className="font-mono tabular-nums font-semibold text-[#344054] dark:text-[#F1F5F9]">
              {dispatches.reduce((acc, d) => acc + d.totalBags, 0)}
            </span>
            <span>bags moved to FPS</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E7E2DF] dark:border-[#263449] flex items-center justify-between text-[11px] text-[#A9144B] dark:text-[#C4B5FD]">
            <span>View challan register &rarr;</span>
          </div>
        </button>
      </div>

      {/* FIFO Priority Banner & Commodity Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Batch in FIFO Queue Spotlight */}
        <div className="lg:col-span-1 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E7E2DF] dark:border-[#263449] shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E2DF] dark:border-[#263449]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C4B5FD]" />
                <span className="text-xs font-bold text-[#344054] dark:text-[#F1F5F9] uppercase tracking-wider">
                  Top FIFO Queue Candidate
                </span>
              </div>
              <span className="text-[11px] text-[#A9144B] dark:text-[#C4B5FD] font-semibold bg-[#FAF2F4] dark:bg-[#3B1221] px-2 py-0.5 rounded border border-[#E8CCD2] dark:border-[#A9144B]/40">
                Priority 1
              </span>
            </div>

            {topFifoBatch ? (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-lg font-bold text-[#344054] dark:text-[#F1F5F9] font-mono">
                    {topFifoBatch.id}
                  </div>
                  <div className="text-xs text-[#707887] dark:text-[#94A3B8] mt-0.5">
                    {topFifoBatch.commodity} · {topFifoBatch.variety}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 bg-[#FAF7F2] dark:bg-[#0D1420] rounded-lg border border-[#E7E2DF] dark:border-[#263449] text-xs">
                  <div>
                    <span className="text-[#707887] dark:text-[#94A3B8] block text-[10px]">Received On</span>
                    <span className="font-semibold text-[#344054] dark:text-[#F1F5F9] font-mono">{topFifoBatch.receivedDate}</span>
                  </div>
                  <div>
                    <span className="text-[#707887] dark:text-[#94A3B8] block text-[10px]">Stock Age</span>
                    <span className="font-bold text-amber-800 dark:text-amber-400 font-mono">{topFifoBatch.stockAgeDays} Days</span>
                  </div>
                  <div>
                    <span className="text-[#707887] dark:text-[#94A3B8] block text-[10px]">Available</span>
                    <span className="font-semibold text-[#344054] dark:text-[#F1F5F9] font-mono">{topFifoBatch.availableBags} Bags</span>
                  </div>
                  <div>
                    <span className="text-[#707887] dark:text-[#94A3B8] block text-[10px]">Stack Bay</span>
                    <span className="font-semibold text-[#344054] dark:text-[#F1F5F9]">{topFifoBatch.depotLocation}</span>
                  </div>
                </div>

                <div className="text-xs text-[#707887] dark:text-[#94A3B8] leading-relaxed bg-[#FAF2F4] dark:bg-[#3B1221] p-2.5 rounded-lg border border-[#E8CCD2] dark:border-[#A9144B]/40">
                  <span className="font-semibold text-[#A9144B] dark:text-[#C4B5FD]">FIFO Compliance Rule:</span> Any new dispatch request for {topFifoBatch.commodity} ({topFifoBatch.variety}) will deplete this batch first before newer stock is drawn.
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#707887] dark:text-[#94A3B8]">
                No active eligible batches found.
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-[#E7E2DF] dark:border-[#263449] flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('dispatch')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] active:bg-[#4A182A] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Dispatch This Batch</span>
            </button>
            {topFifoBatch && (
              <button
                onClick={() => onSelectBatchIdForDetails(topFifoBatch.id)}
                className="px-3 py-2 text-xs font-medium text-[#344054] dark:text-[#CBD5E1] bg-[#FAF7F2] dark:bg-[#0D1420] hover:bg-[#F3EFEA] dark:hover:bg-[#1E293B] border border-[#E7E2DF] dark:border-[#263449] rounded-lg transition-colors cursor-pointer"
              >
                Inspect
              </button>
            )}
          </div>
        </div>

        {/* Commodity Stock & Batch Ageing Breakdown */}
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E7E2DF] dark:border-[#263449] shadow-2xs p-5 space-y-6">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E2DF] dark:border-[#263449]">
              <span className="text-xs font-bold text-[#344054] dark:text-[#F1F5F9] uppercase tracking-wider">
                Commodity Stock Reserves
              </span>
              <span className="text-[11px] text-[#707887] dark:text-[#94A3B8] font-mono">
                Total: {totalEligibleQtl} Quintals
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* Rice Progress Card */}
              <div className="p-4 rounded-lg bg-[#FAF7F2] dark:bg-[#0D1420] border border-[#E7E2DF] dark:border-[#263449]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#344054] dark:text-[#F1F5F9]">Rice (Grade A & Raw)</span>
                  <span className="text-xs font-mono font-semibold text-[#A9144B] dark:text-[#C4B5FD]">{riceQtl} Qtl</span>
                </div>
                <div className="mt-2 text-xs text-[#707887] dark:text-[#94A3B8] flex justify-between">
                  <span>{riceBags} bags available</span>
                  <span>{Math.round((riceBags / (totalEligibleBags || 1)) * 100)}% share</span>
                </div>
                <div className="w-full h-2 bg-[#E7E2DF] dark:bg-[#263449] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[#A9144B] rounded-full"
                    style={{ width: `${Math.min(100, (riceBags / (totalEligibleBags || 1)) * 100)}%` }}
                  />
                </div>
                <div className="mt-3 pt-2 border-t border-[#E7E2DF] dark:border-[#263449] flex items-center justify-between text-[11px] text-[#707887] dark:text-[#94A3B8]">
                  <span>Eligible: {riceEligible.length} batches</span>
                  <button
                    onClick={() => onNavigateTab('stock')}
                    className="text-[#A9144B] dark:text-[#C4B5FD] hover:underline font-semibold cursor-pointer"
                  >
                    Filter &rarr;
                  </button>
                </div>
              </div>

              {/* Wheat Progress Card */}
              <div className="p-4 rounded-lg bg-[#FAF7F2] dark:bg-[#0D1420] border border-[#E7E2DF] dark:border-[#263449]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#344054] dark:text-[#F1F5F9]">Wheat (Lokwan & Durum)</span>
                  <span className="text-xs font-mono font-semibold text-[#C4B5FD]">{wheatQtl} Qtl</span>
                </div>
                <div className="mt-2 text-xs text-[#707887] dark:text-[#94A3B8] flex justify-between">
                  <span>{wheatBags} bags available</span>
                  <span>{Math.round((wheatBags / (totalEligibleBags || 1)) * 100)}% share</span>
                </div>
                <div className="w-full h-2 bg-[#E7E2DF] dark:bg-[#263449] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[#C4B5FD] rounded-full"
                    style={{ width: `${Math.min(100, (wheatBags / (totalEligibleBags || 1)) * 100)}%` }}
                  />
                </div>
                <div className="mt-3 pt-2 border-t border-[#E7E2DF] dark:border-[#263449] flex items-center justify-between text-[11px] text-[#707887] dark:text-[#94A3B8]">
                  <span>Eligible: {wheatEligible.length} batches</span>
                  <button
                    onClick={() => onNavigateTab('stock')}
                    className="text-[#A9144B] dark:text-[#C4B5FD] hover:underline font-semibold cursor-pointer"
                  >
                    Filter &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Ageing Horizon */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E2DF] dark:border-[#263449]">
              <span className="text-xs font-bold text-[#344054] dark:text-[#F1F5F9] uppercase tracking-wider">
                Batch Ageing Summary (Days in Depot)
              </span>
              <span className="text-[11px] text-[#707887] dark:text-[#94A3B8]">
                Oldest stock dispatched first
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-[#FAF7F2] dark:bg-[#0D1420] rounded-lg border border-[#E7E2DF] dark:border-[#263449] text-center">
                <span className="text-[11px] text-[#707887] dark:text-[#94A3B8] block font-medium">0 - 30 Days</span>
                <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 block">{age0to30}</span>
                <span className="text-[10px] text-[#707887] dark:text-[#94A3B8]">Fresh intake</span>
              </div>
              <div className="p-3 bg-[#FAF7F2] dark:bg-[#0D1420] rounded-lg border border-[#E7E2DF] dark:border-[#263449] text-center">
                <span className="text-[11px] text-[#707887] dark:text-[#94A3B8] block font-medium">31 - 60 Days</span>
                <span className="text-lg font-bold font-mono text-[#A9144B] dark:text-[#C4B5FD] mt-0.5 block">{age31to60}</span>
                <span className="text-[10px] text-[#707887] dark:text-[#94A3B8]">Standard reserve</span>
              </div>
              <div className="p-3 bg-[#FAF7F2] dark:bg-[#0D1420] rounded-lg border border-[#E7E2DF] dark:border-[#263449] text-center">
                <span className="text-[11px] text-[#707887] dark:text-[#94A3B8] block font-medium">61 - 90 Days</span>
                <span className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5 block">{age61to90}</span>
                <span className="text-[10px] text-[#707887] dark:text-[#94A3B8]">Active allocation</span>
              </div>
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/60 text-center">
                <span className="text-[11px] text-amber-900 dark:text-amber-300 block font-medium">90+ Days</span>
                <span className="text-lg font-bold font-mono text-rose-700 dark:text-rose-400 mt-0.5 block">{age90plus}</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Priority Clearance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Dispatches & Quality Quarantine Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Dispatches Table */}
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E7E2DF] dark:border-[#263449] shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#E7E2DF] dark:border-[#263449]">
            <div>
              <h3 className="text-xs font-bold text-[#344054] dark:text-[#F1F5F9] uppercase tracking-wider">
                Recent PDS Dispatches
              </h3>
              <p className="text-[11px] text-[#707887] dark:text-[#94A3B8] mt-0.5">
                Challans generated under verified FIFO allocation
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('challans')}
              className="text-xs font-semibold text-[#A9144B] dark:text-[#C4B5FD] hover:text-[#8D103E] flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] dark:bg-[#0D1420] border-b border-[#E7E2DF] dark:border-[#263449] text-[#707887] dark:text-[#94A3B8] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Challan No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Destination (FPS)</th>
                  <th className="py-2.5 px-3">Commodity</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E2DF] dark:divide-[#263449]">
                {dispatches.slice(0, 4).map((d) => (
                  <tr key={d.challanNumber} className="hover:bg-[#FAF7F2]/80 dark:hover:bg-[#1E293B]/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-[#A9144B] dark:text-[#C4B5FD]">
                      {d.challanNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#707887] dark:text-[#94A3B8]">
                      {d.timestamp.split('T')[0]}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#344054] dark:text-[#F1F5F9] truncate max-w-[180px]">
                      {d.destinationName}
                    </td>
                    <td className="py-2.5 px-3 text-[#707887] dark:text-[#94A3B8]">
                      {d.commodity} ({d.variety})
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#344054] dark:text-[#F1F5F9] tabular-nums">
                      {d.totalBags} bags ({d.totalQtl} Qtl)
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setActiveChallan(d)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#A9144B] dark:text-[#C4B5FD] bg-[#FAF2F4] dark:bg-[#3B1221] hover:bg-[#F5E5E8] dark:hover:bg-[#4A182A] rounded-md transition-colors border border-[#E8CCD2] dark:border-[#A9144B]/40 cursor-pointer"
                      >
                        Challan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Barred Stock / Quality Quarantine Notice */}
        <div className="lg:col-span-1 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E7E2DF] dark:border-[#263449] shadow-2xs p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E7E2DF] dark:border-[#263449] text-[#344054] dark:text-[#F1F5F9] font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Non-Allocatable Stock Locks</span>
          </div>
          <p className="text-xs text-[#707887] dark:text-[#94A3B8] mt-2 leading-relaxed">
            PDS quality protocols bar damaged or quarantined grain from the FIFO allocation pipeline.
          </p>

          <div className="mt-4 space-y-3">
            {quarantinedBatches.map((qb) => (
              <div
                key={qb.id}
                className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-lg text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-amber-900 dark:text-amber-300">
                  <span className="font-mono">{qb.id}</span>
                  <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-mono">
                    Quarantined
                  </span>
                </div>
                <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                  Moisture: <span className="font-mono font-bold">{qb.moisturePercentage}%</span> (threshold 12.0%). {qb.availableBags} bags locked in {qb.depotLocation}.
                </div>
              </div>
            ))}

            {damagedBatches.map((db) => (
              <div
                key={db.id}
                className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 rounded-lg text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-rose-900 dark:text-rose-300">
                  <span className="font-mono">{db.id}</span>
                  <span className="text-[10px] bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded font-mono">
                    Damaged
                  </span>
                </div>
                <div className="text-[11px] text-rose-800 dark:text-rose-300 mt-1">
                  {db.statusReason || 'Water ingress damage during monsoon.'} ({db.availableBags} bags in {db.depotLocation}).
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E7E2DF] dark:border-[#263449]">
            <button
              onClick={() => onNavigateTab('stock')}
              className="w-full py-2 text-xs font-semibold text-[#344054] dark:text-[#CBD5E1] bg-[#FAF7F2] dark:bg-[#0D1420] hover:bg-[#F3EFEA] dark:hover:bg-[#1E293B] border border-[#E7E2DF] dark:border-[#263449] rounded-lg transition-colors text-center cursor-pointer"
            >
              Review in Stock Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
