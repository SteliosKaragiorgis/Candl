import React, { useMemo } from 'react';
import type { Trade } from '../../types/trade';

interface Props {
  trades: Trade[];
  thisWeekCount: number;
}

function computeStats(trades: Trade[]) {
  if (trades.length === 0) {
    return {
      totalPnl: 0,
      winRate: 0,
      wins: 0,
      losses: 0,
      avgRR: 0,
      tradeCount: 0,
      avgWinner: 0,
      avgLoser: 0,
      bestStreak: 0,
      currentStreak: 0,
    };
  }

  const winners = trades.filter(t => t.pnl > 0);
  const losers  = trades.filter(t => t.pnl <= 0);

  const totalPnl  = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate   = (winners.length / trades.length) * 100;
  const avgRR     = winners.length > 0
    ? winners.reduce((s, t) => s + t.rMultiple, 0) / winners.length
    : 0;
  const avgWinner = winners.length > 0
    ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length
    : 0;
  const avgLoser  = losers.length > 0
    ? Math.abs(losers.reduce((s, t) => s + t.pnl, 0) / losers.length)
    : 0;

  // Streaks (trades sorted oldest→newest)
  const sorted = [...trades].sort(
    (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime(),
  );

  let bestStreak = 0;
  let curStreak  = 0;
  let prevWon: boolean | null = null;

  for (const t of sorted) {
    const won = t.pnl > 0;
    if (prevWon === null || won === prevWon) {
      curStreak++;
    } else {
      curStreak = 1;
    }
    if (won && curStreak > bestStreak) bestStreak = curStreak;
    prevWon = won;
  }

  // Current streak (from most recent trade backwards)
  let currentStreak = 0;
  const firstPnl = sorted[sorted.length - 1]?.pnl ?? 0;
  const currentWon = firstPnl > 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if ((sorted[i].pnl > 0) === currentWon) currentStreak++;
    else break;
  }
  if (!currentWon) currentStreak = -currentStreak;

  return {
    totalPnl,
    winRate,
    wins: winners.length,
    losses: losers.length,
    avgRR,
    tradeCount: trades.length,
    avgWinner,
    avgLoser,
    bestStreak,
    currentStreak,
  };
}

function fmt(n: number, decimals = 0): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : n > 0 ? '+' : '';
  return `${sign}$${abs.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export default function TradeStatsBar({ trades, thisWeekCount }: Props) {
  const s = useMemo(() => computeStats(trades), [trades]);

  const cells = [
    {
      value: fmt(s.totalPnl),
      label: 'Total P&L',
      sub: 'This month',
      valueColor: s.totalPnl > 0 ? 'var(--green)' : s.totalPnl < 0 ? 'var(--red)' : 'var(--text-1)',
    },
    {
      value: `${s.winRate.toFixed(0)}%`,
      label: 'Win rate',
      sub: `${s.wins} wins · ${s.losses} losses`,
      valueColor: 'var(--text)',
    },
    {
      value: `${s.avgRR.toFixed(1)}R`,
      label: 'Avg R:R',
      sub: 'Winners only',
      valueColor: 'var(--text)',
    },
    {
      value: String(s.tradeCount),
      label: 'Total trades',
      sub: `+${thisWeekCount} this week`,
      valueColor: 'var(--text)',
    },
    {
      value: `$${s.avgWinner.toFixed(0)}`,
      label: 'Avg winner',
      sub: `vs $${s.avgLoser.toFixed(0)} avg loss`,
      valueColor: 'var(--green)',
    },
    {
      value: String(s.bestStreak),
      label: 'Best streak',
      sub: `Current: ${s.currentStreak > 0 ? `+${s.currentStreak}W` : s.currentStreak < 0 ? `${Math.abs(s.currentStreak)}L` : '—'}`,
      valueColor: 'var(--text)',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '1px',
      background: 'var(--border)',
      borderBottom: '0.5px solid var(--border)',
      flexShrink: 0,
    }}>
      {cells.map((cell, i) => (
        <div key={i} style={{
          background: 'var(--bg-card)',
          padding: '12px 16px',
        }}>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: cell.valueColor,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.2,
          }}>
            {cell.value}
          </div>
          <div style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-4)',
            marginTop: 3,
          }}>
            {cell.label}
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-3)',
            marginTop: 2,
          }}>
            {cell.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
