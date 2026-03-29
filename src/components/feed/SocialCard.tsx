import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SocialPost } from '../../types';
import { useMobile } from '../../hooks/useMobile';
import ShareDropdown from './ShareDropdown';

const SENTIMENT_COLOR: Record<string, string> = {
  Bullish: '#16a34a',
  Neutral: '#d97706',
  Bearish: '#dc2626',
};

export default function SocialCard({ post }: { post: SocialPost }) {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [animating, setAnimating] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !liked; setLiked(next); setLikeCount(c => next ? c + 1 : c - 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 350);
  }

  function handleComment(e: React.MouseEvent) {
    e.stopPropagation();
    navigate(`/post/${post.id}#comments`);
  }

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    setShareOpen(o => !o);
  }

  const images = post.images ?? [];

  // Image grid layout: 1 = full width, 2 = side by side, 3 = left full + 2 right stacked, 4 = 2×2
  function renderImages() {
    if (!images.length) return null;

    const gridStyle: React.CSSProperties =
      images.length === 1
        ? { display: 'block' }
        : images.length === 2
        ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }
        : images.length === 3
        ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2 }
        : { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2 };

    return (
      <div
        style={{
          ...gridStyle,
          margin: '10px 0',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          maxHeight: isMobile ? 280 : 340,
        }}
        onClick={e => e.stopPropagation()}
      >
        {images.slice(0, 4).map((src, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              gridColumn: images.length === 3 && i === 0 ? '1' : undefined,
              gridRow: images.length === 3 && i === 0 ? '1 / span 2' : undefined,
              overflow: 'hidden',
              cursor: 'zoom-in',
              background: 'var(--bg)',
            }}
            onClick={() => setLightboxSrc(src)}
          >
            <img
              src={src}
              alt=""
              style={{
                width: '100%',
                height: images.length === 1 ? 'auto' : '100%',
                maxHeight: images.length === 1 ? (isMobile ? 280 : 340) : undefined,
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {/* +N overlay on 4th image if more than 4 */}
            {i === 3 && post.images!.length > 4 && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 22, fontWeight: 700,
              }}>
                +{post.images!.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => navigate(`/post/${post.id}`)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, marginBottom: 16, cursor: 'pointer',
          transition: 'box-shadow 0.2s, transform 0.15s',
          boxShadow: hovered ? '0 6px 24px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-1px)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px 10px' }}>
          <div
            onClick={e => { e.stopPropagation(); navigate(`/profile/${post.user.id}`); }}
            style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${post.user.avatarGradient[0]}, ${post.user.avatarGradient[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)', cursor: 'pointer',
            }}
          >
            {post.user.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span
                onClick={e => { e.stopPropagation(); navigate(`/profile/${post.user.id}`); }}
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}
              >
                {post.user.name}
              </span>
              {post.user.verified && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--blue)">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              )}
              {post.sentiment && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', padding: '2px 7px',
                  borderRadius: 20, border: `1px solid ${SENTIMENT_COLOR[post.sentiment]}44`,
                  background: `${SENTIMENT_COLOR[post.sentiment]}18`,
                  color: SENTIMENT_COLOR[post.sentiment],
                }}>
                  {post.sentiment.toUpperCase()}
                </span>
              )}
              {post.ticker && (
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--blue)', background: 'var(--blue-bg)',
                  border: '1px solid var(--blue-border)',
                  padding: '2px 8px', borderRadius: 6,
                }}>
                  ${post.ticker}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>
              @{post.user.username} · {post.createdAt}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '0 16px' }}>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {post.body}
          </p>

          {/* Images */}
          {renderImages()}

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: images.length ? 0 : 10 }}>
              {post.hashtags.map(tag => (
                <span key={tag} onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 500, cursor: 'pointer' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px 12px', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingTop: 8, borderTop: '1px solid var(--border2)' }}>
            <button
              onClick={handleLike}
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 7px', borderRadius: 6, border: 'none', background: 'none', fontSize: 11, color: liked ? 'var(--red)' : 'var(--text4)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            >
              <svg className={animating ? 'like-pop' : ''} width="13" height="13" viewBox="0 0 24 24" fill={liked ? 'var(--red)' : 'none'} stroke={liked ? 'var(--red)' : 'currentColor'} strokeWidth="2" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {likeCount.toLocaleString()}
            </button>
            <button
              onClick={handleComment}
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 7px', borderRadius: 6, border: 'none', background: 'none', fontSize: 11, color: 'var(--text4)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text4)'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {post.comments}
            </button>
            <div style={{ position: 'relative' }}>
              <button
                ref={shareButtonRef}
                onClick={handleShare}
                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 7px', borderRadius: 6, border: 'none', background: 'none', fontSize: 11, color: shareOpen ? 'var(--blue)' : 'var(--text4)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                {post.shares}
              </button>
              {shareOpen && (
                <ShareDropdown
                  postId={post.id}
                  title={`${post.user.name} on ${post.ticker ?? 'markets'}`}
                  anchorRef={shareButtonRef}
                  onClose={() => setShareOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, cursor: 'zoom-out',
          }}
        >
          <img
            src={lightboxSrc}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '90dvh', borderRadius: 10, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
