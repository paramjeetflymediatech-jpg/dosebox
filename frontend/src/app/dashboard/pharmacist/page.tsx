'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, ClipboardCheck, User, CheckCircle, XCircle, Eye, Loader2, AlertCircle, FileCheck
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';

interface Prescription {
  id: number;
  fileUrl: string;
  fileType: string;
  status: string;
  notes?: string;
  createdAt: string;
  user?: { name: string; email: string; phone?: string };
}

interface Order {
  id: number;
  status: string;
  finalAmount: string;
  paymentMethod: string;
  createdAt: string;
  user?: { name: string; email: string; phone?: string };
  prescription?: { id: number; fileUrl: string };
  items?: Array<{ id: number; quantity: number; price: string; medicine?: { name: string } }>;
}

export default function PharmacistDashboardPage() {
  const { user, isPharmacist, isAdmin } = useAuth();
  
  // States
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'orders'>('prescriptions');
  
  // Verification dialog states
  const [selectedPresc, setSelectedPresc] = useState<Prescription | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Load pending queues
  const loadQueues = async () => {
    setLoading(true);
    try {
      const [prescRes, ordersRes] = await Promise.all([
        api.get('/prescriptions?status=Pending'),
        api.get('/orders?status=Prescription Review')
      ]);
      if (prescRes.data?.success) setPrescriptions(prescRes.data.data);
      if (ordersRes.data?.success) setOrders(ordersRes.data.data);
    } catch (err) {
      console.error('Failed to load pharmacist queues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPharmacist && !isAdmin) {
      window.location.href = '/';
      return;
    }
    loadQueues();
  }, [isPharmacist, isAdmin]);

  const handleVerifyPrescription = async (status: 'Approved' | 'Rejected') => {
    if (!selectedPresc) return;
    setVerifying(true);
    try {
      const res = await api.post(`/prescriptions/${selectedPresc.id}/verify`, {
        status,
        notes: verificationNotes || `Verified by pharmacist ${user?.name}`
      });

      if (res.data?.success) {
        alert(`Prescription #${selectedPresc.id} updated to ${status}`);
        setSelectedPresc(null);
        setVerificationNotes('');
        loadQueues();
      }
    } catch (err: any) {
      alert('Verification update error: ' + (err.response?.data?.message || err.message));
    } finally {
      setVerifying(false);
    }
  };

  const handleApproveOrder = async (orderId: number) => {
    if (!confirm(`Are you sure you want to approve Order #${orderId}?`)) return;
    try {
      const res = await api.put(`/orders/${orderId}/status`, {
        status: 'Confirmed',
        remarks: `Prescription verified and signed. Order approved for packing by ${user?.name}`
      });

      if (res.data?.success) {
        alert(`Order #${orderId} approved successfully.`);
        loadQueues();
      }
    } catch (err) {
      alert('Failed to approve order.');
    }
  };

  if (loading && prescriptions.length === 0 && orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
        <p className="text-slate-400 text-sm font-semibold">Loading Validation Queues...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Pharmacist Verification Suite</h1>
            <p className="text-xs text-slate-400 mt-1">Review legal prescriptions and sign off orders awaiting medical review.</p>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('prescriptions')}
              className={`py-2 px-5 rounded-full font-bold text-xs sm:text-sm transition-all border ${activeTab === 'prescriptions' ? 'bg-brand-600 border-brand-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Prescription Queue ({prescriptions.length})
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-5 rounded-full font-bold text-xs sm:text-sm transition-all border ${activeTab === 'orders' ? 'bg-brand-600 border-brand-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Order Approval Queue ({orders.length})
            </button>
          </div>
        </div>

        {/* TAB 1: PRESCRIPTION REVIEW */}
        {activeTab === 'prescriptions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              {prescriptions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center shadow-sm">
                  <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-semibold">No pending prescriptions in queue. Good job!</p>
                </div>
              ) : (
                prescriptions.map((presc) => (
                  <div 
                    key={presc.id}
                    className={`bg-white p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer hover:shadow-sm ${selectedPresc?.id === presc.id ? 'border-brand-500 bg-brand-50/5' : 'border-slate-200/80'}`}
                    onClick={() => setSelectedPresc(presc)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block">Prescription ID: #{presc.id}</span>
                        <span className="text-xxs text-slate-500 block mt-0.5">Uploaded by: {presc.user?.name || 'Customer'} ({presc.user?.email})</span>
                        <span className="text-xxs text-slate-400 block mt-0.5">Format: {presc.fileType.toUpperCase()} • Date: {new Date(presc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button className="p-2 border border-slate-200 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Verification dialog detail panel */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 self-start shadow-sm space-y-6">
              {selectedPresc ? (
                <div className="space-y-6">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-brand-600" />
                    Prescription #{selectedPresc.id} Details
                  </h3>

                  {/* Document preview iframe or placeholder link */}
                  <div className="h-44 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                    <span className="text-xxs text-slate-400 block mb-2">Prescription Document</span>
                    <a 
                      href={selectedPresc.fileUrl.startsWith('/') ? `http://localhost:5000${selectedPresc.fileUrl}` : selectedPresc.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xxs py-1.5 px-4 rounded-full transition-all shadow flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Open Full Document
                    </a>
                  </div>

                  {/* User info */}
                  <div className="text-xs space-y-1.5 border-t border-b border-slate-100 py-3">
                    <div className="flex justify-between text-slate-400"><span className="font-semibold">Patient Name:</span> <strong className="text-slate-800">{selectedPresc.user?.name}</strong></div>
                    <div className="flex justify-between text-slate-400"><span className="font-semibold">Email ID:</span> <strong className="text-slate-800">{selectedPresc.user?.email}</strong></div>
                    <div className="flex justify-between text-slate-400"><span className="font-semibold">Phone:</span> <strong className="text-slate-800">{selectedPresc.user?.phone || 'N/A'}</strong></div>
                  </div>

                  {/* Remarks input */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Verification Notes / Remarks</label>
                    <textarea
                      placeholder="Specify validation confirmation or reason for rejection..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 focus:outline-none focus:border-brand-500 h-24 resize-none"
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVerifyPrescription('Rejected')}
                      disabled={verifying}
                      className="flex-1 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleVerifyPrescription('Approved')}
                      disabled={verifying}
                      className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-xs font-semibold">Select a prescription from the queue on the left to start verification.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: ORDER APPROVAL */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center shadow-sm">
                <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-semibold">No orders awaiting prescription review. All clear!</p>
              </div>
            ) : (
              orders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">Order #OD-{order.id}</span>
                      <span className="bg-rose-50 text-rose-600 border border-rose-100 rounded text-xxs font-bold py-0.5 px-2.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Rx Review Required
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-400">
                      <div>Customer: <strong className="text-slate-700">{order.user?.name} ({order.user?.email})</strong></div>
                      <div>Amount: <strong className="text-slate-700">₹{Number(order.finalAmount).toFixed(2)}</strong></div>
                      <div>Attached Prescription: 
                        {order.prescription ? (
                          <a 
                            href={order.prescription.fileUrl.startsWith('/') ? `http://localhost:5000${order.prescription.fileUrl}` : order.prescription.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-brand-600 font-bold hover:underline ml-1"
                          >
                            Open Prescription #{order.prescription.id}
                          </a>
                        ) : (
                          <strong className="text-rose-600 ml-1">None Attached</strong>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleApproveOrder(order.id)}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-5 rounded-full transition-all shadow flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve & Pack
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
