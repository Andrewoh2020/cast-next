import HeroForeground from '@/components/hero-experiments/HeroForeground';
import BlurredCascadeBg from '@/components/hero-experiments/BlurredCascadeBg';

export const metadata = {
  title: 'Hero: Blurred Cascade — Cast',
  robots: { index: false, follow: false },
};

export default function HeroCascadePage() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <BlurredCascadeBg />
      <HeroForeground theme="dark" />
    </section>
  );
}
