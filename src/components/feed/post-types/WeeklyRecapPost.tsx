import PostHeader from '../PostHeader';
import PostActions from '../PostActions';
import type { Post } from '../../../types/post';

interface WeeklyRecapPostProps {
  post: Post
}

export default function WeeklyRecapPost({ post }: WeeklyRecapPostProps) {
  const r = post.recapData;
  if (!r) return null;

  const pnlStr = r.totalPnl >= 0 ? `+$${r.totalPnl.toFixed(2)}` : `-$${Math.abs(r.totalPnl).toFixed(2)}`;
  const isPositive = r.totalPnl >= 0;

  return (
    <>
      <PostHeader post={post} />

      {/* Recap card */}
      <div style={{
        background: 'var(--blue-bg)',
        border: '0.5px solid var(--blue-border)',
        borderRadius: 8,
        padding: '14px 16px',
        marginBottom: 10,
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>
            Week of {r.weekOf}
          </span>
          <span style={{ fontSize: 9, color: 'var(--blue)', opacity: 0.65 }}>
            Candl. AI · Sunday 9am
          </span>
        </div>

        {/* Stats grid — prominent */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, background: 'var(--blue-border)',
          borderRadius: 6, overflow: 'hidden',
          marginBottom: 12,
        }}>
          {[
            { label: 'Total P&L', value: pnlStr, color: isPositive ? 'var(--green)' : 'var(--red)' },
            { label: 'Win Rate', value: `${r.winRate}%`, color: 'var(--text)' },
            { label: 'Avg R:R', value: `${r.avgRR}R`, color: 'var(--text)' },
            { label: 'Trades', value: String(r.tradeCount), color: 'var(--text)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--blue-bg)', padding: '8px 10px' }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {value}
              </div>
              <div style={{
                fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.04em', color: 'var(--blue)', opacity: 0.6,
                marginTop: 2,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Narrative */}
        <p style={{
          fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, margin: 0,
        }}>
          {r.narrative}
        </p>
      </div>

      <PostActions post={post} showViewRecap />
    </>
  );
}
