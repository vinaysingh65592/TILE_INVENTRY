'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Layers, PackagePlus, Search, PlusCircle, Edit, Trash2,
  X, Tag, Shield, User, Loader2, Building2, Weight,
  Share2, IndianRupee, Sparkles, Filter
} from 'lucide-react';
import {
  MaterialItem,
  MATERIAL_CATEGORIES,
  POPULAR_MATERIAL_COMPANIES,
} from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

function MaterialsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Data states
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [selectedCompany, setSelectedCompany] = useState(searchParams?.get('company') || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.get('category') || 'ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalItem, setEditModalItem] = useState<MaterialItem | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<MaterialItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    company: '',
    materialName: '',
    weight: '20 kg',
    category: 'Tile Adhesive',
    mrp: '',
    finalMrp: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch Materials
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCompany && selectedCompany !== 'ALL') params.append('company', selectedCompany);
      if (selectedCategory && selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/materials?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load materials');
      const data = await res.json();
      setMaterials(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load material list');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCompany, selectedCategory, sortBy]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      company: POPULAR_MATERIAL_COMPANIES[0],
      materialName: '',
      weight: '20 kg',
      category: MATERIAL_CATEGORIES[0],
      mrp: '',
      finalMrp: '',
      note: '',
    });
    setAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: MaterialItem) => {
    setEditModalItem(item);
    setFormData({
      company: item.company,
      materialName: item.materialName,
      weight: item.weight,
      category: item.category || MATERIAL_CATEGORIES[0],
      mrp: item.mrp.toString(),
      finalMrp: item.finalMrp.toString(),
      note: item.note || '',
    });
  };

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.materialName.trim() || !formData.weight.trim()) {
      toast.error('Please enter company, material name, and weight/pack size');
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
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record material');

      toast.success('Material recorded successfully in material panel!');
      setAddModalOpen(false);
      fetchMaterials();
    } catch (err: any) {
      toast.error(err.message || 'Error recording material');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalItem) return;

    const numMrp = parseFloat(formData.mrp);
    const numFinal = parseFloat(formData.finalMrp);
    if (isNaN(numMrp) || isNaN(numFinal) || numMrp < 0 || numFinal < 0) {
      toast.error('Please enter valid MRP and Final MRP values');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/materials/${editModalItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update material');

      toast.success('Material details updated successfully!');
      setEditModalItem(null);
      fetchMaterials();
    } catch (err: any) {
      toast.error(err.message || 'Error updating material');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteModalItem) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/materials/${deleteModalItem.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete material');

      toast.success('Material deleted from panel.');
      setDeleteModalItem(null);
      fetchMaterials();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting material');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy Materials Quotation to Clipboard
  const copyQuotation = () => {
    if (materials.length === 0) {
      toast.info('No materials to quote.');
      return;
    }
    const lines = [
      '📦 *TILE INSTALLATION MATERIALS QUOTATION* 📦',
      '────────────────────────────',
      ...materials.map((m, i) => {
        const savings = Math.max(0, m.mrp - m.finalMrp);
        const percent = m.mrp > 0 ? Math.round((savings / m.mrp) * 100) : 0;
        return `${i + 1}. *${m.materialName}* (${m.company})\n   • Pack / Weight: ${m.weight}\n   • Type: ${m.category || 'General'}\n   • MRP: ~₹${m.mrp.toLocaleString()}~\n   • *Final Price: ₹${m.finalMrp.toLocaleString()}* (Save ₹${savings} | ${percent}% OFF)\n`;
      }),
      '────────────────────────────',
      '🚚 Genuine Manufacturer Sealed Stock with Batch Verification',
      '📞 Contact warehouse sales team for bulk bags and delivery.',
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Material quotation copied to clipboard for WhatsApp sharing!');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <PackagePlus className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              <span>Material Panel</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                {materials.length} Materials
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Tile adhesives, epoxy grouts, spacers, leveling clips, and chemicals with company specs & final pricing.
            </p>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={copyQuotation}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
            title="Copy quotation summary for WhatsApp"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Copy Quote</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Material</span>
          </button>
        </div>
      </div>

      {/* METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
          <p className="text-2xl font-black text-slate-100 mt-1">{materials.length}</p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brands</p>
          <p className="text-2xl font-black text-blue-400 mt-1">
            {new Set(materials.map((m) => m.company)).size}
          </p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Adhesives & Grouts</p>
          <p className="text-2xl font-black text-indigo-400 mt-1">
            {materials.filter((m) => m.category?.includes('Adhesive') || m.category?.includes('Grout')).length}
          </p>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Controlled By</p>
          <p className="text-xs font-bold text-emerald-400 mt-2 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Admin & Salesman
          </p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search material name, brand, weight (e.g. T01, 20 kg)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Material Brands</option>
              {POPULAR_MATERIAL_COMPANIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="newest">Recently Recorded</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="company_asc">Brand (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Categories
          </button>
          {MATERIAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* MATERIALS LIST / GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading installation materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Layers className="w-12 h-12 text-blue-400/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200">No Materials Recorded Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Record tile adhesives, epoxy grouts, spacers, and cleaning chemicals with MRP and Final MRP to manage quotes.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record First Material</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((item) => {
            const savings = Math.max(0, item.mrp - item.finalMrp);
            const savingsPercent = item.mrp > 0 ? Math.round((savings / item.mrp) * 100) : 0;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* BRAND & CATEGORY HEADER */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="bg-slate-950 border border-slate-800 text-blue-400 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{item.company}</span>
                    </span>

                    <span className="bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md text-[11px] font-medium">
                      {item.category || 'Material'}
                    </span>
                  </div>

                  {/* MATERIAL NAME */}
                  <h3 className="text-base font-black text-slate-100 group-hover:text-blue-400 transition-colors">
                    {item.materialName}
                  </h3>

                  {/* WEIGHT BADGE */}
                  <div className="inline-flex items-center gap-1.5 mt-2 bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                    <Weight className="w-3.5 h-3.5" />
                    <span>Pack: {item.weight}</span>
                  </div>

                  {/* NOTE */}
                  {item.note && (
                    <p className="text-xs text-slate-400 mt-2.5 line-clamp-2">
                      {item.note}
                    </p>
                  )}
                </div>

                {/* PRICING & SAVINGS */}
                <div className="space-y-3 pt-2">
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">MRP</p>
                      <p className="text-sm font-semibold text-slate-400 line-through">
                        ₹{item.mrp.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase font-black text-emerald-400">FINAL MRP</p>
                      <p className="text-xl font-black text-emerald-400">
                        ₹{item.finalMrp.toLocaleString()}
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
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">
                        Recorded by <strong className="text-slate-200">{item.addedByName || 'Salesman'}</strong>
                      </span>
                    </div>
                    <span className="shrink-0 text-slate-500 text-[10px]">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeleteModalItem(item)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Delete material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: RECORD NEW MATERIAL */}
      {/* ============================================================ */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Record Material Detail</h3>
                  <p className="text-xs text-slate-400">Save company, material name, weight, and pricing</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Company / Brand *
                  </label>
                  <input
                    type="text"
                    list="material-company-suggestions"
                    placeholder="e.g. Roff, Pidilite, MYK"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <datalist id="material-company-suggestions">
                    {POPULAR_MATERIAL_COMPANIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {MATERIAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Roff New Construction Tile Adhesive (T01)"
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Weight / Pack Size *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20 kg bag, 50 kg, 5 kg bucket, 100 pcs pack"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
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
                    placeholder="e.g. 450"
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
                    placeholder="e.g. 380"
                    value={formData.finalMrp}
                    onChange={(e) => setFormData({ ...formData, finalMrp: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Usage / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Recommended for ceramic & vitrified floor tiles up to 2x2"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT MATERIAL */}
      {/* ============================================================ */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Edit Material Details</h3>
                  <p className="text-xs text-slate-400">Update company, weight, MRP, or final price</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalItem(null)}
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
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {MATERIAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Weight / Pack Size *
                </label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  required
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
                  Usage / Notes (Optional)
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
                  onClick={() => setEditModalItem(null)}
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
                  <span>Update Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DELETE MATERIAL */}
      {/* ============================================================ */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-100">Delete Material?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove <strong className="text-slate-200">{deleteModalItem.materialName}</strong> ({deleteModalItem.company}) from the material panel?
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
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
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-sm">Loading material panel...</span>
        </div>
      }
    >
      <MaterialsContent />
    </Suspense>
  );
}
