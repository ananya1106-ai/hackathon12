import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mail,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Send,
  LogOut,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Boxes,
  Lock,
  ExternalLink,
} from 'lucide-react';

import { auth } from '../../lib/firebase';

export const EmailVerificationView: React.FC = () => {
  const {
    currentUser,
    resendVerificationEmail,
    checkVerificationStatus,
    logout,
    verificationState,
  } = useApp();

  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Periodic automatic status check (every 5 seconds) while user is viewing this screen
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        await checkVerificationStatus(true); // silent check
      } catch {
        // ignore background poll error
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [checkVerificationStatus]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setFeedback(null);

    const res = await resendVerificationEmail();
    setIsResending(false);

    if (res.success) {
      setResendCooldown(60);
      setFeedback({
        type: 'success',
        message: 'A fresh statutory verification link has been dispatched to your official inbox.',
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Failed to dispatch verification email. Please try again shortly.',
      });
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    setFeedback(null);

    const res = await checkVerificationStatus(false);
    setIsChecking(false);

    if (res.isVerified) {
      setFeedback({
        type: 'success',
        message: 'Email confirmed! Initializing your authorized terminal workspace...',
      });
    } else {
      setFeedback({
        type: 'info',
        message: 'Verification link not yet clicked. Please open your email client, tap the link, then re-check.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] flex flex-col justify-between selection:bg-[#9F1745]/30 selection:text-[#C4B5FD]">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-[#293548]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#480F25] to-[#9F1745] border border-[#9F1745]/50 flex items-center justify-center text-[#C4B5FD] shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-bold text-lg text-[#F1F5F9] tracking-tight">
              Smart<span className="text-[#C4B5FD]">PDS</span>
            </span>
            <div className="text-[10px] uppercase tracking-wider text-[#98A2B3] font-medium">
              Civil Supplies Security Gateway
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-[#98A2B3] hover:text-[#F1F5F9] px-3 py-1.5 rounded-lg border border-[#293548] hover:bg-[#141C29] transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out / Switch Account</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl w-full bg-[#141C29] rounded-2xl border border-[#293548] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#A9144B]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Action Link Status Banner (if url oobCode processed) */}
          {verificationState?.status === 'success' && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-start gap-3 text-xs text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-emerald-300">
                  Email Verification Succeeded
                </strong>
                <span>
                  Your official civil supplies credentials have been verified. Access permissions unlocked.
                </span>
              </div>
            </div>
          )}

          {verificationState?.status === 'error' && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 flex items-start gap-3 text-xs text-red-200">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-red-300">
                  Verification Link Issue
                </strong>
                <span>{verificationState.error}</span>
              </div>
            </div>
          )}

          {/* Header & Icon */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Statutory Access Gate
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#F1F5F9] mt-2 tracking-tight">
                Official Email Verification Required
              </h2>
              <p className="text-xs sm:text-sm text-[#98A2B3] mt-1.5 max-w-md mx-auto leading-relaxed">
                Food & Civil Supplies Department governance protocols mandate verified credentials before accessing warehouse commodity stock registers and FIFO issue authorizations.
              </p>
            </div>
          </div>

          {/* User Account Summary Card */}
          <div className="p-4 rounded-xl bg-[#101827] border border-[#293548] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#293548]/60 text-xs">
              <span className="text-[#98A2B3] font-medium">Designated Personnel:</span>
              <span className="font-mono text-[#C4B5FD] font-semibold">
                {currentUser?.name || 'Authorized Officer'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#293548]/60 text-xs">
              <span className="text-[#98A2B3] font-medium">Official Email:</span>
              <span className="font-mono text-[#F1F5F9] font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#C4B5FD]" />
                {currentUser?.email || auth.currentUser?.email || 'officer@smartpds.gov.in'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#293548]/60 text-xs">
              <span className="text-[#98A2B3] font-medium">Operational Role:</span>
              <span className="font-medium text-[#F1F5F9]">
                {currentUser?.role || 'Operational Clearance'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#98A2B3] font-medium">Credential Status:</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-950/40 border border-amber-600/40 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Pending Email Confirmation</span>
              </span>
            </div>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-200'
                  : feedback.type === 'error'
                  ? 'bg-red-950/40 border border-red-500/50 text-red-200'
                  : 'bg-blue-950/40 border border-blue-500/50 text-blue-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {/* Primary: Check Verification Status */}
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={isChecking}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#A9144B] hover:bg-[#8D103E] active:bg-[#4A182A] disabled:opacity-50 border border-[#A9144B] rounded-xl transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>
                {isChecking
                  ? 'Querying Authentication Server...'
                  : "I've verified my email — Check Status"}
              </span>
            </button>

            {/* Secondary: Resend Verification Email with Cooldown */}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[#C4B5FD] hover:text-white bg-[#101827] hover:bg-[#1E293B] border border-[#293548] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isResending
                  ? 'Dispatching Secure Link...'
                  : resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : 'Resend Verification Email'}
              </span>
            </button>
          </div>

          {/* Informational Guidance Accordion */}
          <div className="p-3.5 rounded-xl bg-[#101827]/80 border border-[#293548] text-xs text-[#98A2B3] space-y-2">
            <div className="flex items-center gap-2 text-[#C4B5FD] font-semibold text-[11px] uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Verification Checklist & Troubleshooting</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-[#98A2B3]">
              <li>
                <strong className="text-[#F1F5F9]">Recipient:</strong> Verification link is dispatched to <span className="font-mono text-[#C4B5FD]">{currentUser?.email}</span>.
              </li>
              <li>
                <strong className="text-[#F1F5F9]">Delivery Note:</strong> Firebase Auth accepts and queues the mail through Google mailers (<span className="font-mono text-[#F1F5F9]">noreply@smartipds.firebaseapp.com</span>). Delivery to your inbox depends on spam filtering and mail provider policies. Check Spam or Junk folders if delayed.
              </li>
              <li>
                <strong className="text-[#F1F5F9]">Instant Refresh:</strong> Once you tap the verification link on any device, click <strong className="text-white">"I've verified my email — Check Status"</strong> to refresh your token via Firebase Auth and enter the depot workspace.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="py-4 border-t border-[#293548] text-center text-xs text-[#98A2B3]">
        SmartPDS &copy; {new Date().getFullYear()} · Public Distribution System Commodity Allocation Portal
      </div>
    </div>
  );
};
