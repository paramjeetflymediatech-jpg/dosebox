import React from 'react';
import { Shield, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function FDAGuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-16 sm:px-6 lg:px-8">
      {/* Decorative background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#f0faf7] via-[#f8fafc] to-slate-50 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-emerald-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-[1000px] mx-auto relative z-10 px-4 sm:px-0">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Link href="/" className="hover:text-brand-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">FDA & CDSCO Guidelines</span>
          </div>
          <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold px-3.5 py-1 rounded-full">
            Compliance Standard: V3.2
          </span>
        </div>

        {/* Main Document Container */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">

          {/* Header Section */}
          <div className="border-b border-slate-100 px-8 py-12 bg-brand-900 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest">DoseBox Regulatory Compliance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-3">
              FDA & CDSCO Quality Standards
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              DoseBox is fully compliant with the Central Drugs Standard Control Organization (CDSCO) guidelines, the Drugs and Cosmetics Act, 1940, and respective State FDA rules.
            </p>
          </div>

          {/* Detailed Document Content */}
          <div className="p-8 sm:p-12 text-slate-600 space-y-10 text-sm sm:text-[15px] leading-relaxed">

            <p className="italic text-slate-500 font-medium">
              We strictly maintain wholesale distribution licenses, cold storage audits, and qualified pharmacist supervision to ensure patient safety and drug bioequivalence.
            </p>

            <hr className="border-slate-100" />

            {/* Section 1 */}
            <section id="regulatory-framework" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                1. CDSCO & State FDA Regulatory Framework
              </h2>
              <p>
                In India, the manufacturing, sale, and distribution of drugs are governed by the **Drugs and Cosmetics Act, 1940** and the **Drugs and Cosmetics Rules, 1945**. DoseBox operates under strict compliance with this statutory framework, partnering exclusively with licensed wholesale distributors, clinical depots, and retail pharmacy entities who possess active retail and wholesale drug licenses under Forms 20, 21, 20B, and 21B.
              </p>
            </section>

            {/* Section 2 */}
            <section id="prescription-laws" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                2. Prescription Requirements for Scheduled Drugs
              </h2>
              <p>
                As required by national pharmaceutical laws, prescription-only medicines (classified under Schedule H, Schedule H1, and Schedule X of the Drugs and Cosmetics Rules) cannot be sold, dispensed, or distributed without a verified, valid prescription:
              </p>

              <h3 className="font-bold text-slate-900 mt-3">2.1 Schedule H & H1 Compliance</h3>
              <p>
                Schedule H and H1 medications represent prescription-only therapies (including most oncology, cardiovascular, and diabetes formulations). All orders for these products require a clear prescription upload. The prescription must explicitly show:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The Registered Medical Practitioner (RMP)’s name, clinic details, and official state medical council registration number.</li>
                <li>The patient’s legal name, age, and date of issue (prescriptions older than 6 months for acute care or 12 months for chronic care require clinical re-validation).</li>
                <li>Clear dosage directions, strength (e.g. 50mg, 100mg), and drug composition.</li>
              </ul>

              <h3 className="font-bold text-slate-900 mt-3">2.2 Schedule X Restrictions</h3>
              <p>
                Schedule X comprises highly controlled psychotropic substances and narcotics. DoseBox strictly complies with Special Schedule X storage rules, requiring physical prescription copies and separate retention of prescriptions in physical form for a minimum of 2 years, subject to surprise inspections by state drug inspectors.
              </p>
            </section>

            {/* Section 3 */}
            <section id="cold-chain" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                3. Cold-Chain & Good Storage Practices (GSDP)
              </h2>
              <p>
                Specialty medications, such as chemotherapy injections, biologicals, and immunology drugs, require strict temperature management to prevent denaturation. We adhere strictly to Good Storage and Distribution Practices (GSDP):
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Continuous Cold Chain (2°C - 8°C):</strong> Storage facilities are equipped with clinical-grade refrigeration systems and digital temperature monitors linked to alert systems.</li>
                <li><strong>Validated Transit Logistics:</strong> Shipping is conducted using specialized thermal boxes and validated ice pack ratios, maintaining temperature ranges for up to 72 hours.</li>
                <li><strong>Temperature Indicators:</strong> High-risk biological items are shipped with physical temperature indicator cards to verify to the customer that the cold chain remained unbroken.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="bioequivalence" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                4. Bioequivalence & Quality Assurance
              </h2>
              <p>
                DoseBox facilitates generic drug swaps to maximize patient savings. We guarantee that all substituted generic medicines are therapeutically bioequivalent to their branded counterparts:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>WHO-GMP Certification:</strong> We source generics exclusively from manufacturers possessing valid WHO-GMP (Good Manufacturing Practices) certifications.</li>
                <li><strong>Equivalence Validation:</strong> Every generic alternative undergoes molecular validation by our clinical team to ensure the active pharmaceutical ingredient (API), dissolution rate, and bioavailability match the original branded drug.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="telemedicine-practice" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                5. Telemedicine Practice Guidelines Compliance
              </h2>
              <p>
                Our digital doctor consultation service conforms to the **Telemedicine Practice Guidelines** issued by the Ministry of Health and Family Welfare:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Registered Practitioners:</strong> Only practitioners registered with the National Medical Commission (NMC) or State Medical Councils are permitted to consult on DoseBox.</li>
                <li><strong>Restricted Drug Dispensation:</strong> Doctors consulting via the platform cannot prescribe Schedule X medicines or other habit-forming drugs during online sessions.</li>
                <li><strong>Patient Consent:</strong> Initiating an online consultation serves as implied consent for sharing health symptoms, with explicit consent obtained before sharing prescription charts.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="audit-logs" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                6. Auditing & Batch Traceability
              </h2>
              <p>
                To prevent counterfeit medications from entering our inventory, DoseBox maintains a complete trace log for every batch:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Barcode Tracking:</strong> Every shipment received is logged with its batch number, expiry date, and manufacturer barcode.</li>
                <li><strong>Drug Recall Protocols:</strong> In the event of a quality recall by State FDA or CDSCO, we can instantly trace and contact all patients who received medications from the affected batch.</li>
              </ul>
            </section>

          </div>

          {/* Footer Redressal CTA */}
          <div className="bg-slate-50 border-t border-slate-100 p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
              <ShieldAlert className="w-5 h-5 text-brand-600" />
              <span>DoseBox compliance center adheres to Drugs and Cosmetics Act requirements.</span>
            </div>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm text-sm"
            >
              Contact Compliance Officer
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
