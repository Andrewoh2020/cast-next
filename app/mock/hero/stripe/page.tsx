import HeroForeground from '@/components/hero-experiments/HeroForeground';
import StripeRibbonBg from '@/components/hero-experiments/StripeRibbonBg';

export const metadata = {
  title: 'Hero: Stripe Ribbon — Cast',
  robots: { index: false, follow: false },
};

export default function HeroStripePage() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-white">
      <StripeRibbonBg />
      <HeroForeground theme="light" />
    </section>
  );
}
