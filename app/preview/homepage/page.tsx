import AnimatedHero from '@/components/home/AnimatedHero';
import LiveDemoSection from '@/components/home/LiveDemoSection';
import FeaturedCarousel from '@/components/home/FeaturedCarousel';
import ProblemSolutionGrid from '@/components/home/ProblemSolutionGrid';
import RosterSection from '@/components/home/RosterSection';
import CommunityShowcase from '@/components/CommunityShowcase';
import PricingSection from '@/components/home/PricingSection';
import HowItWorksTimeline from '@/components/home/HowItWorksTimeline';
import FinalCTA from '@/components/home/FinalCTA';

export default function PreviewHomepage() {
  return (
    <main>
      {/* Preview badge — only visible on this route */}
      <div className="fixed top-20 right-4 z-50 bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
        Preview
      </div>

      <AnimatedHero />
      <LiveDemoSection />
      <FeaturedCarousel />
      <ProblemSolutionGrid />
      <RosterSection />
      <CommunityShowcase />
      <PricingSection />
      <HowItWorksTimeline />
      <FinalCTA />
    </main>
  );
}
