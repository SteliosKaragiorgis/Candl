import React, { useState, useEffect } from 'react';
import type { Challenge, PropFirm, ChallengePhase, Rule } from '../../types/propfirm';
import { useAddChallenge, computeRuleStatus, computeChallengeStatus } from '../../hooks/useChallenge';

interface Props {
  onClose: () => void;
}

const FIRMS: { value: PropFirm; label: string }[] = [
  { value: 'FTMO',       label: 'FTMO' },
  { value: 'TFT',        label: 'The Funded Trader' },
  { value: 'MFF',        label: 'MyForexFunds' },
  { value: 'TFF',        label: 'True Forex Funds' },
  { value: 'Apex',       label: 'Apex Trader' },
  { value: 'E8',         label: 'E8 Funding' },
  { value: 'FundedNext', label: 'Funded Next' },
  { value: 'Other',      label: 'Other' },
];

const SIZES = [10000, 25000, 50000, 100000, 200000];

type FirmPreset = {
  profit_target: number;
  daily_loss: number;
  total_drawdown: number;
  min_days: number;
};

const PRESETS: Partial<Record<`${PropFirm}_${number}`, FirmPreset>> = {
  FTMO_100000:  { profit_target: 10000, daily_loss: 5000,  total_drawdown: 10000, min_days: 10 },
  FTMO_50000:   { profit_target: 5000,  daily_loss: 2500,  total_drawdown: 5000,  min_days: 10 },
  FTMO_25000:   { profit_target: 2500,  daily_loss: 1250,  total_drawdown: 2500,  min_days: 10 },
  FTMO_10000:   { profit_target: 1000,  daily_loss: 500,   total_drawdown: 1000,  min_days: 10 },
  TFT_100000:   { profit_target: 8000,  daily_loss: 5000,  total_drawdown: 10000, min_days: 5  },
  TFT_50000:    { profit_target: 4000,  daily_loss: 2500,  total_drawdown: 5000,  min_days: 5  },
  TFT_25000:    { profit_target: 2000,  daily_loss: 1250,  total_drawdown: 2500,  min_days: 5  },
  TFT_10000:    { profit_target: 800,   daily_loss: 500,   total_drawdown: 1000,  min_days: 5  },
  Apex_100000:  { profit_target: 6000,  daily_loss: 3000,  total_drawdown: 6000,  min_days: 0  },
  E8_100000:    { profit_target: 8000,  daily_loss: 5000,  total_drawdown: 8000,  min_days: 5  },
};

function getPreset(firm: PropFirm, size: number): FirmPreset {
  const key = `${firm}_${size}` as keyof typeof PRESETS;
  return (
    PRESETS[key] ?? {
      profit_target:  Math.round(size * 0.08),
      daily_loss:     Math.round(size * 0.05),
      total_drawdown: Math.round(size * 0.10),
      min_days:       5,
    }
  );
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysRemaining(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));
}

export default function AddChallengeModal({ onClose }: Props) {
  const addChallenge = useAddChallenge();

  const [firm, setFirm]           = useState<PropFirm>('FTMO');
  const [size, setSize]           = useState<number>(100000);
  const [phase, setPhase]         = useState<ChallengePhase>(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration]   = useState(30);
  const [mt5Account, setMt5Account]       = useState('');
  const [newsTrading, setNewsTrading]     = useState(false);
  const [weekendHolding, setWeekendHolding] = useState(false);
  const [preset, setPreset] = useState<FirmPreset>(() => getPreset('FTMO', 100000));

  useEffect(() => {
    setPreset(getPreset(firm, size));
  }, [firm, size]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const endDate = addDays(startDate, duration);

    const rules: Rule[] = [
      { name: 'Profit target',    type: 'profit_target',    limit: preset.profit_target,  used: 0, status: 'safe' },
      { name: 'Max daily loss',   type: 'daily_loss',       limit: preset.daily_loss,     used: 0, status: 'safe' },
      { name: 'Max drawdown',     type: 'total_drawdown',   limit: preset.total_drawdown, used: 0, status: 'safe' },
      { name: 'Min trading days', type: 'min_trading_days', limit: preset.min_days,       used: 0, status: 'safe' },
    ];

    if (!newsTrading)    rules.push({ name: 'No news trading',  type: 'news_trading',    limit: 0, used: 0, status: 'safe' });
    if (!weekendHolding) rules.push({ name: 'No weekend hold',  type: 'weekend_holding', limit: 0, used: 0, status: 'safe' });

    const challenge: Omit<Challenge, 'id' | 'created_at'> = {
      firm,
      account_size: size,
      phase,
      status: computeChallengeStatus(rules),
      start_date: startDate,
      end_date: endDate,
      days_remaining: daysRemaining(endDate),
      starting_balance: size,
      current_balance: size,
      total_pnl: 0,
      rules,
      trading_days: [],
      trade_ids: [],
      ...(mt5Account ? { mt5_account: mt5Account } : {}),
    };

    addChallenge(challenge);
    onClose();
  }

  const endDate = addDays(startDate, duration);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)',
        border: 'var(--bw) solid var(--border)',
        borderRadius: 8,
        width: '100%', maxWidth: 460,
        animation: 'slideIn 0.22s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: 'var(--bw) solid var(--border-subtle)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            Add challenge
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', fontSize: 18, padding: '0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Prop firm">
                <Select value={firm} onChange={v => setFirm(v as PropFirm)}>
                  {FIRMS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </Field>
              <Field label="Account size">
                <Select value={size} onChange={v => setSize(Number(v))}>
                  {SIZES.map(s => <option key={s} value={s}>${s.toLocaleString()}</option>)}
                </Select>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Phase">
                <Select value={phase} onChange={v => setPhase(Number(v) as ChallengePhase)}>
                  <option value={1}>Phase 1 — Challenge</option>
                  <option value={2}>Phase 2 — Verification</option>
                  <option value={3}>Phase 3 — Funded</option>
                </Select>
              </Field>
              <Field label="Start date">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label={`Duration (days) · ends ${endDate}`}>
                <input
                  type="number" min={1} max={365} value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  style={inputStyle}
                />
              </Field>
              <Field label="MT5 account # (optional)">
                <input
                  type="text" placeholder="e.g. 123456" value={mt5Account}
                  onChange={e => setMt5Account(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Rules section */}
            <div>
              <div style={{
                fontSize: 10, fontWeight: 500, letterSpacing: '0.05em',
                color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8,
              }}>
                Rules (auto-filled for {firm} ${size.toLocaleString()})
              </div>
              <div style={{
                background: 'var(--surface3)',
                border: 'var(--bw) solid var(--border-subtle)',
                borderRadius: 5,
                padding: '10px 12px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <RuleRow label="Profit target"    value={preset.profit_target}  onChange={v => setPreset(p => ({ ...p, profit_target: v }))} />
                <RuleRow label="Max daily loss"   value={preset.daily_loss}     onChange={v => setPreset(p => ({ ...p, daily_loss: v }))} />
                <RuleRow label="Max drawdown"     value={preset.total_drawdown} onChange={v => setPreset(p => ({ ...p, total_drawdown: v }))} />
                <RuleRow label="Min trading days" value={preset.min_days}       onChange={v => setPreset(p => ({ ...p, min_days: v }))} prefix="" />
                <div style={{ borderTop: 'var(--bw) solid var(--border-subtle)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <ToggleRow label="News trading allowed"    value={newsTrading}    onChange={setNewsTrading} />
                  <ToggleRow label="Weekend holding allowed" value={weekendHolding} onChange={setWeekendHolding} />
                </div>
              </div>
            </div>

            {/* Starting balance */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0',
              borderTop: 'var(--bw) solid var(--border-subtle)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Starting balance</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                ${size.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              style={{
                background: 'var(--green-bg)',
                color: '#22c55e',
                border: 'var(--bw) solid var(--green-border)',
                borderRadius: 6,
                padding: '10px 0',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Add challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--surface3)',
  border: 'var(--bw) solid var(--border-subtle)',
  borderRadius: 4,
  color: 'var(--text)',
  fontSize: 12,
  padding: '7px 10px',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontSize: 10, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500,
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function Select({ value, onChange, children }: {
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        ...inputStyle,
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: 28,
      }}
    >
      {children}
    </select>
  );
}

function RuleRow({ label, value, onChange, prefix = '$' }: {
  label: string; value: number; onChange: (v: number) => void; prefix?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {prefix && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{prefix}</span>}
        <input
          type="number" min={0} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ ...inputStyle, width: 90, padding: '4px 8px', textAlign: 'right' }}
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 32, height: 18,
          borderRadius: 9,
          background: value ? '#22c55e' : 'var(--border-emphasis)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute',
          top: 2,
          left: value ? 16 : 2,
          width: 14, height: 14,
          borderRadius: '50%',
          background: 'var(--surface)',
          transition: 'left 0.15s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        }} />
      </button>
    </div>
  );
}
