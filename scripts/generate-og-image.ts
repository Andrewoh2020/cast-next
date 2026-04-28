/**
 * Generate the Open Graph share image by overlaying text on the existing
 * portrait at /public/og-cast-v2.png.
 *
 * Output: /public/og-cast-v3.png (1200×630, optimized for OG cards)
 *
 * Edit the SVG below to iterate on the typography / copy. Re-run with
 * `npx tsx scripts/generate-og-image.ts` to regenerate. Then update
 * `data/seo.json` ogImage to reference the new file (or keep v3 and
 * just overwrite this PNG).
 */

import sharp from 'sharp';
import path from 'path';

const SOURCE = path.join(process.cwd(), 'public', 'og-cast-v2.png');
const OUT = path.join(process.cwd(), 'public', 'og-cast-v4.png');
const W = 1200;
const H = 630;

// SVG overlay — left-side dark gradient for legibility, text on top.
// Uses Helvetica/Arial since system fonts are reliable in sharp's
// SVG renderer. Letter-spacing emulated with `letter-spacing` attr.
const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="dark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="black" stop-opacity="0.78"/>
      <stop offset="50%" stop-color="black" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="black" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottom" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.55"/>
    </linearGradient>
  </defs>

  <!-- Left-fade dark scrim for headline legibility -->
  <rect width="${W}" height="${H}" fill="url(#dark)"/>
  <!-- Bottom fade for the footer line -->
  <rect width="${W}" height="${H}" fill="url(#bottom)"/>

  <!-- Top-left wordmark -->
  <g transform="translate(60, 70)">
    <circle cx="10" cy="-2" r="6" fill="white"/>
    <text x="28" y="6" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="900" fill="white" letter-spacing="-1">CAST</text>
  </g>

  <!-- Headline: two lines, large -->
  <text x="60" y="380" font-family="Helvetica, Arial, sans-serif" font-size="78" font-weight="900" fill="white" letter-spacing="-3">The AI character</text>
  <text x="60" y="455" font-family="Helvetica, Arial, sans-serif" font-size="78" font-weight="900" fill="white" letter-spacing="-3">casting agency.</text>

  <!-- Tagline -->
  <text x="60" y="510" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="white" fill-opacity="0.9">Synthetic actors. License-clear. For Kling, Higgsfield, Artlist.</text>

  <!-- Bottom-left domain -->
  <text x="60" y="585" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="white" fill-opacity="0.7" letter-spacing="0.5">castability.ai</text>

  <!-- Bottom-right compliance pill -->
  <g transform="translate(${W - 60}, 575)">
    <rect x="-310" y="-22" width="310" height="32" rx="16" ry="16"
      fill="white" fill-opacity="0.12" stroke="white" stroke-opacity="0.35" stroke-width="1.5"/>
    <text x="-155" y="0" font-family="Helvetica, Arial, sans-serif" font-size="14" fill="white" fill-opacity="0.92" text-anchor="middle" font-weight="600">100% synthetic · no SAG-AFTRA exposure</text>
  </g>
</svg>
`;

async function main(): Promise<void> {
  console.log(`\nGenerating OG image…`);
  console.log(`   Source: ${SOURCE}`);
  console.log(`   Output: ${OUT}`);
  console.log(`   Size:   ${W}×${H}\n`);

  await sharp(SOURCE)
    .resize(W, H, { fit: 'cover', position: 'center' })
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .png({ quality: 92 })
    .toFile(OUT);

  const stats = await sharp(OUT).metadata();
  console.log(`✅ Saved ${OUT}`);
  console.log(`   ${stats.width}×${stats.height}, ${(stats.size ?? 0 / 1024).toFixed(0)} KB\n`);
}

main().catch((err) => {
  console.error('Failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
