import Link from 'next/link';
import HeroB2 from '@/components/home/HeroB2';
import HeroReel from '@/components/home/HeroReel';
import LiveDemoSection from '@/components/home/LiveDemoSection';
import DirectabilityStrip from '@/components/home/DirectabilityStrip';
import CopyrightSafeSection from '@/components/home/CopyrightSafeSection';
import RosterSection from '@/components/home/RosterSection';
import CommunityShowcase from '@/components/CommunityShowcase';
import FinalCTA from '@/components/home/FinalCTA';

export default function Home() {
  return (
    <main>
      <HeroB2 />
      <HeroReel />
      <LiveDemoSection />
      <DirectabilityStrip />
      <CopyrightSafeSection />
      <RosterSection />
      <CommunityShowcase />

      {/* SEO content section — keyword-rich copy for search engines */}
      <section className="py-20 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-black mb-6">
            The AI Character Casting Agency for Video Production
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Cast is the world&apos;s first AI character casting agency — purpose-built for filmmakers, ad agencies, and content creators who need photorealistic AI characters for commercial video production. Every AI character on Cast comes with a 4K 8-panel reference sheet that locks visual identity across AI video tools like <a href="https://klingai.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Kling</a>, <a href="https://runwayml.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Runway</a>, and <a href="https://deepmind.google/technologies/veo" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Veo</a>. No more gambling with AI generators hoping the same character appears twice.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-black mb-2">Copyright-Safe AI Characters</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Every AI character is 100% AI-generated with no real-person training data. No likeness risk, no model releases, no legal grey areas. Your legal team can sign off with confidence.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-black mb-2">Character Consistency Solved</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                The 8-panel reference sheet shows your AI character from front, side, back, and close-up angles. Drop any panel into your AI video tool as a starting frame — same face, every shot.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-black mb-2">Create Custom AI Characters</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Don&apos;t see the right AI character? Describe exactly who you need — age, ethnicity, build, wardrobe, vibe — and Cast generates a brand-new character with their full reference sheet in ~90 seconds.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-black tracking-tighter text-black mb-6">
            How AI Character Casting Works
          </h2>
          <div className="space-y-6 mb-16">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0">1</div>
              <div>
                <h3 className="font-bold text-black mb-1">Browse or Create AI Characters</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Explore photorealistic AI characters filtered by age, ethnicity, build, and style. Or create a custom AI character from a text description.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0">2</div>
              <div>
                <h3 className="font-bold text-black mb-1">License for Commercial Use</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Choose from flexible licensing: free with attribution, $50 single project, $250 unlimited productions, or $1,000 exclusive ownership. No subscription fees.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0">3</div>
              <div>
                <h3 className="font-bold text-black mb-1">Use in AI Video Production</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Download your AI character&apos;s profile photo and 4K reference sheet. Crop the angle you need, upload as a starting frame in Kling, Runway, or Veo, and your character stays consistent across every shot.</p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-black tracking-tighter text-black mb-6">
            Built for AI Video Creators
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Whether you&apos;re an indie filmmaker making AI short films, an ad agency producing branded content, a marketing team creating social media videos, or a course creator who needs diverse characters — Cast provides production-ready AI characters that work seamlessly with the tools you already use. Every AI character is designed for the AI video production workflow: photorealistic quality, multiple angles for different shots, and clear commercial licensing so you can publish with confidence.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            Character consistency has been the biggest unsolved problem in AI video. LoRA training requires ML expertise. ControlNet setups are fragile. Prompt-based generation gives you a different face every time. Cast&apos;s reference sheet approach is the simplest, most reliable solution — and it works with any image-to-video tool on the market today.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="#roster" className="bg-black text-white font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-colors text-center">
              Browse AI Characters
            </Link>
            <Link href="/create" className="border border-gray-200 text-gray-700 font-semibold text-sm px-8 py-3.5 rounded-xl hover:border-gray-400 transition-colors text-center">
              Create a Custom Character
            </Link>
            <Link href="/how-it-works" className="border border-gray-200 text-gray-700 font-semibold text-sm px-8 py-3.5 rounded-xl hover:border-gray-400 transition-colors text-center">
              How It Works
            </Link>
          </div>
        </div>
      </section>

      <FinalCTA />
    </main>
  );
}
