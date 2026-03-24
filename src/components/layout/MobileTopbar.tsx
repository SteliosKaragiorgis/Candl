import { currentUser, APP_NAME } from '../../data/demo';

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
          background: 'linear-gradient(90deg, #0047FF, #60a5fa, transparent)',
        }} />

        {/* Logo */}
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 18,
          color: 'var(--blue)',
          letterSpacing: '-0.5px',
        }}>
          {APP_NAME}
          <span style={{
            display: 'inline-block', width: 6, height: 6,
            borderRadius: '50%', background: 'var(--blue)',
            marginLeft: 3, verticalAlign: 'middle',
          }} />
        </span>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${currentUser.avatarGradient[0]}, ${currentUser.avatarGradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 700,
          }}>
            {currentUser.initials}
          </div>
        </div>
      </div>

      {/* Market ticker strip */}
      <div
        className="scrollbar-hide"
        style={{
          padding: '7px 16px',
          display: 'flex',
          gap: 0,
          overflowX: 'auto',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {MARKET_TICKERS.map(({ label, price, change, up }, i) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            flexShrink: 0, paddingRight: 14,
            borderRight: i < MARKET_TICKERS.length - 1 ? '1px solid var(--border2)' : 'none',
            marginRight: i < MARKET_TICKERS.length - 1 ? 14 : 0,
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
  );
}
