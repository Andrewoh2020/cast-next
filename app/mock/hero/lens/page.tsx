import HeroForeground from '@/components/hero-experiments/HeroForeground';
import CinematicLensBg from '@/components/hero-experiments/CinematicLensBg';

export const metadata = {
  title: 'Hero: Cinematic Lens — Cast',
  robots: { index: false, follow: false },
};

export default function HeroLensPage() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <CinematicLensBg />
      <HeroForeground theme="dark" />
    </section>
  );
}
