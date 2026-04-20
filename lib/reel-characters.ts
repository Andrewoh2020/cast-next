import type { ReelCharacter } from '@/components/home/ExportReel';
import charactersRaw from '@/data/characters.json';

interface CharacterJson {
  name: string;
  slug?: string;
  img?: string;
  referenceSheetUrl?: string;
}

// Drop per-character clips into `/public/reel-clips/` and register them
// here. Keys are character slugs from `data/characters.json`.
//
// File convention: `/reel-clips/{slug}.mp4`. Clips should be short and
// loopable (720p @ ~4–8s). If you only have a single one-shot take, set
// `loop: false` and the reel advances to the next character as soon as
// it finishes instead of restarting awkwardly mid-window.
interface VideoEntry { src: string; loop?: boolean }
const VIDEO_MAP: Record<string, VideoEntry> = {
  'diego-mrquez':                  { src: '/reel-clips/diego-mrquez2.mp4' },
  'min-ji-park':                   { src: '/reel-clips/min-ji-park.mp4' },
  'east-asian-woman-akira-tanaka': { src: '/reel-clips/east-asian-woman-akira-tanaka.mp4' },
  'east-asian-woman-hailey-kim':   { src: '/reel-clips/east-asian-woman-hailey-kim.mp4' },
  'takoda-birdsong':               { src: '/reel-clips/takoda-birdsong.mp4' },
  'black-man-marcus-stewart':      { src: '/reel-clips/black-man-marcus-stewart.mp4' },
};

export function pickReelCharacters(): ReelCharacter[] {
  const all = (charactersRaw as CharacterJson[]).filter(
    (c) => c.img && c.referenceSheetUrl && c.slug,
  );
  const picks: ReelCharacter[] = [];
  for (const [slug, entry] of Object.entries(VIDEO_MAP)) {
    const c = all.find((x) => x.slug === slug);
    if (!c) continue;
    picks.push({
      name: c.name,
      img: c.img!,
      referenceSheetUrl: c.referenceSheetUrl,
      videoSrc: entry.src,
      videoLoop: entry.loop,
    });
  }
  return picks;
}
