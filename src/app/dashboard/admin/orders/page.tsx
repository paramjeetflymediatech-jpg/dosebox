'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, Edit2, Search, XCircle, Package, Truck, CheckCircle, CreditCard } from 'lucide-react';
import api from '../../../../lib/api';
import { formatCurrency } from '@/lib/utils';
import Pagination from '../../../../components/admin/Pagination';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updatePayment, setUpdatePayment] = useState('');
  const [trackingMessage, setTrackingMessage] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  
  // View Modal State
  const [viewOrder, setViewOrder] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders?limit=1000');
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
        trackingMessage: trackingMessage.trim() || undefined,
        cancelReason: updateStatus === 'Cancelled' ? cancelReason.trim() : undefined
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

  const handleInlineStatusUpdate = async (orderId: number, newStatus: string) => {
    if (newStatus === 'Cancelled') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setUpdateStatus('Cancelled');
        setUpdatePayment(order.paymentStatus);
        setCancelReason('');
        setTrackingMessage('');
      }
      return;
    }
    
    // Optimistic UI update
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
      fetchOrders(); // revert
    }
  };

  const handleInlinePaymentUpdate = async (orderId: number, newPayment: string) => {
    // Optimistic UI update
    setOrders(orders.map(o => o.id === orderId ? { ...o, paymentStatus: newPayment } : o));
    
    try {
      await api.put(`/orders/${orderId}`, { paymentStatus: newPayment });
    } catch (err) {
      console.error('Failed to update payment', err);
      fetchOrders(); // revert
    }
  };

  const openUpdateModal = (order: any) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setUpdatePayment(order.paymentStatus);
    setTrackingMessage('');
    setCancelReason('');
  };

  const openViewModal = (order: any) => {
    setViewOrder(order);
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = `OD-${o.id}`.toLowerCase().includes(searchTerm.toLowerCase()) || o.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    const matchesPayment = paymentFilter ? o.paymentStatus === paymentFilter : true;
    
    let matchesDate = true;
    if (dateFilter) {
      const orderDate = new Date(o.createdAt);
      const today = new Date();
      if (dateFilter === 'Today') {
        matchesDate = orderDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'This Week') {
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
        firstDayOfWeek.setHours(0,0,0,0);
        matchesDate = orderDate >= firstDayOfWeek;
      } else if (dateFilter === 'This Month') {
        matchesDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === 'Custom') {
        const start = customStartDate ? new Date(customStartDate) : null;
        const end = customEndDate ? new Date(customEndDate) : null;
        
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        
        if (start && end) {
          matchesDate = orderDate >= start && orderDate <= end;
        } else if (start) {
          matchesDate = orderDate >= start;
        } else if (end) {
          matchesDate = orderDate <= end;
        }
      }
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-brand-600" /> Order Management
          </h1>
          <p className="text-slate-500 mt-1 font-medium">View, track, and update customer orders.</p>
        </div>
      </div>

      {/* Metrics Row (Optional for quick stats) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Package className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500">Pending</p><p className="text-xl font-bold text-slate-900">{orders.filter(o => ['Pending', 'Confirmed'].includes(o.status)).length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Truck className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500">In Transit</p><p className="text-xl font-bold text-slate-900">{orders.filter(o => ['Packed', 'Shipped', 'Out For Delivery'].includes(o.status)).length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500">Delivered</p><p className="text-xl font-bold text-slate-900">{orders.filter(o => o.status === 'Delivered').length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl"><CreditCard className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500">Unpaid</p><p className="text-xl font-bold text-slate-900">{orders.filter(o => o.paymentStatus === 'Unpaid').length}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full md:w-80 flex-shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by Order ID or Name..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
            />
          </div>
          <div className="flex w-full md:w-auto gap-3 flex-wrap md:flex-nowrap">
            <select 
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className="w-full md:w-36 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
            >
              <option value="">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Range</option>
            </select>
            
            {dateFilter === 'Custom' && (
              <div className="flex gap-2 items-center animate-in fade-in zoom-in-95 duration-200">
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={e => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-full md:w-32 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium text-slate-600"
                />
                <span className="text-slate-400 font-medium">to</span>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={e => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-full md:w-32 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium text-slate-600"
                />
              </div>
            )}

            <select 
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full md:w-40 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Prescription Review">Prescription Review</option>
              <option value="Stock Replenishment">Stock Replenishment</option>
              <option value="Packaging">Packaging</option>
              <option value="Packed">Packed</option>
              <option value="Dispatch">Dispatch</option>
              <option value="Shipped">Shipped</option>
              <option value="Out For Delivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select 
              value={paymentFilter}
              onChange={e => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
              className="w-full md:w-40 px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
            >
              <option value="">All Payments</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Order Status</th>
                <th className="p-4">Payment Status</th>
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
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">No orders found matching criteria.</td>
                </tr>
              ) : (
                filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">#OD-{order.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 text-sm">{order.user?.name}</p>
                      <p className="text-xs text-slate-500">{order.user?.phone || order.user?.email}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{new Date(order.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-4 font-extrabold text-slate-900">₹{formatCurrency(Number(order.finalAmount))}</td>
                    <td className="p-4">
                      {(() => {
                        const isColdChain = order.items?.some((i: any) => i.medicine?.isColdChain);
                        return (
                          <div className="flex items-center gap-2">
                            {isColdChain && <span title="Cold Chain Requirement" className="text-blue-500 text-sm">❄️</span>}
                            <select 
                              value={order.status}
                              onChange={(e) => handleInlineStatusUpdate(order.id, e.target.value)}
                              className={`text-xs font-bold px-2 py-1.5 rounded-lg border outline-none cursor-pointer transition-colors ${
                                isColdChain ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                order.status === 'Delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                                order.status === 'Cancelled' ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                                'bg-amber-50 border-amber-200 text-amber-700'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Prescription Review">Prescription Review</option>
                              <option value="Stock Replenishment">Stock Replenishment</option>
                              <option value="Packaging">Packaging</option>
                              <option value="Packed">Packed</option>
                              <option value="Dispatch">Dispatch</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Out For Delivery">Out For Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleInlinePaymentUpdate(order.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1.5 rounded-lg border outline-none cursor-pointer transition-colors ${
                          order.paymentStatus === 'Paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                          order.paymentStatus === 'Failed' ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                          'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openViewModal(order)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors tooltip-trigger" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openUpdateModal(order)} className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors tooltip-trigger" title="Update Status">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="-mx-4 md:-mx-8 mt-6">
          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(filteredOrders.length / itemsPerPage)}
            totalItems={filteredOrders.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* View Order Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Order Details</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">#OD-{viewOrder.id}</p>
              </div>
              <button onClick={() => setViewOrder(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-white rounded-full shadow-sm">
                <XCircle className="w-8 h-8" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-brand-500" /> Status Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 font-medium">Order Status</span>
                      <span className="text-sm font-bold text-slate-900">{viewOrder.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 font-medium">Payment Status</span>
                      <span className="text-sm font-bold text-slate-900">{viewOrder.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500 font-medium">Payment Method</span>
                      <span className="text-sm font-bold text-slate-900">{viewOrder.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><Truck className="w-4 h-4 text-brand-500" /> Shipping Info</h4>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-900">{viewOrder.user?.name}</p>
                    <p className="text-sm text-slate-600 font-medium">{viewOrder.shippingAddress?.street}, {viewOrder.shippingAddress?.city}</p>
                    <p className="text-sm text-slate-600 font-medium">{viewOrder.shippingAddress?.state} - {viewOrder.shippingAddress?.zipCode}</p>
                    <p className="text-sm text-slate-600 font-medium mt-2">Phone: {viewOrder.user?.phone}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-brand-500" /> Order Items</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-4 text-xs font-bold text-slate-500">Item</th>
                        <th className="p-4 text-xs font-bold text-slate-500 text-center">Qty</th>
                        <th className="p-4 text-xs font-bold text-slate-500 text-right">Price</th>
                        <th className="p-4 text-xs font-bold text-slate-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrder.items?.map((item: any) => (
                        <tr key={item.id} className="border-b border-slate-100 last:border-0">
                          <td className="p-4">
                            <p className="font-bold text-sm text-slate-900">{item.medicine?.name}</p>
                          </td>
                          <td className="p-4 text-center text-sm font-medium text-slate-700">{item.quantity}</td>
                          <td className="p-4 text-right text-sm font-medium text-slate-700">₹{formatCurrency(Number(item.price))}</td>
                          <td className="p-4 text-right text-sm font-bold text-slate-900">₹{formatCurrency(Number(item.price) * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-full md:w-1/2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="space-y-3">
                    {(() => {
                      const totalMRP = Number(viewOrder.totalAmount) || 0;
                      const totalDiscountSaved = Number(viewOrder.discountAmount) || 0;
                      const finalAmount = Number(viewOrder.finalAmount) || 0;
                      const gstAmount = Number(viewOrder.gstAmount) || 0;
                      const tokensUsed = Number(viewOrder.tokensUsed) || 0;

                      const itemsTotalBilling = (viewOrder.items || []).reduce((sum: number, item: any) => sum + (Number(item.price) * item.quantity), 0);
                      const productDiscount = Math.max(0, totalMRP - itemsTotalBilling);
                      const couponDiscount = Math.max(0, totalDiscountSaved - productDiscount - tokensUsed);
                      
                      const baseTotal = totalMRP - totalDiscountSaved;
                      let shippingFee = 0;
                      // Determine if this order used the old bugged API (missing GST in finalAmount) or the fixed API
                      if (Math.abs(finalAmount - (baseTotal + gstAmount)) <= 51) {
                        shippingFee = Math.max(0, Math.round(finalAmount - (baseTotal + gstAmount)));
                      } else {
                        shippingFee = Math.max(0, Math.round(finalAmount - baseTotal));
                      }

                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500 font-medium">Total MRP</span>
                            <span className="text-sm font-bold text-slate-900">₹{formatCurrency(totalMRP)}</span>
                          </div>
                          {productDiscount > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-500 font-medium">Dosebox Discount</span>
                              <span className="text-sm font-bold text-emerald-600">-₹{formatCurrency(productDiscount)}</span>
                            </div>
                          )}
                          {couponDiscount > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-500 font-medium">Promo Discount</span>
                              <span className="text-sm font-bold text-indigo-600">-₹{formatCurrency(couponDiscount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                            <span className="text-sm font-bold text-slate-800">Cart Total</span>
                            <span className="text-sm font-bold text-slate-900">₹{formatCurrency(totalMRP - productDiscount)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-slate-500 font-medium">GST (18%)</span>
                            <span className="text-sm font-bold text-slate-900">₹{formatCurrency(gstAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500 font-medium">Delivery Charges</span>
                            <span className="text-sm font-bold text-slate-900">{shippingFee > 0 ? `₹${formatCurrency(shippingFee)}` : 'Free'}</span>
                          </div>
                          {tokensUsed > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-500 font-medium">Tokens Used</span>
                              <span className="text-sm font-bold text-amber-600">-₹{formatCurrency(tokensUsed)}</span>
                            </div>
                          )}
                          <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-base font-extrabold text-slate-900">Order Total</span>
                            <span className="text-lg font-extrabold text-brand-600">₹{formatCurrency(finalAmount)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setViewOrder(null)} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              
              {/* <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Order Status</label>
                  <select 
                    value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Prescription Review">Prescription Review</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out For Delivery">Out For Delivery</option>
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

              {updateStatus === 'Cancelled' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Cancellation Reason</label>
                  <textarea 
                    value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason for cancellation..."
                    className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all outline-none text-sm min-h-[80px] resize-none"
                    required
                  />
                </div>
              )} */}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Quick Timeline Updates</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['Pharmacy Confirmed', 'Stock Replenishment', 'Packaging', 'Cold Chain Packed', 'Dispatch', 'Picked by Courier', 'Reached Hub', 'Out for Delivery'].map(step => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => {
                        setTrackingMessage(step);
                        if (step === 'Pharmacy Confirmed') setUpdateStatus('Confirmed');
                        if (step === 'Stock Replenishment') setUpdateStatus('Stock Replenishment');
                        if (step === 'Packaging') setUpdateStatus('Packaging');
                        if (step === 'Medicine Packed' || step === 'Cold Chain Packed') setUpdateStatus('Packed');
                        if (step === 'Dispatch') setUpdateStatus('Dispatch');
                        if (step === 'Picked by Courier') setUpdateStatus('Shipped');
                        if (step === 'Out for Delivery') setUpdateStatus('Out For Delivery');
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                    >
                      {step}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mb-3">
                  <input type="text" placeholder="Courier Name (Optional)" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" onChange={e => setTrackingMessage(prev => prev ? `${prev} | Courier: ${e.target.value}` : `Courier: ${e.target.value}`)} />
                  <input type="text" placeholder="Tracking No. (Optional)" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" onChange={e => setTrackingMessage(prev => prev ? `${prev} | AWB: ${e.target.value}` : `AWB: ${e.target.value}`)} />
                </div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Tracking Message</label>
                <textarea 
                  value={trackingMessage} onChange={(e) => setTrackingMessage(e.target.value)}
                  placeholder="e.g. Package has been dispatched from the warehouse..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm min-h-[80px] resize-none"
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
