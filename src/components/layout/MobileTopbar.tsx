import { useNavigate } from 'react-router-dom';
import { currentUser, APP_NAME } from '../../data/demo';
import { useTheme } from '../../context/ThemeContext';

const MARKET_TICKERS = [
  { label: 'S&P',  price: '5,842.17', change: '+1.12%', up: true  },
  { label: 'NAS',  price: '19,021.4', change: '-0.38%', up: false },
  { label: 'VIX',  price: '14.82',    change: '-5.21%', up: false },
  { label: 'BTC',  price: '71,240',   change: '+2.84%', up: true  },
  { label: 'DXY',  price: '104.12',   change: '+0.21%', up: true  },
];

export default function MobileTopbar({
  onNotifClick,
  notifHasUnread,
}: {
  onNotifClick: () => void;
  notifHasUnread: boolean;
}) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  return (
    <div>
      {/* Main topbar row */}
      <div style={{
        height: 52,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      }}>
        {/* Blue accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #2563EB, #0EA5E9, transparent)',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563EB, #0EA5E9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <line x1="5"  y1="2"  x2="5"  y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
              <rect x="3"   y="7"   width="4" height="10" rx="1" fill="white" opacity="0.5"/>
              <line x1="12" y1="1"  x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="10"  y="5"   width="4" height="12" rx="1" fill="white"/>
              <line x1="19" y1="3"  x2="19" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <rect x="17"  y="7"   width="4" height="9"  rx="1" fill="white" opacity="0.85"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Trebuchet MS', sans-serif",
            fontWeight: 700, fontSize: 18,
            color: 'var(--text)', letterSpacing: '-0.5px',
          }}>
            {APP_NAME}
          </span>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            style={{
              width: 34, height: 34, borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)',
            }}
          >
            {theme === 'light' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>

          {/* Notification bell */}
          <button
            onClick={onNotifClick}
            style={{
              width: 34, height: 34, borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', color: 'var(--text)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifHasUnread && (
              <span style={{
                position: 'absolute', top: 5, right: 5,
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--red)', border: '1.5px solid var(--surface)',
              }} />
            )}
          </button>

          {/* User avatar */}
          <div
            onClick={() => navigate(`/profile/${currentUser.id}`)}
            style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${currentUser.avatarGradient[0]}, ${currentUser.avatarGradient[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {currentUser.initials}
          </div>
        </div>
      </div>

      {/* Market ticker strip */}
      <div style={{
        overflow: 'hidden',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '7px 0',
      }}>
        <style>{`
          @keyframes mobile-ticker-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .mobile-ticker-track {
            display: flex;
            width: max-content;
            animation: mobile-ticker-scroll 18s linear infinite;
          }
        `}</style>
        <div className="mobile-ticker-track">
          {[...MARKET_TICKERS, ...MARKET_TICKERS].map(({ label, price, change, up }, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              flexShrink: 0, paddingRight: 14,
              borderRight: '1px solid var(--border2)',
              marginRight: 14,
            }}>
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text4)' }}>
                {label}
              </span>
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--text)' }}>
                {price}
              </span>
              <span style={{
                fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                padding: '1px 4px', borderRadius: 4,
                background: up ? 'var(--green-bg)' : 'var(--red-bg)',
                color: up ? 'var(--green)' : 'var(--red)',
              }}>
                {change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
