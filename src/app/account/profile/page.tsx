'use client';

import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, Eye, EyeOff, AlertCircle, Edit3, X, Check } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    age: '',
    gender: '',
    bloodGroup: '',
    height: '',
    weight: '',
    address: '',
    dlNo: '',
    gstin: ''
  });
  const [savedData, setSavedData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
    bloodGroup: '',
    height: '',
    weight: '',
    address: '',
    dlNo: '',
    gstin: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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
        const loaded = {
          name: p.name || user?.name || '',
          phone: p.phone || user?.phone || '',
          age: p.age?.toString() || '',
          gender: p.gender || '',
          bloodGroup: p.bloodGroup || '',
          height: p.height || '',
          weight: p.weight || '',
          address: p.address || '',
          dlNo: p.dlNo || '',
          gstin: p.gstin || ''
        };
        setProfileData(prev => ({
          ...prev,
          ...loaded
        }));
        setSavedData(loaded);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoadingData(false);
    }
  }

  const handleCancel = () => {
    setProfileData(prev => ({
      ...prev,
      ...savedData,
      currentPassword: '',
      newPassword: ''
    }));
    setErrors({});
    setIsEditing(false);
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Full Name
    const trimmedName = profileData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Full Name is required';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Full Name must be at least 2 characters';
    } else if (trimmedName.length > 70) {
      newErrors.name = 'Full Name cannot exceed 70 characters';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
      newErrors.name = 'Full Name can only contain letters, spaces, and hyphens';
    }

    // 2. Phone Number
    if (profileData.phone.trim()) {
      const cleanPhone = profileData.phone.replace(/[\s\-+]/g, '').replace(/^91/, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
      }
    }

    // 3. Age
    if (profileData.age.trim()) {
      const ageNum = Number(profileData.age);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
        newErrors.age = 'Age must be a valid number between 1 and 120';
      }
    }

    // 4. Weight
    if (profileData.weight.trim()) {
      const weightNum = parseFloat(profileData.weight);
      if (isNaN(weightNum) || weightNum < 1 || weightNum > 300) {
        newErrors.weight = 'Weight must be between 1 and 300 kg';
      }
    }

    // 5. Height
    if (profileData.height.trim()) {
      if (profileData.height.trim().length > 25) {
        newErrors.height = 'Height cannot exceed 25 characters';
      }
    }

    // 6. Drug License No.
    if (profileData.dlNo.trim()) {
      const dl = profileData.dlNo.trim();
      if (dl.length < 4 || dl.length > 50) {
        newErrors.dlNo = 'Drug License No. must be 4–50 characters';
      } else if (!/^[a-zA-Z0-9\s/.-]+$/.test(dl)) {
        newErrors.dlNo = 'Contains invalid characters (only letters, numbers, /, -, . allowed)';
      }
    }

    // 7. GSTIN
    if (profileData.gstin.trim()) {
      const gstin = profileData.gstin.trim().toUpperCase();
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstin)) {
        newErrors.gstin = 'Invalid GSTIN format (e.g. 07AAAAA0000A1Z5)';
      }
    }

    // 8. Home Address
    if (profileData.address.trim()) {
      const addr = profileData.address.trim();
      if (addr.length < 5) {
        newErrors.address = 'Address must be at least 5 characters';
      } else if (addr.length > 500) {
        newErrors.address = 'Address cannot exceed 500 characters';
      }
    }

    // 9. Password Change
    if (profileData.newPassword || profileData.currentPassword) {
      if (!profileData.currentPassword) {
        newErrors.currentPassword = 'Enter current password to set a new password';
      }
      if (!profileData.newPassword) {
        newErrors.newPassword = 'Enter a new password';
      } else if (profileData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      } else if (profileData.currentPassword === profileData.newPassword) {
        newErrors.newPassword = 'New password must be different from current password';
      }
    }

    setErrors(newErrors);

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      toast.error(newErrors[errorKeys[0]]);
      return false;
    }

    return true;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setUpdatingProfile(true);
    try {
      const res = await api.put('/account/profile', profileData);
      if (res.data?.success) {
        toast.success('Profile updated successfully');
        const updated = {
          name: profileData.name,
          phone: profileData.phone,
          age: profileData.age,
          gender: profileData.gender,
          bloodGroup: profileData.bloodGroup,
          height: profileData.height,
          weight: profileData.weight,
          address: profileData.address,
          dlNo: profileData.dlNo,
          gstin: profileData.gstin
        };
        setSavedData(updated);
        setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        setErrors({});
        setIsEditing(false);
      } else {
        toast.error(res.data?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const inputClass = (field: string, extra = '') => {
    if (!isEditing) {
      return `w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/80 text-slate-800 text-sm cursor-default select-text transition-all ${extra}`;
    }
    return `w-full px-4 py-3 rounded-xl border transition-all outline-none text-sm bg-white ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/20'
        : 'border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200'
    } ${extra}`;
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
        {/* Card Header with Edit / Save Action Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-brand-600" /> Personal Information
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isEditing
                ? 'Update your details below and click "Save Changes".'
                : 'View your personal details. Click "Edit Profile" to make changes.'}
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-all shadow-sm shadow-brand-200 hover:shadow-brand-300"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={updatingProfile}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                form="profile-form"
                disabled={updatingProfile}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-all shadow-sm disabled:opacity-60"
              >
                <Check className="w-4 h-4" /> {updatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <form id="profile-form" onSubmit={handleProfileUpdate} className="space-y-6 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Full Name {isEditing && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                required={isEditing}
                disabled={!isEditing}
                value={profileData.name}
                onChange={e => {
                  setProfileData({ ...profileData, name: e.target.value });
                  clearError('name');
                }}
                className={inputClass('name')}
                placeholder="Your full name"
                maxLength={70}
              />
              {isEditing && errors.name && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                disabled={!isEditing}
                value={profileData.phone}
                onChange={e => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setProfileData({ ...profileData, phone: cleaned });
                  clearError('phone');
                }}
                className={inputClass('phone')}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              {isEditing && errors.phone && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Age</label>
              <input
                type="number"
                min="1"
                max="120"
                disabled={!isEditing}
                value={profileData.age}
                onChange={e => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setProfileData({ ...profileData, age: cleaned });
                  clearError('age');
                }}
                className={inputClass('age')}
                placeholder="e.g. 28"
              />
              {isEditing && errors.age && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.age}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Gender</label>
              <select
                disabled={!isEditing}
                value={profileData.gender}
                onChange={e => {
                  setProfileData({ ...profileData, gender: e.target.value });
                  clearError('gender');
                }}
                className={inputClass('gender')}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {isEditing && errors.gender && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.gender}
                </p>
              )}
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Blood Group</label>
              <select
                disabled={!isEditing}
                value={profileData.bloodGroup}
                onChange={e => {
                  setProfileData({ ...profileData, bloodGroup: e.target.value });
                  clearError('bloodGroup');
                }}
                className={inputClass('bloodGroup')}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
              {isEditing && errors.bloodGroup && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.bloodGroup}
                </p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Weight (kg)</label>
              <input
                type="text"
                disabled={!isEditing}
                value={profileData.weight}
                onChange={e => {
                  const cleaned = e.target.value.replace(/[^0-9.]/g, '').slice(0, 6);
                  setProfileData({ ...profileData, weight: cleaned });
                  clearError('weight');
                }}
                placeholder="e.g. 70"
                className={inputClass('weight')}
              />
              {isEditing && errors.weight && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.weight}
                </p>
              )}
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Height</label>
              <input
                type="text"
                disabled={!isEditing}
                value={profileData.height}
                onChange={e => {
                  setProfileData({ ...profileData, height: e.target.value.slice(0, 25) });
                  clearError('height');
                }}
                placeholder="e.g. 5'10&quot; or 175 cm"
                className={inputClass('height')}
                maxLength={25}
              />
              {isEditing && errors.height && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.height}
                </p>
              )}
            </div>

            {/* Drug License No. */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Drug License No. (D.L. No.)</label>
              <input
                type="text"
                disabled={!isEditing}
                value={profileData.dlNo}
                onChange={e => {
                  setProfileData({ ...profileData, dlNo: e.target.value.slice(0, 50) });
                  clearError('dlNo');
                }}
                placeholder="e.g. 20B/21B-DL12345"
                className={inputClass('dlNo')}
                maxLength={50}
              />
              {isEditing && errors.dlNo && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.dlNo}
                </p>
              )}
            </div>

            {/* GSTIN */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">GSTIN</label>
              <input
                type="text"
                disabled={!isEditing}
                value={profileData.gstin}
                onChange={e => {
                  const cleaned = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
                  setProfileData({ ...profileData, gstin: cleaned });
                  clearError('gstin');
                }}
                placeholder="e.g. 07AAAAA0000A1Z5"
                className={inputClass('gstin', 'uppercase font-mono')}
                maxLength={15}
              />
              {isEditing && errors.gstin && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.gstin}
                </p>
              )}
            </div>

            {/* Home Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">Home Address</label>
              <textarea
                disabled={!isEditing}
                value={profileData.address}
                onChange={e => {
                  setProfileData({ ...profileData, address: e.target.value.slice(0, 500) });
                  clearError('address');
                }}
                rows={3}
                placeholder="Complete street address, city, state, and pincode"
                className={inputClass('address', 'resize-none')}
                maxLength={500}
              />
              {isEditing && errors.address && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.address}
                </p>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Email Address (Cannot be changed)</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-500 cursor-not-allowed text-sm"
            />
          </div>

          {/* Change Password (only available when editing and not Google login) */}
          {isEditing && !(user as any)?.googleId && (
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" /> Change Password
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={profileData.currentPassword}
                      onChange={e => {
                        setProfileData({ ...profileData, currentPassword: e.target.value });
                        clearError('currentPassword');
                      }}
                      className={inputClass('currentPassword', 'pr-10')}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.currentPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={profileData.newPassword}
                      onChange={e => {
                        setProfileData({ ...profileData, newPassword: e.target.value });
                        clearError('newPassword');
                      }}
                      className={inputClass('newPassword', 'pr-10')}
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.newPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons at bottom when editing */}
          {isEditing && (
            <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
              <button
                disabled={updatingProfile}
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm disabled:opacity-60 text-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> {updatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                disabled={updatingProfile}
                onClick={handleCancel}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
