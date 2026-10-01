'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, Users, Clock, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Trash2, Shield, ShoppingBag, UserCheck, Search, Filter,
  Power, Award, ChevronDown, KeyRound, Copy, Check
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { UserItem } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminConsolePage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<UserItem | null>(null);
  const [resetPasswordModalUser, setResetPasswordModalUser] = useState<UserItem | null>(null);
  const [tempPasswordInput, setTempPasswordInput] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Temp#${code}`;
  };

  const handleOpenResetModal = (user: UserItem) => {
    setResetPasswordModalUser(user);
    setTempPasswordInput(generateRandomPassword());
    setCopied(false);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPasswordModalUser) return;
    const pass = tempPasswordInput.trim();
    if (!pass || pass.length < 4) {
      toast.error('Temporary password must be at least 4 characters.');
      return;
    }

    try {
      setIsResettingPassword(true);
      const res = await fetch(`/api/admin/users/${resetPasswordModalUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temporaryPassword: pass }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Failed to set temporary password.');
        return;
      }

      toast.success(`Temporary password set for ${resetPasswordModalUser.name}!`, {
        description: `Password: ${pass} — User will be forced to change it on next login.`,
        duration: 9000,
      });

      setResetPasswordModalUser(null);
      fetchUsers();
    } catch {
      toast.error('Unable to set temporary password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Check role: must be ADMIN
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/login');
      } else if (currentUser.role !== 'ADMIN') {
        toast.error('Access restricted to Administrators only.');
        router.push('/');
      }
    }
  }, [currentUser, authLoading, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load users.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to fetch users list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  // Handle Verify / Approve
  const handleApprove = async (user: UserItem) => {
    setActionInProgress(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', isActive: true }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Could not approve user.');
        return;
      }
      toast.success(`${user.name} verified & approved!`, {
        description: `Now active as ${user.role}. They can sign in immediately.`,
      });
      fetchUsers();
    } catch (err) {
      toast.error('Approval request failed.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Reject
  const handleReject = async (user: UserItem) => {
    setActionInProgress(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', isActive: false }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Could not reject registration.');
        return;
      }
      toast.info(`Registration for ${user.name} rejected.`);
      fetchUsers();
    } catch (err) {
      toast.error('Action failed.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Toggle Active/Inactive
  const handleToggleActive = async (user: UserItem) => {
    setActionInProgress(user.id);
    const newActiveState = !user.isActive;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActiveState }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Could not update user status.');
        return;
      }
      toast.success(`${user.name} is now ${newActiveState ? 'Active' : 'Deactivated'}.`);
      fetchUsers();
    } catch (err) {
      toast.error('Update failed.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Role Change
  const handleChangeRole = async (user: UserItem, newRole: string) => {
    setActionInProgress(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Could not change role.');
        return;
      }
      toast.success(`${user.name}'s role updated to ${newRole}.`);
      fetchUsers();
    } catch (err) {
      toast.error('Role update failed.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Delete User
  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    setActionInProgress(deleteModalUser.id);
    try {
      const res = await fetch(`/api/admin/users/${deleteModalUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Could not delete user.');
        return;
      }
      toast.success(`User ${deleteModalUser.name} removed from the system.`);
      setDeleteModalUser(null);
      fetchUsers();
    } catch (err) {
      toast.error('Delete request failed.');
    } finally {
      setActionInProgress(null);
    }
  };

  if (authLoading || currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <ShieldCheck className="w-10 h-10 animate-bounce text-purple-500" />
          <p className="font-bold text-sm">Verifying Administrator Access...</p>
        </div>
      </div>
    );
  }

  // Summary Metrics
  const pendingCount = users.filter((u) => u.status === 'PENDING').length;
  const approvedCount = users.filter((u) => u.status === 'APPROVED').length;
  const supervisorCount = users.filter((u) => u.role === 'SUPERVISOR').length;
  const salesmanCount = users.filter((u) => u.role === 'SALESMAN').length;

  // Filtered list
  const filteredUsers = users.filter((u) => {
    // Tab filter
    if (filterTab === 'PENDING' && u.status !== 'PENDING') return false;
    if (filterTab === 'APPROVED' && u.status !== 'APPROVED') return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                Administrator Console
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                Verify registrations, manage team roles, and oversee all warehouse accounts
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors min-h-[44px]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-500' : ''}`} />
          <span>Refresh Accounts</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PENDING APPROVALS */}
        <div
          onClick={() => setFilterTab('PENDING')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
            filterTab === 'PENDING'
              ? 'bg-amber-950/30 border-amber-500 shadow-md shadow-amber-950/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              PENDING VERIFICATION
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-500 tracking-tight">{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 animate-pulse">
                ACTION REQUIRED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            New registrations awaiting your review
          </p>
        </div>

        {/* ACTIVE APPROVED USERS */}
        <div
          onClick={() => setFilterTab('APPROVED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterTab === 'APPROVED'
              ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              APPROVED TEAM
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {approvedCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active verified team members
          </p>
        </div>

        {/* SUPERVISORS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SUPERVISORS</span>
            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {supervisorCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Managers with full audit & delete rights
          </p>
        </div>

        {/* SALESMEN */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SALESMEN</span>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {salesmanCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sales & loading recording staff
          </p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* TABS */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setFilterTab('PENDING')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 min-h-[36px] ${
              filterTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Needs Verification</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterTab === 'PENDING' ? 'bg-amber-950 text-amber-200' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterTab('APPROVED')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all min-h-[36px] ${
              filterTab === 'APPROVED'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Approved Team ({approvedCount})
          </button>

          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all min-h-[36px] ${
              filterTab === 'ALL'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Accounts ({users.length})
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-hidden focus:border-purple-500 min-h-[38px]"
          />
        </div>
      </div>

      {/* USERS LIST / TABLE */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 bg-slate-200 dark:bg-slate-900 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-700 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {filterTab === 'PENDING'
              ? 'No pending registrations!'
              : 'No matching user accounts found.'}
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {filterTab === 'PENDING'
              ? 'All newly registered supervisors and salesmen have already been reviewed and verified.'
              : 'Try changing your filter tabs or search query.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((item) => {
            const isSelf = item.id === currentUser?.id;
            const isPending = item.status === 'PENDING';
            const isRejected = item.status === 'REJECTED';
            const isApproved = item.status === 'APPROVED';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isPending
                    ? 'bg-amber-950/15 border-amber-500/40 dark:bg-amber-950/20'
                    : isRejected
                    ? 'bg-rose-950/10 border-rose-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* USER IDENTITY & ROLE INFO */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`p-3 rounded-2xl shrink-0 ${
                      item.role === 'ADMIN'
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : item.role === 'SUPERVISOR'
                        ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                        : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {item.role === 'ADMIN' ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : item.role === 'SUPERVISOR' ? (
                      <Shield className="w-6 h-6" />
                    ) : (
                      <ShoppingBag className="w-6 h-6" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                        {item.name}
                      </h3>
                      {isSelf && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-extrabold text-[10px]">
                          YOU
                        </span>
                      )}
                      {/* STATUS BADGE */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isRejected
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : item.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700/50 text-slate-400'
                        }`}
                      >
                        {isPending
                          ? '⏳ PENDING APPROVAL'
                          : isRejected
                          ? '✕ REJECTED'
                          : item.isActive
                          ? '✓ ACTIVE'
                          : 'INACTIVE'}
                      </span>

                      {/* FORCED TEMP PASSWORD BADGE */}
                      {item.mustChangePassword && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          🔑 TEMP PASS ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="font-mono text-slate-300">@{item.username}</span>
                      <span>•</span>
                      <span>
                        Registered{' '}
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ROLE CHANGER & ACTIONS */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {/* PENDING ACTIONS: ONE-CLICK APPROVE OR REJECT */}
                  {isPending ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleApprove(item)}
                        disabled={actionInProgress === item.id}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-[40px]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Approve</span>
                      </button>

                      <button
                        onClick={() => handleReject(item)}
                        disabled={actionInProgress === item.id}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition-all disabled:opacity-50 min-h-[40px]"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* ROLE SELECTOR */}
                      {!isSelf && (
                        <div className="relative">
                          <select
                            value={item.role}
                            onChange={(e) => handleChangeRole(item, e.target.value)}
                            disabled={actionInProgress === item.id}
                            className="px-3 py-2 pr-8 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 appearance-none focus:outline-hidden focus:border-purple-500 min-h-[38px] cursor-pointer"
                          >
                            <option value="SALESMAN">Role: Salesman</option>
                            <option value="SUPERVISOR">Role: Supervisor</option>
                            <option value="ADMIN">Role: Admin</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}

                      {/* ACTIVE / DEACTIVATE TOGGLE */}
                      {!isSelf && (
                        <button
                          onClick={() => handleToggleActive(item)}
                          disabled={actionInProgress === item.id}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors min-h-[38px] ${
                            item.isActive
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20'
                              : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                          }`}
                          title={item.isActive ? 'Deactivate user' : 'Activate user'}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{item.isActive ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      )}

                      {/* RESET TEMPORARY PASSWORD */}
                      <button
                        onClick={() => handleOpenResetModal(item)}
                        disabled={actionInProgress === item.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-950/20 text-slate-400 hover:text-amber-400 rounded-xl text-xs font-bold transition-colors min-h-[38px] cursor-pointer"
                        title="Set temporary password (user must change on next login)"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Set Temp Pass</span>
                      </button>

                      {/* DELETE USER */}
                      {!isSelf && (
                        <button
                          onClick={() => setDeleteModalUser(item)}
                          disabled={actionInProgress === item.id}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                          title="Delete account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SET TEMPORARY PASSWORD MODAL */}
      {resetPasswordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Set Temporary Password</h2>
                  <p className="text-xs text-slate-400">For {resetPasswordModalUser.name} (@{resetPasswordModalUser.username})</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-slate-300 leading-relaxed">
              <p>
                When you set a temporary password, the member will be <strong>forced to change it</strong> as soon as they sign in.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Temporary Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempPasswordInput}
                  onChange={(e) => setTempPasswordInput(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-amber-400 focus:outline-hidden focus:border-amber-500 min-h-[44px]"
                  placeholder="Enter temp password"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPasswordInput);
                    setCopied(true);
                    toast.success('Copied to clipboard!');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 min-h-[44px]"
                  title="Copy password"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setTempPasswordInput(generateRandomPassword())}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors min-h-[44px]"
                  title="Generate new random password"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setResetPasswordModalUser(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                disabled={isResettingPassword}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black text-xs transition-colors shadow-lg min-h-[44px]"
              >
                {isResettingPassword ? 'Saving...' : 'Set & Require Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20 text-rose-500">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Remove User Account?</h2>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Are you sure you want to permanently remove{' '}
                <strong className="text-slate-200">{deleteModalUser.name}</strong> (@{deleteModalUser.username})?
                They will no longer be able to log in.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs transition-colors min-h-[44px]"
              >
                Yes, Remove User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
