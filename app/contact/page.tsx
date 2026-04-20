import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Cast team for questions, licensing inquiries, or support.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">

        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Get in Touch</p>

        <h1 className="text-5xl font-black tracking-tighter text-black leading-[1.05] mb-6">
          Contact Us
        </h1>

        <p className="text-lg text-gray-500 leading-relaxed mb-16 max-w-xl">
          Have a question about licensing, need help with your account, or want to learn more about Cast? We&apos;d love to hear from you.
        </p>

        <div className="bg-gray-50 rounded-2xl p-8 mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Support</p>
          <p className="text-gray-600 leading-relaxed mb-4">
            For questions, licensing inquiries, or support, reach us at:
          </p>
          <a
            href="mailto:admin@castability.ai"
            className="text-xl font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            admin@castability.ai
          </a>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">The Company</p>
          <p className="text-gray-600 leading-relaxed text-sm">
            Cast is a product of <strong className="text-black">Ability AI Technologies Private Limited</strong>, incorporated in Singapore (UEN: 202548889G).
          </p>
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">Ready to cast your next production?</p>
          <Link
            href="/"
            className="inline-block bg-black text-white font-bold px-10 py-4 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Browse the Roster
          </Link>
        </div>

      </div>
    </div>
  );
}
