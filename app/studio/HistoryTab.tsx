/**
 * History tab — Week 1 placeholder. Week 2 wires this to the user's
 * generation activity feed (saves, outfit edits, voice locks, etc.) so
 * recent work is easy to find again.
 */
export default function HistoryTab() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Coming next</p>
      <h2 className="text-xl font-black tracking-tight text-black mb-1">Recent activity</h2>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">
        Saves, outfit edits, and shot generations will land here so you can pick up where you left off.
      </p>
    </div>
  );
}
