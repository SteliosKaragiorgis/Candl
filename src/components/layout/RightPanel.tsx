import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DEMO_LEADERBOARD, DEMO_TRENDING, SUGGESTED_USERS, alexKim, saraR } from '../../data/demo';
import { useTickerData } from '../../context/TickerDataContext';
import { useMarketData } from '../../context/MarketDataContext';
import NewsCountdown from './NewsCountdown';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
        color: 'var(--text-3)', textTransform: 'uppercase',
        marginBottom: '8px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function getHeatStyle(changeNum: number): React.CSSProperties {
  const abs = Math.abs(changeNum);
  if (changeNum > 0) {
    if (abs >= 3) return { background: 'rgba(22,163,74,0.20)', border: '1px solid rgba(22,163,74,0.28)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
    if (abs >= 1) return { background: 'rgba(22,163,74,0.11)', border: '1px solid rgba(22,163,74,0.18)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
    return { background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.12)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
  } else {
    if (abs >= 3) return { background: 'rgba(220,38,38,0.18)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
    if (abs >= 1) return { background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.16)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
    return { background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.10)', borderRadius: 9, padding: '9px 10px', cursor: 'pointer', transition: 'opacity 0.15s' };
  }
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

  // Build key stats: use real financials when available, fall back to static demo
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
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      padding: '14px 14px',
      overflowY: 'auto',
    }} className="scrollbar-hide">

      {/* KEY STATS */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 10 }}>
          Key Stats
        </div>
        {stats.map(s => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 0', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* CANDL SENTIMENT */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 10 }}>
          Candl Sentiment
        </div>
        {[
          { label: 'Bullish',  pct: sentiment.bull,    color: '#16a34a' },
          { label: 'Neutral',  pct: sentiment.neutral, color: '#6b7280' },
          { label: 'Bearish',  pct: sentiment.bear,    color: '#dc2626' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', width: 52, flexShrink: 0 }}>{row.label}</span>
            <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${row.pct}%`, height: '100%', background: row.color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: row.color, width: 30, textAlign: 'right' }}>
              {row.pct}%
            </span>
          </div>
        ))}
        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-3)', lineHeight: 1.5 }}>
          Based on {sentiment.posts.toLocaleString()} posts today<br />
          {sentiment.newBuys} new buy trades opened
        </div>
      </div>

      {/* RELATED TICKERS */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 10 }}>
          Related Tickers
        </div>
        {related.map(r => (
          <div
            key={r.ticker}
            onClick={() => navigate(`/ticker/${r.ticker}`)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{r.ticker}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{r.label}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{r.price}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: r.up ? '#16a34a' : '#dc2626', fontFamily: 'JetBrains Mono, monospace' }}>{r.change}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TOP TRADERS */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 10 }}>
          Top {ticker} Traders
        </div>
        {traders.map(t => (
          <div
            key={t.user.id}
            onClick={() => navigate(`/profile/${t.user.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${t.user.avatarGradient[0]}, ${t.user.avatarGradient[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 10, fontWeight: 700,
            }}>
              {t.user.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{t.user.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{t.posts} {ticker} posts · {t.style}</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-3)' }}>
              {t.user.followersCount >= 1000 ? `${(t.user.followersCount / 1000).toFixed(1)}K` : t.user.followersCount}
            </div>
          </div>
        ))}
      </div>

      {/* Alert CTA */}
      <button
        onClick={() => setAlertOpen(a => !a)}
        style={{
          width: '100%', padding: '11px', borderRadius: 10,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text)', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
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

  // Route-specific panel
  const tickerMatch = location.pathname.match(/^\/ticker\/([A-Z]+)$/i);
  if (tickerMatch) {
    return <TickerRightPanel ticker={tickerMatch[1].toUpperCase()} />;
  }

  return (
    <div style={{
      gridArea: 'right',
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      padding: '14px 14px',
      overflowY: 'auto',
    }} className="scrollbar-hide">

      {/* Most Followed */}
      <Section title="Most Followed">
        {DEMO_LEADERBOARD.map(entry => (
          <div key={entry.rank} className="lb-row" onClick={() => navigate(`/profile/${entry.user.id}`)}>
            <div style={{
              width: '16px', fontSize: '10px', fontWeight: 700,
              color: entry.rank === 1 ? '#f59e0b' : 'var(--text-3)',
              fontFamily: 'JetBrains Mono, monospace', flexShrink: 0, textAlign: 'center',
            }}>
              {entry.rank}
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${entry.user.avatarGradient[0]}, ${entry.user.avatarGradient[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '10px', fontWeight: 700,
            }}>
              {entry.user.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {entry.user.name}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text4)' }}>
                {entry.user.mostActive}
              </div>
            </div>
            <div style={{
              fontSize: '11px', fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text3)', flexShrink: 0,
            }}>
              {entry.followersCount >= 1000
                ? `${(entry.followersCount / 1000).toFixed(1)}K`
                : entry.followersCount}
            </div>
          </div>
        ))}
      </Section>

      {/* Trending */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 9, paddingBottom: 7, borderBottom: '1px solid var(--border2)',
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--text4)', textTransform: 'uppercase' }}>
            Trending
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', cursor: 'pointer' }}>
            See all →
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 14 }}>
          {DEMO_TRENDING.map(t => {
            const q = quotes[t.ticker];
            const changePct = q?.price > 0 ? q.changePct : t.changeNum;
            const changeStr = q?.price > 0
              ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
              : t.change;
            return (
            <div
              key={t.ticker}
              style={getHeatStyle(changePct)}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {t.ticker}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 3 }}>
                {t.posts}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: changePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {changeStr}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Economic Calendar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 9, paddingBottom: 7, borderBottom: '1px solid var(--border2)',
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 2,
            color: 'var(--text4)', textTransform: 'uppercase',
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
            padding: '5px 0', marginBottom: '4px',
          }}>
            <div
              style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${user.avatarGradient[0]}, ${user.avatarGradient[1]})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
              }}
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              {user.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
              <div style={{ fontSize: '9px', color: 'var(--text4)' }}>{user.mostActive}</div>
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
