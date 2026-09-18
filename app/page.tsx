'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, PlusCircle, Boxes, ArrowRight, RefreshCw, Layers, TrendingUp, Calendar, Warehouse } from 'lucide-react';
import { DashboardStats, TileItem } from '@/lib/types';
import { POSITION_LABELS } from '@/lib/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTiles, setRecentTiles] = useState<TileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, tilesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/tiles?sort=newest'),
      ]);

      const statsData = await statsRes.json();
      const tilesData = await tilesRes.json();

      if (!statsData.success) throw new Error(statsData.error || 'Failed to load statistics');
      if (!tilesData.success) throw new Error(tilesData.error || 'Failed to load recent tiles');

      setStats(statsData.data);
      setRecentTiles(tilesData.data.slice(0, 6)); // Top 6 recent
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to connect to inventory database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Warehouse Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time tile inventory tracking & location system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center min-h-[44px]"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
          <Link
            href="/search"
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-orange-600/20 min-h-[44px]"
          >
            <Search className="w-5 h-5" />
            <span>Find Tile</span>
          </Link>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL INVENTORY */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL INVENTORY</span>
            <div className="p-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
            ) : (
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                {stats?.totalTiles ?? 0}
              </span>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Active stored tile designs
            </p>
          </div>
        </div>

        {/* TODAY'S ENTRIES */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TODAY'S ENTRIES</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-9 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
            ) : (
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                {stats?.todaysEntries ?? 0}
              </span>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Added in the last 24 hours
            </p>
          </div>
        </div>

        {/* TOTAL CONFIG SECTIONS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">WAREHOUSE SECTIONS</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="h-9 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
            ) : (
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                {stats?.totalSections ?? 0}
              </span>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configured storage zones
            </p>
          </div>
        </div>

        {/* QUICK ADD TILE CARD */}
        <Link
          href="/add-tile"
          className="bg-gradient-to-br from-orange-600 to-orange-700 text-white p-5 rounded-2xl shadow-md shadow-orange-600/20 hover:shadow-lg transition-all flex flex-col justify-between group min-h-[120px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-100 uppercase tracking-wider">QUICK ACTION</span>
            <PlusCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <span className="text-xl font-bold flex items-center gap-2">
              Add New Tile <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <p className="text-xs text-orange-100 mt-1">Store newly arrived warehouse stock</p>
          </div>
        </Link>
      </div>

      {/* DYNAMIC SECTION METRICS BREAKDOWN */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-orange-500" /> Storage Breakdown by Section Zone
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : !stats || Object.keys(stats.sectionCounts).length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No section breakdown data available.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.sectionCounts)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([prefix, count]) => (
                <div
                  key={prefix}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    SECTION {prefix}
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-50">{count}</span>
                    <span className="text-[11px] text-slate-500 font-medium">tiles</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* RECENT INVENTORY ACTIVITIES */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Recent Inventory Entries
          </h2>
          <Link
            href="/inventory"
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
          >
            View All Inventory <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : recentTiles.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Boxes className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No tiles in inventory yet.</p>
            <Link
              href="/add-tile"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-orange-600 text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              <PlusCircle className="w-4 h-4" /> Add First Tile
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentTiles.map((tile) => (
              <div
                key={tile.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-orange-500/50 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base truncate">
                    {tile.tileDesignName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Position: <span className="font-semibold text-slate-700 dark:text-slate-300">{POSITION_LABELS[tile.position] || tile.position}</span>
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-orange-600 text-white font-black text-lg rounded-xl tracking-tight shrink-0 shadow-xs">
                  {tile.section}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
