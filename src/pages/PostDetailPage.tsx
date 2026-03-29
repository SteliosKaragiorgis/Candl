import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { DEMO_POSTS, COMMENTS, currentUser } from '../data/demo';
import type { Comment } from '../data/demo';
import type { TradePost, InvestmentPost, CommentaryPost, SocialPost } from '../types';
import { useMobile } from '../hooks/useMobile';
import ShareDropdown from '../components/feed/ShareDropdown';

const CONVICTION_COLOR: Record<string, string> = {
  High: 'var(--green)', Medium: 'var(--gold)', Speculative: 'var(--red)',
};
const ACCENT: Record<string, string> = {
  BUY: 'var(--green)', SELL: 'var(--red)', SHORT: 'var(--red)',
};


function CommentItem({
  comment,
  nested = false,
  onReply,
}: {
  comment: Comment;
  nested?: boolean;
  onReply?: (commentId: string, text: string) => void;
}) {
  const [liked, setLiked] = useState(comment.liked);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [anim, setAnim] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const replyRef = useRef<HTMLTextAreaElement>(null);

  function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : c - 1);
    setAnim(true);
    setTimeout(() => setAnim(false), 350);
  }

  function toggleReply() {
    setReplyOpen(o => !o);
    if (!replyOpen) setTimeout(() => replyRef.current?.focus(), 50);
  }

  function submitReply() {
    if (!replyText.trim() || !onReply) return;
    onReply(comment.id, replyText.trim());
    setReplyText('');
    setReplyOpen(false);
  }

  const sz = nested ? 28 : 36;

  return (
    <div style={{ display: 'flex', gap: 10, padding: nested ? '10px 0' : '14px 0', borderBottom: nested ? 'none' : '1px solid var(--border2)' }}>
      <div style={{
        width: sz, height: sz, borderRadius: '50%', flexShrink: 0,
        background: comment.user.avatarGradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: nested ? 9 : 11, fontWeight: 700,
      }}>
        {comment.user.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{comment.user.name}</span>
          {comment.user.verified && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--blue)">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
          <span style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>
            {comment.user.handle} · {comment.createdAt}
          </span>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text)', margin: '6px 0 10px' }}>{comment.body}</p>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: '3px 0', fontSize: 12, color: liked ? 'var(--red)' : 'var(--text4)', cursor: 'pointer' }}>
            <svg className={anim ? 'like-pop' : ''} width="12" height="12" viewBox="0 0 24 24" fill={liked ? 'var(--red)' : 'none'} stroke={liked ? 'var(--red)' : 'currentColor'} strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {likeCount}
          </button>
          {!nested && onReply && (
            <button
              onClick={toggleReply}
              style={{ background: 'none', border: 'none', padding: '3px 0', fontSize: 12, color: replyOpen ? 'var(--blue)' : 'var(--text4)', cursor: 'pointer', fontWeight: replyOpen ? 600 : 400 }}
            >
              {replyOpen ? 'Cancel' : 'Reply'}
            </button>
          )}
        </div>

        {/* Inline reply form */}
        {replyOpen && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${currentUser.avatarGradient[0]}, ${currentUser.avatarGradient[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 8, fontWeight: 700,
            }}>
              {currentUser.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 4 }}>
                Replying to <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{comment.user.handle}</span>
              </div>
              <textarea
                ref={replyRef}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitReply(); }}
                placeholder={`Reply to ${comment.user.name}...`}
                rows={2}
                style={{
                  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--text)',
                  resize: 'none', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
                }}
              />
              {replyText.trim() && (
                <button
                  onClick={submitReply}
                  style={{ marginTop: 6, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  Post reply
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div style={{ marginLeft: 10, marginTop: 10, paddingLeft: 18, borderLeft: '2px solid var(--border2)' }}>
            {comment.replies.map(r => <CommentItem key={r.id} comment={r} nested />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const post = DEMO_POSTS.find(p => p.id === postId);

  const [commentText, setCommentText] = useState('');
  const [backHovered, setBackHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes ?? 0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareAnchorRef = useRef<HTMLButtonElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const initComments = COMMENTS[postId ?? ''] ?? [];
  const [localComments, setLocalComments] = useState<Comment[]>(initComments);

  // Scroll to comments section if navigated with #comments hash
  useEffect(() => {
    if (window.location.hash === '#comments' && commentsRef.current) {
      setTimeout(() => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, []);

  if (!post) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--text4)' }}>404</div>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 20 }}>Post not found</div>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Go back
        </button>
      </div>
    );
  }

  const trade      = post.postType === 'trade'      ? post as TradePost      : null;
  const invest     = post.postType === 'investment'  ? post as InvestmentPost  : null;
  const commentary = post.postType === 'commentary'  ? post as CommentaryPost  : null;
  const social     = post.postType === 'social'      ? post as SocialPost      : null;
  const ticker     = trade?.ticker ?? invest?.ticker;
  const tvSymbol   = trade?.tvSymbol ?? (ticker ? `NASDAQ:${ticker}` : null);

  function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : c - 1);
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 350);
  }

  const myUser = {
    name: currentUser.name,
    handle: `@${currentUser.username}`,
    initials: currentUser.initials,
    avatarGradient: `linear-gradient(135deg, ${currentUser.avatarGradient[0]}, ${currentUser.avatarGradient[1]})`,
    verified: currentUser.verified,
  };

  function handleSubmitComment() {
    if (!commentText.trim()) return;
    const c: Comment = {
      id: `new-${Date.now()}`,
      userId: currentUser.id,
      user: myUser,
      body: commentText.trim(),
      createdAt: 'just now',
      likes: 0,
      liked: false,
    };
    setLocalComments(prev => [c, ...prev]);
    setCommentText('');
  }

  function handleReply(commentId: string, text: string) {
    const reply: Comment = {
      id: `reply-${Date.now()}`,
      userId: currentUser.id,
      user: myUser,
      body: text,
      createdAt: 'just now',
      likes: 0,
      liked: false,
    };
    setLocalComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, replies: [...(c.replies ?? []), reply] }
        : c
    ));
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: isMobile ? '12px 14px 100px' : '24px 16px 80px', maxWidth: 780, margin: '0 auto' }}>

      {/* Back */}
      <div
        onClick={() => navigate(-1)}
        onMouseEnter={() => setBackHovered(true)}
        onMouseLeave={() => setBackHovered(false)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', color: backHovered ? 'var(--text)' : 'var(--text3)', transition: 'color 0.15s' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        <span style={{ fontSize: 13 }}>Back</span>
      </div>

      {/* Post card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderLeft: `3px solid ${trade ? ACCENT[trade.direction] : invest ? 'var(--blue)' : social ? 'transparent' : 'var(--gold)'}`,
        borderRadius: 16, overflow: 'hidden', marginBottom: 16,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px 12px' }}>
          <div
            onClick={() => navigate(`/profile/${post.user.id}`)}
            style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${post.user.avatarGradient[0]}, ${post.user.avatarGradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, boxShadow: '0 1px 6px rgba(0,0,0,0.18)', cursor: 'pointer' }}
          >
            {post.user.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
              <span onClick={() => navigate(`/profile/${post.user.id}`)} style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>{post.user.name}</span>
              {trade && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', padding: '1px 6px', borderRadius: 20, background: 'rgba(234,88,12,0.1)', color: '#ea580c', border: '1px solid rgba(234,88,12,0.2)' }}>TRADE</span>}
              {invest && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', padding: '1px 6px', borderRadius: 20, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' }}>INVEST</span>}
              {commentary && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', padding: '1px 6px', borderRadius: 20, background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>COMMENTARY</span>}
              {social?.sentiment && (() => {
                const c = social.sentiment === 'Bullish' ? { bg: 'rgba(22,163,74,0.12)', color: '#16a34a', border: 'rgba(22,163,74,0.35)' }
                        : social.sentiment === 'Bearish' ? { bg: 'rgba(220,38,38,0.12)', color: '#dc2626', border: 'rgba(220,38,38,0.35)' }
                        : { bg: 'rgba(217,119,6,0.12)', color: '#d97706', border: 'rgba(217,119,6,0.35)' };
                return <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', padding: '1px 6px', borderRadius: 20, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{social.sentiment!.toUpperCase()}</span>;
              })()}
              {post.user.verified && <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--blue)"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>@{post.user.username} · {post.createdAt}</div>
          </div>
          {ticker && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: 8, padding: '5px 9px', minWidth: 48, flexShrink: 0 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>{ticker}</span>
              <span style={{ fontSize: 7, color: 'var(--text4)', marginTop: 1 }}>NASDAQ</span>
            </div>
          )}
        </div>

        {/* Commentary news tag */}
        {commentary && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, margin: '0 16px 10px', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 6, padding: '5px 10px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e' }}>📰 {commentary.newsEvent} · {commentary.newsDate}</span>
          </div>
        )}

        {/* Body */}
        <p style={{ padding: '0 16px 12px', fontSize: 14, lineHeight: 1.65, color: 'var(--text)', margin: 0 }}>{post.body}</p>

        {/* Trade block */}
        {trade && (
          <div style={{ margin: '0 16px 12px', borderRadius: 10, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', padding: '3px 10px', borderRadius: 5, color: '#fff', background: trade.direction === 'BUY' ? 'var(--green)' : 'var(--red)' }}>{trade.direction}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{trade.ticker}</span>
              <span style={{ fontSize: 9, color: 'var(--text3)', padding: '1px 7px', borderRadius: 20, background: 'var(--surface2)', border: '1px solid var(--border)' }}>{trade.strategy}</span>
              <span style={{ fontSize: 9, color: 'var(--text3)', padding: '1px 7px', borderRadius: 20, background: 'var(--surface2)', border: '1px solid var(--border)' }}>{trade.timeframe}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 6 }}>
              {[
                { label: 'ENTRY',  value: `$${trade.entry.toFixed(2)}`,  color: 'var(--text)' },
                { label: 'TARGET', value: `$${trade.target.toFixed(2)}`, color: 'var(--green)' },
                { label: 'STOP',   value: `$${trade.stop.toFixed(2)}`,   color: 'var(--red)' },
                { label: 'R:R',    value: trade.rrRatio,                  color: 'var(--blue)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1, color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, lineHeight: 1, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trade thesis */}
        {trade && (
          <div style={{ margin: '0 16px 12px' }}>
            {[
              { label: 'WHY NOW', value: trade.whyNow, dot: 'var(--blue)' },
              { label: 'RISK', value: trade.risk, dot: 'var(--red)' },
              { label: 'INVALIDATION', value: trade.invalidation, dot: 'var(--gold)' },
            ].map(({ label, value, dot }, i, arr) => (
              <div key={label} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: dot }} />
                <div>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Investment conviction */}
        {invest && (
          <div style={{ margin: '0 16px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{invest.ticker}</div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 2 }}>Conviction</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: CONVICTION_COLOR[invest.conviction] }}>{invest.conviction}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Horizon: <span style={{ fontWeight: 600, color: 'var(--text2)' }}>{invest.horizon}</span></div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Added At: <span style={{ fontWeight: 600, color: 'var(--text2)' }}>{invest.addedAt}</span></div>
            </div>
          </div>
        )}

        {/* Investment thesis */}
        {invest && (
          <div style={{ margin: '0 16px 12px' }}>
            {[
              { label: 'CATALYST', value: invest.catalyst, dot: 'var(--blue)' },
              { label: 'VALUATION', value: invest.valuation, dot: 'var(--green)' },
              { label: 'RISK', value: invest.risk, dot: 'var(--red)' },
            ].map(({ label, value, dot }, i, arr) => (
              <div key={label} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border2)' : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: dot }} />
                <div>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Social images */}
        {social?.images && social.images.length > 0 && (
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{
              display: social.images.length === 1 ? 'block' : 'grid',
              gridTemplateColumns: social.images.length >= 2 ? '1fr 1fr' : undefined,
              gap: 2, borderRadius: 12, overflow: 'hidden',
              border: '1px solid var(--border)',
            }}>
              {social.images.map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: social.images!.length === 1 ? 400 : 220 }} />
              ))}
            </div>
          </div>
        )}

        {/* Hashtags */}
        <div style={{ display: 'flex', gap: 5, padding: '0 16px 14px', flexWrap: 'wrap' }}>
          {post.hashtags.map(tag => (
            <span key={tag} style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 500, cursor: 'pointer' }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* TradingView chart */}
      {tvSymbol && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{ticker} · Daily Chart</span>
            </div>
            <a href={`https://www.tradingview.com/chart/?symbol=${tvSymbol}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', textDecoration: 'none' }}>
              Open full chart →
            </a>
          </div>
          <iframe
            src={`https://www.tradingview.com/widgetembed/?symbol=${tvSymbol}&interval=D&theme=${isDark ? 'dark' : 'light'}&style=1&locale=en&hide_top_toolbar=0&hide_legend=0&saveimage=0&calendar=0&hide_volume=1`}
            style={{ width: '100%', height: isMobile ? 280 : 420, border: 'none', display: 'block' }}
            allowTransparency={true}
            allowFullScreen={true}
            title={`${ticker} chart`}
          />
        </div>
      )}

      {/* Stats / action row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', borderTop: '1px solid var(--border2)', borderBottom: '1px solid var(--border2)', marginBottom: 20 }}>

        {/* Like button */}
        <button
          onClick={handleLike}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 9,
            border: `1px solid ${liked ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
            background: liked ? 'rgba(239,68,68,0.06)' : 'var(--surface2)',
            color: liked ? 'var(--red)' : 'var(--text3)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
          }}
        >
          <svg className={likeAnim ? 'like-pop' : ''} width="15" height="15" viewBox="0 0 24 24" fill={liked ? 'var(--red)' : 'none'} stroke={liked ? 'var(--red)' : 'currentColor'} strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likeCount.toLocaleString()}
        </button>

        {/* Comments count */}
        <button
          onClick={() => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 9,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text3)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {localComments.length}
        </button>

        {/* Share button */}
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <button
            ref={shareAnchorRef}
            onClick={() => setShareOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 9,
              border: '1px solid var(--border)', background: shareOpen ? 'var(--surface2)' : 'var(--blue)',
              color: shareOpen ? 'var(--text)' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
          {shareOpen && (
            <ShareDropdown
              postId={post.id}
              title={post.body.slice(0, 80)}
              anchorRef={shareAnchorRef}
              onClose={() => setShareOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Comments heading */}
      <div ref={commentsRef} id="comments" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 14 }}>Comments</div>

      {/* Comment input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-start' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${currentUser.avatarGradient[0]}, ${currentUser.avatarGradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>
          {currentUser.initials}
        </div>
        <div style={{ flex: 1 }}>
          <textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            rows={2}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--text)', resize: 'none', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
          />
          {commentText.trim() && (
            <button onClick={handleSubmitComment} style={{ marginTop: 6, background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Post
            </button>
          )}
        </div>
      </div>

      {/* Comment list */}
      <div>
        {localComments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 13, color: 'var(--text4)' }}>No comments yet. Be the first!</div>
        ) : (
          localComments.map(c => <CommentItem key={c.id} comment={c} onReply={handleReply} />)
        )}
      </div>
    </div>
  );
}
