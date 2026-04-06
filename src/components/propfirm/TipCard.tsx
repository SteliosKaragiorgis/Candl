import React from 'react';
import type { Tip } from '../../types/propfirm';
import { firmBadge } from './MilestonePost';

const CATEGORY_CFG: Record<Tip['category'], { label: string; color: string }> = {
  risk:        { label: 'Risk management', color: '#22c55e' },
  psychology:  { label: 'Psychology',      color: '#8b5cf6' },
  news:        { label: 'News events',     color: '#f59e0b' },
  entry:       { label: 'Entry timing',    color: '#3b82f6' },
  compliance:  { label: 'Rule compliance', color: '#ef4444' },
};

interface TipCardProps {
  tip: Tip;
  compact?: boolean;
}

export default function TipCard({ tip, compact = false }: TipCardProps) {
  const cfg = CATEGORY_CFG[tip.category];

  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 6, padding: compact ? '10px 12px' : 12,
    }}>
      {/* Category */}
      <div style={{
        fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
        color: cfg.color, marginBottom: 6,
      }}>
        {cfg.label}
      </div>

      {/* Tip text */}
      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: compact ? 0 : 8 }}>
        {tip.text}
      </div>

      {!compact && (
        <>
          {/* Author */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: 'var(--border-emphasis)' }}>— {tip.author}</span>
            <span style={{ fontSize: 10, color: 'var(--border-emphasis)' }}>·</span>
            {firmBadge(tip.authorFirm)}
            <span style={{ fontSize: 10, color: 'var(--border-emphasis)' }}>{tip.authorResult}</span>
            {tip.isVerified && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#22c55e"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            )}
          </div>

          {/* Like */}
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 11, color: 'var(--border-emphasis)', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--border-emphasis)'; }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {tip.likes}
          </button>
        </>
      )}
    </div>
  );
}

export { CATEGORY_CFG };
