'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, Download, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';

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
  trackingTimeline: string;
  createdAt: string;
  items?: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderPage, setOrderPage] = useState(1);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const ordersPerPage = 5;

  useEffect(() => {
    loadOrders();
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
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">₹{Number(order.finalAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setExpandedOrderId(isExpanded ? null : order.id)} className="p-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg transition-all" title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.paymentStatus === 'Paid' && (
                        <button onClick={() => downloadInvoice(order.id)} className="p-2 bg-brand-50 border border-brand-100 text-brand-600 hover:bg-brand-100 rounded-lg transition-all" title="Download Invoice">
                          <Download className="w-4 h-4" />
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
                                  <span className="text-xs text-slate-400 block mt-0.5">Qty: {item.quantity} • ₹{Number(item.price).toFixed(2)}</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-800 flex-shrink-0">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-950 text-xs uppercase tracking-wider mb-4">Tracking Timeline</h4>
                      <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-5">
                        {timeline.map((step: any, sIdx: number) => (
                          <div key={sIdx} className="relative">
                            <div className="absolute -left-[31px] top-1 w-4 h-4 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-sm">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                            <span className="font-bold text-slate-800 text-xs block">{step.status}</span>
                            <span className="text-xs text-slate-400 block">{new Date(step.time).toLocaleString('en-IN')}</span>
                            <span className="text-xs text-slate-500 mt-1 block">{step.desc}</span>
                          </div>
                        ))}
                      </div>
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
    </div>
  );
}
