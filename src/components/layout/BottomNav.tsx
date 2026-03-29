import React from 'react';

const LEFT_ITEMS = [
  {
    id: 'feed',
    label: 'Feed',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'news',
    label: 'News',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2V9"/>
        <line x1="18" y1="14" x2="10" y2="14"/><line x1="18" y1="10" x2="10" y2="10"/><line x1="14" y1="18" x2="10" y2="18"/>
      </svg>
    ),
  },
];

const RIGHT_ITEMS = [
  {
    id: 'forum',
    label: 'Groups',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
      display: 'flex', alignItems: 'center',
      padding: '8px 0',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {LEFT_ITEMS.map(item => (
        <NavItem
          key={item.id}
          id={item.id}
          label={item.label}
          icon={item.icon}
          active={currentPage === item.id}
          onNavigate={onNavigate}
        />
      ))}

      {/* Center FAB */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <button
        onClick={onPostClick}
        style={{
          width: 52, height: 52, borderRadius: 16,
          background: '#0047FF',
          boxShadow: '0 4px 16px rgba(0,71,255,0.45)',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          marginTop: -10,
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      </div>

      {RIGHT_ITEMS.map(item => (
        <NavItem
          key={item.id}
          id={item.id}
          label={item.label}
          icon={item.icon}
          active={currentPage === item.id}
          onNavigate={onNavigate}
        />
      ))}
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
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 3,
        cursor: 'pointer', padding: '2px 0',
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? '#0047FF' : 'var(--text4)',
        background: active ? 'rgba(0,71,255,0.06)' : 'transparent',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#0047FF' : 'var(--text4)' }}>
        {label}
      </span>
    </div>
  );
}
