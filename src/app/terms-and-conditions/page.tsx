import React from 'react';
import { FileText, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-16 sm:px-6 lg:px-8">
      {/* Decorative background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#f5f3ff] via-[#f8fafc] to-slate-50 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-purple-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-[1000px] mx-auto relative z-10 px-4 sm:px-0">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Link href="/" className="hover:text-brand-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Terms and Conditions</span>
          </div>
          <span className="text-xs bg-brand-50 border border-brand-200 text-brand-700 font-semibold px-3.5 py-1 rounded-full">
            Effective: Immediate
          </span>
        </div>

        {/* Main Document Container */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">

          {/* Header Section */}
          <div className="border-b border-slate-100 px-8 py-12 bg-brand-900 text-white">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-purple-400" />
              <span className="text-purple-300 text-xs font-bold uppercase tracking-widest">DoseBox Platform Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-3">
              Terms and Conditions
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Please read these terms and conditions carefully before using our service. This agreement governs your use of the DoseBox platform and services.
            </p>
          </div>

          {/* Detailed Document Content */}
          <div className="p-8 sm:p-12 text-slate-600 space-y-10 text-sm sm:text-[15px] leading-relaxed">

            {/* Section 1 */}
            <section id="introduction" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using DoseBox, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            {/* Section 2 */}
            <section id="use-license" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                2. Use License
              </h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on DoseBox's website for personal, non-commercial transitory viewing only.
              </p>
              <p>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Modify or copy the materials;</li>
                <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                <li>Attempt to decompile or reverse engineer any software contained on DoseBox's website;</li>
                <li>Remove any copyright or other proprietary notations from the materials; or</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="disclaimer" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                3. Disclaimer
              </h2>
              <p>
                The materials on DoseBox's website are provided on an 'as is' basis. DoseBox makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            {/* Section 4 */}
            <section id="limitations" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                4. Limitations
              </h2>
              <p>
                In no event shall DoseBox or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on DoseBox's website, even if DoseBox or a DoseBox authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            {/* Section 5 */}
            <section id="governing-law" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                5. Governing Law
              </h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
              </p>
            </section>

            {/* Section 6 */}
            <section id="grievance" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                6. Grievance Officer
              </h2>
              <p>
                In accordance with the Information Technology Act 2000 and rules made there under, the name and contact details of the Grievance Officer are provided below:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Mobile Number:</strong> 9718541733</li>
              </ul>
            </section>

          </div>

          {/* Footer Redressal CTA */}
          <div className="bg-slate-50 border-t border-slate-100 p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
              <ShieldAlert className="w-5 h-5 text-brand-600" />
              <span>Compliant with Indian digital and pharmacy rules.</span>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm text-sm"
            >
              Contact Support
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
