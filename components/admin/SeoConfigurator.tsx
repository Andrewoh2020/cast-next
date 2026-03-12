'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Globe, Twitter, BarChart2, Search, Image as ImageIcon, Tag, Link } from 'lucide-react';

interface SeoSettings {
  siteTitle: string;
  titleTemplate: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage: string;
  twitterHandle: string;
  googleAnalyticsId: string;
}

const defaults: SeoSettings = {
  siteTitle: '',
  titleTemplate: '%s | Cast',
  description: '',
  keywords: [],
  canonicalUrl: '',
  ogImage: '',
  twitterHandle: '',
  googleAnalyticsId: '',
};

function KeywordInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {value.length === 0 && <span className="text-xs text-gray-400 italic">No keywords added yet</span>}
        {value.map((kw) => (
          <span key={kw} className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-1 rounded-full">
            {kw}
            <button type="button" onClick={() => onChange(value.filter((k) => k !== kw))}
              className="hover:text-indigo-900 transition-colors text-indigo-400 ml-0.5">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Type a keyword and press Enter"
        />
        <button type="button" onClick={add}
          className="px-4 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 whitespace-nowrap">
          Add
        </button>
      </div>
    </div>
  );
}

// Google SERP preview
function SerpPreview({ title, description, url }: { title: string; description: string; url: string }) {
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'your-site.com';
  const displayTitle = title || 'Your Site Title';
  const displayDesc = description || 'Your meta description will appear here. Make it compelling and under 160 characters.';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Google Search Preview</p>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-700 leading-none">Cast</p>
            <p className="text-xs text-gray-500">{displayUrl}</p>
          </div>
        </div>
        <p className="text-[17px] text-blue-600 hover:underline cursor-pointer leading-snug font-normal truncate">
          {displayTitle.length > 60 ? displayTitle.slice(0, 60) + '...' : displayTitle}
        </p>
        <p className="text-sm text-gray-600 leading-snug">
          {displayDesc.length > 160 ? displayDesc.slice(0, 160) + '...' : displayDesc}
        </p>
      </div>
    </div>
  );
}

// OG card preview
function OgPreview({ title, description, image }: { title: string; description: string; image: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 p-4 pb-2">Social Share Preview</p>
      <div className="border-t border-gray-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="OG preview" className="w-full h-36 object-cover" />
        ) : (
          <div className="w-full h-36 bg-gray-100 flex items-center justify-center text-gray-400">
            <ImageIcon size={28} strokeWidth={1.5} />
          </div>
        )}
        <div className="p-3 bg-gray-50">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">your-site.com</p>
          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{title || 'Your Site Title'}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{description || 'Your meta description.'}</p>
        </div>
      </div>
    </div>
  );
}

export default function SeoConfigurator() {
  const [settings, setSettings] = useState<SeoSettings>(defaults);
  const [snapshot, setSnapshot] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/seo')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setSnapshot(JSON.stringify(data));
      });
  }, []);

  const isDirty = useMemo(() => JSON.stringify(settings) !== snapshot, [settings, snapshot]);

  const set = <K extends keyof SeoSettings>(key: K, val: SeoSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/seo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSnapshot(JSON.stringify(settings));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const descLen = settings.description.length;

  return (
    <div className="max-w-4xl space-y-6">

      {/* SERP + OG Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SerpPreview title={settings.siteTitle} description={settings.description} url={settings.canonicalUrl} />
        <OgPreview title={settings.siteTitle} description={settings.description} image={settings.ogImage} />
      </div>

      {/* Core */}
      <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">

        {/* Site Identity */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500">
            <Globe size={13} />  Site Identity
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Site Title</Label>
              <Input
                value={settings.siteTitle}
                onChange={(e) => set('siteTitle', e.target.value)}
                placeholder="Cast"
              />
              <p className="text-xs text-gray-400">{settings.siteTitle.length} / 60 chars recommended</p>
            </div>
            <div className="space-y-1.5">
              <Label>Title Template <span className="font-normal normal-case tracking-normal text-gray-400">(%s = page title)</span></Label>
              <Input
                value={settings.titleTemplate}
                onChange={(e) => set('titleTemplate', e.target.value)}
                placeholder="%s | Cast"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Meta Description</Label>
            <Textarea
              value={settings.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Browse and license 100% AI-generated characters for your video productions..."
              rows={3}
            />
            <p className={cn('text-xs text-right transition-colors', descLen > 160 ? 'text-red-500' : descLen > 140 ? 'text-amber-500' : 'text-gray-400')}>
              {descLen} / 160 chars
            </p>
          </div>
        </div>

        {/* Keywords */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500">
            <Tag size={13} /> Keywords
          </div>
          <KeywordInput value={settings.keywords} onChange={(v) => set('keywords', v)} />
        </div>

        {/* URLs */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500">
            <Link size={13} /> URLs & Canonical
          </div>
          <div className="space-y-1.5">
            <Label>Canonical URL</Label>
            <Input
              type="url"
              value={settings.canonicalUrl}
              onChange={(e) => set('canonicalUrl', e.target.value)}
              placeholder="https://cast-next-silk.vercel.app"
            />
          </div>
        </div>

        {/* Social */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500">
            <ImageIcon size={13} /> Open Graph & Social
          </div>
          <div className="space-y-1.5">
            <Label>OG Image URL</Label>
            <Input
              type="url"
              value={settings.ogImage}
              onChange={(e) => set('ogImage', e.target.value)}
              placeholder="https://your-site.com/og-image.png"
            />
            <p className="text-xs text-gray-400">Recommended size: 1200×630px. Used for link previews on Twitter, Facebook, iMessage, etc.</p>
          </div>
        </div>

        {/* Twitter */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500">
            <Twitter size={13} /> Twitter / X
          </div>
          <div className="space-y-1.5">
            <Label>Twitter Handle</Label>
            <Input
              value={settings.twitterHandle}
              onChange={(e) => set('twitterHandle', e.target.value)}
              placeholder="@castai"
            />
          </div>
        </div>

        {/* Analytics */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500">
            <BarChart2 size={13} /> Analytics
          </div>
          <div className="space-y-1.5">
            <Label>Google Analytics ID</Label>
            <Input
              value={settings.googleAnalyticsId}
              onChange={(e) => set('googleAnalyticsId', e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="font-mono"
            />
            <p className="text-xs text-gray-400">Leave blank to disable. Paste your Measurement ID from Google Analytics 4.</p>
          </div>
        </div>

      </div>

      {/* SEO checklist */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-500 mb-4">
          <Search size={13} /> SEO Checklist
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { label: 'Site title set', ok: settings.siteTitle.length > 0 && settings.siteTitle.length <= 60 },
            { label: 'Meta description set', ok: settings.description.length >= 50 && settings.description.length <= 160 },
            { label: 'Description under 160 chars', ok: settings.description.length <= 160 },
            { label: 'Keywords added', ok: settings.keywords.length >= 3 },
            { label: 'Canonical URL set', ok: settings.canonicalUrl.startsWith('http') },
            { label: 'OG image configured', ok: settings.ogImage.startsWith('http') },
            { label: 'Twitter handle set', ok: settings.twitterHandle.startsWith('@') },
            { label: 'Analytics connected', ok: settings.googleAnalyticsId.length > 0 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-sm">
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0',
                item.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
              )}>
                {item.ok ? '✓' : '○'}
              </span>
              <span className={item.ok ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4">
        <p className="text-sm text-gray-500">
          {saved ? (
            <span className="text-emerald-600 font-semibold">✓ Settings saved successfully</span>
          ) : isDirty ? (
            <span className="text-amber-500 font-medium">● Unsaved changes</span>
          ) : (
            'All SEO settings are up to date'
          )}
        </p>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={cn(
            'font-bold px-6 py-2.5 rounded-xl text-sm transition-all',
            isDirty
              ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm shadow-indigo-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {saving ? 'Saving...' : 'Save SEO Settings'}
        </button>
      </div>

    </div>
  );
}
