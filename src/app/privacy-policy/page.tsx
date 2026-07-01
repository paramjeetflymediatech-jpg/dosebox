import React from 'react';
import { Lock, FileKey, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-50/50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-[2rem] border border-slate-100/50 shadow-sm p-8 sm:p-12">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8">
            <Lock className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Privacy & HIPAA Compliance
          </h1>
          <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">
            Your medical data is sensitive. We treat your personal and health information with the highest level of security and confidentiality.
          </p>

          <div className="space-y-10">
            
            <section className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <FileKey className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Data Encryption & Storage</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  All personal data, medical records, and prescriptions uploaded to our platform are encrypted in transit using industry-standard TLS protocols and at rest using AES-256 encryption. Our database infrastructure ensures robust data isolation and continuous security monitoring.
                </p>
              </div>
            </section>

            <section className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Information Sharing</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  We do not sell, rent, or trade your personal or medical information to third-party marketers. Your data is strictly shared on a need-to-know basis with:
                </p>
                <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
                  <li>Our registered pharmacists to verify and fulfill your prescriptions.</li>
                  <li>Delivery partners (restricted to basic contact and delivery address).</li>
                  <li>Legal authorities if mandated by law or a valid court order.</li>
                </ul>
              </div>
            </section>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-2">User Rights</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                You have the right to request a copy of your personal data, request corrections to inaccurate data, or request the deletion of your account and associated records (subject to regulatory retention requirements for medical prescriptions). Contact our support team for any privacy-related concerns.
              </p>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
