import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { DEMO_LEADERBOARD, DEMO_TRENDING, SUGGESTED_USERS, alexKim, saraR } from '../../data/demo';
import { useTickerData } from '../../context/TickerDataContext';
import { useMarketData } from '../../context/MarketDataContext';
import NewsCountdown from './NewsCountdown';
import { useLeaderboard, useFirmStats, useTips } from '../../hooks/usePropFirmCommunity';
import { firmBadge } from '../propfirm/MilestonePost';
import TipCard from '../propfirm/TipCard';
import { useNewsArticles } from '../../hooks/useNewsArticles';
import { useAlphaVantageNews } from '../../hooks/useAlphaVantageNews';
import { useCryptoQuotes } from '../../hooks/useCryptoQuotes';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        fontSize: 10, fontWeight: 500, letterSpacing: '0.06em',
        color: 'var(--text-muted)', textTransform: 'uppercase',
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
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
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
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
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
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
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
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
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
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.posts} {ticker} posts · {t.style}</div>
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

function PropFirmRightPanel() {
  const navigate = useNavigate();
  const traders = useLeaderboard('month', 'consistency').slice(0, 4);
  const stats = useFirmStats();
  const tips = useTips('all').slice(0, 3);

  return (
    <div style={{
      gridArea: 'right',
      background: 'var(--bg)',
      borderLeft: '0.5px solid var(--border)',
      padding: '14px',
      overflowY: 'auto',
    }} className="scrollbar-hide">

      {/* ── This month — most consistent ── */}
      <div style={{ marginBottom: 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10,
        }}>
          This month — most consistent
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {traders.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', padding: '4px 0', marginBottom: 8,
            }}>
              <span style={{
                fontSize: 11, color: 'var(--text-hint)',
                fontVariantNumeric: 'tabular-nums', width: 14, flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg-surface)', border: '0.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 600, color: 'var(--text-muted)',
              }}>
                {t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {t.name}
                </div>
              </div>
              {firmBadge(t.firm)}
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--green)',
                fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 'auto',
              }}>
                +{t.pnlPercent.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/prop-firm?tab=leaderboard')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 11, color: 'var(--green)', fontFamily: 'inherit',
            marginTop: 6, display: 'block',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.75'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          See full leaderboard →
        </button>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '0.5px', background: 'var(--border-soft)', margin: '14px 0' }} />

      {/* ── Community pass rates ── */}
      <div>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10,
        }}>
          Community pass rates
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                  {s.firm} ${(s.accountSize / 1000).toFixed(0)}k
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                  {s.passRate}%
                </span>
              </div>
              <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
                <div style={{ height: '100%', width: `${s.passRate}%`, background: 'var(--green)', borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {s.attempts.toLocaleString()} attempts · avg {s.avgDays} days
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '0.5px', background: 'var(--border-soft)', margin: '14px 0' }} />

      {/* ── Top tips this week ── */}
      <div>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10,
        }}>
          Top tips this week
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tips.map(t => (
            <TipCard key={t.id} tip={t} compact />
          ))}
        </div>
        <button
          onClick={() => navigate('/prop-firm?tab=tips')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 11, color: 'var(--text-muted)', fontFamily: 'inherit',
            marginTop: 6, display: 'block',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
        >
          See all tips →
        </button>
      </div>
    </div>
  );
}

// ─── Static data shared with NewsPage ─────────────────────────────────────────

const UPCOMING_EVENTS_DATA: { name: string; impact: 'high' | 'medium' | 'low'; time: string }[] = [
  { name: 'FOMC Minutes',     impact: 'high',   time: 'Today, 2:00 PM ET' },
  { name: 'CPI Data Release', impact: 'high',   time: 'Tomorrow, 8:30 AM ET' },
  { name: 'NVDA Earnings',    impact: 'medium', time: 'May 22, After Close' },
  { name: 'PCE Price Index',  impact: 'medium', time: 'May 23, 8:30 AM ET' },
  { name: 'Apple WWDC',       impact: 'low',    time: 'Jun 9, 10:00 AM PT' },
]

const TICKER_NAMES_MAP: Record<string, string> = {
  NVDA: 'NVIDIA Corp',    TSLA: 'Tesla Inc',      AAPL: 'Apple Inc',
  MSFT: 'Microsoft',      AMZN: 'Amazon.com',     GOOGL: 'Alphabet',
  META: 'Meta Platforms', COIN: 'Coinbase',        AMD: 'Adv. Micro Dev.',
  MSTR: 'MicroStrategy',  SPY: 'S&P 500 ETF',     QQQ: 'Nasdaq ETF',
  GLD: 'Gold ETF',        USO: 'Oil ETF',          BTC: 'Bitcoin',
  ETH: 'Ethereum',        SOL: 'Solana',           XRP: 'XRP',
  DOGE: 'Dogecoin',       TLT: 'Bond ETF',         COPX: 'Copper ETF',
}

function NewsRightPanel() {
  const { items: finnhubItems } = useNewsArticles();
  const avItems = useAlphaVantageNews();
  const { quotes: stockQuotes } = useMarketData();
  const cryptoQuotes = useCryptoQuotes();

  const quotes = useMemo(
    () => ({ ...stockQuotes, ...cryptoQuotes }),
    [stockQuotes, cryptoQuotes],
  );

  const allItems = useMemo(() => {
    const seen = new Set<number>();
    const merged = [];
    for (const item of [...finnhubItems, ...avItems]) {
      if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
    }
    return merged;
  }, [finnhubItems, avItems]);

  // Trending tickers — count mentions across recent articles
  const trendingTickers = useMemo(() => {
    const counts = new Map<string, { count: number; change: number }>();
    for (const item of allItems.slice(0, 60)) {
      const syms = item.related
        ? item.related.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      for (const sym of syms) {
        const ex = counts.get(sym);
        if (ex) ex.count++;
        else counts.set(sym, { count: 1, change: quotes[sym]?.changePct ?? 0 });
      }
    }
    const result = Array.from(counts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([symbol, { count, change }]) => ({
        symbol, stories: count,
        change: quotes[symbol]?.changePct ?? change,
      }));
    return result.length >= 3 ? result : [
      { symbol: 'NVDA', stories: 24, change: +4.21 },
      { symbol: 'TSLA', stories: 18, change: -2.14 },
      { symbol: 'AAPL', stories: 15, change: +0.87 },
      { symbol: 'META', stories: 11, change: +1.54 },
      { symbol: 'BTC',  stories:  9, change: +3.12 },
    ];
  }, [allItems, quotes]);

  // Top movers from live quotes
  const topMovers = useMemo(() => {
    const entries = Object.entries(quotes)
      .filter(([, q]) => q.price > 0 && Math.abs(q.changePct) > 0)
      .sort((a, b) => Math.abs(b[1].changePct) - Math.abs(a[1].changePct))
      .slice(0, 5)
      .map(([symbol, q], i) => ({
        rank: i + 1, symbol,
        name: TICKER_NAMES_MAP[symbol] ?? symbol,
        change: q.changePct,
      }));
    return entries.length >= 3 ? entries : [
      { rank: 1, symbol: 'NVDA', name: 'NVIDIA Corp',  change: +4.21 },
      { rank: 2, symbol: 'TSLA', name: 'Tesla Inc',    change: -2.14 },
      { rank: 3, symbol: 'GME',  name: 'GameStop',     change: +8.93 },
      { rank: 4, symbol: 'AAPL', name: 'Apple Inc',    change: +0.87 },
      { rank: 5, symbol: 'COIN', name: 'Coinbase',     change: -3.41 },
    ];
  }, [quotes]);

  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: 'var(--text-4)',
    letterSpacing: '0.07em', textTransform: 'uppercase',
    marginBottom: 10,
  };
  const card: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '0.5px solid var(--border)',
    borderRadius: 8, padding: 12, marginBottom: 10,
  };

  return (
    <div style={{
      gridArea: 'right',
      background: 'var(--bg)',
      borderLeft: '0.5px solid var(--border)',
      padding: '14px',
      overflowY: 'auto',
    }} className="scrollbar-hide">

      {/* Trending in your watchlist */}
      <div style={card}>
        <div style={sectionLabel}>Trending in your watchlist</div>
        {trendingTickers.map((t, i) => (
          <div key={t.symbol} style={{
            display: 'flex', alignItems: 'center',
            padding: '6px 0',
            borderBottom: i < trendingTickers.length - 1
              ? '0.5px solid var(--border-soft)' : 'none',
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', width: 44 }}>
              {t.symbol}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-4)', flex: 1 }}>
              {t.stories} {t.stories === 1 ? 'story' : 'stories'}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 500,
              color: t.change >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Today's market movers */}
      <div style={card}>
        <div style={sectionLabel}>Today's market movers</div>
        {topMovers.map((m, i) => (
          <div key={m.symbol} style={{
            display: 'flex', alignItems: 'center',
            padding: '5px 0',
            borderBottom: i < topMovers.length - 1
              ? '0.5px solid var(--border-soft)' : 'none',
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-4)', width: 14 }}>{m.rank}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', width: 42 }}>
              {m.symbol}
            </span>
            <span style={{
              fontSize: 11, color: 'var(--text-3)', flex: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {m.name}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: m.change >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Upcoming events */}
      <div style={card}>
        <div style={sectionLabel}>Upcoming events</div>
        {UPCOMING_EVENTS_DATA.map((ev, i) => (
          <div key={ev.name} style={{
            padding: '6px 0',
            borderBottom: i < UPCOMING_EVENTS_DATA.length - 1
              ? '0.5px solid var(--border-soft)' : 'none',
            cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                {ev.name}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700,
                padding: '1px 5px', borderRadius: 3,
                background: ev.impact === 'high'
                  ? 'var(--red-bg)'
                  : ev.impact === 'medium'
                    ? 'var(--amber-bg)'
                    : 'var(--bg-surface)',
                color: ev.impact === 'high'
                  ? 'var(--red)'
                  : ev.impact === 'medium'
                    ? 'var(--amber)'
                    : 'var(--text-3)',
                border: `0.5px solid ${ev.impact === 'high'
                  ? 'var(--red-border)'
                  : ev.impact === 'medium'
                    ? 'var(--amber-border)'
                    : 'var(--border)'}`,
              }}>
                {ev.impact.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{ev.time}</div>
          </div>
        ))}
      </div>

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

  if (location.pathname === '/prop-firm') {
    return <PropFirmRightPanel />;
  }

  if (location.pathname.startsWith('/news')) {
    return <NewsRightPanel />;
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
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Trending
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: isLight ? '#16a34a' : 'var(--blue)', cursor: 'pointer' }}>
            See all →
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 12 }}>
          {DEMO_TRENDING.map(t => {
            const q = quotes[t.ticker];
            const changePct = q?.price > 0 ? q.changePct : t.changeNum;
            const changeStr = q?.price > 0
              ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
              : t.change;
            const isPos = changePct >= 0;
            const intensity = Math.min(Math.abs(changePct) / 5, 1);

            let bg: string;
            let tickerColor: string;
            let postColor: string;
            let changeColor: string;

            if (isLight) {
              const lightness = Math.round(96 - intensity * 52);
              const hue = isPos ? 142 : 0;
              const sat = isPos ? 71 : 84;
              bg = `hsl(${hue}, ${sat}%, ${lightness}%)`;
              const highIntensity = intensity > 0.45;
              tickerColor  = highIntensity ? '#ffffff' : (isPos ? '#14532d' : '#7f1d1d');
              postColor    = highIntensity ? 'rgba(255,255,255,0.65)' : (isPos ? '#16a34a' : '#b91c1c');
              changeColor  = highIntensity ? '#ffffff' : (isPos ? '#14532d' : '#7f1d1d');
            } else {
              const alpha = 0.14 + intensity * 0.56;
              bg = isPos ? `rgba(34,197,94,${alpha})` : `rgba(239,68,68,${alpha})`;
              const highIntensity = intensity > 0.5;
              tickerColor  = highIntensity ? '#ffffff' : 'var(--text)';
              postColor    = 'rgba(255,255,255,0.38)';
              changeColor  = highIntensity ? '#ffffff' : (isPos ? '#4ade80' : '#f87171');
            }

            return (
              <div
                key={t.ticker}
                onClick={() => navigate(`/ticker/${t.ticker}`)}
                style={{
                  background: bg,
                  borderRadius: 4, padding: '8px 8px 7px',
                  cursor: 'pointer', transition: 'filter 0.12s',
                  border: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.93)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: tickerColor, marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {t.ticker}
                </div>
                <div style={{ fontSize: 10, color: postColor, marginBottom: 4 }}>
                  {t.posts}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: changeColor, fontVariantNumeric: 'tabular-nums' }}>
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
            color: 'var(--text-muted)', textTransform: 'uppercase',
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
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.mostActive}</div>
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
