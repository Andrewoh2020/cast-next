# Cast — CLAUDE.md

## Project Overview
AI character casting agency website. AI video studios browse, cast, and license 100% AI-generated characters. Light-themed, human-centric, high-end Hollywood meets cutting-edge tech.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Runtime**: Node.js v25
- **Package manager**: npm

## Dev Commands
```bash
# Start dev server
eval "$(/opt/homebrew/bin/brew shellenv)" && npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

Dev server runs at **http://localhost:3000**

> Note: Homebrew is at `/opt/homebrew/bin/brew` — always source shellenv before running node/npm if not already in PATH.

## Project Structure
```
cast-next/
├── app/
│   ├── layout.tsx        # Root layout — Nav + Footer, metadata, Geist font
│   ├── page.tsx          # Home page composition
│   ├── globals.css       # Base styles + Tailwind import
│   └── icon.png          # Favicon
├── components/
│   ├── Nav.tsx           # Sticky nav with mobile hamburger
│   ├── Hero.tsx          # Landing hero section
│   ├── TrustStrip.tsx    # Trust/feature badges
│   ├── HowItWorks.tsx    # 3-step process section
│   ├── TalentRoster.tsx  # Client component — filter state + grid
│   ├── FilterSidebar.tsx # Collapsible filter sidebar/drawer
│   ├── TalentCard.tsx    # Individual character card
│   ├── TalentModal.tsx   # Character profile modal + license picker
│   ├── SuccessModal.tsx  # Post-purchase success screen
│   ├── CtaBanner.tsx     # Bottom CTA banner
│   └── Footer.tsx        # Site footer
└── lib/
    └── talent.ts         # All talent data, types, label maps, filter logic
```

## Data Model
All character data lives in `lib/talent.ts`. Each `Talent` has:
- `sex` — male, female, nonbinary
- `race[]` — multi-value (east-asian, south-asian, black, latino, middle-eastern, white, southeast-asian, mixed)
- `ethnicity` — specific national/cultural background (e.g. Korean, Nigerian, Swedish)
- `ageRange` — child, teen, 20s, 30s, 40s, 50s, 60s+
- `build` — slim, athletic, average, stocky, curvy, plus-size
- `height` — short, average, tall
- `style` — realistic, anime, cartoon, 3d-cgi, stylized
- `prices[]` — array of `{ name, price, amount }` (three tiers: Single Project, Studio License, Exclusive Rights)

Filter logic (AND across categories, OR within): `filterTalent()` in `lib/talent.ts`

## Design System
- **Accent**: Indigo — `indigo-500` / `#6366f1`
- **Theme**: Light only — no dark mode
- **Font**: Geist Sans
- **Rounding**: `rounded-xl` / `rounded-2xl`
- **Cards**: white bg, `border-gray-100`, `shadow-sm` → `shadow-xl` on hover

## Planned Features
- [ ] Admin dashboard — upload/manage characters
- [ ] Stripe integration — real license checkout
- [ ] Character data from JSON/DB instead of hardcoded `lib/talent.ts`

## GitHub
https://github.com/Andrewoh2020/cast-next
