import React from 'react';
import { RefreshCcw, AlertTriangle, HelpCircle } from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <div className="bg-slate-50/50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-[2rem] border border-slate-100/50 shadow-sm p-8 sm:p-12">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-8">
            <RefreshCcw className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Return & Safety Policy
          </h1>
          <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">
            Ensuring patient safety is our top priority. Due to the sensitive nature of pharmaceutical products, our return policy is strictly regulated.
          </p>

          <div className="space-y-8">
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 flex gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Non-Returnable Items</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  To ensure the safety and efficacy of medications for all our patients, we cannot accept returns for:
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm text-slate-600 space-y-1">
                  <li>Opened or tampered packaging.</li>
                  <li>Temperature-controlled medications (e.g., insulin, certain vaccines) once they leave our facility.</li>
                  <li>Any medication past 7 days from the delivery date.</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <RefreshCcw className="w-5 h-5 text-slate-400" /> Acceptable Return Conditions
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Returns or replacements are only processed under the following circumstances:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <span className="block font-bold text-slate-800 text-sm mb-1">Wrong Item Delivered</span>
                  <span className="text-xs text-slate-500">If the medicine delivered does not match your ordered prescription.</span>
                </div>
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <span className="block font-bold text-slate-800 text-sm mb-1">Damaged Packaging</span>
                  <span className="text-xs text-slate-500">If the product arrived with broken seals or physical damage.</span>
                </div>
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <span className="block font-bold text-slate-800 text-sm mb-1">Near Expiry</span>
                  <span className="text-xs text-slate-500">If the medicine has an expiration date of less than 3 months upon arrival (unless otherwise specified).</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-slate-400" /> How to initiate a return?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Contact our customer support within 48 hours of receiving the package. You will need to provide photographic evidence of the item, the packaging, and the invoice. Upon verification, our team will arrange a reverse pickup and process your replacement or refund within 5-7 business days.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
