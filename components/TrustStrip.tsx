import { SiNetflix, SiYoutube, SiTiktok, SiInstagram } from 'react-icons/si';

const items = [
  { icon: '🛡️', text: 'AI-generated or fully licensed likenesses' },
  { icon: '⚡', text: 'Instant delivery after purchase' },
  { icon: '📺', text: 'Commercial & broadcast rights included' },
  { icon: '🎬', text: 'Curated by professional casting directors' },
];

const platforms = [
  { icon: SiNetflix, label: 'Netflix', color: '#E50914' },
  { icon: SiYoutube, label: 'YouTube', color: '#FF0000' },
  { icon: SiTiktok, label: 'TikTok', color: '#000000' },
  { icon: SiInstagram, label: 'Instagram', color: '#E1306C' },
];

export default function TrustStrip() {
  return (
    <div className="bg-gray-50 border-y border-gray-100 px-6">
      {/* Trust badges */}
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-8 flex-wrap py-4">
        {items.map((item) => (
          <div key={item.text} className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="max-w-6xl mx-auto border-t border-gray-200" />

      {/* Platform row */}
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-5 flex-wrap py-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">For creators on</span>
        {platforms.map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon size={18} color={color} />
            <span className="text-xs font-semibold text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
