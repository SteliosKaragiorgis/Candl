import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DEMO_LEADERBOARD, DEMO_TRENDING, SUGGESTED_USERS, alexKim, saraR } from '../../data/demo';
import { useTickerData } from '../../context/TickerDataContext';
import { useMarketData } from '../../context/MarketDataContext';
import NewsCountdown from './NewsCountdown';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        fontSize: 10, fontWeight: 500, letterSpacing: '0.06em',
        color: '#555555', textTransform: 'uppercase',
        marginBottom: '8px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Ticker-specific right panel data ─────────────────────────────────────────

const TICKER_STATS: Record<string, { label: string; value: string }[]> = {
  NVDA: [
    { label: 'P/E ratio',       value: '54.2×'     },
    { label: 'EPS (TTM)',       value: '$16.28'    },
    { label: 'Revenue (TTM)',   value: '$79.7B'    },
    { label: 'Gross margin',    value: '74.6%'     },
    { label: 'Next earnings',   value: 'May 22'    },
    { label: 'Analyst target',  value: '$1,041 avg'},
  ],
  TSLA: [
    { label: 'P/E ratio',       value: '62.1×'     },
    { label: 'EPS (TTM)',       value: '$2.77'     },
    { label: 'Revenue (TTM)',   value: '$25.2B'    },
    { label: 'Gross margin',    value: '17.9%'     },
    { label: 'Next earnings',   value: 'Apr 22'    },
    { label: 'Analyst target',  value: '$198 avg'  },
  ],
  META: [
    { label: 'P/E ratio',       value: '26.4×'     },
    { label: 'EPS (TTM)',       value: '$18.37'    },
    { label: 'Revenue (TTM)',   value: '$40.1B'    },
    { label: 'Gross margin',    value: '80.2%'     },
    { label: 'Next earnings',   value: 'Apr 30'    },
    { label: 'Analyst target',  value: '$520 avg'  },
  ],
};

const TICKER_RELATED: Record<string, { ticker: string; label: string; price: string; change: string; up: boolean }[]> = {
  NVDA: [
    { ticker: 'AMD',  label: 'Moves with NVDA',  price: '$162.50', change: '+1.88%', up: true  },
    { ticker: 'SMCI', label: 'AI infrastructure',price: '$38.20',  change: '+2.41%', up: true  },
    { ticker: 'TSM',  label: 'Supplier',          price: '$174.60', change: '+0.92%', up: true  },
    { ticker: 'MRVL', label: 'Custom silicon',    price: '$64.30',  change: '-0.44%', up: false },
  ],
  TSLA: [
    { ticker: 'RIVN', label: 'EV peer',          price: '$14.20',  change: '-2.11%', up: false },
    { ticker: 'GM',   label: 'ICE competitor',   price: '$48.10',  change: '+0.34%', up: true  },
    { ticker: 'NIO',  label: 'EV competitor',    price: '$6.40',   change: '-1.88%', up: false },
    { ticker: 'LCID', label: 'EV peer',          price: '$3.12',   change: '-3.21%', up: false },
  ],
  META: [
    { ticker: 'GOOGL', label: 'Ad revenue peer', price: '$172.40', change: '+0.64%', up: true  },
    { ticker: 'SNAP',  label: 'Social media',    price: '$8.90',   change: '-1.12%', up: false },
    { ticker: 'PINS',  label: 'Social commerce', price: '$28.40',  change: '+1.45%', up: true  },
    { ticker: 'TTD',   label: 'Ad tech',         price: '$82.10',  change: '+2.33%', up: true  },
  ],
};

const TICKER_TOP_TRADERS: Record<string, { user: typeof alexKim; posts: number; style: string }[]> = {
  NVDA: [
    { user: alexKim, posts: 14, style: 'mostly long' },
    { user: saraR,   posts:  8, style: 'macro angle' },
    { user: { ...alexKim, id: 'u3', name: 'Mike W.', username: 'optionsmike', initials: 'MW', avatarGradient: ['#10b981','#0d9488'], followersCount: 21000, verified: false } as typeof alexKim, posts: 6, style: 'options' },
  ],
  TSLA: [
    { user: saraR,   posts: 11, style: 'macro angle' },
    { user: alexKim, posts:  7, style: 'swing trades' },
    { user: { ...alexKim, id: 'u4', name: 'Jamie T.', username: 'longonlyjt', initials: 'JT', avatarGradient: ['#f97316','#d97706'], followersCount: 3140, verified: false } as typeof alexKim, posts: 4, style: 'long only' },
  ],
  META: [
    { user: alexKim, posts: 9, style: 'swing trades' },
    { user: saraR,   posts: 6, style: 'macro angle'  },
    { user: { ...alexKim, id: 'u5', name: 'Kay L.', username: 'kayltrading', initials: 'KL', avatarGradient: ['#06b6d4','#0284c7'], followersCount: 2210, verified: false } as typeof alexKim, posts: 3, style: 'quant signals' },
  ],
};

const TICKER_SENTIMENT: Record<string, { bull: number; neutral: number; bear: number; posts: number; newBuys: number }> = {
  NVDA: { bull: 78, neutral: 14, bear: 8,  posts: 1420, newBuys: 284 },
  TSLA: { bull: 34, neutral: 22, bear: 44, posts: 874,  newBuys: 39  },
  META: { bull: 68, neutral: 20, bear: 12, posts: 611,  newBuys: 91  },
};

function TickerRightPanel({ ticker }: { ticker: string }) {
  const navigate = useNavigate();
  const { financials } = useTickerData();

  const demoStats = TICKER_STATS[ticker] ?? TICKER_STATS.NVDA;
  const stats: { label: string; value: string }[] = financials
    ? [
        { label: 'P/E ratio',      value: financials.pe            },
        { label: 'EPS (TTM)',      value: financials.eps           },
        { label: 'Revenue (TTM)', value: financials.revenue       },
        { label: 'Gross margin',  value: financials.grossMargin   },
        { label: 'Next earnings', value: financials.nextEarnings  },
        { label: 'Analyst target',value: financials.analystTarget },
      ]
    : demoStats;

  const related   = TICKER_RELATED[ticker]     ?? TICKER_RELATED.NVDA;
  const traders   = TICKER_TOP_TRADERS[ticker] ?? TICKER_TOP_TRADERS.NVDA;
  const sentiment = TICKER_SENTIMENT[ticker]   ?? TICKER_SENTIMENT.NVDA;

  return (
    <div style={{
      gridArea: 'right',
      background: 'var(--bg)',
      borderLeft: '0.5px solid var(--border)',
      padding: '14px',
      overflowY: 'auto',
    }} className="scrollbar-hide">

      {/* KEY STATS */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: '#555555', textTransform: 'uppercase', marginBottom: 8 }}>
          Key Stats
        </div>
        {stats.map(s => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 0', borderBottom: 'var(--bw) solid var(--border-subtle)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* CANDL SENTIMENT */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: '#555555', textTransform: 'uppercase', marginBottom: 8 }}>
          Candl Sentiment
        </div>
        {[
          { label: 'Bullish',  pct: sentiment.bull,    color: 'var(--green)' },
          { label: 'Neutral',  pct: sentiment.neutral, color: 'var(--text-3)' },
          { label: 'Bearish',  pct: sentiment.bear,    color: 'var(--red)' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', width: 52, flexShrink: 0 }}>{row.label}</span>
            <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${row.pct}%`, height: '100%', background: row.color }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, color: row.color, width: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {row.pct}%
            </span>
          </div>
        ))}
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-4)', lineHeight: 1.5 }}>
          Based on {sentiment.posts.toLocaleString()} posts today<br />
          {sentiment.newBuys} new buy trades opened
        </div>
      </div>

      {/* RELATED TICKERS */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: '#555555', textTransform: 'uppercase', marginBottom: 8 }}>
          Related Tickers
        </div>
        {related.map(r => (
          <div
            key={r.ticker}
            onClick={() => navigate(`/ticker/${r.ticker}`)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: 'var(--bw) solid var(--border-subtle)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{r.ticker}</div>
              <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{r.label}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{r.price}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: r.up ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>{r.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TOP TRADERS */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: '#555555', textTransform: 'uppercase', marginBottom: 8 }}>
          Top {ticker} Traders
        </div>
        {traders.map(t => (
          <div
            key={t.user.id}
            onClick={() => navigate(`/profile/${t.user.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: 'var(--bw) solid var(--border-subtle)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--border)', border: 'var(--bw) solid var(--border-emphasis)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', fontSize: 9, fontWeight: 500,
            }}>
              {t.user.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#c8c8c8' }}>{t.user.name}</div>
              <div style={{ fontSize: 10, color: '#555555' }}>{t.posts} {ticker} posts · {t.style}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#666666', fontVariantNumeric: 'tabular-nums' }}>
              {t.user.followersCount >= 1000 ? `${(t.user.followersCount / 1000).toFixed(1)}K` : t.user.followersCount}
            </div>
          </div>
        ))}
      </div>

      {/* Alert CTA */}
      <button
        onClick={() => {}}
        style={{
          width: '100%', padding: '8px',
          background: 'transparent', border: 'var(--bw) solid var(--border)',
          borderRadius: 4, color: 'var(--text-4)', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-emphasis)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        Set price alert for {ticker}
      </button>
    </div>
  );
}

export default function RightPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const { quotes } = useMarketData();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const tickerMatch = location.pathname.match(/^\/ticker\/([A-Z]+)$/i);
  if (tickerMatch) {
    return <TickerRightPanel ticker={tickerMatch[1].toUpperCase()} />;
  }

  return (
    <div style={{
      gridArea: 'right',
      background: 'var(--bg)',
      borderLeft: '0.5px solid var(--border)',
      padding: '14px',
      overflowY: 'auto',
    }} className="scrollbar-hide">

      {/* Most Followed */}
      <Section title="Most Followed">
        {DEMO_LEADERBOARD.map(entry => (
          <div key={entry.rank} className="lb-row" onClick={() => navigate(`/profile/${entry.user.id}`)}>
            <div style={{
              width: '14px', fontSize: 10, fontWeight: 500,
              color: entry.rank === 1 ? 'var(--gold)' : 'var(--text-4)',
              fontVariantNumeric: 'tabular-nums', flexShrink: 0, textAlign: 'center',
            }}>
              {entry.rank}
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--border)', border: 'var(--bw) solid var(--border-emphasis)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', fontSize: 9, fontWeight: 500,
            }}>
              {entry.user.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#c8c8c8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.user.name}
              </div>
              <div style={{ fontSize: 10, color: '#555555' }}>
                {entry.user.mostActive}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: '#666666', flexShrink: 0 }}>
              {entry.followersCount >= 1000
                ? `${(entry.followersCount / 1000).toFixed(1)}K`
                : entry.followersCount}
            </div>
          </div>
        ))}
      </Section>

      {/* Trending */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8, paddingBottom: 6, borderBottom: 'var(--bw) solid var(--border-subtle)',
        }}>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: '#555555', textTransform: 'uppercase' }}>
            Trending
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: isLight ? '#16a34a' : 'var(--blue)', cursor: 'pointer' }}>
            See all →
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginBottom: 12 }}>
          {DEMO_TRENDING.map(t => {
            const q = quotes[t.ticker];
            const changePct = q?.price > 0 ? q.changePct : t.changeNum;
            const changeStr = q?.price > 0
              ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
              : t.change;
            const isPos = changePct >= 0;
            // heat map (dark mode only): clamp intensity 0–1 over ±5%
            const intensity = Math.min(Math.abs(changePct) / 5, 1);
            const alpha = 0.12 + intensity * 0.38;
            const heatBg = isLight
              ? '#f9fafb'
              : isPos ? `rgba(34,197,94,${alpha})` : `rgba(239,68,68,${alpha})`;
            const heatBorder = isLight
              ? '#e8e8e8'
              : isPos ? `rgba(34,197,94,${alpha + 0.15})` : `rgba(239,68,68,${alpha + 0.15})`;
            return (
              <div
                key={t.ticker}
                onClick={() => navigate(`/ticker/${t.ticker}`)}
                style={{
                  background: heatBg,
                  border: `0.5px solid ${heatBorder}`,
                  borderRadius: 4, padding: '7px 8px',
                  cursor: 'pointer', transition: 'filter 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.97)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >
                <div style={{ fontSize: 12, fontWeight: 500, color: isLight ? '#111111' : 'var(--text)', marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {t.ticker}
                </div>
                <div style={{ fontSize: 10, color: isLight ? '#888888' : 'rgba(255,255,255,0.4)', marginBottom: 3 }}>
                  {t.posts}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: isPos ? (isLight ? '#16a34a' : '#4ade80') : (isLight ? '#dc2626' : '#f87171'), fontVariantNumeric: 'tabular-nums' }}>
                  {changeStr}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Economic Calendar */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8, paddingBottom: 6, borderBottom: 'var(--bw) solid var(--border-subtle)',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 500, letterSpacing: '0.06em',
            color: '#555555', textTransform: 'uppercase',
          }}>
            Economic Calendar
          </span>
        </div>
        <NewsCountdown />
      </div>

      {/* Who to follow */}
      <Section title="Who to Follow">
        {SUGGESTED_USERS.map(user => (
          <div key={user.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 0', marginBottom: '3px',
          }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'var(--border)', border: 'var(--bw) solid var(--border-emphasis)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-3)', fontSize: 9, fontWeight: 500, cursor: 'pointer',
              }}
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              {user.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#c8c8c8' }}>{user.name}</div>
              <div style={{ fontSize: 10, color: '#555555' }}>{user.mostActive}</div>
            </div>
            <button
              className={`follow-btn ${followed[user.id] ? 'follow-btn-active' : ''}`}
              onClick={() => setFollowed(f => ({ ...f, [user.id]: !f[user.id] }))}
            >
              {followed[user.id] ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </Section>
    </div>
  );
}
