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
  CheckCircle
} from 'lucide-react';
import api from '../../../../lib/api';

export default function DataDeletionRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Selected request for modal
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/data-deletion');
      const data = res.data;
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch data deletion requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this request record entirely?')) return;
    
    try {
      const res = await api.delete(`/admin/data-deletion/${id}`);
      const data = res.data;
      if (data.success) {
        setRequests(requests.filter(r => r.id !== id));
        if (selectedRequest?.id === id) setSelectedRequest(null);
      } else {
        alert(data.message);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error deleting request');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    setIsUpdating(true);
    try {
      const res = await api.patch(`/admin/data-deletion/${id}`, { status });
      const data = res.data;
      if (data.success) {
        setRequests(requests.map(r => r.id === id ? { ...r, status } : r));
        if (selectedRequest?.id === id) {
          setSelectedRequest({ ...selectedRequest, status });
        }
      } else {
        alert(data.message);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pending': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>;
      case 'Processed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Processed</span>;
      case 'Rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Rejected</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 w-fit">{status}</span>;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || request.status === filterStatus;
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
          <h1 className="text-2xl font-bold text-slate-800">Data Deletion Requests</h1>
          <p className="text-slate-500">Manage user requests for personal data removal</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filters & Search */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by email..."
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
            <option value="Pending">Pending</option>
            <option value="Processed">Processed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{request.email}</div>
                    {request.user && (
                      <div className="text-xs text-slate-500 mt-1">
                        Registered User: {request.user.name} (ID: {request.user.id})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(request.createdAt).toLocaleDateString()}
                    <div className="text-xs text-slate-400">
                      {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No data deletion requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Request Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Request Details</h2>
                <p className="text-sm text-slate-500">Submitted on {new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Requested Email</div>
                  <div className="font-medium text-slate-900">{selectedRequest.email}</div>
                  
                  {selectedRequest.user && (
                    <div className="mt-3">
                      <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Matched User</div>
                      <div className="font-medium text-brand-700">{selectedRequest.user.name} (ID: {selectedRequest.user.id})</div>
                      <div className="text-sm text-slate-600">{selectedRequest.user.phone}</div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Status</div>
                  <div className="mb-2">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" /> Reason for Deletion
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-xl text-slate-700 whitespace-pre-wrap break-words leading-relaxed shadow-sm">
                  {selectedRequest.reason}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 bg-white border-t border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm font-medium text-slate-700">Update Status:</div>
              <div className="flex flex-wrap justify-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'Pending')}
                  disabled={selectedRequest.status === 'Pending' || isUpdating}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mark Pending
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'Processed')}
                  disabled={selectedRequest.status === 'Processed' || isUpdating}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mark Processed
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'Rejected')}
                  disabled={selectedRequest.status === 'Rejected' || isUpdating}
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Mark Rejected
                </button>
              </div>
            </div>
            
            <div className="bg-amber-50 px-6 py-4 border-t border-amber-200">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Note: Updating the status here does not automatically delete the user's data. You must manually delete the user's data from the database if they are an active user, according to our policy.
              </p>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
