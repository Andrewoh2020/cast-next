export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Legal</p>
        <h1 className="text-4xl font-black tracking-tighter text-black mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-12">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-black text-black mb-3">1. Who We Are</h2>
            <p className="text-gray-600 leading-relaxed">
              This Privacy Policy explains how <strong className="text-black">Ability AI Technologies Private Limited</strong> (UEN: 202548889G), a company incorporated in Singapore (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), collects, uses, and protects your personal data when you use the Cast platform. We are committed to complying with Singapore&apos;s <strong className="text-black">Personal Data Protection Act 2012 (PDPA)</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">2. What Data We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-4">We collect only the minimum data necessary to operate the platform:</p>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-black mb-2">Account Data</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Your name, email address, and authentication credentials, collected when you create an account. This is managed by our authentication provider, Clerk.</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-black mb-2">Payment Data</h3>
                <p className="text-sm text-gray-500 leading-relaxed">When you make a purchase, payment information (card number, billing details) is collected and processed directly by Stripe. We do not store your payment card details on our servers.</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-black mb-2">Purchase &amp; Usage Data</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Records of characters you have purchased or favorited, and the license types associated with your purchases. This data is stored securely to enable your account features.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">3. How We Use Your Data</h2>
            <ul className="space-y-2 text-gray-600 leading-relaxed list-disc pl-5">
              <li>To create and manage your account.</li>
              <li>To process payments and issue license confirmations.</li>
              <li>To deliver purchased character assets and reference sheets to you.</li>
              <li>To maintain records of your licenses for your account.</li>
              <li>To respond to support or refund requests.</li>
              <li>To comply with our legal obligations under Singapore law.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              We do not use your data for advertising, profiling, or sell it to any third party.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">4. Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We use the following third-party services to operate the platform. Each has its own privacy policy:
            </p>
            <ul className="space-y-2 text-gray-600 leading-relaxed list-disc pl-5">
              <li><strong className="text-black">Clerk</strong> — authentication and account management.</li>
              <li><strong className="text-black">Stripe</strong> — payment processing. Stripe is PCI DSS compliant.</li>
              <li><strong className="text-black">Vercel</strong> — platform hosting and file storage.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              We do not share your personal data with any other third parties beyond what is necessary to deliver these services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">5. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              We use only essential cookies required for authentication and session management (provided by Clerk). We do not use tracking cookies, advertising cookies, or analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">6. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your account and purchase data for as long as your account is active, or as required to fulfil our legal obligations. If you request account deletion, we will remove your personal data within 30 days, except where retention is required by law (e.g. financial records).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Under the PDPA, you have the right to:
            </p>
            <ul className="space-y-2 text-gray-600 leading-relaxed list-disc pl-5">
              <li><strong className="text-black">Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong className="text-black">Correction</strong> — request that inaccurate or incomplete data be corrected.</li>
              <li><strong className="text-black">Withdrawal of consent</strong> — withdraw consent for data processing, where applicable, though this may affect your ability to use the platform.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              To exercise any of these rights, contact us at <a href="mailto:admin@ability.new" className="text-indigo-500 hover:underline">admin@ability.new</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">8. Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We take reasonable technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. All data is transmitted over HTTPS and stored with access controls.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be communicated via email or a notice on the platform. Continued use of Cast after changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">10. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For any privacy-related questions or requests, contact us at{' '}
              <a href="mailto:admin@ability.new" className="text-indigo-500 hover:underline">admin@ability.new</a>.
            </p>
            <p className="text-gray-400 text-sm mt-3">
              Ability AI Technologies Private Limited · UEN 202548889G · Singapore
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
