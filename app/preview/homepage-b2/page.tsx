import HeroB2 from '@/components/home/HeroB2';
import RosterSection from '@/components/home/RosterSection';
import CommunityShowcase from '@/components/CommunityShowcase';
import LiveDemoSection from '@/components/home/LiveDemoSection';
import ProblemSolutionGrid from '@/components/home/ProblemSolutionGrid';
import FinalCTA from '@/components/home/FinalCTA';

export default function PreviewHomepageB2() {
  return (
    <main>
      <div className="fixed top-20 right-4 z-50 bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
        Preview · B2 (stacked)
      </div>

      <HeroB2 />
      <RosterSection />
      <CommunityShowcase />
      <LiveDemoSection />
      <ProblemSolutionGrid />
      <FinalCTA />
    </main>
  );
}
