import { useState } from 'react';
import { DEMO_WATCHLIST } from '../../data/demo';

const MARKET_DATE = 'Wed Mar 25';
const MARKET_TIME = '10:42 EST';

interface TickerDetail {
  name: string;
  open: number;
  high: number;
  low: number;
  vol: string;
  sparkline: string;
}

const TICKER_DETAILS: Record<string, TickerDetail> = {
  NVDA: { name: 'NVIDIA Corporation',  open: 854.20, high: 889.40, low: 851.10, vol: '42.1M', sparkline: '0,28 8,24 16,22 24,20 32,16 40,10 48,6  56,4  64,2'  },
  TSLA: { name: 'Tesla, Inc.',          open: 179.40, high: 180.10, low: 170.50, vol: '31.8M', sparkline: '0,4  8,5  16,5  24,6  32,10 40,16 48,22 56,26 64,30' },
  SPY:  { name: 'S&P 500 ETF',          open: 515.00, high: 516.80, low: 511.20, vol: '65.3M', sparkline: '0,12 8,10 16,14 24,12 32,16 40,14 48,18 56,20 64,22' },
  AAPL: { name: 'Apple Inc.',           open: 209.80, high: 212.30, low: 209.10, vol: '28.4M', sparkline: '0,22 8,20 16,18 24,16 32,14 40,12 48,10 56,8  64,6'  },
  META: { name: 'Meta Platforms, Inc.', open: 471.20, high: 487.50, low: 470.80, vol: '19.7M', sparkline: '0,28 8,24 16,20 24,16 32,12 40,8  48,6  56,4  64,2'  },
};

export default function MarketsPanel() {
  const [selected, setSelected] = useState('SPY');

  const watchItem = DEMO_WATCHLIST.find(t => t.ticker === selected) ?? DEMO_WATCHLIST[2];
  const detail = TICKER_DETAILS[selected] ?? TICKER_DETAILS['SPY'];
  const isUp = watchItem.changePct >= 0;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text4)' }}>
          <span>{MARKET_DATE}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>Market open</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{MARKET_TIME}</span>
        </div>
      </div>

      {/* Ticker strip */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border2)',
        overflowX: 'auto',
      }} className="scrollbar-hide">
        {DEMO_WATCHLIST.map((t, i) => {
          const active = t.ticker === selected;
          return (
            <div
              key={t.ticker}
              onClick={() => setSelected(t.ticker)}
              style={{
                flex: '1 0 auto',
                padding: '8px 14px',
                borderRight: i < DEMO_WATCHLIST.length - 1 ? '1px solid var(--border2)' : 'none',
                cursor: 'pointer',
                background: active ? 'var(--blue-bg)' : 'transparent',
                transition: 'background 0.12s',
              }}
            >
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
                color: active ? 'var(--blue)' : 'var(--text)', marginBottom: 2,
              }}>
                {t.ticker}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>
                ${t.price.toFixed(2)}
              </div>
              <span style={{
                display: 'inline-block',
                fontSize: 9, fontWeight: 700,
                padding: '1px 5px', borderRadius: 4,
                background: t.changePct >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
                color: t.changePct >= 0 ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${t.changePct >= 0 ? 'var(--green-border)' : 'var(--red-border)'}`,
              }}>
                {t.changePct >= 0 ? '+' : ''}{t.changePct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Featured ticker */}
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                {watchItem.ticker}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text4)' }}>
                {detail.name}
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 6 }}>
              ${watchItem.price.toFixed(2)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: isUp ? 'var(--green)' : 'var(--red)' }}>
                {watchItem.change > 0 ? '+' : ''}{watchItem.change.toFixed(2)} today
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                padding: '2px 7px', borderRadius: 20,
                background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
                color: isUp ? 'var(--green)' : 'var(--red)',
                border: `1px solid ${isUp ? 'var(--green-border)' : 'var(--red-border)'}`,
              }}>
                {isUp ? '+' : ''}{watchItem.changePct.toFixed(2)}%
              </span>
              <span style={{ fontSize: 10, color: 'var(--text4)' }}>
                · Vol {detail.vol}
              </span>
            </div>
          </div>
          <svg width="80" height="36" viewBox="0 0 64 32" fill="none" style={{ marginTop: 6, flexShrink: 0 }}>
            <polyline
              points={detail.sparkline}
              stroke={isUp ? 'var(--green)' : 'var(--red)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* OHLV grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'OPEN',   value: `$${detail.open.toFixed(2)}` },
          { label: 'HIGH',   value: `$${detail.high.toFixed(2)}` },
          { label: 'LOW',    value: `$${detail.low.toFixed(2)}` },
          { label: 'VOLUME', value: detail.vol },
        ].map(({ label, value }, i) => (
          <div key={label} style={{
            padding: '8px 14px',
            borderRight: i < 3 ? '1px solid var(--border2)' : 'none',
            borderTop: '1px solid var(--border2)',
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
