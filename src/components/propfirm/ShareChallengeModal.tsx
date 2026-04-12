import React, { useState } from 'react';
import type { Challenge } from '../../types/propfirm';
import { publishChallengeToFeed } from '../../hooks/usePropFirmCommunity';

interface Props {
  challenge: Challenge;
  onClose: () => void;
}

function fmt(n: number, prefix = '$') {
  return `${prefix}${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function ShareChallengeModal({ challenge, onClose }: Props) {
  const profitRule = challenge.rules.find(r => r.type === 'profit_target');
  const profitPct = profitRule
    ? Math.round((profitRule.used / profitRule.limit) * 100)
    : 0;

  const dayX = challenge.trading_days.filter(
    d => d.result === 'win' || d.result === 'loss',
  ).length;

  const allClean = challenge.rules
    .filter(r => r.type !== 'profit_target')
    .every(r => r.used <= r.limit);

  const defaultCaption =
    `Day ${dayX} of my ${challenge.firm} ${fmt(challenge.account_size)} challenge.\n` +
    `${profitPct}% toward target.\n` +
    `${allClean ? 'All rules clean.' : 'Watching my limits closely.'} Let's go.`;

  const [caption, setCaption] = useState(defaultCaption);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [published, setPublished] = useState(false);

  function handlePublish() {
    publishChallengeToFeed(challenge, caption);
    setPublished(true);
    setTimeout(onClose, 800);
  }

  const pnlColor = challenge.total_pnl >= 0 ? '#22c55e' : '#ef4444';
  const pnlSign  = challenge.total_pnl >= 0 ? '+' : '-';

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
        width: '100%', maxWidth: 440,
        overflow: 'hidden',
        animation: 'slideIn 0.22s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: 'var(--bw) solid var(--border-subtle)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            Share progress
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', fontSize: 18, padding: '0 4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Preview card */}
          <div style={{
            background: 'var(--surface3)',
            border: 'var(--bw) solid var(--border-subtle)',
            borderRadius: 6,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <FirmBadge firm={challenge.firm} />
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                Phase {challenge.phase} · {challenge.firm} {fmt(challenge.account_size)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              <MiniStat label="Balance" value={fmt(challenge.current_balance)} />
              <MiniStat
                label="P&L"
                value={`${pnlSign}${fmt(Math.abs(challenge.total_pnl))}`}
                color={pnlColor}
              />
              <MiniStat
                label="Days left"
                value={String(challenge.days_remaining)}
                color={challenge.days_remaining < 7 ? '#f59e0b' : 'var(--text-2)'}
              />
              <MiniStat
                label="Rules"
                value={allClean ? 'Clean' : 'Warning'}
                color={allClean ? '#22c55e' : '#f59e0b'}
              />
            </div>
          </div>

          {/* Caption editor */}
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={4}
            style={{
              background: 'var(--surface3)',
              border: 'var(--bw) solid var(--border-subtle)',
              borderRadius: 5,
              color: 'var(--text)',
              fontSize: 12,
              padding: '10px 12px',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />

          {/* Privacy toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Visibility</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['public', 'private'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setPrivacy(opt)}
                  style={{
                    background: privacy === opt ? 'var(--green-bg)' : 'var(--surface3)',
                    border: `var(--bw) solid ${privacy === opt ? 'var(--green-border)' : 'var(--border-subtle)'}`,
                    color: privacy === opt ? '#22c55e' : 'var(--text-3)',
                    borderRadius: 4, padding: '4px 10px',
                    fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                    textTransform: 'capitalize',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Publish button */}
          <button
            onClick={handlePublish}
            disabled={published}
            style={{
              background: 'var(--green-bg)',
              color: '#22c55e',
              border: 'var(--bw) solid var(--green-border)',
              borderRadius: 6,
              padding: '10px 0',
              fontSize: 12,
              fontWeight: 500,
              cursor: published ? 'default' : 'pointer',
              fontFamily: 'inherit',
              opacity: published ? 0.85 : 1,
              transition: 'opacity 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {published ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Published
              </>
            ) : 'Publish to feed'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FirmBadge({ firm }: { firm: string }) {
  const colors: Record<string, string> = {
    FTMO:       '#3b82f6',
    TFT:        '#f59e0b',
    MFF:        '#a78bfa',
    TFF:        '#22d3ee',
    Apex:       '#ef4444',
    E8:         '#22c55e',
    FundedNext: '#fcd34d',
    Other:      'var(--text-2)',
  };
  const color = colors[firm] ?? colors.Other;
  return (
    <span style={{
      background: `${color}14`,
      color,
      border: `var(--bw) solid ${color}33`,
      borderRadius: 3,
      fontSize: 9, fontWeight: 500,
      padding: '2px 5px',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    }}>
      {firm}
    </span>
  );
}

function MiniStat({ label, value, color = 'var(--text-2)' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{
        fontSize: 9, color: 'var(--text-4)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}
