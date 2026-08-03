'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Stethoscope, UploadCloud, Clock, Star } from 'lucide-react';
import api from '../../../../lib/api';
import Swal from 'sweetalert2';
import Pagination from '../../../../components/admin/Pagination';

const PREDEFINED_SPECS = [
  'General Physician',
  'Diabetologist',
  'Dermatologist',
  'Cardiologist',
  'Gynecologist',
  'Dentist',
  'Pediatrician'
];

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState('');
  const [isCustomSpec, setIsCustomSpec] = useState(false);

  // Image editor states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editImageSrc, setEditImageSrc] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotate, setImageRotate] = useState(0);
  const [imagePanX, setImagePanX] = useState(0);
  const [imagePanY, setImagePanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [formData, setFormData] = useState({
    name: '',
    specialization: 'General Physician',
    experience: 0,
    fees: 0,
    rating: 5.0,
    avatar: '',
    availability: '[]'
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Sync slots list with form data availability JSON
  useEffect(() => {
    setFormData(prev => ({ ...prev, availability: JSON.stringify(slots) }));
  }, [slots]);

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
      const specExists = PREDEFINED_SPECS.includes(doctor.specialization);
      setIsCustomSpec(!specExists);
      setFormData({
        name: doctor.name,
        specialization: doctor.specialization,
        experience: doctor.experience,
        fees: doctor.fees,
        rating: doctor.rating || 5.0,
        avatar: doctor.avatar || '',
        availability: typeof doctor.availability === 'string' ? doctor.availability : JSON.stringify(doctor.availability)
      });
      try {
        const parsed = typeof doctor.availability === 'string' ? JSON.parse(doctor.availability) : doctor.availability;
        setSlots(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setSlots([]);
      }
    } else {
      setEditingDoctor(null);
      setIsCustomSpec(false);
      setFormData({
        name: '',
        specialization: 'General Physician',
        experience: 0,
        fees: 0,
        rating: 5.0,
        avatar: '',
        availability: '[]'
      });
      setSlots([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoctor(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setEditImageSrc(reader.result as string);
      setImageZoom(1);
      setImageRotate(0);
      setImagePanX(0);
      setImagePanY(0);
      setEditorOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePanX, y: e.clientY - imagePanY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setImagePanX(e.clientX - dragStart.x);
    setImagePanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - imagePanX, y: e.touches[0].clientY - imagePanY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length === 0) return;
    setImagePanX(e.touches[0].clientX - dragStart.x);
    setImagePanY(e.touches[0].clientY - dragStart.y);
  };

  const handleApplyImage = () => {
    if (!editImageSrc) return;

    setUploadingImage(true);
    setEditorOpen(false);

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const img = new Image();
      img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, 300, 300);

        // Move origin to center of canvas
        ctx.translate(150, 150);
        ctx.rotate((imageRotate * Math.PI) / 180);
        ctx.scale(imageZoom, imageZoom);

        // Apply panning offset scaled from 192px container to 300px canvas
        const panScale = 300 / 192;
        ctx.translate((imagePanX * panScale) / imageZoom, (imagePanY * panScale) / imageZoom);

        // Emulate CSS object-contain centering
        let drawW = 300;
        let drawH = 300;
        let dx = -150;
        let dy = -150;

        const imgRatio = img.width / img.height;
        if (imgRatio > 1) {
          // Landscape
          drawW = 300;
          drawH = 300 / imgRatio;
          dx = -150;
          dy = -drawH / 2;
        } else {
          // Portrait
          drawW = 300 * imgRatio;
          drawH = 300;
          dx = -drawW / 2;
          dy = -150;
        }

        ctx.drawImage(img, dx, dy, drawW, drawH);

        // Upload cropped blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setUploadingImage(false);
            return;
          }

          try {
            const token = localStorage.getItem('accessToken');
            const file = new File([blob], 'doctor-avatar.jpg', { type: 'image/jpeg' });
            const fd = new FormData();
            fd.append('file', file);

            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              body: fd
            });
            const data = await res.json();

            if (res.ok && data.success) {
              setFormData(prev => ({ ...prev, avatar: data.fileUrl }));
              Swal.fire('Success', 'Profile photo adjusted and saved successfully.', 'success');
            } else {
              Swal.fire('Upload Failed', data.message || 'Image upload failed', 'error');
            }
          } catch (err) {
            console.error('Image upload failed', err);
            Swal.fire('Upload Failed', 'Failed to connect to image upload server', 'error');
          } finally {
            setUploadingImage(false);
          }
        }, 'image/jpeg', 0.9);
      };
      img.crossOrigin = 'anonymous';
      img.src = editImageSrc;
    }
  };

  const handleAddSlot = () => {
    const trimmed = newSlot.trim();
    if (!trimmed) return;
    if (slots.includes(trimmed)) {
      Swal.fire('Duplicate Slot', 'This availability slot already exists.', 'warning');
      return;
    }
    setSlots([...slots, trimmed]);
    setNewSlot('');
  };

  const handleRemoveSlot = (indexToRemove: number) => {
    setSlots(slots.filter((_, idx) => idx !== indexToRemove));
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
      Swal.fire('Success', `Doctor details ${editingDoctor ? 'updated' : 'saved'} successfully.`, 'success');
    } catch (error) {
      console.error('Error saving doctor:', error);
      Swal.fire('Error', 'Failed to save doctor details.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this doctor? All scheduled appointments for this practitioner will be deleted.',
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
      Swal.fire('Deleted!', 'Doctor record has been deleted.', 'success');
    } catch (error) {
      console.error('Error deleting doctor:', error);
      Swal.fire('Error', 'Failed to delete doctor.', 'error');
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
          <p className="text-slate-500 text-sm mt-1">Add, edit, or remove doctors, specializations, and schedules.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md"
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
              placeholder="Search doctors by name or specialization..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
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
                <th className="px-6 py-4">Fees</th>
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
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/50 relative">
                          {doctor.avatar ? (
                            <img src={doctor.avatar} alt={doctor.name} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Stethoscope className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{doctor.name}</p>
                          <p className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5 mt-0.5">★ {doctor.rating || '5.0'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        {doctor.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{doctor.experience} years</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{Number(doctor.fees) === 0 ? 'Free' : `₹${doctor.fees}`}</td>
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

        {filteredDoctors.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredDoctors.length / itemsPerPage)}
              totalItems={filteredDoctors.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
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

              {/* Profile Image & Rating Row */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                <div
                  onClick={() => {
                    if (formData.avatar && !uploadingImage) {
                      setEditImageSrc(formData.avatar);
                      setImageZoom(1);
                      setImageRotate(0);
                      setImagePanX(0);
                      setImagePanY(0);
                      setEditorOpen(true);
                    }
                  }}
                  className={`w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden relative group ${formData.avatar ? 'cursor-pointer hover:border-brand-500 hover:ring-2 hover:ring-brand-200/50 transition-all' : ''}`}
                  title={formData.avatar ? "Click to adjust photo positioning" : undefined}
                >
                  {formData.avatar ? (
                    <>
                      <img src={formData.avatar} alt="Doctor Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                        Adjust
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                      <Stethoscope className="w-8 h-8 mb-1" />
                      No Image
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-semibold animate-pulse">
                      Uploading...
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full text-center sm:text-left space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Doctor Profile Picture</span>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="bg-brand-50 hover:bg-brand-100 text-brand-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-brand-100">
                      <UploadCloud className="w-3.5 h-3.5 inline mr-1.5" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                        className="text-slate-500 hover:text-slate-700 text-xs font-semibold px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Or paste profile image URL directly..."
                    value={formData.avatar}
                    onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />

                  {/* Preset Avatars Selection */}
                  <div className="pt-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Or choose a preset profile picture</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Male Doctor 1', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150' },
                        { name: 'Female Doctor 1', url: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150' },
                        { name: 'Male Doctor 2', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150' },
                        { name: 'Female Doctor 2', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150' },
                        { name: 'Male Doctor 3', url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150' },
                        { name: 'Female Doctor 3', url: 'https://images.unsplash.com/photo-1591604466107-ec97de577fad?auto=format&fit=crop&q=80&w=150' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, avatar: preset.url }))}
                          className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all hover:scale-105 shrink-0 ${formData.avatar === preset.url ? 'border-brand-600 scale-105 shadow-sm ring-2 ring-brand-100' : 'border-slate-200'}`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text" required
                    placeholder="e.g. Dr. Sameer Verma"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Specialization Category</label>
                  <select
                    value={isCustomSpec ? 'Other' : formData.specialization}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Other') {
                        setIsCustomSpec(true);
                        setFormData({ ...formData, specialization: '' });
                      } else {
                        setIsCustomSpec(false);
                        setFormData({ ...formData, specialization: val });
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm bg-white"
                  >
                    {PREDEFINED_SPECS.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                    <option value="Other">Other / Custom...</option>
                  </select>
                </div>

                {isCustomSpec && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Specialization Name</label>
                    <input
                      type="text" required
                      placeholder="e.g. Cardiothoracic Surgeon"
                      value={formData.specialization}
                      onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Experience (Years)</label>
                  <input
                    type="number" required min="0" max="80"
                    placeholder="e.g. 15"
                    value={formData.experience} onChange={e => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Consultation Fee (₹)</label>
                  <input
                    type="number" required min="0" step="50"
                    placeholder="e.g. 500"
                    value={formData.fees} onChange={e => setFormData({ ...formData, fees: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                  />
                  <p className="text-xxs text-slate-400 mt-1">Enter 0 to make this consultation free.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" /> Rating (1.0 - 5.0)
                  </label>
                  <input
                    type="number" required min="1" max="5" step="0.1"
                    placeholder="5.0"
                    value={formData.rating} onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) || 5.0 })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                  />
                </div>
              </div>

              {/* Availability Slot Builder */}
              <div className="border-t border-slate-100 pt-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Define Available Time Slots
                </label>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM, 04:30 PM, or 10:00 - 12:00"
                    value={newSlot}
                    onChange={e => setNewSlot(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSlot(); } }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-100 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    Add Slot
                  </button>
                </div>


                {/* Slots display */}
                {slots.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    No time slots defined. Please enter a time above and click "Add Slot".
                  </p>
                ) : (
                  <div className="bg-slate-55 border border-slate-200 rounded-2xl p-4">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">Current Schedule ({slots.length} Slots)</span>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot, index) => (
                        <div
                          key={index}
                          className="bg-white border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:border-rose-300 transition-colors"
                        >
                          <span>{slot}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(index)}
                            className="w-4 h-4 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors font-bold text-[10px] shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-md">
                  {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Adjuster Modal Overlay */}
      {editorOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 flex flex-col items-center space-y-6">
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-lg">Adjust Profile Picture</h3>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circular Preview Container */}
            <div className="text-center w-full ">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Drag photo inside circle to position</span>
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                className="w-48 h-48 rounded-full border-4 border-slate-200 shadow-inner overflow-hidden relative bg-slate-50 cursor-move mx-auto select-none"
              >
                {editImageSrc && (
                  <img
                    src={editImageSrc}
                    alt="Editor Preview"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    style={{
                      transform: `translate(${imagePanX}px, ${imagePanY}px) scale(${imageZoom}) rotate(${imageRotate}deg)`
                    }}
                  />
                )}
              </div>
            </div>

            {/* Editor controls */}
            <div className="w-full space-y-4">
              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Zoom Level</span>
                  <span>{imageZoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={imageZoom}
                  onChange={e => setImageZoom(parseFloat(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>

              {/* Rotate Control */}
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                <span className="text-xs font-bold text-slate-600">Rotation</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImageRotate(r => r - 90)}
                    className="bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
                  >
                    Rotate Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageRotate(r => r + 90)}
                    className="bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
                  >
                    Rotate Right
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyImage}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/10 transition-colors"
              >
                Apply & Save
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
