'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Search, Edit, X, Video, MessageSquare } from 'lucide-react';
import api from '../../../../lib/api';
import Pagination from '../../../../components/admin/Pagination';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [formData, setFormData] = useState({
    status: 'Scheduled',
    meetLink: '',
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/admin/appointments');
      if (res.data?.success) {
        setAppointments(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (appointment: any) => {
    setEditingAppointment(appointment);
    setFormData({
      status: appointment.status,
      meetLink: appointment.meetLink || '',
      notes: appointment.notes || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    try {
      await api.put(`/admin/appointments/${editingAppointment.id}`, formData);
      closeModal();
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment.');
    }
  };

  const filteredAppointments = appointments.filter(appt => 
    appt.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appt.consultingDoctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appt.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const currentItems = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-600" />
            Manage Appointments
          </h1>
          <p className="text-slate-500 text-sm mt-1">Review patient bookings, update statuses, and provide meeting links.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by patient, doctor, or status..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading appointments...</td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No appointments found.</td>
                </tr>
              ) : (
                currentItems.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {appt.patient?.name || 'Unknown'}
                      <div className="text-xs text-slate-400 font-normal">{appt.patient?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {appt.consultingDoctor?.name || 'Unknown'}
                      <div className="text-xs text-brand-600 font-medium">{appt.consultingDoctor?.specialization}</div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(appt.dateTime).toLocaleDateString()}
                      <div className="text-xs text-slate-500">{new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {appt.type === 'Video' ? <Video className="w-4 h-4 text-blue-500" /> : <MessageSquare className="w-4 h-4 text-emerald-500" />}
                        {appt.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        appt.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openModal(appt)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="-mx-px -mb-px">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAppointments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {isModalOpen && editingAppointment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Manage Appointment</h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
                <div className="text-sm"><strong>Patient:</strong> {editingAppointment.patient?.name}</div>
                <div className="text-sm"><strong>Doctor:</strong> {editingAppointment.consultingDoctor?.name}</div>
                <div className="text-sm"><strong>Date:</strong> {new Date(editingAppointment.dateTime).toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {editingAppointment.type === 'Video' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Google Meet Link</label>
                  <input 
                    type="url"
                    value={formData.meetLink} 
                    onChange={e => setFormData({...formData, meetLink: e.target.value})}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Provide this link for the patient to join the video session.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Admin Notes (Optional)</label>
                <textarea 
                  rows={3}
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
