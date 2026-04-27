/**
 * Convert prospect markdown tables → CSV for import into Google Sheets /
 * Numbers / Apollo / Clay.
 *
 * Reads every `.md` in `docs/prospects/`, extracts every markdown table,
 * writes one CSV per `.md` (multiple tables in a file are concatenated with
 * a blank line between them).
 *
 * Usage: npx tsx scripts/prospects-md-to-csv.ts
 */

import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'docs', 'prospects');

function csvEscape(cell: string): string {
  // Strip surrounding whitespace + markdown link syntax ([text](url) → text)
  const clean = cell.trim().replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  if (/[",\n]/.test(clean)) {
    return `"${clean.replace(/"/g, '""')}"`;
  }
  return clean;
}

function mdToCsv(md: string): string {
  const lines = md.split('\n');
  const tables: string[][] = [];
  let current: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (!current) current = [];
      current.push(line);
    } else if (current) {
      tables.push(current);
      current = null;
    }
  }
  if (current) tables.push(current);

  return tables
    .map((table) => {
      return table
        .filter((row) => !/^\s*\|[\s\-:|]+\|\s*$/.test(row.trim())) // drop separator rows
        .map((row) => {
          const inner = row.trim().replace(/^\||\|$/g, '');
          const cells = inner.split('|').map(csvEscape);
          return cells.join(',');
        })
        .join('\n');
    })
    .join('\n\n');
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
for (const f of files) {
  const md = fs.readFileSync(path.join(DIR, f), 'utf-8');
  const csv = mdToCsv(md);
  const out = path.join(DIR, f.replace(/\.md$/, '.csv'));
  fs.writeFileSync(out, csv);
  const rows = csv.split('\n').filter((l) => l.trim()).length;
  console.log(`wrote ${out} (${rows} rows)`);
}
