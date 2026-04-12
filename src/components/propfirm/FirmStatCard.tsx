import React from 'react';
import type { FirmStats } from '../../types/propfirm';
import { firmBadge } from './MilestonePost';

interface FirmStatCardProps {
  stat: FirmStats;
}

export default function FirmStatCard({ stat }: FirmStatCardProps) {
  const { firm, accountSize, passRate, attempts, avgDays, avgPnlOnPass, topMistake, topSetup } = stat;
  const sizeLabel = `$${(accountSize / 1000).toFixed(0)}k`;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 8,
        padding: 14,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-soft)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Firm name + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {firmBadge(firm)}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sizeLabel} account</span>
      </div>

      {/* Pass rate */}
      <div style={{ marginBottom: 6 }}>
        <div style={{
          fontSize: 22, fontWeight: 700, color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        }}>
          {passRate}%
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>pass rate</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${passRate}%`, background: 'var(--green)', borderRadius: 3 }} />
      </div>

      {/* Meta stats */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
        {attempts.toLocaleString()} attempts · avg {avgDays} days · avg +{avgPnlOnPass.toFixed(1)}% on pass
      </div>

      {/* Top mistake */}
      <div style={{
        background: 'var(--red-bg)',
        borderLeft: '2px solid var(--red-border)',
        borderRadius: 4,
        padding: '6px 8px',
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
          color: 'var(--red)', opacity: 0.6, marginBottom: 2,
        }}>
          Top mistake
        </div>
        <div style={{ fontSize: 11, color: 'var(--red)', lineHeight: 1.5 }}>{topMistake}</div>
      </div>

      {/* Top setup */}
      <div style={{
        background: 'var(--green-bg)',
        borderLeft: '2px solid var(--green-border)',
        borderRadius: 4,
        padding: '6px 8px',
      }}>
        <div style={{
          fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
          color: 'var(--green)', opacity: 0.6, marginBottom: 2,
        }}>
          Top setup
        </div>
        <div style={{ fontSize: 11, color: 'var(--green)', lineHeight: 1.5 }}>{topSetup}</div>
      </div>
    </div>
  );
}
