const NAV_ITEMS = [
  {
    id: 'feed',
    label: 'Feed',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function BottomNav({
  currentPage,
  onNavigate,
  onPostClick,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  onPostClick: () => void;
}) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: 'calc(8px) 0',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {/* Feed */}
      <NavItem
        id="feed"
        label={NAV_ITEMS[0].label}
        icon={NAV_ITEMS[0].icon}
        active={currentPage === 'feed'}
        onNavigate={onNavigate}
      />

      {/* Explore */}
      <NavItem
        id="explore"
        label={NAV_ITEMS[1].label}
        icon={NAV_ITEMS[1].icon}
        active={currentPage === 'explore'}
        onNavigate={onNavigate}
      />

      {/* FAB — center post button */}
      <div style={{ flex: 0, margin: '0 8px' }}>
        <button
          onClick={onPostClick}
          style={{
            width: 48, height: 48,
            borderRadius: 14,
            background: '#0047FF',
            boxShadow: '0 4px 14px rgba(0,71,255,0.35)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Alerts */}
      <NavItem
        id="alerts"
        label={NAV_ITEMS[2].label}
        icon={NAV_ITEMS[2].icon}
        active={currentPage === 'alerts'}
        onNavigate={onNavigate}
      />

      {/* Profile */}
      <NavItem
        id="profile"
        label={NAV_ITEMS[3].label}
        icon={NAV_ITEMS[3].icon}
        active={currentPage === 'profile'}
        onNavigate={onNavigate}
      />
    </div>
  );
}

function NavItem({
  id, label, icon, active, onNavigate,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onNavigate: (page: string) => void;
}) {
  return (
    <div
      onClick={() => onNavigate(id)}
      style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 3,
        cursor: 'pointer', padding: '2px 0',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? '#0047FF' : 'var(--text4)',
        background: active ? 'rgba(0,71,255,0.06)' : 'transparent',
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        color: active ? '#0047FF' : 'var(--text4)',
      }}>
        {label}
      </span>
    </div>
  );
}
