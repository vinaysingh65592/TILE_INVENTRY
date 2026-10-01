'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Warehouse, Lock, User, Eye, EyeOff, Loader2, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please enter username and password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Login failed.');
        return;
      }

      toast.success(`Welcome back, ${data.user.name}!`, {
        description: `Logged in as ${data.user.role}`,
      });

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-8 relative overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-600 to-orange-400" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Warehouse className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">TILE WAREHOUSE</h1>
          <p className="text-slate-400 text-sm mt-1">Inventory & Locator</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600 transition-all min-h-[52px]"
                placeholder="Enter username"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600 transition-all min-h-[52px]"
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all shadow-lg shadow-orange-900/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 min-h-[52px] mt-2"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-bold text-orange-400 hover:text-orange-300 underline transition-colors inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5 inline" />
              Register as Supervisor or Salesman
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/50">
          <div className="bg-slate-950/50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">Default Credentials</p>
            <div className="text-sm text-slate-300 flex justify-center space-x-6">
              <div>
                <span className="text-orange-400 block text-xs font-bold">Supervisor</span>
                <span className="font-mono text-xs">supervisor / admin123</span>
              </div>
              <div>
                <span className="text-blue-400 block text-xs font-bold">Salesman</span>
                <span className="font-mono text-xs">salesman / sales123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
