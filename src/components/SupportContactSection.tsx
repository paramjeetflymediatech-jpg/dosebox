'use client';

import React, { useState } from 'react';
import { Handshake, AlertCircle, CheckCircle2, HeadphonesIcon } from 'lucide-react';

export default function SupportContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    issueType: 'Institutional Supply Inquiry',
    orderId: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '', email: '', phone: '', issueType: 'Institutional Supply Inquiry', orderId: '', message: ''
        });
      } else {
        setSubmitStatus('error');
        setErrorMessage(data.message || 'Failed to submit request.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact-support" className="py-24 bg-gray-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Contact Info */}
          <div className="w-full lg:w-5/12 lg:sticky lg:top-32">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold mb-6">
              <HeadphonesIcon className="w-4 h-4" /> 24/7 Support
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
              We're here to help you.
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Whether you're looking to partner for institutional supply or need assistance with an existing order, our dedicated team is ready to assist.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-700 shrink-0">
                  <Handshake className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Sales & Partnerships</h4>
                  <p className="text-slate-500">Contact us to discuss bulk pricing, credit lines, and long-term contracts.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-700 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Order Issues</h4>
                  <p className="text-slate-500">Missing items? Damaged goods? Raise a ticket and we will resolve it immediately.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Form */}
          <div className="w-full lg:w-7/12">
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Submit a Request</h3>
              
              {submitStatus === 'success' ? (
                <div className="bg-emerald-50 text-emerald-700 p-8 rounded-2xl flex flex-col items-center text-center border border-emerald-100">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                  <h4 className="text-xl font-bold mb-2">Request Submitted!</h4>
                  <p className="text-emerald-600">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                  <button 
                    onClick={() => setSubmitStatus('idle')}
                    className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Submit Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {submitStatus === 'error' && (
                    <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-medium border border-rose-100">
                      {errorMessage}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-brand-500 focus:border-brand-500 block p-3.5 transition-colors" 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address <span className="text-rose-500">*</span></label>
                      <input 
                        type="email" 
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-brand-500 focus:border-brand-500 block p-3.5 transition-colors" 
                        placeholder="john@hospital.com" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number <span className="text-rose-500">*</span></label>
                      <input 
                        type="tel" 
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-brand-500 focus:border-brand-500 block p-3.5 transition-colors" 
                        placeholder="+91 9876543210" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">What can we help you with? <span className="text-rose-500">*</span></label>
                      <select 
                        name="issueType"
                        required
                        value={formData.issueType}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-brand-500 focus:border-brand-500 block p-3.5 transition-colors"
                      >
                        <option value="Institutional Supply Inquiry">Institutional Supply & Sales</option>
                        <option value="Order Issue">Problem with an Order</option>
                        <option value="Product Inquiry">Product Inquiry</option>
                        <option value="Billing / Invoicing">Billing / Invoicing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {formData.issueType === 'Order Issue' && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Order ID (Optional)</label>
                      <input 
                        type="text" 
                        name="orderId"
                        value={formData.orderId}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-brand-500 focus:border-brand-500 block p-3.5 transition-colors" 
                        placeholder="e.g. ORD-12345" 
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Message <span className="text-rose-500">*</span></label>
                    <textarea 
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-brand-500 focus:border-brand-500 block p-3.5 transition-colors resize-none" 
                      placeholder="Please describe your requirements or the issue you are facing in detail..." 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-brand-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                  <p className="text-xs text-slate-500 text-center mt-4">
                    By submitting this form, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
