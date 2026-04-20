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
    date: '2026-04-20',
    title: 'Subscriptions, Daily Free Credits, and Workshop Upgrades',
    summary:
      'Cast moves to a subscription-first model with four plans, a daily free credit drip on the Free plan, and top-up packs for overage. Workshop adds an aspect ratio picker, single-image download, and a re-generate label so you always know what an action will cost.',
    highlights: [
      'New subscription plans — Free, Starter, Studio, and Pro. Pick one in seconds, switch any time, and see your live credit balance in the nav at all times',
      'Free plan now drips 10 credits a day, capped at 25 — try Cast every day without paying anything',
      '35-credit signup bonus for every new account on the Free plan',
      'Top-up packs (Boost and Power) for one-time credit boosts when you need overage on top of your plan',
      'In-app plan switching with a clear preview of any prorated charge before you confirm — no browser pop-ups, no surprises',
      'Manage payment methods, invoices, and cancellations from your account page or the customer billing portal',
      'Email receipts for every billing event — welcome, monthly renewal, plan switch, downgrade, scheduled cancellation, final cancellation, and top-up',
      'Workshop now shows an aspect ratio picker (cinema, landscape, square, portrait, vertical) — auto-detected from your character photo, but overridable per generation',
      'Workshop button now reads "Re-generate" after a successful generation so it is obvious that clicking again will spend credits for a re-roll',
      'Workshop credit cost shown on the button updates with the current action — no more stale numbers',
      'New "Download image" button below Generate — save the current image directly without packaging the full export zip',
      'Custom characters now include the reference sheet inside the export package',
      'Statement descriptor on your bank statement now reads CASTABILITY.AI for clean accounting',
      'Per-action credit costs reflect compute — light actions like outfits and scenes are 5 credits, full character generations are 25',
    ],
  },
  {
    date: '2026-04-17',
    title: 'Introducing Workshop — Dress, Stage, and Export Your Characters',
    summary:
      'Workshop is live. Take any character, dress them in new outfits, place them in any scene, and export a production-ready package for Kling, Runway, Veo, and more — all from one place.',
    highlights: [
      'Workshop launch — dress a character in new outfits, place them in cinematic scenes, and export a complete package ready for your AI video tool of choice',
      'Scene generation — characters appear in natural poses with scene-appropriate clothing instead of looking pasted onto backgrounds',
      'Smarter Improve button — one click enriches outfit details or adds cinematic shot direction',
      'Export package — download a single zip with the profile photo, 4K reference sheet, every outfit, every scene, and a usage guide',
      'Export package zip now works for uploaded characters as well as licensed ones',
      'Deletions in Workshop now stick — no more items reappearing after you remove them',
      'Clearer prompt errors — see right away if a prompt hits a content policy instead of waiting for a silent timeout',
      'Reference sheets and uploaded images keep their original aspect ratio automatically',
      'Workshop is fully mobile-responsive — horizontal library strip, stacked layout, icon-only export',
      'Credit balance now updates instantly across the site — no more stale numbers after a purchase',
      'Generation progress messages reflect the real stages so you know what is happening',
      'Homepage social proof strip — trusted AI video tools (Kling, Runway, Veo, Seedance) and our Product Hunt badge',
      'Homepage Workshop section — three visual cards explaining outfit, scene, and export',
      'Height and weight shown on character profiles like a casting comp card',
      'Licensing flow polished end-to-end',
      'Every new account gets 2 free character credits — no cap',
    ],
  },
  {
    date: '2026-04-16',
    title: 'Environmental Portraits and Archetype Casting Chips',
    summary:
      '20 featured characters now appear in cinematic scenes across the homepage — same face, new locations and wardrobe. The hero search now offers role-based prompts you can cycle through for instant inspiration.',
    highlights: [
      '20 featured characters now appear in cinematic scenes across the homepage (Seoul street, Barcelona cafe, hospital, Vienna library, Pacific beach, and more) — identity preserved, wardrobe adapted to the setting',
      'Role-based search prompts replace random suggestions — CEO, Athlete, Chef, Artist, Musician, Journalist. Each cycles through hand-written variations for fresh inspiration every click',
      'Cinematic variants shown only on the homepage — buyers still receive the clean studio headshot and 4K reference sheet',
    ],
  },
  {
    date: '2026-04-15',
    title: 'Homepage Redesign — Cinematic Hero Reel and Filmmaker-First Narrative',
    summary:
      'A ground-up homepage redesign that reframes Cast from "character catalog" to "AI casting platform." New cinematic hero reel, directability showcase, dedicated copyright-safe section, and upgraded roster browsing.',
    highlights: [
      'Cinematic hero reel — full-width showcase of AI characters in real scenes so filmmakers can see range at a glance',
      'New hero search with an animated typing placeholder and varied example prompts',
      'Directability section — shows how the same character looks across every angle with our 4K reference sheet',
      'Copyright-safe section — three clear pillars: no real-person likenesses, commercial license on every cast, written indemnity on Exclusive',
      'Browse the roster — sticky search, pill filters, and an inline Advanced filter panel; cleaner cards without marketing noise',
      'Higher-quality thumbnails across the site — noticeably sharper on retina displays',
      'Live demos auto-advance on scroll, with smooth crossfades between profile and reference sheet',
      'Character hover info now shows ethnicity and age, matching the roster card format',
    ],
  },
  {
    date: '2026-04-13',
    title: 'Product Hunt Launch, How It Works Page, and Launch Promo',
    summary:
      'Cast is live on Product Hunt! We added a How It Works walkthrough, a launch promo, more control over your reference sheets, and richer character profiles.',
    highlights: [
      'Product Hunt launch — Cast is officially live on Product Hunt',
      'How It Works page — a dedicated 4-step walkthrough from browsing to using characters in AI video tools',
      'Launch promo — 2 free credits on every new account',
      'Regenerate your reference sheet up to 3 times if the first result is not quite right',
      'Characters now include city of origin and culturally-accurate hairstyles for more realistic variety',
      'More consistent character appearance across every panel of the reference sheet',
      'Faster discovery of Cast in search engines',
    ],
  },
  {
    date: '2026-04-03',
    title: 'Smarter Characters, Better Portraits, and Production-Ready Emails',
    summary:
      'Characters are now more visually distinct with varied styling, the profile photo framing has been upgraded to a 3/4 portrait, and emails now send reliably from castability.ai.',
    highlights: [
      'Visually distinct characters — varied wardrobe, hairstyles, facial features, and accessories so each character looks unique',
      'New 3/4 portrait framing — head to above the knees with natural angled poses, replacing the old full-body shots',
      'Reliable email delivery — receipts and character delivery now come from castability.ai with verified domain',
      'Credit safeguards — reference sheets only generate after payment so you never spend credits by accident',
      'Live commercial checkout — character credit purchases work end-to-end',
      'Faster image generation across the platform',
      'Reference sheet orientation fix — side profile panels correctly mirror left and right',
      'Character name is now optional — we generate a fitting name from your description if you leave it blank',
      'Clear error messages when a file upload is too large or fails',
      'Two new characters added to the roster',
    ],
  },
  {
    date: '2026-04-02',
    title: 'Mobile Overhaul, Cast Picks, and Smarter Character Creation',
    summary:
      'End-to-end mobile responsiveness, a new Featured Characters strip, 4K asset labeling, and improved character creation with professional styling and accurate preview selection.',
    highlights: [
      'Full mobile responsiveness — hero, marketplace grid, character modal, filters, and create flow all optimized',
      'Cast Picks — featured characters spotlighted in a dedicated strip above the roster',
      'Marketplace freshness — newest characters float to the top with "Added Xd ago" indicators',
      'Mobile-friendly favorites — heart button always tappable',
      '4K resolution labeling on reference sheets and 2K on profile photos',
      'More polished character styling by default — smart-casual attire across the roster',
      'Preview selection fix — the exact preview you pick is the one used for your final profile and reference sheet',
      'Rebranded credit line from cast.ai to castability.ai',
    ],
  },
  {
    date: '2026-04-01',
    title: 'Custom Character Creator, Studio-Grade Portraits, and Contact Page',
    summary:
      'Create your own AI characters from scratch with our new character creator. We also upgraded our profile photo engine for consistent studio-quality portraits and added a contact page.',
    highlights: [
      'New Create flow — describe any character and generate a photorealistic profile and reference sheet in minutes',
      'Studio-grade profile photos — consistent warm-gray studio backdrops across all characters',
      'Credit-based purchasing — buy character generation credits with our new checkout',
      'Contact page — reach us anytime at admin@castability.ai',
      'Randomized attribute suggestions make character creation faster and more inspiring',
    ],
  },
  {
    date: '2026-03-28',
    title: 'Faster Marketplace and 60 New Characters',
    summary:
      'A major performance and discoverability update — 60 new characters, individual character pages, faster loads, and smoother browsing.',
    highlights: [
      '60 new AI characters added to the roster',
      'Individual character pages with unique URLs and rich previews for sharing',
      'Dramatically faster marketplace loads with smarter image delivery',
      'Loading placeholders so the marketplace feels instant',
      'Better discoverability in traditional and AI-powered search engines',
    ],
  },
  {
    date: '2026-03-25',
    title: 'AI Character Reference Sheets',
    summary:
      'Characters now come with professional 8-panel reference sheets for AI video production — front, side, back, and close-up views that lock identity across every shot.',
    highlights: [
      '8-panel character reference sheets — front, side, back, and close-up views for every character',
      'Sharper, more consistent image generation across the platform',
      'Reference sheets exactly match the profile photo for seamless use in your AI video tools',
    ],
  },
  {
    date: '2026-03-22',
    title: 'Cast Launch — AI Character Casting Agency Goes Live',
    summary:
      "The world's first AI character casting agency is live. Browse, filter, and license photorealistic AI-generated characters for film and video production.",
    highlights: [
      'Curated roster of AI-generated characters with multiple style options at launch',
      'Advanced filtering by age, ethnicity, build, height, and style',
      'Three-tier licensing — Single Project, Studio License, and Exclusive Rights',
      'Instant license delivery with secure checkout',
      'Mobile-responsive design with a cinematic feel',
    ],
  },
];
