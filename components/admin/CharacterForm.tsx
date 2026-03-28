'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, X, FileText, Plus } from 'lucide-react';
import {
  Talent, TalentSex, TalentRace, TalentAgeRange,
  TalentBuild, TalentHeight, TalentStyle,
  SEX_LABELS, RACE_LABELS, AGE_LABELS,
  BUILD_LABELS, HEIGHT_LABELS, STYLE_LABELS,
} from '@/lib/talent';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleTag } from '@/components/ui/toggle-tag';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  character: Talent | null;
  onClose: () => void;
  onSave: (data: Omit<Talent, 'id'> & { id?: number }, opts?: { autoSave?: boolean }) => Promise<Talent>;
}

const blank = (): Omit<Talent, 'id'> => ({
  name: '', slug: '', vibe: '', img: '',
  gallery: [],
  referenceSheetUrl: '',
  sex: 'female', race: [], ethnicity: '', age: undefined, ageRange: '30s',
  build: 'average', height: 'average', style: 'realistic',
  prices: [
    { name: 'Single Project', price: '$50', amount: 50 },
    { name: 'Studio License', price: '$250', amount: 250 },
    { name: 'Exclusive Rights', price: '$1000', amount: 1000 },
  ],
  exclusiveDisabled: false,
});

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const SEX_SLUG: Record<string, string> = {
  male: 'man', female: 'woman', nonbinary: 'nonbinary',
};

function toCharacterSlug(name: string, sex: string, race: string[]): string {
  const raceSlug = (race[0] ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const gender = SEX_SLUG[sex] ?? sex;
  const namePart = toSlug(name);
  return [raceSlug, gender, namePart].filter(Boolean).join('-');
}

// ─── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 space-y-4 border-b border-gray-100">
      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{title}</p>
      {children}
    </div>
  );
}

// ─── Field wrapper ───────────────────────────────────────────────────────────
function Field({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="ml-1.5 font-normal normal-case tracking-normal text-gray-400 text-[11px]">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}


// ─── Price input ────────────────────────────────────────────────────────────
function PriceField({ label, value, onChange }: { label: string; value: string; onChange: (price: string, amount: number) => void }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
      <div className="flex-1">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-bold text-sm">$</span>
          <Input
            type="number"
            min={0}
            value={value.replace(/\D/g, '')}
            onChange={(e) => {
              const n = parseInt(e.target.value) || 0;
              onChange(`$${n}`, n);
            }}
            className="w-28 text-base font-black h-9"
            placeholder="299"
          />
          <span className="text-xs text-gray-400">USD · one-time</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function CharacterForm({ open, character, onClose, onSave }: Props) {
  const [form, setForm] = useState<Omit<Talent, 'id'> & { id?: number }>(blank());
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingSheet, setUploadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [generating, setGenerating] = useState<'profile' | 'refsheet' | 'both' | null>(null);
  const [describingMode, setDescribingMode] = useState<'generate' | 'improve' | null>(null);
  const [genError, setGenError] = useState('');
  const [describeError, setDescribeError] = useState('');
  const [lastCosts, setLastCosts] = useState<{ profile?: number; refsheet?: number; total?: number } | null>(null);
  const [showImgHistory, setShowImgHistory] = useState(false);
  const [showRefHistory, setShowRefHistory] = useState(false);
  const [sessionClaudeCost, setSessionClaudeCost] = useState(0);
  const [autoSaved, setAutoSaved] = useState(false);
  const [genProgress, setGenProgress] = useState(0); // 0-100
  const [genTiming, setGenTiming] = useState<{ profile: number; refsheet: number }>({ profile: 20000, refsheet: 35000 });
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLInputElement>(null);

  // Snapshot used to detect dirty state
  const [snapshot, setSnapshot] = useState('');

  useEffect(() => {
    const initial = character ?? blank();
    setForm(initial);
    setSnapshot(JSON.stringify(initial));
    setAiDescription('');
    setLastCosts(null);
    setSessionClaudeCost(0);
    setGenError('');
    setDescribeError('');
    setAutoSaved(false);
  }, [character, open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Fetch generation timing, cached in localStorage for 7 days
  useEffect(() => {
    const CACHE_KEY = 'cast_gen_timing';
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, cachedAt } = JSON.parse(cached);
        if (Date.now() - cachedAt < WEEK_MS) {
          setGenTiming(data);
          return;
        }
      }
    } catch {}
    fetch('/api/admin/generation-timing')
      .then((r) => r.json())
      .then((data) => {
        setGenTiming({ profile: data.profile, refsheet: data.refsheet });
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: { profile: data.profile, refsheet: data.refsheet }, cachedAt: Date.now() }));
        } catch {}
      })
      .catch(() => {});
  }, []);

  const isDirty = useMemo(() => JSON.stringify(form) !== snapshot, [form, snapshot]);

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleArr = <T extends string>(key: keyof typeof form, val: T) => {
    const arr = (form[key] as T[]) ?? [];
    const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
    set(key as keyof typeof form, next as (typeof form)[typeof key]);
  };

  const uploadFile = async (file: File, type: string): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (slug) {
      fd.append('slug', slug);
      fd.append('type', type);
    }
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const { url } = await res.json();
    return url;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, 'profile');
    set('img', url);
    setUploading(false);
    e.target.value = '';
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    const urls = await Promise.all(files.map((f, i) => uploadFile(f, `gallery-${(form.gallery?.length ?? 0) + i + 1}`)));
    set('gallery', [...(form.gallery ?? []), ...urls]);
    setUploadingGallery(false);
    e.target.value = '';
  };

  const removeGalleryImage = (idx: number) => {
    const next = [...(form.gallery ?? [])];
    next.splice(idx, 1);
    set('gallery', next);
  };

  const handleSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSheet(true);
    const url = await uploadFile(file, 'reference-sheet');
    set('referenceSheetUrl', url);
    setUploadingSheet(false);
    e.target.value = '';
  };

  const handleDescribe = async (mode: 'generate' | 'improve') => {
    setDescribingMode(mode);
    setDescribeError('');
    try {
      const res = await fetch('/api/admin/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? 'Description generation failed';
        throw new Error(
          msg.includes('credit balance is too low')
            ? 'Anthropic credits exhausted — top up at console.anthropic.com → Plans & Billing'
            : msg
        );
      }
      if (data.description) setAiDescription(data.description);
      if (data.claudeCost) setSessionClaudeCost((prev) => prev + data.claudeCost);

      // Batch all attribute + name + slug updates together to avoid stale state
      setForm((prev) => {
        const a = data.attributes ?? {};
        const newSex = a.sex ?? prev.sex;
        const newRace = Array.isArray(a.race) && a.race.length > 0
          ? a.race : prev.race;
        const newName = data.name || prev.name;
        const newSlug = !character
          ? toCharacterSlug(newName, newSex, newRace)
          : prev.slug;
        return {
          ...prev,
          ...(data.name ? { name: newName } : {}),
          ...(newSlug !== prev.slug ? { slug: newSlug } : {}),
          ...(a.sex ? { sex: newSex } : {}),
          ...(a.race ? { race: newRace } : {}),
          ...(a.ethnicity ? { ethnicity: a.ethnicity } : {}),
          ...(a.age ? { age: a.age } : {}),
          ...(a.ageRange ? { ageRange: a.ageRange } : {}),
          ...(a.build ? { build: a.build } : {}),
          ...(a.height ? { height: a.height } : {}),
          ...(a.style ? { style: a.style } : {}),
        };
      });
    } catch (err) {
      setDescribeError(err instanceof Error ? err.message : 'Description generation failed');
    }
    setDescribingMode(null);
  };

  const handleGenerate = async (mode: 'profile' | 'refsheet' | 'both') => {
    const description = aiDescription.trim() || form.vibe;
    if (!description) return;
    setGenerating(mode);
    setGenError('');
    setLastCosts(null);
    setGenProgress(0);

    // Animate progress bar to 90% over estimated duration
    const estimatedMs = mode === 'profile' ? genTiming.profile
      : mode === 'refsheet' ? genTiming.refsheet
      : genTiming.profile + genTiming.refsheet;
    const intervalMs = 200;
    const increment = (90 / (estimatedMs / intervalMs));
    genTimerRef.current = setInterval(() => {
      setGenProgress((p) => Math.min(p + increment, 90));
    }, intervalMs);

    const slug = form.slug || toSlug(description.split(' ').slice(0, 3).join(' '));
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          slug,
          mode,
          characterId: form.id,
          characterName: form.name || aiDescription.split(' ').slice(0, 3).join(' '),
          claudeCost: sessionClaudeCost,
          profileImageUrl: form.img || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');

      // Build updated form with generated images, preserving history of old ones
      const autoName = form.name || 'Unnamed Character';
      const autoSlug = form.slug || slug;
      const autoVibe = form.vibe || aiDescription;

      const updatedForm = {
        ...form,
        slug: autoSlug,
        name: autoName,
        vibe: autoVibe,
        ...(data.profileUrl ? {
          img: data.profileUrl,
          imgHistory: form.img ? [...(form.imgHistory ?? []), form.img] : (form.imgHistory ?? []),
        } : {}),
        ...(data.refSheetUrl ? {
          referenceSheetUrl: data.refSheetUrl,
          referenceSheetHistory: form.referenceSheetUrl
            ? [...(form.referenceSheetHistory ?? []), form.referenceSheetUrl]
            : (form.referenceSheetHistory ?? []),
        } : {}),
      };

      setForm(updatedForm);
      if (data.costs) setLastCosts(data.costs);

      // Auto-save — stays open for review
      const saved = await onSave(updatedForm, { autoSave: true });
      // Update form with saved ID so future saves are PUTs
      if (saved?.id && !updatedForm.id) {
        setForm((prev) => ({ ...prev, id: saved.id }));
      }
      setAutoSaved(true);
      setSnapshot(JSON.stringify({ ...updatedForm, id: saved?.id ?? updatedForm.id }));
      setTimeout(() => setAutoSaved(false), 3000);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    }
    if (genTimerRef.current) clearInterval(genTimerRef.current);
    setGenProgress(100);
    setTimeout(() => setGenProgress(0), 800);
    setGenerating(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty && character) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };
  // Manual save closes the form (onSave without autoSave flag calls closeForm in DashboardClient)

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="w-full max-w-[520px] bg-white h-full flex flex-col shadow-2xl">

        {/* ── Header ────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {character ? `Editing: ${character.name}` : 'Add New Character'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {autoSaved ? (
                <span className="text-emerald-500 font-medium">✓ Auto-saved</span>
              ) : isDirty ? (
                <span className="text-amber-500 font-medium">● Unsaved changes</span>
              ) : (
                'All fields marked * are required'
              )}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">

          {/* AI GENERATION */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-white space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">✦ AI Generate</p>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Describe the character… e.g. 'a 30s East Asian female corporate executive, slim build, sharp features, tailored blazer'"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-400"
              />
              {describingMode && (
                <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                  <span className="text-xs font-semibold text-indigo-500 animate-pulse">
                    {describingMode === 'generate' ? 'Generating description…' : 'Improving description…'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                disabled={!!describingMode || !!generating}
                onClick={() => handleDescribe('generate')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-40 transition-colors"
              >
                {describingMode === 'generate' ? <span className="animate-spin">⟳</span> : '✦'}
                Generate Description
              </button>
              <button
                type="button"
                disabled={!aiDescription.trim() || !!describingMode || !!generating}
                onClick={() => handleDescribe('improve')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-40 transition-colors"
              >
                {describingMode === 'improve' ? <span className="animate-spin">⟳</span> : '✨'}
                Improve
              </button>
            </div>
            {describeError && <p className="text-xs text-red-500">{describeError}</p>}
            <div className="border-t border-indigo-100 pt-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">Generate Images</p>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                disabled={!aiDescription.trim() || !!generating || !!describingMode}
                onClick={() => handleGenerate('profile')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
              >
                {generating === 'profile' ? <span className="animate-spin">⟳</span> : '🖼'}
                {generating === 'profile' ? 'Generating…' : form.img ? 'Regenerate Profile' : 'Profile Image'}
              </button>
              <button
                type="button"
                disabled={!form.img || !aiDescription.trim() || !!generating || !!describingMode}
                onClick={() => handleGenerate('refsheet')}
                title={!form.img ? 'Generate a profile photo first' : undefined}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
              >
                {generating === 'refsheet' ? <span className="animate-spin">⟳</span> : '📋'}
                {generating === 'refsheet' ? 'Generating…' : form.referenceSheetUrl ? 'Regenerate Ref Sheet' : 'Reference Sheet'}
              </button>
              <button
                type="button"
                disabled={!aiDescription.trim() || !!generating || !!describingMode}
                onClick={() => handleGenerate('both')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 transition-colors"
              >
                {generating === 'both' ? <span className="animate-spin">⟳</span> : '⚡'}
                {generating === 'both' ? 'Generating…' : (form.img || form.referenceSheetUrl) ? 'Regenerate Both' : 'Generate Both'}
              </button>
            </div>
            {!form.img && !generating && (
              <p className="text-[10px] text-amber-500 font-medium">Generate a profile photo first — the reference sheet uses it for character consistency.</p>
            )}
            {generating && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-indigo-400 font-semibold mb-1">
                  <span>Generating…</span>
                  <span>{Math.round(genProgress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-200 ease-linear"
                    style={{ width: `${genProgress}%` }}
                  />
                </div>
              </div>
            )}
            {genError && <p className="text-xs text-red-500 mt-2">{genError}</p>}
            {(lastCosts || sessionClaudeCost > 0) && (
              <div className="flex flex-wrap gap-2 mt-1">
                {sessionClaudeCost > 0 && (
                  <span className="text-[11px] font-semibold bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-full">
                    Claude · ${sessionClaudeCost.toFixed(4)}
                  </span>
                )}
                {lastCosts?.profile != null && (
                  <span className="text-[11px] font-semibold bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-full">
                    Profile · ${lastCosts.profile.toFixed(2)}
                  </span>
                )}
                {lastCosts?.refsheet != null && (
                  <span className="text-[11px] font-semibold bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-full">
                    Ref Sheet · ${lastCosts.refsheet.toFixed(2)}
                  </span>
                )}
                {lastCosts?.total != null && (
                  <span className="text-[11px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full">
                    Total · ${(lastCosts.total + sessionClaudeCost).toFixed(4)}
                  </span>
                )}
              </div>
            )}
            </div>
          </div>

          {/* IMAGE */}
          <Section title="Character Image">
            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                'relative w-full rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed transition-colors group bg-gray-50',
                'hover:border-indigo-400',
                form.img ? 'border-gray-200' : 'border-gray-300'
              )}
              style={{ aspectRatio: '3/4' }}
            >
              {form.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.img} alt="Preview" className="w-full h-full object-contain" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors gap-2">
                  <Upload size={28} strokeWidth={1.5} />
                  <div className="text-sm font-medium">Click to upload image</div>
                  <div className="text-xs text-gray-400">JPG, PNG, WebP</div>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-sm font-semibold text-indigo-500 animate-pulse">Uploading...</div>
                </div>
              )}
              {form.img && !uploading && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-bold transition-opacity bg-black/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Upload size={14} /> Change Image
                  </span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            {form.img && (
              <button
                type="button"
                disabled={!!generating || !!describingMode}
                onClick={() => handleGenerate('profile')}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
              >
                {generating === 'profile' ? <span className="animate-spin">⟳</span> : '🖼'}
                {generating === 'profile' ? 'Regenerating…' : 'Regenerate Profile Photo'}
              </button>
            )}
            <Field label="Or paste an image URL">
              <Input
                type="text"
                value={form.img}
                onChange={(e) => set('img', e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </Field>
            {(form.imgHistory ?? []).length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowImgHistory((v) => !v)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showImgHistory ? '▲ Hide' : '▼ Show'} {form.imgHistory!.length} previous version{form.imgHistory!.length > 1 ? 's' : ''}
                </button>
                {showImgHistory && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {[...form.imgHistory!].reverse().map((url, i) => (
                      <div key={i} className="relative flex-shrink-0 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Version ${form.imgHistory!.length - i}`} className="w-16 h-20 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={async () => {
                            const current = form.img;
                            const history = [...form.imgHistory!];
                            const restoredIdx = history.length - 1 - i;
                            history.splice(restoredIdx, 1);
                            const updated = { ...form, img: url, imgHistory: current ? [...history, current] : history };
                            setForm(updated);
                            await onSave(updated, { autoSave: true });
                          }}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* GALLERY */}
          <Section title="Gallery / Additional Looks">
            <div className="grid grid-cols-3 gap-2">
              {(form.gallery ?? []).map((url, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden group" style={{ aspectRatio: '1/1' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Look ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={uploadingGallery}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer"
                style={{ aspectRatio: '1/1' }}
              >
                {uploadingGallery ? (
                  <span className="text-xs font-semibold text-indigo-400 animate-pulse">Uploading...</span>
                ) : (
                  <>
                    <Plus size={20} strokeWidth={1.5} />
                    <span className="text-xs mt-1 font-medium">Add Look</span>
                  </>
                )}
              </button>
            </div>
            <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
            <p className="text-xs text-gray-400">Upload multiple photos of the character — different outfits, angles, or expressions.</p>
          </Section>

          {/* REFERENCE SHEET */}
          <Section title="Reference Sheet">
            {form.referenceSheetUrl ? (
              <>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">Reference sheet uploaded</p>
                    <p className="text-xs text-gray-400 truncate">{form.referenceSheetUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('referenceSheetUrl', '')}
                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Preview */}
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 py-2 border-b border-gray-200">
                    Preview — what the client receives
                  </p>
                  {/\.pdf(\?|$)/i.test(form.referenceSheetUrl) ? (
                    <iframe
                      src={form.referenceSheetUrl}
                      className="w-full"
                      style={{ height: '480px' }}
                      title="Reference sheet preview"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.referenceSheetUrl}
                      alt="Reference sheet preview"
                      className="w-full object-contain max-h-[480px]"
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!form.img || !!generating || !!describingMode}
                    onClick={() => handleGenerate('refsheet')}
                    title={!form.img ? 'Generate a profile photo first' : undefined}
                    className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
                  >
                    {generating === 'refsheet' ? <span className="animate-spin">⟳</span> : '📋'}
                    {generating === 'refsheet' ? 'Regenerating…' : 'Regenerate Ref Sheet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => sheetRef.current?.click()}
                    disabled={uploadingSheet}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600 py-2 px-3 transition-colors"
                  >
                    {uploadingSheet ? 'Uploading...' : 'Replace file'}
                  </button>
                </div>
                {(form.referenceSheetHistory ?? []).length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowRefHistory((v) => !v)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showRefHistory ? '▲ Hide' : '▼ Show'} {form.referenceSheetHistory!.length} previous version{form.referenceSheetHistory!.length > 1 ? 's' : ''}
                    </button>
                    {showRefHistory && (
                      <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                        {[...form.referenceSheetHistory!].reverse().map((url, i) => (
                          <div key={i} className="relative flex-shrink-0 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Version ${form.referenceSheetHistory!.length - i}`} className="w-24 h-14 object-cover rounded-lg border border-gray-200" />
                            <button
                              type="button"
                              onClick={async () => {
                                const current = form.referenceSheetUrl;
                                const history = [...form.referenceSheetHistory!];
                                const restoredIdx = history.length - 1 - i;
                                history.splice(restoredIdx, 1);
                                const updated = { ...form, referenceSheetUrl: url, referenceSheetHistory: current ? [...history, current] : history };
                                setForm(updated);
                                await onSave(updated, { autoSave: true });
                              }}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => sheetRef.current?.click()}
                disabled={uploadingSheet}
                className="w-full flex items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 p-5 text-gray-400 hover:text-indigo-500 transition-colors"
              >
                <FileText size={22} strokeWidth={1.5} />
                <div className="text-left">
                  <p className="text-sm font-semibold">
                    {uploadingSheet ? 'Uploading...' : 'Upload Reference Sheet'}
                  </p>
                  <p className="text-xs">PDF or image — will be emailed to customer after purchase</p>
                </div>
              </button>
            )}
            <input ref={sheetRef} type="file" accept="image/*,application/pdf" onChange={handleSheetUpload} className="hidden" />
          </Section>

          {/* IDENTITY */}
          <Section title="Identity">
            <Field label="Character Name" required>
              <Input
                required
                value={form.name}
                onChange={(e) => {
                  set('name', e.target.value);
                  set('slug', toCharacterSlug(e.target.value, form.sex, form.race));
                }}
                placeholder="e.g. Elara Voss"
              />
            </Field>

            <Field label="Slug" required hint="(auto-generated — e.g. white-woman-elara-voss)">
              <Input
                required
                value={form.slug}
                onChange={(e) => set('slug', toSlug(e.target.value))}
                placeholder="elara-voss"
                className="font-mono text-xs"
              />
            </Field>

            <Field label="Description / Vibe" required>
              <Textarea
                required
                value={form.vibe}
                onChange={(e) => set('vibe', e.target.value)}
                placeholder="Describe their personality, look, aesthetic, and energy..."
                rows={4}
              />
              <p className={cn(
                'text-xs mt-1 text-right transition-colors',
                form.vibe.length > 120 ? 'text-amber-500' : 'text-gray-400'
              )}>
                {form.vibe.length} / 120 chars recommended
              </p>
            </Field>
          </Section>

          {/* PHYSICAL ATTRIBUTES */}
          <Section title="Physical Attributes">
            <Field label="Sex" required>
              <RadioGroup
                value={form.sex}
                onValueChange={(val) => set('sex', val as TalentSex)}
                className="flex flex-wrap gap-2 pt-0.5"
              >
                {(Object.entries(SEX_LABELS) as [TalentSex, string][]).map(([val, label]) => (
                  <RadioGroupItem key={val} value={val} label={label} id={`sex-${val}`} />
                ))}
              </RadioGroup>
            </Field>

            <Field label="Race" required hint="(select all that apply)">
              <div className="flex flex-wrap gap-2 pt-0.5">
                {(Object.entries(RACE_LABELS) as [TalentRace, string][]).map(([val, label]) => (
                  <ToggleTag
                    key={val}
                    label={label}
                    selected={form.race.includes(val)}
                    onClick={() => toggleArr('race', val)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Ethnicity" hint="(e.g. Korean, Nigerian, Swedish)">
              <Input
                value={form.ethnicity ?? ''}
                onChange={(e) => set('ethnicity', e.target.value)}
                placeholder="e.g. Korean, Japanese, Nigerian"
              />
            </Field>

            <Field label="Age" hint="(specific age of the character)">
              <Input
                type="number"
                min={1}
                max={100}
                value={form.age ?? ''}
                onChange={(e) => set('age', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g. 28"
                className="w-24"
              />
            </Field>

            <Field label="Age Range" required>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {(Object.entries(AGE_LABELS) as [TalentAgeRange, string][]).map(([val, label]) => (
                  <ToggleTag
                    key={val}
                    label={label}
                    selected={form.ageRange === val}
                    onClick={() => set('ageRange', val)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Build" required>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {(Object.entries(BUILD_LABELS) as [TalentBuild, string][]).map(([val, label]) => (
                  <ToggleTag
                    key={val}
                    label={label}
                    selected={form.build === val}
                    onClick={() => set('build', val)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Height" required>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {(Object.entries(HEIGHT_LABELS) as [TalentHeight, string][]).map(([val, label]) => (
                  <ToggleTag
                    key={val}
                    label={label}
                    selected={form.height === val}
                    onClick={() => set('height', val)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Style" required>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {(Object.entries(STYLE_LABELS) as [TalentStyle, string][]).map(([val, label]) => (
                  <ToggleTag
                    key={val}
                    label={label}
                    selected={form.style === val}
                    onClick={() => set('style', val)}
                  />
                ))}
              </div>
            </Field>

          </Section>

          {/* PRICING */}
          <Section title="Licensing & Pricing">
            <PriceField
              label="Single Project License"
              value={form.prices[0].price}
              onChange={(price, amount) => {
                const prices = [...form.prices];
                prices[0] = { ...prices[0], price, amount };
                set('prices', prices);
              }}
            />
            <PriceField
              label="Studio License"
              value={form.prices[1].price}
              onChange={(price, amount) => {
                const prices = [...form.prices];
                prices[1] = { ...prices[1], price, amount };
                set('prices', prices);
              }}
            />
            <div className={`transition-opacity ${form.exclusiveDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <PriceField
                label="Exclusive Rights"
                value={form.prices[2]?.price ?? '$1000'}
                onChange={(price, amount) => {
                  const prices = [...form.prices];
                  prices[2] = { ...prices[2], price, amount };
                  set('prices', prices);
                }}
              />
            </div>

            <label className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-amber-900">Disable Exclusive Rights</p>
                <p className="text-xs text-amber-700 mt-0.5">Buyers will not see the option to claim this character exclusively. Use this to protect high-value characters.</p>
              </div>
              <input
                type="checkbox"
                checked={!!form.exclusiveDisabled}
                onChange={(e) => set('exclusiveDisabled', e.target.checked)}
                className="w-5 h-5 accent-amber-500 flex-shrink-0 ml-4"
              />
            </label>
          </Section>

          {/* Spacer so sticky footer doesn't cover last field */}
          <div className="h-4" />
        </form>

        {/* ── Sticky footer ─────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-gray-400 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={saving || uploading || (!!character && !isDirty)}
            className={cn(
              'flex-1 font-bold py-2.5 rounded-xl text-sm transition-all',
              isDirty || !character
                ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm shadow-indigo-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {saving ? 'Saving...' : character ? 'Save Changes' : 'Add Character'}
          </button>
        </div>
      </div>
    </div>
  );
}
