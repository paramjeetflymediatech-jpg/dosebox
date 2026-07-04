'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Stethoscope, Clock, Calendar, Video, MessageSquare } from 'lucide-react';
import api from '../../../lib/api';
import Link from 'next/link';

export default function ConsultationsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const res = await api.get('/account/appointments');
        if (res.data?.success) {
          setAppointments(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadAppointments();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
        <Stethoscope className="w-6 h-6 text-brand-600" />
        My Consultations
      </h2>

      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">You haven't booked any consultations yet.</p>
          <Link href="/consultations" className="inline-block mt-4 text-brand-600 font-bold hover:underline">
            Book a Doctor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div key={appt.id} className="border border-slate-100 p-5 rounded-xl hover:border-brand-200 transition-colors bg-slate-50">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{appt.consultingDoctor?.name || 'Unknown Doctor'}</h3>
                  <p className="text-sm text-slate-500">{appt.consultingDoctor?.specialization}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold inline-block self-start sm:self-auto ${
                  appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                  appt.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {appt.status}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  {new Date(appt.dateTime).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <Clock className="w-4 h-4 text-brand-500" />
                  {new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  {appt.type === 'Video' ? <Video className="w-4 h-4 text-blue-500" /> : <MessageSquare className="w-4 h-4 text-blue-500" />}
                  {appt.type} Session
                </div>
              </div>

              {appt.notes && (
                <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100">
                  <strong>Notes:</strong> {appt.notes}
                </div>
              )}
              
              {appt.status === 'Scheduled' && (
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                  {appt.meetLink ? (
                    <a 
                      href={appt.meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-6 rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2"
                    >
                      {appt.type === 'Video' ? <Video className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      Join {appt.type} Session
                    </a>
                  ) : (
                    <button disabled className="bg-slate-200 text-slate-500 font-bold py-2 px-6 rounded-lg text-sm cursor-not-allowed">
                      Link Pending
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
