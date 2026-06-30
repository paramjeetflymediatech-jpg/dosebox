'use client';

import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Star, CheckCircle, Video, MessageSquare, ShieldCheck, HeartPulse, Clock, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  fees: string;
  availability: string; // JSON
  avatar?: string;
  rating: string;
}

export default function ConsultationsPage() {
  const { user } = useAuth();
  
  // States
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  
  // Booking states
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [consultationType, setConsultationType] = useState<'Video' | 'Chat'>('Video');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await api.get('/appointments/doctors');
        if (res.data?.success) {
          setDoctors(res.data.data);
        }
      } catch (err) {
        console.warn('Doctor list API loading failed. Loading fallback practitioners.');
        // Set standard fallbacks
        setDoctors([
          { id: 1, name: 'Dr. Arvinder Singh', specialization: 'Diabetologist', experience: 14, fees: '500.00', availability: JSON.stringify(['09:00 AM', '11:00 AM', '04:00 PM', '06:00 PM']), rating: '4.8', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250' },
          { id: 2, name: 'Dr. Priya Ramachandran', specialization: 'Dermatologist', experience: 10, fees: '600.00', availability: JSON.stringify(['10:00 AM', '12:00 PM', '02:00 PM', '05:00 PM']), rating: '4.9', avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=250' },
          { id: 3, name: 'Dr. Rohan Mehra', specialization: 'Cardiologist', experience: 18, fees: '800.00', availability: JSON.stringify(['11:30 AM', '03:30 PM', '07:00 PM']), rating: '5.0', avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=250' }
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    
    if (!user) {
      alert('Please sign in to schedule an online appointment.');
      const signInBtn = document.querySelector('button[class*="bg-brand-600"]');
      if (signInBtn) (signInBtn as HTMLButtonElement).click();
      return;
    }

    if (!selectedSlot) {
      setBookingError('Please choose a time slot.');
      return;
    }

    try {
      // Calculate a tomorrow date target + selected slot time string
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const bookingDate = `${tomorrow.toDateString()} at ${selectedSlot}`;

      const res = await api.post('/appointments/book', {
        doctorId: selectedDoctor?.id,
        dateTime: tomorrow,
        type: consultationType,
        notes: `Simulated slot: ${bookingDate}. Reason: ${bookingNotes || 'Routine checkup.'}`
      });

      if (res.data?.success) {
        setBookingComplete(true);
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Failed to book slot.');
    }
  };

  const specializations = ['All', 'Diabetologist', 'Dermatologist', 'Cardiologist'];
  const filteredDoctors = selectedSpecialization === 'All' 
    ? doctors 
    : doctors.filter(d => d.specialization.includes(selectedSpecialization));

  if (bookingComplete) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Consultation Scheduled!</h2>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed">
          Your video consultation slot with <strong className="text-slate-800">{selectedDoctor?.name}</strong> has been successfully booked. Track slot links inside your Customer Dashboard.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <a 
            href="/account" 
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-brand-500/10 transition-colors text-sm"
          >
            Open Dashboard
          </a>
          <button 
            onClick={() => { setSelectedDoctor(null); setSelectedSlot(''); setBookingComplete(false); }}
            className="text-brand-600 font-bold text-sm hover:underline"
          >
            Consult another doctor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Section */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-10 overflow-hidden relative border border-slate-800 shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 max-w-2xl">
            <span className="text-brand-400 font-bold text-xxs uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Telemedicine agg</span>
            <h1 className="text-2xl sm:text-4xl font-extrabold mt-3">Speak to Certified Doctors & Medical Advisors Online</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
              Book digital appointments for consultations with general medicine, diabetes management experts, cardiologists and skin clinics. Secure, encrypted video sessions.
            </p>
          </div>
        </div>

        {/* Specialized Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {specializations.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialization(spec)}
              className={`py-2 px-5 rounded-full font-bold text-xs sm:text-sm transition-all border flex-shrink-0 ${selectedSpecialization === spec ? 'bg-brand-600 border-brand-600 text-white shadow' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {spec}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: DOCTORS CARDS LIST */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              [1,2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-48 animate-pulse" />
              ))
            ) : filteredDoctors.length === 0 ? (
              <p className="text-slate-400 italic font-semibold py-6 text-center bg-white rounded-2xl border border-slate-200/80">No active doctors found for this specialty.</p>
            ) : (
              filteredDoctors.map((doc) => {
                let slots: string[] = [];
                try {
                  slots = JSON.parse(doc.availability);
                } catch(e){}

                return (
                  <div 
                    key={doc.id}
                    className={`bg-white p-6 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer hover:shadow-sm ${selectedDoctor?.id === doc.id ? 'border-brand-500 bg-brand-50/5' : 'border-slate-200/80'}`}
                    onClick={() => { setSelectedDoctor(doc); setSelectedSlot(''); }}
                  >
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100">
                        {doc.avatar ? (
                          <img src={doc.avatar} alt={doc.name} className="object-cover w-full h-full" />
                        ) : (
                          <Stethoscope className="w-8 h-8 text-brand-600 m-4" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">{doc.name}</h3>
                        <span className="text-xxs font-bold text-slate-400 block mt-1 uppercase tracking-wider">{doc.specialization}</span>
                        <div className="flex items-center gap-1.5 mt-2 text-xxs text-slate-500 font-semibold">
                          <HeartPulse className="w-4 h-4 text-rose-500" />
                          <span>{doc.experience} Years Experience</span>
                          <span>•</span>
                          <span className="flex items-center text-amber-500 gap-0.5 font-bold"><Star className="w-3 h-3 fill-current" /> {doc.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 pt-4 sm:pt-0">
                      <div className="sm:text-right">
                        <span className="text-xxs text-slate-400 font-semibold uppercase tracking-wider block">Fees</span>
                        <span className="font-black text-slate-800 text-sm sm:text-base">₹{Number(doc.fees).toFixed(0)}</span>
                      </div>
                      <button className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-5 rounded-full shadow-md shadow-brand-500/10 transition-colors">
                        Select Slot
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT: SCHEDULING FORM */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 self-start shadow-sm space-y-6">
            {selectedDoctor ? (
              <form onSubmit={handleBookSlot} className="space-y-5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-600" />
                  Booking Slot Sheet
                </h3>

                {bookingError && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xxs p-3 rounded-lg">
                    {bookingError}
                  </div>
                )}

                <div>
                  <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block mb-1">Doctor Target</span>
                  <strong className="text-slate-800 text-sm block">{selectedDoctor.name}</strong>
                  <span className="text-xxs text-slate-400 italic block">{selectedDoctor.specialization}</span>
                </div>

                {/* Consultation Type Selector */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Session Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConsultationType('Video')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${consultationType === 'Video' ? 'bg-brand-550 border-brand-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      <Video className="w-4 h-4" />
                      Video Call
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsultationType('Chat')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${consultationType === 'Chat' ? 'bg-brand-550 border-brand-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Private Chat
                    </button>
                  </div>
                </div>

                {/* Slots grid */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Available Slots (Tomorrow)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {JSON.parse(selectedDoctor.availability || '[]').map((slot: string) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 rounded-xl text-xxs font-bold transition-all border ${selectedSlot === slot ? 'bg-brand-600 border-brand-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-2">Patient Symptoms (Optional)</label>
                  <textarea
                    placeholder="Briefly state symptoms, medical files background..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 focus:outline-none focus:border-brand-500 h-20 resize-none"
                  />
                </div>

                {/* Verify details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xxs space-y-1">
                  <div className="flex justify-between text-slate-400"><span className="font-semibold">Consulting Fees:</span> <strong className="text-slate-800">₹{Number(selectedDoctor.fees).toFixed(0)}</strong></div>
                  <div className="flex justify-between text-slate-400"><span className="font-semibold">GST (18% inclusive):</span> <strong className="text-slate-800">₹{(Number(selectedDoctor.fees) * 0.18).toFixed(0)}</strong></div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-lg shadow-brand-500/10 transition-all text-center"
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  Confirm and Book
                </button>
              </form>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 text-xs font-semibold">Select a medical practitioner from the list to view scheduling options.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
