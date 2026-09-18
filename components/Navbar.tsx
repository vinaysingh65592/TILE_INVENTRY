'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, PlusCircle, Boxes, Layers, Warehouse } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Find Tile', icon: Search, highlight: true },
  { href: '/add-tile', label: 'Add Tile', icon: PlusCircle },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/sections', label: 'Sections', icon: Layers },
];

export default function Navbar() {
  const pathname = usePathname();

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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                } ${item.highlight && !isActive ? 'border border-orange-500/30 text-orange-400 hover:bg-orange-500/10' : ''}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.highlight ? 'text-orange-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            <span>STATUS: </span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
          <ThemeToggle />
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
          <ThemeToggle />
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-h-[48px] min-w-[56px] ${
                isActive
                  ? 'text-orange-500 font-bold bg-orange-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-orange-500 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
