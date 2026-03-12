const items = [
  { icon: '🛡️', text: 'No human likenesses used' },
  { icon: '⚡', text: 'Instant delivery after purchase' },
  { icon: '📺', text: 'Commercial & broadcast rights included' },
  { icon: '🎬', text: 'Curated by professional casting directors' },
];

export default function TrustStrip() {
  return (
    <div className="bg-gray-50 border-y border-gray-100 py-4 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-8 flex-wrap">
        {items.map((item) => (
          <div key={item.text} className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
