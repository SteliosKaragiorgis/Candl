import type { Post } from '../../../types/post';
import { TradeCardHeader, TradeCardActions } from './TradePostDark';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (p >= 10000) return p.toFixed(1);
  if (p >= 100)   return p.toFixed(2);
  if (p >= 1)     return p.toFixed(4);
  return p.toFixed(5);
}

function fmtPnl(pnl: number): string {
  const abs = Math.abs(pnl);
  return (pnl >= 0 ? '+$' : '-$') + abs.toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function fmtR(r: number): string {
  return (r >= 0 ? '+' : '') + r.toFixed(2) + 'R';
}

// ── LossPost ──────────────────────────────────────────────────────────────────

interface Props {
  post: Post
}

export default function LossPost({ post }: Props) {
  const t = post.tradeData!;
  const isLong = t.direction === 'LONG';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderLeft: '2px solid var(--red)',
      borderRadius: 12,
      overflow: 'hidden',
      cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    }}>

      {/* Section 1+2 — header + narrative (red Trade badge) */}
      <TradeCardHeader
        post={post}
        badgeBg="var(--red-bg)"
        badgeColor="var(--red)"
        badgeBorder="var(--red-border)"
      />

      {/* Section 3 — Red impact block */}
      <div style={{
        background: 'var(--red-bg)',
        padding: '18px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Left */}
        <div>
          {/* Symbol + direction row */}
          <div style={{
            fontSize: 11, color: 'var(--red)', opacity: 0.7,
            marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{ fontWeight: 500 }}>{t.symbol}</span>
            <span style={{
              fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 3,
              background: isLong ? '#0d1f12' : 'rgba(239,68,68,0.15)',
              color: isLong ? '#22c55e' : 'var(--red)',
              border: `0.5px solid ${isLong ? '#1a3a22' : 'var(--red-border)'}`,
            }}>
              {isLong ? 'LONG' : 'SHORT'}
            </span>
            <span style={{ opacity: 0.6 }}>{t.timeframe}</span>
          </div>

          {/* P&L */}
          <div style={{
            fontSize: 40, fontWeight: 500,
            color: 'var(--red)',
            letterSpacing: '-0.03em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmtPnl(t.pnl)}
          </div>

          {/* R multiple */}
          <div style={{
            fontSize: 13, color: 'var(--red)', opacity: 0.8,
            marginTop: 4, fontVariantNumeric: 'tabular-nums',
          }}>
            {fmtR(t.rMultiple)}
          </div>
        </div>
      </div>

      {/* Section 4 — What happened */}
      {post.body && (
        <div style={{
          background: 'var(--red-bg)',
          padding: '14px 18px',
          borderTop: '0.5px solid var(--red-border)',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: 'var(--red)', opacity: 0.7,
            marginBottom: 5,
          }}>
            What happened
          </div>
          <p style={{
            margin: 0, fontSize: 13, color: 'var(--text)',
            lineHeight: 1.65,
          }}>
            {post.body}
          </p>
        </div>
      )}

      {/* Section 5 — The lesson */}
      <div style={{ background: 'var(--bg-card)', padding: '14px 18px' }}>
        <div style={{
          fontSize: 10, fontWeight: 500, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--text-4)',
          marginBottom: 6,
        }}>
          The lesson
        </div>

        <p style={{
          margin: '0 0 12px',
          fontSize: 13, color: 'var(--text-2)',
          lineHeight: 1.65, fontStyle: 'italic',
        }}>
          {post.lesson}
        </p>

        {/* New rule block (optional) */}
        {post.rule && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 12px',
            background: 'var(--bg-surface)',
            borderRadius: 8,
            borderLeft: '2px solid var(--red)',
          }}>
            {/* Icon */}
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: 'var(--red-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 1,
            }}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"
                stroke="var(--red)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2,5.5 4,7.5 8,3"/>
              </svg>
            </div>
            {/* Rule text */}
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--red)', fontWeight: 500 }}>New rule: </span>
              {post.rule}
            </p>
          </div>
        )}
      </div>

      {/* Section 6 — Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1, background: 'var(--border-soft)',
        borderTop: '0.5px solid var(--border)',
      }}>
        {[
          { label: 'Entry',          value: fmtPrice(t.entry),                           color: 'var(--text)' },
          { label: 'Exit (stopped)', value: fmtPrice(t.exit),                            color: 'var(--text)' },
          { label: 'R multiple',     value: fmtR(t.rMultiple),                           color: 'var(--red)'  },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', padding: '8px 12px' }}>
            <div style={{
              fontSize: 12, fontWeight: 500, color,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {value}
            </div>
            <div style={{
              fontSize: 9, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: 'var(--text-4)',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Section 7 — Actions (no Share ↗) */}
      <TradeCardActions post={post} showShare={false} />
    </div>
  );
}
