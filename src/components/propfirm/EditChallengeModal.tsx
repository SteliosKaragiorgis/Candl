import React, { useState } from 'react';
import type { Challenge, PropFirm, ChallengePhase } from '../../types/propfirm';
import { useUpdateChallenge } from '../../hooks/useChallenge';

interface Props {
  challenge: Challenge;
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

function SelectField({ value, onChange, children }: {
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

function RuleInput({ label, value, onChange, prefix = '$' }: {
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

export default function EditChallengeModal({ challenge, onClose }: Props) {
  const updateChallenge = useUpdateChallenge();

  const [firm, setFirm]       = useState<PropFirm>(challenge.firm);
  const [size, setSize]       = useState<number>(challenge.account_size);
  const [phase, setPhase]     = useState<ChallengePhase>(challenge.phase);
  const [endDate, setEndDate] = useState(challenge.end_date);

  // Rule limits
  const getLimit = (type: string) =>
    challenge.rules.find(r => r.type === type)?.limit ?? 0;

  const [profitTarget,    setProfitTarget]    = useState(getLimit('profit_target'));
  const [dailyLoss,       setDailyLoss]       = useState(getLimit('daily_loss'));
  const [totalDrawdown,   setTotalDrawdown]   = useState(getLimit('total_drawdown'));
  const [minTradingDays,  setMinTradingDays]  = useState(getLimit('min_trading_days'));

  function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86400000));

    const updatedRules = challenge.rules.map(r => {
      if (r.type === 'profit_target')    return { ...r, limit: profitTarget };
      if (r.type === 'daily_loss')       return { ...r, limit: dailyLoss };
      if (r.type === 'total_drawdown')   return { ...r, limit: totalDrawdown };
      if (r.type === 'min_trading_days') return { ...r, limit: minTradingDays };
      return r;
    });

    updateChallenge(challenge.id, {
      firm,
      account_size: size,
      phase,
      end_date: endDate,
      days_remaining: daysLeft,
      rules: updatedRules,
    });

    onClose();
  }

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
            Edit challenge
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', fontSize: 18, padding: '0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Prop firm">
                <SelectField value={firm} onChange={v => setFirm(v as PropFirm)}>
                  {FIRMS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </SelectField>
              </Field>
              <Field label="Account size">
                <SelectField value={size} onChange={v => setSize(Number(v))}>
                  {SIZES.map(s => <option key={s} value={s}>${s.toLocaleString()}</option>)}
                </SelectField>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Phase">
                <SelectField value={phase} onChange={v => setPhase(Number(v) as ChallengePhase)}>
                  <option value={1}>Phase 1 — Challenge</option>
                  <option value={2}>Phase 2 — Verification</option>
                  <option value={3}>Phase 3 — Funded</option>
                </SelectField>
              </Field>
              <Field label="End date">
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Rule limits */}
            <div>
              <div style={{
                fontSize: 10, fontWeight: 500, letterSpacing: '0.05em',
                color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8,
              }}>
                Rule limits
              </div>
              <div style={{
                background: 'var(--surface3)',
                border: 'var(--bw) solid var(--border-subtle)',
                borderRadius: 5,
                padding: '10px 12px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <RuleInput label="Profit target"    value={profitTarget}   onChange={setProfitTarget} />
                <RuleInput label="Max daily loss"   value={dailyLoss}      onChange={setDailyLoss} />
                <RuleInput label="Max drawdown"     value={totalDrawdown}  onChange={setTotalDrawdown} />
                <RuleInput label="Min trading days" value={minTradingDays} onChange={setMinTradingDays} prefix="" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: 'var(--text-3)',
                  border: 'var(--bw) solid var(--border)',
                  borderRadius: 6,
                  padding: '10px 0',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
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
                Save changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
