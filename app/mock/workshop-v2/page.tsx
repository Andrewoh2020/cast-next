import type { Metadata } from 'next';
import MockWorkshopV2 from './MockWorkshopV2';

export const metadata: Metadata = {
  title: 'Workshop V2 Mock — Cast',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MockWorkshopV2 />;
}
