'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus, XCircle, Search, Settings, ShieldCheck, User, Truck, UserCircle, Briefcase } from 'lucide-react';
import api from '../../../../lib/api';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/roles');
      if (res.data?.success) {
        setRoles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      setError('Role name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await api.post('/admin/roles', { name: newRoleName.trim() });
      if (res.data?.success) {
        setNewRoleName('');
        setIsModalOpen(false);
        fetchRoles();
      }
    } catch (err: any) {
      console.error('Failed to create role', err);
      setError(err.response?.data?.message || 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('admin')) return <ShieldCheck className="w-5 h-5" />;
    if (lower.includes('customer')) return <UserCircle className="w-5 h-5" />;
    if (lower.includes('deliver')) return <Truck className="w-5 h-5" />;
    if (lower.includes('cashier')) return <Briefcase className="w-5 h-5" />;
    return <User className="w-5 h-5" />;
  };

  const getRoleColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('super')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (lower.includes('admin')) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (lower.includes('customer')) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (lower.includes('deliver')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (lower.includes('cashier')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-brand-600" /> Roles & Permissions
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Manage user access levels across the platform.</p>
        </div>
        <button 
          onClick={() => { setIsModalOpen(true); setError(''); setNewRoleName(''); }}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Roles</p>
            <p className="text-3xl font-black text-slate-900">{roles.length}</p>
          </div>
          <div className="p-4 bg-brand-50 rounded-xl text-brand-600">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">System Roles</p>
            <p className="text-3xl font-black text-slate-900">{roles.filter(r => ['Admin', 'SuperAdmin', 'Customer'].includes(r.name)).length}</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-xl text-rose-600">
            <Settings className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800 text-lg">Directory</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search roles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-bold">Loading...</div>
          ) : filteredRoles.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-bold">No roles found matching "{searchTerm}".</div>
          ) : (
            filteredRoles.map(role => (
              <div key={role.id} className="group p-5 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md hover:bg-brand-50/10 transition-all flex items-center gap-4">
                <div className={`p-3 rounded-xl border ${getRoleColor(role.name)} bg-opacity-50`}>
                  {getRoleIcon(role.name)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-700 transition-colors">{role.name}</h3>
                  <p className="text-xs font-semibold text-slate-400">Role ID: #{role.id}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-600" /> Create New Role
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateRole} className="p-6 space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 text-rose-600 text-sm font-bold border border-rose-200 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Cashier, Delivery, Manager"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 transition-all outline-none font-medium text-slate-700"
                  required
                />
                <p className="text-xs text-slate-500 mt-2 font-medium">This role name will be used throughout the system for permissions.</p>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all">
                  Cancel
                </button>
                <button disabled={isSubmitting} type="submit" className="flex-1 px-6 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-all shadow-sm shadow-brand-200 disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
