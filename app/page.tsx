import HeroBannerOption1 from '@/components/HeroBannerOption1';
import ImmersiveLayout from '@/components/ImmersiveLayout';
import ExclusiveRoster from '@/components/ExclusiveRoster';
import CommunityShowcase from '@/components/CommunityShowcase';

export default function Home() {
  return (
    <main>
      <HeroBannerOption1 />
      <ImmersiveLayout />
      <CommunityShowcase />
      <ExclusiveRoster />
    </main>
  );
}
