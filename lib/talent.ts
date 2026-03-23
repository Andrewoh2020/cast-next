export type TalentRole = 'lead' | 'supporting' | 'villain' | 'hero' | 'narrator' | 'ensemble';
export type TalentSex = 'male' | 'female' | 'nonbinary';
export type TalentEthnicity =
  | 'east-asian'
  | 'south-asian'
  | 'black'
  | 'latino'
  | 'middle-eastern'
  | 'white'
  | 'southeast-asian'
  | 'mixed';
export type TalentAgeRange = 'child' | 'teen' | '20s' | '30s' | '40s' | '50s' | '60s+';
export type TalentBuild = 'slim' | 'athletic' | 'average' | 'stocky' | 'curvy' | 'plus-size';
export type TalentHeight = 'short' | 'average' | 'tall';
export type TalentStyle = 'realistic' | 'anime' | 'cartoon' | '3d-cgi' | 'stylized';
export type TalentGenre =
  | 'action'
  | 'drama'
  | 'comedy'
  | 'sci-fi'
  | 'thriller'
  | 'romance'
  | 'horror'
  | 'political'
  | 'indie';

export interface PriceOption {
  name: string;
  price: string;
  amount: number;
}

export interface Talent {
  id: number;
  name: string;
  slug: string;
  vibe: string;
  img: string;
  gallery?: string[];
  referenceSheetUrl?: string;
  // Core attributes
  roles: TalentRole[];
  sex: TalentSex;
  ethnicities: TalentEthnicity[];
  ageRange: TalentAgeRange;
  build: TalentBuild;
  height: TalentHeight;
  style: TalentStyle;
  genres: TalentGenre[];
  languages: string[];
  prices: PriceOption[];
  exclusive?: boolean;
  exclusiveDisabled?: boolean;
}

// ── Label maps for display ──────────────────────────────────────────

export const ROLE_LABELS: Record<TalentRole, string> = {
  lead: 'Lead',
  supporting: 'Supporting',
  villain: 'Villain',
  hero: 'Hero',
  narrator: 'Narrator',
  ensemble: 'Ensemble',
};

export const SEX_LABELS: Record<TalentSex, string> = {
  male: 'Male',
  female: 'Female',
  nonbinary: 'Non-binary',
};

export const ETHNICITY_LABELS: Record<TalentEthnicity, string> = {
  'east-asian': 'East Asian',
  'south-asian': 'South Asian',
  'black': 'Black',
  'latino': 'Latino / Hispanic',
  'middle-eastern': 'Middle Eastern',
  'white': 'White',
  'southeast-asian': 'Southeast Asian',
  'mixed': 'Mixed Heritage',
};

export const AGE_LABELS: Record<TalentAgeRange, string> = {
  child: 'Child',
  teen: 'Teen',
  '20s': '20s',
  '30s': '30s',
  '40s': '40s',
  '50s': '50s',
  '60s+': '60s+',
};

export const BUILD_LABELS: Record<TalentBuild, string> = {
  slim: 'Slim',
  athletic: 'Athletic',
  average: 'Average',
  stocky: 'Stocky',
  curvy: 'Curvy',
  'plus-size': 'Plus-size',
};

export const HEIGHT_LABELS: Record<TalentHeight, string> = {
  short: 'Short',
  average: 'Average',
  tall: 'Tall',
};

export const STYLE_LABELS: Record<TalentStyle, string> = {
  realistic: 'Realistic',
  anime: 'Anime',
  cartoon: 'Cartoon',
  '3d-cgi': '3D / CGI',
  stylized: 'Stylized',
};

export const GENRE_LABELS: Record<TalentGenre, string> = {
  action: 'Action',
  drama: 'Drama',
  comedy: 'Comedy',
  'sci-fi': 'Sci-Fi',
  thriller: 'Thriller',
  romance: 'Romance',
  horror: 'Horror',
  political: 'Political',
  indie: 'Indie',
};

// ── Filter config (used by roster UI) ────────────────────────────────

export const FILTER_GROUPS = [
  {
    key: 'sex' as const,
    label: 'Sex',
    options: Object.entries(SEX_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    key: 'ethnicities' as const,
    label: 'Ethnicity',
    options: Object.entries(ETHNICITY_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    key: 'ageRange' as const,
    label: 'Age Range',
    options: Object.entries(AGE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    key: 'build' as const,
    label: 'Build',
    options: Object.entries(BUILD_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    key: 'height' as const,
    label: 'Height',
    options: Object.entries(HEIGHT_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    key: 'style' as const,
    label: 'Style',
    options: Object.entries(STYLE_LABELS).map(([value, label]) => ({ value, label })),
  },
] as const;

export type FilterKey = typeof FILTER_GROUPS[number]['key'];
export type ActiveFilters = Partial<Record<FilterKey, string[]>>;

// ── Filtering logic ───────────────────────────────────────────────────

export function filterTalent(talents: Talent[], filters: ActiveFilters): Talent[] {
  return talents.filter((t) => {
    for (const [key, selected] of Object.entries(filters) as [FilterKey, string[]][]) {
      if (!selected || selected.length === 0) continue;
      const val = t[key];
      if (Array.isArray(val)) {
        if (!selected.some((s) => val.includes(s as never))) return false;
      } else {
        if (!selected.includes(val as string)) return false;
      }
    }
    return true;
  });
}

// ── Talent data ───────────────────────────────────────────────────────

export const talents: Talent[] = [
  {
    id: 1,
    name: "Elara Voss",
    slug: "elara-voss",
    vibe: "Cool-headed corporate exec with a hidden edge. Sharp suits, sharper wit.",
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
    roles: ['lead'],
    sex: 'female',
    ethnicities: ['white'],
    ageRange: '30s',
    build: 'slim',
    height: 'tall',
    style: 'realistic',
    genres: ['drama', 'thriller', 'political'],
    languages: ['EN', 'FR'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 2,
    name: "Marco Drev",
    slug: "marco-drev",
    vibe: "Rugged field operative. Weathered, world-weary, and completely reliable.",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
    roles: ['hero'],
    sex: 'male',
    ethnicities: ['white'],
    ageRange: '40s',
    build: 'athletic',
    height: 'tall',
    style: 'realistic',
    genres: ['action', 'thriller'],
    languages: ['EN', 'ES'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 3,
    name: "Nova Sinclair",
    slug: "nova-sinclair",
    vibe: "Gen-Z hacker with an aesthetic. Neon-lit rooms, effortless confidence.",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    roles: ['supporting'],
    sex: 'female',
    ethnicities: ['white', 'mixed'],
    ageRange: '20s',
    build: 'slim',
    height: 'average',
    style: 'realistic',
    genres: ['sci-fi', 'thriller', 'action'],
    languages: ['EN', 'JA'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 4,
    name: "Viktor Hale",
    slug: "viktor-hale",
    vibe: "The one you don't see coming. Charming surface, calculated interior.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    roles: ['villain'],
    sex: 'male',
    ethnicities: ['white'],
    ageRange: '40s',
    build: 'average',
    height: 'tall',
    style: 'realistic',
    genres: ['drama', 'thriller', 'political'],
    languages: ['EN', 'DE'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 5,
    name: "Sera Moss",
    slug: "sera-moss",
    vibe: "Small-town idealist turned big-city disruptor. Raw, relatable, magnetic.",
    img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80",
    roles: ['lead'],
    sex: 'female',
    ethnicities: ['black', 'mixed'],
    ageRange: '20s',
    build: 'average',
    height: 'average',
    style: 'realistic',
    genres: ['drama', 'indie', 'romance'],
    languages: ['EN'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 6,
    name: "Cain Rhoades",
    slug: "cain-rhoades",
    vibe: "Ex-military turned morally grey antihero. Stoic, scarred, survivalist.",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
    roles: ['villain', 'lead'],
    sex: 'male',
    ethnicities: ['white'],
    ageRange: '30s',
    build: 'athletic',
    height: 'tall',
    style: 'realistic',
    genres: ['action', 'thriller', 'drama'],
    languages: ['EN', 'RU'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 7,
    name: "Lyra Chen",
    slug: "lyra-chen",
    vibe: "Brilliant scientist who skipped social cues entirely. Awkward genius energy.",
    img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80",
    roles: ['supporting'],
    sex: 'female',
    ethnicities: ['east-asian'],
    ageRange: '30s',
    build: 'slim',
    height: 'short',
    style: 'realistic',
    genres: ['sci-fi', 'comedy', 'drama'],
    languages: ['EN', 'ZH'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 8,
    name: "Axel Dunn",
    slug: "axel-dunn",
    vibe: "Silver-tongued politician with something to hide. Power suit, perfect teeth.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80",
    roles: ['villain'],
    sex: 'male',
    ethnicities: ['white'],
    ageRange: '50s',
    build: 'average',
    height: 'average',
    style: 'realistic',
    genres: ['political', 'thriller', 'drama'],
    languages: ['EN', 'FR'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 9,
    name: "Zara Nile",
    slug: "zara-nile",
    vibe: "Fearless investigative journalist. Sees through everyone. No filter.",
    img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80",
    roles: ['hero', 'lead'],
    sex: 'female',
    ethnicities: ['black'],
    ageRange: '30s',
    build: 'athletic',
    height: 'tall',
    style: 'realistic',
    genres: ['drama', 'thriller', 'political'],
    languages: ['EN', 'AR'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 10,
    name: "Jasper Reid",
    slug: "jasper-reid",
    vibe: "Charming everyman navigating extraordinary circumstances. You root for him.",
    img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80",
    roles: ['lead'],
    sex: 'male',
    ethnicities: ['white'],
    ageRange: '20s',
    build: 'average',
    height: 'average',
    style: 'realistic',
    genres: ['romance', 'drama', 'comedy'],
    languages: ['EN'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 11,
    name: "Mira Sol",
    slug: "mira-sol",
    vibe: "Free-spirited wanderer with depth. Warm, artistic, quietly wise.",
    img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
    roles: ['supporting'],
    sex: 'female',
    ethnicities: ['latino'],
    ageRange: '20s',
    build: 'slim',
    height: 'average',
    style: 'realistic',
    genres: ['romance', 'indie', 'drama'],
    languages: ['EN', 'PT'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
  {
    id: 12,
    name: "Omar Steele",
    slug: "omar-steele",
    vibe: "Legendary mentor figure. Every word lands. Every scene, he owns.",
    img: "https://images.unsplash.com/photo-1542178243-bc20204b769f?w=600&q=80",
    roles: ['lead', 'narrator'],
    sex: 'male',
    ethnicities: ['black'],
    ageRange: '60s+',
    build: 'stocky',
    height: 'tall',
    style: 'realistic',
    genres: ['drama', 'action', 'thriller'],
    languages: ['EN'],
    prices: [
      { name: "Single Project", price: "$50", amount: 50 },
      { name: "Studio License", price: "$250", amount: 250 },
      { name: "Exclusive Rights", price: "$1000", amount: 1000 },
    ],
  },
];
