import React from 'react';
import type { Tip } from '../../types/propfirm';
import { firmBadge } from './MilestonePost';

// Category colours via CSS vars so they adapt to light/dark mode
const CATEGORY_CFG: Record<Tip['category'], { label: string; color: string }> = {
  risk:        { label: 'Risk management', color: 'var(--green)'  },
  psychology:  { label: 'Psychology',      color: 'var(--purple)' },
  news:        { label: 'News events',     color: 'var(--amber)'  },
  entry:       { label: 'Entry timing',    color: 'var(--blue)'   },
  compliance:  { label: 'Rule compliance', color: 'var(--red)'    },
};

interface TipCardProps {
  tip: Tip;
  compact?: boolean;
}

export default function TipCard({ tip, compact = false }: TipCardProps) {
  const cfg = CATEGORY_CFG[tip.category];

  if (compact) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 5,
        padding: 9,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: cfg.color, marginBottom: 5,
        }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 5 }}>
          {tip.text}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          — {tip.author}
        </div>
      </div>
    );
  }

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
      {/* Category */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        color: cfg.color, marginBottom: 8,
      }}>
        {cfg.label}
      </div>

      {/* Tip text */}
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 10 }}>
        {tip.text}
      </div>

      {/* Author row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        borderTop: '0.5px solid var(--border-soft)',
        paddingTop: 8, marginBottom: 8,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— {tip.author}</span>
        <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>·</span>
        {firmBadge(tip.authorFirm)}
        <span style={{ fontSize: 10, color: 'var(--text-hint)' }}>{tip.authorResult}</span>
        {tip.isVerified && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--green)">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        )}
        {/* Like count pushed to the right */}
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 11, color: 'var(--text-hint)', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 4,
            marginLeft: 'auto',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-hint)'; }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {tip.likes}
        </button>
      </div>
    </div>
  );
}

export { CATEGORY_CFG };
