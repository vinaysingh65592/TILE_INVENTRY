'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, PlusCircle, Boxes, Layers, Warehouse, LogOut, Shield, User, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from './AuthProvider';

const baseNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Find Tile', icon: Search, highlight: true },
  { href: '/add-tile', label: 'Add Tile', icon: PlusCircle },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/sections', label: 'Sections', icon: Layers },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Don't render navbar on auth pages
  if (pathname === '/login' || pathname === '/register') return null;

  // Include Admin Console if user is ADMIN
  const navItems = [
    ...baseNavItems,
    ...(user?.role === 'ADMIN'
      ? [{ href: '/admin', label: 'Admin Console', icon: ShieldCheck, adminOnly: true }]
      : []),
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-white border-r border-slate-800 fixed top-0 bottom-0 left-0 z-30">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-600 rounded-xl text-white shadow-lg shadow-orange-600/30">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-50">TILE WAREHOUSE</h1>
              <p className="text-xs text-orange-400 font-medium">Inventory & Locator</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isAdminItem = (item as any).adminOnly;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? isAdminItem
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : isAdminItem
                    ? 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/40 border border-purple-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                } ${(item as any).highlight && !isActive ? 'border border-orange-500/30 text-orange-400 hover:bg-orange-500/10' : ''}`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? 'text-white'
                      : isAdminItem
                      ? 'text-purple-400'
                      : (item as any).highlight
                      ? 'text-orange-400'
                      : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* USER INFO + STATUS */}
        <div className="border-t border-slate-800">
          {user && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-600/20 text-purple-400'
                      : user.role === 'SUPERVISOR'
                      ? 'bg-orange-600/20 text-orange-400'
                      : 'bg-blue-600/20 text-blue-400'
                  }`}
                >
                  {user.role === 'ADMIN' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : user.role === 'SUPERVISOR' ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-200 truncate">{user.name}</p>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'ADMIN'
                        ? 'text-purple-400'
                        : user.role === 'SUPERVISOR'
                        ? 'text-orange-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-slate-400 font-mono">
              <span>STATUS: </span>
              <span className="text-emerald-400 font-semibold">ONLINE</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* MOBILE TOP HEADER */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-600 rounded-lg text-white">
            <Warehouse className="w-5 h-5" />
          </div>
          <span className="font-bold text-base text-slate-50 tracking-tight">TILE WAREHOUSE</span>
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-600/20 text-purple-400'
                    : user.role === 'SUPERVISOR'
                    ? 'bg-orange-600/20 text-orange-400'
                    : 'bg-blue-600/20 text-blue-400'
                }`}
              >
                {user.role === 'ADMIN' ? 'ADM' : user.role === 'SUPERVISOR' ? 'SUP' : 'SAL'}
              </span>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950 border-t border-slate-800 px-1 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isAdminItem = (item as any).adminOnly;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-h-[48px] min-w-[50px] ${
                isActive
                  ? isAdminItem
                    ? 'text-purple-400 font-bold bg-purple-500/10'
                    : 'text-orange-500 font-bold bg-orange-500/10'
                  : isAdminItem
                  ? 'text-purple-400 hover:text-purple-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive
                    ? isAdminItem
                      ? 'text-purple-400 stroke-[2.5]'
                      : 'text-orange-500 stroke-[2.5]'
                    : isAdminItem
                    ? 'text-purple-400'
                    : 'text-slate-400'
                }`}
              />
              <span className="text-[9px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
