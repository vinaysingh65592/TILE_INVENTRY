'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Warehouse, Lock, User, Eye, EyeOff, Loader2, UserPlus, Shield, ShoppingBag, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'SUPERVISOR' | 'SALESMAN';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SALESMAN');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedUser, setSubmittedUser] = useState<{ name: string; username: string; role: string } | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }

    if (!username.trim() || username.trim().length < 3) {
      toast.error('Username must be at least 3 characters.');
      return;
    }

    if (!password || password.length < 4) {
      toast.error('Password must be at least 4 characters.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Registration failed.');
        return;
      }

      setSubmittedUser({
        name: data.user.name,
        username: data.user.username,
        role: data.user.role,
      });

      toast.success('Registration submitted!', {
        description: 'Your account is pending verification by an administrator.',
      });
    } catch (err) {
      console.error(err);
      toast.error('Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedUser) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20 text-amber-500">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-white">Registration Submitted!</h2>
          <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mt-1">
            Verification Pending
          </p>

          <p className="text-slate-400 text-xs mt-3 leading-relaxed">
            Thank you, <strong className="text-slate-200">{submittedUser.name}</strong>. Your registration request for{' '}
            <strong className="text-slate-200">{submittedUser.role}</strong> has been submitted to the System Administrator for verification.
          </p>

          <div className="mt-5 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Username:</span>
              <span className="font-mono text-slate-300">@{submittedUser.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Requested Role:</span>
              <span className="font-bold text-slate-300">{submittedUser.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Verification Status:</span>
              <span className="font-black text-amber-400">⏳ PENDING APPROVAL</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md min-h-[50px] text-sm"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 relative my-8 overflow-hidden">
        {/* Top accent line */}
        <div className={`absolute top-0 inset-x-0 h-1.5 transition-all ${
          role === 'SUPERVISOR' 
            ? 'bg-gradient-to-r from-orange-600 to-amber-500' 
            : 'bg-gradient-to-r from-blue-600 to-cyan-500'
        }`} />

        {/* Branding header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <Warehouse className="h-7 w-7 text-orange-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">CREATE AN ACCOUNT</h1>
          <p className="text-slate-400 text-sm mt-0.5">Tile Warehouse Inventory & Locator System</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* ROLE SELECTOR (SUPERVISOR vs SALESMAN) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Select Your Role <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* SUPERVISOR OPTION */}
              <button
                type="button"
                onClick={() => setRole('SUPERVISOR')}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between min-h-[96px] ${
                  role === 'SUPERVISOR'
                    ? 'border-orange-500 bg-orange-950/30 text-white shadow-lg shadow-orange-950/50'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {role === 'SUPERVISOR' && (
                  <div className="absolute top-3 right-3 p-1 rounded-full bg-orange-600 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${role === 'SUPERVISOR' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-black text-base">Supervisor</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-tight">
                  Full warehouse control, audits & tile deletions
                </p>
              </button>

              {/* SALESMAN OPTION */}
              <button
                type="button"
                onClick={() => setRole('SALESMAN')}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between min-h-[96px] ${
                  role === 'SALESMAN'
                    ? 'border-blue-500 bg-blue-950/30 text-white shadow-lg shadow-blue-950/50'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {role === 'SALESMAN' && (
                  <div className="absolute top-3 right-3 p-1 rounded-full bg-blue-600 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${role === 'SALESMAN' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="font-black text-base">Salesman</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-tight">
                  Stock updates, sales, loading & inventory locator
                </p>
              </button>
            </div>
          </div>

          {/* FULL NAME */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Full Name <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600 transition-all text-sm font-semibold min-h-[50px]"
                placeholder="e.g. Ramesh Kumar"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* USERNAME */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Username <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <span className="text-sm font-bold text-slate-500">@</span>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600 transition-all text-sm font-semibold min-h-[50px]"
                placeholder="e.g. ramesh_k"
                autoCapitalize="none"
                autoCorrect="off"
                required
                disabled={isLoading}
              />
            </div>
            <p className="text-[11px] text-slate-500 ml-1">Lowercase letters, numbers, and underscores only</p>
          </div>

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Password <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600 transition-all text-sm font-semibold min-h-[50px]"
                placeholder="Minimum 4 characters"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 font-black py-3.5 px-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 min-h-[52px] mt-4 text-white ${
              role === 'SUPERVISOR'
                ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-950/40'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-950/40'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                <span>Register as {role === 'SUPERVISOR' ? 'Supervisor' : 'Salesman'}</span>
              </>
            )}
          </button>
        </form>

        {/* FOOTER: LINK TO LOGIN */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-orange-400 hover:text-orange-300 underline transition-colors"
            >
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
