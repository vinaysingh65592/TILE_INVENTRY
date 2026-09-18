'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Boxes,
  Search,
  Filter,
  ArrowUpDown,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  MapPin,
  Calendar,
} from 'lucide-react';
import { TileItem, SectionItem, TilePosition, POSITION_LABELS } from '@/lib/types';
import { toast } from 'sonner';

function InventoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');

  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [sectionsList, setSectionsList] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingTile, setEditingTile] = useState<TileItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editPosition, setEditPosition] = useState<TilePosition>('MIDDLE');
  const [editNote, setEditNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingTile, setDeletingTile] = useState<TileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch section config list
  useEffect(() => {
    fetch('/api/sections')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSectionsList(data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch Inventory Records
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (sectionFilter !== 'ALL') params.append('section', sectionFilter);
      if (positionFilter !== 'ALL') params.append('position', positionFilter);
      params.append('sort', sortOption);

      const res = await fetch(`/api/tiles?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTiles(data.data);
      } else {
        toast.error(data.error || 'Failed to load inventory.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unable to fetch inventory records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, sectionFilter, positionFilter, sortOption]);

  // Open Edit Modal
  const handleOpenEdit = (tile: TileItem) => {
    setEditingTile(tile);
    setEditName(tile.tileDesignName);
    setEditSection(tile.section);
    setEditPosition(tile.position as TilePosition);
    setEditNote(tile.note || '');
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTile) return;

    if (!editName.trim()) {
      toast.error('Please enter a tile design name.');
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch(`/api/tiles/${editingTile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tileDesignName: editName.trim(),
          section: editSection,
          position: editPosition,
          note: editNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Could not update tile.');
        return;
      }

      toast.success('Tile updated successfully.');
      setEditingTile(null);
      fetchInventory();
    } catch (err) {
      console.error(err);
      toast.error('Update failed. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingTile) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/tiles/${deletingTile.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Could not delete tile.');
        return;
      }

      toast.success('Tile removed from inventory.');
      setDeletingTile(null);
      fetchInventory();
    } catch (err) {
      console.error(err);
      toast.error('Delete operation failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2.5">
            <div className="p-2 bg-orange-600 rounded-xl text-white">
              <Boxes className="w-6 h-6" />
            </div>
            Inventory Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Complete warehouse stock list with edit and removal actions
          </p>
        </div>
        <button
          onClick={() => router.push('/add-tile')}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-600/20 min-h-[44px]"
        >
          <PlusCircle className="w-5 h-5" /> Add New Tile
        </button>
      </div>

      {/* FILTER & SORT BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tile design..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-hidden text-slate-900 dark:text-slate-50 min-h-[44px]"
            />
          </div>

          {/* SECTION FILTER */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-orange-500 focus:outline-hidden min-h-[44px]"
          >
            <option value="ALL">All Sections</option>
            {sectionsList.map((sec) => (
              <option key={sec.id} value={sec.code}>
                Section {sec.code}
              </option>
            ))}
          </select>

          {/* POSITION FILTER */}
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-orange-500 focus:outline-hidden min-h-[44px]"
          >
            <option value="ALL">All Positions</option>
            <option value="STARTING">Position: Starting</option>
            <option value="MIDDLE">Position: Middle</option>
            <option value="LAST">Position: Last</option>
          </select>

          {/* SORTING SELECT */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-orange-500 focus:outline-hidden min-h-[44px]"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="name_asc">Sort: Tile Name (A–Z)</option>
            <option value="name_desc">Sort: Tile Name (Z–A)</option>
            <option value="section">Sort: By Section</option>
          </select>
        </div>
      </div>

      {/* CONTENT: TABLE FOR DESKTOP, CARDS FOR MOBILE */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : tiles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">No tiles in inventory</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            {search || sectionFilter !== 'ALL' || positionFilter !== 'ALL'
              ? 'No tile records match your filter criteria.'
              : 'Your warehouse inventory is currently empty.'}
          </p>
          <button
            onClick={() => router.push('/add-tile')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-bold text-sm rounded-xl min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" /> Add First Tile
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Tile Design Name</th>
                  <th className="py-4 px-6">Section</th>
                  <th className="py-4 px-6">Position</th>
                  <th className="py-4 px-6">Created At</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {tiles.map((tile) => (
                  <tr key={tile.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-50">
                      <div>{tile.tileDesignName}</div>
                      {tile.note && <div className="text-xs text-slate-400 font-normal italic mt-0.5">{tile.note}</div>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-orange-600 text-white font-black text-sm rounded-lg shadow-xs">
                        {tile.section}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-extrabold rounded-lg uppercase border ${
                          tile.position === 'STARTING'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : tile.position === 'MIDDLE'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {POSITION_LABELS[tile.position as TilePosition] || tile.position}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(tile.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(tile)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-500" /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingTile(tile)}
                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="md:hidden space-y-3">
            {tiles.map((tile) => (
              <div
                key={tile.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-slate-50 text-lg uppercase">
                      {tile.tileDesignName}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" /> {new Date(tile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3.5 py-1.5 bg-orange-600 text-white font-black text-xl rounded-xl shadow-xs">
                    {tile.section}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">POSITION:</span>
                  <span
                    className={`px-3 py-1 font-bold rounded-lg uppercase ${
                      tile.position === 'STARTING'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : tile.position === 'MIDDLE'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {POSITION_LABELS[tile.position as TilePosition] || tile.position}
                  </span>
                </div>

                {tile.note && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                    Note: {tile.note}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEdit(tile)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 min-h-[40px]"
                  >
                    <Edit className="w-4 h-4 text-blue-500" /> Edit Tile
                  </button>
                  <button
                    onClick={() => setDeletingTile(tile)}
                    className="py-2 px-4 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 min-h-[40px]"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* EDIT MODAL DIALOG */}
      {editingTile && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-lg text-slate-900 dark:text-slate-50">Edit Tile Record</h3>
              <button
                onClick={() => setEditingTile(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Tile Design Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Warehouse Section
                </label>
                <select
                  value={editSection}
                  onChange={(e) => setEditSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-50"
                >
                  {sectionsList.map((sec) => (
                    <option key={sec.id} value={sec.code}>
                      Section {sec.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Position
                </label>
                <select
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value as TilePosition)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-50"
                >
                  <option value="STARTING">Starting</option>
                  <option value="MIDDLE">Middle</option>
                  <option value="LAST">Last</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Note</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTile(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md min-h-[44px]"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingTile && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-full w-14 h-14 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-black text-xl text-slate-900 dark:text-slate-50">Confirm Delete</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Are you sure you want to remove{' '}
                <strong className="text-slate-900 dark:text-slate-100 uppercase">{deletingTile.tileDesignName}</strong> (Section {deletingTile.section}) from inventory?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTile(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm min-h-[44px]"
              >
                {isDeleting ? 'Deleting...' : 'Delete Tile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading inventory...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
