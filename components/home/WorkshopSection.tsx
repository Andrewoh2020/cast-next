import Link from 'next/link';

export default function WorkshopSection() {
  return (
    <section className="relative py-24 px-6 bg-[#faf7f2] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Character Studio</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-4 leading-[1.05]">
            Dress them. Place them. Export.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Change your character&apos;s outfit, place them in any scene, and export a complete package ready for Kling, Higgsfield, or Artlist.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Change outfit */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
              <div className="grid grid-cols-2 w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/home/workshop-outfit-1.png"
                  alt="Character in original outfit"
                  className="w-full h-full object-cover object-top"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/home/workshop-outfit-2.png"
                  alt="Same character in a new outfit"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest text-white bg-black/70 backdrop-blur rounded-md px-2.5 py-1">
                Same identity
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-black text-black text-lg mb-1">Change their outfit</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Describe any wardrobe or upload a garment photo. Same identity, new look, every angle.
              </p>
            </div>
          </div>

          {/* Place in scene */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/home/workshop-scene.jpg"
                alt="Character placed in a cinematic scene"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest text-white bg-black/70 backdrop-blur rounded-md px-2.5 py-1">
                Scene
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-black text-black text-lg mb-1">Place in any scene</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Describe a location or upload a reference photo. Lighting and environment match automatically.
              </p>
            </div>
          </div>

          {/* Export */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden flex flex-col items-center justify-center p-8 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={1.5}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </div>
              <div className="space-y-2 w-full max-w-[180px]">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-sm text-gray-700">Profile photo</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-sm text-gray-700">4K reference sheet</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-sm text-gray-700">All outfit variants</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-sm text-gray-700">All scene shots</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-sm text-gray-700">Video tool guide</span></div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-black text-black text-lg mb-1">Export package</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                One zip with everything your AI video tool needs. Profile, ref sheet, outfits, scenes, and a README.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/workshop"
            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-colors shadow-sm shadow-indigo-500/30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8Z" />
            </svg>
            Open Character Studio
          </Link>
          <p className="text-xs text-gray-500 mt-3">Make your first character free — no card needed</p>
        </div>
      </div>
    </section>
  );
}
