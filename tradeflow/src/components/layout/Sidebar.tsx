import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DEMO_WATCHLIST } from '../../data/demo';

const navItems = [
  { label: 'Feed', path: '/', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { label: 'My Trades', path: '/trades', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
  { label: 'Watchlist', path: '/watchlist', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
  { label: 'Portfolio', path: '/portfolio', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
  { label: 'Analytics', path: '/analytics', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { label: 'Settings', path: '/settings', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
];

function Sparkline({ points, positive }: { points: string; positive: boolean }) {
  return (
    <svg width="40" height="20" viewBox="0 0 64 32" fill="none">
      <polyline
        points={points}
        stroke={positive ? 'var(--green)' : 'var(--red)'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setPostOpen] = useState(false);

  return (
    <div style={{
      gridArea: 'sidebar',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '10px 8px',
      overflowY: 'auto',
    }} className="scrollbar-hide">

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '16px' }}>
        {navItems.map(({ label, path, icon }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <button
              key={label}
              className={`nav-item ${active ? 'nav-item-active' : ''}`}
              onClick={() => navigate(path)}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* Post trade button */}
      <button className="post-btn" onClick={() => setPostOpen(true)} style={{ marginBottom: '16px' }}>
        + POST TRADE
      </button>

      {/* Watchlist */}
      <div style={{ marginBottom: '6px' }}>
        <div style={{
          fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
          color: 'var(--text-3)', textTransform: 'uppercase',
          padding: '0 4px', marginBottom: '6px',
        }}>
          Watchlist
        </div>
        {DEMO_WATCHLIST.map(item => (
          <div key={item.ticker} className="watchlist-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
                {item.ticker}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                ${item.price.toFixed(2)}
              </div>
            </div>
            <Sparkline points={item.sparkline} positive={item.changePct >= 0} />
            <div style={{
              fontSize: '10px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
              color: item.changePct >= 0 ? 'var(--green)' : 'var(--red)',
              minWidth: '44px', textAlign: 'right',
            }}>
              {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
