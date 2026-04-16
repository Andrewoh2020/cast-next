export default function SocialProofStrip() {
  return (
    <section className="py-8 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto">
        {/* Row 1 — Tool ecosystem */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest shrink-0">
            Used by AI video creators alongside
          </p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <a href="https://klingai.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 rounded-md bg-[#FF6B35] flex items-center justify-center"><span className="text-white text-xs font-black">K</span></div>
              <span className="text-gray-800 font-black text-base tracking-tight">Kling</span>
            </a>
            <a href="https://runwayml.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center"><span className="text-white text-xs font-black">R</span></div>
              <span className="text-gray-800 font-black text-base tracking-tight">Runway</span>
            </a>
            <a href="https://deepmind.google/models/veo/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 rounded-md bg-[#4285F4] flex items-center justify-center"><span className="text-white text-xs font-black">V</span></div>
              <span className="text-gray-800 font-black text-base tracking-tight">Veo</span>
            </a>
            <a href="https://seed.bytedance.com/en/seedance2_0" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 rounded-md bg-[#00D1FF] flex items-center justify-center"><span className="text-white text-xs font-black">S</span></div>
              <span className="text-gray-800 font-black text-base tracking-tight">Seedance</span>
            </a>
          </div>
        </div>

        {/* Row 2 — Featured on */}
        <div className="flex items-center justify-center gap-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Featured on</p>
          <a
            href="https://www.producthunt.com/products/cast-6?launch=cast-6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 hover:shadow-sm transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#DA552F" />
              <path d="M22.5 20H18V14H22.5C24.16 14 25.5 15.34 25.5 17C25.5 18.66 24.16 20 22.5 20Z" fill="white" />
              <path d="M18 14V26H15V14H18ZM22.5 11H15V29H18V23H22.5C25.81 23 28.5 20.31 28.5 17C28.5 13.69 25.81 11 22.5 11Z" fill="white" />
            </svg>
            <span className="text-sm font-bold text-gray-800">Product Hunt</span>
          </a>
        </div>
      </div>
    </section>
  );
}
