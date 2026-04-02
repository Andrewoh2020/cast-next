import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-0">
      <div className="max-w-6xl mx-auto px-6 pb-12 border-b border-white/10 flex flex-wrap gap-12">
        <div className="flex-1 min-w-[180px]">
          <div className="text-xl font-black mb-3">
            Cast<span className="text-indigo-400">.</span>
          </div>
          <p className="text-sm text-white/40 leading-relaxed">The world&apos;s first AI character casting agency.</p>
        </div>

        <div className="flex gap-12 flex-wrap">
          {[
            { title: 'Product', links: [{ label: 'Talent Roster', href: '/#roster' }] },
            { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }, { label: 'Blog', href: '#' }] },
            { title: 'Legal', links: [{ label: 'License Terms', href: '/license-terms' }, { label: 'Privacy Policy', href: '/privacy-policy' }, { label: 'Copyright FAQ', href: '/copyright-faq' }] },
          ].map((col) => (
            <div key={col.title} className="flex flex-col gap-2 min-w-[110px]">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">{col.title}</h4>
              {col.links.map((link) => (
                <Link key={link.label} href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-5">
        <p className="text-xs text-white/25">© 2026 Cast. All rights reserved. All characters are 100% AI-generated.</p>
      </div>
    </footer>
  );
}
