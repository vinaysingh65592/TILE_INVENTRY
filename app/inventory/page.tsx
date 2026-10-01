'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Boxes, Search, Edit, Trash2, X, AlertTriangle,
  PlusCircle, MapPin, Calendar, Minus, Plus, Save,
  ShoppingCart, Truck, History, Package, User, Shield,
  Loader2, ChevronDown, ArrowUpDown, Info
} from 'lucide-react';
import { TileItem, SectionItem, TilePosition, POSITION_LABELS, AuditLogItem, ACTION_LABELS } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

function InventoryContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('search') || '');
  const [selectedSection, setSelectedSection] = useState(searchParams?.get('section') || '');
  const [selectedPosition, setSelectedPosition] = useState(searchParams?.get('position') || '');
  const [sortBy, setSortBy] = useState(searchParams?.get('sort') || 'newest');

  // Data State
  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local Quantity State
  const [tempQuantities, setTempQuantities] = useState<Record<string, number>>({});
  const [savingStock, setSavingStock] = useState<Record<string, boolean>>({});

  // Modals State
  const [editModal, setEditModal] = useState<{ isOpen: boolean; tile: TileItem | null }>({ isOpen: false, tile: null });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; tile: TileItem | null }>({ isOpen: false, tile: null });
  
  // New Modals State
  const [saleModal, setSaleModal] = useState<{ tile: TileItem; quantitySold: string } | null>(null);
  const [loadModal, setLoadModal] = useState<{ tile: TileItem; quantityLoaded: string; vehicleNumber: string; referenceNumber: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ tile: TileItem; logs: AuditLogItem[]; loading: boolean } | null>(null);

  const [saleSaving, setSaleSaving] = useState(false);
  const [loadSaving, setLoadSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections');
        if (res.ok) {
          const data = await res.json();
          setSections(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch sections', err);
      }
    };
    fetchSections();
  }, []);

  // Fetch tiles
  const fetchTiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedSection) params.append('section', selectedSection);
      if (selectedPosition) params.append('position', selectedPosition);
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/tiles?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tiles');
      
      const data = await res.json();
      const tileList = data.data || [];
      setTiles(tileList);
      
      // Initialize temp quantities
      const newTempQtys: Record<string, number> = {};
      tileList.forEach((tile: TileItem) => {
        newTempQtys[tile.id] = tile.quantity;
      });
      setTempQuantities(newTempQtys);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSection, selectedPosition, sortBy]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchTiles();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchTiles, searchQuery]); // Re-fetch on filter changes

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedSection) params.append('section', selectedSection);
    if (selectedPosition) params.append('position', selectedPosition);
    if (sortBy) params.append('sort', sortBy);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  }, [searchQuery, selectedSection, selectedPosition, sortBy]);

  // Handlers for Local Quantity
  const handleTempQtyChange = (tileId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setTempQuantities(prev => ({
      ...prev,
      [tileId]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleIncrement = (tileId: string) => {
    setTempQuantities(prev => ({
      ...prev,
      [tileId]: (prev[tileId] || 0) + 1
    }));
  };

  const handleDecrement = (tileId: string) => {
    setTempQuantities(prev => ({
      ...prev,
      [tileId]: Math.max(0, (prev[tileId] || 0) - 1)
    }));
  };

  const handleSaveStock = async (tileId: string) => {
    setSavingStock(prev => ({ ...prev, [tileId]: true }));
    try {
      const res = await fetch(`/api/tiles/${tileId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newQuantity: tempQuantities[tileId] }),
      });
      
      if (!res.ok) throw new Error('Failed to update stock');
      
      toast.success('Stock updated successfully');
      await fetchTiles();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update stock');
    } finally {
      setSavingStock(prev => ({ ...prev, [tileId]: false }));
    }
  };

  // Sale Handlers
  const handleOpenSale = (tile: TileItem) => {
    setSaleModal({ tile, quantitySold: '' });
  };

  const handleConfirmSale = async () => {
    if (!saleModal) return;
    const { tile, quantitySold } = saleModal;
    const qty = parseInt(quantitySold, 10);
    
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity greater than 0');
      return;
    }
    if (qty > tile.quantity) {
      toast.error(`Cannot sell more than available stock (${tile.quantity})`);
      return;
    }

    setSaleSaving(true);
    try {
      const res = await fetch(`/api/tiles/${tile.id}/sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantitySold: qty }),
      });
      
      if (!res.ok) throw new Error('Failed to record sale');
      
      toast.success('Sale recorded successfully');
      setSaleModal(null);
      await fetchTiles();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record sale');
    } finally {
      setSaleSaving(false);
    }
  };

  // Load Handlers
  const handleOpenLoad = (tile: TileItem) => {
    setLoadModal({ tile, quantityLoaded: '', vehicleNumber: '', referenceNumber: '' });
  };

  const handleConfirmLoad = async () => {
    if (!loadModal) return;
    const { tile, quantityLoaded, vehicleNumber, referenceNumber } = loadModal;
    const qty = parseInt(quantityLoaded, 10);
    
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity greater than 0');
      return;
    }
    if (qty > tile.quantity) {
      toast.error(`Cannot load more than available stock (${tile.quantity})`);
      return;
    }
    if (!vehicleNumber.trim()) {
      toast.error('Vehicle number is required');
      return;
    }

    setLoadSaving(true);
    try {
      const res = await fetch(`/api/tiles/${tile.id}/loading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quantityLoaded: qty,
          vehicleNumber: vehicleNumber.trim(),
          referenceNumber: referenceNumber.trim()
        }),
      });
      
      if (!res.ok) throw new Error('Failed to record loading');
      
      toast.success('Loading recorded successfully');
      setLoadModal(null);
      await fetchTiles();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record loading');
    } finally {
      setLoadSaving(false);
    }
  };

  // History Handler
  const handleOpenHistory = async (tile: TileItem) => {
    setHistoryModal({ tile, logs: [], loading: true });
    try {
      const res = await fetch(`/api/tiles/${tile.id}/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistoryModal({ tile, logs: data.data || [], loading: false });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load history');
      setHistoryModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  // Edit / Delete Handlers
  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editModal.tile) return;
    setIsEditing(true);
    const formData = new FormData(e.currentTarget);
    const updates = {
      tileDesignName: formData.get('tileDesignName'),
      section: formData.get('section'),
      position: formData.get('position'),
      note: formData.get('note'),
    };
    try {
      const res = await fetch(`/api/tiles/${editModal.tile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to edit tile');
      toast.success('Tile updated successfully');
      setEditModal({ isOpen: false, tile: null });
      fetchTiles();
    } catch (error) {
      console.error(error);
      toast.error('Error updating tile');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.tile) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tiles/${deleteModal.tile.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete tile');
      toast.success('Tile deleted');
      setDeleteModal({ isOpen: false, tile: null });
      fetchTiles();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting tile');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (dateStr?: Date | string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'TILE_CREATED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'QUANTITY_UPDATE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'SALE': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'LOADING': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'TILE_EDITED': return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
      case 'TILE_DELETED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 flex items-center gap-3">
            <Boxes className="w-8 h-8 text-orange-500" />
            Inventory Management
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Manage stock, record sales, and track tile movements.</p>
        </div>
        <button
          onClick={() => router.push('/inventory/add')}
          className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-colors w-full md:w-auto justify-center min-h-[44px]"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Tile
        </button>
      </div>

      {/* Filter & Sort Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col lg:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tiles by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 min-h-[44px]"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative min-w-[160px]">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 appearance-none focus:outline-none focus:border-orange-500 min-h-[44px]"
            >
              <option value="">All Sections</option>
              {sections.map(s => (
                <option key={s.id} value={s.code}>Section {s.code}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative min-w-[160px]">
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 appearance-none focus:outline-none focus:border-orange-500 min-h-[44px]"
            >
              <option value="">All Positions</option>
              {Object.entries(POSITION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative min-w-[160px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-slate-200 appearance-none focus:outline-none focus:border-orange-500 min-h-[44px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="section">Section</option>
            </select>
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : tiles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Boxes className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">No tiles found</h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-6">
            Try adjusting your search or filters, or add a new tile design to the inventory.
          </p>
          <button
            onClick={() => router.push('/inventory/add')}
            className="text-orange-500 hover:text-orange-400 font-bold inline-flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Tile
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800">
                    <th className="p-4 font-bold text-slate-400">Design Name</th>
                    <th className="p-4 font-bold text-slate-400">Section</th>
                    <th className="p-4 font-bold text-slate-400">Position</th>
                    <th className="p-4 font-bold text-slate-400">Stock (Boxes)</th>
                    <th className="p-4 font-bold text-slate-400">Updated By</th>
                    <th className="p-4 font-bold text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tiles.map((tile) => {
                    const tempQty = tempQuantities[tile.id] ?? tile.quantity;
                    const isChanged = tempQty !== tile.quantity;
                    
                    return (
                      <tr key={tile.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="p-4">
                          <div className="font-bold text-slate-200">{tile.tileDesignName}</div>
                          {tile.note && (
                            <div className="text-sm text-slate-500 truncate max-w-[200px]" title={tile.note}>
                              {tile.note}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-slate-300">{tile.section}</td>
                        <td className="p-4 text-slate-300">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-sm font-medium border border-slate-700">
                            {POSITION_LABELS[tile.position as TilePosition] || tile.position}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-950 rounded-xl border border-slate-700 overflow-hidden h-10">
                              <button 
                                onClick={() => handleDecrement(tile.id)}
                                className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input 
                                type="number" 
                                value={tempQty}
                                onChange={(e) => handleTempQtyChange(tile.id, e.target.value)}
                                className="w-16 h-full bg-transparent text-center text-slate-200 font-bold focus:outline-none appearance-none"
                              />
                              <button 
                                onClick={() => handleIncrement(tile.id)}
                                className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            {isChanged && (
                              <button
                                onClick={() => handleSaveStock(tile.id)}
                                disabled={savingStock[tile.id]}
                                className="bg-orange-600 hover:bg-orange-500 text-white p-2 rounded-xl disabled:opacity-50 transition-colors"
                                title="Save new quantity"
                              >
                                {savingStock[tile.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-300 font-medium">{tile.lastUpdatedByName || tile.createdByName || 'Unknown'}</div>
                          <div className="text-xs text-slate-500">{formatDateTime(tile.updatedAt)}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenSale(tile)}
                              className="p-2 text-slate-400 hover:text-amber-500 bg-slate-950 hover:bg-amber-500/10 rounded-xl border border-slate-800 transition-colors"
                              title="Record Sale"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenLoad(tile)}
                              className="p-2 text-slate-400 hover:text-purple-500 bg-slate-950 hover:bg-purple-500/10 rounded-xl border border-slate-800 transition-colors"
                              title="Load for Transport"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenHistory(tile)}
                              className="p-2 text-slate-400 hover:text-blue-500 bg-slate-950 hover:bg-blue-500/10 rounded-xl border border-slate-800 transition-colors"
                              title="View History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-slate-700 mx-1"></div>
                            <button
                              onClick={() => setEditModal({ isOpen: true, tile })}
                              className="p-2 text-slate-400 hover:text-blue-400 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
                              title="Edit Tile Info"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, tile })}
                              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-rose-500/10 rounded-xl border border-slate-800 transition-colors"
                              title="Delete Tile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden grid gap-4 grid-cols-1 md:grid-cols-2">
            {tiles.map((tile) => {
              const tempQty = tempQuantities[tile.id] ?? tile.quantity;
              const isChanged = tempQty !== tile.quantity;

              return (
                <div key={tile.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-100">{tile.tileDesignName}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          <Package className="w-3.5 h-3.5 text-slate-500" />
                          {tile.section}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {POSITION_LABELS[tile.position as TilePosition] || tile.position}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setEditModal({ isOpen: true, tile })}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, tile })}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {tile.note && (
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      {tile.note}
                    </p>
                  )}

                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-bold text-slate-400">Current Stock</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTime(tile.updatedAt)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center bg-slate-900 rounded-xl border border-slate-700 h-12">
                        <button 
                          onClick={() => handleDecrement(tile.id)}
                          className="w-12 h-full flex items-center justify-center text-slate-400 active:bg-slate-800 rounded-l-xl"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <input 
                          type="number" 
                          value={tempQty}
                          onChange={(e) => handleTempQtyChange(tile.id, e.target.value)}
                          className="flex-1 w-full h-full bg-transparent text-center text-xl text-slate-100 font-black focus:outline-none appearance-none"
                        />
                        <button 
                          onClick={() => handleIncrement(tile.id)}
                          className="w-12 h-full flex items-center justify-center text-slate-400 active:bg-slate-800 rounded-r-xl"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {isChanged && (
                        <button
                          onClick={() => handleSaveStock(tile.id)}
                          disabled={savingStock[tile.id]}
                          className="bg-orange-600 active:bg-orange-700 text-white px-4 h-12 rounded-xl disabled:opacity-50 font-bold"
                        >
                          {savingStock[tile.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SAVE'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleOpenSale(tile)}
                      className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-amber-500 hover:bg-amber-500/10 transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span className="text-xs font-bold">Sale</span>
                    </button>
                    <button
                      onClick={() => handleOpenLoad(tile)}
                      className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-purple-500 hover:bg-purple-500/10 transition-colors"
                    >
                      <Truck className="w-5 h-5" />
                      <span className="text-xs font-bold">Load</span>
                    </button>
                    <button
                      onClick={() => handleOpenHistory(tile)}
                      className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-blue-500 hover:bg-blue-500/10 transition-colors"
                    >
                      <History className="w-5 h-5" />
                      <span className="text-xs font-bold">History</span>
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    Updated by <span className="text-slate-300 font-medium">{tile.lastUpdatedByName || tile.createdByName || 'Unknown'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MODALS */}

      {/* Sale Modal */}
      {saleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-amber-500" />
                Record Sale
              </h2>
              <button onClick={() => setSaleModal(null)} className="text-slate-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
              <div className="text-sm font-medium text-amber-500/80 mb-1">Available Stock</div>
              <div className="text-2xl font-black text-amber-500">
                {saleModal.tile.quantity} <span className="text-lg font-bold">Boxes</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Quantity Sold (Boxes)</label>
                <input
                  type="number"
                  value={saleModal.quantitySold}
                  onChange={(e) => setSaleModal({ ...saleModal, quantitySold: e.target.value })}
                  placeholder="Enter quantity"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 min-h-[44px]"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setSaleModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSale}
                disabled={saleSaving}
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {saleSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {loadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Truck className="w-6 h-6 text-purple-500" />
                Load for Transport
              </h2>
              <button onClick={() => setLoadModal(null)} className="text-slate-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-6">
              <div className="text-sm font-medium text-purple-500/80 mb-1">Available Stock</div>
              <div className="text-2xl font-black text-purple-500">
                {loadModal.tile.quantity} <span className="text-lg font-bold">Boxes</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Quantity Loaded (Boxes)</label>
                <input
                  type="number"
                  value={loadModal.quantityLoaded}
                  onChange={(e) => setLoadModal({ ...loadModal, quantityLoaded: e.target.value })}
                  placeholder="Enter quantity"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:outline-none focus:border-purple-500 min-h-[44px]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Vehicle Number *</label>
                <input
                  type="text"
                  value={loadModal.vehicleNumber}
                  onChange={(e) => setLoadModal({ ...loadModal, vehicleNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. MH 04 AB 1234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:outline-none focus:border-purple-500 min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Reference / Bill Number (Optional)</label>
                <input
                  type="text"
                  value={loadModal.referenceNumber}
                  onChange={(e) => setLoadModal({ ...loadModal, referenceNumber: e.target.value })}
                  placeholder="e.g. BILL-98765"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:outline-none focus:border-purple-500 min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setLoadModal(null)}
                className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLoad}
                disabled={loadSaving}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {loadSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Loading'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <History className="w-6 h-6 text-blue-500" />
                  Tile History
                </h2>
                <div className="text-sm text-slate-400 mt-1 font-medium">{historyModal.tile.tileDesignName}</div>
              </div>
              <button onClick={() => setHistoryModal(null)} className="text-slate-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {historyModal.loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : historyModal.logs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No history records found for this tile.</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[8.5rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-800">
                  {historyModal.logs.map((log) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {log.actionType === 'TILE_CREATED' && <PlusCircle className="w-4 h-4 text-emerald-500" />}
                        {log.actionType === 'QUANTITY_UPDATE' && <Save className="w-4 h-4 text-blue-500" />}
                        {log.actionType === 'SALE' && <ShoppingCart className="w-4 h-4 text-amber-500" />}
                        {log.actionType === 'LOADING' && <Truck className="w-4 h-4 text-purple-500" />}
                        {log.actionType === 'TILE_EDITED' && <Edit className="w-4 h-4 text-slate-300" />}
                        {log.actionType === 'TILE_DELETED' && <Trash2 className="w-4 h-4 text-rose-500" />}
                      </div>
                      
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md border ${getActionColor(log.actionType)}`}>
                            {ACTION_LABELS[log.actionType as keyof typeof ACTION_LABELS] || log.actionType}
                          </span>
                          <time className="text-xs font-medium text-slate-500">
                            {formatDateTime(log.createdAt)}
                          </time>
                        </div>
                        
                        <div className="text-slate-300 text-sm mb-3">
                          {log.note || 'Action performed.'}
                          {log.vehicleNumber && (
                            <div className="mt-1 font-medium text-slate-400">
                              Vehicle: <span className="text-slate-200">{log.vehicleNumber}</span>
                            </div>
                          )}
                          {log.referenceNumber && (
                            <div className="mt-1 font-medium text-slate-400">
                              Ref: <span className="text-slate-200">{log.referenceNumber}</span>
                            </div>
                          )}
                        </div>

                        {log.previousQuantity !== null && log.previousQuantity !== undefined && log.newQuantity !== null && log.newQuantity !== undefined && (
                          <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800/50 mt-3">
                            <div className="flex-1 text-center">
                              <div className="text-[10px] uppercase font-bold text-slate-500">Before</div>
                              <div className="font-bold text-slate-300">{log.previousQuantity}</div>
                            </div>
                            <div className="text-slate-600">→</div>
                            <div className="flex-1 text-center">
                              <div className="text-[10px] uppercase font-bold text-slate-500">After</div>
                              <div className="font-bold text-slate-100">{log.newQuantity}</div>
                            </div>
                            <div className="w-px h-8 bg-slate-800"></div>
                            <div className="flex-1 text-center">
                              <div className="text-[10px] uppercase font-bold text-slate-500">Change</div>
                              <div className={`font-black ${
                                ((log.newQuantity ?? 0) - (log.previousQuantity ?? 0)) > 0 ? 'text-emerald-500' :
                                ((log.newQuantity ?? 0) - (log.previousQuantity ?? 0)) < 0 ? 'text-rose-500' : 'text-slate-500'
                              }`}>
                                {((log.newQuantity ?? 0) - (log.previousQuantity ?? 0)) > 0 ? '+' : ''}
                                {(log.newQuantity ?? 0) - (log.previousQuantity ?? 0)}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-800/50 pt-3">
                          <Shield className="w-3.5 h-3.5" />
                          <span>By <span className="text-slate-300 font-bold">{log.userNameSnapshot || 'System'}</span></span>
                          {log.userRole && <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] uppercase tracking-wider">{log.userRole}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-800 shrink-0">
              <button
                onClick={() => setHistoryModal(null)}
                className="w-full px-4 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && editModal.tile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white">Edit Tile Details</h2>
              <button onClick={() => setEditModal({ isOpen: false, tile: null })} className="text-slate-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Tile Design Name</label>
                <input
                  type="text"
                  name="tileDesignName"
                  defaultValue={editModal.tile.tileDesignName}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:outline-none focus:border-orange-500 min-h-[44px]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Section</label>
                <div className="relative">
                  <select
                    name="section"
                    defaultValue={editModal.tile.section}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 appearance-none focus:outline-none focus:border-orange-500 min-h-[44px]"
                    required
                  >
                    {sections.map(s => (
                      <option key={s.id} value={s.code}>Section {s.code}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Position</label>
                <div className="relative">
                  <select
                    name="position"
                    defaultValue={editModal.tile.position}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 appearance-none focus:outline-none focus:border-orange-500 min-h-[44px]"
                    required
                  >
                    {Object.entries(POSITION_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Note (Optional)</label>
                <textarea
                  name="note"
                  defaultValue={editModal.tile.note || ''}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-slate-200 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, tile: null })}
                  className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && deleteModal.tile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Delete Tile?</h2>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete <span className="font-bold text-slate-200">{deleteModal.tile.tileDesignName}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, tile: null })}
                className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete Tile'}
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
    <Suspense fallback={
      <div className="flex justify-center items-center py-20 min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <InventoryContent />
    </Suspense>
  );
}
