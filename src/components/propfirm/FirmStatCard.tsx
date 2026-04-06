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
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 8, padding: 14,
    }}>
      {/* Firm name + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {firmBadge(firm)}
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sizeLabel} account</span>
      </div>

      {/* Pass rate */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {passRate}%
        </div>
        <div style={{ fontSize: 10, color: 'var(--border-emphasis)', marginTop: 2 }}>pass rate</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${passRate}%`, background: '#22c55e', borderRadius: 2 }} />
      </div>

      {/* Stats row */}
      <div style={{ fontSize: 10, color: 'var(--border-emphasis)', marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
        {attempts.toLocaleString()} attempts · avg {avgDays} days · avg +{avgPnlOnPass.toFixed(1)}% on pass
      </div>

      {/* Top mistake */}
      <div style={{ borderLeft: '0.5px solid #3a1a1a', paddingLeft: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(239,68,68,0.4)', marginBottom: 2 }}>
          Top mistake
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{topMistake}</div>
      </div>

      {/* Top setup */}
      <div style={{ borderLeft: '0.5px solid #1a3a22', paddingLeft: 8 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(34,197,94,0.4)', marginBottom: 2 }}>
          Top setup
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{topSetup}</div>
      </div>
    </div>
  );
}
