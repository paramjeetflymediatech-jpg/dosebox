'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Code, ArrowLeft } from 'lucide-react';
import api from '../../../../lib/api';
import Link from 'next/link';

interface SEOSetting {
  id?: number;
  key: string;
  value: string;
}

export default function AdminGlobalSEOPage() {
  const [settings, setSettings] = useState<SEOSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Helper to get a specific key's value
  const getValue = (key: string) => {
    return settings.find(s => s.key === key)?.value || '';
  };

  // Helper to update local state
  const handleUpdate = (key: string, value: string) => {
    setSettings(prev => {
      const existingIndex = prev.findIndex(s => s.key === key);
      if (existingIndex >= 0) {
        const newSettings = [...prev];
        newSettings[existingIndex] = { ...newSettings[existingIndex], value };
        return newSettings;
      }
      return [...prev, { key, value }];
    });
  };

  const loadSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.data);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', { settings });
      alert('Global SEO Scripts saved successfully!');
    } catch (err) {
      console.error('Failed to save settings', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading Global SEO Settings...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/seo" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Code className="w-8 h-8 text-brand-600" /> Global Settings
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <p className="text-slate-600 mb-6">
          Configure site-wide visual elements (Header & Footer) and inject custom tracking scripts.
        </p>
        
        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* ================= HEADER SECTION ================= */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Header Configuration</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Site Name</label>
                  <input type="text" value={getValue('site_name')} onChange={e => handleUpdate('site_name', e.target.value)} placeholder="e.g. DoseBox.in" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Logo URL</label>
                  <input type="text" value={getValue('logo_url')} onChange={e => handleUpdate('logo_url', e.target.value)} placeholder="/logo.png or https://..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Header Scripts</label>
                <p className="text-xs text-slate-500 mb-2">Code entered here will be injected inside the &lt;head&gt; tag on every page.</p>
                <textarea 
                  value={getValue('global_head_scripts')} 
                  onChange={e => handleUpdate('global_head_scripts', e.target.value)} 
                  placeholder="<!-- Insert Google Analytics Code Here -->&#10;<script>...</script>" 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl h-32 font-mono text-sm focus:outline-none focus:border-brand-500 transition-colors"
                ></textarea>
              </div>
            </div>
          </div>

          {/* ================= FOOTER SECTION ================= */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Footer Configuration</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input type="text" value={getValue('contact_phone')} onChange={e => handleUpdate('contact_phone', e.target.value)} placeholder="1800-123-4567" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input type="text" value={getValue('contact_email')} onChange={e => handleUpdate('contact_email', e.target.value)} placeholder="care@dosebox.in" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Physical Address</label>
                  <input type="text" value={getValue('physical_address')} onChange={e => handleUpdate('physical_address', e.target.value)} placeholder="123 Pharmacy Lane, Health City" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Facebook URL</label>
                    <input type="text" value={getValue('social_facebook')} onChange={e => handleUpdate('social_facebook', e.target.value)} placeholder="https://facebook.com/..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Twitter / X URL</label>
                    <input type="text" value={getValue('social_twitter')} onChange={e => handleUpdate('social_twitter', e.target.value)} placeholder="https://twitter.com/..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Instagram URL</label>
                    <input type="text" value={getValue('social_instagram')} onChange={e => handleUpdate('social_instagram', e.target.value)} placeholder="https://instagram.com/..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                    <input type="text" value={getValue('social_linkedin')} onChange={e => handleUpdate('social_linkedin', e.target.value)} placeholder="https://linkedin.com/..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 transition-colors text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Footer Scripts</label>
                <p className="text-xs text-slate-500 mb-2">Code entered here will be injected just before the closing &lt;/body&gt; tag on every page.</p>
                <textarea 
                  value={getValue('global_footer_scripts')} 
                  onChange={e => handleUpdate('global_footer_scripts', e.target.value)} 
                  placeholder="<!-- Insert Chatbot Widget Code Here -->&#10;<script>...</script>" 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl h-32 font-mono text-sm focus:outline-none focus:border-brand-500 transition-colors"
                ></textarea>
              </div>
            </div>
          </div>
          
          <div className="pt-6 flex justify-end border-t border-slate-100">
            <button type="submit" disabled={saving} className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Scripts'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


