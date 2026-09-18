'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { Search, X, MapPin, PlusCircle, Filter, Layers, Navigation, Copy, Check, Info } from 'lucide-react';
import { TileItem, SectionItem, POSITION_LABELS, TilePosition } from '@/lib/types';
import { toast } from 'sonner';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [sectionsList, setSectionsList] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  // Auto focus search field on mount
  useEffect(() => {
    searchInputRef.current?.focus();

    // Fetch section list for filters dropdown
    fetch('/api/sections')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSectionsList(data.data);
        }
      })
      .catch((err) => console.error('Failed to load sections list', err));
  }, []);

  // Fetch search results with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSearchResults();
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedSection, selectedPosition]);

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedSection && selectedSection !== 'ALL') params.append('section', selectedSection);
      if (selectedPosition && selectedPosition !== 'ALL') params.append('position', selectedPosition);

      const res = await fetch(`/api/tiles?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTiles(data.data);
      } else {
        toast.error(data.error || 'Search failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to load inventory search.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleCopyLocation = (tile: TileItem) => {
    const text = `${tile.tileDesignName} -> SECTION: ${tile.section} | POSITION: ${POSITION_LABELS[tile.position] || tile.position}`;
    navigator.clipboard.writeText(text);
    setCopiedId(tile.id);
    toast.success('Location details copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group tiles by design name to explicitly highlight multi-location tiles
  const tilesByNameGroup: Record<string, TileItem[]> = {};
  tiles.forEach((tile) => {
    const key = tile.tileDesignName.toUpperCase();
    if (!tilesByNameGroup[key]) {
      tilesByNameGroup[key] = [];
    }
    tilesByNameGroup[key].push(tile);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* PAGE HEADER */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center justify-center sm:justify-start gap-2">
          <MapPin className="w-7 h-7 text-orange-600 dark:text-orange-500" />
          Find Your Tile Location
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Instant warehouse section and position locator for workers
        </p>
      </div>

      {/* PROMINENT SEARCH BAR & FILTERS PANEL */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border-2 border-orange-500/40 dark:border-orange-500/30 shadow-xl space-y-4">
        {/* LARGE SEARCH INPUT */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-orange-600 dark:text-orange-500" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tile design... (e.g. Jet Black, Italian Marble)"
            className="w-full pl-12 pr-12 py-4 text-lg sm:text-xl font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-orange-500 dark:focus:border-orange-500 focus:outline-hidden text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <div className="p-1 rounded-full bg-slate-200 dark:bg-slate-700">
                <X className="w-5 h-5" />
              </div>
            </button>
          )}
        </div>

        {/* SEARCH FILTERS ROW */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
            <Filter className="w-4 h-4 text-orange-500" /> Filters:
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1">
            {/* SECTION FILTER */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-hidden min-h-[44px]"
            >
              <option value="ALL">All Sections (A, B, C...)</option>
              <option value="PREFIX_A">All Section A (A1–A15)</option>
              <option value="PREFIX_B">All Section B (B1–B15)</option>
              <option value="PREFIX_C">All Section C (C1–C15)</option>
              <optgroup label="Specific Section">
                {sectionsList.map((sec) => (
                  <option key={sec.id} value={sec.code}>
                    Section {sec.code}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* POSITION FILTER */}
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-hidden min-h-[44px]"
            >
              <option value="ALL">All Positions</option>
              <option value="STARTING">Position: Starting</option>
              <option value="MIDDLE">Position: Middle</option>
              <option value="LAST">Position: Last</option>
            </select>
          </div>

          {/* RESET FILTERS BUTTON */}
          {(selectedSection !== 'ALL' || selectedPosition !== 'ALL' || searchQuery !== '') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSection('ALL');
                setSelectedPosition('ALL');
              }}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-orange-600 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors min-h-[44px] shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* SEARCH SUMMARY & MULTI-LOCATION INDICATOR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {loading ? (
            <span>Searching warehouse database...</span>
          ) : (
            <span>
              Found <strong className="text-orange-600 dark:text-orange-400">{tiles.length}</strong> matching tile record{tiles.length === 1 ? '' : 's'}
              {searchQuery && <span> for &quot;<span className="text-slate-900 dark:text-slate-100">{searchQuery}</span>&quot;</span>}
            </span>
          )}
        </div>
      </div>

      {/* SEARCH RESULTS LIST / GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-56 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : tiles.length === 0 ? (
        /* NO RESULT STATE */
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Search className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">No tile found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
              Try a different tile design name or add this new tile to inventory.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/add-tile?name=${encodeURIComponent(searchQuery)}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-600/30 min-h-[44px]"
            >
              <PlusCircle className="w-5 h-5" /> Add Tile to Inventory
            </Link>
          </div>
        </div>
      ) : (
        /* SEARCH RESULT CARDS - WAREHOUSE LOCATOR DESIGN */
        <div className="space-y-8">
          {Object.entries(tilesByNameGroup).map(([groupKey, groupTiles]) => {
            const hasMultiple = groupTiles.length > 1;
            const designTitle = groupTiles[0].tileDesignName;

            return (
              <div key={groupKey} className="space-y-4">
                {/* MULTI-LOCATION HEADER BANNER */}
                {hasMultiple && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        <strong className="text-amber-700 dark:text-amber-300 uppercase">{designTitle}</strong> IS STORED IN{' '}
                        <span className="underline decoration-2">{groupTiles.length} LOCATIONS</span>
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-extrabold text-xs rounded-lg">
                      {groupTiles.length} LOCATIONS FOUND
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupTiles.map((tile) => (
                    <div
                      key={tile.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 shadow-md hover:shadow-xl transition-all p-6 flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* ACCENT STRIP */}
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

                      {/* TILE NAME & MULTI TAG */}
                      <div className="flex items-start justify-between gap-3 mb-4 pt-1">
                        <div>
                          <span className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
                            TILE DESIGN
                          </span>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight leading-tight">
                            {tile.tileDesignName}
                          </h2>
                        </div>
                        <button
                          onClick={() => handleCopyLocation(tile)}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
                          title="Copy Location"
                        >
                          {copiedId === tile.id ? (
                            <Check className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* ULTRA PROMINENT LOCATION HIGHLIGHT BOX */}
                      <div className="bg-slate-950 text-white rounded-2xl p-5 my-2 shadow-inner border border-slate-800 flex items-center justify-between">
                        {/* SECTION CODE - HUGE DISPLAY */}
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                            <MapPin className="w-4 h-4 text-orange-500" /> SECTION
                          </div>
                          <div className="section-badge-huge text-white tracking-tight drop-shadow-md">
                            {tile.section}
                          </div>
                        </div>

                        {/* POSITION CODE - HIGH VISIBILITY BADGE */}
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            POSITION
                          </div>
                          <span
                            className={`inline-block px-4 py-2 font-black text-base sm:text-lg rounded-xl tracking-wider uppercase border-2 shadow-sm ${
                              tile.position === 'STARTING'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                                : tile.position === 'MIDDLE'
                                ? 'bg-amber-950 text-amber-400 border-amber-500/50'
                                : 'bg-rose-950 text-rose-400 border-rose-500/50'
                            }`}
                          >
                            {POSITION_LABELS[tile.position] || tile.position}
                          </span>
                        </div>
                      </div>

                      {/* OPTIONAL NOTE & ACTIONS */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        {tile.note ? (
                          <p className="text-slate-600 dark:text-slate-400 italic truncate max-w-[220px]">
                            Note: {tile.note}
                          </p>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            Added {new Date(tile.createdAt).toLocaleDateString()}
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/inventory?search=${encodeURIComponent(tile.tileDesignName)}`}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Navigation className="w-3.5 h-3.5 text-orange-500" /> View Inventory
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
