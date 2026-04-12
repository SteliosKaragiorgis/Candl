import React, { useMemo } from 'react';
import type { Trade } from '../../types/trade';

interface Props {
  trades: Trade[];
}

export default function EquityCurve({ trades }: Props) {
  const WIDTH  = 600;
  const HEIGHT = 52;
  const PAD    = 2;

  const { points, monthPnl, positive, currentMonth } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Trades for this month sorted oldest first
    const monthTrades = [...trades]
      .filter(t => {
        const d = new Date(t.closedAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .sort((a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime());

    const monthPnl = monthTrades.reduce((s, t) => s + t.pnl, 0);

    // Build cumulative equity points
    const cumulative: number[] = [0];
    for (const t of monthTrades) {
      cumulative.push(cumulative[cumulative.length - 1] + t.pnl);
    }

    if (cumulative.length < 2) {
      return { points: '', monthPnl: 0, positive: true, currentMonth };
    }

    const minVal = Math.min(...cumulative);
    const maxVal = Math.max(...cumulative);
    const range  = maxVal - minVal || 1;

    const svgPoints = cumulative.map((val, i) => {
      const x = PAD + (i / (cumulative.length - 1)) * (WIDTH - PAD * 2);
      const y = PAD + (1 - (val - minVal) / range) * (HEIGHT - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return {
      points: svgPoints,
      monthPnl,
      positive: monthPnl >= 0,
      currentMonth,
    };
  }, [trades]);

  const fmtPnl = (n: number) => {
    const sign = n >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  return (
    <div style={{ padding: '12px 20px 10px', flexShrink: 0 }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 8,
        padding: '12px 14px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
            Equity curve · {currentMonth}
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: positive ? 'var(--green)' : 'var(--red)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmtPnl(monthPnl)} this month
          </span>
        </div>

        {points ? (
          <svg
            width="100%"
            height={HEIGHT}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            <polyline
              points={points}
              stroke={positive ? 'var(--green)' : 'var(--red)'}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div style={{
            height: HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: 'var(--text-4)',
          }}>
            No trades this month yet
          </div>
        )}
      </div>
    </div>
  );
}
