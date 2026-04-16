'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  if (pathname === '/workshop' || pathname.startsWith('/workshop/') || pathname.startsWith('/mock/workshop')) {
    return null;
  }
  return <Footer />;
}
