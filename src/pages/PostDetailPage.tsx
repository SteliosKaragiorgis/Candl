import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { DEMO_POSTS, COMMENTS, currentUser } from '../data/demo';
import type { Comment } from '../data/demo';
import type { TradePost as LegacyTradePost, InvestmentPost, CommentaryPost as LegacyCommentaryPost, SocialPost } from '../types';
import type { Post as LegacyPost } from '../types';
import type { Post } from '../types/post';
import type { PostAuthor } from '../types/post';
import { useMobile } from '../hooks/useMobile';
import { usePublishedPosts } from '../hooks/usePublishedPosts';
import ShareDropdown from '../components/feed/ShareDropdown';
import PostCard from '../components/feed/PostCard';
import FeedErrorBoundary from '../components/feed/FeedErrorBoundary';

const CONVICTION_COLOR: Record<string, string> = {
  High: 'var(--green)', Medium: 'var(--gold)', Speculative: 'var(--red)',
};
const ACCENT: Record<string, string> = {
  BUY: 'var(--green)', SELL: 'var(--red)', SHORT: 'var(--red)',
};

// ── New typed demo posts (shared with FeedPage) ──────────────────────────────
// In a real app these would come from a shared store / API.

const DEMO_NEW_POSTS: Post[] = [
  {
    id: 'np-1', type: 'TRADE',
    author: { id: 'u1', displayName: 'Alex Kim', handle: 'alexkim', avatarInitials: 'AK', bio: 'Swing trader · FTMO funded', isVerified: true, isMT5Connected: true, winRate: 74, totalTrades: 312, avgRR: 2.1 },
    body: '$NVDA pre-earnings momentum play. **Textbook RSI reset** off the 50-day. Entered on the re-test of $858 with tight risk.',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    likes: 412, comments: 58, isLiked: false,
    tradeData: { symbol: 'NVDA', direction: 'LONG', entry: 858.40, exit: 924.60, stopLoss: 836.00, takeProfit: 930.00, pnl: 662.00, rMultiple: 2.9, timeframe: 'Daily', duration: '3d 4h', source: 'MT5' },
    lesson: 'Patience at key levels pays. Waited 2 days for the re-test instead of chasing.',
  },
  {
    id: 'np-2', type: 'TRADE',
    author: { id: 'u2', displayName: 'Sara R', handle: 'sarar_fx', avatarInitials: 'SR', bio: 'Forex · Price action', isVerified: true, isMT5Connected: true },
    body: 'Shorted $EURUSD on the London open rejection. Clean bearish engulfing at the H4 resistance zone.',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    likes: 89, comments: 12, isLiked: true,
    tradeData: { symbol: 'EURUSD', direction: 'SHORT', entry: 1.08540, exit: 1.08210, stopLoss: 1.08720, takeProfit: 1.07800, pnl: 330.00, rMultiple: 1.8, timeframe: 'H4', duration: '4h 20m', source: 'MT5' },
  },
  {
    id: 'np-3', type: 'TRADE',
    author: { id: 'u3', displayName: 'Mike W', handle: 'mikew_trades', avatarInitials: 'MW', bio: 'Day trader · Indices', isVerified: false, isMT5Connected: false },
    body: 'Long $NAS100 on the 9:30 open surge. Stopped out — volume dried up faster than expected.',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    likes: 34, comments: 7, isLiked: false,
    tradeData: { symbol: 'NAS100', direction: 'LONG', entry: 17840, exit: 17795, stopLoss: 17790, takeProfit: 17960, pnl: -450.00, rMultiple: -0.9, timeframe: 'M15', duration: '42m', source: 'MANUAL' },
    lesson: 'Never trade the first 5 minutes of the open. Wait for a clear direction before entering.',
    rule: 'No trades in the first 5 minutes after market open.',
  },
  {
    id: 'np-4', type: 'INVEST',
    author: { id: 'u4', displayName: 'Jamie T', handle: 'jamiet_inv', avatarInitials: 'JT', bio: 'Growth investor · Tech focus', isVerified: true, isMT5Connected: false },
    body: 'Adding to my $MSFT position after the Azure beat. AI infrastructure spend is just getting started.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    likes: 201, comments: 33, isLiked: false,
    investData: { symbol: 'MSFT', stance: 'BULLISH', entry: 384.50, target: 440.00, stop: 360.00, horizon: '12-18m', thesis: 'Azure AI workloads are growing at 3x the rate of the broader cloud market.' },
  },
  {
    id: 'np-5', type: 'COMMENTARY',
    author: { id: 'u5', displayName: 'Kay L', handle: 'kayl_macro', avatarInitials: 'KL', bio: 'Macro · Global markets', isVerified: false, isMT5Connected: false },
    body: 'Friday CPI came in hot at 3.5%. Fed rate cut expectations for June are now effectively priced out. Watch $DXY strength and its impact on $EURUSD and $GLD.',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    likes: 178, comments: 44, isLiked: false,
  },
  {
    id: 'np-6', type: 'PROP_FIRM',
    author: { id: 'u6', displayName: 'Ryan C', handle: 'ryanc_props', avatarInitials: 'RC', bio: 'Full-time trader · FTMO funded', isVerified: true, isMT5Connected: true },
    body: 'Stayed disciplined for 18 days. No revenge trades, stuck to my A-setups only.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    likes: 540, comments: 81, isLiked: false,
    propFirmData: { firm: 'FTMO', accountSize: '$100k', phase: 'Phase 1', result: 'PASSED', daysUsed: 18, finalPnl: 11200, winRate: 67, avgRR: 2.1, lesson: 'The challenge is won in the planning, not the execution.' },
  },
  {
    id: 'np-7', type: 'PROP_FIRM',
    author: { id: 'u7', displayName: 'Jordan B', handle: 'jordan_fx', avatarInitials: 'JB', bio: 'Forex · Learning the hard way', isVerified: false, isMT5Connected: false },
    body: 'Blew the drawdown limit on day 6. Three consecutive revenge trades after my first loss.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    likes: 312, comments: 96, isLiked: true,
    propFirmData: { firm: 'APEX', accountSize: '$50k', phase: 'Phase 1', result: 'FAILED', daysUsed: 6, finalPnl: -2800, winRate: 33, avgRR: 0.6, whatIllDoDifferently: 'Hard stop after 2 losses in a day.' },
  },
  {
    id: 'np-8', type: 'WEEKLY_RECAP',
    author: { id: 'candl-ai', displayName: 'Candl. AI', handle: 'candl', avatarInitials: 'AI', isVerified: false, isMT5Connected: false },
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    likes: 0, comments: 0, isLiked: false,
    recapData: { weekOf: 'Apr 1-7', totalPnl: 2340.50, winRate: 64, avgRR: 1.8, tradeCount: 14, generatedAt: new Date(Date.now() - 12 * 3600000).toISOString(), narrative: 'A positive week driven by two high-conviction setups on $NVDA and $EURUSD.' },
  },
];

// ── Comment item ─────────────────────────────────────────────────────────────

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
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
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

        {comment.replies && comment.replies.length > 0 && (
          <div style={{ marginLeft: 10, marginTop: 10, paddingLeft: 18, borderLeft: '2px solid var(--border2)' }}>
            {comment.replies.map(r => <CommentItem key={r.id} comment={r} nested />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Legacy post detail (for old demo posts) ──────────────────────────────────

function LegacyPostDetail({ post }: { post: LegacyPost }) {
  const isMobile = useMobile();
  const trade      = post.postType === 'trade'      ? post as LegacyTradePost      : null;
  const invest     = post.postType === 'investment'  ? post as InvestmentPost  : null;
  const commentary = post.postType === 'commentary'  ? post as LegacyCommentaryPost  : null;
  const social     = post.postType === 'social'      ? post as SocialPost      : null;
  const ticker     = trade?.ticker ?? invest?.ticker;
  const tvSymbol   = trade?.tvSymbol ?? (ticker ? `NASDAQ:${ticker}` : null);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <>
      {/* Post card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderLeft: `3px solid ${trade ? ACCENT[trade.direction] : invest ? 'var(--blue)' : social ? 'transparent' : 'var(--gold)'}`,
        borderRadius: 16, overflow: 'hidden', marginBottom: 16,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px 12px' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${post.user.avatarGradient[0]}, ${post.user.avatarGradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, boxShadow: '0 1px 6px rgba(0,0,0,0.18)' }}>
            {post.user.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{post.user.name}</span>
              {trade && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', padding: '1px 6px', borderRadius: 20, background: 'rgba(234,88,12,0.1)', color: '#ea580c', border: '1px solid rgba(234,88,12,0.2)' }}>TRADE</span>}
              {invest && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', padding: '1px 6px', borderRadius: 20, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' }}>INVEST</span>}
              {commentary && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.8px', padding: '1px 6px', borderRadius: 20, background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>COMMENTARY</span>}
              {post.user.verified && <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--blue)"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>@{post.user.username} · {post.createdAt}</div>
          </div>
          {ticker && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: 8, padding: '5px 9px', minWidth: 48, flexShrink: 0 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>{ticker}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>NASDAQ</span>
            </div>
          )}
        </div>

        {commentary && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, margin: '0 16px 10px', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 6, padding: '5px 10px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e' }}>News: {commentary.newsEvent} · {commentary.newsDate}</span>
          </div>
        )}

        <p style={{ padding: '0 16px 12px', fontSize: 14, lineHeight: 1.65, color: 'var(--text)', margin: 0 }}>{post.body}</p>

        {trade && (
          <div style={{ margin: '0 16px 12px', borderRadius: 10, padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.2px', padding: '3px 10px', borderRadius: 5, color: '#fff', background: trade.direction === 'BUY' ? 'var(--green)' : 'var(--red)' }}>{trade.direction}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{trade.ticker}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)', padding: '1px 7px', borderRadius: 20, background: 'var(--surface2)', border: '1px solid var(--border)' }}>{trade.strategy}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)', padding: '1px 7px', borderRadius: 20, background: 'var(--surface2)', border: '1px solid var(--border)' }}>{trade.timeframe}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 6 }}>
              {[
                { label: 'ENTRY',  value: `$${trade.entry.toFixed(2)}`,  color: 'var(--text)' },
                { label: 'TARGET', value: `$${trade.target.toFixed(2)}`, color: 'var(--green)' },
                { label: 'STOP',   value: `$${trade.stop.toFixed(2)}`,   color: 'var(--red)' },
                { label: 'R:R',    value: trade.rrRatio,                  color: 'var(--blue)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, lineHeight: 1, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {invest && (
          <div style={{ margin: '0 16px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{invest.ticker}</div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Conviction</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: CONVICTION_COLOR[invest.conviction] }}>{invest.conviction}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Horizon: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{invest.horizon}</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Added At: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{invest.addedAt}</span></div>
            </div>
          </div>
        )}

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
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

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
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const { posts: publishedPosts } = usePublishedPosts();

  // Find in legacy DEMO_POSTS
  const legacyPost = DEMO_POSTS.find(p => p.id === postId);
  // Find in new typed posts
  const newPost = DEMO_NEW_POSTS.find(p => p.id === postId);
  // Find in published MT5 posts
  const publishedPost = publishedPosts.find(p => p.id === postId);

  const found = !!(legacyPost || newPost || publishedPost);

  const [commentText, setCommentText] = useState('');
  const [backHovered, setBackHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(
    legacyPost?.likes ?? newPost?.likes ?? 0
  );
  const [likeAnim, setLikeAnim] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareAnchorRef = useRef<HTMLButtonElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  const initComments = COMMENTS[postId ?? ''] ?? [];
  const [localComments, setLocalComments] = useState<Comment[]>(initComments);

  useEffect(() => {
    if (window.location.hash === '#comments' && commentsRef.current) {
      setTimeout(() => commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, []);

  if (!found) {
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

  // Determine which share title to use
  const shareTitle = legacyPost?.body.slice(0, 80) ?? newPost?.body?.slice(0, 80) ?? 'Trade post';

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

      {/* Post content — new type or legacy */}
      {newPost ? (
        <div style={{ marginBottom: 16 }}>
          <FeedErrorBoundary>
            <PostCard post={newPost} />
          </FeedErrorBoundary>
        </div>
      ) : legacyPost ? (
        <LegacyPostDetail post={legacyPost} />
      ) : null}

      {/* Stats / action row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', borderTop: '1px solid var(--border2)', borderBottom: '1px solid var(--border2)', marginBottom: 20 }}>
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
              postId={postId ?? ''}
              title={shareTitle}
              anchorRef={shareAnchorRef}
              onClose={() => setShareOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Comments */}
      <div ref={commentsRef} id="comments" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>Comments</div>

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
