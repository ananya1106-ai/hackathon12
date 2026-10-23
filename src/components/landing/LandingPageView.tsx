import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  Layers,
  ArrowRight,
  Boxes,
  RotateCcw,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  Lock,
  Warehouse,
  Truck,
  FileCheck,
  Search,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Scale,
  Activity,
  ArrowUpRight,
  Sun,
  Moon,
} from 'lucide-react';

export const LandingPageView: React.FC = () => {
  const {
    isAuthenticated,
    setActiveView,
    navigateToAuthWithRole,
    batches,
    dispatches,
    currentRole,
    theme,
    toggleTheme,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  // Compute live depot summary numbers for the preview cards
  const totalAvailableQtl = batches.reduce((acc, b) => (b.status === 'Eligible' ? acc + b.availableQtl : acc), 0);
  const totalAvailableBags = batches.reduce((acc, b) => (b.status === 'Eligible' ? acc + b.availableBags : acc), 0);
  const riceBatches = batches.filter((b) => b.commodity === 'Rice' && b.status === 'Eligible');
  const wheatBatches = batches.filter((b) => b.commodity === 'Wheat' && b.status === 'Eligible');
  const riceQtl = riceBatches.reduce((acc, b) => acc + b.availableQtl, 0);
  const wheatQtl = wheatBatches.reduce((acc, b) => acc + b.availableQtl, 0);
  const oldestEligibleBatch = [...batches]
    .filter((b) => b.status === 'Eligible' && b.availableBags > 0)
    .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime())[0];
  const ageingBatchesCount = batches.filter(
    (b) => b.status === 'Eligible' && b.availableBags > 0 && b.stockAgeDays >= 90
  ).length;

  const handleAccessDashboard = () => {
    if (isAuthenticated) {
      setActiveView('app');
    } else {
      setActiveView('auth');
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const rolesList: Array<{
    role: UserRole;
    title: string;
    designation: string;
    description: string;
    responsibilities: string[];
    badge: string;
  }> = [
    {
      role: 'Administrator',
      title: 'Administrator',
      designation: 'State Systems & Security Directorate',
      description: 'Manage personnel, role clearances, depot settings, system governance, and escalation rules.',
      responsibilities: ['User Provisioning & Role Clearances', 'Depot Storage Thresholds', 'System Governance & Audit', 'Approval Escalation Rules'],
      badge: 'System Governance',
    },
    {
      role: 'Warehouse Operator',
      title: 'Warehouse Operator',
      designation: 'Godown Intake & Stack Custodian',
      description: 'Record grain inward receipts, monitor bay stacks, execute FIFO dispatches, and conduct physical stock audits.',
      responsibilities: ['Electronic Moisture Logging', 'Physical Stack Audits', 'FIFO Issue Order Execution', 'Bay Stack Movements'],
      badge: 'Depot Operations',
    },
    {
      role: 'Ration Shop Dealer',
      title: 'Ration Shop Dealer',
      designation: 'Licensed Fair Price Shop (FPS) Dealer',
      description: 'Track commodity allotments, inspect digital challans, monitor transit deliveries, and report distribution discrepancies.',
      responsibilities: ['Fair Price Shop Allotments', 'Digital Challan Verification', 'Transit Delivery Tracking', 'Return Discrepancy Reporting'],
      badge: 'Fair Price Network',
    },
  ];

  const workflowSteps = [
    {
      id: 'step-1',
      title: 'Inward Receipt',
      tag: '01. Intake Gate',
      description: 'Record incoming rakes, verify supplier manifests, capture digital moisture readings, and auto-quarantine lots failing quality specifications.',
      metric: 'Electronic Moisture Logging & QC Gate',
      icon: <Warehouse className="w-5 h-5 text-[#A9144B] dark:text-[#C4B5FD]" />,
    },
    {
      id: 'step-2',
      title: 'Inventory Management',
      tag: '02. Godown Stacks',
      description: 'Monitor real-time stack registers across bays, stratify commodities by lot age, and execute double-entry ledger transactions.',
      metric: 'Stack-Level Balance & Physical Tallies',
      icon: <Boxes className="w-5 h-5 text-[#A9144B] dark:text-[#C4B5FD]" />,
    },
    {
      id: 'step-3',
      title: 'FIFO Allocation',
      tag: '03. Rotation Engine',
      description: 'Deterministic allocation algorithm prioritises verified older lots first, locking oldest batches to eliminate grain deterioration.',
      metric: '100% Deterministic Oldest-Lot Priority',
      icon: <RotateCcw className="w-5 h-5 text-[#A9144B] dark:text-[#C4B5FD]" />,
    },
    {
      id: 'step-4',
      title: 'PDS Dispatch',
      tag: '04. Fleet Release',
      description: 'Generate tamper-evident Form PDS-12 digital challans, authorize vehicle gate passes, and track transit delivery to Fair Price Shops.',
      metric: 'Digital Challan & GPS Fleet Tracking',
      icon: <Truck className="w-5 h-5 text-[#A9144B] dark:text-[#C4B5FD]" />,
    },
    {
      id: 'step-5',
      title: 'Audit & Reports',
      tag: '05. Vigilance Ledger',
      description: 'Inspect cryptographically hashed event journals, monitor wastage shrinkage, track FIFO exceptions, and export statutory records.',
      metric: 'Immutable Audit Trail & Anomaly Scans',
      icon: <FileCheck className="w-5 h-5 text-[#A9144B] dark:text-[#C4B5FD]" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0B0F17] text-[#0F172A] dark:text-[#F1F5F9] selection:bg-[#A9144B]/30 selection:text-[#C4B5FD] transition-colors duration-200">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0D1420]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#263449] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6 md:gap-8">
          {/* Brand Wordmark & Mark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4A182A] to-[#A9144B] border border-[#A9144B]/40 flex items-center justify-center text-[#C4B5FD] shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg text-[#0F172A] dark:text-[#F1F5F9] tracking-tight leading-tight">
                Smart<span className="text-[#A9144B] dark:text-[#C4B5FD]">PDS</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] font-medium leading-none">
                Civil Supplies Depot
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">
            <button
              onClick={() => scrollToSection('hero')}
              className="hover:text-[#A9144B] dark:hover:text-[#C4B5FD] transition-colors whitespace-nowrap cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-[#A9144B] dark:hover:text-[#C4B5FD] transition-colors whitespace-nowrap cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('fifo-compliance')}
              className="hover:text-[#A9144B] dark:hover:text-[#C4B5FD] transition-colors whitespace-nowrap cursor-pointer"
            >
              FIFO Compliance
            </button>
            <button
              onClick={() => scrollToSection('pds-operations')}
              className="hover:text-[#A9144B] dark:hover:text-[#C4B5FD] transition-colors whitespace-nowrap cursor-pointer"
            >
              PDS Operations
            </button>
            <button
              onClick={() => scrollToSection('security-roles')}
              className="hover:text-[#A9144B] dark:hover:text-[#C4B5FD] transition-colors whitespace-nowrap cursor-pointer"
            >
              Security & Roles
            </button>
          </nav>

          {/* Right Cluster: Theme Toggle & Primary CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] bg-[#F1F5F9] dark:bg-[#141D2A] hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#263449] rounded-lg transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#C4B5FD] animate-in spin-in-90 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-[#7C3AED] animate-in spin-in-90 duration-300" />
              )}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => setActiveView('app')}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] active:bg-[#4A182A] border border-[#A9144B] rounded-lg transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C4B5FD]/40 cursor-pointer"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/90" />
              </button>
            ) : (
              <button
                onClick={() => setActiveView('auth')}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] active:bg-[#4A182A] border border-[#A9144B] rounded-lg transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C4B5FD]/40 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-white/90" />
                <span>Secure Login</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#0D1420] border-b border-[#E2E8F0] dark:border-[#263449] px-4 pt-3 pb-5 space-y-2.5 transition-colors">
            <button
              onClick={() => scrollToSection('hero')}
              className="w-full text-left py-2 text-sm text-[#0F172A] dark:text-[#F1F5F9] font-medium"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="w-full text-left py-2 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#A9144B] dark:hover:text-[#C4B5FD]"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('fifo-compliance')}
              className="w-full text-left py-2 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#A9144B] dark:hover:text-[#C4B5FD]"
            >
              FIFO Compliance
            </button>
            <button
              onClick={() => scrollToSection('pds-operations')}
              className="w-full text-left py-2 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#A9144B] dark:hover:text-[#C4B5FD]"
            >
              PDS Operations
            </button>
            <button
              onClick={() => scrollToSection('security-roles')}
              className="w-full text-left py-2 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#A9144B] dark:hover:text-[#C4B5FD]"
            >
              Security & Roles
            </button>
            <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#263449] flex items-center justify-between gap-3">
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Appearance:</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F1F5F9] dark:bg-[#141D2A] text-[#0F172A] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#263449]"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#C4B5FD]" /> : <Moon className="w-3.5 h-3.5 text-[#7C3AED]" />}
                <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
            </div>
            <div className="pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAccessDashboard();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] rounded-lg"
              >
                <Lock className="w-3.5 h-3.5 text-white/90" />
                <span>{isAuthenticated ? 'Open Dashboard' : 'Secure Login'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Soft background glow accents */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A9144B]/10 dark:bg-[#4A182A]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-[#7C3AED]/10 dark:bg-[#C4B5FD]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-6 space-y-6">
              {/* Eyebrow Label */}
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#7C3AED] dark:text-[#C4B5FD] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] dark:bg-[#C4B5FD]" />
                <span>Smart Public Distribution System</span>
              </div>

              {/* Main Headline - Updated to "Smarter PDS for a Safer Tomorrow." */}
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight leading-[1.15] text-balance">
                Smarter PDS{' '}
                <span className="text-[#7C3AED] dark:text-[#C4B5FD] drop-shadow-[0_2px_14px_rgba(196,181,253,0.22)]">
                  for a Safer Tomorrow.
                </span>
              </h1>

              {/* Supporting Paragraph */}
              <p className="text-base sm:text-lg text-[#475569] dark:text-[#94A3B8] max-w-xl leading-relaxed">
                Manage commodity inventory, enforce FIFO allocation and improve transparency across public distribution warehouses with intelligent, auditable workflows.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleAccessDashboard}
                  className="flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] active:bg-[#4A182A] border border-[#A9144B] rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#C4B5FD]/40 cursor-pointer"
                >
                  <span>Access Your Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-white/90" />
                </button>

                <button
                  onClick={() => scrollToSection('features')}
                  className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] bg-white dark:bg-[#141D2A] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#263449] hover:border-[#C4B5FD]/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                  <span>Explore Features</span>
                </button>
              </div>

              {/* Subtle Trust Statement */}
              <div className="pt-3 flex items-center gap-2.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Built for accountable inventory management and transparent PDS operations.</span>
              </div>
            </div>

            {/* Right Column: Sophisticated Dashboard Preview */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Visual Frame */}
                <div className="bg-white dark:bg-[#141D2A] rounded-xl border border-[#E2E8F0] dark:border-[#263449] shadow-2xl p-4 sm:p-6 space-y-5 transition-colors">
                  {/* Depot Preview Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0] dark:border-[#263449]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <div>
                        <div className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9]">
                          Central Depot #4 — Hubballi Hub
                        </div>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          Civil Supplies Storage & Rake Terminal
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#F8FAFC] dark:bg-[#0D1420] text-[#7C3AED] dark:text-[#C4B5FD] border border-[#E2E8F0] dark:border-[#263449]">
                      FIFO Engine: Strict
                    </span>
                  </div>

                  {/* Compact Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Allocatable Stock */}
                    <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0D1420] border border-[#E2E8F0] dark:border-[#263449]">
                      <div className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                        Allocatable Stock
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="font-mono text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9] tabular-nums">
                          {totalAvailableQtl.toFixed(1)}
                        </span>
                        <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">QTL</span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                        {totalAvailableBags.toLocaleString()} bags in godown
                      </div>
                    </div>

                    {/* FIFO Compliance */}
                    <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0D1420] border border-[#E2E8F0] dark:border-[#263449]">
                      <div className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                        FIFO Compliance
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="font-mono text-xl font-bold text-[#10B981] tabular-nums">
                          100%
                        </span>
                        <span className="text-xs text-[#10B981]">Verified</span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        Deterministic lot selection
                      </div>
                    </div>

                    {/* Eligible Batches */}
                    <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0D1420] border border-[#E2E8F0] dark:border-[#263449]">
                      <div className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                        Eligible Batches
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="font-mono text-xl font-bold text-[#7C3AED] dark:text-[#C4B5FD] tabular-nums">
                          {batches.filter((b) => b.status === 'Eligible' && b.availableBags > 0).length}
                        </span>
                        <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">lots active</span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        QC grade FAQ passed
                      </div>
                    </div>

                    {/* Stock Ageing Watch */}
                    <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0D1420] border border-[#E2E8F0] dark:border-[#263449]">
                      <div className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                        Stock Ageing Alert
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="font-mono text-xl font-bold text-[#F59E0B] tabular-nums">
                          {ageingBatchesCount}
                        </span>
                        <span className="text-xs text-[#F59E0B]">Lots &gt; 90d</span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        High dispatch priority
                      </div>
                    </div>
                  </div>

                  {/* Oldest Batch Priority Highlight */}
                  {oldestEligibleBatch && (
                    <div className="p-3.5 rounded-lg bg-gradient-to-r from-[#A9144B]/10 to-[#F8FAFC] dark:from-[#4A182A]/40 dark:to-[#0D1420] border border-[#A9144B]/30 dark:border-[#A9144B]/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#0F172A] dark:text-[#F1F5F9] flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-[#A9144B] dark:text-[#C4B5FD]" />
                          <span>FIFO Priority #1 Batch</span>
                        </span>
                        <span className="font-mono text-[10px] text-[#A9144B] dark:text-[#C4B5FD] bg-[#A9144B]/15 dark:bg-[#4A182A] px-2 py-0.5 rounded border border-[#A9144B]/30">
                          Age: {oldestEligibleBatch.stockAgeDays} Days
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-mono font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                            {oldestEligibleBatch.id}
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                            {oldestEligibleBatch.commodity} · {oldestEligibleBatch.variety}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-[#A9144B] dark:text-[#C4B5FD]">
                            {oldestEligibleBatch.availableBags} Bags
                          </div>
                          <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                            {oldestEligibleBatch.depotLocation}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Commodity Distribution Balance Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Commodity Distribution</span>
                      <span className="font-mono text-[11px] text-[#7C3AED] dark:text-[#C4B5FD]">
                        Rice: {riceQtl.toFixed(0)} QTL · Wheat: {wheatQtl.toFixed(0)} QTL
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#E2E8F0] dark:bg-[#0D1420] overflow-hidden flex border border-[#E2E8F0] dark:border-[#263449]">
                      <div
                        className="h-full bg-[#A9144B]"
                        style={{
                          width: `${totalAvailableQtl > 0 ? (riceQtl / totalAvailableQtl) * 100 : 60}%`,
                        }}
                        title="Rice Reserve"
                      />
                      <div
                        className="h-full bg-[#C4B5FD]"
                        style={{
                          width: `${totalAvailableQtl > 0 ? (wheatQtl / totalAvailableQtl) * 100 : 40}%`,
                        }}
                        title="Wheat Reserve"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#A9144B]" />
                        <span>Rice (Grade-A & Boiled)</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#C4B5FD]" />
                        <span>Wheat (Sharbati & FAQ)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY STATISTICS STRIP */}
      <section className="border-y border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0D1420] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {/* Stat 1 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C3AED] dark:text-[#C4B5FD]">
                <RotateCcw className="w-3.5 h-3.5 text-[#A9144B] dark:text-[#C4B5FD]" />
                <span>FIFO-Based Allocation</span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Deterministic oldest-lot selection eliminating manual bias and grain spoilage.
              </p>
            </div>

            {/* Stat 2 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C3AED] dark:text-[#C4B5FD]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A9144B] dark:text-[#C4B5FD]" />
                <span>Role-Based Access</span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Granular permission boundaries across 5 authorized civil supplies roles.
              </p>
            </div>

            {/* Stat 3 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C3AED] dark:text-[#C4B5FD]">
                <Truck className="w-3.5 h-3.5 text-[#A9144B] dark:text-[#C4B5FD]" />
                <span>Traceable Stock Movement</span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Double-entry digital issue vouchers and Form PDS-12 electronic gate passes.
              </p>
            </div>

            {/* Stat 4 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C3AED] dark:text-[#C4B5FD]">
                <FileCheck className="w-3.5 h-3.5 text-[#A9144B] dark:text-[#C4B5FD]" />
                <span>Audit-Ready Operations</span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Cryptographic transaction logging with automated anomaly detection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs uppercase tracking-widest text-[#7C3AED] dark:text-[#C4B5FD] font-semibold">
            Core Capabilities
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
            Everything You Need to Manage PDS Operations
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8]">
            Intelligent tools for transparent, compliant and efficient warehouse management.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Intelligent FIFO Allocation */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E2E8F0] dark:border-[#263449] hover:border-[#C4B5FD]/50 transition-all group space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-[#A9144B]/10 dark:bg-[#4A182A] border border-[#A9144B]/30 dark:border-[#A9144B]/50 flex items-center justify-center text-[#A9144B] dark:text-[#C4B5FD] group-hover:scale-105 transition-transform">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Intelligent FIFO Allocation
              </h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Prioritise eligible batches according to inward receipt dates and FIFO rules. The automated allocation sandbox calculates batch drawdowns across stacks, ensuring older grain lots are dispatched first without manual interference.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-[#7C3AED] dark:text-[#C4B5FD] font-medium">
              <span>Deterministic lot matching & multi-batch split</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Real-Time Inventory Tracking */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E2E8F0] dark:border-[#263449] hover:border-[#C4B5FD]/50 transition-all group space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-[#F1F5F9] dark:bg-[#0D1420] border border-[#E2E8F0] dark:border-[#263449] flex items-center justify-center text-[#A9144B] dark:text-[#C4B5FD] group-hover:scale-105 transition-transform">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Real-Time Inventory Tracking
              </h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Monitor rice, wheat, available stock, warehouse locations and batch quantities. Track electronic moisture percentages, stack layer limits, quarantine holds, and physical stock reconciliations in one central ledger.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-[#7C3AED] dark:text-[#C4B5FD] font-medium">
              <span>Stack-level bay maps & moisture telemetry</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: PDS Dispatch & Challan Management */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E2E8F0] dark:border-[#263449] hover:border-[#C4B5FD]/50 transition-all group space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-[#F1F5F9] dark:bg-[#0D1420] border border-[#E2E8F0] dark:border-[#263449] flex items-center justify-center text-[#A9144B] dark:text-[#C4B5FD] group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                PDS Dispatch & Challan Management
              </h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Manage dispatch requests, challan records, inward receipts and delivery tracking. Generate official Form PDS-12 digital challans, verify vehicle registration numbers, and confirm destination Fair Price Shop handovers.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-[#7C3AED] dark:text-[#C4B5FD] font-medium">
              <span>Electronic gate passes & transit milestones</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Audit Trail & Compliance */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E2E8F0] dark:border-[#263449] hover:border-[#C4B5FD]/50 transition-all group space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-[#A9144B]/10 dark:bg-[#4A182A] border border-[#A9144B]/30 dark:border-[#A9144B]/50 flex items-center justify-center text-[#A9144B] dark:text-[#C4B5FD] group-hover:scale-105 transition-transform">
              <FileCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Audit Trail & Compliance
              </h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Track operational activity, discrepancies, ageing stock and authorised actions. Maintain an immutable cryptographic audit ledger recording every user login, receipt, status change, and FIFO exception override.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-[#7C3AED] dark:text-[#C4B5FD] font-medium">
              <span>Immutable cryptographic event journal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. FIFO COMPLIANCE SECTION */}
      <section id="fifo-compliance" className="py-20 bg-[#F8FAFC] dark:bg-[#0D1420] border-y border-[#E2E8F0] dark:border-[#263449] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs uppercase tracking-widest text-[#7C3AED] dark:text-[#C4B5FD] font-semibold">
              Strict Rotation Protocol
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
              Every Batch. The Right Order.
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8]">
              Prioritise older eligible stock before newer batches, with transparent allocation records and clear visibility into exceptions.
            </p>
          </div>

          {/* Minimal 3-Step Flow Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E2E8F0] dark:border-[#263449] space-y-4 relative shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#A9144B] dark:text-[#C4B5FD] bg-[#A9144B]/10 dark:bg-[#4A182A] px-2.5 py-1 rounded border border-[#A9144B]/30">
                  Step 01
                </span>
                <Warehouse className="w-5 h-5 text-[#64748B] dark:text-[#94A3B8]" />
              </div>
              <h3 className="font-heading text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Record Inward Receipt
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Rakes arriving from FCI or regional grain silos are registered with verified arrival timestamp, moisture percentage, bag tally, and assigned godown bay stack.
              </p>
              <div className="text-[11px] text-[#7C3AED] dark:text-[#C4B5FD] font-mono pt-1">
                QC Gate: Moisture &le; 12.0%
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-xl bg-white dark:bg-[#141D2A] border border-[#A9144B]/40 dark:border-[#A9144B]/60 shadow-md space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#A9144B] dark:text-[#C4B5FD] bg-[#A9144B]/10 dark:bg-[#4A182A] px-2.5 py-1 rounded border border-[#A9144B]/30">
                  Step 02
                </span>
                <RotateCcw className="w-5 h-5 text-[#A9144B] dark:text-[#C4B5FD]" />
              </div>
              <h3 className="font-heading text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Identify Oldest Eligible Batch
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                When a Fair Price Shop indent is created, the system algorithm queries verified non-quarantined lots and automatically prioritises the earliest receipt date.
              </p>
              <div className="text-[11px] text-[#7C3AED] dark:text-[#C4B5FD] font-mono pt-1">
                Invariant: Oldest Stock Locked First
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E2E8F0] dark:border-[#263449] space-y-4 relative shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#A9144B] dark:text-[#C4B5FD] bg-[#A9144B]/10 dark:bg-[#4A182A] px-2.5 py-1 rounded border border-[#A9144B]/30">
                  Step 03
                </span>
                <FileCheck className="w-5 h-5 text-[#64748B] dark:text-[#94A3B8]" />
              </div>
              <h3 className="font-heading text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                Allocate & Record Dispatch
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Stock is decremented in real-time, generating an official Form PDS-12 digital challan and vehicle gate pass with complete batch provenance.
              </p>
              <div className="text-[11px] text-[#7C3AED] dark:text-[#C4B5FD] font-mono pt-1">
                Audit: Cryptographic Signature
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PDS OPERATIONS WORKFLOW SECTION */}
      <section id="pds-operations" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs uppercase tracking-widest text-[#7C3AED] dark:text-[#C4B5FD] font-semibold">
            Operational Lifecycle
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
            End-to-End PDS Warehouse Operations
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8]">
            A seamless operational continuum from inward rake reception to Fair Price Shop fulfillment.
          </p>
        </div>

        {/* Workflow Breadcrumb Strip */}
        <div className="bg-white dark:bg-[#141D2A] p-2 rounded-xl border border-[#E2E8F0] dark:border-[#263449] flex flex-wrap items-center justify-between gap-2 overflow-x-auto shadow-xs">
          {workflowSteps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setActiveWorkflowStep(idx)}
              className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeWorkflowStep === idx
                  ? 'bg-[#A9144B] text-white shadow-xs ring-1 ring-[#C4B5FD]/40'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#0D1420]'
              }`}
            >
              <span>{step.tag}</span>
              {idx < workflowSteps.length - 1 && (
                <span className="hidden lg:inline text-xs opacity-40 ml-2">&rarr;</span>
              )}
            </button>
          ))}
        </div>

        {/* Active Stage Details Card */}
        <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E2E8F0] dark:border-[#263449] space-y-6 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#263449]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] dark:bg-[#0D1420] border border-[#E2E8F0] dark:border-[#263449] flex items-center justify-center">
                {workflowSteps[activeWorkflowStep].icon}
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#7C3AED] dark:text-[#C4B5FD] font-mono">
                  Stage {activeWorkflowStep + 1} of 5
                </span>
                <h3 className="font-heading text-xl font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  {workflowSteps[activeWorkflowStep].title}
                </h3>
              </div>
            </div>

            <span className="font-mono text-xs px-3 py-1 rounded bg-[#F8FAFC] dark:bg-[#0D1420] text-[#7C3AED] dark:text-[#C4B5FD] border border-[#E2E8F0] dark:border-[#263449] shrink-0">
              {workflowSteps[activeWorkflowStep].metric}
            </span>
          </div>

          <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] max-w-3xl leading-relaxed">
            {workflowSteps[activeWorkflowStep].description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#64748B] dark:text-[#94A3B8]">
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full Audit Logging Enforced</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dual-Signature Clearance</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Real-Time Cloud Synchronization</span>
            </span>
          </div>
        </div>
      </section>

      {/* 7. SECURITY & ROLE-BASED ACCESS SECTION */}
      <section id="security-roles" className="py-20 bg-[#F8FAFC] dark:bg-[#0D1420] border-y border-[#E2E8F0] dark:border-[#263449] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs uppercase tracking-widest text-[#7C3AED] dark:text-[#C4B5FD] font-semibold">
              Governance & Access Control
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
              Secure Access. Clear Accountability.
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8]">
              SmartPDS supports role-specific access and traceable actions for authorised personnel. Every action is cryptographically tied to the verified user.
            </p>
          </div>

          {/* 3 Distinct Roles Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rolesList.map((item) => (
              <div
                key={item.role}
                className="p-6 rounded-xl bg-white dark:bg-[#141D2A] border border-[#E2E8F0] dark:border-[#263449] hover:border-[#C4B5FD]/50 transition-all flex flex-col justify-between space-y-5 group shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-[#A9144B] dark:text-[#C4B5FD] bg-[#A9144B]/10 dark:bg-[#4A182A] px-2 py-0.5 rounded border border-[#A9144B]/30">
                      {item.badge}
                    </span>
                    <Lock className="w-4 h-4 text-[#94A3B8] group-hover:text-[#A9144B] dark:group-hover:text-[#C4B5FD] transition-colors" />
                  </div>

                  <div>
                    <h3 className="font-heading text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                      {item.title}
                    </h3>
                    <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium">
                      {item.designation}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 space-y-1.5 border-t border-[#E2E8F0] dark:border-[#263449]">
                    <div className="text-[11px] uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] font-medium">
                      Authorised Duties:
                    </div>
                    {item.responsibilities.map((resp, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#0F172A] dark:text-[#F1F5F9]">
                        <span className="w-1 h-1 rounded-full bg-[#A9144B] dark:bg-[#C4B5FD]" />
                        <span>{resp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#263449]">
                  <button
                    onClick={() => navigateToAuthWithRole(item.role)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9] bg-[#F8FAFC] dark:bg-[#0D1420] hover:bg-[#A9144B] hover:text-white border border-[#E2E8F0] dark:border-[#263449] hover:border-[#A9144B] rounded-lg transition-all cursor-pointer"
                  >
                    <span>Sign In as {item.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A9144B] dark:text-[#C4B5FD] group-hover:text-white" />
                  </button>
                </div>
              </div>
            ))}

            {/* Callout Card to Sign In */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#4A182A] to-[#141D2A] border border-[#A9144B] flex flex-col justify-between space-y-6 text-white shadow-md">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#A9144B] flex items-center justify-center text-white">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Role-Gated Operational Security
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Authenticate using your designated civil supplies credentials. Every login session, clearance sign-off, and challan is logged to the immutable audit ledger.
                </p>
              </div>

              <button
                onClick={() => setActiveView('auth')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] border border-[#A9144B] rounded-lg transition-all shadow-md cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-white/90" />
                <span>Sign In Securely</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-white dark:bg-[#0B0F17] border-t border-[#E2E8F0] dark:border-[#263449] py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#E2E8F0] dark:border-[#263449]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4A182A] to-[#A9144B] border border-[#A9144B]/40 flex items-center justify-center text-[#C4B5FD]">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <span className="font-heading font-bold text-base text-[#0F172A] dark:text-[#F1F5F9]">
                  Smart<span className="text-[#A9144B] dark:text-[#C4B5FD]">PDS</span>
                </span>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Intelligent Commodity Stock Allocation & FIFO Management System
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <button
                onClick={() => scrollToSection('hero')}
                className="hover:text-[#A9144B] dark:hover:text-[#C4B5FD] transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="hover:text-[#A9144B] dark:hover:text-[#C4B5FD] transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('fifo-compliance')}
                className="hover:text-[#A9144B] dark:hover:text-[#C4B5FD] transition-colors cursor-pointer"
              >
                FIFO Compliance
              </button>
              <button
                onClick={() => scrollToSection('security-roles')}
                className="hover:text-[#A9144B] dark:hover:text-[#C4B5FD] transition-colors cursor-pointer"
              >
                Security & Roles
              </button>
              <button
                onClick={() => setActiveView('auth')}
                className="text-[#A9144B] dark:text-[#C4B5FD] hover:underline font-semibold cursor-pointer"
              >
                Secure Login
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B] dark:text-[#94A3B8]">
            <p>
              Public Distribution System (PDS) warehouse inventory management platform. Built for accountable depot governance.
            </p>
            <p className="font-mono text-[11px] text-[#64748B]/80 dark:text-[#94A3B8]/70">
              SmartPDS &copy; {new Date().getFullYear()} · All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
