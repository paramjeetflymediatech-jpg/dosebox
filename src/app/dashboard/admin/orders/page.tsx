'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, Edit2, Search, Filter, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../../../lib/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updatePayment, setUpdatePayment] = useState('');
  const [trackingMessage, setTrackingMessage] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    setIsUpdating(true);
    try {
      const res = await api.put(`/orders/${selectedOrder.id}`, {
        status: updateStatus,
        paymentStatus: updatePayment,
        trackingMessage: trackingMessage.trim() || undefined
      });
      if (res.data?.success) {
        setTrackingMessage('');
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Failed to update order', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const openUpdateModal = (order: any) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setUpdatePayment(order.paymentStatus);
    setTrackingMessage('');
  };

  const filteredOrders = orders.filter(o => 
    `OD-${o.id}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-brand-600" /> Order Management
          </h1>
          <p className="text-slate-500 mt-1 font-medium">View and update customer orders.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by Order ID or Name..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">#OD-{order.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 text-sm">{order.user?.name}</p>
                      <p className="text-xs text-slate-500">{order.user?.phone}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-extrabold text-slate-900">₹{Number(order.finalAmount).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`text-xxs font-bold px-2.5 py-1 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xxs font-bold px-2.5 py-1 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => openUpdateModal(order)} className="p-2 bg-brand-50 text-brand-600 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold">
                        <Edit2 className="w-3 h-3" /> Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {Math.ceil(filteredOrders.length / itemsPerPage) > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4">
            <span className="text-sm font-semibold text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
            </span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">Prev</button>
              <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredOrders.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Update Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-extrabold text-slate-900">Update Order #OD-{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateOrder} className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Order Status</label>
                  <select 
                    value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Prescription Review">Prescription Review</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Payment Status</label>
                  <select 
                    value={updatePayment} onChange={(e) => setUpdatePayment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Add Tracking Event (Optional)</label>
                <textarea 
                  value={trackingMessage} onChange={(e) => setTrackingMessage(e.target.value)}
                  placeholder="e.g. Package has been dispatched from the warehouse..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm min-h-[100px] resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">This message will be appended to the customer's tracking timeline.</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setSelectedOrder(null)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button disabled={isUpdating} type="submit" className="flex-1 px-6 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50">
                  {isUpdating ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
