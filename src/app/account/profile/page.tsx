'use client';

import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();

  const [profileData, setProfileData] = useState({
    name: '', phone: '', currentPassword: '', newPassword: '',
    age: '', gender: '', bloodGroup: '', height: '', weight: '', address: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    setProfileData(prev => ({ ...prev, name: user.name || '', phone: user.phone || '' }));
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    setLoadingData(true);
    try {
      const profileRes = await api.get('/account/profile');
      if (profileRes.data?.success) {
        const p = profileRes.data.data;
        setProfileData(prev => ({
          ...prev,
          name: p.name || prev.name,
          phone: p.phone || prev.phone,
          age: p.age?.toString() || '',
          gender: p.gender || '',
          bloodGroup: p.bloodGroup || '',
          height: p.height || '',
          weight: p.weight || '',
          address: p.address || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoadingData(false);
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await api.put('/account/profile', profileData);
      if (res.data?.success) {
        toast.success('Profile updated successfully');
        setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      } else {
        toast.error(res.data?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-brand-600" /> Personal Information
        </h3>
        <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Full Name</label>
              <input
                type="text" required value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Phone Number</label>
              <input
                type="text" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Age</label>
              <input
                type="number" value={profileData.age} onChange={e => setProfileData({ ...profileData, age: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Gender</label>
              <select
                value={profileData.gender} onChange={e => setProfileData({ ...profileData, gender: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Blood Group</label>
              <select
                value={profileData.bloodGroup} onChange={e => setProfileData({ ...profileData, bloodGroup: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Weight (kg)</label>
              <input
                type="text" value={profileData.weight} onChange={e => setProfileData({ ...profileData, weight: e.target.value })} placeholder="e.g. 70"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Height</label>
              <input
                type="text" value={profileData.height} onChange={e => setProfileData({ ...profileData, height: e.target.value })} placeholder="e.g. 5'10&quot;"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">Home Address</label>
              <textarea
                value={profileData.address} onChange={e => setProfileData({ ...profileData, address: e.target.value })} rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm resize-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Email Address (Cannot be changed)</label>
            <input
              type="email" disabled value={user?.email}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed text-sm"
            />
          </div>

          {!(user as any)?.googleId && (
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" /> Change Password</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Current Password</label>
                  <input
                    type="password" value={profileData.currentPassword} onChange={e => setProfileData({ ...profileData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">New Password</label>
                  <input
                    type="password" value={profileData.newPassword} onChange={e => setProfileData({ ...profileData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <button disabled={updatingProfile} type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm">
              {updatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
