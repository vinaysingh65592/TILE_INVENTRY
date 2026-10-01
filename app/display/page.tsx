'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles, Search, PlusCircle, Edit, Trash2, X, Tag,
  Eye, EyeOff, Check, Copy, AlertTriangle, Layers,
  Building2, Maximize2, Shield, User, Loader2, ArrowUpDown,
  Share2, Image as ImageIcon, SlidersHorizontal, IndianRupee,
  RefreshCw
} from 'lucide-react';
import {
  DisplayTileItem, TileItem,
  DISPLAY_TILE_CATEGORIES, COMMON_TILE_SIZES, POPULAR_TILE_COMPANIES
} from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

function DisplayContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Data States
  const [displayTiles, setDisplayTiles] = useState<DisplayTileItem[]>([]);
  const [inventoryTiles, setInventoryTiles] = useState<TileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [selectedCompany, setSelectedCompany] = useState(searchParams?.get('company') || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || 'ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Presentation Mode (clean customer showcase vs management)
  const [customerMode, setCustomerMode] = useState(false);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalTile, setEditModalTile] = useState<DisplayTileItem | null>(null);
  const [deleteModalTile, setDeleteModalTile] = useState<DisplayTileItem | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    company: '',
    tileDesign: '',
    category: 'Floor Tile',
    size: '600 x 1200 mm (2x4 ft)',
    imageUrl: '',
    mrp: '',
    finalMrp: '',
    note: '',
    tileInventoryId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch Display Tiles
  const fetchDisplayTiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCompany && selectedCompany !== 'ALL') params.append('company', selectedCompany);
      if (selectedCategory && selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/display-tiles?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load display tiles');
      const data = await res.json();
      setDisplayTiles(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load display tiles');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCompany, selectedCategory, sortBy]);

  useEffect(() => {
    fetchDisplayTiles();
  }, [fetchDisplayTiles]);

  // Fetch Inventory tiles for linking
  useEffect(() => {
    async function loadInventory() {
      try {
        const res = await fetch('/api/tiles');
        if (res.ok) {
          const data = await res.json();
          setInventoryTiles(data.data || []);
        }
      } catch (err) {
        console.error('Failed to load inventory for picker', err);
      }
    }
    loadInventory();
  }, []);

  // Handle inventory tile pick in modal
  const handleSelectInventoryTile = (tileId: string) => {
    if (!tileId) return;
    const inv = inventoryTiles.find((t) => t.id === tileId);
    if (inv) {
      setFormData((prev) => ({
        ...prev,
        tileInventoryId: inv.id,
        tileDesign: inv.tileDesignName,
        note: inv.note || prev.note,
      }));
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      company: POPULAR_TILE_COMPANIES[0],
      tileDesign: '',
      category: DISPLAY_TILE_CATEGORIES[0],
      size: COMMON_TILE_SIZES[0],
      imageUrl: '',
      mrp: '',
      finalMrp: '',
      note: '',
      tileInventoryId: '',
    });
    setAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (tile: DisplayTileItem) => {
    setEditModalTile(tile);
    setFormData({
      company: tile.company,
      tileDesign: tile.tileDesign,
      category: tile.category,
      size: tile.size,
      imageUrl: tile.imageUrl || '',
      mrp: tile.mrp.toString(),
      finalMrp: tile.finalMrp.toString(),
      note: tile.note || '',
      tileInventoryId: tile.tileInventoryId || '',
    });
  };

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.tileDesign.trim()) {
      toast.error('Please enter company and tile design name');
      return;
    }
    const numMrp = parseFloat(formData.mrp);
    const numFinal = parseFloat(formData.finalMrp);
    if (isNaN(numMrp) || isNaN(numFinal) || numMrp < 0 || numFinal < 0) {
      toast.error('Please enter valid MRP and Final MRP values');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/display-tiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add tile');

      toast.success('Tile added to Customer Display Showcase!');
      setAddModalOpen(false);
      fetchDisplayTiles();
    } catch (err: any) {
      toast.error(err.message || 'Error adding tile');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalTile) return;

    const numMrp = parseFloat(formData.mrp);
    const numFinal = parseFloat(formData.finalMrp);
    if (isNaN(numMrp) || isNaN(numFinal) || numMrp < 0 || numFinal < 0) {
      toast.error('Please enter valid MRP and Final MRP values');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/display-tiles/${editModalTile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update tile');

      toast.success('Display tile details updated successfully!');
      setEditModalTile(null);
      fetchDisplayTiles();
    } catch (err: any) {
      toast.error(err.message || 'Error updating tile');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Remove from Display
  const handleDelete = async () => {
    if (!deleteModalTile) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/display-tiles/${deleteModalTile.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove tile');

      toast.success('Tile removed from display panel.');
      setDeleteModalTile(null);
      fetchDisplayTiles();
    } catch (err: any) {
      toast.error(err.message || 'Error removing tile');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy Quotation to Clipboard
  const copyQuotation = () => {
    if (displayTiles.length === 0) {
      toast.info('No tiles in display panel to quote.');
      return;
    }
    const lines = [
      '✨ *TILE WAREHOUSE - CUSTOMER QUOTATION* ✨',
      '────────────────────────────',
      ...displayTiles.map((t, i) => {
        const savings = Math.max(0, t.mrp - t.finalMrp);
        const percent = t.mrp > 0 ? Math.round((savings / t.mrp) * 100) : 0;
        return `${i + 1}. *${t.tileDesign}* (${t.company})\n   • Category: ${t.category}\n   • Size: ${t.size}\n   • MRP: ~₹${t.mrp.toLocaleString()}~\n   • *Final Price: ₹${t.finalMrp.toLocaleString()}* (Save ₹${savings} | ${percent}% OFF)\n`;
      }),
      '────────────────────────────',
      '🚚 Delivery & Loading Available from Warehouse',
      '📞 Contact our sales team for prompt dispatch.',
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Quotation copied to clipboard! Ready to paste into WhatsApp.');
  };

  // Quick Stats
  const totalDisplay = displayTiles.length;
  const companiesCount = new Set(displayTiles.map((t) => t.company)).size;

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl text-white shadow-lg shadow-orange-500/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              <span>Customer Display Showcase</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">
                {totalDisplay} Selected
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Curate tile designs from inventory to present to customers with final pricing, discounts, and specs.
            </p>
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setCustomerMode(!customerMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              customerMode
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Clean Customer Presentation View"
          >
            {customerMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{customerMode ? 'Exit Customer View' : 'Customer Presentation Mode'}</span>
          </button>

          <button
            onClick={copyQuotation}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
            title="Copy quotation summary for WhatsApp"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Copy Quote</span>
          </button>

          {!customerMode && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add to Display</span>
            </button>
          )}
        </div>
      </div>

      {/* METRIC STRIP */}
      {!customerMode && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tiles On Display</p>
            <p className="text-2xl font-black text-slate-100 mt-1">{totalDisplay}</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Featured Brands</p>
            <p className="text-2xl font-black text-orange-400 mt-1">{companiesCount}</p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Salesmen</p>
            <p className="text-2xl font-black text-blue-400 mt-1">
              {new Set(displayTiles.map((t) => t.addedByName).filter(Boolean)).size || 1}
            </p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Control Access</p>
            <p className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Admin & Salesman
            </p>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search design name, company, size..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">All Companies / Brands</option>
              {POPULAR_TILE_COMPANIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
            >
              <option value="newest">Recently Added</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Design Name (A-Z)</option>
              <option value="company_asc">Company (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Categories
          </button>
          {DISPLAY_TILE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* DISPLAY TILES GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium">Loading customer display showcase...</p>
        </div>
      ) : displayTiles.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Sparkles className="w-12 h-12 text-orange-400/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200">No Tiles in Display Panel</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Add tile designs to this showcase so salesmen can present them to customers with accurate company specs and final discounted prices.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add First Tile to Display</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayTiles.map((tile) => {
            const savings = Math.max(0, tile.mrp - tile.finalMrp);
            const savingsPercent = tile.mrp > 0 ? Math.round((savings / tile.mrp) * 100) : 0;

            return (
              <div
                key={tile.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col group"
              >
                {/* TILE IMAGE OR PATTERN PREVIEW */}
                <div className="relative h-48 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4 border-b border-slate-800">
                  {tile.imageUrl ? (
                    <img
                      src={tile.imageUrl}
                      alt={tile.tileDesign}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 via-slate-800/40 to-slate-900 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                      <Layers className="w-10 h-10 text-orange-400/60 mb-2 relative z-10" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest relative z-10">
                        {tile.company}
                      </span>
                      <span className="text-sm font-black text-slate-100 line-clamp-1 relative z-10">
                        {tile.tileDesign}
                      </span>
                    </div>
                  )}

                  {/* COMPANY BADGE */}
                  <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-orange-400 px-3 py-1 rounded-lg text-xs font-black shadow-md flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{tile.company}</span>
                  </div>

                  {/* CATEGORY PILL */}
                  <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md">
                    {tile.category}
                  </div>

                  {/* SIZE BADGE */}
                  <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md text-[11px] font-mono flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-orange-400" />
                    <span>{tile.size}</span>
                  </div>
                </div>

                {/* CONTENT BODY */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-black text-slate-100 group-hover:text-orange-400 transition-colors">
                      {tile.tileDesign}
                    </h3>
                    {tile.note && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {tile.note}
                      </p>
                    )}
                  </div>

                  {/* PRICING BLOCK */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">MRP</p>
                      <p className="text-sm font-semibold text-slate-400 line-through">
                        ₹{tile.mrp.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase font-black text-emerald-400">FINAL OFFER</p>
                      <p className="text-xl font-black text-slate-100 flex items-center justify-end text-emerald-400">
                        ₹{tile.finalMrp.toLocaleString()}
                      </p>
                    </div>

                    {savings > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-lg text-right">
                        <span className="block text-[9px] font-bold uppercase">SAVE</span>
                        <span className="text-xs font-black">₹{savings} ({savingsPercent}%)</span>
                      </div>
                    )}
                  </div>

                  {/* SALESMAN AUDIT TRAIL */}
                  {!customerMode && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">
                          Added by <strong className="text-slate-200">{tile.addedByName || 'Salesman'}</strong>
                        </span>
                      </div>
                      <span className="shrink-0 text-slate-500 text-[10px]">
                        {new Date(tile.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  )}

                  {/* ACTIONS FOR ADMIN AND SALESMAN */}
                  {!customerMode && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(tile)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeleteModalTile(tile)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Remove from display"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD TILE TO DISPLAY */}
      {/* ============================================================ */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-600 rounded-lg text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Add Tile to Customer Display</h3>
                  <p className="text-xs text-slate-400">Record tile specs, brand, MRP, and final customer offer</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* PICK FROM INVENTORY OPTION */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Pick from Warehouse Inventory (Optional)
                </label>
                <select
                  value={formData.tileInventoryId}
                  onChange={(e) => handleSelectInventoryTile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Choose existing inventory tile (or type below) --</option>
                  {inventoryTiles.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.tileDesignName} (Sec: {inv.section}, Qty: {inv.quantity})
                    </option>
                  ))}
                </select>
              </div>

              {/* COMPANY & DESIGN NAME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Company / Brand *
                  </label>
                  <input
                    type="text"
                    list="company-suggestions"
                    placeholder="e.g. Kajaria, Somany"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                    required
                  />
                  <datalist id="company-suggestions">
                    {POPULAR_TILE_COMPANIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Tile Design Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Statuario White Glossy"
                    value={formData.tileDesign}
                    onChange={(e) => setFormData({ ...formData, tileDesign: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              {/* CATEGORY & SIZE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {DISPLAY_TILE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Size / Dimension *
                  </label>
                  <input
                    type="text"
                    list="size-suggestions"
                    placeholder="e.g. 600 x 1200 mm"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                    required
                  />
                  <datalist id="size-suggestions">
                    {COMMON_TILE_SIZES.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* IMAGE URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Tile Picture URL (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://... image link of tile design"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Leave blank to show our premium procedural slate texture preview.
                </p>
              </div>

              {/* MRP & FINAL MRP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    MRP (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 850"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">
                    FINAL MRP / OFFER (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 680"
                    value={formData.finalMrp}
                    onChange={(e) => setFormData({ ...formData, finalMrp: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* NOTE */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Brief Note / Finish / Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. High Gloss finish, 9mm thickness, best for living room"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-600/30 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add to Display</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT DISPLAY TILE */}
      {/* ============================================================ */}
      {editModalTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Edit Display Tile</h3>
                  <p className="text-xs text-slate-400">Update pricing, company specs, or description</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalTile(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Company / Brand *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Tile Design Name *
                  </label>
                  <input
                    type="text"
                    value={formData.tileDesign}
                    onChange={(e) => setFormData({ ...formData, tileDesign: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {DISPLAY_TILE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Size / Dimension *
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Tile Picture URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://... image link"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    MRP (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">
                    FINAL MRP / OFFER (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.finalMrp}
                    onChange={(e) => setFormData({ ...formData, finalMrp: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Brief Note / Finish / Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalTile(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: REMOVE TILE FROM DISPLAY */}
      {/* ============================================================ */}
      {deleteModalTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-100">Remove from Display Panel?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove <strong className="text-slate-200">{deleteModalTile.tileDesign}</strong> ({deleteModalTile.company}) from the customer showcase?
              </p>
              <p className="text-[11px] text-amber-400/80 bg-amber-950/20 border border-amber-900/30 rounded-lg p-2 mt-2">
                This only removes it from the display showcase. Warehouse inventory stock remains untouched.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalTile(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer"
              >
                {submitting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisplayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-sm">Loading display panel...</span>
        </div>
      }
    >
      <DisplayContent />
    </Suspense>
  );
}
