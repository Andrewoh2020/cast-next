export interface Launch {
  date: string;        // YYYY-MM-DD
  title: string;       // Short, punchy headline
  summary: string;     // 1-2 sentence SEO-friendly description
  highlights: string[]; // Bullet points
}

/**
 * Changelog entries shown on /launches.
 * Newest first. Add a new entry at the top when deploying.
 */
export const launches: Launch[] = [
  {
    date: '2026-04-16',
    title: 'Environmental Portraits and Archetype Casting Chips',
    summary:
      'The homepage now features 20 characters shown in their world — CEOs, athletes, chefs, journalists placed in cinematic scenes. Hero search gets curated archetype chips that cycle through 60 hand-written prompts.',
    highlights: [
      'Environmental portraits — 20 featured characters now appear in scene-placed variants across the homepage marquee (Seoul street, Barcelona cafe, hospital, Vienna library, Pacific beach, and more). Identity preserved, wardrobe swapped to fit each scene.',
      'Archetype chips replace random prompt suggestions in the hero search — CEO, Athlete, Chef, Artist, Musician, Journalist. Each chip cycles through 10 distinct prompt variants per click for fresh inspiration every time (60 prompts total).',
      'Marquee row 2 now exclusively cinematic — scene-placed characters stay in their own row, not mixed with studio portraits.',
      'Studio portraits preserved on character detail pages — the scene variants are marketing-only; buyers still get the headshot + 4K reference sheet.',
    ],
  },
  {
    date: '2026-04-15',
    title: 'Homepage Redesign — Cinematic Hero Reel and Filmmaker-First Narrative',
    summary:
      'A ground-up homepage redesign that reframes Cast from "character catalog" to "AI casting platform." New cinematic hero reel, directability showcase, dedicated copyright-safe section, and upgraded roster browsing.',
    highlights: [
      'Cinematic hero reel — full-width autoplay showcase of AI characters in real scenes (NYC street, library, cocktail bar, restaurant kitchen) so filmmakers can see range at a glance',
      'New hero search with animated typing placeholder, blinking cursor, and varied archetype example prompts',
      'Directability section — showcases the 4K 8-panel reference sheet as a full cinematic strip proving one cast works across every shot',
      'Copyright-safe section — dedicated three-pillar explainer (no real-person likeness, commercial license on every cast, written indemnity on Exclusive tier) with link to full FAQ',
      'Browse the roster — simplified roster section with sticky search, pill filters, and an inline Advanced filter panel; removed price tags and character count from marketing surfaces',
      'Higher-quality thumbnails — roster grid now serves 1200px images and community showcase 800px, noticeably sharper on retina displays',
      'LiveDemo polish — rotating character demos auto-advance on scroll-into-view, crossfade profile photo and full reference sheet without flashing next character during transitions',
      'LivingMarquee hover info updated to show ethnicity + age, matching the roster card format',
      'Removed Style filter (Cast currently only offers realistic characters) to keep filters honest and focused',
    ],
  },
  {
    date: '2026-04-13',
    title: 'Product Hunt Launch, How It Works Page, and Launch Promo',
    summary:
      'Cast is live on Product Hunt! New How It Works page for onboarding, 2 free credits for the first 200 accounts, reference sheet regeneration, and smarter character generation.',
    highlights: [
      'Product Hunt launch — Cast is officially live on Product Hunt',
      'How It Works page — new dedicated page explaining the 4-step workflow from browsing to using characters in AI video tools',
      'Launch promo — first 200 accounts get 2 free credits to create custom characters',
      'Reference sheet regeneration — users can now regenerate their reference sheet up to 3 times if the first result isn\'t right',
      'City and hair length attributes — characters now include city of origin and culturally-accurate hair styling for more realistic variety',
      'Improved character descriptions — removed moles/beauty marks by default (they render inconsistently across panels), added city-informed style guidance',
      'Google Search Console fix — added www.castability.ai property to resolve indexing redirect errors',
    ],
  },
  {
    date: '2026-04-03',
    title: 'Smarter Characters, Better Portraits, and Production-Ready Emails',
    summary:
      'Characters are now more visually distinct with varied styling, the profile photo framing has been upgraded to a 3/4 portrait, and emails now send reliably from castability.ai.',
    highlights: [
      'Visually distinct characters — AI descriptions now include varied wardrobe, hairstyles, facial features, and accessories to avoid similar-looking characters',
      '3/4 portrait framing — profile photos now show head to above the knees with natural angled poses, replacing the old full-body shots',
      'Admin auto-fills attributes — age, ethnicity, race, build, and other fields are now automatically extracted when generating characters',
      'Reliable email delivery — receipt emails now send from no-reply@castability.ai with verified domain, fixing delivery issues',
      'Generation safeguards — reference sheets only generate after payment, preventing accidental credit usage',
      'Stripe payments live on production — character credit purchases now work end-to-end with real transactions',
      'SEO improvements — canonical URL redirects configured, duplicate content issues resolved, Google re-indexing requested',
      'Character name is now optional — AI generates a fitting name from your description if you leave it blank',
      'Faster image generation — switched to a more reliable image engine for quicker character generation',
      'Reference sheet mirroring fix — side profile panels now use screen-direction cues for correct left/right orientation',
      'Generate ref sheet for uploaded characters — admin can now generate reference sheets for manually uploaded profile photos',
      'Upload error handling — clear error messages when file uploads fail or exceed the 4.5MB size limit',
      'Roster expansion — Marcus Thorne and Koa Kahale migrated to the main marketplace',
    ],
  },
  {
    date: '2026-04-02',
    title: 'Mobile Overhaul, Cast Picks, and Smarter Character Creation',
    summary:
      'End-to-end mobile responsiveness, a new Featured Characters strip, 4K asset labeling, and improved character creation with professional styling and accurate preview selection.',
    highlights: [
      'Full mobile responsiveness — hero banner, marketplace grid, character modal, filter drawer, and create flow all optimized for mobile',
      'Cast Picks — featured characters highlighted in a dedicated strip above the roster',
      'Marketplace freshness — characters now sorted by recency with "Added Xd ago" indicators',
      'Mobile favorites — heart button always visible on touch devices',
      '4K resolution labeling on reference sheets and 2K on profile photos in the download step',
      'Professional character styling — AI-generated characters now default to polished, smart-casual attire',
      'Preview selection fix — choosing a specific re-rolled preview now correctly uses that image for the final profile and reference sheet',
      'Rebranded credit line from cast.ai to castability.ai',
    ],
  },
  {
    date: '2026-04-01',
    title: 'Custom Character Creator, Studio-Grade Portraits, and Contact Page',
    summary:
      'Create your own AI characters from scratch with our new character creator. We also upgraded our profile photo engine for consistent studio-quality portraits and added a contact page.',
    highlights: [
      'New "Create" flow — describe any character and generate a photorealistic AI profile and reference sheet in minutes',
      'Studio-grade profile photos — new prompt engine produces consistent warm-gray studio backdrops across all characters',
      'Credit-based purchasing — buy character generation credits via Stripe checkout',
      'Contact page — reach us anytime at admin@castability.ai',
      'Randomized attribute suggestions make character creation faster and more inspiring',
    ],
  },
  {
    date: '2026-03-28',
    title: 'SEO Overhaul, Faster Loading, and 60 New Characters',
    summary:
      'Major performance and discoverability update — individual character pages with rich metadata, lazy-loaded images, skeleton loading states, and a massive roster expansion.',
    highlights: [
      '60 new AI characters added to the talent roster via bulk import',
      'Individual character pages with unique URLs, Open Graph tags, and structured data for search engines',
      'Lazy loading and on-the-fly image thumbnails for dramatically faster page loads',
      'Skeleton loading states so the marketplace feels instant',
      'Sitemap and canonical URLs for better Google indexing',
      'AI-friendly llms.txt file for AI search engine discovery',
    ],
  },
  {
    date: '2026-03-25',
    title: 'AI Character Reference Sheets and Kie.ai Integration',
    summary:
      'Characters now come with professional 8-panel reference sheets for AI video production. Powered by our new Kie.ai integration with fal.ai fallback.',
    highlights: [
      '8-panel character reference sheets — front, side, back, and close-up views for every character',
      'Kie.ai (Nano Banana 2) as primary image generation engine with fal.ai fallback',
      'Image-to-image generation ensures reference sheets match the profile photo exactly',
      'Admin dashboard improvements for character management',
    ],
  },
  {
    date: '2026-03-22',
    title: 'Cast Launch — AI Character Casting Agency Goes Live',
    summary:
      'The world\'s first AI character casting agency is live. Browse, filter, and license photorealistic AI-generated characters for film and video production.',
    highlights: [
      'Curated roster of AI-generated characters with realistic, anime, and stylized options',
      'Advanced filtering by age, ethnicity, build, height, and style',
      'Three-tier licensing — Single Project, Studio License, and Exclusive Rights',
      'Stripe-powered checkout with instant license delivery',
      'Mobile-responsive design with light theme and cinematic feel',
    ],
  },
];
