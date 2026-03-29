import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '../hooks/useMobile';
import { useTheme } from '../context/ThemeContext';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';

// ── Types ────────────────────────────────────────────────────────────────────

type TF = '1W' | '1M' | '3M' | 'All';
type PosFilter = 'All' | 'Signals' | 'Investments' | 'Manual';

interface Position {
  id: string;
  ticker: string;
  shares: string;
  type: 'Signal' | 'Investment' | 'Manual';
  direction?: 'short';
  entry: number;
  now: number;
  pnl: number;
  pnlPct: number;
  progress: string;
  progressColor: string;
  source: string;
  sourceInitials?: string;
  sourceGradient?: [string, string];
}

interface GroupRow {
  name: string;
  color: string;
  pnl: number;
  signals: number;
  winRate: number;
  returnPct: number;
  barWidth: number;
  barColor: string;
}

interface WatchItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  alert: string | null;
}

// ── Demo Data ─────────────────────────────────────────────────────────────────

const GROUPS: GroupRow[] = [
  { name: 'Alpha Signals',  color: '#16a34a', pnl: 2840,  signals: 38, winRate: 74, returnPct: 18.9, barWidth: 80, barColor: '#16a34a' },
  { name: 'Options Flow',   color: '#0047FF', pnl: 1120,  signals: 24, winRate: 67, returnPct:  7.5, barWidth: 55, barColor: '#06b6d4' },
  { name: 'Macro Desk',     color: '#7c3aed', pnl:  640,  signals: 11, winRate: 64, returnPct:  4.3, barWidth: 40, barColor: '#185FA5' },
  { name: 'Manual trades',  color: '#6b7280', pnl: -320,  signals:  8, winRate: 38, returnPct: -2.1, barWidth: 38, barColor: '#E24B4A' },
];

const POSITIONS: Position[] = [
  {
    id: 'p1', ticker: 'AAPL', shares: '4 shares', type: 'Signal',
    entry: 195.50, now: 198.20, pnl: 10.80, pnlPct: 1.4,
    progress: 'T1 $208', progressColor: '#1D9E75',
    source: 'alex_lev', sourceInitials: 'AL', sourceGradient: ['#16a34a', '#06b6d4'],
  },
  {
    id: 'p2', ticker: 'NVDA', shares: '6 shares', type: 'Investment',
    entry: 820.00, now: 969.50, pnl: 897.00, pnlPct: 18.2,
    progress: 'Target $1,400', progressColor: '#185FA5',
    source: 'sara_risk', sourceInitials: 'SR', sourceGradient: ['#dc2626', '#f97316'],
  },
  {
    id: 'p3', ticker: 'SPY', shares: '8 shares · short', type: 'Signal', direction: 'short',
    entry: 515.20, now: 509.30, pnl: 47.20, pnlPct: 1.1,
    progress: 'T2 $507.50', progressColor: '#1D9E75',
    source: 'alex_lev', sourceInitials: 'AL', sourceGradient: ['#16a34a', '#06b6d4'],
  },
  {
    id: 'p4', ticker: 'BTC', shares: '0.12 BTC', type: 'Manual',
    entry: 82400, now: 87200, pnl: 576, pnlPct: 5.8,
    progress: 'No target set', progressColor: '#6b7280',
    source: 'Manual entry',
  },
  {
    id: 'p5', ticker: 'TSLA', shares: '14 shares', type: 'Signal',
    entry: 178.50, now: 172.00, pnl: -91.00, pnlPct: -3.6,
    progress: 'Stopped out', progressColor: '#E24B4A',
    source: 'alex_lev', sourceInitials: 'AL', sourceGradient: ['#16a34a', '#06b6d4'],
  },
  {
    id: 'p6', ticker: 'META', shares: '5 shares', type: 'Investment',
    entry: 480.00, now: 498.50, pnl: 92.50, pnlPct: 3.9,
    progress: 'Target $620', progressColor: '#185FA5',
    source: 'sara_risk', sourceInitials: 'SR', sourceGradient: ['#dc2626', '#f97316'],
  },
];

const WATCHLIST: WatchItem[] = [
  { symbol: 'AMD',  name: 'Advanced Micro Devices', price: 162.40, changePct:  1.88, alert: '$158'   },
  { symbol: 'MSFT', name: 'Microsoft Corp',          price: 415.20, changePct: -0.31, alert: null      },
  { symbol: 'ETH',  name: 'Ethereum',                price: 3240,   changePct:  2.14, alert: '$3,000'  },
  { symbol: 'AMZN', name: 'Amazon',                  price: 198.30, changePct:  0.74, alert: null      },
];

// Seeded PRNG for reproducible chart data
function seedRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function genPortfolioData(tf: TF) {
  const days: Record<TF, number> = { '1W': 7, '1M': 30, '3M': 91, 'All': 180 };
  const n = days[tf];
  const rand = seedRand(42 + n);
  const DAY = 86400;
  const now = Math.floor(Date.now() / 1000);
  const start = Math.floor((now - n * DAY) / DAY) * DAY;
  let v = 14820;
  return Array.from({ length: n }, (_, i) => {
    v = Math.max(12000, v + 12 + (rand() - 0.38) * 180);
    return { time: (start + i * DAY) as unknown as number, value: parseFloat(v.toFixed(2)) };
  });
}

// ── Chart Component ───────────────────────────────────────────────────────────

function PortfolioChart({ tf }: { tf: TF }) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isDark = theme === 'dark';
    const bg          = isDark ? 'transparent' : 'transparent';
    const textColor   = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
    const gridColor   = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 160,
      layout: { background: { type: ColorType.Solid, color: bg }, textColor },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      rightPriceScale: { borderColor, scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor, timeVisible: false },
      crosshair: { mode: 1 },
      handleScroll: false,
      handleScale: false,
    });

    const area = chart.addSeries(AreaSeries, {
      lineColor: '#1D9E75',
      topColor: 'rgba(29,158,117,0.3)',
      bottomColor: 'rgba(29,158,117,0.02)',
      lineWidth: 2,
    });

    const data = genPortfolioData(tf);
    area.setData(data as Parameters<typeof area.setData>[0]);

    const observer = new ResizeObserver(entries => {
      if (entries[0]) chart.resize(entries[0].contentRect.width, 160);
    });
    observer.observe(el);

    return () => { observer.disconnect(); chart.remove(); };
  }, [tf, theme]);

  return <div ref={containerRef} />;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 100)   return n.toFixed(2);
  return n.toFixed(2);
}

function TypeBadge({ type }: { type: Position['type'] }) {
  const cfg = {
    Signal:     { bg: 'rgba(22,163,74,0.12)',   color: '#16a34a',  border: 'rgba(22,163,74,0.25)'  },
    Investment: { bg: 'rgba(24,95,165,0.12)',   color: '#185FA5',  border: 'rgba(24,95,165,0.25)'  },
    Manual:     { bg: 'rgba(202,138,4,0.12)',   color: '#ca8a04',  border: 'rgba(202,138,4,0.25)'  },
  }[type];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  );
}

function Avatar({ initials, gradient, size = 24 }: { initials: string; gradient: [string, string]; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.35, fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [tf, setTf] = useState<TF>('1M');
  const [posFilter, setPosFilter] = useState<PosFilter>('All');

  const px = isMobile ? 12 : 20;

  const filteredPos = POSITIONS.filter(p =>
    posFilter === 'All' ? true :
    posFilter === 'Signals' ? p.type === 'Signal' :
    posFilter === 'Investments' ? p.type === 'Investment' :
    p.type === 'Manual'
  );

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px 18px',
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 40 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '16px 12px 12px' : '20px 20px 16px',
        flexWrap: 'wrap', gap: 10,
      }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          My Portfolio
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {(['1W', '1M', '3M', 'All'] as TF[]).map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              style={{
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                border: `1px solid ${tf === t ? 'var(--text)' : 'var(--border)'}`,
                background: tf === t ? 'var(--text)' : 'transparent',
                color: tf === t ? 'var(--bg)' : 'var(--text-2)',
              }}
            >{t}</button>
          ))}
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add position
          </button>
        </div>
      </div>

      <div style={{ padding: `0 ${px}px`, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Summary card ──────────────────────────────────────────────── */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            borderBottom: '1px solid var(--border)',
          }}>
            {[
              { val: '+$4,280', label: `Total P&L (${tf})`, color: '#1D9E75' },
              { val: '+22.4%',  label: 'Return',             color: '#1D9E75' },
              { val: '12',      label: 'Open positions',     color: 'var(--text)' },
              { val: '$19,100', label: 'Invested value',     color: '#185FA5' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: '16px 18px',
                  borderRight: isMobile
                    ? (i % 2 === 0 ? '1px solid var(--border)' : 'none')
                    : (i < 3 ? '1px solid var(--border)' : 'none'),
                  borderBottom: isMobile && i < 2 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ padding: '12px 0 4px' }}>
            <PortfolioChart tf={tf} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 16px 10px', fontSize: 10, color: 'var(--text-3)' }}>
              <span>{{ '1W': '1 week ago', '1M': '1 month ago', '3M': '3 months ago', 'All': '6 months ago' }[tf]}</span>
              <span style={{ color: '#1D9E75' }}>Today</span>
            </div>
          </div>
        </div>

        {/* ── P&L by Group ──────────────────────────────────────────────── */}
        <div style={cardStyle}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 14 }}>
            P&L by Group
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            {GROUPS.map(g => (
              <div
                key={g.name}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{g.name}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: g.pnl >= 0 ? '#1D9E75' : '#E24B4A' }}>
                    {g.pnl >= 0 ? '+' : '−'}${Math.abs(g.pnl).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>
                  {g.name === 'Manual trades' ? 'Trades' : 'Signals'}: {g.signals}
                  &nbsp;&nbsp;Win rate:&nbsp;
                  <span style={{ color: g.winRate >= 50 ? '#1D9E75' : '#E24B4A', fontWeight: 600 }}>{g.winRate}%</span>
                  &nbsp;&nbsp;Return:&nbsp;
                  <span style={{ color: g.returnPct >= 0 ? '#1D9E75' : '#E24B4A', fontWeight: 600 }}>
                    {g.returnPct >= 0 ? '+' : ''}{g.returnPct}%
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${g.barWidth}%`, height: '100%', background: g.barColor, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Positions ─────────────────────────────────────────────────── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              All Positions
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['All', 'Signals', 'Investments', 'Manual'] as PosFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setPosFilter(f)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                    fontSize: 11, fontWeight: 600,
                    border: `1px solid ${posFilter === f ? '#1D9E75' : 'var(--border)'}`,
                    background: posFilter === f ? 'rgba(29,158,117,0.1)' : 'transparent',
                    color: posFilter === f ? '#1D9E75' : 'var(--text-2)',
                  }}
                >{f}</button>
              ))}
            </div>
          </div>

          {/* Table header */}
          {!isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1.5fr 1.2fr',
              gap: 8, padding: '6px 0 8px',
              borderBottom: '1px solid var(--border)',
              marginBottom: 2,
            }}>
              {['Ticker', 'Type', 'Entry', 'Now', 'P&L', 'Progress', 'Source'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
          )}

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredPos.map((pos, i) => {
              const isLast = i === filteredPos.length - 1;
              if (isMobile) {
                return (
                  <div
                    key={pos.id}
                    onClick={() => navigate(`/ticker/${pos.ticker}`)}
                    style={{
                      padding: '12px 0',
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: pos.pnl >= 0 ? '#1D9E75' : '#E24B4A', flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 800 }}>{pos.ticker}</span>
                          <TypeBadge type={pos.type} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, paddingLeft: 15 }}>{pos.shares}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: pos.pnl >= 0 ? '#1D9E75' : '#E24B4A' }}>
                          {pos.pnl >= 0 ? '+' : ''}${Math.abs(pos.pnl).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: 11, color: pos.pnl >= 0 ? '#1D9E75' : '#E24B4A' }}>
                          ({pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct}%)
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
                      <span>Entry ${fmtPrice(pos.entry)} → Now ${fmtPrice(pos.now)}</span>
                      <span style={{ color: pos.progressColor, fontWeight: 600 }}>{pos.progress}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={pos.id}
                  onClick={() => navigate(`/ticker/${pos.ticker}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1.5fr 1.2fr',
                    gap: 8,
                    padding: '12px 0',
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                    cursor: 'pointer',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Ticker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: pos.pnl >= 0 ? '#1D9E75' : '#E24B4A', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{pos.ticker}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{pos.shares}</div>
                    </div>
                  </div>
                  {/* Type */}
                  <div><TypeBadge type={pos.type} /></div>
                  {/* Entry */}
                  <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>${fmtPrice(pos.entry)}</div>
                  {/* Now */}
                  <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>${fmtPrice(pos.now)}</div>
                  {/* P&L */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: pos.pnl >= 0 ? '#1D9E75' : '#E24B4A', fontFamily: 'JetBrains Mono, monospace' }}>
                      {pos.pnl >= 0 ? '+' : ''}${Math.abs(pos.pnl).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 10, color: pos.pnl >= 0 ? '#1D9E75' : '#E24B4A', fontFamily: 'JetBrains Mono, monospace' }}>
                      ({pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct}%)
                    </div>
                  </div>
                  {/* Progress */}
                  <div style={{ fontSize: 11, fontWeight: 600, color: pos.progressColor }}>{pos.progress}</div>
                  {/* Source */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {pos.sourceInitials && pos.sourceGradient
                      ? <><Avatar initials={pos.sourceInitials} gradient={pos.sourceGradient} size={20} /><span style={{ fontSize: 11, color: 'var(--text-2)' }}>{pos.source}</span></>
                      : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{pos.source}</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Watchlist ──────────────────────────────────────────────────── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Watchlist
            </div>
            <button
              onClick={() => navigate('/watchlist')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add ticker
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {WATCHLIST.map((w, i) => (
              <div
                key={w.symbol}
                onClick={() => navigate(`/ticker/${w.symbol}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 2fr 1fr 1fr 1.5fr',
                  gap: 8, alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < WATCHLIST.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{w.symbol}</div>
                {!isMobile && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{w.name}</div>}
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', textAlign: isMobile ? 'right' : 'left' }}>
                  ${w.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  color: w.changePct >= 0 ? '#1D9E75' : '#E24B4A',
                  display: isMobile ? 'none' : 'block',
                }}>
                  {w.changePct >= 0 ? '+' : ''}{w.changePct}%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: w.alert ? 'var(--text-2)' : 'var(--text-3)' }}>
                  {w.alert
                    ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>Alert at {w.alert}</>
                    : 'No alert set'
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
