import { useState, useEffect } from 'react';
import { useMarketData } from '../../context/MarketDataContext';
import { PANEL_SYMBOLS } from '../../hooks/useMarketQuotes';

function checkMarketOpen() {
  const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const mins = et.getHours() * 60 + et.getMinutes();
  return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
}

const SPARKLINES: Record<string, string> = {
  NVDA: '0,28 8,24 16,22 24,20 32,16 40,10 48,6  56,4  64,2',
  TSLA: '0,4  8,5  16,5  24,6  32,10 40,16 48,22 56,26 64,30',
  SPY:  '0,12 8,10 16,14 24,12 32,16 40,14 48,18 56,20 64,22',
  AAPL: '0,22 8,20 16,18 24,16 32,14 40,12 48,10 56,8  64,6',
  META: '0,28 8,24 16,20 24,16 32,12 40,8  48,6  56,4  64,2',
};

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function MarketsPanel() {
  const [selected, setSelected] = useState('SPY');
  const { quotes: rawQuotes } = useMarketData();
  const quotes = PANEL_SYMBOLS.map(s => {
    const q = rawQuotes[s.ticker];
    return q && q.price > 0
      ? { ...q, name: s.name }
      : { ticker: s.ticker, name: s.name, price: 0, change: 0, changePct: 0, open: 0, high: 0, low: 0 };
  });

  const now = useClock();
  const isMarketOpen = checkMarketOpen();
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  const q = quotes.find(q => q.ticker === selected) ?? quotes[2];
  const isUp = q.changePct >= 0;
  const hasData = q.price > 0;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 14,
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px 8px',
        borderBottom: '1px solid var(--border2)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text)', textTransform: 'uppercase' }}>
          Markets
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isMarketOpen ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isMarketOpen ? 'var(--green)' : 'var(--red)', flexShrink: 0 }} />
            {isMarketOpen ? 'Market open' : 'Market closed'}
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{date}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{time}</span>
        </div>
      </div>

      {/* Ticker strip — blue underline on selected */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', overflowX: 'auto' }} className="scrollbar-hide">
        {quotes.map((t, i) => {
          const active = t.ticker === selected;
          const up = t.changePct >= 0;
          return (
            <div
              key={t.ticker}
              onClick={() => setSelected(t.ticker)}
              style={{
                flex: '1 0 auto',
                padding: '8px 14px 0',
                borderRight: i < quotes.length - 1 ? '1px solid var(--border2)' : 'none',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div style={{ paddingBottom: 8 }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
                  color: active ? 'var(--blue)' : 'var(--text)', marginBottom: 2,
                }}>
                  {t.ticker}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>
                  {t.price > 0 ? `$${fmt(t.price)}` : '—'}
                </div>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700,
                  padding: '1px 5px', borderRadius: 4,
                  background: up ? 'var(--green-bg)' : 'var(--red-bg)',
                  color: up ? 'var(--green)' : 'var(--red)',
                  border: `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
                }}>
                  {t.price > 0 ? `${up ? '+' : ''}${fmt(t.changePct)}%` : '—'}
                </span>
              </div>
              {/* Blue underline */}
              {active && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: 2, background: 'var(--blue)',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Featured ticker — 3-column: price | sparkline | OPEN/HIGH/LOW */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 12 }}>

        {/* Left: price info */}
        <div style={{ flexShrink: 0, minWidth: 130 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
              {q.ticker}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>· {q.name}</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 5 }}>
            {hasData ? `$${fmt(q.price)}` : '—'}
          </div>
          <div style={{ fontSize: 11, color: isUp ? 'var(--green)' : 'var(--red)', marginBottom: 3 }}>
            {hasData ? `${q.change > 0 ? '+' : ''}${fmt(q.change)}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hasData ? 'today' : ''}</span>
            {hasData && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
                color: isUp ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${isUp ? 'var(--green-border)' : 'var(--red-border)'}`,
              }}>
                {isUp ? '+' : ''}{fmt(q.changePct)}%
              </span>
            )}
          </div>
        </div>

        {/* Center: sparkline */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="100%" height="40" viewBox="0 0 140 32" preserveAspectRatio="none" fill="none">
            <polyline
              points={SPARKLINES[q.ticker] ?? SPARKLINES['SPY']}
              stroke={isUp ? 'var(--green)' : 'var(--red)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Right: OPEN / HIGH / LOW */}
        <div style={{ display: 'flex', gap: 18, flexShrink: 0 }}>
          {[
            { label: 'OPEN', value: hasData && q.open > 0 ? `$${fmt(q.open)}` : '—', color: 'var(--text)' },
            { label: 'HIGH', value: hasData && q.high > 0 ? `$${fmt(q.high)}` : '—', color: 'var(--green)' },
            { label: 'LOW',  value: hasData && q.low  > 0 ? `$${fmt(q.low)}`  : '—', color: 'var(--red)'   },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>
                {label}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, color }}>
                {value}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
