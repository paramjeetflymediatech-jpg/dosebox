'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import Link from 'next/link';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/notifications/${id}/read`, { 
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-brand-600 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h4 className="font-semibold text-slate-800 text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <span className="text-xs text-brand-600 font-medium">{unreadCount} new</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No notifications yet.</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`p-4 border-b border-slate-100 transition-colors ${notif.read ? 'bg-white' : 'bg-brand-50/50'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <h5 className={`text-sm ${notif.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{notif.title}</h5>
                    {!notif.read && (
                      <button onClick={() => markAsRead(notif.id)} className="text-slate-400 hover:text-brand-600" title="Mark as read">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{notif.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">{new Date(notif.createdAt).toLocaleDateString()}</span>
                    {notif.title.includes('Approved') && (
                      <Link href="/dashboard/customer/prescriptions" onClick={() => setIsOpen(false)} className="text-[11px] font-semibold text-brand-600 hover:underline">
                        View Cart &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
