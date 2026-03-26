import { useTheme } from '../../context/ThemeContext';
import { currentUser, APP_NAME } from '../../data/demo';
import { useNavigate } from 'react-router-dom';

function CandlIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <line x1="5"  y1="2"  x2="5"  y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <rect x="3"   y="7"   width="4" height="10" rx="1" fill="white" opacity="0.5"/>
      <line x1="12" y1="1"  x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <rect x="10"  y="5"   width="4" height="12" rx="1" fill="white"/>
      <line x1="19" y1="3"  x2="19" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <rect x="17"  y="7"   width="4" height="9"  rx="1" fill="white" opacity="0.85"/>
    </svg>
  );
}

const TICKERS = [
  { t: 'NVDA', p: 882.60, c: 3.17 },
  { t: 'SPY',  p: 512.50, c: -0.40 },
  { t: 'TSLA', p: 172.00, c: -4.16 },
  { t: 'AAPL', p: 211.45, c: 0.59 },
  { t: 'META', p: 485.00, c: 2.22 },
  { t: 'AMD',  p: 162.50, c: 1.88 },
  { t: 'AMZN', p: 198.30, c: 0.74 },
  { t: 'MSFT', p: 415.20, c: -0.31 },
];

export default function Topbar({ onNotifClick, notifOpen }: { onNotifClick: () => void; notifOpen: boolean }) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{
      gridArea: 'topbar',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '12px',
      paddingRight: '16px',
      gap: '12px',
      zIndex: 20,
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', flexShrink: 0,
          width: 'var(--sidebar-w)',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CandlIcon />
        </div>
        <span style={{
          fontFamily: "'Trebuchet MS', sans-serif",
          fontWeight: 700, fontSize: '18px',
          color: 'var(--text)', letterSpacing: '-0.5px',
        }}>
          {APP_NAME}
        </span>
      </div>

      {/* Ticker tape */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <style>{`
          @keyframes ticker-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-track {
            display: flex;
            width: max-content;
            animation: ticker-scroll 30s linear infinite;
          }
          .ticker-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="ticker-track">
          {[...TICKERS, ...TICKERS].map(({ t, p, c }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, marginRight: '28px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>{t}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>{p.toFixed(2)}</span>
              <span style={{
                fontSize: '10px', fontWeight: 600,
                fontFamily: 'JetBrains Mono, monospace',
                color: c >= 0 ? 'var(--green)' : 'var(--red)',
              }}>
                {c >= 0 ? '+' : ''}{c.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: '6px', padding: '5px 10px',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="Search…" style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: '11px', color: 'var(--text)', width: '100px',
            fontFamily: 'Inter, sans-serif',
          }} />
        </div>

        {/* Notif bell */}
        <button
          className={`icon-btn ${notifOpen ? 'icon-btn-active' : ''}`}
          onClick={() => navigate('/notifications')}
          style={{ position: 'relative' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span style={{
            position: 'absolute', top: '3px', right: '3px',
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--red)', border: '1.5px solid var(--surface)',
          }} />
        </button>

        {/* Theme toggle */}
        <button className="icon-btn" onClick={toggle}>
          {theme === 'light' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        {/* User pill */}
        <button className="user-pill" onClick={() => navigate(`/profile/${currentUser.id}`)}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${currentUser.avatarGradient[0]}, ${currentUser.avatarGradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '10px', fontWeight: 700,
          }}>
            {currentUser.initials}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>
            {currentUser.username}
          </span>
        </button>
      </div>
    </div>
  );
}
