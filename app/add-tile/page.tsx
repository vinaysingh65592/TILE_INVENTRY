'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusCircle, CheckCircle2, Layers, Loader2, Package } from 'lucide-react';
import { SectionItem, TilePosition, POSITION_LABELS } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

function AddTileFormContent() {
  const searchParams = useSearchParams();
  const initialName = searchParams.get('name') || '';
  const { user } = useAuth();

  const [tileDesignName, setTileDesignName] = useState(initialName);
  const [section, setSection] = useState('');
  const [position, setPosition] = useState<TilePosition>('MIDDLE');
  const [quantity, setQuantity] = useState<number>(0);
  const [note, setNote] = useState('');

  const [sectionsList, setSectionsList] = useState<SectionItem[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAddedTile, setLastAddedTile] = useState<{ name: string; section: string; position: string; quantity: number } | null>(null);

  const tileNameInputRef = useRef<HTMLInputElement>(null);

  // Fetch sections dynamically
  useEffect(() => {
    async function loadSections() {
      try {
        setLoadingSections(true);
        const res = await fetch('/api/sections');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setSectionsList(data.data);
          setSection(data.data[0].code); // Default to first section
        }
      } catch (err) {
        console.error('Failed to load sections', err);
        toast.error('Unable to load section configurations.');
      } finally {
        setLoadingSections(false);
      }
    }
    loadSections();
  }, []);

  // Auto focus tile design name input on mount
  useEffect(() => {
    tileNameInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!tileDesignName.trim()) {
      toast.error('Please enter a tile design name.');
      tileNameInputRef.current?.focus();
      return;
    }

    if (tileDesignName.trim().length < 2) {
      toast.error('Tile design name must be at least 2 characters.');
      tileNameInputRef.current?.focus();
      return;
    }

    if (!section) {
      toast.error('Please select a section.');
      return;
    }

    if (quantity < 0 || !Number.isInteger(quantity)) {
      toast.error('Quantity must be a whole number (0 or more).');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/tiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tileDesignName,
          section,
          position,
          quantity,
          note,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Could not save tile. Please try again.');
        return;
      }

      // Success workflow
      toast.success('Tile successfully added to inventory.', {
        description: `${data.data.tileDesignName} — ${data.data.quantity} boxes in Section ${data.data.section} (${POSITION_LABELS[data.data.position as TilePosition] || data.data.position})`,
      });

      setLastAddedTile({
        name: data.data.tileDesignName,
        section: data.data.section,
        position: data.data.position,
        quantity: data.data.quantity,
      });

      // Reset form automatically
      setTileDesignName('');
      setQuantity(0);
      setNote('');
      // Keep section as current or default for worker convenience
      setPosition('MIDDLE');

      // Focus input again immediately
      setTimeout(() => {
        tileNameInputRef.current?.focus();
      }, 50);
    } catch (err) {
      console.error(err);
      toast.error('Could not save tile. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* PAGE HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2.5">
          <div className="p-2 bg-orange-600 rounded-xl text-white">
            <PlusCircle className="w-6 h-6" />
          </div>
          Add Tile to Inventory
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Record tile design, quantity, and exact warehouse storage position
        </p>
      </div>

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* FIELD 1: TILE DESIGN NAME */}
        <div className="space-y-2">
          <label htmlFor="tileDesignName" className="block text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Tile Design Name <span className="text-orange-600 dark:text-orange-400">*</span>
          </label>
          <input
            ref={tileNameInputRef}
            id="tileDesignName"
            type="text"
            value={tileDesignName}
            onChange={(e) => setTileDesignName(e.target.value)}
            placeholder="Enter tile design name (e.g. Jet Black, Italian Marble)"
            required
            maxLength={100}
            className="w-full px-4 py-3.5 text-base sm:text-lg font-semibold bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-orange-500 dark:focus:border-orange-500 focus:outline-hidden text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Examples: Jet Black, Italian Marble, Royal White, Carrara Gold
          </p>
        </div>

        {/* FIELD 2: WAREHOUSE SECTION */}
        <div className="space-y-2">
          <label htmlFor="section" className="block text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Warehouse Section <span className="text-orange-600 dark:text-orange-400">*</span>
          </label>
          {loadingSections ? (
            <div className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ) : (
            <select
              id="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              required
              className="w-full px-4 py-3.5 text-base sm:text-lg font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-orange-500 dark:focus:border-orange-500 focus:outline-hidden text-slate-900 dark:text-slate-50 min-h-[52px]"
            >
              {sectionsList.length === 0 ? (
                <option value="">No sections configured</option>
              ) : (
                sectionsList.map((sec) => (
                  <option key={sec.id} value={sec.code}>
                    Section {sec.code}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {/* FIELD 3: POSITION (LARGE SEGMENTED CONTROL FOR MOBILE WORKERS) */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Section Position <span className="text-orange-600 dark:text-orange-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            {(['STARTING', 'MIDDLE', 'LAST'] as TilePosition[]).map((pos) => {
              const isSelected = position === pos;
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  className={`py-3.5 px-2 rounded-xl text-xs sm:text-sm font-black transition-all flex flex-col items-center justify-center gap-1 min-h-[52px] ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{POSITION_LABELS[pos]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FIELD 4: QUANTITY */}
        <div className="space-y-2">
          <label htmlFor="quantity" className="block text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Quantity (Boxes) <span className="text-orange-600 dark:text-orange-400">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setQuantity(isNaN(val) ? 0 : Math.max(0, val));
              }}
              min={0}
              step={1}
              required
              className="flex-1 px-4 py-3.5 text-base sm:text-lg font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-orange-500 dark:focus:border-orange-500 focus:outline-hidden text-slate-900 dark:text-slate-50 min-h-[52px]"
              placeholder="Enter quantity (e.g. 50)"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter the initial stock quantity in whole boxes
          </p>
        </div>

        {/* FIELD 5: OPTIONAL NOTE */}
        <div className="space-y-2">
          <label htmlFor="note" className="block text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Notes / Batch Details <span className="text-slate-400 font-normal text-xs">(Optional)</span>
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Batch #102, 60x120cm slabs, pallet 4"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-orange-500 dark:focus:border-orange-500 focus:outline-hidden text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[56px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Saving Tile...</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-6 h-6" />
              <span>Save Tile</span>
            </>
          )}
        </button>

        {/* CREATED BY INFO */}
        {user && (
          <p className="text-center text-xs text-slate-400">
            Will be recorded as created by <span className="font-bold text-slate-600 dark:text-slate-300">{user.name}</span> ({user.role})
          </p>
        )}
      </form>

      {/* RECENT ADDITION FEEDBACK BANNER */}
      {lastAddedTile && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                LAST SAVED RECORD:
              </p>
              <p className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                {lastAddedTile.name} — {lastAddedTile.quantity} boxes &rarr; SECTION {lastAddedTile.section} ({POSITION_LABELS[lastAddedTile.position as TilePosition] || lastAddedTile.position})
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Ready for next tile</span>
        </div>
      )}
    </div>
  );
}

export default function AddTilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
      <AddTileFormContent />
    </Suspense>
  );
}
