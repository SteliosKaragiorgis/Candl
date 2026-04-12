import PostHeader from '../PostHeader';
import PostActions from '../PostActions';
import { FormattedText } from '../../../lib/postUtils';
import type { Post } from '../../../types/post';

interface PropFirmPostProps {
  post: Post
}

export default function PropFirmPost({ post }: PropFirmPostProps) {
  const p = post.propFirmData;
  if (!p) return null;

  const isPassed = p.result === 'PASSED';
  const pnlStr = p.finalPnl >= 0 ? `+$${p.finalPnl.toFixed(2)}` : `-$${Math.abs(p.finalPnl).toFixed(2)}`;

  return (
    <div style={{
      background: isPassed
        ? 'linear-gradient(180deg, var(--green-bg) 0%, transparent 40%)'
        : 'linear-gradient(180deg, var(--red-bg) 0%, transparent 40%)',
      margin: '-14px -16px',
      padding: '14px 16px',
      borderRadius: 12,
    }}>
      <PostHeader post={post} showFirmBadge />

      {/* Milestone block */}
      <div style={{
        background: isPassed ? 'var(--green-bg)' : 'var(--red-bg)',
        border: `0.5px solid ${isPassed ? 'var(--green-border)' : 'var(--red-border)'}`,
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {/* Icon */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: isPassed ? 'var(--green)' : 'var(--red)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isPassed ? (
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {p.firm} {p.accountSize} — {p.phase}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
            {isPassed
              ? `${p.daysUsed} days · ${p.winRate}% win rate · Avg ${p.avgRR}R`
              : `Day ${p.daysUsed}`}
          </div>
        </div>

        {/* Result */}
        <span style={{
          flexShrink: 0,
          fontSize: 11, fontWeight: 600,
          padding: '4px 12px', borderRadius: 20,
          background: isPassed ? 'var(--green)' : 'var(--red)',
          color: '#000',
        }}>
          {isPassed ? 'PASSED' : 'FAILED'}
        </span>
      </div>

      {/* Stats grid — PASSED only */}
      {isPassed && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, background: 'var(--border-soft)',
          borderRadius: 6, overflow: 'hidden',
          marginBottom: 10,
        }}>
          {[
            { label: 'Final P&L', value: pnlStr, color: 'var(--green)' },
            { label: 'Days Used', value: String(p.daysUsed), color: undefined },
            { label: 'Win Rate', value: `${p.winRate}%`, color: undefined },
            { label: 'Avg R:R', value: `${p.avgRR}R`, color: undefined },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--bg-surface)', padding: '7px 10px' }}>
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: color ?? 'var(--text)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {value}
              </div>
              <div style={{
                fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.04em', color: 'var(--text-4)',
                marginTop: 2,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Body text */}
      {post.body && (
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 10, marginTop: 0 }}>
          <FormattedText text={post.body} />
        </p>
      )}

      {/* Lesson / reflection block */}
      {(p.lesson || p.whatIllDoDifferently) && (
        <div style={{
          background: isPassed ? 'var(--bg-surface)' : 'var(--red-bg)',
          borderLeft: `2px solid ${isPassed ? 'var(--border)' : 'var(--red)'}`,
          borderRadius: '0 6px 6px 0',
          padding: '8px 12px',
          marginBottom: 10,
        }}>
          <div style={{
            fontSize: 9, fontWeight: 500, textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: isPassed ? 'var(--text-4)' : 'var(--red)',
            marginBottom: 4,
          }}>
            {isPassed ? 'Lesson' : "What I'll do differently"}
          </div>
          <p style={{ margin: 0, fontSize: 12, fontStyle: 'italic', color: 'var(--text-2)', lineHeight: 1.6 }}>
            {isPassed ? p.lesson : p.whatIllDoDifferently}
          </p>
        </div>
      )}

      <PostActions post={post} showFullJournal />
    </div>
  );
}
