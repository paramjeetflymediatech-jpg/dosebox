'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, Download, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  medicine?: { name: string; images: string };
}

interface Order {
  id: number;
  status: string;
  totalAmount: string;
  finalAmount: string;
  paymentStatus: string;
  paymentMethod?: string;
  trackingTimeline: string;
  createdAt: string;
  items?: OrderItem[];
  cancelledBy?: string;
  cancelReason?: string;
  refundMethod?: string;
  refundStatus?: string;
  trackingId?: string;
}

const getRichTimeline = (order: Order, timeline: any[]) => {
  const steps = [
    'Order Placed',
    'Pharmacy Confirmed',
    'Medicine Packed',
    'Cold Chain Packed',
    'Picked by Courier',
    'Reached Hub',
    'Out for Delivery',
    'Delivered'
  ];

  let maxCompletedIndex = 0;
  if (order.status === 'Confirmed') maxCompletedIndex = Math.max(maxCompletedIndex, 1);
  if (order.status === 'Packed') maxCompletedIndex = Math.max(maxCompletedIndex, 3);
  if (order.status === 'Shipped') maxCompletedIndex = Math.max(maxCompletedIndex, 4);
  if (order.status === 'Out For Delivery') maxCompletedIndex = Math.max(maxCompletedIndex, 6);
  if (order.status === 'Delivered') maxCompletedIndex = 7;

  const timelineDescList = timeline.map(t => (t.desc + ' ' + t.status).toLowerCase());
  if (timelineDescList.some(d => d.includes('cold chain packed'))) maxCompletedIndex = Math.max(maxCompletedIndex, 3);
  if (timelineDescList.some(d => d.includes('picked by courier'))) maxCompletedIndex = Math.max(maxCompletedIndex, 4);
  if (timelineDescList.some(d => d.includes('reached hub'))) maxCompletedIndex = Math.max(maxCompletedIndex, 5);
  if (timelineDescList.some(d => d.includes('out for delivery'))) maxCompletedIndex = Math.max(maxCompletedIndex, 6);

  return steps.map((step, index) => {
    const explicitEvent = timeline.find(t => 
       (t.desc && t.desc.toLowerCase().includes(step.toLowerCase())) || 
       (t.status && t.status.toLowerCase().includes(step.toLowerCase()))
    );

    let isCompleted = index <= maxCompletedIndex || !!explicitEvent;
    if (order.status === 'Cancelled') isCompleted = false;
    let time = explicitEvent ? explicitEvent.time : null;
    let desc = explicitEvent ? explicitEvent.desc : '';

    if (index === 0 && !time) time = order.createdAt;
    if (desc === step) desc = '';

    return { step, isCompleted, time, desc, isActive: index === maxCompletedIndex && order.status !== 'Cancelled' };
  });
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderPage, setOrderPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  
  // Cancel & Refund state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'bank' | 'tokens'>('bank');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [isClaimMode, setIsClaimMode] = useState(false);
  const [liveTracking, setLiveTracking] = useState<Record<number, any>>({});
  const [loadingTracking, setLoadingTracking] = useState<Record<number, boolean>>({});
  const [tokenRefundCount, setTokenRefundCount] = useState<number>(0);

  const ordersPerPage = 5;

  useEffect(() => {
    loadOrders();
    // Fetch user's token refund usage count
    api.get('/account/profile').then(res => {
      if (res.data?.success) {
        setTokenRefundCount(res.data.data.tokenRefundCount || 0);
      }
    }).catch(() => {});
  }, []);

  async function loadOrders() {
    try {
      const res = await api.get('/orders');
      if (res.data?.success) setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (expandedOrderId) {
      const order = orders.find(o => o.id === expandedOrderId);
      if (order?.trackingId && !liveTracking[expandedOrderId] && !loadingTracking[expandedOrderId]) {
        setLoadingTracking(prev => ({ ...prev, [expandedOrderId]: true }));
        api.get(`/orders/${expandedOrderId}/track`)
          .then(res => {
            if (res.data?.success && res.data.data) {
              setLiveTracking(prev => ({ ...prev, [expandedOrderId]: res.data.data }));
            }
          })
          .catch(err => console.error('Failed to load live tracking:', err))
          .finally(() => {
            setLoadingTracking(prev => ({ ...prev, [expandedOrderId]: false }));
          });
      }
    }
  }, [expandedOrderId, orders, liveTracking, loadingTracking]);

  const openCancelModal = (order: Order, isClaim: boolean = false) => {
    setOrderToCancel(order);
    setIsClaimMode(isClaim);
    setCancelReason('');
    // For COD orders where the bonus token limit is exhausted (and it's a self-cancellation), default to 'bank'
    // since the DoseBox Tokens option will be hidden (they'd get 0 tokens)
    const codLimitReached = !isClaim && order.paymentMethod === 'COD' && tokenRefundCount >= 2;
    setRefundMethod(order.paymentMethod === 'COD' && !codLimitReached ? 'tokens' : 'bank');
    setCancelModalOpen(true);
  };

  const submitCancelOrClaim = async () => {
    if (!orderToCancel) return;
    if (!isClaimMode && !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    setIsSubmittingCancel(true);
    try {
      const endpoint = isClaimMode ? `/orders/${orderToCancel.id}/claim-refund` : `/orders/${orderToCancel.id}/cancel`;
      const res = await api.post(endpoint, {
        refundMethod,
        cancelReason: isClaimMode ? undefined : cancelReason
      });
      if (res.data?.success) {
        toast.success(isClaimMode ? 'Refund claimed successfully!' : 'Order cancelled successfully!');
        setCancelModalOpen(false);
        loadOrders();
      } else {
        toast.error(res.data?.message || 'Action failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'An error occurred');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const downloadInvoice = async (orderId: number) => {
    try {
      const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; 
      link.setAttribute('download', `Invoice_Order_${orderId}.pdf`);
      document.body.appendChild(link); 
      link.click(); 
      link.remove();
    } catch (err) {
      toast.error('Failed to download invoice PDF.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6 text-brand-600" /> My Orders
      </h3>
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm mt-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-semibold mb-4">You have not placed any orders yet.</p>
          <Link href="/medicines" className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-3 px-8 rounded-full transition-all inline-block">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.slice((orderPage - 1) * ordersPerPage, orderPage * ordersPerPage).map((order) => {
            const isExpanded = expandedOrderId === order.id;
            let timeline = [];
            try { timeline = JSON.parse(order.trackingTimeline || '[]'); } catch(e){}

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-900 text-sm">Order #OD-{order.id}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total</span>
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">₹{formatCurrency(Number(order.finalAmount))}</span>
                      {(order as any).tokensUsed > 0 && (
                        <span className="text-xs text-brand-600 font-semibold block mt-1">Tokens Used: {(order as any).tokensUsed}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg transition-all" title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.status === 'Delivered' && (
                        <button onClick={() => downloadInvoice(order.id)} className="p-2 bg-brand-50 border border-brand-100 text-brand-600 hover:bg-brand-100 rounded-lg transition-all" title="Download Invoice">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {['Pending', 'Confirmed', 'Packed'].includes(order.status) && (
                        <button onClick={() => openCancelModal(order, false)} className="px-3 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-all text-xs font-bold whitespace-nowrap">
                          Cancel Order
                        </button>
                      )}
                      {order.status === 'Cancelled' && order.refundStatus === 'Pending User Choice' && (
                        <button onClick={() => openCancelModal(order, true)} className="px-3 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-all text-xs font-bold whitespace-nowrap shadow-sm shadow-amber-500/20">
                          Claim Refund
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100">
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Ordered Items</h4>
                      <div className="space-y-3">
                        {order.items?.map((item) => {
                          let imgUrl = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=250';
                          try { if (item.medicine?.images) imgUrl = JSON.parse(item.medicine.images)[0]; } catch(e){}
                          return (
                            <div key={item.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
                                  <img src={imgUrl} className="object-contain max-h-8 mix-blend-multiply" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-slate-800 text-xs truncate">{item.medicine?.name || 'Unknown item'}</h5>
                                  <span className="text-xs text-slate-400 block mt-0.5">Qty: {item.quantity} • ₹{formatCurrency(Number(item.price))}</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-800 flex-shrink-0">₹{formatCurrency((Number(item.price) * item.quantity))}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Tracking Timeline</h4>
                        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100 shadow-sm">
                            Est. Arrival: {new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {(() => {
                        const richTimeline = getRichTimeline(order, timeline);
                        const liveData = liveTracking[order.id];
                        const isLoadingLive = loadingTracking[order.id];
                        
                        if (isLoadingLive) {
                          return (
                            <div className="flex flex-col items-center justify-center py-8 opacity-50">
                              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fetching Live Tracking from Courier...</span>
                            </div>
                          );
                        }

                        if (liveData && liveData.checkpoints && liveData.checkpoints.length > 0) {
                          return (
                            <>
                              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Live Tracking ({liveData.courier})</p>
                                <p className="text-sm font-semibold text-blue-600">AWB: {liveData.trackingId}</p>
                              </div>
                              <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-6 flex-1">
                                {liveData.checkpoints.map((cp: any, idx: number) => (
                                  <div key={idx} className={`relative opacity-100`}>
                                    <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${idx === 0 ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-emerald-500 text-white'}`}>
                                      {idx !== 0 && <CheckCircle2 className="w-3 h-3" />}
                                    </div>
                                    <span className={`font-bold text-xs block ${idx === 0 ? 'text-brand-700' : 'text-slate-800'}`}>{cp.status}</span>
                                    <span className="text-xs text-slate-400 block mt-0.5">{new Date(cp.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    {cp.desc && <span className="text-xs text-slate-500 mt-2 block bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm font-medium">{cp.desc} {cp.location ? `(${cp.location})` : ''}</span>}
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        }

                        const courierEvent = timeline.find((t: any) => t.desc && (t.desc.includes('Courier:') || t.desc.includes('AWB:')));
                        return (
                          <>
                            {courierEvent && (
                              <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Shipping Details</p>
                                <p className="text-sm font-semibold text-slate-600">{courierEvent.desc}</p>
                              </div>
                            )}
                            <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-6 flex-1">
                              {order.status === 'Cancelled' ? (
                                <>
                                  {/* Only show Order Placed when cancelled */}
                                  {(() => {
                                    const placedEntry = richTimeline[0];
                                    return (
                                      <div className="relative opacity-100">
                                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full flex items-center justify-center shadow-sm bg-emerald-500 text-white">
                                          <CheckCircle2 className="w-3 h-3" />
                                        </div>
                                        <span className="font-bold text-xs block text-slate-800">{placedEntry.step}</span>
                                        {placedEntry.time && <span className="text-xs text-slate-400 block mt-0.5">{new Date(placedEntry.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                                      </div>
                                    );
                                  })()}
                                  <div className="relative opacity-100">
                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full flex items-center justify-center shadow-sm bg-rose-500 text-white ring-4 ring-rose-100">
                                      <XCircle className="w-3 h-3" />
                                    </div>
                                    <span className="font-bold text-xs block text-rose-700">Order Cancelled</span>
                                    {order.cancelReason && (
                                      <span className="text-xs text-slate-500 mt-2 block bg-rose-50 p-2.5 rounded-lg border border-rose-100 font-medium">
                                        Reason: {order.cancelReason}
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                richTimeline.map((item, idx) => {
                                  const cleanDesc = item.desc ? item.desc.split('|').filter((s: string) => !s.includes('Courier:') && !s.includes('AWB:')).join('|').trim() : '';
                                  return (
                                    <div key={idx} className={`relative ${item.isCompleted || item.isActive ? 'opacity-100' : 'opacity-40'}`}>
                                      <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${item.isActive ? 'bg-brand-600 text-white ring-4 ring-brand-100' : item.isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                                        {item.isCompleted && <CheckCircle2 className="w-3 h-3" />}
                                      </div>
                                      <span className={`font-bold text-xs block ${item.isActive ? 'text-brand-700' : item.isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>{item.step}</span>
                                      {item.time && <span className="text-xs text-slate-400 block mt-0.5">{new Date(item.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                                      {cleanDesc && <span className="text-xs text-slate-500 mt-2 block bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm font-medium">{cleanDesc}</span>}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {Math.ceil(orders.length / ordersPerPage) > 1 && (
            <div className="flex items-center justify-center gap-6 pt-6 pb-2">
              <button
                onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                disabled={orderPage === 1}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-900 disabled:opacity-30 disabled:hover:bg-white hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm font-bold"
              >
                ←
              </button>
              <span className="text-slate-900 text-sm font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                {orderPage} / {Math.ceil(orders.length / ordersPerPage)}
              </span>
              <button
                onClick={() => setOrderPage((p) => Math.min(Math.ceil(orders.length / ordersPerPage), p + 1))}
                disabled={orderPage === Math.ceil(orders.length / ordersPerPage)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-900 disabled:opacity-30 disabled:hover:bg-white hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm font-bold"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancel / Refund Modal */}
      {cancelModalOpen && orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-extrabold text-slate-900">{isClaimMode ? 'Claim Your Refund' : 'Cancel Order'}</h3>
                <button onClick={() => setCancelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                {isClaimMode ? 'Please select how you would like to receive your refund for this cancelled order.' : 'We are sorry to see you cancel. Please choose a refund method.'}
              </p>
            </div>
            
            <div className="p-6 space-y-5">
              {!isClaimMode && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Cancellation</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    placeholder="Tell us why you are cancelling..."
                    rows={3}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Select Refund Method</label>
                
                <div className="space-y-3">
                  {orderToCancel.paymentMethod !== 'COD' && (
                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${refundMethod === 'bank' ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input type="radio" name="refundMethod" value="bank" checked={refundMethod === 'bank'} onChange={() => setRefundMethod('bank')} className="mt-1" />
                      <div>
                        <span className="block font-bold text-slate-900">Original Payment Method</span>
                        <span className="block text-xs text-slate-500 mt-0.5">Amount will be refunded to your bank/card in 5-7 days.</span>
                      </div>
                    </label>
                  )}

                  {!isClaimMode && orderToCancel.paymentMethod === 'COD' && tokenRefundCount >= 2 && (
                    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${refundMethod === 'bank' ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input type="radio" name="refundMethod" value="bank" checked={refundMethod === 'bank'} onChange={() => setRefundMethod('bank')} className="mt-1" />
                      <div>
                        <span className="block font-bold text-slate-900">Cancel Order</span>
                        <span className="block text-xs text-slate-500 mt-0.5">As this is a Cash on Delivery order, no payment needs to be refunded.</span>
                        <span className="block text-[10px] font-bold text-rose-500 mt-2 bg-rose-50 py-1 px-2 rounded w-fit">
                          * Note: You have exhausted your 2-time bonus token limit for self-cancellations.
                        </span>
                      </div>
                    </label>
                  )}

                  {/* Hide DoseBox Tokens option for COD orders when the 2-time bonus limit is exhausted (except for admin cancels) */}
                  {!(!isClaimMode && orderToCancel.paymentMethod === 'COD' && tokenRefundCount >= 2) && (
                    <label className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${refundMethod === 'tokens' ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input type="radio" name="refundMethod" value="tokens" checked={refundMethod === 'tokens'} onChange={() => setRefundMethod('tokens')} className="mt-1" />
                      <div>
                        <span className="block font-bold text-amber-900 flex items-center gap-2">
                          DoseBox Tokens
                          <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full">+ Bonus!</span>
                        </span>
                        <span className="block text-xs text-amber-700/80 mt-0.5">
                          {orderToCancel.paymentMethod === 'COD' ? (
                            `Get ${Number(orderToCancel.finalAmount) < 500 ? '50' : '100'} Bonus Tokens instantly as an apology.`
                          ) : (
                            `Get ₹${formatCurrency(Number(orderToCancel.finalAmount))} + ${Number(orderToCancel.finalAmount) < 500 ? '50' : '100'} Bonus Tokens instantly.`
                          )}
                        </span>
                        {!isClaimMode && (
                          <span className="block text-[10px] font-bold text-rose-500 mt-2 bg-rose-50 py-1 px-2 rounded w-fit">
                            * Note: This option is only available twice per lifetime for self-cancellations.
                          </span>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setCancelModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
                Close
              </button>
              <button 
                onClick={submitCancelOrClaim} 
                disabled={isSubmittingCancel || (!isClaimMode && !cancelReason.trim())}
                className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm shadow-brand-500/20"
              >
                {isSubmittingCancel ? 'Processing...' : isClaimMode ? 'Claim Refund' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
