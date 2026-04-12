import { useState } from 'react';
import type { NewsItem } from '../../data/demo';

/** Interpolate Y on the sparkline at a given X (viewBox coords) */
function getSparkY(points: string, targetX: number): number {
  const pts = points.trim().split(/\s+/).map(p => {
    const [x, y] = p.split(',').map(Number)
    return { x, y }
  })
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i].x <= targetX && pts[i + 1].x >= targetX) {
      const t = (targetX - pts[i].x) / (pts[i + 1].x - pts[i].x)
      return pts[i].y + t * (pts[i + 1].y - pts[i].y)
    }
  }
  return pts[pts.length - 1]?.y ?? 16
}

export default function NewsCard({ item }: { item: NewsItem }) {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeHov, setLikeHov] = useState(false);
  const [commentHov, setCommentHov] = useState(false);
  const [shareHov, setShareHov] = useState(false);
  const [bookmarkHov, setBookmarkHov] = useState(false);

  const isUp = item.up;
  const priceColor = isUp ? '#22c55e' : '#ef4444';

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 12,
        padding: '14px 16px 14px 12px',
        border: `0.5px solid ${hovered ? 'var(--border-soft)' : 'var(--border)'}`,
        borderLeft: '2px solid #1d9bf0',
        borderRadius: 8,
        background: 'var(--bg-card)',
        transition: 'border-color 0.1s',
      }}
    >
      {/* System "News" avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: 'var(--blue-bg)', border: '0.5px solid var(--blue-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#1d9bf0', fontSize: 11, fontWeight: 500,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2V9"/>
          <line x1="18" y1="14" x2="10" y2="14"/>
          <line x1="18" y1="10" x2="10" y2="10"/>
          <line x1="14" y1="18" x2="10" y2="18"/>
        </svg>
      </div>

      {/* Right column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Post header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Candl News</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>@candl</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{item.time}</span>
          <span style={{
            fontSize: 10, fontWeight: 500, color: 'var(--text-2)',
            padding: '1px 6px', borderRadius: 3,
            background: 'var(--surface2)', border: '0.5px solid var(--border-emphasis)',
            marginLeft: 2, textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {item.category}
          </span>
        </div>

        {/* Embedded news card */}
        <div style={{
          borderRadius: 8,
          border: '0.5px solid var(--border)',
          background: 'var(--surface)',
          marginBottom: 12,
          overflow: 'hidden',
        }}>
          {/* Headline */}
          <div style={{ padding: '12px 14px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 500, letterSpacing: '0.04em',
                padding: '2px 6px', borderRadius: 3, flexShrink: 0, marginTop: 1,
                background: 'var(--surface2)', color: 'var(--text-2)',
                border: '0.5px solid var(--border-emphasis)',
                textTransform: 'uppercase',
              }}>
                {item.source}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.45, marginBottom: 3 }}>
                  {item.headline}
                </div>
              </div>
            </div>
          </div>

          {/* Impact row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 14px',
            borderTop: '0.5px solid var(--border)',
            borderBottom: '0.5px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                IMPACT
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1d9bf0', fontVariantNumeric: 'tabular-nums' }}>
                {item.ticker}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                ${item.priceBefore.toFixed(2)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>→</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: priceColor, fontVariantNumeric: 'tabular-nums' }}>
                ${item.priceAfter.toFixed(2)}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: priceColor,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {item.changePct}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
              in {item.timeAgo}
            </span>
          </div>

          {/* Mini sparkline */}
          <div style={{ padding: '8px 14px 10px', background: 'var(--bg)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
              {item.ticker} intraday
            </div>
            {(() => {
              const NEWS_X = 78
              const SPARK_H = 32
              const TOP_PAD = 14
              const dotY = getSparkY(item.sparkline, NEWS_X)
              const dotTopPx = TOP_PAD + dotY

              return (
                <div style={{ position: 'relative', height: TOP_PAD + SPARK_H }}>
                  <svg
                    width="100%" height={SPARK_H}
                    viewBox="0 0 120 32" fill="none"
                    preserveAspectRatio="none"
                    style={{ position: 'absolute', top: TOP_PAD, left: 0, display: 'block' }}
                  >
                    <polyline
                      points={item.sparkline}
                      stroke={priceColor} strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  <div style={{ position: 'absolute', left: '65%', top: 0, bottom: 0 }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 5,
                      fontSize: 10, fontWeight: 500, color: '#f59e0b',
                      whiteSpace: 'nowrap', letterSpacing: 0.2,
                    }}>
                      News drop
                    </div>
                    <div style={{
                      position: 'absolute', top: 10, bottom: 0, left: 0,
                      borderLeft: '1px dashed #f59e0b', opacity: 0.4,
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: dotTopPx - 3,
                      left: -3,
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#f59e0b',
                      boxShadow: '0 0 0 2px var(--bg)',
                    }} />
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 380, marginTop: 4 }}>
          <button
            onClick={e => e.stopPropagation()}
            onMouseEnter={() => setCommentHov(true)}
            onMouseLeave={() => setCommentHov(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: commentHov ? 'var(--text-2)' : 'var(--text-3)', padding: 4, borderRadius: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span style={{ fontSize: 12 }}>0</span>
          </button>

          <button
            onClick={handleLike}
            onMouseEnter={() => setLikeHov(true)}
            onMouseLeave={() => setLikeHov(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: liked || likeHov ? '#f91880' : 'var(--text-3)', padding: 4, borderRadius: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#f91880' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ fontSize: 12 }}>{likeCount}</span>
          </button>

          <button
            onClick={e => e.stopPropagation()}
            onMouseEnter={() => setShareHov(true)}
            onMouseLeave={() => setShareHov(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: shareHov ? 'var(--text-2)' : 'var(--text-3)', padding: 4, borderRadius: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span style={{ fontSize: 12 }}>0</span>
          </button>

          <button
            onClick={e => e.stopPropagation()}
            onMouseEnter={() => setBookmarkHov(true)}
            onMouseLeave={() => setBookmarkHov(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: bookmarkHov ? 'var(--text-2)' : 'var(--text-3)', padding: 4, borderRadius: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
