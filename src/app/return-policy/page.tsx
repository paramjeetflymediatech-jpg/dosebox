import React from 'react';
import { RefreshCcw, HelpCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden py-16 sm:px-6 lg:px-8">
      {/* Decorative background gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#fff7f0] via-[#f8fafc] to-slate-50 pointer-events-none" />
      <div className="absolute top-1/4 -right-64 w-96 h-96 bg-amber-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-[1000px] mx-auto relative z-10 px-4 sm:px-0">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Link href="/" className="hover:text-brand-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Return & Refund Policy</span>
          </div>
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-850 font-semibold px-3.5 py-1 rounded-full">
            Revised: August 3, 2026
          </span>
        </div>

        {/* Main Document Container */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">

          {/* Header Section */}
          <div className="border-b border-slate-100 px-8 py-12 bg-brand-900 text-white">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCcw className="w-8 h-8 text-amber-400" />
              <span className="text-amber-300 text-xs font-bold uppercase tracking-widest">DoseBox Quality & Safety Standard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-3">
              Return, Replacement & Refund Policy
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              To guarantee the clinical authenticity, safety, and cold-chain compliance of specialty oncology, nephrology, and transplant medications, all returns are governed by strict safety regulations.
            </p>
          </div>

          {/* Detailed Document Content */}
          <div className="p-8 sm:p-12 text-slate-650 space-y-10 text-sm sm:text-[15px] leading-relaxed animate-fade-in">

            <p className="italic text-slate-500 font-medium">
              Important Notice: Due to health safety laws and clinical compliance guidelines, medicines cannot be treated like general consumer products. Please read our Return and Refund terms below.
            </p>

            <hr className="border-slate-100" />

            {/* Section 1 */}
            <section id="policy-overview" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                1. General Overview & Safety Protocol
              </h2>
              <p>
                DoseBox maintains a strict quality check on all pharmaceutical products. Our supply chain conforms to WHO-GMP standards, ensuring medications are stored under climate-monitored conditions. Because we cannot monitor or verify storage conditions (such as temperature, moisture, and contamination risks) once a product leaves our custody, return options are legally restricted to prevent contaminated drugs from re-entering circulation.
              </p>
            </section>

            {/* Section 2 */}
            <section id="non-returnable" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                2. Strictly Non-Returnable Products
              </h2>
              <p>
                The following products are strictly excluded from returns, exchanges, or replacements under any circumstance:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cold-Chain Items (2°C - 8°C):</strong> Insulin, specialty oncology injections, vaccines, and monoclonal antibody therapies. Once these leave our temperature-controlled cold chain logistics packaging, they can never be returned.</li>
                <li><strong>Opened or Partially Used Items:</strong> Any medicine box, bottle, or foil strip with broken safety seals, cut strips, or opened packages.</li>
                <li><strong>Subsidized PAP Orders:</strong> Medicines obtained through Patient Assistance Programs (PAP) in coordination with pharmaceutical companies are non-refundable and non-exchangeable.</li>
                <li><strong>Delayed Reports:</strong> Any request submitted after **7 days** from the verified delivery stamp.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="eligible-returns" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                3. Conditions for Eligible Returns & Replacements
              </h2>
              <p>
                A customer is eligible to request a direct replacement or product swap only under the following situations:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li><strong>Wrong Item Delivered:</strong> The medicine name, composition, or brand delivered does not match the invoice or the validated prescription uploaded during ordering.</li>
                <li><strong>Transit Damage:</strong> The bottle arrived broken, outer sealing is ruptured, or the cold-chain package was received completely thawed (with ice packs fully dissolved or temperature indicators showing out-of-range).</li>
                <li><strong>Near Expiry:</strong> The remaining shelf life of the delivered medicine is less than **3 months** from the date of receipt (excluding items sold explicitly under discounted clearance labels with pre-stated expiry schedules).</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="verification-window" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                4. Verification Window & Claim Requirements
              </h2>
              <p>
                To request a return or replacement, you must raise a claim through the customer dashboard or via customer support within **7 days** of delivery. To ensure valid validation:
              </p>
              <ul className="list-decimal pl-6 space-y-2">
                <li>Submit high-resolution photographs of the outer packaging, product boxes, batch numbers, and expiry stamps.</li>
                <li>For damaged products, we highly recommend providing a short unboxing video showing the packaging condition at the moment of opening.</li>
                <li>Our clinical distribution team will review the claim logs and confirm approval status within **48 hours**.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="wallet-refunds" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                5. Wallet Credit System (No Cash Refunds)
              </h2>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl my-4 text-xs sm:text-sm text-slate-800">
                <strong>Refund Disclaimer:</strong> DoseBox does not offer direct cash or bank refunds for returned products. All approved return claims are credited directly to your DoseBox user profile as **Reward Wallet Points**.
              </div>
              <p>
                Wallet points are credited instantly upon claim approval. They hold perpetual validity and can be used to pay for any future medicines, prescriptions, or consultations.
              </p>
            </section>

            {/* Section 6 */}
            <section id="rewards-points" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                6. Reward Points Program Rules
              </h2>
              <p>
                Every order placed on the DoseBox platform is subject to our loyalty program terms:
              </p>
              <ul className="list-disc pl-6 space-y-2.5">
                <li><strong>Base Points:</strong> Earn <strong>1 Wallet Point</strong> for every ₹1 successfully spent.</li>
                <li><strong>Bonus tier (₹500 exact bills):</strong> Receive an additional <strong>50 bonus points</strong> for orders totaling exactly ₹500.</li>
                <li><strong>High-value tier (bills &gt; ₹500):</strong> Receive an additional <strong>100 bonus points</strong> for all orders exceeding ₹500 in value.</li>
                <li><strong>Conversion:</strong> Points are converted at a flat rate of **1 point = ₹1** for order deductions.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="how-to-initiate" className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">
                7. How to Initiate a Return Request
              </h2>
              <p>
                If your order meets the eligibility criteria in Section 3, please complete the following steps:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Go to the <Link href="/dashboard/customer" className="text-brand-600 font-bold hover:underline">Customer Dashboard</Link> and select "My Orders".</li>
                <li>Find the target invoice and click "Request Replacement/Refund".</li>
                <li>Select the reason (e.g. wrong drug, damaged) and upload your photos.</li>
                <li>Pack the product securely in its original packaging box. A representative will inspect and collect the item.</li>
              </ol>
            </section>

          </div>

          {/* Footer Redressal CTA */}
          <div className="bg-slate-50 border-t border-slate-100 p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-655 font-medium text-sm">
              <ShieldAlert className="w-5 h-5 text-brand-650" />
              <span>Conforms to quality control and pharmaceutical safety policies.</span>
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
