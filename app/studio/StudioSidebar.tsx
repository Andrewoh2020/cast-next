/**
 * Vertical icon rail on the left edge of the Studio canvas. Mirrors the
 * Artlist Studio framing — a single highlighted "Characters" mode plus
 * placeholder slots for future modes (locations, projects, products),
 * disabled until they ship. Keeps the layout legible on day one and
 * carves out room for expansion without restructuring.
 */
export default function StudioSidebar() {
  return (
    <aside
      aria-label="Studio modes"
      className="hidden md:flex shrink-0 w-16 border-r border-gray-200 bg-white/60 backdrop-blur-sm flex-col items-center py-5 gap-2"
    >
      <SidebarIcon active label="Characters">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </SidebarIcon>
      <SidebarIcon disabled label="Scenes (coming soon)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </SidebarIcon>
      <SidebarIcon disabled label="Voice (coming soon)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </SidebarIcon>
    </aside>
  );
}

function SidebarIcon({
  children, active, disabled, label,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const cls = active
    ? 'bg-black text-white'
    : disabled
      ? 'text-gray-300 cursor-not-allowed'
      : 'text-gray-500 hover:text-black hover:bg-gray-100';
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-current={active ? 'page' : undefined}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${cls}`}
    >
      {children}
    </button>
  );
}
