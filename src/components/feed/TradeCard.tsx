import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TradePost } from '../../types';
import type { Trade } from '../../types/trade';
import { useMobile } from '../../hooks/useMobile';
import ShareDropdown from './ShareDropdown';
import TradeChart from './TradeChart';
import ShareModal from '../share/ShareModal';
import type { ShareCardUser } from '../share/ShareableTradeCard';

// Adapt a feed TradePost into the Trade shape expected by ShareModal
function postToTrade(post: TradePost): Trade {
  return {
    id:         post.id,
    symbol:     post.ticker,
    direction:  post.direction === 'BUY' ? 'LONG' : 'SHORT',
    entry:      post.entry,
    exit:       post.target,
    stopLoss:   post.stop,
    takeProfit: post.target,
    pnl:        0,
    rMultiple:  parseFloat(post.rrRatio) || 0,
    duration:   post.timeframe,
    durationMs: 0,
    openedAt:   new Date().toISOString(),
    closedAt:   new Date().toISOString(),
    source:     'MANUAL',
    instrument: 'OTHER',
    isPublished: true,
    postId:     post.id,
  };
}

function renderBody(text: string) {
  return text.split(/(\$[A-Z]+|#\w+)/g).map((part, i) => {
    if (/^\$[A-Z]+$/.test(part) || /^#\w+$/.test(part)) {
      return <span key={i} style={{ color: '#1d9bf0', fontWeight: 500 }}>{part}</span>;
    }
    return part;
  });
}

export default function TradeCard({ post }: { post: TradePost }) {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [animating, setAnimating] = useState(false);
  const [thesisOpen, setThesisOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
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

  const tvUrl = `https://www.tradingview.com/chart/?symbol=${post.tvSymbol}`;
  const isLong = post.direction === 'BUY';
  const colCount = isMobile ? 2 : 4;
  // Format price without $ — let the value speak for itself (works for FX and stocks)
  const fmtEntry  = post.entry  >= 100 ? post.entry.toFixed(2)  : post.entry.toFixed(4);
  const fmtTarget = post.target >= 100 ? post.target.toFixed(2) : post.target.toFixed(4);
  const metaCells = [
    { label: 'Entry',      value: fmtEntry  },
    { label: 'Exit',       value: fmtTarget },
    { label: 'R Multiple', value: post.rrRatio },
    { label: 'Timeframe',  value: post.timeframe },
  ];

  return (
    <div
      onClick={() => navigate(`/post/${post.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 12,
        padding: '14px 16px 14px 12px',
        border: `0.5px solid ${hovered ? 'var(--border-soft)' : 'var(--border)'}`,
        borderLeft: '2px solid #22c55e',
        borderRadius: 8,
        background: 'var(--bg-card)',
        cursor: 'pointer', transition: 'border-color 0.1s',
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
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}
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
            fontSize: 10, fontWeight: 500, color: '#22c55e',
            padding: '1px 6px', borderRadius: 4,
            background: '#0d1f12', border: '0.5px solid #1a3a22',
            marginLeft: 6,
          }}>
            TRADE
          </span>
        </div>

        {/* Body */}
        {post.body && (
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 12px 0' }}>
            {renderBody(post.body)}
          </p>
        )}

        {/* Trade embedded card */}
        <div style={{ borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--surface)', marginBottom: 12, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '0.5px solid var(--border)' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {post.ticker}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
              background: isLong ? '#0d1f12' : '#1f0d0d',
              color: isLong ? '#22c55e' : '#ef4444',
              border: isLong ? '0.5px solid #1a3a22' : '0.5px solid #3a1a1a',
            }}>
              {isLong ? 'LONG' : 'SHORT'}
            </span>
            <span style={{
              fontSize: 15, fontWeight: 600, marginLeft: 'auto',
              color: post.rrRatio.startsWith('-') ? '#ef4444' : '#22c55e',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {post.rrRatio}
            </span>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`, background: 'var(--bg)' }}>
            {metaCells.map(({ label, value }, i) => (
              <div key={label} style={{
                padding: '10px 14px',
                borderRight: (isMobile ? i % 2 === 0 : i < metaCells.length - 1) ? '0.5px solid var(--border)' : 'none',
                borderTop: '0.5px solid var(--border)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Chart toggle */}
          <button
            onClick={e => { e.stopPropagation(); setChartOpen(o => !o); }}
            style={{
              padding: '8px 12px',
              borderTop: '0.5px solid var(--border)',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--green)',
              cursor: 'pointer',
              background: 'transparent',
              width: '100%',
            }}
          >
            {chartOpen ? 'Hide chart ↑' : 'View chart ↓'}
          </button>
          {chartOpen && (
            <TradeChart
              symbol={post.ticker}
              direction={post.direction === 'BUY' ? 'long' : 'short'}
              entryPrice={post.entry}
              exitPrice={post.target}
              stopLoss={post.stop}
              takeProfit={post.target}
              entryTime=""
              exitTime=""
              rMultiple={parseFloat(post.rrRatio) || undefined}
              timeframe="H1"
              height={280}
            />
          )}
        </div>

        {/* TradingView link */}
        <a
          href={tvUrl} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--surface)',
            padding: '8px 14px', textDecoration: 'none', marginBottom: 12,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-emphasis)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" strokeWidth="2" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{post.ticker} · Daily Chart</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>View on TradingView</div>
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#1d9bf0' }}>Open →</span>
        </a>

        {/* Thesis (mobile toggle) */}
        {isMobile && (
          <div
            onClick={e => { e.stopPropagation(); setThesisOpen(o => !o); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginBottom: 4, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Trade Thesis</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{thesisOpen ? '▲' : '▼'}</span>
          </div>
        )}
        {(!isMobile || thesisOpen) && (
          <div style={{ borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--surface)', marginBottom: 12, overflow: 'hidden' }}>
            {[
              { label: 'WHY NOW',      value: post.whyNow,      color: '#1d9bf0' },
              { label: 'RISK',         value: post.risk,         color: '#ef4444' },
              { label: 'INVALIDATION', value: post.invalidation, color: '#f59e0b' },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
            {post.hashtags.map(tag => (
              <span key={tag} onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: '#1d9bf0', cursor: 'pointer' }}>{tag}</span>
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
                title={`${post.ticker} ${post.direction} by ${post.user.name}`}
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

          {/* Share card button */}
          <button
            onClick={e => { e.stopPropagation(); setShareModalOpen(true); }}
            style={{
              fontSize: 11, fontWeight: 500,
              padding: '3px 9px', borderRadius: 4,
              border: '0.5px solid var(--border-hard)',
              background: 'transparent',
              color: 'var(--text-3)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Share ↗
          </button>
        </div>
      </div>

      {shareModalOpen && (
        <ShareModal
          trade={postToTrade(post)}
          user={{
            displayName:    post.user.name,
            handle:         post.user.username,
            avatarInitials: post.user.initials,
            isMT5Connected: false,
            winRate:        62,
            totalTrades:    post.user.tradesCount,
            avgRR:          1.8,
          } satisfies ShareCardUser}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
}
