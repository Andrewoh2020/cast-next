'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { CustomCharacterDraft, CustomCharacterAttributes } from '@/lib/custom-characters.server';
import { RACE_LABELS, AGE_LABELS, BUILD_LABELS, HEIGHT_LABELS, STYLE_LABELS, TalentRace, TalentAgeRange, TalentBuild, TalentHeight, TalentStyle } from '@/lib/talent';

const sexOptions: ('male' | 'female')[] = ['male', 'female'];
const raceOptions = Object.keys(RACE_LABELS) as TalentRace[];
const ageOptions = Object.keys(AGE_LABELS) as TalentAgeRange[];
const buildOptions = Object.keys(BUILD_LABELS) as TalentBuild[];
const heightOptions = Object.keys(HEIGHT_LABELS) as TalentHeight[];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAttributes(): CustomCharacterAttributes {
  return {
    sex: randomFrom(sexOptions),
    race: [randomFrom(raceOptions)],
    ageRange: randomFrom(ageOptions),
    build: randomFrom(buildOptions),
    height: randomFrom(heightOptions),
    style: 'realistic',
  };
}

interface Props {
  draft: CustomCharacterDraft | null;
  onComplete: (draft: CustomCharacterDraft) => void;
  initialPrompt?: string;
  initialName?: string;
  autoSubmit?: boolean;
}

export default function DescribeStep({ draft, onComplete, initialPrompt, initialName, autoSubmit }: Props) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [description, setDescription] = useState(draft?.description ?? initialPrompt ?? '');
  const [name, setName] = useState(draft?.name ?? initialName ?? '');
  const [attributes, setAttributes] = useState<CustomCharacterAttributes>(
    draft?.attributes ?? randomAttributes
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ description?: string; name?: string }>({});
  const [aiGenerated, setAiGenerated] = useState(false); // tracks if AI set the description
  const draftIdRef = useRef(draft?.id ?? null);
  const autoSubmittedRef = useRef(false);

  // Auto-submit after signup return (autogen=1 in URL)
  useEffect(() => {
    if (autoSubmit && !autoSubmittedRef.current && isSignedIn && description.trim()) {
      autoSubmittedRef.current = true;
      handleContinue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmit, isSignedIn]);

  const autoSaveDraft = async (draftName: string, draftDesc: string, draftAttrs: CustomCharacterAttributes) => {
    const slug = draftName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const body = { name: draftName, slug, description: draftDesc, attributes: draftAttrs };
    try {
      if (draftIdRef.current) {
        await fetch(`/api/create/drafts/${draftIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        const res = await fetch('/api/create/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const saved = await res.json();
          draftIdRef.current = saved.id;
        }
      }
    } catch {}
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/create/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), attributes, mode: 'generate' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setName(data.name);
      setDescription(data.description);
      setAiGenerated(true);
      setErrors({});
      const newAttrs = data.attributes ? {
        sex: data.attributes.sex ?? 'female',
        race: data.attributes.race ?? [],
        ethnicity: data.attributes.ethnicity,
        age: data.attributes.age,
        ageRange: data.attributes.ageRange ?? '20s',
        build: data.attributes.build ?? 'average',
        height: data.attributes.height ?? 'average',
        style: data.attributes.style ?? 'realistic',
      } : undefined;
      if (newAttrs) setAttributes(newAttrs);

      // Auto-save draft so description persists across refreshes
      await autoSaveDraft(data.name, data.description, newAttrs ?? attributes);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate description');
    } finally {
      setGenerating(false);
    }
  };

  const handleImprove = async () => {
    if (!description.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/create/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), attributes, mode: 'improve' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newName = data.name || name;
      setName(newName);
      setDescription(data.description);
      setAiGenerated(true);
      setErrors({});
      const newAttrs = data.attributes ? {
        sex: data.attributes.sex ?? attributes.sex,
        race: data.attributes.race ?? attributes.race,
        ethnicity: data.attributes.ethnicity ?? attributes.ethnicity,
        age: data.attributes.age ?? attributes.age,
        ageRange: data.attributes.ageRange ?? attributes.ageRange,
        build: data.attributes.build ?? attributes.build,
        height: data.attributes.height ?? attributes.height,
        style: data.attributes.style ?? attributes.style,
      } : undefined;
      if (newAttrs) setAttributes(newAttrs);

      // Auto-save draft so description persists across refreshes
      await autoSaveDraft(newName, data.description, newAttrs ?? attributes);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to improve description');
    } finally {
      setGenerating(false);
    }
  };

  const handleContinue = async () => {
    if (saving) return; // Prevent double-click

    if (!description.trim()) {
      setErrors({ description: 'Description is required' });
      return;
    }

    // Guest users: redirect to sign-up, preserve prompt + autogen flag
    // After signup, they return here with the prompt prefilled and Continue auto-triggers
    if (!isSignedIn) {
      const params = new URLSearchParams({
        prompt: description,
        autogen: '1',
      });
      if (name) params.set('name', name);
      const returnUrl = `/create?${params.toString()}`;
      router.push(`/sign-up?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setSaving(true);
    try {
      let finalName = name;
      let finalAttrs = attributes;

      // If description was manually typed, extract attributes (and name if empty) from it via AI
      if (!aiGenerated) {
        const res = await fetch('/api/create/describe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: description.trim(), mode: 'improve' }),
        });
        const data = await res.json();
        if (res.ok) {
          if (!finalName.trim() && data.name) {
            finalName = data.name;
            setName(finalName);
          }
          if (data.attributes) {
            finalAttrs = {
              sex: data.attributes.sex ?? attributes.sex,
              race: data.attributes.race ?? attributes.race,
              ethnicity: data.attributes.ethnicity,
              age: data.attributes.age,
              ageRange: data.attributes.ageRange ?? attributes.ageRange,
              build: data.attributes.build ?? attributes.build,
              height: data.attributes.height ?? attributes.height,
              style: data.attributes.style ?? attributes.style,
            };
            setAttributes(finalAttrs);
          }
        }
      }

      // If still no name after AI extraction, generate a fallback
      if (!finalName.trim()) {
        setSaving(false);
        setErrors({ name: 'Please provide a character name' });
        return;
      }

      const slug = finalName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const body = { name: finalName, slug, description, attributes: finalAttrs };

      let savedDraft: CustomCharacterDraft;
      const existingId = draftIdRef.current || draft?.id;
      if (existingId) {
        const res = await fetch(`/api/create/drafts/${existingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        savedDraft = await res.json();
      } else {
        const res = await fetch('/api/create/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        savedDraft = await res.json();
        // Store the ID immediately to prevent duplicate creation on double-click
        draftIdRef.current = savedDraft.id;
      }

      onComplete(savedDraft);
    } catch {
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8">
      <h2 className="text-xl font-black tracking-tight text-black mb-1">Describe Your Character</h2>
      <p className="text-sm text-gray-400 mb-6">Write a description or let AI generate one for you.</p>

      {/* Description */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description <span className="text-red-400">*</span></label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); setAiGenerated(false); if (errors.description) setErrors((prev) => ({ ...prev, description: undefined })); }}
          placeholder="e.g. A 30-year-old East Asian woman, athletic build, sharp features, confident corporate executive..."
          className={`w-full h-32 text-sm border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none resize-none ${errors.description ? 'border-red-400' : 'border-gray-200'}`}
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-xs font-semibold bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Description'}
          </button>
          <button
            onClick={handleImprove}
            disabled={generating || !description.trim()}
            className="text-xs font-semibold border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50"
          >
            Improve Description
          </button>
        </div>
      </div>

      {/* Name */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Character Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((prev) => ({ ...prev, name: undefined })); }}
          placeholder="e.g. Hailey Kim"
          className={`w-full text-sm border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Attributes */}
      <div className="space-y-4 mb-6">
        {/* Sex */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sex</label>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setAttributes({ ...attributes, sex: s })}
                className={`text-xs font-medium px-4 py-2 rounded-lg border transition-colors ${
                  attributes.sex === s ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {s === 'male' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
        </div>

        {/* Race */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Race</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(RACE_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  const race = attributes.race.includes(value as TalentRace)
                    ? attributes.race.filter((r) => r !== value)
                    : [...attributes.race, value as TalentRace];
                  setAttributes({ ...attributes, race });
                }}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  attributes.race.includes(value as TalentRace) ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Age Range</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(AGE_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setAttributes({ ...attributes, ageRange: value as TalentAgeRange })}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  attributes.ageRange === value ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Build */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Build</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(BUILD_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setAttributes({ ...attributes, build: value as TalentBuild })}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  attributes.build === value ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Height */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Height</label>
          <div className="flex gap-2">
            {Object.entries(HEIGHT_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setAttributes({ ...attributes, height: value as TalentHeight })}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  attributes.height === value ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Style</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STYLE_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setAttributes({ ...attributes, style: value as TalentStyle })}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  attributes.style === value ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={saving || !description.trim()}
        className="w-full bg-indigo-500 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {saving ? 'Saving...' : (isSignedIn ? 'Continue to Preview' : 'Sign Up to Preview')}
      </button>
    </div>
  );
}
