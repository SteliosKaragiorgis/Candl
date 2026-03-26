import TradeCard from "@/components/TradeCard";
import ComposeBox from "@/components/ComposeBox";
import {
  DEMO_TRADES, DEMO_WATCHLIST, DEMO_LEADERBOARD,
  DEMO_TRENDING, DEMO_SUGGESTED, DEMO_USERS,
} from "@/lib/demo-data";

// ─── Static data ──────────────────────────────────────────────────────────────

const MARKET_DATA = [
  { label: 'S&P',  price: '5,842.17', changePct:  1.12, up: true  },
  { label: 'NAS',  price: '19,021.4', changePct: -0.38, up: false },
  { label: 'VIX',  price: '14.82',    changePct: -5.21, up: false },
  { label: 'DXY',  price: '104.12',   changePct:  0.21, up: true  },
  { label: 'BTC',  price: '71,240',   changePct:  2.84, up: true  },
];

const STAT_TILES = [
  { label: 'Following', value: '48',  sub: 'traders',       valueColor: '#0047FF' },
  { label: 'Win Rate',  value: '71%', sub: 'last 90 days',  valueColor: '#0a0a0a' },
  { label: 'Open',      value: '4',   sub: 'positions',     valueColor: '#0047FF' },
  { label: 'Activity',  value: '218', sub: 'trades YTD',    valueColor: '#0a0a0a' },
];

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

// ─── Icons ────────────────────────────────────────────────────────────────────

const ic = (d: string | React.ReactNode, fill = 'none') => (s: string) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={fill} stroke={s} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

function HomeIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function ExploreIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function MarketsIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function TradersIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function AlertsIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function ProfileIcon({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label, link }: { label: string; link?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f3f3', paddingBottom: '8px', marginBottom: '12px' }}>
      <span style={{ ...INTER, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#ccc', textTransform: 'uppercase' }}>
        {label}
      </span>
      {link && <span style={{ ...INTER, fontSize: '12px', fontWeight: 700, color: '#0047FF', cursor: 'pointer' }}>{link}</span>}
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <header style={{
      gridColumn: '1 / -1', gridRow: 1,
      height: '52px', background: '#fff', borderBottom: '1px solid #ebebeb',
      position: 'sticky', top: 0, zIndex: 30,
      display: 'flex', alignItems: 'center',
    }}>
      {/* Accent line at very top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, #0047FF 0%, #60a5fa 40%, transparent 100%)',
      }} />

      {/* Logo section — 268px = icon rail (48) + sidebar (220) */}
      <div style={{ width: '268px', flexShrink: 0, borderRight: '1px solid #ebebeb', height: '100%', display: 'flex', alignItems: 'center', paddingLeft: '14px', gap: '5px' }}>
        <span style={{ fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 700, fontSize: '16px', color: '#0a0a0a', letterSpacing: '-0.5px' }}>
          Candl.
        </span>
      </div>

      {/* Market ticker strip */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', overflow: 'hidden', padding: '0 12px' }}>
        {MARKET_DATA.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 16px', flexShrink: 0 }}>
            <span style={{ ...INTER, fontSize: '11px', fontWeight: 500, color: '#bbb', letterSpacing: '0.5px' }}>
              {item.label}
            </span>
            <span style={{ ...MONO, fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>
              {item.price}
            </span>
            <span style={{
              ...MONO, fontSize: '11px', fontWeight: 600,
              padding: '2px 6px', borderRadius: '3px',
              background: item.up ? '#f0fdf4' : '#fff1f2',
              color: item.up ? '#16a34a' : '#dc2626',
            }}>
              {item.up ? '+' : ''}{item.changePct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', paddingRight: '14px', flexShrink: 0 }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '160px' }}>
          <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search…"
            style={{
              width: '100%', paddingLeft: '26px', paddingRight: '8px', paddingTop: '5px', paddingBottom: '5px',
              background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: '6px',
              fontSize: '11px', color: '#0a0a0a', fontFamily: 'Inter, sans-serif', outline: 'none',
            }}
          />
        </div>
        {/* Bell */}
        <button style={{ position: 'relative', width: '32px', height: '32px', border: '1px solid #ebebeb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', cursor: 'pointer' }}>
          <BellIcon />
          <div style={{ position: 'absolute', top: '5px', right: '5px', width: '5px', height: '5px', borderRadius: '50%', background: '#dc2626', border: '1px solid #fff' }} />
        </button>
        {/* User pill */}
        <div className="user-pill">
          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #0047FF, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
            {DEMO_USERS.currentUser.initials}
          </div>
          <span style={{ ...INTER, fontSize: '11px', fontWeight: 500, color: '#0a0a0a' }}>
            {DEMO_USERS.currentUser.name}
          </span>
        </div>
      </div>
    </header>
  );
}

// ─── Icon Rail ────────────────────────────────────────────────────────────────

function IconRail() {
  return (
    <aside style={{
      gridColumn: 1, gridRow: 2,
      width: '48px', background: '#fff', borderRight: '1px solid #ebebeb',
      position: 'sticky', top: '52px', height: 'calc(100vh - 52px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: '12px', paddingBottom: '12px', gap: '4px',
    }}>
      <button className="icon-btn icon-btn-active" title="Home"><HomeIcon color="#0047FF" /></button>
      <button className="icon-btn" title="Explore"><ExploreIcon color="#ddd" /></button>
      <button className="icon-btn" title="Markets"><MarketsIcon color="#ddd" /></button>
      <button className="icon-btn" title="Traders"><TradersIcon color="#ddd" /></button>
      <button className="icon-btn" title="Alerts"><AlertsIcon color="#ddd" /></button>
      <div style={{ flex: 1 }} />
      <button className="icon-btn" title="Profile"><ProfileIcon color="#ddd" /></button>
    </aside>
  );
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────

function Sidebar() {
  const navItems = [
    { label: 'Home',    icon: <HomeIcon color="currentColor" size={18} />,    active: true  },
    { label: 'Explore', icon: <ExploreIcon color="currentColor" size={18} />, active: false },
    { label: 'Markets', icon: <MarketsIcon color="currentColor" size={18} />, active: false },
    { label: 'Traders', icon: <TradersIcon color="currentColor" size={18} />, active: false },
    { label: 'Alerts',  icon: <AlertsIcon color="currentColor" size={18} />,  active: false },
  ];

  return (
    <aside
      className="scrollbar-hide"
      style={{
        gridColumn: 2, gridRow: 2,
        background: '#fff', borderRight: '1px solid #ebebeb',
        position: 'sticky', top: '52px', height: 'calc(100vh - 52px)',
        overflowY: 'auto', padding: '12px 10px',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Nav label */}
      <p style={{ ...INTER, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#e0e0e0', textTransform: 'uppercase', marginBottom: '8px' }}>
        Navigate
      </p>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '8px' }}>
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`sidebar-nav-item ${item.active ? 'sidebar-nav-item-active' : ''}`}
            style={{ fontSize: '14px', padding: '9px 10px', borderRadius: '7px', gap: '10px', marginBottom: '3px' }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Post button */}
      <button className="post-trade-btn" style={{ fontSize: '13px', padding: '12px 0', borderRadius: '8px', margin: '12px 0 20px' }}>
        + POST A TRADE
      </button>

      {/* Watchlist */}
      <p style={{ ...INTER, fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: '#e0e0e0', textTransform: 'uppercase', marginBottom: '8px' }}>
        Watchlist
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {DEMO_WATCHLIST.map((item) => {
          const isUp = item.changePct >= 0;
          return (
            <div key={item.ticker} className="watchlist-row" style={{ padding: '7px 8px' }}>
              {/* Ticker */}
              <span style={{ ...MONO, fontSize: '13px', fontWeight: 700, color: '#1a1a1a', width: '42px', flexShrink: 0 }}>
                {item.ticker}
              </span>
              {/* Sparkline */}
              <svg style={{ flex: 1, height: '24px' }} viewBox="0 0 64 32">
                <polyline
                  points={item.sparkline}
                  fill="none"
                  stroke={isUp ? '#16a34a' : '#dc2626'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {/* Price */}
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <p style={{ ...MONO, fontSize: '13px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.1 }}>
                  ${item.price.toFixed(2)}
                </p>
                <p style={{ ...MONO, fontSize: '11px', fontWeight: 500, color: isUp ? '#16a34a' : '#dc2626', lineHeight: 1.1 }}>
                  {isUp ? '+' : ''}{item.changePct.toFixed(2)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Main Feed ────────────────────────────────────────────────────────────────

function StatBar() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
      {STAT_TILES.map((tile) => (
        <div key={tile.label} className="stat-tile" style={{ borderRadius: '10px', padding: '14px 18px' }}>
          <p style={{ ...INTER, fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: '#bbb', textTransform: 'uppercase', marginBottom: '5px' }}>
            {tile.label}
          </p>
          <p style={{ ...MONO, fontSize: '22px', fontWeight: 700, color: tile.valueColor, lineHeight: 1.1 }}>
            {tile.value}
          </p>
          <p style={{ ...MONO, fontSize: '12px', color: '#bbb', marginTop: '3px' }}>
            {tile.sub}
          </p>
        </div>
      ))}
    </div>
  );
}


function FeedTabs() {
  const tabs = ['For You', 'Trades', 'Investments', 'Options Flow', 'Earnings'];
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e8', marginBottom: '10px' }}>
      {tabs.map((tab, i) => (
        <button
          key={tab}
          style={{
            padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '10px', fontWeight: i === 0 ? 600 : 500, fontFamily: 'Inter, sans-serif',
            color: i === 0 ? '#0047FF' : '#aaa',
            borderBottom: i === 0 ? '2px solid #0047FF' : '2px solid transparent',
            marginBottom: '-1px',
            transition: 'color 0.1s',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function Feed() {
  return (
    <main
      className="scrollbar-hide"
      style={{ gridColumn: 3, gridRow: 2, background: '#f5f5f7', overflowY: 'auto', height: 'calc(100vh - 52px)', padding: '16px 24px' }}
    >
      <div style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
        <StatBar />
        <ComposeBox />
        <FeedTabs />
        {DEMO_TRADES.map((post) => (
          <TradeCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

function RightPanel() {
  const rankColor = (rank: number) => rank === 1 ? '#f59e0b' : '#9ca3af';

  return (
    <aside
      className="scrollbar-hide"
      style={{
        gridColumn: 4, gridRow: 2,
        background: '#fff', borderLeft: '1px solid #ebebeb',
        position: 'sticky', top: '52px', height: 'calc(100vh - 52px)',
        overflowY: 'auto', padding: '12px 10px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}
    >
      {/* Leaderboard */}
      <section>
        <SectionLabel label="Top Traders" link="All →" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {DEMO_LEADERBOARD.map((entry, idx) => (
            <div key={entry.rank}>
              <div className="lb-row" style={{ padding: '8px 6px' }}>
                <span style={{ ...MONO, fontSize: '12px', fontWeight: 700, color: rankColor(entry.rank), width: '18px', textAlign: 'center', flexShrink: 0 }}>
                  {entry.rank}
                </span>
                <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: `linear-gradient(135deg, #0047FF, #60a5fa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  {entry.user.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...INTER, fontSize: '13px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.1 }} className="truncate">
                    {entry.user.name}
                  </p>
                  <p style={{ ...INTER, fontSize: '11px', color: '#bbb' }}>{entry.tradesCount} trades · {entry.investmentsCount} investments</p>
                </div>
                <span style={{ ...MONO, fontSize: '13px', fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>
                  +{entry.returnYTD}%
                </span>
              </div>
              {idx < DEMO_LEADERBOARD.length - 1 && (
                <div style={{ height: '1px', background: '#f5f5f5', margin: '1px 0' }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Trending — 3 columns */}
      <section>
        <SectionLabel label="Trending" link="See all →" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
          {DEMO_TRENDING.map((t) => {
            const isUp = t.changePct >= 0;
            return (
              <div key={t.ticker} className="trend-chip" style={{ padding: '9px 10px', borderRadius: '7px' }}>
                <p style={{ ...MONO, fontSize: '13px', fontWeight: 700, color: '#0a0a0a', marginBottom: '1px' }}>
                  {t.ticker}
                </p>
                <p style={{ ...MONO, fontSize: '12px', fontWeight: 700, color: isUp ? '#16a34a' : '#dc2626' }}>
                  {isUp ? '+' : ''}{t.changePct.toFixed(2)}%
                </p>
                <p style={{ ...INTER, fontSize: '11px', color: '#ccc', marginTop: '2px' }}>
                  {t.postCount >= 1000 ? `${(t.postCount / 1000).toFixed(1)}k` : t.postCount} posts
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Who to Follow */}
      <section>
        <SectionLabel label="Who to Follow" link="See all →" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {DEMO_SUGGESTED.map((user) => (
            <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 4px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, #0047FF, #60a5fa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                {user.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...INTER, fontSize: '13px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.1 }} className="truncate">
                  {user.name}
                </p>
                <p style={{ ...INTER, fontSize: '11px', color: '#bbb' }}>
                  @{user.username} · <span style={{ color: '#16a34a', fontWeight: 600 }}>+{user.returnYTD}%</span>
                </p>
              </div>
              <button className="follow-btn" style={{ fontSize: '11px', padding: '6px 14px' }}>FOLLOW</button>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '48px 220px 1fr 300px',
      gridTemplateRows: '52px 1fr',
      minHeight: '100vh',
      width: '100%',
    }}>
      <TopBar />
      <IconRail />
      <Sidebar />
      <Feed />
      <RightPanel />
    </div>
  );
}
