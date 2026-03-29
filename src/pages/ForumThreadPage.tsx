import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useMobile } from '../hooks/useMobile';
import { MY_FORUMS } from './ForumPage';

// ── Types ──────────────────────────────────────────────────────────────────

interface Reply {
  id: string;
  author: { initials: string; name: string; gradient: [string, string] };
  timeAgo: string;
  upvotes: number;
  body: string;
  nested?: Reply[];
}

interface ThreadDetail {
  id: string;
  forumId: string;
  forumName: string;
  tags: { label: string; type: 'sentiment' | 'topic' }[];
  title: string;
  author: { initials: string; name: string; gradient: [string, string] };
  postedAt: string;
  body: string;
  tradeData?: { entry: string; target: string; stop: string; rr: string; symbol: string };
  upvotes: number;
  downvotes: number;
  replyCount: number;
  replies: Reply[];
}

// ── Data ───────────────────────────────────────────────────────────────────

const THREAD_DETAILS: Record<string, ThreadDetail> = {
  of1: {
    id: 'of1', forumId: 'options-flow', forumName: 'Options Flow Traders',
    tags: [{ label: 'Bullish', type: 'sentiment' }, { label: 'NVDA', type: 'topic' }, { label: 'Trade Ideas', type: 'topic' }],
    title: 'NVDA breakout above $950 — is this the start of the next leg up or a bull trap?',
    author: { initials: 'JK', name: 'jake_kap', gradient: ['#0047FF', '#00c6ff'] },
    postedAt: '2h ago',
    body: `After consolidating for 6 weeks between $880–$940, NVDA finally cleared the key $950 level today on volume that was 40% above the 20-day average. This is the kind of volume confirmation I look for on breakouts.\n\nMy thesis: the demand zone held perfectly, MACD on the weekly is crossing bullish, and earnings are still 5 weeks away — giving this room to run before any event risk kicks in. I'm targeting $1,080 as the next major resistance, with a stop at $920 (just below the breakout level).\n\nThe main risk I see is a broader market selloff pulling NVDA back down with it regardless of technicals. Would love to hear other views — anyone seeing bearish signals I might be missing?`,
    tradeData: { entry: '$952.40', target: '$1,080', stop: '$920', rr: '3.9 : 1', symbol: 'NASDAQ:NVDA' },
    upvotes: 247, downvotes: 12, replyCount: 84,
    replies: [
      {
        id: 'r1',
        author: { initials: 'SR', name: 'sara_risk', gradient: ['#dc2626', '#f97316'] },
        timeAgo: '1h ago', upvotes: 58,
        body: "Good setup. The one thing I'd watch is the $965 level — it acted as resistance twice in February. If we can't close above that on tomorrow's candle, this could be a false breakout. I'm waiting for confirmation before adding.",
        nested: [{
          id: 'r1a',
          author: { initials: 'JK', name: 'jake_kap', gradient: ['#0047FF', '#00c6ff'] },
          timeAgo: '45m ago', upvotes: 21,
          body: "That's a fair point on $965 — I actually set my alert there. If volume drops off at that level I'll trim 30% of the position and let the rest run with a trailing stop.",
        }],
      },
      {
        id: 'r2',
        author: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
        timeAgo: '55m ago', upvotes: 34,
        body: "Options flow also backing this up — saw a sweep of 2,400 call contracts at the $960 strike expiring next Friday. Someone's putting real money behind the breakout thesis.",
      },
      {
        id: 'r3',
        author: { initials: 'MC', name: 'mike_chain', gradient: ['#f97316', '#7c3aed'] },
        timeAgo: '1h ago', upvotes: 18,
        body: "Bearish signal: RSI on the daily is already at 71 — overbought territory. A lot of the move may already be priced in. I'd be cautious chasing here. R:R looks good on paper but the entry timing feels late.",
      },
    ],
  },
  of2: {
    id: 'of2', forumId: 'options-flow', forumName: 'Options Flow Traders',
    tags: [{ label: 'Bearish', type: 'sentiment' }, { label: 'SPY', type: 'topic' }],
    title: 'SPY put wall at 510 — market pricing in a correction?',
    author: { initials: 'SR', name: 'sara_risk', gradient: ['#dc2626', '#f97316'] },
    postedAt: '4h ago',
    body: `Massive put open interest building at 510 strike on SPY. Dark pool prints suggest institutional hedging. If SPY can't hold 515 by Friday close, this could trigger a cascade to 505.\n\nThe gamma exposure at 510 is significant. Market makers will need to sell delta to hedge as we approach that level, which creates a self-reinforcing move down. I'm positioned in puts expiring next Friday.\n\nKey levels to watch: 515 (current support), 510 (put wall), 505 (next support). Above 518 and this thesis is invalidated.`,
    tradeData: { entry: '$516.20', target: '$505', stop: '$519', rr: '2.8 : 1', symbol: 'AMEX:SPY' },
    upvotes: 198, downvotes: 8, replyCount: 61,
    replies: [
      {
        id: 'r4',
        author: { initials: 'JK', name: 'jake_kap', gradient: ['#0047FF', '#00c6ff'] },
        timeAgo: '3h ago', upvotes: 44,
        body: "Confirmed — I'm seeing the same dark pool prints. The 510 put wall is the largest single-strike concentration I've seen in months. This is not retail.",
      },
      {
        id: 'r5',
        author: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
        timeAgo: '2h ago', upvotes: 29,
        body: "Worth noting that VIX term structure is also flattening — front month vol is rising faster than back month. Classic hedging pattern before a move.",
      },
    ],
  },
  of3: {
    id: 'of3', forumId: 'options-flow', forumName: 'Options Flow Traders',
    tags: [{ label: 'Bullish', type: 'sentiment' }, { label: 'TSLA', type: 'topic' }],
    title: 'Dark pool — 2M shares TSLA at $168, above market',
    author: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
    postedAt: '6h ago',
    body: `Dark pool print: 2 million shares of TSLA at $168.40, about 0.8% above current market. Premium prints like this often precede significant upward moves.\n\nHistorically, TSLA dark pool buys above market have been followed by a move of 3–7% within 5 sessions about 68% of the time based on my tracking. This is a large block — likely an institution building a position.\n\nI'm long via $175 calls expiring in 3 weeks. Risk is Tesla's delivery numbers next week — if they disappoint, this thesis fails quickly.`,
    tradeData: { entry: '$167.80', target: '$178', stop: '$163', rr: '2.1 : 1', symbol: 'NASDAQ:TSLA' },
    upvotes: 88, downvotes: 5, replyCount: 29,
    replies: [
      {
        id: 'r6',
        author: { initials: 'MC', name: 'mike_chain', gradient: ['#f97316', '#7c3aed'] },
        timeAgo: '5h ago', upvotes: 15,
        body: "Interesting — I've been tracking TSLA dark pool activity for the past quarter and this is one of the larger prints. Usually above-market block prints are taken seriously.",
      },
    ],
  },
};

// ── TradingView Chart ──────────────────────────────────────────────────────

function TradingViewChart({ symbol, darkMode }: { symbol: string; darkMode: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: darkMode ? 'dark' : 'light',
      style: '1',
      locale: 'en',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });
    scriptRef.current = script;
    containerRef.current.appendChild(script);

    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [symbol, darkMode]);

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Avatar({ initials, gradient, size = 32 }: { initials: string; gradient: [string, string]; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.34, fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

function TagBadge({ label, type }: { label: string; type: 'sentiment' | 'topic' }) {
  let bg = 'transparent', color = 'var(--text-2)', border = '1px solid var(--border)';
  if (type === 'sentiment') {
    if (label === 'Bullish') { bg = 'rgba(22,163,74,0.12)'; color = '#16a34a'; border = '1px solid rgba(22,163,74,0.3)'; }
    if (label === 'Bearish') { bg = 'rgba(220,38,38,0.12)'; color = '#dc2626'; border = '1px solid rgba(220,38,38,0.3)'; }
  }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: bg, color, border }}>
      {label}
    </span>
  );
}

function VoteBtn({ direction, count, active, onClick }: { direction: 'up' | 'down'; count: number; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 8,
        border: `1px solid ${active ? (direction === 'up' ? 'var(--blue)' : 'var(--red)') : 'var(--border)'}`,
        background: active ? (direction === 'up' ? 'rgba(0,71,255,0.08)' : 'rgba(220,38,38,0.08)') : 'transparent',
        color: active ? (direction === 'up' ? 'var(--blue)' : 'var(--red)') : 'var(--text-2)',
        cursor: 'pointer', fontSize: 13, fontWeight: 600,
      }}
    >
      {direction === 'up' ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      )}
      {count}
    </button>
  );
}

function ReplyRow({ reply, nested = false, onReply }: { reply: Reply; nested?: boolean; onReply?: (name: string) => void }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [nestedReplies, setNestedReplies] = useState<Reply[]>(reply.nested ?? []);

  const score = reply.upvotes + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);

  const submitReply = () => {
    if (!replyText.trim()) return;
    setNestedReplies(prev => [...prev, {
      id: `r-${Date.now()}`,
      author: { initials: 'ME', name: 'you', gradient: ['#0047FF', '#00c6ff'] },
      timeAgo: 'just now', upvotes: 0,
      body: replyText.trim(),
    }]);
    setReplyText('');
    setReplyOpen(false);
  };

  return (
    <div style={{
      paddingLeft: nested ? 20 : 0,
      borderLeft: nested ? '2px solid var(--border)' : 'none',
      marginLeft: nested ? 40 : 0,
    }}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: '1px solid var(--border)' }}>
        {/* Vote column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <button
            onClick={() => setVote(v => v === 'up' ? null : 'up')}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: `1px solid ${vote === 'up' ? 'var(--blue)' : 'var(--border)'}`,
              background: vote === 'up' ? 'rgba(0,71,255,0.08)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: vote === 'up' ? 'var(--blue)' : 'var(--text-3)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <span style={{ fontSize: 11, fontWeight: 700, color: vote === 'up' ? 'var(--blue)' : vote === 'down' ? 'var(--red)' : 'var(--text-2)' }}>{score}</span>
          <button
            onClick={() => setVote(v => v === 'down' ? null : 'down')}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: `1px solid ${vote === 'down' ? 'var(--red)' : 'var(--border)'}`,
              background: vote === 'down' ? 'rgba(220,38,38,0.08)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: vote === 'down' ? 'var(--red)' : 'var(--text-3)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Avatar initials={reply.author.initials} gradient={reply.author.gradient} size={28} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{reply.author.name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>· {reply.timeAgo}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 10px' }}>{reply.body}</p>
          <div style={{ display: 'flex', gap: 14 }}>
            {!nested && (
              <button
                onClick={() => setReplyOpen(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: replyOpen ? 'var(--blue)' : 'var(--text-3)', padding: 0 }}
              >
                Reply
              </button>
            )}
            {(['Quote', 'Share'] as const).filter(() => !nested).map(action => (
              <button key={action} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', padding: 0 }}>
                {action}
              </button>
            ))}
          </div>

          {/* Inline reply compose */}
          {replyOpen && (
            <div style={{ marginTop: 10, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Reply to ${reply.author.name}…`}
                rows={2}
                autoFocus
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'var(--surface-2)', border: 'none', outline: 'none',
                  resize: 'none', fontSize: 13, color: 'var(--text)',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '6px 10px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
                <button onClick={() => setReplyOpen(false)} style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={submitReply}
                  style={{
                    padding: '5px 14px', borderRadius: 6,
                    background: replyText.trim() ? 'var(--blue)' : 'var(--surface)',
                    color: replyText.trim() ? '#fff' : 'var(--text-3)',
                    border: `1px solid ${replyText.trim() ? 'var(--blue)' : 'var(--border)'}`,
                    fontSize: 12, fontWeight: 700, cursor: replyText.trim() ? 'pointer' : 'default',
                  }}
                >
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {nestedReplies.map(n => <ReplyRow key={n.id} reply={n} nested />)}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ForumThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isMobile = useMobile();

  const [upvoted, setUpvoted] = useState(false);
  const [downvoted, setDownvoted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sortReplies] = useState('Top replies');

  const thread = threadId ? THREAD_DETAILS[threadId] : null;

  const [replies, setReplies] = useState<Reply[]>(thread?.replies ?? []);
  const [replyCount, setReplyCount] = useState(thread?.replyCount ?? 0);

  if (!thread) return (
    <div style={{ padding: 40, color: 'var(--text-2)' }}>Thread not found.</div>
  );

  const submitReply = () => {
    if (!replyText.trim()) return;
    setReplies(prev => [{
      id: `r-${Date.now()}`,
      author: { initials: 'ME', name: 'you', gradient: ['#0047FF', '#00c6ff'] },
      timeAgo: 'just now',
      upvotes: 0,
      body: replyText.trim(),
    }, ...prev]);
    setReplyCount(c => c + 1);
    setReplyText('');
  };

  const forumParam = searchParams.get('f') ?? thread.forumId;
  const isDark = theme === 'dark';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: isMobile ? '12px 12px 80px' : '24px 32px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/forum')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-3)', padding: 0 }}>
          Groups
        </button>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        <button onClick={() => navigate(`/forum?f=${forumParam}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-3)', padding: 0 }}>
          {thread.forumName}
        </button>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>Thread</span>
      </div>

      {/* Main thread card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: isMobile ? '16px' : '24px',
        marginBottom: 16,
      }}>
        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {thread.tags.map(t => <TagBadge key={t.label} label={t.label} type={t.type} />)}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: isMobile ? 19 : 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3, margin: '0 0 16px' }}>
          {thread.title}
        </h1>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Avatar initials={thread.author.initials} gradient={thread.author.gradient} size={36} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{thread.author.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Posted {thread.postedAt} · {thread.forumName}</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ marginBottom: 20 }}>
          {thread.body.split('\n\n').map((para, i) => (
            <p key={i} style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 12, marginTop: 0 }}>
              {para}
            </p>
          ))}
        </div>

        {/* Trade data */}
        {thread.tradeData && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1, borderRadius: 10, overflow: 'hidden',
            border: '1px solid var(--border)', marginBottom: 20,
          }}>
            {[
              { label: 'Entry',  value: thread.tradeData.entry,  color: 'var(--text)' },
              { label: 'Target', value: thread.tradeData.target, color: 'var(--green)' },
              { label: 'Stop',   value: thread.tradeData.stop,   color: 'var(--red)' },
              { label: 'R:R',    value: thread.tradeData.rr,     color: 'var(--text)' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--surface-2)', padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TradingView Chart */}
        {thread.tradeData && (
          <div style={{
            height: isMobile ? 280 : 380, borderRadius: 10, overflow: 'hidden',
            border: '1px solid var(--border)', marginBottom: 20,
          }}>
            <TradingViewChart symbol={thread.tradeData.symbol} darkMode={isDark} />
          </div>
        )}

        {/* Action row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <VoteBtn direction="up" count={thread.upvotes + (upvoted ? 1 : 0)} active={upvoted} onClick={() => { setUpvoted(v => !v); if (downvoted) setDownvoted(false); }} />
          <VoteBtn direction="down" count={thread.downvotes + (downvoted ? 1 : 0)} active={downvoted} onClick={() => { setDownvoted(v => !v); if (upvoted) setUpvoted(false); }} />

          <span style={{ color: 'var(--border)', fontSize: 18 }}>·</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 13, fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {replyCount} replies
          </div>

          <button style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share
          </button>
        </div>
      </div>

      {/* Replies section */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: isMobile ? '16px' : '24px' }}>

        {/* Replies header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
            {replyCount} replies
          </span>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            {sortReplies}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>

        {/* Compose reply */}
        <div style={{ marginBottom: 8, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Add your reply..."
            rows={3}
            style={{
              width: '100%', padding: '12px 14px',
              background: 'var(--surface-2)', border: 'none', outline: 'none',
              resize: 'none', fontSize: 13, color: 'var(--text)',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 10px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
            <button
              style={{
                padding: '7px 20px', borderRadius: 8,
                background: replyText.trim() ? 'var(--blue)' : 'var(--surface)',
                color: replyText.trim() ? '#fff' : 'var(--text-3)',
                border: `1px solid ${replyText.trim() ? 'var(--blue)' : 'var(--border)'}`,
                fontSize: 13, fontWeight: 700, cursor: replyText.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
              onClick={submitReply}
            >
              Reply
            </button>
          </div>
        </div>

        {/* Reply list */}
        {replies.map(reply => <ReplyRow key={reply.id} reply={reply} />)}
      </div>
    </div>
  );
}
