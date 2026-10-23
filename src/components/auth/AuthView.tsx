import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Boxes,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  Warehouse,
  Truck,
  FileCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

interface AuthViewProps {
  onSuccessRedirect?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccessRedirect }) => {
  const {
    login,
    signup,
    sendPasswordReset,
    setActiveView,
    preselectedAuthRole,
    setPreselectedAuthRole,
    addToast,
    firebaseStatus,
    safeDiagnostic,
    lastAuthErrorCode,
    runConnectionTest,
    verificationState,
  } = useApp();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    preselectedAuthRole || 'Warehouse Operator'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  // Sync if preselected role changes
  useEffect(() => {
    if (preselectedAuthRole) {
      setSelectedRole(preselectedAuthRole);
    }
  }, [preselectedAuthRole]);

  // Handle selecting an authorized operational role
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setPreselectedAuthRole(role);
    setErrorMessage(null);
  };

  const handleTestDatabasePing = async () => {
    setIsTestingConnection(true);
    setTestFeedback(null);
    try {
      const res = await runConnectionTest();
      if (res.isConnected) {
        setTestFeedback('Cloud Firestore connected successfully! (Project: smartipds)');
        addToast('success', 'Firestore Online', 'Connection to project smartipds verified.');
      } else if (!res.isConfigured) {
        setTestFeedback(`Awaiting Web App configuration. Missing: ${res.missingKeys.join(', ')}`);
        setShowConfigModal(true);
      } else {
        setTestFeedback(`Firestore responded: ${res.error || 'Server reachable'}`);
      }
    } catch (e: any) {
      setTestFeedback(`Test failed: ${e.message || String(e)}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (authMode === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full official name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your authorized username or email address.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your secure access password.');
      return;
    }

    if (authMode === 'signup' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    // Role-specific check or email verification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim()) && !email.includes('admin') && !email.includes('user')) {
      setErrorMessage('Please enter a valid official email address (e.g. officer@smartpds.gov.in).');
      return;
    }

    try {
      setIsLoading(true);

      if (authMode === 'signin') {
        const res = await login({
          role: selectedRole,
          email: email.trim(),
          password: password.trim(),
        });

        if (res.success) {
          setIsSuccess(true);
          setTimeout(() => {
            if (res.verified !== false) {
              onSuccessRedirect?.();
            }
          }, 300);
        } else {
          setAuthErrorCode(res.errorCode || null);
          setErrorMessage(
            res.errorCode
              ? `[${res.errorCode}] ${res.error}`
              : res.error || 'Authentication failed. Please verify credentials.'
          );
        }
      } else {
        const res = await signup({
          role: selectedRole,
          name: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
        });

        if (res.success) {
          setIsSuccess(true);
          setAuthErrorCode(null);
          // Personnel profile created in Firebase project smartipds.
          // Because email is unverified, user is routed directly to EmailVerificationView gate.
          // Do not call onSuccessRedirect() which would attempt to jump to the dashboard.
        } else {
          setAuthErrorCode(res.errorCode || null);
          setErrorMessage(
            res.errorCode
              ? `[${res.errorCode}] ${res.error}`
              : res.error || 'Registration failed. Please check details.'
          );
        }
      }
    } catch (unexpectedErr: any) {
      setAuthErrorCode(unexpectedErr?.code || null);
      setErrorMessage(
        unexpectedErr?.code
          ? `[${unexpectedErr.code}] ${unexpectedErr.message || 'Unexpected error'}`
          : 'An unexpected authentication error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfigs: Record<
    UserRole,
    { title: string; description: string; icon: React.ReactNode; clearance: string }
  > = {
    Administrator: {
      title: 'Administrator',
      description: 'Manage users, personnel role clearances, depot settings, system governance, and escalation rules.',
      icon: <ShieldCheck className="w-4 h-4 text-[#C4B5FD]" />,
      clearance: 'State System Clearance',
    },
    'Warehouse Operator': {
      title: 'Warehouse Operator',
      description: 'Record receipts, manage bay stacks, execute FIFO dispatches, and conduct physical stock audits.',
      icon: <Boxes className="w-4 h-4 text-[#C4B5FD]" />,
      clearance: 'Depot Operations Clearance',
    },
    'Ration Shop Dealer': {
      title: 'Ration Shop Dealer',
      description: 'Track commodity allotments, inspect digital challans, monitor transit deliveries, and report discrepancies.',
      icon: <Truck className="w-4 h-4 text-[#C4B5FD]" />,
      clearance: 'Fair Price Network Clearance',
    },
  };

  const officialRoles: UserRole[] = [
    'Administrator',
    'Warehouse Operator',
    'Ration Shop Dealer',
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] flex flex-col justify-between selection:bg-[#9F1745]/30 selection:text-[#C4B5FD]">
      {/* Top Bar for Auth Page */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <button
          onClick={() => setActiveView('landing')}
          className="flex items-center gap-2 text-xs font-medium text-[#98A2B3] hover:text-[#C4B5FD] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Landing Page</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-xs text-[#98A2B3] font-mono">
            PDS Production Environment · TLS 1.3
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Side: Brand & Governance Panel */}
          <div className="lg:col-span-5 bg-[#101827] rounded-xl border border-[#293548] p-6 sm:p-8 flex flex-col justify-between space-y-8 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#480F25]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative">
              {/* Brand Logo & Wordmark */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#480F25] to-[#9F1745] border border-[#9F1745]/50 flex items-center justify-center text-[#C4B5FD] shadow-sm">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-heading font-bold text-xl text-[#F1F5F9] tracking-tight">
                    Smart<span className="text-[#C4B5FD]">PDS</span>
                  </span>
                  <div className="text-[11px] uppercase tracking-wider text-[#98A2B3] font-medium">
                    Civil Supplies Gateway
                  </div>
                </div>
              </div>

              {/* Headline & Narrative */}
              <div className="space-y-3">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#F1F5F9] tracking-tight leading-snug">
                  Secure Access to{' '}
                  <span className="text-[#C4B5FD]">Smarter Distribution</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#98A2B3] leading-relaxed">
                  Manage public distribution warehouse commodities with complete auditability, role-governed authorization, and deterministic FIFO dispatch.
                </p>
              </div>

              {/* Vector Architectural Diagram */}
              <div className="p-4 rounded-lg bg-[#141C29] border border-[#293548] space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#293548]">
                  <span className="text-[#98A2B3] font-medium flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-[#C4B5FD]" />
                    <span>FIFO Queue Verification Engine</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#10B981]">Active</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="p-2 rounded bg-[#101827] border border-[#293548]">
                    <div className="text-[#98A2B3]">Inflow</div>
                    <div className="text-[#F1F5F9] font-bold mt-0.5">QC Lot Gate</div>
                  </div>
                  <div className="p-2 rounded bg-[#480F25]/40 border border-[#9F1745]/60">
                    <div className="text-[#C4B5FD]">Rotation</div>
                    <div className="text-[#C4B5FD] font-bold mt-0.5">FIFO Sort</div>
                  </div>
                  <div className="p-2 rounded bg-[#101827] border border-[#293548]">
                    <div className="text-[#98A2B3]">Outflow</div>
                    <div className="text-[#F1F5F9] font-bold mt-0.5">PDS Challan</div>
                  </div>
                </div>

                <div className="text-[11px] text-[#98A2B3] pt-1">
                  &bull; Verified receipt timestamp ordering ensures oldest grains are depleted first.
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="space-y-3 pt-6 border-t border-[#293548] text-xs text-[#98A2B3]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>3 Authorised Operational Role Workspaces</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Deterministic FIFO Dispatch Rules Enforced</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>Immutable Cryptographic Transaction Audit Ledger</span>
              </div>
            </div>
          </div>

          {/* Right Side: Authentication Card */}
          <div className="lg:col-span-7 bg-[#141C29] rounded-xl border border-[#293548] p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
            <div className="space-y-5">
              {/* Top Banner: Mode Tabs & Firebase Project Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#293548]">
                {/* Sign In vs Sign Up Tabs */}
                <div className="inline-flex rounded-lg p-1 bg-[#101827] border border-[#293548]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage(null);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      authMode === 'signin'
                        ? 'bg-[#A9144B] text-white shadow-xs'
                        : 'text-[#98A2B3] hover:text-[#F1F5F9]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      if (selectedRole === 'Administrator') {
                        setSelectedRole('Warehouse Operator');
                      }
                      setErrorMessage(null);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-[#A9144B] text-white shadow-xs'
                        : 'text-[#98A2B3] hover:text-[#F1F5F9]'
                    }`}
                  >
                    Sign Up / Register
                  </button>
                </div>

                {/* Real Firebase Status & Ping Test Trigger */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestDatabasePing}
                    disabled={isTestingConnection}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-md bg-[#101827] hover:bg-[#1E293B] border border-[#293548] text-[#C4B5FD] transition-colors cursor-pointer disabled:opacity-50"
                    title="Click to run real Firestore connectivity test"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        firebaseStatus.isConnected
                          ? 'bg-[#10B981]'
                          : firebaseStatus.isConfigured
                          ? 'bg-amber-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>
                      {isTestingConnection
                        ? 'Pinging DB...'
                        : firebaseStatus.isConnected
                        ? 'Firestore: Connected'
                        : firebaseStatus.isConfigured
                        ? 'smartipds (Ready)'
                        : 'smartipds (Config)'}
                    </span>
                  </button>
                  {!firebaseStatus.isConfigured && (
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(true)}
                      className="p-1 text-[#98A2B3] hover:text-[#C4B5FD] text-xs transition-colors cursor-pointer"
                      title="View required Firebase Web App configuration values"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status or Diagnostic Banner if test feedback is present */}
              {testFeedback && (
                <div className="p-2.5 rounded-lg bg-[#101827] border border-[#293548] text-[11px] font-mono text-[#C4B5FD] flex items-center justify-between">
                  <span className="truncate">{testFeedback}</span>
                  <button
                    type="button"
                    onClick={() => setTestFeedback(null)}
                    className="text-[#98A2B3] hover:text-[#F1F5F9] ml-2 text-xs"
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Email Verification Action Notification Banner */}
              {verificationState?.status === 'success' && (
                <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Your email address was successfully verified! Please sign in with your password.</span>
                </div>
              )}
              {verificationState?.status === 'error' && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{verificationState.error}</span>
                </div>
              )}

              {/* Form Heading */}
              <div>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#F1F5F9] tracking-tight">
                  {authMode === 'signin' ? 'Authorized Terminal Login' : 'Register New Personnel Profile'}
                </h3>
                <p className="text-xs sm:text-sm text-[#98A2B3] mt-1">
                  {authMode === 'signin'
                    ? 'Secured by Firebase Email/Password Authentication (Project: smartipds).'
                    : 'Create a permanent Firebase account in project smartipds with assigned clearance.'}
                </p>
              </div>

              {/* Official Role Target Clearance (Available in Sign In mode) */}
              {authMode === 'signin' && (
                <div className="p-3 rounded-lg bg-[#101827] border border-[#293548] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#98A2B3] font-medium flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C4B5FD]" />
                      <span>Target Role Clearance:</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">Firebase Auth · smartipds</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {officialRoles.map((role) => {
                      const isSelected = selectedRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleSelectRole(role)}
                          className={`px-2 py-1.5 rounded-md text-[11px] font-medium text-left truncate transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-[#4A182A] text-[#C4B5FD] border-[#A9144B] shadow-xs'
                              : 'bg-[#141C29] text-[#98A2B3] hover:text-[#F1F5F9] hover:bg-[#1A2333] border-[#293548]'
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name Input (Sign Up Mode Only) */}
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label
                      htmlFor="auth-fullname"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#98A2B3]"
                    >
                      Officer Full Name
                    </label>
                    <input
                      id="auth-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="e.g. Anand Kumar"
                      className="w-full px-3 py-2 text-xs bg-[#101827] border border-[#293548] rounded-lg text-[#F1F5F9] placeholder:text-[#98A2B3]/50 focus:border-[#C4B5FD] focus:ring-1 focus:ring-[#C4B5FD] outline-none transition-all"
                    />
                  </div>
                )}

                {/* Role Selector Card */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#98A2B3]">
                    Assigned Operational Role
                  </label>
                  <div className="p-2.5 rounded-lg bg-[#101827] border border-[#293548] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {roleConfigs[selectedRole]?.icon}
                        <span className="text-xs font-bold text-[#F1F5F9]">
                          {selectedRole}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#C4B5FD] bg-[#4A182A] px-2 py-0.5 rounded border border-[#A9144B]/40">
                        {roleConfigs[selectedRole]?.clearance}
                      </span>
                    </div>
                    {authMode === 'signup' && (
                      <div className="grid grid-cols-2 gap-2 pt-1.5">
                        {officialRoles
                          .filter((r) => r !== 'Administrator')
                          .map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setSelectedRole(r)}
                              className={`px-2 py-1 text-[10px] rounded border text-left truncate transition-colors cursor-pointer ${
                                selectedRole === r
                                  ? 'bg-[#A9144B] text-white border-[#A9144B]'
                                  : 'bg-[#141D2A] text-[#98A2B3] border-[#263449] hover:text-[#F1F5F9]'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Email / Username Input */}
                <div className="space-y-1">
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#98A2B3]"
                  >
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                    <input
                      id="auth-email"
                      type="text"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="e.g. officer@smartpds.gov.in"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[#101827] border border-[#293548] rounded-lg text-[#F1F5F9] placeholder:text-[#98A2B3]/50 focus:border-[#C4B5FD] focus:ring-1 focus:ring-[#C4B5FD] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password Input with Show/Hide toggle */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#98A2B3]"
                    >
                      Password
                    </label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[11px] text-[#C4B5FD] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 text-xs font-mono bg-[#101827] border border-[#293548] rounded-lg text-[#F1F5F9] placeholder:text-[#98A2B3]/50 focus:border-[#C4B5FD] focus:ring-1 focus:ring-[#C4B5FD] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#F1F5F9] cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Sign Up Mode Only) */}
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label
                      htmlFor="auth-confirm-password"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#98A2B3]"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
                      <input
                        id="auth-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setErrorMessage(null);
                        }}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[#101827] border border-[#293548] rounded-lg text-[#F1F5F9] placeholder:text-[#98A2B3]/50 focus:border-[#C4B5FD] focus:ring-1 focus:ring-[#C4B5FD] outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#101827] border-[#293548] text-[#A9144B] focus:ring-[#C4B5FD] accent-[#A9144B]"
                    />
                    <span className="text-xs text-[#98A2B3]">
                      Keep terminal session active
                    </span>
                  </label>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-lg bg-[#4A182A]/70 border border-[#A9144B] text-xs text-[#F1F5F9] space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-[#A9144B] shrink-0 mt-0.5" />
                      <div className="leading-relaxed">{errorMessage}</div>
                    </div>
                    {authErrorCode === 'auth/email-already-in-use' && authMode === 'signup' && (
                      <div className="pt-2 border-t border-[#A9144B]/30 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signin');
                            setErrorMessage(null);
                            setAuthErrorCode(null);
                          }}
                          className="px-3 py-1.5 rounded bg-[#A9144B] hover:bg-[#8D103E] text-white text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Switch to Sign In &rarr;
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(email.trim());
                            setShowForgotModal(true);
                          }}
                          className="px-3 py-1.5 rounded bg-[#101827] border border-[#293548] text-[#C4B5FD] hover:bg-[#1A2333] text-xs font-medium cursor-pointer transition-colors"
                        >
                          Reset Password
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] active:bg-[#4A182A] disabled:opacity-50 border border-[#A9144B] rounded-lg transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-[#C4B5FD]/40 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Connecting to Firebase Auth...</span>
                    </div>
                  ) : isSuccess ? (
                    <div className="flex items-center gap-2 text-[#C4B5FD]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authenticated! Initializing Workspace...</span>
                    </div>
                  ) : authMode === 'signin' ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-[#C4B5FD]" />
                      <span>Sign In Securely as {selectedRole}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#C4B5FD]" />
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-[#C4B5FD]" />
                      <span>Register & Create Firebase Account</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#C4B5FD]" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footnote Notice */}
            <div className="pt-3 mt-4 border-t border-[#293548] text-[11px] text-[#98A2B3] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-[#C4B5FD] shrink-0" />
                <span>Firebase Project: <strong className="text-[#F1F5F9] font-mono">smartipds</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="text-[#C4B5FD] hover:underline text-[11px] cursor-pointer"
              >
                Safe Diagnostics &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safe Firebase Security & Authentication Diagnostics Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#141C29] border border-[#293548] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#293548] pb-3">
              <div className="flex items-center gap-2 text-[#C4B5FD]">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="font-heading text-base font-bold text-[#F1F5F9]">
                  Safe Firebase Security Diagnostics
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-[#98A2B3] hover:text-[#F1F5F9] text-base"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#98A2B3] leading-relaxed">
              Real-time audit of Firebase configuration and status for project <span className="font-mono text-[#F1F5F9] font-bold">smartipds</span>.
            </p>

            <div className="space-y-3">
              {/* Target Project */}
              <div className="p-3 rounded-lg bg-[#101827] border border-[#293548] flex items-center justify-between text-xs">
                <span className="text-[#98A2B3]">Target Firebase Project:</span>
                <span className="font-mono text-emerald-400 font-semibold">{safeDiagnostic.targetProjectId}</span>
              </div>

              {/* Environment Variable Names Audit */}
              <div className="p-3 rounded-lg bg-[#101827] border border-[#293548] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#98A2B3]">Environment Variables Audit:</span>
                  <span className={`font-mono font-semibold ${safeDiagnostic.missingEnvVarNames.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {safeDiagnostic.missingEnvVarNames.length === 0 ? 'All 4 Required Present' : `${safeDiagnostic.missingEnvVarNames.length} Missing / Placeholder`}
                  </span>
                </div>
                {safeDiagnostic.missingEnvVarNames.length > 0 ? (
                  <div className="pt-1.5 border-t border-[#293548]/50 space-y-1">
                    <div className="text-[11px] text-amber-300">Missing or placeholder variable names:</div>
                    <ul className="text-[11px] font-mono text-amber-200 list-disc list-inside space-y-0.5">
                      {safeDiagnostic.missingEnvVarNames.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-300 pt-1">
                    All required authentication keys and project identifiers are configured.
                  </div>
                )}
              </div>

              {/* Last Firebase Error Code */}
              <div className="p-3 rounded-lg bg-[#101827] border border-[#293548] text-xs flex items-center justify-between">
                <span className="text-[#98A2B3]">Last Firebase Error Code:</span>
                <span className={`font-mono font-semibold ${lastAuthErrorCode ? 'text-red-400' : 'text-emerald-400'}`}>
                  {lastAuthErrorCode ? `[${lastAuthErrorCode}]` : 'auth/none (Clean)'}
                </span>
              </div>

              {/* Real Firestore Connectivity Ping Result */}
              <div className="p-3 rounded-lg bg-[#101827] border border-[#293548] text-xs flex items-center justify-between">
                <span className="text-[#98A2B3]">Live Firestore Connectivity:</span>
                <span className="font-mono text-xs">
                  {firebaseStatus.isConnected ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Connected (smartipds)
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Awaiting Valid Key
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-[#98A2B3] bg-[#0B0F17] p-2.5 rounded-lg border border-[#293548] flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Credential Disclosure:</strong> This diagnostic tool reports only variable names and official Firebase error codes. No secret API keys, credentials, or user passwords are ever displayed or logged.
              </span>
            </div>

            <div className="flex justify-between items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestDatabasePing}
                disabled={isTestingConnection}
                className="px-3 py-1.5 text-xs font-semibold text-[#C4B5FD] bg-[#101827] hover:bg-[#1E293B] border border-[#293548] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTestingConnection ? 'Testing Connection...' : 'Re-test Connection'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#141C29] border border-[#293548] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#293548] pb-3">
              <div className="flex items-center gap-2 text-[#C4B5FD]">
                <HelpCircle className="w-5 h-5" />
                <h4 className="font-heading text-lg font-bold text-[#F1F5F9]">
                  Password Assistance & Recovery
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetFeedback(null);
                }}
                className="text-[#98A2B3] hover:text-[#F1F5F9] text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#98A2B3] leading-relaxed">
              Dispatch official password reset instructions via Firebase Authentication (Project: <span className="font-mono text-[#F1F5F9] font-bold">smartipds</span>).
            </p>

            <div className="space-y-1.5">
              <label htmlFor="auth-reset-email" className="block text-xs font-semibold uppercase tracking-wider text-[#98A2B3]">
                Official Registered Email
              </label>
              <input
                id="auth-reset-email"
                type="email"
                value={resetEmail || email}
                onChange={(e) => {
                  setResetEmail(e.target.value);
                  setResetFeedback(null);
                }}
                placeholder="officer@smartpds.gov.in"
                className="w-full px-3 py-2 text-xs font-mono bg-[#101827] border border-[#293548] rounded-lg text-[#F1F5F9] placeholder:text-[#98A2B3]/50 focus:border-[#C4B5FD] focus:ring-1 focus:ring-[#C4B5FD] outline-none"
              />
            </div>

            {resetFeedback && (
              <div className="p-2.5 rounded-lg bg-[#101827] border border-[#293548] text-xs text-[#C4B5FD]">
                {resetFeedback}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={isSendingReset}
                onClick={async () => {
                  const target = (resetEmail || email).trim();
                  if (!target) {
                    setResetFeedback('Please enter an official registered email address.');
                    return;
                  }
                  setIsSendingReset(true);
                  setResetFeedback(null);
                  const res = await sendPasswordReset(target);
                  setIsSendingReset(false);
                  if (res.success) {
                    setResetFeedback(`Password reset instructions sent to ${target}. Please check your inbox.`);
                  } else {
                    setResetFeedback(res.error || 'Failed to dispatch password reset email.');
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSendingReset ? 'Dispatching...' : 'Dispatch Reset Email'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetFeedback(null);
                }}
                className="px-3 py-2 text-xs text-[#98A2B3] hover:text-[#F1F5F9] transition-colors cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <div className="py-4 border-t border-[#293548] text-center text-xs text-[#98A2B3]">
        SmartPDS &copy; {new Date().getFullYear()} · Public Distribution System Commodity Allocation Portal
      </div>
    </div>
  );
};
