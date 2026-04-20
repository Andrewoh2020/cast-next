import HeroForeground from '@/components/hero-experiments/HeroForeground';
import FrostedVideoBg from '@/components/hero-experiments/FrostedVideoBg';

export const metadata = {
  title: 'Hero: Frosted Reveal — Cast',
  robots: { index: false, follow: false },
};

export default function HeroFrostedPage() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <FrostedVideoBg />
      <HeroForeground theme="dark" />
    </section>
  );
}
