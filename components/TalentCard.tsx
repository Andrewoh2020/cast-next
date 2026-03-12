import Image from 'next/image';
import { Talent, ROLE_LABELS, AGE_LABELS, BUILD_LABELS } from '@/lib/talent';

interface Props {
  talent: Talent;
  onClick: (talent: Talent) => void;
}

export default function TalentCard({ talent, onClick }: Props) {
  const primaryRole = ROLE_LABELS[talent.roles[0]];

  return (
    <div
      onClick={() => onClick(talent)}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Image
          src={talent.img}
          alt={talent.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <span className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-sm text-gray-700">
          {primaryRole}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="text-base font-bold text-black tracking-tight mb-1">{talent.name}</div>
        <div className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{talent.vibe}</div>

        {/* Attribute pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {AGE_LABELS[talent.ageRange]}
          </span>
          <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {BUILD_LABELS[talent.build]}
          </span>
          {talent.genres.slice(0, 1).map((g) => (
            <span key={g} className="text-[11px] font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full capitalize">
              {g}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-2 text-xs text-gray-500 mb-3">
          From <span className="text-base font-black text-black">{talent.prices[0].price}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(talent); }}
          className="w-full text-sm font-semibold text-indigo-500 border border-indigo-200 py-2.5 rounded-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
