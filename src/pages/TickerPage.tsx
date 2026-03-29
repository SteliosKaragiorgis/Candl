import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DEMO_POSTS, NEWS_ITEMS, alexKim, saraR } from '../data/demo';
import { useMobile } from '../hooks/useMobile';
import { useMarketData } from '../context/MarketDataContext';
import { useTickerData } from '../context/TickerDataContext';
import {
  useTickerCandles, useCompanyProfile, useBasicFinancials, useRealtimePrice,
  candlesToSvgPoints, type Timeframe,
} from '../hooks/useTickerDetail';
import TradeCard from '../components/feed/TradeCard';
import CommentaryCard from '../components/feed/CommentaryCard';

type ContentTab = 'news' | 'posts' | 'trades' | 'commentary';

// ── Demo fallback data ────────────────────────────────────────────────────────

const DEMO_META: Record<string, {
  name: string; exchange: string; sector: string;
  sentimentBull: number; sentimentNeutral: number; sentimentBear: number;
  totalPosts: number; newBuyTrades: number; volume: string;
  chartFallback: Record<Timeframe, string>;
}> = {
  NVDA: {
    name: 'Nvidia Corporation', exchange: 'NASDAQ', sector: 'Technology',
    sentimentBull: 78, sentimentNeutral: 14, sentimentBear: 8,
    totalPosts: 1420, newBuyTrades: 284, volume: '48.2M',
    chartFallback: {
      '1D':  '0,78 20,76 40,77 60,74 80,72 100,70 120,65 140,52 160,30 180,24 200,28 220,25 240,22 260,20 280,22 300,24 320,21 340,19 360,17 380,18 400,16 420,15 440,17 460,15 480,14 520,13',
      '5D':  '0,60 65,52 130,46 195,42 260,50 325,36 390,26 455,20 520,14',
      '1M':  '0,80 65,72 130,65 195,55 260,46 325,38 390,30 455,22 520,14',
      '3M':  '0,90 65,78 130,70 195,62 260,52 325,44 390,34 455,24 520,14',
      '6M':  '0,95 65,85 130,78 195,68 260,58 325,48 390,38 455,25 520,14',
      '1Y':  '0,95 65,88 130,82 195,74 260,64 325,54 390,44 455,28 520,14',
      'All': '0,99 65,90 130,80 195,65 260,55 325,40 390,30 455,20 520,14',
    },
  },
  TSLA: {
    name: 'Tesla Inc', exchange: 'NASDAQ', sector: 'Consumer Discretionary',
    sentimentBull: 34, sentimentNeutral: 22, sentimentBear: 44,
    totalPosts: 874, newBuyTrades: 39, volume: '92.1M',
    chartFallback: {
      '1D':  '0,20 20,22 40,21 60,24 80,28 100,32 120,38 140,50 160,62 180,68 200,72 220,74 240,76 260,78 280,80 300,78 320,79 340,81 360,82 380,84 400,82 420,85 440,83 460,86 480,87 520,88',
      '5D':  '0,30 65,40 130,50 195,62 260,55 325,68 390,75 455,82 520,88',
      '1M':  '0,20 65,30 130,40 195,50 260,60 325,65 390,72 455,82 520,88',
      '3M':  '0,10 65,25 130,38 195,50 260,60 325,68 390,76 455,84 520,88',
      '6M':  '0,10 65,20 130,35 195,50 260,62 325,70 390,78 455,84 520,88',
      '1Y':  '0,10 65,18 130,30 195,45 260,58 325,68 390,76 455,84 520,88',
      'All': '0,5 65,15 130,28 195,42 260,55 325,65 390,74 455,84 520,88',
    },
  },
};

const DEMO_EXTRA_NEWS: Record<string, {
  id: string; source: string; sourceColor: string; headline: string;
  time: string; category: string; before: number; after: number;
  changePct: string; up: boolean;
}[]> = {
  NVDA: [{
    id: 'xn1', source: 'CNBC', sourceColor: '#005594',
    headline: 'Goldman Sachs raises NVDA price target to $1,100 — data center demand upgrade for 2026',
    time: 'Today · 07:22 EST', category: 'Analyst upgrade',
    before: 858.00, after: 864.40, changePct: '+0.74%', up: true,
  }],
};

// ── Chart component ───────────────────────────────────────────────────────────

function IntraChart({ points, up, loading }: { points: string; up: boolean; loading?: boolean }) {
  const stroke = up ? '#16a34a' : '#dc2626';
  if (loading || !points) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${stroke}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const pts = points.split(' ');
  const lastPt = pts[pts.length - 1].split(',');
  const lastX = parseFloat(lastPt[0]);
  const lastY = parseFloat(lastPt[1]);
  const fillPath = `M ${points.replace(/ /g, ' L ')} L 520,100 L 0,100 Z`;

  return (
    <svg viewBox="0 0 520 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={`chartfill-${up ? 'up' : 'dn'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#chartfill-${up ? 'up' : 'dn'})`} />
      <polyline points={points} stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3.5" fill={stroke} />
    </svg>
  );
}

function MiniSparkline({ points, up }: { points: string; up: boolean }) {
  return (
    <svg viewBox="0 0 128 32" preserveAspectRatio="none" style={{ width: '100%', height: 32, display: 'block' }}>
      <polyline
        points={points}
        stroke={up ? '#16a34a' : '#dc2626'}
        strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TickerPage() {
  const { symbol = 'NVDA' } = useParams<{ symbol: string }>();
  const ticker = symbol.toUpperCase();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [tab, setTab] = useState<ContentTab>('news');
  const [watching, setWatching] = useState(true);

  // ── Data sources ────────────────────────────────────────────────────────────
  const { quotes } = useMarketData();
  const q = quotes[ticker];

  const { candles, loading: candlesLoading } = useTickerCandles(ticker, timeframe);
  const { profile }      = useCompanyProfile(ticker);
  const { financials }   = useBasicFinancials(ticker);
  const realtimePrice    = useRealtimePrice(ticker, q?.price ?? 0);

  // Share with RightPanel via context
  const { setTickerData, clearTickerData } = useTickerData();

  useEffect(() => {
    setTickerData({
      symbol: ticker,
      profile,
      financials,
      realtimePrice,
      priceChange:    q?.change    ?? 0,
      priceChangePct: q?.changePct ?? 0,
    });
  }, [ticker, profile, financials, realtimePrice, q?.change, q?.changePct]);

  useEffect(() => () => clearTickerData(), []);

  // ── Derived display values ──────────────────────────────────────────────────
  const demo = DEMO_META[ticker] ?? DEMO_META.NVDA;

  const displayPrice  = realtimePrice > 0 ? realtimePrice : (q?.price  ?? 0);
  const displayChange = q?.change    ?? 0;
  const displayPct    = q?.changePct ?? 0;
  const displayOpen   = q?.open      ?? 0;
  const displayHigh   = q?.high      ?? 0;
  const displayLow    = q?.low       ?? 0;
  const up = displayPct >= 0;
  const changeColor = up ? '#16a34a' : '#dc2626';

  // Volume from candle data (sum for 1D, or last candle volume)
  const candleVolume = candles.length
    ? timeframe === '1D'
      ? (candles.reduce((s, c) => s + c.volume, 0) / 1e6).toFixed(1) + 'M'
      : (candles[candles.length - 1].volume / 1e6).toFixed(1) + 'M'
    : demo.volume;

  const svgPoints = candles.length
    ? candlesToSvgPoints(candles)
    : demo.chartFallback[timeframe];

  const displayName     = profile?.name     ?? demo.name;
  const displayExchange = profile?.exchange ?? demo.exchange;
  const displaySector   = profile?.sector   ?? demo.sector;

  // ── Posts / news data ───────────────────────────────────────────────────────
  const tickerPosts = DEMO_POSTS.filter(p =>
    ('ticker' in p && p.ticker === ticker)
  );
  const primaryNews  = NEWS_ITEMS.filter(n => n.ticker === ticker);
  const extraNews    = DEMO_EXTRA_NEWS[ticker] ?? [];

  const timeframes: Timeframe[] = ['1D', '5D', '1M', '3M', '6M', '1Y', 'All'];

  const contentTabs: { id: ContentTab; label: string; count: number }[] = [
    { id: 'news',       label: 'News & catalysts', count: primaryNews.length + extraNews.length },
    { id: 'posts',      label: 'Trader posts',     count: demo.totalPosts },
    { id: 'trades',     label: 'Trades',           count: demo.newBuyTrades },
    { id: 'commentary', label: 'Commentary',       count: 891 },
  ];

  return (
    <div style={{ padding: isMobile ? '12px 10px 40px' : '0 0 40px', background: 'var(--bg)', minHeight: '100%' }}>

      {/* ── Header card ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', marginBottom: 16,
      }}>
        {/* Breadcrumb */}
        <div style={{ padding: '12px 18px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => navigate('/watchlist')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: 'var(--text-3)' }}
          >
            Watchlist
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>›</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>{ticker}</span>
        </div>

        {/* Identity row */}
        <div style={{ padding: '10px 18px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
              {ticker}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.6 }}>
              {displayName} · {displayExchange} · {displaySector}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#16a34a' }}>
                {demo.sentimentBull}%
              </span>
              <div style={{ fontSize: 9, color: 'var(--text-3)' }}>bullish</div>
            </div>
            <button
              onClick={() => setWatching(w => !w)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                background: watching ? 'rgba(22,163,74,0.12)' : 'var(--surface2)',
                border: `1.5px solid ${watching ? '#16a34a' : 'var(--border)'}`,
                color: watching ? '#16a34a' : 'var(--text)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {watching ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Watching
                </>
              ) : '+ Watch'}
            </button>
          </div>
        </div>

        {/* Price */}
        <div style={{ padding: '0 18px 14px' }}>
          <div style={{
            fontSize: isMobile ? 32 : 42, fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)', lineHeight: 1,
            transition: 'color 0.3s',
          }}>
            {displayPrice > 0 ? `$${displayPrice.toFixed(2)}` : '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: changeColor, fontFamily: 'JetBrains Mono, monospace' }}>
              {displayChange >= 0 ? '+' : ''}${Math.abs(displayChange).toFixed(2)}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
              background: up ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
              color: changeColor, fontFamily: 'JetBrains Mono, monospace',
            }}>
              {displayPct >= 0 ? '+' : ''}{displayPct.toFixed(2)}%
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              · Vol {candleVolume} · Market open
            </span>
          </div>
        </div>

        {/* Timeframe tabs */}
        <div style={{ padding: '0 18px 10px', display: 'flex', gap: 2, overflowX: 'auto' }} className="scrollbar-hide">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: timeframe === tf ? 'var(--blue)' : 'transparent',
                color: timeframe === tf ? '#fff' : 'var(--text-3)',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div style={{ height: isMobile ? 120 : 160, position: 'relative' }}>
          <IntraChart points={svgPoints} up={up} loading={candlesLoading && candles.length === 0} />
        </div>

        {/* OHLV */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid var(--border)', padding: '12px 18px', gap: 8,
        }}>
          {[
            { label: 'OPEN', value: displayOpen > 0 ? `$${displayOpen.toFixed(2)}` : '—', color: 'var(--text)' },
            { label: 'HIGH', value: displayHigh > 0 ? `$${displayHigh.toFixed(2)}` : '—', color: '#16a34a' },
            { label: 'LOW',  value: displayLow  > 0 ? `$${displayLow.toFixed(2)}`  : '—', color: '#dc2626' },
            { label: 'VOL',  value: candleVolume, color: 'var(--text)' },
          ].map(col => (
            <div key={col.label}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 3 }}>
                {col.label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: col.color }}>
                {col.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content tabs ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16, overflowX: 'auto' }} className="scrollbar-hide">
        {contentTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? 'var(--blue)' : 'var(--text-3)',
              borderBottom: `2px solid ${tab === t.id ? 'var(--blue)' : 'transparent'}`,
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
            <span style={{
              marginLeft: 6, fontSize: 10, fontWeight: 700,
              padding: '1px 6px', borderRadius: 10,
              background: tab === t.id ? 'rgba(59,130,246,0.15)' : 'var(--surface)',
              color: tab === t.id ? 'var(--blue)' : 'var(--text-3)',
            }}>
              {t.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {tab === 'news' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {primaryNews.map(item => {
            const reactions = tickerPosts.slice(0, 2);
            return (
              <div key={item.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: item.sourceColor, color: '#fff', letterSpacing: 0.5 }}>
                      {item.source}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {item.time.replace('Today, ', 'Today · ')}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-4)' }}>· {item.category}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.55, margin: '0 0 12px' }}>
                    {item.headline}
                  </p>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 8, marginBottom: 10,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Impact</span>
                    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-2)' }}>${item.priceBefore.toFixed(2)}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>${item.priceAfter.toFixed(2)}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                      background: item.up ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                      color: item.up ? '#16a34a' : '#dc2626', fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {item.changePct} in {item.timeAgo}
                    </span>
                  </div>
                  <div style={{ height: 40, marginBottom: 6 }}>
                    <MiniSparkline points={item.sparkline} up={item.up} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', marginBottom: 12 }}>
                    {ticker} intraday · news marker at ↑
                  </div>
                </div>
                {reactions.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <div style={{ padding: '10px 16px 6px', fontSize: 11, color: 'var(--text-3)' }}>
                      {reactions.length} trader reaction{reactions.length !== 1 ? 's' : ''} to this story
                    </div>
                    {reactions.map(post => (
                      <div key={post.id} style={{ padding: '0 16px 12px' }}>
                        {post.postType === 'trade' ? <TradeCard post={post} /> : <CommentaryCard post={post} />}
                      </div>
                    ))}
                    <div style={{ padding: '8px 16px 12px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--blue)' }}>
                        See all reactions →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {extraNews.map(item => (
            <div key={item.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: item.sourceColor, color: '#fff', letterSpacing: 0.5 }}>
                    {item.source}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{item.time}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-4)' }}>· {item.category}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.55, margin: '0 0 12px' }}>{item.headline}</p>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 8,
                  background: 'var(--surface2)', border: '1px solid var(--border)', flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Impact</span>
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-2)' }}>${item.before.toFixed(2)}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>${item.after.toFixed(2)}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                    background: item.up ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                    color: item.up ? '#16a34a' : '#dc2626', fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {item.changePct} in 12 min
                  </span>
                </div>
              </div>
              {tickerPosts.filter(p => p.postType === 'commentary').slice(0, 1).map(post => (
                <div key={post.id} style={{ borderTop: '1px solid var(--border)', padding: '0 16px 12px' }}>
                  <CommentaryCard post={post} />
                </div>
              ))}
            </div>
          ))}

          {primaryNews.length === 0 && extraNews.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
              No news for {ticker}
            </div>
          )}
        </div>
      )}

      {tab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tickerPosts.map(post =>
            post.postType === 'trade'
              ? <TradeCard key={post.id} post={post} />
              : <CommentaryCard key={post.id} post={post} />
          )}
          {tickerPosts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
              No posts yet for {ticker}
            </div>
          )}
        </div>
      )}

      {tab === 'trades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tickerPosts.filter(p => p.postType === 'trade').map(post => (
            <TradeCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {tab === 'commentary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tickerPosts.filter(p => p.postType === 'commentary').map(post => (
            <CommentaryCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
