import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';

export default function FDAGuidelinesPage() {
  return (
    <div className="bg-slate-50/50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-[2rem] border border-slate-100/50 shadow-sm p-8 sm:p-12">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-8">
            <Shield className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            FDA & CDSCO Guidelines (India)
          </h1>
          <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">
            We adhere strictly to the guidelines established by the Central Drugs Standard Control Organization (CDSCO) and state FDA authorities in India.
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Prescription Requirements</h2>
              <div className="bg-slate-50 rounded-2xl p-6 text-slate-600 space-y-4 text-sm leading-relaxed border border-slate-100">
                <p>As per the Drugs and Cosmetics Act, 1940 and Rules, 1945, certain medicines (Schedule H, H1, and X) cannot be sold without a valid prescription from a registered medical practitioner.</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Prescriptions must be legible and include the doctor's registration number.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Digital prescriptions are accepted as long as they comply with the Telemedicine Practice Guidelines issued by the Ministry of Health and Family Welfare.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>Schedule X drugs require physical copies of the prescription in specific formats.</span>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quality Assurance & Sourcing</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                All medications provided through our platform are sourced directly from authorized distributors or the manufacturers themselves. We guarantee that no counterfeit, expired, or sub-standard drugs are distributed.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Our facilities are regularly audited by local FDA bodies to ensure proper storage conditions, especially for temperature-sensitive medications like vaccines and certain specialized oncology drugs.
              </p>
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}
