'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Talent } from '@/lib/talent';
import CharacterTable from './CharacterTable';
import CharacterForm from './CharacterForm';

interface Props {
  initialCharacters: Talent[];
}

export default function DashboardClient({ initialCharacters }: Props) {
  const router = useRouter();
  const [characters, setCharacters] = useState<Talent[]>(initialCharacters);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Talent | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (t: Talent) => { setEditing(t); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const handleSave = async (data: Omit<Talent, 'id'> & { id?: number }) => {
    if (data.id) {
      const res = await fetch(`/api/characters/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } else {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const created = await res.json();
      setCharacters((prev) => [...prev, created]);
    }
    closeForm();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/characters/${id}`, { method: 'DELETE' });
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    setDeleteId(null);
  };

  const stats = {
    total: characters.length,
    lead: characters.filter((c) => c.roles.includes('lead')).length,
    villain: characters.filter((c) => c.roles.includes('villain')).length,
    hero: characters.filter((c) => c.roles.includes('hero')).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-black">
            Cast<span className="text-indigo-500">.</span>
          </span>
          <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-sm text-gray-500 hover:text-black transition-colors">
            View Site ↗
          </a>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-black">Talent Roster</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your AI characters</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition-colors text-sm"
          >
            <span className="text-lg leading-none">+</span> Add Character
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Characters', value: stats.total, color: 'bg-indigo-50 text-indigo-600' },
            { label: 'Lead Roles', value: stats.lead, color: 'bg-violet-50 text-violet-600' },
            { label: 'Villains', value: stats.villain, color: 'bg-rose-50 text-rose-600' },
            { label: 'Heroes', value: stats.hero, color: 'bg-emerald-50 text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className={`text-3xl font-black mb-1 ${s.color.split(' ')[1]}`}>{s.value}</div>
              <div className="text-xs font-medium text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <CharacterTable
          characters={characters}
          onEdit={openEdit}
          onDelete={(id) => setDeleteId(id)}
        />
      </main>

      {/* Character form panel */}
      <CharacterForm
        open={formOpen}
        character={editing}
        onClose={closeForm}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-black mb-2">Delete character?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-gray-400 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
