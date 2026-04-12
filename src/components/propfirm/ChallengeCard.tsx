import React, { useState } from 'react';
import type { Challenge, PropFirm, Rule, TradeEntry } from '../../types/propfirm';
import ShareChallengeModal from './ShareChallengeModal';
import AddTradeModal from './AddTradeModal';
import EditChallengeModal from './EditChallengeModal';
import EquityCurve from './EquityCurve';
import { useDeleteTradeFromChallenge, useGraduateChallenge } from '../../hooks/useChallenge';

interface Props {
  challenge: Challenge;
}

// ── Firm colours via CSS vars ─────────────────────────────────────────────────

const FIRM_COLORS: Record<PropFirm, { bg: string; text: string; border: string }> = {
  FTMO:       { bg: 'var(--ftmo-bg)',    text: 'var(--ftmo-color)',  border: 'var(--ftmo-border)' },
  TFT:        { bg: 'var(--tft-bg)',     text: 'var(--tft-color)',   border: 'var(--tft-border)'  },
  Apex:       { bg: 'var(--apex-bg)',    text: 'var(--apex-color)',  border: 'var(--apex-border)' },
  E8:         { bg: 'var(--e8-bg)',      text: 'var(--e8-color)',    border: 'var(--e8-border)'   },
  FundedNext: { bg: 'var(--tft-bg)',     text: 'var(--tft-color)',   border: 'var(--tft-border)'  },
  MFF:        { bg: 'var(--bg-surface)', text: 'var(--text-muted)',  border: 'var(--border)'      },
  TFF:        { bg: 'var(--bg-surface)', text: 'var(--text-muted)',  border: 'var(--border)'      },
  Other:      { bg: 'var(--bg-surface)', text: 'var(--text-muted)',  border: 'var(--border)'      },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  const abs = Math.abs(n);
  return abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(0)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDates(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    out.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function pctBarColor(pct: number) {
  if (pct >= 0.8) return 'var(--red)';
  if (pct >= 0.6) return 'var(--amber)';
  return 'var(--green)';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 500,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function StatusChip({ status }: { status: Challenge['status'] }) {
  const cfg = {
    active:     { label: 'Active',     bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)', pulse: true  },
    near_limit: { label: 'Near limit', bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber-border)', pulse: true  },
    failed:     { label: 'Failed',     bg: 'var(--red-bg)',   color: 'var(--red)',   border: 'var(--red-border)',   pulse: false },
    passed:     { label: 'Passed',     bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)', pulse: false },
  }[status];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: cfg.bg,
      border: `0.5px solid ${cfg.border}`,
      borderRadius: 20,
      padding: '3px 8px',
      flexShrink: 0,
    }}>
      {cfg.pulse ? (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: cfg.color,
          display: 'inline-block',
          animation: 'livePulse 2s ease infinite',
          flexShrink: 0,
        }} />
      ) : (
        <span style={{ fontSize: 9, color: cfg.color, lineHeight: 1 }}>
          {status === 'passed' ? '✓' : '✕'}
        </span>
      )}
      <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}

function MetricTile({ label, value, color = 'var(--text-primary)' }: {
  label: string; value: string; color?: string;
}) {
  return (
    <div style={{ background: 'var(--bg-surface)', padding: '10px 12px' }}>
      <div style={{
        fontSize: 15, fontWeight: 600,
        color, fontVariantNumeric: 'tabular-nums',
        marginBottom: 3,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {label}
      </div>
    </div>
  );
}

function SmallMetricTile({ label, value, color = 'var(--text-primary)' }: {
  label: string; value: string; color?: string;
}) {
  return (
    <div style={{ background: 'var(--bg-surface)', padding: '8px 10px' }}>
      <div style={{
        fontSize: 13, fontWeight: 600,
        color, fontVariantNumeric: 'tabular-nums',
        marginBottom: 2,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {label}
      </div>
    </div>
  );
}

function RuleRow({ rule }: { rule: Rule }) {
  const pct = Math.min(rule.used / rule.limit, 1);
  const isPercent = rule.type === 'min_trading_days';
  const barColor = pctBarColor(pct);

  const dotColor =
    rule.status === 'breached' ? 'var(--red)' :
    rule.status === 'warning'  ? 'var(--amber)' :
    'var(--green)';

  const fmtValue = isPercent
    ? `${rule.used}/${rule.limit} days`
    : `${fmtCurrency(rule.used)} / ${fmtCurrency(rule.limit)}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontSize: 12, color: 'var(--text-muted)',
        width: 120, flexShrink: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {rule.name}
      </span>

      <div style={{
        flex: 1, height: 5,
        background: 'var(--bg-surface)',
        borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct * 100}%`, height: '100%',
          background: barColor, borderRadius: 3,
          transition: 'width 0.4s ease',
        }} />
      </div>

      <span style={{
        fontSize: 11, color: 'var(--text-muted)',
        fontVariantNumeric: 'tabular-nums',
        minWidth: 90, textAlign: 'right', flexShrink: 0,
      }}>
        {fmtValue}
      </span>

      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: dotColor, flexShrink: 0,
      }} />
    </div>
  );
}

function TradingCalendar({ challenge }: { challenge: Challenge }) {
  const dates = getDates(challenge.start_date, challenge.end_date);
  const dayMap = new Map(challenge.trading_days.map(d => [d.date, d]));
  const todayStr = today();

  const cellStyle = (date: string): React.CSSProperties => {
    if (date > todayStr) {
      return {
        background: 'transparent',
        border: '0.5px solid var(--border-soft)',
        color: 'transparent',
      };
    }
    const day = dayMap.get(date);
    if (!day) return { background: 'var(--bg-surface)', color: 'var(--text-hint)' };
    if (day.result === 'win')       return { background: 'var(--green-bg)', color: 'var(--green)' };
    if (day.result === 'loss')      return { background: 'var(--red-bg)',   color: 'var(--red)'   };
    if (day.result === 'breakeven') return { background: 'var(--blue-bg)',  color: 'var(--blue)'  };
    return { background: 'var(--bg-surface)', color: 'var(--text-hint)' };
  };

  const cellLabel = (date: string) => {
    if (date > todayStr) return '';
    const day = dayMap.get(date);
    if (!day) return '–';
    if (day.result === 'win')       return 'W';
    if (day.result === 'loss')      return 'L';
    if (day.result === 'breakeven') return 'B';
    return '–';
  };

  return (
    <div>
      <SectionLabel>Trading calendar</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {dates.map(date => {
          const cs = cellStyle(date);
          return (
            <div
              key={date}
              title={date}
              style={{
                width: 22, height: 22,
                borderRadius: 4,
                background: cs.background,
                border: date === todayStr
                  ? '1.5px solid var(--green)'
                  : (cs.border ?? '0.5px solid var(--border-soft)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 500,
                color: cs.color,
                flexShrink: 0,
              }}
            >
              {cellLabel(date)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseTracker({ phase }: { phase: Challenge['phase'] }) {
  const phases = [
    { num: 1, label: 'Challenge'    },
    { num: 2, label: 'Verification' },
    { num: 3, label: 'Funded'       },
  ] as const;

  return (
    <div>
      <SectionLabel>Phase</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {phases.map(p => {
          const isDone   = p.num < phase;
          const isActive = p.num === phase;
          const isLocked = p.num > phase;

          return (
            <div
              key={p.num}
              style={{
                background: isActive ? 'var(--green-bg)' : 'var(--bg-surface)',
                border: `0.5px solid ${isActive ? 'var(--green-border)' : 'var(--border)'}`,
                borderTop: isActive
                  ? '2px solid var(--green)'
                  : isDone
                    ? '2px solid var(--green-border)'
                    : '2px solid var(--border)',
                borderRadius: 5,
                padding: '8px 8px 7px',
                opacity: isLocked ? 0.3 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  color: isActive || isDone ? 'var(--green)' : 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  opacity: isDone ? 0.7 : 1,
                }}>
                  Phase {p.num}
                </span>
                {isDone && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: isActive ? 'var(--green)' : 'var(--text-muted)',
              }}>
                {p.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── #13 Notification banner ───────────────────────────────────────────────────

type BannerSeverity = 'breached' | 'warning' | 'near_target';

function getRuleBanner(challenge: Challenge): {
  severity: BannerSeverity;
  message: string;
} | null {
  const profitRule = challenge.rules.find(r => r.type === 'profit_target');

  // Check for breached rules first (most critical)
  for (const rule of challenge.rules) {
    if (rule.status === 'breached' && rule.type !== 'profit_target') {
      return {
        severity: 'breached',
        message: `${rule.name} breached — challenge failed`,
      };
    }
  }

  // Then warnings
  for (const rule of challenge.rules) {
    if (rule.status === 'warning' && rule.type !== 'profit_target') {
      const pct = Math.round((rule.used / rule.limit) * 100);
      const isDay = rule.type === 'min_trading_days';
      const usedFmt = isDay ? `${rule.used}` : fmtCurrency(rule.used);
      const limitFmt = isDay ? `${rule.limit} days` : fmtCurrency(rule.limit);
      return {
        severity: 'warning',
        message: `${rule.name} at ${pct}% — ${usedFmt} of ${limitFmt} used`,
      };
    }
  }

  // Near target (profit >= 90%)
  if (profitRule && profitRule.limit > 0) {
    const pct = profitRule.used / profitRule.limit;
    if (pct >= 0.9) {
      return {
        severity: 'near_target',
        message: `Almost there! ${fmtCurrency(profitRule.used)} of ${fmtCurrency(profitRule.limit)} target reached`,
      };
    }
  }

  return null;
}

function RuleBanner({ challenge }: { challenge: Challenge }) {
  const banner = getRuleBanner(challenge);
  if (!banner) return null;

  const styles: Record<BannerSeverity, { bg: string; color: string; icon: string }> = {
    breached:    { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', icon: '✕' },
    warning:     { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '⚠' },
    near_target: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', icon: '✓' },
  };

  const s = styles[banner.severity];

  return (
    <div style={{
      padding: '8px 12px',
      borderRadius: 6,
      background: s.bg,
      border: `0.5px solid ${s.color}33`,
      display: 'flex', alignItems: 'center', gap: 7,
      fontSize: 11, fontWeight: 500,
      color: s.color,
      marginBottom: 10,
    }}>
      <span style={{ fontSize: 12, flexShrink: 0 }}>{s.icon}</span>
      <span>{banner.message}</span>
    </div>
  );
}

// ── #16 Trade analytics ───────────────────────────────────────────────────────

function calcStreak(trades: TradeEntry[]): { win: number; loss: number } {
  let win = 0, loss = 0, curWin = 0, curLoss = 0;
  for (const t of trades) {
    if (t.pnl > 0) { curWin++; curLoss = 0; }
    else            { curLoss++; curWin = 0; }
    if (curWin  > win)  win  = curWin;
    if (curLoss > loss) loss = curLoss;
  }
  return { win, loss };
}

function TradeAnalytics({ trades }: { trades: TradeEntry[] }) {
  if (!trades || trades.length === 0) return null;

  const wins       = trades.filter(t => t.pnl > 0);
  const totalPnl   = trades.reduce((s, t) => s + t.pnl, 0);
  const avgPnl     = totalPnl / trades.length;
  const best       = Math.max(...trades.map(t => t.pnl));
  const worst      = Math.min(...trades.map(t => t.pnl));
  const winRate    = Math.round((wins.length / trades.length) * 100);
  const streak     = calcStreak(trades);

  const pnlColor   = avgPnl >= 0 ? 'var(--green)' : 'var(--red)';
  const bestColor  = best >= 0 ? 'var(--green)' : 'var(--red)';
  const worstColor = worst >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border-soft)' }}>
      <SectionLabel>Trade analytics</SectionLabel>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 1,
        background: 'var(--border-soft)',
        borderRadius: 6, overflow: 'hidden',
      }}>
        <SmallMetricTile
          label="Avg P&L"
          value={`${avgPnl >= 0 ? '+' : '-'}${fmtCurrency(Math.abs(avgPnl))}`}
          color={pnlColor}
        />
        <SmallMetricTile
          label="Best trade"
          value={`+${fmtCurrency(best)}`}
          color={bestColor}
        />
        <SmallMetricTile
          label="Worst trade"
          value={`${worst >= 0 ? '+' : '-'}${fmtCurrency(Math.abs(worst))}`}
          color={worstColor}
        />
        <SmallMetricTile
          label="Win rate"
          value={`${winRate}%`}
          color={winRate >= 50 ? 'var(--green)' : 'var(--red)'}
        />
        <SmallMetricTile
          label="Best streak"
          value={`${streak.win}W`}
          color="var(--green)"
        />
        <SmallMetricTile
          label="Worst streak"
          value={`${streak.loss}L`}
          color={streak.loss > 0 ? 'var(--red)' : 'var(--text-muted)'}
        />
      </div>
    </div>
  );
}

// ── #6 + #7 Trade list section ────────────────────────────────────────────────

function TradeListSection({ challenge }: { challenge: Challenge }) {
  const trades = challenge.trades;
  const [showAll, setShowAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const deleteTrade = useDeleteTradeFromChallenge();

  if (!trades || trades.length === 0) {
    return (
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border-soft)' }}>
        <SectionLabel>Recent trades</SectionLabel>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No individual trades recorded
        </div>
      </div>
    );
  }

  const sorted = [...trades].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const LIMIT = 10;
  const visible = showAll ? sorted : sorted.slice(0, LIMIT);
  const hasMore = sorted.length > LIMIT;

  return (
    <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border-soft)' }}>
      <SectionLabel>Recent trades</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map(trade => {
          const isLong    = trade.direction === 'LONG';
          const pnlColor  = trade.pnl >= 0 ? 'var(--green)' : 'var(--red)';
          const pnlSign   = trade.pnl >= 0 ? '+' : '-';
          const isConfirm = confirmDelete === trade.id;

          return (
            <div
              key={trade.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 8px',
                background: 'var(--bg-surface)',
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              {/* Date */}
              <span style={{
                color: 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
                width: 60,
              }}>
                {fmtDate(trade.date)}
              </span>

              {/* Symbol */}
              <span style={{
                fontWeight: 600, color: 'var(--text-primary)',
                flexShrink: 0, width: 50,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {trade.symbol}
              </span>

              {/* Direction badge */}
              <span style={{
                background: isLong ? 'var(--green-bg)' : 'var(--red-bg)',
                color: isLong ? 'var(--green)' : 'var(--red)',
                border: `0.5px solid ${isLong ? 'var(--green-border)' : 'var(--red-border)'}`,
                borderRadius: 3,
                padding: '1px 5px',
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}>
                {trade.direction}
              </span>

              {/* Lot size */}
              {trade.lotSize != null && (
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  {trade.lotSize}L
                </span>
              )}

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* P&L */}
              <span style={{
                color: pnlColor,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}>
                {pnlSign}${Math.abs(trade.pnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>

              {/* Delete / confirm */}
              {isConfirm ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Delete?</span>
                  <button
                    onClick={() => {
                      deleteTrade(challenge.id, trade.id);
                      setConfirmDelete(null);
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 10, fontWeight: 600, color: 'var(--red)',
                      padding: '0 2px', fontFamily: 'inherit',
                    }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 10, color: 'var(--text-muted)',
                      padding: '0 2px', fontFamily: 'inherit',
                    }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(trade.id)}
                  title="Remove trade"
                  style={{
                    width: 20, height: 20,
                    background: 'none', border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: 13, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 3,
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            marginTop: 8,
            background: 'none', border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 11,
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          {showAll ? 'Show less' : `Show all ${sorted.length} trades`}
        </button>
      )}
    </div>
  );
}

// ── Icon buttons ──────────────────────────────────────────────────────────────

function IconBtn({ onClick, title, children }: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28, height: 28,
        background: 'transparent', border: 'none',
        cursor: 'pointer',
        color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ── #17 Export to clipboard ───────────────────────────────────────────────────

function buildExportText(challenge: Challenge): string {
  const trades     = challenge.trades ?? [];
  const wins       = trades.filter(t => t.pnl > 0);
  const winRate    = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0;
  const pnlSign    = challenge.total_pnl >= 0 ? '+' : '-';
  const pnlPct     = ((challenge.total_pnl / challenge.starting_balance) * 100).toFixed(2);

  const startDay = challenge.trading_days.filter(
    d => d.result === 'win' || d.result === 'loss',
  ).length;

  const totalDays = Math.round(
    (new Date(challenge.end_date).getTime() - new Date(challenge.start_date).getTime()) / 86400000,
  );

  const ruleLines = challenge.rules
    .filter(r => r.type !== 'news_trading' && r.type !== 'weekend_holding')
    .map(r => {
      const pct = r.limit > 0 ? Math.round((r.used / r.limit) * 100) : 0;
      const icon = r.status === 'breached' ? '✕' : r.status === 'warning' ? '⚠' : '✓';
      return `${icon} ${r.name} ${pct}%`;
    })
    .join(' | ');

  return [
    `${challenge.firm} $${challenge.account_size.toLocaleString()} Challenge — Phase ${challenge.phase}`,
    `Status: ${challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)} | Day ${startDay} of ${totalDays}`,
    `Balance: $${challenge.current_balance.toLocaleString('en-US', { maximumFractionDigits: 0 })} | P&L: ${pnlSign}$${Math.abs(challenge.total_pnl).toLocaleString('en-US', { maximumFractionDigits: 0 })} (${pnlSign}${Math.abs(Number(pnlPct))}%)`,
    `Win Rate: ${winRate}% | Trades: ${trades.length}`,
    `Rules: ${ruleLines}`,
  ].join('\n');
}

// ── Main card ─────────────────────────────────────────────────────────────────

export default function ChallengeCard({ challenge }: Props) {
  const [shareOpen, setShareOpen]       = useState(false);
  const [logTradeOpen, setLogTradeOpen] = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [copied, setCopied]             = useState(false);

  const graduateChallenge = useGraduateChallenge();
  const firm = FIRM_COLORS[challenge.firm] ?? FIRM_COLORS.Other;

  const pnlColor   = challenge.total_pnl >= 0 ? 'var(--green)' : 'var(--red)';
  const pnlSign    = challenge.total_pnl >= 0 ? '+' : '-';

  const drawdownRule  = challenge.rules.find(r => r.type === 'total_drawdown');
  const drawdownPct   = drawdownRule ? drawdownRule.used / drawdownRule.limit : 0;
  const drawdownColor = drawdownPct >= 0.8 ? 'var(--red)' : drawdownPct >= 0.6 ? 'var(--amber)' : 'var(--text-primary)';

  const daysColor = challenge.days_remaining < 7 ? 'var(--amber)' : 'var(--text-primary)';

  const topBorderColor =
    challenge.status === 'active'     ? 'var(--green)' :
    challenge.status === 'near_limit' ? 'var(--amber)' :
    'transparent';

  const isActionable = challenge.status === 'active' || challenge.status === 'near_limit';

  function handleExport() {
    const text = buildExportText(challenge);
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderTop: `2px solid ${topBorderColor}`,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 12,
      }}>

        {/* ── 1. Header ── */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '0.5px solid var(--border-soft)',
          background: 'var(--bg-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: firm.bg,
                border: `0.5px solid ${firm.border}`,
                borderRadius: 3, padding: '2px 7px', width: 'fit-content',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: firm.text,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  {challenge.firm}
                </span>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                ${challenge.account_size.toLocaleString()} Challenge — Phase {challenge.phase}
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Started {fmtDate(challenge.start_date)} · {challenge.days_remaining} days remaining
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {/* #17 Export button */}
              <div style={{ position: 'relative' }}>
                <IconBtn onClick={handleExport} title="Copy summary to clipboard">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </IconBtn>
                {copied && (
                  <div style={{
                    position: 'absolute', top: -28, left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-surface)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 4,
                    padding: '3px 7px',
                    fontSize: 10, fontWeight: 500,
                    color: 'var(--green)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>
                    Copied!
                  </div>
                )}
              </div>

              {/* #8 Edit button */}
              <IconBtn onClick={() => setEditOpen(true)} title="Edit challenge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </IconBtn>

              <StatusChip status={challenge.status} />
            </div>
          </div>
        </div>

        {/* ── 2. Metrics grid ── */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border-soft)' }}>
          {/* #13 Rule notification banner */}
          <RuleBanner challenge={challenge} />

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 1,
            background: 'var(--border-soft)',
            borderRadius: 6, overflow: 'hidden',
          }}>
            <MetricTile
              label="Balance"
              value={`$${challenge.current_balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            />
            <MetricTile
              label="Total P&L"
              value={`${pnlSign}$${Math.abs(challenge.total_pnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              color={pnlColor}
            />
            <MetricTile
              label="Max DD used"
              value={drawdownRule ? fmtCurrency(drawdownRule.used) : '—'}
              color={drawdownColor}
            />
            <MetricTile
              label="Days left"
              value={String(challenge.days_remaining)}
              color={daysColor}
            />
          </div>
        </div>

        {/* ── 2b. Equity curve ── */}
        <div style={{ padding: '12px 16px 0', borderBottom: '0.5px solid var(--border-soft)' }}>
          <SectionLabel>Equity curve</SectionLabel>
          <EquityCurve challenge={challenge} height={180} />
        </div>

        {/* ── 2c. Trade analytics (#16) ── */}
        {challenge.trades && challenge.trades.length > 0 && (
          <TradeAnalytics trades={challenge.trades} />
        )}

        {/* ── 2d. Recent trades (#6 + #7) ── */}
        <TradeListSection challenge={challenge} />

        {/* ── 3. Rule compliance ── */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border-soft)' }}>
          <SectionLabel>Rule compliance</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {challenge.rules
              .filter(r => r.type !== 'news_trading' && r.type !== 'weekend_holding')
              .map(r => <RuleRow key={r.type} rule={r} />)
            }
          </div>
        </div>

        {/* ── 4. Trading calendar ── */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border-soft)' }}>
          <TradingCalendar challenge={challenge} />
        </div>

        {/* ── 5. Phase tracker ── */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border-soft)' }}>
          <PhaseTracker phase={challenge.phase} />
        </div>

        {/* ── 6. Action buttons ── */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
          {/* #14 Graduate button when passed */}
          {challenge.status === 'passed' && challenge.phase < 3 ? (
            <button
              onClick={() => graduateChallenge(challenge.id)}
              style={{
                flex: 1,
                background: 'var(--green-bg)',
                color: '#22c55e',
                border: '0.5px solid var(--green-border)',
                borderRadius: 6,
                padding: '8px 0',
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'opacity 0.15s',
              }}
            >
              Graduate to Phase {(challenge.phase + 1) as 2 | 3}
            </button>
          ) : (
            isActionable && (
              <button
                onClick={() => setLogTradeOpen(true)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 6,
                  padding: '8px 0',
                  fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                className="log-trade-btn"
              >
                + Log trade
              </button>
            )
          )}
          <button
            onClick={() => setShareOpen(true)}
            style={{
              flex: 1,
              background: 'var(--green-bg)',
              color: 'var(--green)',
              border: '0.5px solid var(--green-border)',
              borderRadius: 6,
              padding: '8px 0',
              fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            className="share-progress-btn"
          >
            Share progress on Candl. feed
          </button>
        </div>
      </div>

      {shareOpen && (
        <ShareChallengeModal challenge={challenge} onClose={() => setShareOpen(false)} />
      )}

      {logTradeOpen && (
        <AddTradeModal
          onClose={() => setLogTradeOpen(false)}
          preselectedChallengeId={challenge.id}
        />
      )}

      {editOpen && (
        <EditChallengeModal challenge={challenge} onClose={() => setEditOpen(false)} />
      )}
    </>
  );
}
