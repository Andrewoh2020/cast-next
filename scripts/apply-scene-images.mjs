/**
 * Apply the marquee sceneImg paths onto each character record.
 * Reads characters.json from Blob, patches the 10 characters we've generated
 * scene portraits for, and writes back.
 */
import { put, get } from '@vercel/blob';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BLOB_KEY = 'characters.json';
const ASSIGNMENTS = {
  // Batch 1
  'min-ji-park':                        '/api/media?p=scene-portraits%2Fmin-ji-park-1776252882422.jpg',
  'diego-mrquez':                       '/api/media?p=scene-portraits%2Fdiego-mrquez-1776253257654.jpg',
  'black-man-mark-hall':                '/api/media?p=scene-portraits%2Fblack-man-mark-hall-1776253357531.jpg',
  'dr-amara-okonkwo':                   '/api/media?p=scene-portraits%2Fdr-amara-okonkwo-1776253534226.jpg',
  'akira-shimizu':                      '/api/media?p=scene-portraits%2Fakira-shimizu-1776253612303.jpg',
  'moana-tui':                          '/api/media?p=scene-portraits%2Fmoana-tui-1776254018044.jpg',
  'koa-kahale':                         '/api/media?p=scene-portraits%2Fkoa-kahale-1776254183109.jpg',
  'viktor-rosenberg':                   '/api/media?p=scene-portraits%2Fviktor-rosenberg-1776254519477.jpg',
  'ratana-keo':                         '/api/media?p=scene-portraits%2Fratana-keo-1776254694428.jpg',
  'takoda-birdsong':                    '/api/media?p=scene-portraits%2Ftakoda-birdsong-1776254836358.jpg',
  // Batch 2
  'james-whitmore':                     '/api/media?p=scene-portraits%2Fjames-whitmore-1776255439620.jpg',
  'vera-liang':                         '/api/media?p=scene-portraits%2Fvera-liang-1776255518193.jpg',
  'katalin-kovcs':                      '/api/media?p=scene-portraits%2Fkatalin-kovcs-1776255591261.jpg',
  'talia-nafanua':                      '/api/media?p=scene-portraits%2Ftalia-nafanua-1776255653678.jpg',
  'greta-lindstrm':                     '/api/media?p=scene-portraits%2Fgreta-lindstrm-1776255727738.jpg',
  'black-woman-amara-okonkwo-santos':   '/api/media?p=scene-portraits%2Fblack-woman-amara-okonkwo-santos-1776255803474.jpg',
  'european-man-declan-oshaughnessy':   '/api/media?p=scene-portraits%2Feuropean-man-declan-oshaughnessy-1776255892032.jpg',
  'european-man-marco-rossini':         '/api/media?p=scene-portraits%2Feuropean-man-marco-rossini-1776255984532.jpg',
  'tenzin-dorje':                       '/api/media?p=scene-portraits%2Ftenzin-dorje-1776256078343.jpg',
  'priya-sharma':                       '/api/media?p=scene-portraits%2Fpriya-sharma-1776269023359.jpg',
};

async function main() {
  // Read from private blob using the same pattern lib/characters.server.ts uses
  console.log(`Fetching ${BLOB_KEY} from private blob...`);
  const result = await get(BLOB_KEY, { access: 'private', useCache: false });
  if (!result || !result.stream) throw new Error('characters.json not found in Blob');
  const text = await new Response(result.stream).text();
  const characters = JSON.parse(text);
  console.log(`Loaded ${characters.length} characters`);

  let patched = 0;
  for (const c of characters) {
    if (ASSIGNMENTS[c.slug]) {
      c.sceneImg = ASSIGNMENTS[c.slug];
      patched++;
      console.log(`  ✓ Patched ${c.slug} → ${c.sceneImg}`);
    }
  }
  console.log(`\nPatched ${patched} / ${Object.keys(ASSIGNMENTS).length} targets`);

  if (patched === 0) {
    console.log('Nothing to write. Exiting.');
    return;
  }

  console.log('\nWriting back to Blob...');
  await put(BLOB_KEY, JSON.stringify(characters, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  console.log('✓ Done');
}

main().catch((e) => {
  console.error('FATAL:', e?.message || e);
  process.exit(1);
});
