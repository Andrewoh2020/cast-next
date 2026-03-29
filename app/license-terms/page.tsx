import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'License Terms',
  description: 'License terms for AI characters on Cast. Understand your rights for Single Project, Studio, and Exclusive Rights licenses.',
};

export default function LicenseTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Legal</p>
        <h1 className="text-4xl font-black tracking-tighter text-black mb-2">License Terms</h1>
        <p className="text-gray-400 text-sm mb-12">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-black text-black mb-3">1. Parties</h2>
            <p className="text-gray-600 leading-relaxed">
              These License Terms (&ldquo;Terms&rdquo;) constitute a binding legal agreement between you (&ldquo;Licensee&rdquo;) and <strong className="text-black">Ability AI Technologies Private Limited</strong>, a company incorporated in Singapore (UEN: 202548889G) (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), operating the Cast platform. By purchasing, downloading, or using any character from Cast, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">2. License Grant</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Subject to these Terms, we grant you a <strong className="text-black">worldwide, perpetual, non-transferable</strong> license to use licensed characters in accordance with the license tier you have selected. All licenses take effect upon confirmed payment (or download, in the case of free licenses) and do not expire.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">3. What You Can Do</h2>
            <ul className="space-y-2 text-gray-600 leading-relaxed list-disc pl-5">
              <li>Use licensed characters in commercial video productions, advertisements, short films, social media content, and digital media.</li>
              <li>Modify, animate, or adapt characters for use within your licensed production.</li>
              <li>Publish content featuring licensed characters on any platform, including YouTube, TikTok, Instagram, Netflix, and broadcast television, in any territory worldwide.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">4. License Types</h2>
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-black mb-1">Free (Attribution)</h3>
                <p className="text-sm text-gray-500 leading-relaxed">You may use the character in any production at no cost, provided you credit Cast visibly in your production — in the video description, end credits, or as on-screen text (e.g. &ldquo;AI characters provided by Cast&rdquo;). Valid for <strong className="text-black">12 months from the date of download</strong>.</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-black mb-1">Single Project License — USD $50</h3>
                <p className="text-sm text-gray-500 leading-relaxed">A one-time license granting you the right to use the character in a single production (one video, film, advertisement, or campaign). The character may continue to be licensed by other creators. No attribution required. Valid for <strong className="text-black">12 months from the date of purchase</strong>, within which you must complete and publish your production.</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-black mb-1">Studio License — USD $250</h3>
                <p className="text-sm text-gray-500 leading-relaxed">A license granting you the right to use the character across <strong className="text-black">unlimited productions</strong> within the license period. The character may continue to be licensed by other creators. No attribution required. Valid for <strong className="text-black">12 months from the date of purchase</strong>.</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-black mb-1">Exclusive Rights — USD $1,000</h3>
                <p className="text-sm text-gray-500 leading-relaxed">You obtain exclusive worldwide rights to the character. The character is permanently removed from the Cast marketplace and will not be licensed to any other party from the date of purchase. No attribution required. Rights are perpetual and transferable as part of a business acquisition or assignment. Prior to completing your purchase, you will be shown the number of active Single Project licenses that exist for the character. Those existing licenses remain valid until their respective 12-month terms expire.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">5. Prohibited Uses</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Regardless of license type, the following uses are strictly prohibited:
            </p>
            <ul className="space-y-2 text-gray-600 leading-relaxed list-disc pl-5">
              <li><strong className="text-black">Pornographic or sexually explicit content.</strong> Characters may not be used in adult content, sexually explicit material, or any content of a pornographic nature under any circumstances.</li>
              <li><strong className="text-black">Illegal activities.</strong> Characters may not be used in content that promotes, facilitates, or depicts illegal activities, including but not limited to fraud, violence, harassment, hate speech, or any activity prohibited by applicable law.</li>
              <li><strong className="text-black">Defamatory or harmful content.</strong> Characters may not be used in a way that is defamatory, harassing, threatening, or harmful to any individual or group.</li>
              <li><strong className="text-black">Misinformation.</strong> Characters may not be used to spread deliberate misinformation, fake news, or deceptive content intended to mislead the public.</li>
              <li><strong className="text-black">Resale of characters.</strong> You may not resell, sublicense, or redistribute the character assets themselves outside of the context of a finished production.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">6. Ownership &amp; Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              All characters on Cast are either fully AI-generated or used with explicit permission from any individual whose likeness was used. Ability AI Technologies Private Limited retains all intellectual property rights over character assets unless an Exclusive Rights license has been purchased, in which case those rights transfer fully to the buyer upon confirmed payment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">7. Payments</h2>
            <p className="text-gray-600 leading-relaxed">
              All prices are listed and charged in <strong className="text-black">United States Dollars (USD)</strong>. Payments are processed securely via Stripe. We do not store your payment card details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">8. Refunds</h2>
            <p className="text-gray-600 leading-relaxed">
              Refund requests may be submitted within <strong className="text-black">7 days</strong> of purchase by contacting us at <a href="mailto:admin@ability.new" className="text-indigo-500 hover:underline">admin@ability.new</a>. Refunds are subject to approval and will only be granted where the character has not been used in any production, film, advertisement, or published content. Exclusive Rights purchases that have already removed a character from the marketplace are non-refundable. Approved refunds will be returned to the original payment method within 10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">9. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to revoke any license, without refund, if these Terms are violated. We reserve the right to pursue legal action in cases of serious or willful breach.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">10. Data &amp; Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              We collect only the personal data necessary to operate the platform. Account data (name, email, authentication) is managed by Clerk. Payment data is processed by Stripe. We do not sell, share, or independently store your personal data beyond what these third-party services require. Our practices are consistent with Singapore&apos;s Personal Data Protection Act 2012 (PDPA).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">11. Disclaimer of Warranties</h2>
            <p className="text-gray-600 leading-relaxed">
              Characters are provided &ldquo;as is.&rdquo; We make no warranties, express or implied, regarding fitness for a particular purpose or non-infringement of third-party rights beyond what is stated in these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">12. Governing Law &amp; Disputes</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms are governed by the laws of the <strong className="text-black">Republic of Singapore</strong>. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Singapore.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-black mb-3">13. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For licensing questions, refund requests, or to report a violation, contact us at{' '}
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
