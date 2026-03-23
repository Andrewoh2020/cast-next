import { SiNetflix, SiYoutube, SiTiktok, SiInstagram } from 'react-icons/si';

const platforms = [
  { icon: SiNetflix, label: 'Netflix', color: '#E50914' },
  { icon: SiYoutube, label: 'YouTube', color: '#FF0000' },
  { icon: SiTiktok, label: 'TikTok', color: '#000000' },
  { icon: SiInstagram, label: 'Instagram', color: '#E1306C' },
];

export default function PlatformStrip() {
  return (
    <section className="py-14 px-6 bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
          Built for creators publishing on
        </p>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-black mb-10">
          The world&apos;s biggest stages.
        </h2>

        <div className="flex items-center justify-center gap-12 sm:gap-16 flex-wrap">
          {platforms.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon size={40} color={color} />
              <span className="text-xs font-semibold text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
