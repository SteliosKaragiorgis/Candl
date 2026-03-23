import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DEMO_WATCHLIST } from '../../data/demo';

const navItems = [
  { label: 'Feed', path: '/', icon: '📈' },
  { label: 'My Trades', path: '/trades', icon: '📋' },
  { label: 'Watchlist', path: '/watchlist', icon: '👁' },
  { label: 'Portfolio', path: '/portfolio', icon: '💼' },
  { label: 'Analytics', path: '/analytics', icon: '📊' },
  { label: 'Settings', path: '/settings', icon: '⚙' },
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
              <span style={{ fontSize: '13px' }}>{icon}</span>
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
