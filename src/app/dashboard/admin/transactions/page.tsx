'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Search, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import api from '../../../../lib/api';

export default function AdminTransactionsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await api.get('/orders');
        if (res.data?.success) {
          // Sort by latest first
          const sorted = res.data.data.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch transactions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredOrders = orders.filter(o => 
    `OD-${o.id}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentIcon = (method: string) => {
    if (method === 'PhonePe') return <CreditCard className="w-4 h-4 text-brand-600" />;
    if (method === 'COD') return <Wallet className="w-4 h-4 text-amber-600" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-brand-600" /> Payment Transactions
          </h1>
          <p className="text-slate-500 mt-1 font-medium">View history of all order payments and transactions.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search Order ID, Name, Txn ID..." 
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
                <th className="p-4">Txn Ref / Order ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Loading transactions...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" /> No transactions found.
                  </td>
                </tr>
              ) : (
                filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">#OD-{order.id}</p>
                      {order.transactionId && (
                        <p className="text-xs font-mono text-slate-500 mt-0.5">{order.transactionId}</p>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {new Date(order.createdAt).toLocaleDateString()}
                      <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 text-sm">{order.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{order.user?.email}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        {getPaymentIcon(order.paymentMethod)}
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td className="p-4 font-extrabold text-slate-900 text-sm">
                      ₹{Number(order.finalAmount).toFixed(2)}
                      {order.paymentMethod === 'Points' && <span className="block text-xs text-amber-500">(Fully Paid with Points)</span>}
                    </td>
                    <td className="p-4">
                      <span className={`text-xxs font-bold px-2.5 py-1 rounded-full ${
                        order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                        order.paymentStatus === 'Failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {order.paymentStatus}
                      </span>
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
    </div>
  );
}
