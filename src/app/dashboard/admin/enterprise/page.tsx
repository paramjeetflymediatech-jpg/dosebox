'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Save, Store, Mail, Phone, MapPin, 
  FileText, Briefcase, Hash, ShieldCheck
} from 'lucide-react';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface EnterpriseSettings {
  enterprise_name: string;
  enterprise_legal_name: string;
  enterprise_gst: string;
  enterprise_drug_license: string;
  enterprise_fssai: string;
  enterprise_email: string;
  enterprise_phone: string;
  enterprise_address: string;
  enterprise_city: string;
  enterprise_state: string;
  enterprise_pincode: string;
}

const DEFAULT_SETTINGS: EnterpriseSettings = {
  enterprise_name: '',
  enterprise_legal_name: '',
  enterprise_gst: '',
  enterprise_drug_license: '',
  enterprise_fssai: '',
  enterprise_email: '',
  enterprise_phone: '',
  enterprise_address: '',
  enterprise_city: '',
  enterprise_state: '',
  enterprise_pincode: '',
};

export default function EnterpriseProfilePage() {
  const [settings, setSettings] = useState<EnterpriseSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      if (res.data?.success) {
        const data = res.data.data;
        const newSettings = { ...DEFAULT_SETTINGS };
        data.forEach((s: any) => {
          if (Object.keys(DEFAULT_SETTINGS).includes(s.key)) {
            (newSettings as any)[s.key] = s.value || '';
          }
        });
        setSettings(newSettings);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
      Swal.fire('Error', 'Failed to load enterprise profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const settingsArray = Object.keys(settings).map(key => ({
        key,
        value: (settings as any)[key]
      }));

      const res = await api.put('/admin/settings', { settings: settingsArray });
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Saved!',
          text: 'Enterprise profile updated successfully.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Failed to save settings', err);
      Swal.fire('Error', 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-[calc(100vh-100px)]">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-brand-600" />
            Enterprise Profile
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage your business information, GST, and legal details</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-200 hover:shadow-brand-300 hover:-translate-y-0.5 transition-all font-semibold flex items-center gap-2 disabled:opacity-70"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Basic Business Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Store className="w-5 h-5 text-brand-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Business Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Display Name</label>
                <input
                  type="text"
                  name="enterprise_name"
                  value={settings.enterprise_name}
                  onChange={handleChange}
                  placeholder="e.g. DoseBox Pharmacy"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Legal Entity Name</label>
                <input
                  type="text"
                  name="enterprise_legal_name"
                  value={settings.enterprise_legal_name}
                  onChange={handleChange}
                  placeholder="e.g. DoseBox Healthcare Pvt Ltd"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Contact Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    name="enterprise_email"
                    value={settings.enterprise_email}
                    onChange={handleChange}
                    placeholder="support@dosebox.in"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="enterprise_phone"
                    value={settings.enterprise_phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Registered Address</h2>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Street Address</label>
                <textarea
                  name="enterprise_address"
                  value={settings.enterprise_address}
                  onChange={handleChange}
                  placeholder="Complete street address..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">City</label>
                  <input
                    type="text"
                    name="enterprise_city"
                    value={settings.enterprise_city}
                    onChange={handleChange}
                    placeholder="New Delhi"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">State</label>
                  <input
                    type="text"
                    name="enterprise_state"
                    value={settings.enterprise_state}
                    onChange={handleChange}
                    placeholder="Delhi"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Pincode</label>
                  <input
                    type="text"
                    name="enterprise_pincode"
                    value={settings.enterprise_pincode}
                    onChange={handleChange}
                    placeholder="110001"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Compliance Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Legal & Compliance</h2>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">GST Number</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="enterprise_gst"
                    value={settings.enterprise_gst}
                    onChange={handleChange}
                    placeholder="e.g. 07AABCU9603R1ZX"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 uppercase rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Drug License Number</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="enterprise_drug_license"
                    value={settings.enterprise_drug_license}
                    onChange={handleChange}
                    placeholder="e.g. DL-12345"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 uppercase rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">FSSAI Number</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="enterprise_fssai"
                    value={settings.enterprise_fssai}
                    onChange={handleChange}
                    placeholder="e.g. 10012011000123"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                This information may be displayed on invoices, the public website footer, and official communications to ensure regulatory compliance.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
