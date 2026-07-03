'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Search, AlertCircle, Trash2, Edit2, Plus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function PrescriptionReviewModal({ rx, onClose, onSuccess }: { rx: any, onClose: () => void, onSuccess: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState('');

  // Initialize items from AI matches
  useEffect(() => {
    if (rx?.extractedMedicines) {
      const initialItems = rx.extractedMedicines.map((med: any) => {
        let product = med.matchedProduct?.product;
        return {
          id: Math.random().toString(), // temp ID for UI
          extractedName: med.medicineName,
          requestedQuantity: parseInt(med.quantity) || 1,
          product: product || null,
          matchType: product ? (med.matchedProduct.matchType === 'Exact' ? 'exact' : 'alternative') : 'none'
        };
      });
      setItems(initialItems);
    }
  }, [rx]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/medicines/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (index: number, product: any) => {
    const newItems = [...items];
    newItems[index].product = product;
    newItems[index].matchType = 'alternative';
    setItems(newItems);
    setEditingIndex(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].requestedQuantity = qty;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    setItems([...items, { id: Math.random().toString(), extractedName: 'Manual Entry', requestedQuantity: 1, product: null, matchType: 'none' }]);
    setEditingIndex(items.length);
  };

  const handleApprove = async () => {
    // Validate stock
    const outOfStock = items.find(item => item.product && item.requestedQuantity > item.product.stock);
    if (outOfStock) {
      toast.error(`Cannot approve: ${outOfStock.product.name} has insufficient stock.`);
      return;
    }
    
    // Ensure all items have a product
    if (items.some(item => !item.product)) {
      toast.error('All items must be mapped to a product before approval, or remove them.');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/admin/prescriptions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId: rx.id,
          userId: rx.userId,
          notes,
          items: items.map(i => ({
            medicineId: i.product.id,
            quantity: i.requestedQuantity,
            price: i.product.discountPrice || i.product.price,
            type: i.matchType
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Prescription approved & Draft Cart created!');
        onSuccess();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to approve prescription');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/prescriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rx.id, status: 'Rejected', pharmacistNotes: notes })
      });
      if (res.ok) {
        toast.success('Prescription rejected');
        onSuccess();
      }
    } catch (error) {
      toast.error('Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Review Prescription #{rx.id} - {rx.user?.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Left: Image */}
          <div className="w-full lg:w-1/2 p-6 flex flex-col bg-slate-50">
            <h4 className="font-semibold text-slate-700 mb-4">Uploaded Document</h4>
            <div className="flex-1 relative w-full min-h-[400px] bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
              {rx.fileUrl?.endsWith('.pdf') ? (
                <iframe src={rx.fileUrl} className="w-full h-full" />
              ) : (
                <Image src={rx.fileUrl} alt="Prescription" fill className="object-contain" />
              )}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pharmacist Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm min-h-[100px]"
                placeholder="Add notes for the customer..."
              ></textarea>
            </div>
          </div>

          {/* Right: Cart Builder */}
          <div className="w-full lg:w-1/2 p-6 flex flex-col bg-white">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-slate-700">Build Draft Cart</h4>
              <button onClick={handleAddItem} className="text-sm text-brand-600 font-semibold flex items-center gap-1 hover:text-brand-700">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              {items.map((item, idx) => (
                <div key={item.id} className={`p-4 rounded-xl border ${!item.product ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-bold text-slate-800 text-sm">Requested: {item.extractedName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingIndex(editingIndex === idx ? null : idx)} className="text-slate-400 hover:text-brand-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {item.product ? (
                    <div className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span className="font-semibold text-slate-700">{item.product.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{item.product.genericName}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500">Qty:</span>
                          <input 
                            type="number" 
                            min="1" 
                            value={item.requestedQuantity}
                            onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                            className="w-16 p-1 text-sm border rounded text-center"
                          />
                        </div>
                        {item.product.stock >= item.requestedQuantity ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">In Stock ({item.product.stock})</span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Out of Stock ({item.product.stock})</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-amber-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> No product matched. Please select one.
                    </div>
                  )}

                  {editingIndex === idx && (
                    <div className="mt-3 p-3 bg-slate-100 rounded-lg border border-slate-200">
                      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
                        <input 
                          type="text" 
                          placeholder="Search generic or brand..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 p-2 text-sm rounded border border-slate-300"
                        />
                        <button type="submit" className="px-3 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">
                          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                      </form>
                      
                      {searchResults.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {searchResults.map(res => (
                            <div key={res.id} className="flex justify-between items-center p-2 bg-white rounded border border-slate-200 hover:border-brand-300 cursor-pointer" onClick={() => handleSelectProduct(idx, res)}>
                              <div>
                                <div className="font-semibold text-sm text-slate-800">{res.name}</div>
                                <div className="text-xs text-slate-500">{res.genericName}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-brand-600">₹{(res.discountPrice || res.price).toFixed(2)}</div>
                                <div className={`text-[10px] ${res.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>Stock: {res.stock}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No items in the draft cart.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex gap-3">
              <button 
                onClick={handleReject}
                disabled={processing}
                className="flex-1 py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors"
              >
                Reject Prescription
              </button>
              <button 
                onClick={handleApprove}
                disabled={processing || items.length === 0}
                className="flex-[2] py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Approve & Generate Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
