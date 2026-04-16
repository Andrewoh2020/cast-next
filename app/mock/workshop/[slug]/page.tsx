import type { Metadata } from 'next';
import MockWorkshop from './MockWorkshop';

export const metadata: Metadata = {
  title: 'Workshop Mockup — Cast',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MockWorkshop />;
}
