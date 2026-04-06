import React, { useState } from 'react';
import type { Challenge, PropFirm, Rule } from '../../types/propfirm';
import ShareChallengeModal from './ShareChallengeModal';

interface Props {
  challenge: Challenge;
}

// ── Firm colours (rgba so they work on any surface) ───────────────────────────

const FIRM_COLORS: Record<PropFirm, { bg: string; text: string; border: string }> = {
  FTMO:       { bg: '#0d1627', text: '#3b82f6', border: '#1a3a5c' },
  TFT:        { bg: '#1a0d27', text: '#8b5cf6', border: '#2d1a5c' },
  MFF:        { bg: 'var(--surface)', text: 'var(--text-3)', border: 'var(--border)' },
  TFF:        { bg: 'var(--surface)', text: 'var(--text-3)', border: 'var(--border)' },
  Apex:       { bg: '#1f1200', text: '#f59e0b', border: '#3a2200' },
  E8:         { bg: '#0d1f12', text: '#22c55e', border: '#1a3a22' },
  FundedNext: { bg: '#1a0d27', text: '#8b5cf6', border: '#2d1a5c' },
  Other:      { bg: 'var(--surface)', text: 'var(--text-3)', border: 'var(--border)' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  const abs = Math.abs(n);
  return abs >= 1000
    ? `$${(abs / 1000).toFixed(1)}k`
    : `$${abs.toFixed(0)}`;
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
  if (pct >= 0.8) return '#ef4444';
  if (pct >= 0.6) return '#f59e0b';
  return '#22c55e';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: Challenge['status'] }) {
  const cfg = {
    active:     { label: 'Active',      color: '#22c55e', pulse: true  },
    near_limit: { label: 'Near limit',  color: '#f59e0b', pulse: true  },
    failed:     { label: 'Failed',      color: '#ef4444', pulse: false },
    passed:     { label: 'Passed',      color: '#22c55e', pulse: false },
  }[status];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: `${cfg.color}14`,
      border: `0.5px solid ${cfg.color}33`,
      borderRadius: 4,
      padding: '3px 8px',
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
      <span style={{ fontSize: 10, fontWeight: 500, color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}

function MetricTile({
  label, value, color = '#c4c4c4',
}: {
  label: string; value: string; color?: string;
}) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '0.5px solid var(--border)',
      borderRadius: 4,
      padding: '8px 10px',
    }}>
      <div style={{
        fontSize: 9, color: 'var(--border-emphasis)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: 4, fontWeight: 500,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, fontWeight: 500,
        color, fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

function RuleRow({ rule }: { rule: Rule }) {
  const pct = Math.min(rule.used / rule.limit, 1);
  const isPercent = rule.type === 'min_trading_days';
  const barColor = pctBarColor(pct);

  const dotColor =
    rule.status === 'breached' ? '#ef4444' :
    rule.status === 'warning'  ? '#f59e0b' :
    '#22c55e';

  const fmtValue = isPercent
    ? `${rule.used}/${rule.limit} days`
    : `${fmtCurrency(rule.used)} / ${fmtCurrency(rule.limit)}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontSize: 11, color: 'var(--text-3)',
        width: 130, flexShrink: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {rule.name}
      </span>

      <div style={{
        flex: 1,
        height: 4,
        background: 'var(--border)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct * 100}%`,
          height: '100%',
          background: barColor,
          borderRadius: 2,
          transition: 'width 0.4s ease',
        }} />
      </div>

      <span style={{
        fontSize: 10, color: 'var(--text-3)',
        fontVariantNumeric: 'tabular-nums',
        minWidth: 90, textAlign: 'right',
        flexShrink: 0,
      }}>
        {fmtValue}
      </span>

      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: dotColor, flexShrink: 0,
      }} />
    </div>
  );
}

function TradingCalendar({ challenge }: { challenge: Challenge }) {
  const dates = getDates(challenge.start_date, challenge.end_date);
  const dayMap = new Map(challenge.trading_days.map(d => [d.date, d]));
  const todayStr = today();

  const cellBg = (date: string) => {
    if (date > todayStr) return 'transparent';
    const day = dayMap.get(date);
    if (!day) return 'var(--border)';
    if (day.result === 'win')       return '#0d1f12';
    if (day.result === 'loss')      return '#1f0d0d';
    if (day.result === 'breakeven') return '#0d1a27';
    return 'var(--border)';
  };

  const cellColor = (date: string) => {
    if (date > todayStr) return 'transparent';
    const day = dayMap.get(date);
    if (!day) return 'var(--border-emphasis)';
    if (day.result === 'win')       return '#22c55e';
    if (day.result === 'loss')      return '#ef4444';
    if (day.result === 'breakeven') return '#3b82f6';
    return 'var(--border-emphasis)';
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
        {dates.map(date => (
          <div
            key={date}
            title={date}
            style={{
              width: 22, height: 22,
              borderRadius: 3,
              background: cellBg(date),
              border: date === todayStr
                ? '1.5px solid #22c55e'
                : '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 500,
              color: cellColor(date),
              flexShrink: 0,
            }}
          >
            {cellLabel(date)}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseTracker({ phase }: { phase: Challenge['phase'] }) {
  const phases = [
    { num: 1, label: 'Challenge' },
    { num: 2, label: 'Verification' },
    { num: 3, label: 'Funded' },
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
                background: 'var(--surface)',
                border: `0.5px solid ${isActive ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                borderTop: isActive
                  ? '2px solid #22c55e'
                  : `2px solid ${isDone ? 'rgba(34,197,94,0.35)' : 'var(--border)'}`,
                borderRadius: 4,
                padding: '8px 8px 7px',
                opacity: isLocked ? 0.4 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{
                  fontSize: 9, fontWeight: 500,
                  color: isActive ? '#22c55e' : isDone ? '#22c55e' : 'var(--border-emphasis)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  opacity: isDone ? 0.6 : 1,
                }}>
                  Phase {p.num}
                </span>
                {isDone && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div style={{ fontSize: 10, color: isActive ? 'var(--text-2)' : 'var(--border-emphasis)' }}>
                {p.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 500,
      letterSpacing: '0.05em', textTransform: 'uppercase',
      color: 'var(--border-emphasis)',
      marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export default function ChallengeCard({ challenge }: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const firm = FIRM_COLORS[challenge.firm] ?? FIRM_COLORS.Other;

  const pnlColor = challenge.total_pnl >= 0 ? '#22c55e' : '#ef4444';
  const pnlSign  = challenge.total_pnl >= 0 ? '+' : '-';

  const drawdownRule = challenge.rules.find(r => r.type === 'total_drawdown');
  const drawdownPct  = drawdownRule ? drawdownRule.used / drawdownRule.limit : 0;
  const drawdownColor = drawdownPct >= 0.8 ? '#ef4444' : drawdownPct >= 0.6 ? '#f59e0b' : 'var(--text-2)';

  const daysColor = challenge.days_remaining < 7 ? '#f59e0b' : 'var(--text-2)';

  return (
    <>
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {/* ── 1. Header ── */}
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: firm.bg,
                border: `0.5px solid ${firm.text}33`,
                borderRadius: 3,
                padding: '2px 7px',
                width: 'fit-content',
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 500,
                  color: firm.text,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  {challenge.firm}
                </span>
              </div>

              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 }}>
                ${challenge.account_size.toLocaleString()} Challenge — Phase {challenge.phase}
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Started {fmtDate(challenge.start_date)} · {challenge.days_remaining} days remaining
              </div>
            </div>

            <StatusChip status={challenge.status} />
          </div>
        </div>

        {/* ── 2. Metrics grid ── */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
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

        {/* ── 3. Rule compliance ── */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
          <SectionLabel>Rule compliance</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {challenge.rules
              .filter(r => r.type !== 'news_trading' && r.type !== 'weekend_holding')
              .map(r => <RuleRow key={r.type} rule={r} />)
            }
          </div>
        </div>

        {/* ── 4. Trading calendar ── */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
          <TradingCalendar challenge={challenge} />
        </div>

        {/* ── 5. Phase tracker ── */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
          <PhaseTracker phase={challenge.phase} />
        </div>

        {/* ── 6. Share button ── */}
        <div style={{ padding: '12px 16px' }}>
          <button
            onClick={() => setShareOpen(true)}
            style={{
              width: '100%',
              background: '#0d1f12',
              color: '#22c55e',
              border: '0.5px solid #1a3a22',
              borderRadius: 6,
              padding: '9px 0',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Share progress on Candl. feed
          </button>
        </div>
      </div>

      {shareOpen && (
        <ShareChallengeModal challenge={challenge} onClose={() => setShareOpen(false)} />
      )}
    </>
  );
}
