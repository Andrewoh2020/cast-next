import Hero from '@/components/Hero';
import TrustStrip from '@/components/TrustStrip';
import HowItWorks from '@/components/HowItWorks';
import TalentRoster from '@/components/TalentRoster';
import CtaBanner from '@/components/CtaBanner';

export default function Home() {
  return (
    <main>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <TalentRoster />
      <CtaBanner />
    </main>
  );
}
