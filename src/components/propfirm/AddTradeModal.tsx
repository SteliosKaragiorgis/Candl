import React, { useState, useEffect, useCallback } from 'react';
import type { Challenge } from '../../types/propfirm';
import { useChallenges, applyManualTradeToChallenge } from '../../hooks/useChallenge';

interface Props {
  onClose: () => void;
  /** Pre-select a challenge when opened from a ChallengeCard. */
  preselectedChallengeId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

type SetupType = 'BREAKOUT' | 'TREND_FOLLOW' | 'REVERSAL' | 'RANGE' | 'NEWS' | 'SCALP';

function inferInstrument(symbol: string): string {
  const s = symbol.toUpperCase();
  if (/^(BTC|ETH|SOL|XRP|BNB|ADA|DOGE)/.test(s)) return 'CRYPTO';
  if (/^(SPX|NAS|US30|DAX|FTSE|NDX|NAS100|US500|DOW|CAC|NIKKEI)/.test(s)) return 'INDICES';
  if (/^(AAPL|TSLA|AMZN|GOOGL|MSFT|META|NVDA)/.test(s)) return 'STOCKS';
  if (/^(XAU|XAG|OIL|BRENT|WTI|USOIL|XAUUSD|XAGUSD)/.test(s)) return 'OTHER';
  // Default 6-char FX pairs
  if (s.length === 6 || s.length === 7) return 'FX';
  return 'OTHER';
}

function formatChallengeLabel(c: Challenge): string {
  const size =
    c.account_size >= 1000
      ? `$${(c.account_size / 1000).toFixed(0)}k`
      : `$${c.account_size}`;
  return `${c.firm} ${size} Phase ${c.phase}`;
}

// ── Style constants ───────────────────────────────────────────────────────────

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 28,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 500,
};

// ── Sub-components ────────────────────────────────────────────────────────────

let fieldIdCounter = 0;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const [id] = useState(() => `trade-field-${++fieldIdCounter}`);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { id })
          : child,
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function AddTradeModal({ onClose, preselectedChallengeId }: Props) {
  const challenges = useChallenges();
  const activeChallenges = challenges.filter(
    c => c.status === 'active' || c.status === 'near_limit',
  );

  const defaultChallengeId =
    preselectedChallengeId ??
    (activeChallenges.length > 0 ? activeChallenges[0].id : '');

  const [challengeId, setChallengeId] = useState(defaultChallengeId);
  const [symbol, setSymbol]           = useState('');
  const [direction, setDirection]     = useState<'LONG' | 'SHORT'>('LONG');
  const [entry, setEntry]             = useState('');
  const [exit, setExit]               = useState('');
  const [lotSize, setLotSize]         = useState('');
  const [stopLoss, setStopLoss]       = useState('');
  const [takeProfit, setTakeProfit]   = useState('');
  const [date, setDate]               = useState(todayStr());
  const [pnl, setPnl]                 = useState('');
  const [setupType, setSetupType]     = useState<SetupType | ''>('');
  const [notes, setNotes]             = useState('');
  const [error, setError]             = useState('');

  // Keep challenge dropdown in sync if the preselected id changes after mount
  useEffect(() => {
    if (preselectedChallengeId) setChallengeId(preselectedChallengeId);
  }, [preselectedChallengeId]);

  // Keyboard: Escape to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectedChallenge = activeChallenges.find(c => c.id === challengeId);

  function validate(): string {
    if (!challengeId) return 'Please select a challenge.';
    if (!symbol.trim()) return 'Symbol is required.';
    if (!entry) return 'Entry price is required.';
    if (!exit) return 'Exit price is required.';
    if (pnl === '' || pnl === undefined) return 'P&L is required.';
    if (isNaN(Number(pnl))) return 'P&L must be a valid number.';
    if (!date) return 'Date is required.';
    if (selectedChallenge) {
      if (date < selectedChallenge.start_date) {
        return `Date cannot be before challenge start (${selectedChallenge.start_date}).`;
      }
      if (date > selectedChallenge.end_date) {
        return `Date cannot be after challenge end (${selectedChallenge.end_date}).`;
      }
    }
    return '';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const tradeId = `manual-${Date.now()}`;
    const pnlValue = Number(pnl);

    applyManualTradeToChallenge(challengeId, pnlValue, date, tradeId);
    onClose();
  }

  if (activeChallenges.length === 0) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{
          background: 'var(--surface)',
          border: 'var(--bw) solid var(--border)',
          borderRadius: 8,
          width: '100%', maxWidth: 380,
          padding: '32px 24px',
          textAlign: 'center',
          animation: 'slideIn 0.22s ease',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8 }}>
            No active challenges
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
            Add a challenge first before logging trades.
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface3)',
              border: 'var(--bw) solid var(--border-subtle)',
              borderRadius: 6, color: 'var(--text)',
              fontSize: 12, padding: '8px 20px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
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
        width: '100%', maxWidth: 480,
        animation: 'slideIn 0.22s ease',
        // Allow the modal itself to scroll on small screens
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: 'var(--bw) solid var(--border-subtle)',
          position: 'sticky', top: 0,
          background: 'var(--surface)',
          zIndex: 1,
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            Log trade
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', fontSize: 18, padding: '0 4px', lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Challenge selector */}
            <Field label="Challenge">
              <select
                value={challengeId}
                onChange={e => setChallengeId(e.target.value)}
                style={selectStyle}
                required
              >
                {activeChallenges.map(c => (
                  <option key={c.id} value={c.id}>
                    {formatChallengeLabel(c)}
                  </option>
                ))}
              </select>
            </Field>

            {/* Symbol + Direction */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Symbol">
                <input
                  type="text"
                  placeholder="EURUSD, XAUUSD…"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  style={inputStyle}
                  autoComplete="off"
                  spellCheck={false}
                  required
                />
              </Field>

              <Field label="Direction">
                <div style={{ display: 'flex', gap: 0 }}>
                  <button
                    type="button"
                    onClick={() => setDirection('LONG')}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      fontSize: 12, fontWeight: 500,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      borderRadius: '4px 0 0 4px',
                      border: direction === 'LONG'
                        ? 'var(--bw) solid var(--green-border)'
                        : 'var(--bw) solid var(--border-subtle)',
                      background: direction === 'LONG' ? 'var(--green-bg)' : 'var(--surface3)',
                      color: direction === 'LONG' ? '#22c55e' : 'var(--text-muted)',
                      transition: 'background 0.1s, color 0.1s, border-color 0.1s',
                    }}
                  >
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SHORT')}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      fontSize: 12, fontWeight: 500,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      borderRadius: '0 4px 4px 0',
                      border: direction === 'SHORT'
                        ? 'var(--bw) solid var(--red-border)'
                        : 'var(--bw) solid var(--border-subtle)',
                      background: direction === 'SHORT' ? 'var(--red-bg)' : 'var(--surface3)',
                      color: direction === 'SHORT' ? 'var(--red)' : 'var(--text-muted)',
                      marginLeft: '-1px',
                      transition: 'background 0.1s, color 0.1s, border-color 0.1s',
                    }}
                  >
                    Short
                  </button>
                </div>
              </Field>
            </div>

            {/* Entry / Exit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Entry price">
                <input
                  type="number"
                  placeholder="0.00000"
                  step="any"
                  value={entry}
                  onChange={e => setEntry(e.target.value)}
                  style={inputStyle}
                  required
                />
              </Field>
              <Field label="Exit price">
                <input
                  type="number"
                  placeholder="0.00000"
                  step="any"
                  value={exit}
                  onChange={e => setExit(e.target.value)}
                  style={inputStyle}
                  required
                />
              </Field>
            </div>

            {/* Lot size / Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Lot size (optional)">
                <input
                  type="number"
                  placeholder="0.01"
                  step="0.01"
                  min="0.01"
                  value={lotSize}
                  onChange={e => setLotSize(e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label={selectedChallenge
                ? `Date (${selectedChallenge.start_date} – ${selectedChallenge.end_date})`
                : 'Date'
              }>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={selectedChallenge?.start_date}
                  max={selectedChallenge?.end_date}
                  style={inputStyle}
                  required
                />
              </Field>
            </div>

            {/* SL / TP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Stop loss (optional)">
                <input
                  type="number"
                  placeholder="0.00000"
                  step="any"
                  value={stopLoss}
                  onChange={e => setStopLoss(e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Take profit (optional)">
                <input
                  type="number"
                  placeholder="0.00000"
                  step="any"
                  value={takeProfit}
                  onChange={e => setTakeProfit(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* P&L */}
            <Field label="P&L ($)">
              <input
                type="number"
                placeholder="-250.00"
                step="any"
                value={pnl}
                onChange={e => { setPnl(e.target.value); setError(''); }}
                style={inputStyle}
                required
              />
              <span style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>
                Enter actual dollar profit/loss (use negative for a loss)
              </span>
            </Field>

            {/* Setup type */}
            <Field label="Setup type (optional)">
              <select
                value={setupType}
                onChange={e => setSetupType(e.target.value as SetupType | '')}
                style={selectStyle}
              >
                <option value="">— select —</option>
                <option value="BREAKOUT">Breakout</option>
                <option value="TREND_FOLLOW">Trend follow</option>
                <option value="REVERSAL">Reversal</option>
                <option value="RANGE">Range</option>
                <option value="NEWS">News</option>
                <option value="SCALP">Scalp</option>
              </select>
            </Field>

            {/* Notes */}
            <Field label="Notes (optional)">
              <textarea
                rows={2}
                placeholder="Private journal note…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: 48,
                }}
              />
            </Field>

            {/* Error message */}
            {error && (
              <div style={{
                fontSize: 11,
                color: 'var(--red)',
                background: 'var(--red-bg)',
                border: 'var(--bw) solid var(--red-border)',
                borderRadius: 4,
                padding: '6px 10px',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              style={{
                background: 'var(--green-bg)',
                color: '#22c55e',
                border: 'var(--bw) solid var(--green-border)',
                borderRadius: 6,
                padding: '10px 0',
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Log trade
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}
