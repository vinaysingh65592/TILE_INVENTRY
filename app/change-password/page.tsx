'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, KeyRound, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

export default function ChangePasswordPage() {
  const { user, refreshUser, loading } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isForced = user?.mustChangePassword === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error(isForced ? 'Please enter your temporary password.' : 'Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      toast.error('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match. Please re-enter.');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Could not change password.');
        return;
      }

      toast.success('Password updated successfully!');
      setIsSuccess(true);
      await refreshUser();

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error('Unable to change password. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-6 sm:py-12">
      {/* CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* TOP ACCENT LINE */}
        <div className={`absolute top-0 inset-x-0 h-1.5 ${
          isForced ? 'bg-amber-500 animate-pulse' : 'bg-orange-600'
        }`} />

        {/* FORCED RESET NOTICE */}
        {isForced && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                Action Required: Temporary Password
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                An administrator has reset your password with a temporary one. You must set a permanent secure password to continue using the system.
              </p>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-14 w-14 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <KeyRound className="h-7 w-7 text-orange-600 dark:text-orange-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {isForced ? 'Set New Password' : 'Change Password'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Logged in as <strong className="text-slate-700 dark:text-slate-200">{user?.name}</strong> (@{user?.username})
          </p>
        </div>

        {/* SUCCESS CONFIRMATION */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Password Changed!
            </h3>
            <p className="text-xs text-slate-400">
              Redirecting you to the warehouse dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CURRENT / TEMP PASSWORD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                {isForced ? 'Temporary Password' : 'Current Password'} <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm font-semibold focus:outline-hidden focus:border-orange-500 min-h-[50px]"
                  placeholder={isForced ? 'Enter temporary password' : 'Enter current password'}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                New Password <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm font-semibold focus:outline-hidden focus:border-orange-500 min-h-[50px]"
                  placeholder="Minimum 4 characters"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* CONFIRM NEW PASSWORD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">
                Confirm New Password <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm font-semibold focus:outline-hidden focus:border-orange-500 min-h-[50px]"
                  placeholder="Re-enter new password"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-orange-950/30 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 min-h-[52px] mt-6 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <KeyRound className="h-5 w-5" />
                  <span>Update Password</span>
                </>
              )}
            </button>

            {/* CANCEL BUTTON (only if not forced) */}
            {!isForced && (
              <div className="pt-2 text-center">
                <Link
                  href="/"
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cancel & Back to Dashboard
                </Link>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
