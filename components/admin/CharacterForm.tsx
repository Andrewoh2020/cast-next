'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, X, FileText, Plus } from 'lucide-react';
import {
  Talent, TalentSex, TalentEthnicity, TalentAgeRange,
  TalentBuild, TalentHeight, TalentStyle,
  SEX_LABELS, ETHNICITY_LABELS, AGE_LABELS,
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
  onSave: (data: Omit<Talent, 'id'> & { id?: number }) => Promise<void>;
}

const blank = (): Omit<Talent, 'id'> => ({
  name: '', slug: '', vibe: '', img: '',
  gallery: [],
  referenceSheetUrl: '',
  roles: [], sex: 'female', ethnicities: [], ageRange: '30s',
  build: 'average', height: 'average', style: 'realistic', languages: [], genres: [],
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
  const [genError, setGenError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLInputElement>(null);

  // Snapshot used to detect dirty state
  const [snapshot, setSnapshot] = useState('');

  useEffect(() => {
    const initial = character ?? blank();
    setForm(initial);
    setSnapshot(JSON.stringify(initial));
  }, [character, open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isDirty = useMemo(() => JSON.stringify(form) !== snapshot, [form, snapshot]);

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleArr = <T extends string>(key: keyof typeof form, val: T) => {
    const arr = (form[key] as T[]) ?? [];
    const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
    set(key as keyof typeof form, next as (typeof form)[typeof key]);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const { url } = await res.json();
    return url;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    set('img', url);
    setUploading(false);
    e.target.value = '';
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    const urls = await Promise.all(files.map(uploadFile));
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
    const url = await uploadFile(file);
    set('referenceSheetUrl', url);
    setUploadingSheet(false);
    e.target.value = '';
  };

  const handleGenerate = async (mode: 'profile' | 'refsheet' | 'both') => {
    if (!aiDescription.trim()) return;
    setGenerating(mode);
    setGenError('');
    const slug = form.slug || toSlug(aiDescription.split(' ').slice(0, 3).join(' '));
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiDescription, slug, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      if (data.profileUrl) set('img', data.profileUrl);
      if (data.refSheetUrl) set('referenceSheetUrl', data.refSheetUrl);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    }
    setGenerating(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty && character) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

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
              {isDirty ? (
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
            <textarea
              rows={3}
              placeholder="Describe the character… e.g. 'a 30s East Asian female corporate executive, slim build, sharp features, tailored blazer'"
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-400"
            />
            {genError && <p className="text-xs text-red-500">{genError}</p>}
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                disabled={!aiDescription.trim() || !!generating}
                onClick={() => handleGenerate('profile')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
              >
                {generating === 'profile' ? <span className="animate-spin">⟳</span> : '🖼'}
                Profile Image
              </button>
              <button
                type="button"
                disabled={!aiDescription.trim() || !!generating}
                onClick={() => handleGenerate('refsheet')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
              >
                {generating === 'refsheet' ? <span className="animate-spin">⟳</span> : '📋'}
                Reference Sheet
              </button>
              <button
                type="button"
                disabled={!aiDescription.trim() || !!generating}
                onClick={() => handleGenerate('both')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 transition-colors"
              >
                {generating === 'both' ? <span className="animate-spin">⟳</span> : '⚡'}
                {generating === 'both' ? 'Generating…' : 'Generate Both'}
              </button>
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
              style={{ aspectRatio: '3/2' }}
            >
              {form.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.img} alt="Preview" className="w-full h-full object-cover" />
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
            <Field label="Or paste an image URL">
              <Input
                type="text"
                value={form.img}
                onChange={(e) => set('img', e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </Field>
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

                <button
                  type="button"
                  onClick={() => sheetRef.current?.click()}
                  disabled={uploadingSheet}
                  className="w-full text-xs font-semibold text-indigo-500 hover:text-indigo-700 py-2 transition-colors"
                >
                  {uploadingSheet ? 'Uploading...' : 'Replace file'}
                </button>
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
                  if (!character) set('slug', toSlug(e.target.value));
                }}
                placeholder="e.g. Elara Voss"
              />
            </Field>

            <Field label="Slug" required hint="(auto-generated, URL-safe path — e.g. elara-voss)">
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

            <Field label="Ethnicity" required hint="(select all that apply)">
              <div className="flex flex-wrap gap-2 pt-0.5">
                {(Object.entries(ETHNICITY_LABELS) as [TalentEthnicity, string][]).map(([val, label]) => (
                  <ToggleTag
                    key={val}
                    label={label}
                    selected={form.ethnicities.includes(val)}
                    onClick={() => toggleArr('ethnicities', val)}
                  />
                ))}
              </div>
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
