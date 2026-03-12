import fs from 'fs';
import path from 'path';
import { Talent } from './talent';

const DATA_FILE = path.join(process.cwd(), 'data', 'characters.json');

export function readCharacters(): Talent[] {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as Talent[];
}

export function writeCharacters(characters: Talent[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(characters, null, 2), 'utf-8');
}

export function nextId(characters: Talent[]): number {
  return characters.length > 0 ? Math.max(...characters.map((c) => c.id)) + 1 : 1;
}
