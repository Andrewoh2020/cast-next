import { readCharacters } from '@/lib/characters.server';
import DashboardClient from '@/components/admin/DashboardClient';

export default function DashboardPage() {
  const characters = readCharacters();
  return <DashboardClient initialCharacters={characters} />;
}
