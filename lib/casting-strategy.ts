import { Talent, TalentSex, TalentRace, TalentAgeRange, TalentBuild, TalentStyle } from './talent';
import fs from 'fs';
import path from 'path';

// ── Types ────────────────────────────────────────────────────────────────

export interface CastingStrategy {
  dailyTarget: number;
  style: Record<string, number>;
  sex: Record<string, number>;
  race: Record<string, number>;
  ageRange: Record<string, number>;
  build: Record<string, number>;
  archetypes: string[];
  hiddenByDefault: boolean;
}

export interface DemographicSlot {
  sex: TalentSex;
  race: TalentRace;
  ageRange: TalentAgeRange;
  build: TalentBuild;
  style: TalentStyle;
  archetype: string;
}

// ── Load strategy ────────────────────────────────────────────────────────

export function loadStrategy(): CastingStrategy {
  const filePath = path.join(process.cwd(), 'data', 'casting-strategy.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as CastingStrategy;
}

// ── Gap analysis ─────────────────────────────────────────────────────────

/**
 * Count how many visible characters have each value for a given dimension.
 * Returns a map of value → proportion (0-1).
 */
function currentDistribution<T extends string>(
  characters: Talent[],
  accessor: (c: Talent) => T | T[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const c of characters) {
    const val = accessor(c);
    const values = Array.isArray(val) ? val : [val];
    for (const v of values) {
      counts[v] = (counts[v] || 0) + 1;
      total++;
    }
  }

  const dist: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    dist[k] = total > 0 ? v / total : 0;
  }
  return dist;
}

/**
 * Pick a value from a target distribution, biased toward underrepresented values.
 * Uses weighted random sampling where the weight = max(0, target - actual) + small epsilon.
 */
function pickWeighted<T extends string>(
  targetDist: Record<string, number>,
  actualDist: Record<string, number>,
): T {
  const entries = Object.entries(targetDist);
  const epsilon = 0.01; // small floor so no category has zero chance

  const weights = entries.map(([value, target]) => {
    const actual = actualDist[value] || 0;
    const deficit = Math.max(0, target - actual) + epsilon;
    return { value, weight: deficit };
  });

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const { value, weight } of weights) {
    roll -= weight;
    if (roll <= 0) return value as T;
  }

  return weights[weights.length - 1].value as T;
}

/**
 * Analyze the current roster against the casting strategy and return
 * a list of demographic slots to fill, prioritizing underrepresented categories.
 */
export function analyzeRosterGaps(
  characters: Talent[],
  strategy: CastingStrategy,
  count?: number,
): DemographicSlot[] {
  const visible = characters.filter((c) => !c.hidden);
  const n = count ?? strategy.dailyTarget;

  const sexDist = currentDistribution(visible, (c) => c.sex);
  const raceDist = currentDistribution(visible, (c) => c.race);
  const ageDist = currentDistribution(visible, (c) => c.ageRange);
  const buildDist = currentDistribution(visible, (c) => c.build);
  const styleDist = currentDistribution(visible, (c) => c.style);

  const slots: DemographicSlot[] = [];
  const archetypes = [...strategy.archetypes];
  let archetypeIdx = Math.floor(Math.random() * archetypes.length);

  for (let i = 0; i < n; i++) {
    const sex = pickWeighted<TalentSex>(strategy.sex, sexDist);
    let build = pickWeighted<TalentBuild>(strategy.build, buildDist);

    // Gender-appropriate build: 'curvy' and 'plus-size' are typically female-presenting
    if (sex === 'male' && (build === 'curvy')) {
      build = 'stocky';
    }

    const slot: DemographicSlot = {
      sex,
      race: pickWeighted<TalentRace>(strategy.race, raceDist),
      ageRange: pickWeighted<TalentAgeRange>(strategy.ageRange, ageDist),
      build,
      style: pickWeighted<TalentStyle>(strategy.style, styleDist),
      archetype: archetypes[archetypeIdx % archetypes.length],
    };

    slots.push(slot);
    archetypeIdx++;
  }

  return slots;
}

// ── Duplicate detection ──────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

export function isDuplicate(
  name: string,
  slug: string,
  existingCharacters: Talent[],
): boolean {
  const nameLower = name.toLowerCase().trim();
  const slugLower = slug.toLowerCase().trim();

  for (const c of existingCharacters) {
    // Exact slug match
    if (c.slug.toLowerCase() === slugLower) return true;

    // Exact name match
    if (c.name.toLowerCase() === nameLower) return true;

    // Fuzzy name similarity
    if (levenshtein(c.name.toLowerCase(), nameLower) < 3) return true;
  }

  return false;
}

// ── Roster stats ─────────────────────────────────────────────────────────

export interface RosterStats {
  total: number;
  visible: number;
  hidden: number;
  autoGenerated: number;
  sex: Record<string, number>;
  race: Record<string, number>;
  ageRange: Record<string, number>;
}

export function computeRosterStats(characters: Talent[]): RosterStats {
  const visible = characters.filter((c) => !c.hidden);
  const sexCounts: Record<string, number> = {};
  const raceCounts: Record<string, number> = {};
  const ageCounts: Record<string, number> = {};

  for (const c of visible) {
    sexCounts[c.sex] = (sexCounts[c.sex] || 0) + 1;
    for (const r of c.race) {
      raceCounts[r] = (raceCounts[r] || 0) + 1;
    }
    ageCounts[c.ageRange] = (ageCounts[c.ageRange] || 0) + 1;
  }

  return {
    total: characters.length,
    visible: visible.length,
    hidden: characters.length - visible.length,
    autoGenerated: characters.filter((c) => (c as Talent & { autoGenerated?: boolean }).autoGenerated).length,
    sex: sexCounts,
    race: raceCounts,
    ageRange: ageCounts,
  };
}
