import HeroB2 from '@/components/home/HeroB2';
import { pickReelCharacters } from '@/lib/reel-characters';

export const metadata = {
  title: 'Hero: Export Reel — Cast',
  robots: { index: false, follow: false },
};

export default function HeroPipelinePage() {
  return <HeroB2 variant="export-reel" reelCharacters={pickReelCharacters()} />;
}
