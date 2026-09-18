'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Warehouse, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { SectionItem } from '@/lib/types';
import { toast } from 'sonner';

export default function SectionManagementPage() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Single Section Input
  const [singleCode, setSingleCode] = useState('');
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

  // Range Section Input (e.g. D1 to D15)
  const [rangePrefix, setRangePrefix] = useState('D');
  const [rangeStart, setRangeStart] = useState('1');
  const [rangeEnd, setRangeEnd] = useState('15');
  const [isSubmittingRange, setIsSubmittingRange] = useState(false);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sections');
      const data = await res.json();
      if (data.success) {
        setSections(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch sections');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to load warehouse section configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  // Handle Add Single Section
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleCode.trim()) {
      toast.error('Please enter a section code (e.g. D1).');
      return;
    }

    try {
      setIsSubmittingSingle(true);
      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: singleCode.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Could not add section.');
        return;
      }

      toast.success(data.message || `Section ${singleCode} added successfully.`);
      setSingleCode('');
      fetchSections();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add section.');
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  // Handle Add Section Range
  const handleAddRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangePrefix.trim() || !rangeStart || !rangeEnd) {
      toast.error('Please complete all range parameters.');
      return;
    }

    try {
      setIsSubmittingRange(true);
      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: rangePrefix.trim(),
          rangeStart,
          rangeEnd,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Could not add section range.');
        return;
      }

      toast.success(data.message);
      fetchSections();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add section range.');
    } finally {
      setIsSubmittingRange(false);
    }
  };

  // Handle Delete Section
  const handleDeleteSection = async (code: string) => {
    if (!confirm(`Are you sure you want to delete Section ${code}?`)) return;

    try {
      const res = await fetch(`/api/sections?code=${encodeURIComponent(code)}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Cannot delete section.');
        return;
      }

      toast.success(data.message || `Section ${code} deleted.`);
      fetchSections();
    } catch (err) {
      console.error(err);
      toast.error('Delete section operation failed.');
    }
  };

  // Group sections by prefix for visual display
  const sectionsByPrefix: Record<string, SectionItem[]> = {};
  sections.forEach((sec) => {
    if (!sectionsByPrefix[sec.prefix]) {
      sectionsByPrefix[sec.prefix] = [];
    }
    sectionsByPrefix[sec.prefix].push(sec);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2.5">
          <div className="p-2 bg-orange-600 rounded-xl text-white">
            <Layers className="w-6 h-6" />
          </div>
          Warehouse Section Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Configure, extend, or remove storage sections for your warehouse layout
        </p>
      </div>

      {/* ADD SECTION FORMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FORM 1: ADD SINGLE SECTION */}
        <form
          onSubmit={handleAddSingle}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-500" /> Add Single Section
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create an individual warehouse location code (e.g. D1, E4, OUTDOOR-1)
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Section Code
            </label>
            <input
              type="text"
              value={singleCode}
              onChange={(e) => setSingleCode(e.target.value)}
              placeholder="e.g. D1 or A16"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-slate-50 uppercase focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingSingle}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-600/20 min-h-[44px]"
          >
            {isSubmittingSingle ? 'Adding...' : 'Add Section'}
          </button>
        </form>

        {/* FORM 2: BATCH ADD SECTION RANGE */}
        <form
          onSubmit={handleAddRange}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-orange-500" /> Batch Add Section Range
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate a full section range at once (e.g. D1 to D15)
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Prefix</label>
              <input
                type="text"
                value={rangePrefix}
                onChange={(e) => setRangePrefix(e.target.value)}
                placeholder="D"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-slate-900 dark:text-slate-50 uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">From #</label>
              <input
                type="number"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                min="1"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-slate-900 dark:text-slate-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">To #</label>
              <input
                type="number"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                min="1"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold text-slate-900 dark:text-slate-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmittingRange}
            className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md min-h-[44px]"
          >
            {isSubmittingRange ? 'Generating...' : `Generate Range (${rangePrefix.toUpperCase()}${rangeStart} to ${rangePrefix.toUpperCase()}${rangeEnd})`}
          </button>
        </form>
      </div>

      {/* CONFIGURED SECTIONS LIST BY ZONE */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Configured Warehouse Sections</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Total {sections.length} storage sections available in dropdown selects
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-14 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">No warehouse sections configured.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(sectionsByPrefix)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([prefix, prefixSections]) => (
                <div key={prefix} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="px-2.5 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs rounded-md">
                      ZONE {prefix}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      ({prefixSections.length} sections)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                    {prefixSections.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between group hover:border-orange-500/50 transition-colors"
                      >
                        <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                          {sec.code}
                        </span>
                        <button
                          onClick={() => handleDeleteSection(sec.code)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                          title={`Delete section ${sec.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
