'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Search, ArrowUpRight, ArrowDownLeft, RotateCcw } from 'lucide-react';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import Pagination from '../../../../components/admin/Pagination';

interface TokenTransaction {
  id: number;
  type: string;
  tokens: number;
  bonusTokens: number;
  description: string;
  createdAt: string;
  orderId?: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export default function AdminRewardsPage() {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/admin/token-transactions');
      if (res.data?.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load token transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    (tx.user?.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (tx.user?.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (tx.description || '').toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentItems = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTransactionIcon = (type: string) => {
    if (type === 'Earned') return <ArrowUpRight className="w-5 h-5 text-emerald-600" />;
    if (type === 'Redeemed') return <ArrowDownLeft className="w-5 h-5 text-rose-600" />;
    if (type === 'Refund') return <RotateCcw className="w-5 h-5 text-amber-600" />;
    return <Gift className="w-5 h-5 text-brand-600" />;
  };

  const getTransactionColor = (type: string) => {
    if (type === 'Earned') return 'bg-emerald-50 border-emerald-100 text-emerald-700';
    if (type === 'Redeemed') return 'bg-rose-50 border-rose-100 text-rose-700';
    if (type === 'Refund') return 'bg-amber-50 border-amber-100 text-amber-700';
    return 'bg-brand-50 border-brand-100 text-brand-700';
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Reward Points</h1>
            <p className="text-slate-500 text-sm mt-1">Track all DoseBox token transactions</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by user or description..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold text-right">Tokens</th>
                <th className="p-4 font-semibold text-right">Bonus Tokens</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length > 0 ? (
                currentItems.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{tx.user?.name || 'Unknown'}</span>
                        <span className="text-xs text-slate-500">{tx.user?.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getTransactionColor(tx.type)}`}>
                        {getTransactionIcon(tx.type)} {tx.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-slate-800">
                      {tx.type === 'Redeemed' ? '-' : '+'}{tx.tokens}
                    </td>
                    <td className="p-4 text-right font-black text-amber-600">
                      {tx.bonusTokens > 0 ? `+${tx.bonusTokens}` : '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No token transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredTransactions.length} itemsPerPage={itemsPerPage} />
          </div>
        )}
      </div>

    </div>
  );
}
