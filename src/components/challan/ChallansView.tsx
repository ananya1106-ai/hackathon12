import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DispatchRecord } from '../../types';
import {
  FileText,
  Search,
  Printer,
  Eye,
  Truck,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Download,
  Building2,
  Database,
  Filter,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  Scale,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface ChallansViewProps {
  onOpenDispatchTab: () => void;
}

export const ChallansView: React.FC<ChallansViewProps> = ({ onOpenDispatchTab }) => {
  const {
    dispatches,
    setActiveChallan,
    currentRole,
    firebaseStatus,
    seedHackathonDemoData,
    isSeedingDemo,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [recordTypeFilter, setRecordTypeFilter] = useState<'ALL' | 'LIVE' | 'DEMO'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'QUANTITY_DESC'>('NEWEST');

  // Compute Summary Statistics
  const stats = useMemo(() => {
    const totalCount = dispatches.length;
    const liveCount = dispatches.filter((d) => !d.isDemo).length;
    const demoCount = dispatches.filter((d) => d.isDemo).length;
    const totalBags = dispatches.reduce((acc, d) => acc + (d.totalBags || 0), 0);
    const totalQtl = dispatches.reduce((acc, d) => acc + (d.totalQtl || 0), 0);
    const uniqueFps = new Set(dispatches.map((d) => d.destinationFpsId)).size;

    return {
      totalCount,
      liveCount,
      demoCount,
      totalBags,
      totalQtl: Number(totalQtl.toFixed(2)),
      uniqueFps,
    };
  }, [dispatches]);

  // Filter & Sort Dispatches
  const filteredDispatches = useMemo(() => {
    return dispatches
      .filter((d) => {
        // Commodity filter
        if (commodityFilter !== 'ALL' && d.commodity !== commodityFilter) return false;

        // Status filter
        if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;

        // Record type filter (Live vs Demo)
        if (recordTypeFilter === 'LIVE' && d.isDemo) return false;
        if (recordTypeFilter === 'DEMO' && !d.isDemo) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesChallan = d.challanNumber.toLowerCase().includes(q);
          const matchesGatePass = d.gatePassNo.toLowerCase().includes(q);
          const matchesFps =
            d.destinationName.toLowerCase().includes(q) ||
            d.destinationFpsId.toLowerCase().includes(q);
          const matchesVehicle = d.vehicleNumber.toLowerCase().includes(q);
          const matchesDriver = d.driverName.toLowerCase().includes(q);
          const matchesTransporter = (d.transporterAgency || '').toLowerCase().includes(q);
          const matchesBatches = d.allocatedBatches.some((b) =>
            b.batchId.toLowerCase().includes(q)
          );

          if (
            !matchesChallan &&
            !matchesGatePass &&
            !matchesFps &&
            !matchesVehicle &&
            !matchesDriver &&
            !matchesTransporter &&
            !matchesBatches
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        if (sortBy === 'OLDEST') {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        if (sortBy === 'QUANTITY_DESC') {
          return b.totalBags - a.totalBags;
        }
        return 0;
      });
  }, [dispatches, commodityFilter, statusFilter, recordTypeFilter, searchQuery, sortBy]);

  const handleQuickPrint = (dispatch: DispatchRecord) => {
    setActiveChallan(dispatch);
    addToast(
      'info',
      'Challan Ready for Printing',
      `Loaded ${dispatch.challanNumber}. Click 'Save as PDF' or 'Print' in the viewer.`
    );
  };

  const handleExportJson = (dispatch: DispatchRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dispatch, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${dispatch.challanNumber}_challan_record.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Export Complete', `Downloaded JSON record for ${dispatch.challanNumber}`);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCommodityFilter('ALL');
    setStatusFilter('ALL');
    setRecordTypeFilter('ALL');
    setSortBy('NEWEST');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#344054] dark:text-[#F1F5F9] tracking-tight">
              Digital Challans & Gate Passes Register
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cloud Firestore Synced
            </span>
          </div>
          <p className="text-xs text-[#707887] dark:text-[#A1AAB9] mt-0.5">
            Official Form PDS-12 statutory release orders, vehicle gate passes, and FIFO batch movements
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenDispatchTab}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#702D3B] hover:bg-[#54212D] dark:bg-[#801B3A] dark:hover:bg-[#9E2248] rounded-lg shadow-xs transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>New FIFO Dispatch</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Challans */}
        <div className="p-4 bg-white dark:bg-[#151C28] rounded-xl border border-[#E7E2DF] dark:border-[#293445] shadow-2xs">
          <div className="flex items-center justify-between text-[#707887] dark:text-[#A1AAB9] text-xs font-medium">
            <span>Total Challans Issued</span>
            <FileText className="w-4 h-4 text-[#702D3B] dark:text-[#C4B5FD]" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-[#344054] dark:text-[#F1F5F9]">
            {stats.totalCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#707887] dark:text-[#A1AAB9]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {stats.liveCount} live
            </span>
            <span>•</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {stats.demoCount} demo
            </span>
          </div>
        </div>

        {/* Card 2: Total Quantity Dispatched */}
        <div className="p-4 bg-white dark:bg-[#151C28] rounded-xl border border-[#E7E2DF] dark:border-[#293445] shadow-2xs">
          <div className="flex items-center justify-between text-[#707887] dark:text-[#A1AAB9] text-xs font-medium">
            <span>Total Dispatched Bags</span>
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-[#344054] dark:text-[#F1F5F9]">
            {stats.totalBags.toLocaleString()} <span className="text-xs font-normal font-sans text-slate-500">bags</span>
          </div>
          <div className="mt-1 text-[10px] text-[#707887] dark:text-[#A1AAB9]">
            Net Weight: <span className="font-bold text-[#344054] dark:text-[#F1F5F9]">{stats.totalQtl} Qtl</span>
          </div>
        </div>

        {/* Card 3: Active Consignee FPS */}
        <div className="p-4 bg-white dark:bg-[#151C28] rounded-xl border border-[#E7E2DF] dark:border-[#293445] shadow-2xs">
          <div className="flex items-center justify-between text-[#707887] dark:text-[#A1AAB9] text-xs font-medium">
            <span>Active Destinations</span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-[#344054] dark:text-[#F1F5F9]">
            {stats.uniqueFps} <span className="text-xs font-normal font-sans text-slate-500">shops</span>
          </div>
          <div className="mt-1 text-[10px] text-[#707887] dark:text-[#A1AAB9]">
            Fair Price Shops served
          </div>
        </div>

        {/* Card 4: Cloud Persistence Mode */}
        <div className="p-4 bg-white dark:bg-[#151C28] rounded-xl border border-[#E7E2DF] dark:border-[#293445] shadow-2xs">
          <div className="flex items-center justify-between text-[#707887] dark:text-[#A1AAB9] text-xs font-medium">
            <span>Firestore Engine</span>
            <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2 text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Atomic Commits</span>
          </div>
          <div className="mt-1 text-[10px] text-[#707887] dark:text-[#A1AAB9] truncate">
            Project: <span className="font-mono font-medium">smartipds (Spark)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#151C28] rounded-xl border border-[#E7E2DF] dark:border-[#293445] shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="relative sm:col-span-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707887] dark:text-[#A1AAB9]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Challan, Pass, FPS, Vehicle, Batch ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF7F2] dark:bg-[#111827] border border-[#E7E2DF] dark:border-[#293445] rounded-lg outline-none focus:bg-white dark:focus:bg-[#151C28] focus:border-[#702D3B] dark:focus:border-[#801B3A] text-[#344054] dark:text-[#F1F5F9] placeholder:text-[#707887] dark:placeholder:text-[#A1AAB9]"
            />
          </div>

          {/* Commodity Filter */}
          <div className="sm:col-span-2">
            <select
              value={commodityFilter}
              onChange={(e) => setCommodityFilter(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 bg-white dark:bg-[#111827] border border-[#E7E2DF] dark:border-[#293445] rounded-lg text-[#344054] dark:text-[#F1F5F9] focus:outline-none focus:border-[#702D3B] dark:focus:border-[#801B3A]"
            >
              <option value="ALL">All Commodities</option>
              <option value="Rice">Rice</option>
              <option value="Wheat">Wheat</option>
              <option value="Sugar">Sugar</option>
              <option value="Kerosene">Kerosene</option>
            </select>
          </div>

          {/* Record Type Filter (Live vs Demo) */}
          <div className="sm:col-span-2">
            <select
              value={recordTypeFilter}
              onChange={(e) => setRecordTypeFilter(e.target.value as 'ALL' | 'LIVE' | 'DEMO')}
              className="w-full text-xs py-1.5 px-2.5 bg-white dark:bg-[#111827] border border-[#E7E2DF] dark:border-[#293445] rounded-lg text-[#344054] dark:text-[#F1F5F9] focus:outline-none focus:border-[#702D3B] dark:focus:border-[#801B3A]"
            >
              <option value="ALL">All Records (Live & Demo)</option>
              <option value="LIVE">Live Records Only</option>
              <option value="DEMO">Demo Fixtures Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 bg-white dark:bg-[#111827] border border-[#E7E2DF] dark:border-[#293445] rounded-lg text-[#344054] dark:text-[#F1F5F9] focus:outline-none focus:border-[#702D3B] dark:focus:border-[#801B3A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Dispatched">Dispatched</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs py-1.5 px-1.5 bg-white dark:bg-[#111827] border border-[#E7E2DF] dark:border-[#293445] rounded-lg text-[#344054] dark:text-[#F1F5F9] focus:outline-none focus:border-[#702D3B] dark:focus:border-[#801B3A]"
            >
              <option value="NEWEST">Newest</option>
              <option value="OLDEST">Oldest</option>
              <option value="QUANTITY_DESC">Quantity</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators & Reset */}
        {(searchQuery || commodityFilter !== 'ALL' || statusFilter !== 'ALL' || recordTypeFilter !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-[#E7E2DF] dark:border-[#293445] text-xs">
            <div className="text-[#707887] dark:text-[#A1AAB9]">
              Showing <span className="font-bold text-[#344054] dark:text-[#F1F5F9]">{filteredDispatches.length}</span> of{' '}
              {dispatches.length} challans
            </div>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-[#702D3B] dark:text-[#C4B5FD] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Dispatches Table */}
      <div className="bg-white dark:bg-[#151C28] rounded-xl border border-[#E7E2DF] dark:border-[#293445] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] dark:bg-[#111827] border-b border-[#E7E2DF] dark:border-[#293445] text-[#707887] dark:text-[#A1AAB9] font-semibold">
              <tr>
                <th className="py-3 px-4">Challan Reference</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Destination (FPS)</th>
                <th className="py-3 px-3">Commodity</th>
                <th className="py-3 px-3 text-right">Net Quantity</th>
                <th className="py-3 px-3">Allocated Batches (FIFO)</th>
                <th className="py-3 px-3">Carrier / Vehicle</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2DF] dark:divide-[#293445]">
              {filteredDispatches.length > 0 ? (
                filteredDispatches.map((dispatch) => (
                  <tr
                    key={dispatch.challanNumber}
                    className="hover:bg-[#FAF7F2]/80 dark:hover:bg-[#1E293B]/60 transition-colors"
                  >
                    {/* Challan Ref */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#702D3B] dark:text-[#C4B5FD]">
                          {dispatch.challanNumber}
                        </span>
                        {dispatch.isDemo ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            DEMO
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#707887] dark:text-[#A1AAB9] font-mono mt-0.5">
                        Pass: {dispatch.gatePassNo}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 font-mono text-[#344054] dark:text-[#CBD5E1]">
                      {dispatch.timestamp.split('T')[0]}
                      <div className="text-[10px] text-[#707887] dark:text-[#A1AAB9]">
                        {dispatch.timestamp.split('T')[1]?.slice(0, 5)}
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#344054] dark:text-[#F1F5F9] truncate max-w-[160px]">
                        {dispatch.destinationName}
                      </div>
                      <div className="text-[10px] text-[#707887] dark:text-[#A1AAB9] font-mono">
                        {dispatch.destinationFpsId}
                      </div>
                    </td>

                    {/* Commodity */}
                    <td className="py-3 px-3">
                      <div className="text-[#344054] dark:text-[#F1F5F9] font-medium">
                        {dispatch.commodity}
                      </div>
                      <div className="text-[10px] text-[#707887] dark:text-[#A1AAB9]">
                        {dispatch.variety}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <div className="font-bold text-[#344054] dark:text-[#F1F5F9]">
                        {dispatch.totalBags} bags
                      </div>
                      <div className="text-[10px] text-[#707887] dark:text-[#A1AAB9]">
                        {dispatch.totalQtl} Qtl
                      </div>
                    </td>

                    {/* Batch breakdown */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {dispatch.allocatedBatches.map((b) => (
                          <span
                            key={b.batchId}
                            className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#FAF7F2] dark:bg-[#111827] border border-[#E7E2DF] dark:border-[#293445] text-[10px] font-mono text-[#344054] dark:text-[#F1F5F9]"
                          >
                            <span className="font-bold text-[#702D3B] dark:text-[#C4B5FD] mr-1">
                              {b.batchId}
                            </span>
                            ({b.bags}b)
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Carrier / Vehicle */}
                    <td className="py-3 px-3">
                      <div className="font-mono text-[#344054] dark:text-[#CBD5E1]">
                        {dispatch.vehicleNumber}
                      </div>
                      <div className="text-[10px] text-[#707887] dark:text-[#A1AAB9] truncate max-w-[130px]">
                        {dispatch.driverName}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{dispatch.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActiveChallan(dispatch)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#702D3B] dark:text-[#C4B5FD] bg-[#FAF2F4] dark:bg-[#3B1020]/60 hover:bg-[#f3e4e8] dark:hover:bg-[#3B1020] border border-[#E7E2DF] dark:border-[#801B3A]/60 rounded-md transition-colors"
                          title="View and reprint digital challan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleQuickPrint(dispatch)}
                          className="p-1 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Print challan document"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleExportJson(dispatch, e)}
                          className="p-1 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Download JSON record"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : dispatches.length === 0 ? (
                /* Honest Empty State when Cloud Firestore has 0 dispatches */
                <tr>
                  <td colSpan={9} className="py-14 text-center px-4">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-500 dark:text-slate-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#344054] dark:text-[#F1F5F9]">
                          No Digital Challans Recorded in Cloud Firestore
                        </h3>
                        <p className="text-xs text-[#707887] dark:text-[#A1AAB9] mt-1 leading-relaxed">
                          No commodity dispatches have been authorized in this depot yet. When an authorized operator initiates an allocation, the FIFO engine recalculates current stock, performs atomic deductions in Firestore, and generates the official digital Form PDS-12 challan here.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                        <button
                          onClick={onOpenDispatchTab}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#702D3B] hover:bg-[#54212D] dark:bg-[#801B3A] dark:hover:bg-[#9E2248] rounded-lg shadow-xs transition-colors"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          <span>Open FIFO Dispatch Engine</span>
                        </button>
                        <button
                          onClick={() => seedHackathonDemoData()}
                          disabled={isSeedingDemo}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-300 dark:border-amber-800 rounded-lg transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>{isSeedingDemo ? 'Seeding Demo Data...' : 'Seed Hackathon Demo Stock'}</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Empty state when filters produce zero results */
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#707887] dark:text-[#A1AAB9]">
                    <Search className="w-8 h-8 mx-auto text-[#707887]/50 dark:text-[#A1AAB9]/50 mb-2" />
                    <div className="text-sm font-semibold text-[#344054] dark:text-[#F1F5F9]">
                      No challans match the current filters
                    </div>
                    <div className="text-xs text-[#707887] dark:text-[#A1AAB9] mt-1">
                      Try loosening your search terms or resetting the commodity/status filters.
                    </div>
                    <button
                      onClick={resetFilters}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#702D3B] dark:text-[#C4B5FD] bg-[#FAF2F4] dark:bg-[#3B1020] border border-[#E7E2DF] dark:border-[#801B3A] rounded-lg"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
