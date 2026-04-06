import React, { useState } from 'react';

// ── Icons ─────────────────────────────────────────────────────────────────────

const ICONS = {
  feed: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  news: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2V9"/>
      <line x1="18" y1="14" x2="10" y2="14"/><line x1="18" y1="10" x2="10" y2="10"/><line x1="14" y1="18" x2="10" y2="18"/>
    </svg>
  ),
  propfirm: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <polyline points="7 8 12 13 17 8"/>
    </svg>
  ),
  more: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  watchlist: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  portfolio: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  settings: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

// ── More Tray ────────────────────────────────────────────────────────────────

const MORE_ITEMS = [
  { id: 'watchlist', label: 'Watchlist', icon: ICONS.watchlist },
  { id: 'portfolio', label: 'Portfolio', icon: ICONS.portfolio },
  { id: 'profile',   label: 'Profile',   icon: ICONS.profile   },
  { id: 'settings',  label: 'Settings',  icon: ICONS.settings  },
];

function MoreTray({
  onNavigate,
  onClose,
}: {
  onNavigate: (page: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 200,
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderRadius: '16px 16px 0 0',
        zIndex: 201,
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.25)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Label */}
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '1.2px',
          color: 'var(--text-3)', textTransform: 'uppercase',
          padding: '6px 20px 10px',
        }}>
          More
        </div>

        {/* Items */}
        {MORE_ITEMS.map((item, i) => (
          <button
            key={item.id}
            onClick={() => { onNavigate(item.id); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 20px',
              background: 'none', border: 'none', cursor: 'pointer',
              borderTop: i === 0 ? '1px solid var(--border)' : 'none',
              borderBottom: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 16, fontWeight: 500,
              textAlign: 'left',
            }}
          >
            <span style={{ color: 'var(--text-2)', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ── Nav Item ─────────────────────────────────────────────────────────────────

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
        width: 36, height: 36, borderRadius: 10,
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

// ── Bottom Nav ────────────────────────────────────────────────────────────────

export default function BottomNav({
  currentPage,
  onNavigate,
  onPostClick,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  onPostClick: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some(i => i.id === currentPage);

  return (
    <>
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
        {/* Feed */}
        <NavItem id="feed"   label="Feed"   icon={ICONS.feed}   active={currentPage === 'feed'}   onNavigate={onNavigate} />
        {/* News */}
        <NavItem id="news"   label="News"   icon={ICONS.news}   active={currentPage === 'news'}   onNavigate={onNavigate} />

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

        {/* Prop Firms */}
        <NavItem id="propfirm" label="Prop Firms" icon={ICONS.propfirm} active={currentPage === 'propfirm'} onNavigate={onNavigate} />

        {/* More */}
        <div
          onClick={() => setMoreOpen(true)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
            cursor: 'pointer', padding: '2px 0',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: moreActive ? '#0047FF' : 'var(--text4)',
            background: moreActive ? 'rgba(0,71,255,0.06)' : 'transparent',
          }}>
            {ICONS.more}
          </div>
          <span style={{ fontSize: 10, fontWeight: moreActive ? 700 : 500, color: moreActive ? '#0047FF' : 'var(--text4)' }}>
            More
          </span>
        </div>
      </div>

      {moreOpen && (
        <MoreTray
          onNavigate={onNavigate}
          onClose={() => setMoreOpen(false)}
        />
      )}
    </>
  );
}
