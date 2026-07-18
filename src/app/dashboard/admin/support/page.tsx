'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  Eye, 
  Trash2, 
  AlertCircle,
  X,
  MessageSquare,
  Clock,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Selected ticket for modal
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/support');
      const data = await res.json();
      if (data.success) {
        setTickets(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      const res = await fetch(`/api/admin/support/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTickets(tickets.filter(t => t.id !== id));
        if (selectedTicket?.id === id) setSelectedTicket(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error deleting ticket');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setTickets(tickets.map(t => t.id === id ? { ...t, status } : t));
        if (selectedTicket?.id === id) {
          setSelectedTicket({ ...selectedTicket, status });
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Open': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Open</span>;
      case 'In Progress': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'Resolved': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Resolved</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 w-fit">{status}</span>;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.name.toLowerCase().includes(search.toLowerCase()) || 
      ticket.email.toLowerCase().includes(search.toLowerCase()) ||
      ticket.orderId?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Support Tickets</h1>
          <p className="text-slate-500">Manage customer queries and issues</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filters & Search */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search name, email, or Order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-48 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Issue Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{ticket.name}</div>
                    <div className="text-xs text-slate-500">{ticket.email}</div>
                    <div className="text-xs text-slate-500">{ticket.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-700">{ticket.issueType}</span>
                    {ticket.orderId && (
                      <div className="text-xs text-brand-600 mt-1 font-mono bg-brand-50 inline-block px-1.5 py-0.5 rounded">
                        {ticket.orderId}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                    <div className="text-xs text-slate-400">
                      {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No support tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Ticket Details</h2>
                <p className="text-sm text-slate-500">Submitted on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Customer</div>
                  <div className="font-medium text-slate-900">{selectedTicket.name}</div>
                  <div className="text-sm text-slate-600">{selectedTicket.email}</div>
                  <div className="text-sm text-slate-600">{selectedTicket.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Status</div>
                  <div className="mb-2">{getStatusBadge(selectedTicket.status)}</div>
                  <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider mt-3">Issue Type</div>
                  <div className="font-medium text-slate-900">{selectedTicket.issueType}</div>
                </div>
              </div>

              {selectedTicket.orderId && (
                <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-brand-600 font-semibold uppercase tracking-wider">Related Order ID</div>
                    <div className="font-mono font-bold text-brand-900 mt-1">{selectedTicket.orderId}</div>
                  </div>
                  <button className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
                    View Order <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <div className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" /> Message
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-xl text-slate-700 whitespace-pre-wrap break-words leading-relaxed shadow-sm">
                  {selectedTicket.message}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 bg-white border-t border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm font-medium text-slate-700">Update Status:</div>
              <div className="flex flex-wrap justify-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'Open')}
                  disabled={selectedTicket.status === 'Open' || isUpdating}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mark Open
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'In Progress')}
                  disabled={selectedTicket.status === 'In Progress' || isUpdating}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mark In Progress
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')}
                  disabled={selectedTicket.status === 'Resolved' || isUpdating}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
