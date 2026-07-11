'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';

export default function DoseBoxTokensPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [currentTokens, setCurrentTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.get('/account/rewards/history');
        if (res.data?.success) {
          setHistory(res.data.data);
          setCurrentTokens(res.data.currentTokens || 0);
        }
      } catch (err) {
        console.error('Failed to load rewards history', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadHistory();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Reward Points Card */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 sm:p-8 shadow-lg shadow-amber-500/20 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-white" /> Your DoseBox Tokens
          </h3>
          <p className="text-amber-100 font-medium text-sm mt-1">
            Earn tokens on every purchase! 1 Token = ₹1 discount on your next order.
          </p>
        </div>
        <div className="bg-white/20 px-6 py-4 rounded-2xl border border-white/20 backdrop-blur-md text-center min-w-[140px]">
          <span className="block text-4xl font-black tracking-tight">{currentTokens}</span>
          <span className="block text-xs font-bold text-amber-100 uppercase tracking-widest mt-1">Total Tokens</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-extrabold text-slate-900 mb-4">How it works</h3>
        <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
          <li>Earn points every time you purchase medicines.</li>
          <li>Redeem your points during checkout for direct discounts.</li>
          <li>Points do not expire and can be stacked with other coupons.</li>
          <li><strong>Cancellation Guarantee:</strong> If we are unable to deliver your prepaid order, your refund is credited instantly as Reward Points, along with a bonus! Get 50 extra points for orders up to ₹500, and 100 extra points for orders above ₹500.</li>
        </ul>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-brand-600" />
          Reward Points History
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
          </div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 rounded-tl-lg rounded-bl-lg">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right rounded-tr-lg rounded-br-lg">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        tx.type === 'Redeemed' ? 'bg-rose-50 text-rose-600' :
                        tx.type === 'Refund' || tx.type === 'Bonus' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-brand-50 text-brand-600'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-800">{tx.description}</td>
                    <td className="px-4 py-4 text-right font-black flex flex-col items-end gap-1">
                      {tx.tokens > 0 ? (
                        <>
                          {tx.type === 'Refund' && tx.bonusTokens > 0 && (tx.tokens - tx.bonusTokens) > 0 && (
                            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                              ₹{tx.tokens - tx.bonusTokens} + {tx.bonusTokens} Bonus =
                            </span>
                          )}
                          <span className="text-emerald-600 flex items-center text-base"><ArrowUpRight className="w-4 h-4 mr-0.5" /> +{tx.tokens}</span>
                        </>
                      ) : (
                        <span className="text-rose-600 flex items-center text-base"><ArrowDownRight className="w-4 h-4 mr-0.5" /> {tx.tokens}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No reward transactions found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
