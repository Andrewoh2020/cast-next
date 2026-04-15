# Character Workshop — Wardrobe, Scenes, and Voice

*Product spec + implementation plan. Source of truth. Versioned in-repo so it survives planning tool turnover.*

## Context

Castability's homepage promises "photoreal AI actors for commercial video" and shows scene-placed characters in cinematic environments. But once a user licenses a character, they get the studio headshot and the 8-panel reference sheet — and nothing else. If they want the character in a different outfit, a different scene, or with a voice, they have to run their own generation pipeline elsewhere. That's exactly the workflow-fragmentation pain point 2026 AI filmmakers complain about loudest.

This plan builds the **Character Workshop** — the post-license experience where a licensed character becomes a **fully workable asset pack**: the buyer can re-outfit them (text *or* uploaded garment photo), place them in scenes (text *or* uploaded scene photo), assign them a voice, and download everything as one bundle ready for Kling, Runway, or Veo.

### 2026 market context
- **Seedance 2.0** leads on identity preservation, accepts up to 9 reference images with @-binding, and is the current Elo leader for scene placement.
- **Kling 3.0 Pro** has outfit drift — identity holds when clothes don't change, but degrades when outfit + pose + background change simultaneously.
- **Top unsolved problems:** outfit changes while maintaining identity; character consistency across scenes; voice/dialogue sync; workflow fragmentation.
- **Opportunity:** pre-outfitted packs + bundled voice — neither Seedance nor Kling solves this natively today.

### Intended outcome
A buyer licenses a character, opens the Workshop, and can:
1. Generate wardrobe variants from a prompt **or** an uploaded garment photo, identity preserved.
2. Place the character (in any wardrobe) into scenes described by prompt **or** uploaded reference photo.
3. Download a single package (images + README) that drops directly into Kling / Runway / Veo.
4. Later — assign a persistent voice and include a voice sample in the package.

Every paid action costs credits, funding the subscription + credit economy.

---

## Scope — 4 features

### Phase 1 — Wardrobe Editor ("Dress the character")
Three inputs, all ending in the same identity-locked Nano Banana 2 edit call:
- **Preset chip** — Business · Casual · Athletic · Formal · Street · Cultural. Each expands into 8–12 curated sub-options.
- **Custom prompt** — free text ("black-tie evening gown, emerald silk").
- **Upload garment photo** — drag-and-drop / file pick. User uploads a photo of a real garment (a jacket, dress, uniform). The model places that garment on the character. Prompt text (optional) can refine ("same jacket, styled casually"). Image upload is the real power-user mode.

1 credit per generated variant.

### Phase 2 — Scene Editor ("Place in scene")
Same pattern:
- **Preset chip** — Urban · Nature · Studio · Indoor · Film Set · Cultural.
- **Custom prompt** — "Tokyo Shibuya crossing at night".
- **Upload scene photo** — user's storyboard frame, a location reference, a mood photo. Model composites the character into that scene, adjusting lighting and outfit as needed.

Source image can be any outfit variant from Phase 1, or the default studio headshot. 1 credit per shot.

### Phase 3 — Package Download *(ships after Phase 2)*
One-click zip of: profile image, 4K 8-panel reference sheet, every outfit variant, every scene shot, and a README with plug-in instructions for Kling, Runway, Veo. Free once the assets are paid for.

### Phase 4 — Voice *(ships last; needs extra care)*
- Pick from ElevenLabs Voice Library (filter by gender/age/accent) or clone a 10–60s sample.
- Preview with custom text (up to 200 chars).
- Lock in a voice (5 credits); unlimited preview regens for 7 days.
- Voice sample + voice ID added to the download package.
- Deliberately shipped last — the model / moderation surface / audio UX is a meaningfully different risk profile than image editing, and we want the visual workshop stable before we add it.

### Explicitly out of scope
- Final pricing / subscription tiers (planned separately).
- Kling/Seedance video generation inside Cast (users still render video in their own tool).
- Multi-character scene composition (one character at a time for now).
- Lipsync / rendered-video delivery.

---

## UI/UX — where we win

The whole experience should feel like a **creative studio**, not a SaaS form. Think the polish of Linear, the fluidity of Figma, the cinematic confidence of a professional grading suite. The user should leave feeling more creative than when they arrived.

### Core principles

1. **The character is the star.** The generated image is always the biggest thing on the screen. Controls recede. Text is small. Whitespace is generous.
2. **One click to try, zero cost to undo.** Any action is two clicks away (pick → generate); every variant is kept; nothing is destructive.
3. **Inspiration is free, specificity is fast.** Presets are beautiful. Custom prompts surface suggested modifiers. Uploads are front-and-center, not buried under an "advanced" tab.
4. **Generation is a moment, not a loading screen.** Progress is narrated, the result reveals with intent, the counter ticks down with a small celebration.
5. **Everything has a next step.** An outfit can go straight into a scene. A scene can go straight into the download package. The workshop teaches its own workflow.

### Layout

A single full-bleed workshop view (escape the site's nav chrome). Three zones:

```
┌─────────────────────────────────────────────────────────────┐
│ [Cast logo]  Min-ji Park · Studio License         23 credits│ ← minimal header
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│                                  │   TAB: Wardrobe          │
│        [ CHARACTER CANVAS ]      │   ────────────────       │
│          Current selection       │   [ Preset chips ]       │
│          (click to swap)         │                          │
│                                  │   [ 3×3 preset grid ]    │
│                                  │                          │
│                                  │   or: Custom prompt ┐    │
│                                  │       Upload garment ┘   │
│                                  │                          │
│                                  │   [ Generate · 1 credit ]│
│                                  │                          │
├──────────────────────────────────┴──────────────────────────┤
│  Wardrobe · 5 variants    [thumb] [thumb] [thumb] [thumb]   │ ← asset strip
│  Scenes · 3 shots         [thumb] [thumb] [thumb]           │
└─────────────────────────────────────────────────────────────┘
```

**Left canvas** is 60% of screen width. Shows the currently-selected asset (profile, outfit variant, or scene shot). Soft shadow, rounded-3xl corners, subtle scene-matched ambient glow behind it.

**Right tool panel** is 40%. Swaps based on active tab. Never scrolls below the fold in the default state — presets fit, prompt + upload stay visible.

**Bottom asset strip** is horizontally scrollable, grouped by type. Each thumb is clickable (swap into canvas), long-press/right-click for rename/delete, supports keyboard nav (← → arrows).

**Tabs** (left rail or top-of-panel): Overview · Wardrobe · Scenes · Download · Voice *(locked until Phase 4 ships)*.

### Micro-interactions

- **Swapping selection:** Click any thumbnail → canvas crossfades in 400ms, subtle lift-and-settle motion. Feels like a lookbook.
- **Preset hover:** Preset chips preview on hover — the canvas shows a ghost/faded version of what the character could look like in that category (pulled from a curated generic preview, not a generation).
- **Generate button:** Shows credit cost inline. Hover shows a tooltip with the exact prompt being sent (so power users can verify). One click to confirm + start.
- **Loading:** Never a spinner. The canvas shows a skeletal ghost of the character with a shimmer sweep; the button becomes a thin progress bar with three narrated stages:
  1. *"Sketching the wardrobe…"* (0–20%)
  2. *"Dressing [Name]…"* (20–80%)
  3. *"Final polish…"* (80–100%)
  Average generation takes ~40s — pacing the stages keeps the wait from feeling dead.
- **Reveal:** Completed image wipes in from behind the skeleton, credit counter ticks down with a soft number-roll.
- **Undo:** Global ⌘Z undoes the last canvas swap; the asset is never deleted, just removed from the current view.
- **Keyboard shortcuts:**
  - `W` — Wardrobe tab
  - `S` — Scenes tab
  - `D` — Download tab
  - `⌘Z` / `⌘⇧Z` — undo/redo canvas selection
  - `⌘↵` — Generate (when focused in prompt)
  - `← →` — step through asset strip

### Each tab, in detail

#### Overview
A calm landing tab, not a dashboard. Shows:
- Character profile card (large portrait, name, age, ethnicity, license type)
- **Numbers small, visuals big:** "5 outfits · 3 scenes · No voice yet"
- Recent activity — 3 most recent generations as full-size thumbnails
- Quick actions: "New outfit", "New scene", "Download package"
- Link to the full reference sheet (opens as a full-screen modal)

#### Wardrobe
The key screen. Top-to-bottom flow:

1. **Category strip** — a horizontal row of large, labeled buttons: `Business` `Casual` `Athletic` `Formal` `Street` `Cultural` `Upload`. Clicking one reveals sub-presets below; clicking another replaces. Selected category is highlighted indigo; others are ghost-ed.

2. **Preset grid** (when a category is selected) — 3×3 grid of outfit preview thumbnails. Each thumb is a small curated image showing what that outfit looks like (doesn't have to be of this character — these are style-direction references, like a moodboard). Hover: slight scale-up + "Use this direction" tooltip. Click: selects that preset; its generated prompt fills the prompt field below (editable), and Generate becomes active.

3. **Custom prompt area** (always visible below the preset grid) — a large text field with placeholder *"Describe an outfit — fabric, color, era, era, mood…"* Below it, three suggestion chips ("silk", "tailored", "streetwear") that append to the prompt. Users can write without choosing a preset.

4. **Upload garment** (right side of the prompt area, separate card) — a dashed dropzone: *"Or drop a photo of a garment."* Accepts JPEG/PNG/WebP. When filled, shows a 100×100 thumbnail of the uploaded garment + clear button. User can *combine* an upload with a prompt ("styled casually, with this jacket") — this is the power move that differentiates Cast from every competitor.

5. **Generate button** — full-width below. Label: `Generate · 1 credit`. Disabled when no category/prompt/upload is active. Hovering shows a tooltip with the compiled prompt that will be sent.

After generation, the new outfit:
- Appears as the hero in the canvas
- Lands in the Wardrobe strip at the bottom
- The category/prompt/upload inputs clear so the user can try another direction

#### Scenes
Mirror structure of Wardrobe, but with one extra control at the top:

- **Source picker** — a small horizontal strip showing the current outfit options (profile, each wardrobe variant) with an "Apply" chip. Defaults to the currently-selected canvas image. Sends whichever outfit the user wants placed in the scene.
- **Category / preset grid / custom prompt / scene photo upload** — identical UX to Wardrobe.
- **Generate** — same interaction pattern.

Generated shots show the outfit they were based on (small pill chip: *"Business outfit"*) so the user can trace back.

#### Download
A pre-flight checklist layout:

```
Ready to ship
  ✓ Profile photo                            2.3 MB
  ✓ 4K 8-panel reference sheet              11.1 MB
  ✓ 5 wardrobe variants                     14.2 MB
  ✓ 3 scene shots                            9.8 MB
  ○ Voice sample                               coming soon
  ✓ README with Kling / Runway / Veo guide
                                 ──────────────
                          Total package      37.4 MB

           [ Download package (Free) ]
```

Zero surprise, zero cost (user already spent credits on the content), big download button. After download completes, confetti-lite celebration + share prompt ("Tag us — we'd love to see what you make").

#### Voice *(Phase 4)*
Sits behind a subtle "Coming Soon" badge until shipped. When live:
- Voice library browser (filter pills: gender, age, accent, mood)
- Each voice card has a "▶︎ Play sample" with built-in ElevenLabs sample
- Text field at bottom: *"Type a sample line to hear [Name] say it…"* — plays in selected voice
- Clone tab: drag-drop audio sample, progress bar, plays back once processed
- Lock-in button: `Lock in this voice · 5 credits` — when clicked, voice becomes a persistent asset on the character
- After lock-in: sample audio appears in the canvas below the image as a soundwave visualization

### Credit UX

- **Persistent counter** top-right: `23 credits` with a subtle indigo underline
- **Pre-action:** the Generate button always shows cost inline (never hidden in a modal)
- **Post-action:** counter animates `23 → 22` with a soft flash
- **Low credit (≤3):** a gentle chip appears next to the counter: *"Running low — add more"* (link, not a popup)
- **Out of credits:** Generate button swaps to `Top up to generate` → routes to purchase flow without losing workshop state

### Empty states

- **No variants yet:** Wardrobe tab shows the preset grid large + a single copy line: *"Pick a direction or describe something only you can imagine."* No scary blank canvas — the canvas still shows the studio headshot.
- **First-time user:** a three-step onboarding tooltip overlay ("Pick a direction → Generate → Download") that dismisses on any interaction. Never again unless they click "Show tour" in Overview.

### Errors / failure modes

- **Generation fails:** auto-retry once silently. If still fails, show a calm inline message: *"That didn't quite work. Credit refunded. Try tweaking the prompt?"* with two suggestion chips from our prompt catalogue.
- **Moderation block** (rare — Nano Banana 2 has been permissive for us): *"That prompt was flagged. No credit spent. Try a different direction?"*
- **Upload too large:** gentle toast: *"Upload under 4.5 MB, please."* (matches existing limits.)

### Comparison mode *(stretch)*

Hold `C` while clicking a second variant → canvas splits into a side-by-side comparison. A slider lets you wipe between them. Lightweight, doesn't require a separate view.

### Why this wins
- Every screen is **the character, centered, beautiful** — the asset you're buying is the asset you're seeing.
- Upload-a-garment and upload-a-scene are the power moves no competitor makes first-class. They turn "AI character" into "my character, in my story."
- No dead waits, no surprise pricing, no dead-ends — every action has a natural next step.
- The workshop teaches filmmakers a workflow they'll feel they invented.

---

## Technical approach

### Data model
Per-character workshop data stored as its own Blob file to avoid bloating the character record:
- Blob key: `users/{userId}/workshop/{characterId}.json`
- Shape:
  ```ts
  interface WorkshopData {
    characterId: number;
    licenseName: string;
    outfits: OutfitVariant[];
    shots: SceneShot[];
    voice?: VoiceSpec;
    updatedAt: string;
  }
  interface OutfitVariant {
    id: string;
    prompt: string;
    garmentRefUrl?: string; // blob path if user uploaded a garment photo
    imageUrl: string;
    thumbUrl?: string;
    createdAt: string;
    creditsSpent: number;
  }
  interface SceneShot {
    id: string;
    prompt: string;
    sceneRefUrl?: string;   // blob path if user uploaded a scene photo
    sourceOutfitId?: string;
    imageUrl: string;
    thumbUrl?: string;
    createdAt: string;
    creditsSpent: number;
  }
  interface VoiceSpec {
    provider: 'elevenlabs';
    voiceId: string;
    previewAudioUrl: string;
    sampleText: string;
    lockedInAt: string;
    creditsSpent: number;
  }
  ```

### Generation pipeline reuse
Uses the existing `lib/generation.server.ts` patterns. Two new helpers:
- `generateOutfit({ profileImageUrl, outfitPrompt, garmentRefUrl? })` — sends Nano Banana 2 edit with either just the character image (prompt-only) or character + garment reference (`image_urls: [profile, garment]`). The model already accepts multi-image references.
- `generateSceneShot({ sourceImageUrl, scenePrompt, sceneRefUrl? })` — same pattern. Can send a scene photo alongside the character image for precise composition matching.

Identity-lock prompt pattern (same that worked for the homepage marquee):
> "Place this person in a scene: [scene]. Keep their face, skin tone, hair, and body type IDENTICAL to the reference — this must clearly be the same person, no facial changes. Change only their wardrobe to fit the scene: [outfit]. Lighting integration: subject lit by ambient scene light only. Photorealistic 35mm film look."

### Upload handling
- Existing `/api/upload` endpoint already handles 4.5 MB image uploads to Blob under the user's namespace. Reuse.
- Workshop upload paths: `users/{userId}/workshop/{characterId}/garments/<uuid>.jpg`, `.../scenes/<uuid>.jpg`.

### Credit gating
- Reuse `deductCredit`/`addCredits` from `lib/user-data.server.ts`.
- On generation call: `deductCredit` → try generation → on failure `addCredits(1, 0, refund-<id>)`.
- Voice lock-in needs a new helper `deductCredits(n)` that's atomic (no partial deduct if something fails).
- Ownership gate: new `userOwnsCharacter(userId, characterId)` helper scans `userData.purchases`.

### API routes (all under `app/api/workshop/[characterId]/`)
| Route | Method | Purpose |
|---|---|---|
| `outfits/route.ts` | POST / GET | Generate / list outfits. POST accepts `{ prompt?, garmentRefUrl? }`. |
| `outfits/[variantId]/route.ts` | DELETE | Remove an outfit variant. |
| `shots/route.ts` | POST / GET | Generate / list shots. POST accepts `{ prompt?, sourceOutfitId?, sceneRefUrl? }`. |
| `shots/[shotId]/route.ts` | DELETE | Remove a shot. |
| `uploads/garment/route.ts` | POST | Multipart upload for garment reference. Returns blob path. |
| `uploads/scene/route.ts` | POST | Multipart upload for scene reference. Returns blob path. |
| `package/route.ts` | GET | Stream the zip. |
| `voice/*` | POST | *(Phase 4 only.)* |

### UI components (`components/workshop/`)
- `WorkshopShell.tsx` — tab navigation + canvas + asset strip layout
- `CharacterCanvas.tsx` — the big preview with crossfade + ambient glow
- `AssetStrip.tsx` — horizontal thumbnails grouped by type
- `OutfitEditor.tsx` — presets + prompt + garment upload
- `SceneEditor.tsx` — source picker + presets + prompt + scene upload
- `GenerateButton.tsx` — shared button with stage-narrated loading
- `PackageDownload.tsx` — checklist + zip download
- `WorkshopCreditIndicator.tsx` — top-right counter

### Packaging (`lib/workshop-package.server.ts`)
- `archiver` npm package for streaming zip.
- Contents: `profile.jpg`, `reference-sheet.jpg`, `wardrobe/*.jpg`, `scenes/*.jpg`, `README.md`. (Voice files in Phase 4.)
- Response streams directly from `/api/workshop/[characterId]/package` — no temp file needed.

### Analytics (`lib/analytics.ts`)
New events: `workshop_open`, `outfit_generated`, `outfit_uploaded_ref`, `scene_generated`, `scene_uploaded_ref`, `package_downloaded`, `voice_locked` *(Phase 4)*.

---

## Phased rollout

1. **Phase 1 — Wardrobe Editor** (ship first). Includes garment upload. Proves identity-lock, credit sink, and the canvas-centered UX.
2. **Phase 2 — Scene Editor**. Builds on Phase 1 infra; adds scene-photo upload and outfit-source picker.
3. **Phase 3 — Package Download**. Small lift, big payoff. Ships once 1–2 have real assets to bundle.
4. **Phase 4 — Voice**. Ships last. ElevenLabs integration + audio UX + moderation surface is a different risk profile; wait until the visual workshop is stable in production.

Each phase is independently shippable and gives real user value.

---

## Critical files

### Modify
- `lib/generation.server.ts` — add `generateOutfit`, `generateSceneShot`
- `lib/user-data.server.ts` — add `userOwnsCharacter`, `deductCredits(n)`
- `lib/talent.ts` — no required change; workshop data lives in its own blob
- `components/AccountClient.tsx` — surface owned characters' workshop stats
- `app/characters/[slug]/CharacterPageClient.tsx` — show "Open Workshop" when owned
- `app/account/page.tsx` — workshop entry point

### Create
- `lib/workshop.server.ts` — CRUD for `WorkshopData`
- `lib/workshop-package.server.ts` — zip streaming
- `lib/voice.server.ts` *(Phase 4)*
- `app/workshop/[slug]/page.tsx` + full component tree
- All API routes under `app/api/workshop/[characterId]/`
- `components/workshop/` — 8 components listed above

---

## Verification

### Phase 1 (Wardrobe)
1. Licensed user opens `/workshop/<slug>`, canvas shows their profile.
2. "Business" preset → expect new variant, credit decrement by 1.
3. Custom prompt — identity preserved.
4. Upload a garment photo → expect that specific garment placed on the character.
5. Non-owner → 403 from API, locked UI.
6. Out of credits → Generate becomes `Top up to generate`, preserves state.

### Phase 2 (Scenes)
1. Select a wardrobe variant as the source → scene generation uses that image.
2. Upload a scene photo → character composited into exactly that environment.
3. Deleting an outfit leaves derived shots intact.

### Phase 3 (Package)
1. Download button → zip streams, ~30–100 MB.
2. Contents match the workshop state exactly.
3. README includes correct asset filenames + Kling/Runway/Veo instructions.
4. Non-owner hitting package URL → 403.

### Phase 4 (Voice, later)
1. Browse ElevenLabs library, filter works.
2. Preview plays cleanly.
3. Lock-in deducts 5 credits atomically; persists across reloads.
4. Clone upload accepts 10–60s sample, produces a usable voice.

### Production smoke (all phases)
- Vercel deploy succeeds with new deps (archiver for Phase 3, elevenlabs for Phase 4).
- `trackBeginCreate` still fires from `/create`.
- Homepage hero reel + marquee unaffected.
- No console errors, no broken image requests on `/workshop/<slug>` routes.
