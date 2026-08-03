import React from 'react';
import { ShieldCheck, Mail, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-16 sm:px-6 lg:px-8">
      {/* Decorative background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#f0f9fb] via-[#f8fafc] to-slate-50 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-teal-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-[1000px] mx-auto relative z-10 px-4 sm:px-0">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Link href="/" className="hover:text-brand-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Privacy Policy</span>
          </div>
          <span className="text-xs bg-brand-50 border border-brand-200 text-brand-700 font-semibold px-3.5 py-1 rounded-full">
            Version 2.0 (Active)
          </span>
        </div>

        {/* Main Document Container */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">

          {/* Header Section */}
          <div className="border-b border-slate-100 px-8 py-12 bg-brand-900 to-slate-850 text-white">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-8 h-8 text-brand-400" />
              <span className="text-brand-300 text-xs font-bold uppercase tracking-widest">DoseBox Privacy Commitment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-3">
              Privacy Policy & Data Security Standards
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              This Privacy Policy describes how DoseBox collects, protects, processes, and disposes of your Protected Health Information (PHI) and Personal Identifiable Information (PII) in compliance with the Drugs and Cosmetics Rules, DPDP Act 2023, and HIPAA regulations.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400 font-semibold">
              <div>Last Revised: August 3, 2026</div>
              <div>&bull;</div>
              <div>Effective Date: Immediate</div>
            </div>
          </div>

          {/* Detailed Document Content */}
          <div className="p-8 sm:p-12 text-slate-600 space-y-10 text-sm sm:text-[15px] leading-relaxed">

            <p className="italic text-slate-500 font-medium">
              Please read this document carefully before uploading prescriptions or scheduling consultations. By accessing or using the DoseBox platform, you consent to the data practices described in this document.
            </p>

            <hr className="border-slate-100" />

            {/* Section 1 */}
            <section id="introduction" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                1. Scope & Definitions
              </h2>
              <p>
                DoseBox (referred to as "we", "us", "our", or the "Platform") is owned and operated by DoseBox Smart Specialty Distribution. The platform serves as a secure smart-pharmacy fulfillment bridge, digital consultation facilitator, and cold-chain shipping orchestrator.
              </p>
              <p>
                This Policy covers all users of our digital platforms, including our web platform, mobile applications, API endpoints, and direct communication services. We act as both a **data fiduciary** (managing your preferences) and a **data processor** (fulfilling clinical instructions and pharmacy shipments under certified supervisor review).
              </p>
            </section>

            {/* Section 2 */}
            <section id="collection" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                2. Information We Collect
              </h2>
              <p>
                To provide safe pharmacy services and secure online consultations, we must collect information that falls into the following categories:
              </p>

              <h3 className="font-bold text-slate-900 mt-3">2.1 Personal Identifiable Information (PII)</h3>
              <p>
                Information that allows us to identify, contact, or deliver to you directly:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity Details:</strong> Full legal name, date of birth, biological sex (required for accurate medication dosage calculations).</li>
                <li><strong>Contact Details:</strong> Verified mobile phone number, email address, and alternative shipping contact numbers.</li>
                <li><strong>Delivery & Delivery Logs:</strong> Shipping coordinates, door addresses, landmark directions, and courier delivery signatures.</li>
                <li><strong>Payment Metadata:</strong> Transaction reference IDs, invoice details, and payment tokens (we do not store raw card numbers, CVVs, or bank logins; all operations are processed securely via PCI-DSS compliant payment gateways).</li>
              </ul>

              <h3 className="font-bold text-slate-900 mt-3">2.2 Protected Health Information (PHI) & Prescriptions</h3>
              <p>
                Due to the life-saving and controlled nature of specialty oncology, transplant, and nephrology medications:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Uploaded Prescription Files (Rx):</strong> High-resolution images or PDFs of prescriptions issued by registered medical practitioners (RMPs), including doctor seals, license numbers, and clinic headers.</li>
                <li><strong>Diagnostic & Lab Reports:</strong> Vital readings, lab reports (e.g. kidney panel, blood counts) uploaded by you to enable clinical safety checks by pharmacists.</li>
                <li><strong>Consultation Artifacts:</strong> Audio-visual logs, chat messages, clinical prescriptions, and assessment histories from your online video doctor consultations.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="processing" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                3. Purpose & Legal Basis of Data Processing
              </h2>
              <p>
                We process your personal and health data strictly for the following purposes:
              </p>
              <ul className="list-decimal pl-6 space-y-2.5">
                <li><strong>Prescription Validation:</strong> By law under the Drugs and Cosmetics Act, generic and brand-name schedule prescription drugs can only be dispensed after a registered pharmacist validates a genuine prescription.</li>
                <li><strong>Clinical Telehealth:</strong> To connect you with general practitioners and specialists via our consultation service, ensuring they have access to relevant symptoms and history.</li>
                <li><strong>Cold-Chain Validation Logs:</strong> Processing address data to calculate temperature-sensitive transit durations, ensuring oncology and temperature-controlled items arrive within safe 2°C - 8°C guidelines.</li>
                <li><strong>Patient Assistance Programs (PAP):</strong> Sharing required transaction data with certified pharmaceutical manufacturer PAP agents, strictly upon your written request, to claim subsidised specialty medicines.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="sharing" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                4. Data Sharing & Disclosure
              </h2>
              <p>
                We do not sell, license, lease, or rent your personal health data to marketing companies or third-party aggregators. Your information is shared only on a **need-to-know basis** with the following parties:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Licensed Partner Pharmacists:</strong> Local, licensed retail and wholesale pharmacies processing your specific order fulfillment, and certified pharmacists validating your prescription validity.</li>
                <li><strong>Verified Delivery Providers:</strong> Cold-chain and express couriers who receive only the necessary delivery address, recipient name, and mobile number. They never receive prescription summaries or diagnosis data.</li>
                <li><strong>Consulting Practitioners:</strong> Doctors and clinical consultants assigned to your consultation, who are bound by professional code of conduct and medical confidentiality.</li>
                <li><strong>Legal Mandate:</strong> Authorized government bodies if required by a valid search warrant, subpoena, court order, or national health safety directive.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="retention" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                5. Data Retention & Preservation Mandates
              </h2>
              <p>
                Under statutory rules governing pharmacy operations in India (specifically the Drugs and Cosmetics Rules, Pharmacy Practice Regulations, and digital health records policies):
              </p>
              <div className="bg-slate-50 border-l-4 border-amber-500 p-4 rounded-r-xl my-4 text-xs sm:text-sm text-slate-700">
                <strong>Important Legal Compliance:</strong> We are legally mandated to retain records of all prescription dispensations, invoice copies, and customer details for a minimum period of **2 to 3 years** from the date of billing. We cannot delete prescription transaction records before this period expires, even upon account deletion request.
              </div>
              <p>
                Non-regulated, non-transactional personal data (such as temporary profile assets, session details, and unused contact records) will be purged within **180 days** of receiving a valid account deletion request.
              </p>
            </section>

            {/* Section 6 */}
            <section id="security" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                6. Security & Encryption Standards
              </h2>
              <p>
                To maintain the integrity of our platform, we apply high-tier security parameters:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption in Transit:</strong> All communication, prescription uploads, and clinical records are encrypted using 256-bit TLS (Transport Layer Security) protocol.</li>
                <li><strong>Encryption at Rest:</strong> Database assets, prescription images, and diagnostic records are stored on secure cloud services encrypted with AES-256 standards.</li>
                <li><strong>Access Control:</strong> Highly restricted access to clinical data based on role-based profiles. Pharmacists only see prescription data, and logistics coordinators only see shipping details.</li>
                <li><strong>Payment Compliance:</strong> Secure checkouts are handled through third-party PCI-DSS compliant aggregators. No payment credentials or CVVs touch our servers.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="rights" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                7. Your Statutory Rights
              </h2>
              <p>
                Under the Digital Personal Data Protection (DPDP) Act and telecommunication privacy guidelines, you hold the following controls:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Right to Correct & Update:</strong> Modify your personal identity, contact, or delivery address settings through the user panel at any time.</li>
                <li><strong>Right to Withdraw Consent:</strong> You can refuse or withdraw consent for data processing. Note that this may terminate our ability to dispense or process your prescription orders.</li>
                <li><strong>Right to Request Deletion:</strong> Request deletion of your user account and personal profiles. To initiate deletion, visit our dedicated <Link href="/data-deletion" className="text-brand-600 font-bold hover:underline">Data Deletion Portal</Link> or contact our Grievance Officer.</li>
              </ul>
            </section>

          

          </div>

          {/* Footer Redressal CTA */}
          <div className="bg-slate-50 border-t border-slate-100 p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
              <ShieldAlert className="w-5 h-5 text-brand-600" />
              <span>Compliant with Indian Drugs & Cosmetics Rules and DPDP Act 2023.</span>
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
