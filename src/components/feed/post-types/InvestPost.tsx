import PostHeader from '../PostHeader';
import PostActions from '../PostActions';
import { FormattedText } from '../../../lib/postUtils';
import type { Post } from '../../../types/post';

interface InvestPostProps {
  post: Post
}

export default function InvestPost({ post }: InvestPostProps) {
  const inv = post.investData;
  if (!inv) return null;

  const isBullish = inv.stance === 'BULLISH';

  return (
    <>
      <PostHeader post={post} />

      {/* Body text */}
      {post.body && (
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, marginBottom: 12, marginTop: 0 }}>
          <FormattedText text={post.body} />
        </p>
      )}

      {/* Ticker hero + stance */}
      <div style={{
        background: isBullish
          ? 'linear-gradient(135deg, var(--amber-bg) 0%, transparent 60%)'
          : 'linear-gradient(135deg, var(--red-bg) 0%, transparent 60%)',
        border: `0.5px solid ${isBullish ? 'var(--amber-border)' : 'var(--red-border)'}`,
        borderRadius: 8,
        padding: '14px 16px',
        marginBottom: 10,
      }}>
        {/* Ticker + stance row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            fontSize: 18, fontWeight: 600, color: 'var(--text)',
            letterSpacing: '-0.01em',
          }}>
            ${inv.symbol}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
            background: isBullish ? 'var(--green-bg)' : 'var(--red-bg)',
            color: isBullish ? 'var(--green)' : 'var(--red)',
            border: `0.5px solid ${isBullish ? 'var(--green-border)' : 'var(--red-border)'}`,
            letterSpacing: '0.04em',
          }}>
            {inv.stance}
          </span>
        </div>

        {/* Thesis */}
        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.65, margin: '0 0 10px' }}>
          {inv.thesis}
        </p>

        {/* Levels row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, background: 'var(--border-soft)',
          borderRadius: 6, overflow: 'hidden',
        }}>
          {[
            { label: 'Entry', value: `$${inv.entry.toFixed(2)}`, color: 'var(--text)' },
            { label: 'Target', value: inv.target != null ? `$${inv.target.toFixed(2)}` : '—', color: 'var(--green)' },
            { label: 'Stop', value: inv.stop != null ? `$${inv.stop.toFixed(2)}` : '—', color: 'var(--red)' },
            { label: 'Horizon', value: inv.horizon ?? '—', color: 'var(--text)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--bg-surface)', padding: '7px 10px' }}>
              <div style={{
                fontSize: 12, fontWeight: 500, color,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {value}
              </div>
              <div style={{
                fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.04em', color: 'var(--text-4)', marginTop: 1,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PostActions post={post} />
    </>
  );
}
