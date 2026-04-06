import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InvestmentPost } from '../../types';
import { useMobile } from '../../hooks/useMobile';
import ShareDropdown from './ShareDropdown';

function renderBody(text: string) {
  return text.split(/(\$[A-Z]+|#\w+)/g).map((part, i) => {
    if (/^\$[A-Z]+$/.test(part) || /^#\w+$/.test(part)) {
      return <span key={i} style={{ color: '#1d9bf0', fontWeight: 500 }}>{part}</span>;
    }
    return part;
  });
}

const CONVICTION_COLOR: Record<string, string> = {
  High: '#22c55e', Medium: '#f59e0b', Speculative: '#ef4444',
};

export default function InvestCard({ post }: { post: InvestmentPost }) {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [animating, setAnimating] = useState(false);
  const [thesisOpen, setThesisOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [likeHov, setLikeHov] = useState(false);
  const [commentHov, setCommentHov] = useState(false);
  const [shareHov, setShareHov] = useState(false);
  const [bookmarkHov, setBookmarkHov] = useState(false);
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

  const convictionColor = CONVICTION_COLOR[post.conviction] ?? 'var(--text-3)';

  return (
    <div
      onClick={() => navigate(`/post/${post.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 12,
        paddingTop: '14px', paddingBottom: '14px', paddingRight: '16px', paddingLeft: '12px',
        borderLeft: '2px solid #f59e0b',
        borderBottom: '0.5px solid #1e1e1e',
        background: hovered ? 'var(--surface)' : 'transparent',
        cursor: 'pointer', transition: 'background 0.1s',
      }}
    >
      {/* Avatar */}
      <div
        onClick={e => { e.stopPropagation(); navigate(`/profile/${post.user.id}`); }}
        style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: 'var(--surface2)', border: '0.5px solid var(--border-emphasis)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-3)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}
      >
        {post.user.initials}
      </div>

      {/* Right column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span
            onClick={e => { e.stopPropagation(); navigate(`/profile/${post.user.id}`); }}
            style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            {post.user.name}
          </span>
          {post.user.verified && (
            <span style={{
              width: 16, height: 16, borderRadius: '50%', background: '#1d9bf0',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: 2, flexShrink: 0,
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          )}
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>@{post.user.username}</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{post.createdAt}</span>
          <span style={{
            fontSize: 10, fontWeight: 500, color: '#f59e0b',
            padding: '1px 6px', borderRadius: 4,
            background: '#1f1400', border: '0.5px solid #3a2800',
            marginLeft: 6,
          }}>
            INVEST
          </span>
        </div>

        {/* Body */}
        {post.body && (
          <p style={{ fontSize: 14, color: '#c0c0c0', lineHeight: 1.6, margin: '0 0 12px 0' }}>
            {renderBody(post.body)}
          </p>
        )}

        {/* Investment thesis embedded card */}
        <div style={{ borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--surface)', marginBottom: 12, overflow: 'hidden' }}>
          {/* Row 1: Symbol + INVEST pill + Horizon/Added at */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '0.5px solid var(--border)' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {post.ticker}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 4,
              background: '#1f1400', color: '#f59e0b', border: '0.5px solid #3a2800',
            }}>
              INVEST
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>
              Horizon: {post.horizon} · Added at {post.addedAt}
            </span>
          </div>
          {/* Row 2: Conviction */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg)' }}>
            <span style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.04em', width: 80, flexShrink: 0 }}>Conviction</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: convictionColor }}>{post.conviction}</span>
          </div>
        </div>

        {/* Thesis block */}
        {isMobile && (
          <div
            onClick={e => { e.stopPropagation(); setThesisOpen(o => !o); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginBottom: 4, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Investment Thesis</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{thesisOpen ? '▲' : '▼'}</span>
          </div>
        )}
        {(!isMobile || thesisOpen) && (
          <div style={{ borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--surface)', marginBottom: 12, overflow: 'hidden' }}>
            {[
              { label: 'CATALYST',  value: post.catalyst,  dot: '#1d9bf0' },
              { label: 'VALUATION', value: post.valuation, dot: '#22c55e' },
              { label: 'RISK',      value: post.risk,       dot: '#ef4444' },
            ].map(({ label, value, dot }, i, arr) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: dot }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', color: '#444', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {post.hashtags.map(tag => (
              <span key={tag} onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: '#1d9bf0', cursor: 'pointer' }}>
                {tag.replace(/^#/, '')}
              </span>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 380, marginTop: 4 }}>
          <button
            onClick={handleComment}
            onMouseEnter={() => setCommentHov(true)}
            onMouseLeave={() => setCommentHov(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: commentHov ? 'var(--text-2)' : 'var(--text-3)', padding: 4, borderRadius: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span style={{ fontSize: 12 }}>{post.comments}</span>
          </button>

          <button
            onClick={handleLike}
            onMouseEnter={() => setLikeHov(true)}
            onMouseLeave={() => setLikeHov(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: liked || likeHov ? '#f91880' : 'var(--text-3)', padding: 4, borderRadius: 4 }}
          >
            <svg className={animating ? 'like-pop' : ''} width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#f91880' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ fontSize: 12 }}>{likeCount.toLocaleString()}</span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              ref={shareButtonRef}
              onClick={handleShare}
              onMouseEnter={() => setShareHov(true)}
              onMouseLeave={() => setShareHov(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: shareOpen || shareHov ? 'var(--text-2)' : 'var(--text-3)', padding: 4, borderRadius: 4 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span style={{ fontSize: 12 }}>{post.shares}</span>
            </button>
            {shareOpen && (
              <ShareDropdown
                postId={post.id}
                title={`${post.ticker} investment by ${post.user.name}`}
                anchorRef={shareButtonRef}
                onClose={() => setShareOpen(false)}
              />
            )}
          </div>

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
