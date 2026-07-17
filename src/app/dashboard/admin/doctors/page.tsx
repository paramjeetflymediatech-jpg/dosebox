'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Stethoscope } from 'lucide-react';
import api from '../../../../lib/api';
import Swal from 'sweetalert2';
import Pagination from '../../../../components/admin/Pagination';

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    experience: 0,
    fees: 0,
    rating: 5.0,
    availability: '[]'
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/admin/doctors');
      if (res.data?.success) {
        setDoctors(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (doctor: any = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name,
        specialization: doctor.specialization,
        experience: doctor.experience,
        fees: doctor.fees,
        rating: doctor.rating,
        availability: typeof doctor.availability === 'string' ? doctor.availability : JSON.stringify(doctor.availability)
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        specialization: '',
        experience: 0,
        fees: 0,
        rating: 5.0,
        availability: '[]'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoctor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await api.put(`/admin/doctors/${editingDoctor.id}`, formData);
      } else {
        await api.post('/admin/doctors', formData);
      }
      closeModal();
      fetchDoctors();
    } catch (error) {
      console.error('Error saving doctor:', error);
      alert('Failed to save doctor.');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this doctor?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/admin/doctors/${id}`);
      fetchDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor.');
    }
  };

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-brand-600" />
            Manage Doctors
          </h1>
          <p className="text-slate-500 text-sm mt-1">Add, edit, or remove doctors and their schedules.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Doctor
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search doctors..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Specialization</th>
                <th className="px-6 py-4">Experience</th>
                <th className="px-6 py-4">Fees (₹)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading doctors...</td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No doctors found.</td>
                </tr>
              ) : (
                filteredDoctors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(doctor => (
                  <tr key={doctor.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{doctor.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        {doctor.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4">{doctor.experience} years</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">₹{doctor.fees}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openModal(doctor)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(doctor.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="-mx-4 md:-mx-8 mt-6">
          <Pagination 
            currentPage={currentPage}
            totalPages={Math.ceil(filteredDoctors.length / itemsPerPage)}
            totalItems={filteredDoctors.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input 
                    type="text" required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Specialization</label>
                  <input 
                    type="text" required
                    value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Experience (Years)</label>
                  <input 
                    type="number" required min="0"
                    value={formData.experience} onChange={e => setFormData({...formData, experience: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Consultation Fee (₹)</label>
                  <input 
                    type="number" required min="0"
                    value={formData.fees} onChange={e => setFormData({...formData, fees: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Availability (JSON Array of Time Slots)
                </label>
                <textarea 
                  required rows={4}
                  value={formData.availability} 
                  onChange={e => setFormData({...formData, availability: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono text-sm"
                  placeholder='["09:00 AM", "10:00 AM", "02:00 PM"]'
                />
                <p className="text-xs text-slate-500 mt-2">Example: <code className="bg-slate-100 px-1 py-0.5 rounded">["09:00 AM", "04:30 PM"]</code></p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
                  {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
