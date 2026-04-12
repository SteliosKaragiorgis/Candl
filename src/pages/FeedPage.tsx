import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import ComposerModal from '../components/feed/ComposerModal';
import NewsCard from '../components/feed/NewsCard';
import PendingTradeCard from '../components/feed/PendingTradeCard';
import ShareTradeModal from '../components/feed/ShareTradeModal';
import PostCard from '../components/feed/PostCard';
import FeedErrorBoundary from '../components/feed/FeedErrorBoundary';
import { DEMO_POSTS, NEWS_ITEMS, currentUser } from '../data/demo';
import type { Post as LegacyPost, TradePost as LegacyTradePost } from '../types';
import type { Post } from '../types/post';
import type { PostAuthor } from '../types/post';
import { usePendingTrade } from '../hooks/usePendingTrade';
import type { PendingTrade } from '../hooks/usePendingTrade';
import { useMetaApiTrades } from '../hooks/useMetaApiTrades';
import type { ShareTradeFormData } from '../components/feed/ShareTradeModal';
import { usePublishedPosts } from '../hooks/usePublishedPosts';
import type { PublishedPost } from '../hooks/usePublishedPosts';

type FeedTab = 'all' | 'trades' | 'investments' | 'commentary';

// ── Convert legacy demo posts to unified Post type ───────────────────────────

function parseRelativeMinutes(s: string): number {
  const m = s.match(/(\d+)\s*(m|h)/);
  if (!m) return 0;
  const n = parseInt(m[1]);
  return m[2] === 'h' ? n * 60 : n;
}

function userToAuthor(u: LegacyPost['user']): PostAuthor {
  return {
    id: u.id,
    displayName: u.name,
    handle: u.username,
    avatarInitials: u.initials,
    bio: u.bio,
    isVerified: u.verified,
    isMT5Connected: false,
  };
}

function legacyToPost(old: LegacyPost): Post {
  const createdAt = new Date(
    Date.now() - parseRelativeMinutes(old.createdAt) * 60000 - 30000,
  ).toISOString();

  if (old.postType === 'trade') {
    const t = old as LegacyTradePost;
    const rrNum = parseFloat(t.rrRatio.replace(/[^-\d.]/g, ''));
    const directionNew = t.direction === 'SHORT' ? 'SHORT' as const : 'LONG' as const;
    const risk = directionNew === 'LONG' ? t.entry - t.stop : t.stop - t.entry;
    const pnl = rrNum * risk;

    return {
      id: old.id,
      type: 'TRADE',
      author: userToAuthor(old.user),
      body: old.body,
      createdAt,
      likes: old.likes,
      comments: old.comments,
      isLiked: false,
      tradeData: {
        symbol: t.ticker,
        direction: directionNew,
        entry: t.entry,
        exit: rrNum >= 0 ? t.target : t.entry + (directionNew === 'LONG' ? -1 : 1) * Math.abs(rrNum) * risk,
        stopLoss: t.stop,
        takeProfit: t.target,
        pnl,
        rMultiple: rrNum,
        timeframe: t.timeframe,
        duration: t.isOpen ? 'Open' : '',
        source: 'MANUAL',
      },
    };
  }

  if (old.postType === 'investment') {
    return {
      id: old.id,
      type: 'INVEST',
      author: userToAuthor(old.user),
      body: old.body,
      createdAt,
      likes: old.likes,
      comments: old.comments,
      isLiked: false,
      investData: {
        symbol: (old as any).ticker,
        stance: 'BULLISH',
        entry: (old as any).entry ?? 0,
        target: (old as any).target,
        stop: (old as any).stop,
        horizon: (old as any).horizon,
        thesis: (old as any).catalyst ?? old.body,
      },
    };
  }

  // commentary / social → COMMENTARY
  return {
    id: old.id,
    type: 'COMMENTARY',
    author: userToAuthor(old.user),
    body: old.body,
    createdAt,
    likes: old.likes,
    comments: old.comments,
    isLiked: false,
  };
}

// ── New typed demo posts ─────────────────────────────────────────────────────

const DEMO_NEW_POSTS: Post[] = [
  {
    id: 'np-1',
    type: 'TRADE',
    author: { id: 'u1', displayName: 'Alex Kim', handle: 'alexkim', avatarInitials: 'AK', bio: 'Swing trader · FTMO funded', isVerified: true, isMT5Connected: true, winRate: 74, totalTrades: 312, avgRR: 2.1 },
    body: '$NVDA pre-earnings momentum play. **Textbook RSI reset** off the 50-day. Entered on the re-test of $858 with tight risk.',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    likes: 412, comments: 58, isLiked: false,
    tradeData: { symbol: 'NVDA', direction: 'LONG', entry: 858.40, exit: 924.60, stopLoss: 836.00, takeProfit: 930.00, pnl: 662.00, rMultiple: 2.9, timeframe: 'Daily', duration: '3d 4h', source: 'MT5' },
    lesson: 'Patience at key levels pays. Waited 2 days for the re-test instead of chasing.',
  },
  {
    id: 'np-2',
    type: 'TRADE',
    author: { id: 'u2', displayName: 'Sara R', handle: 'sarar_fx', avatarInitials: 'SR', bio: 'Forex · Price action', isVerified: true, isMT5Connected: true },
    body: 'Shorted $EURUSD on the London open rejection. Clean bearish engulfing at the H4 resistance zone.',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    likes: 89, comments: 12, isLiked: true,
    tradeData: { symbol: 'EURUSD', direction: 'SHORT', entry: 1.08540, exit: 1.08210, stopLoss: 1.08720, takeProfit: 1.07800, pnl: 330.00, rMultiple: 1.8, timeframe: 'H4', duration: '4h 20m', source: 'MT5' },
  },
  {
    id: 'np-3',
    type: 'TRADE',
    author: { id: 'u3', displayName: 'Mike W', handle: 'mikew_trades', avatarInitials: 'MW', bio: 'Day trader · Indices', isVerified: false, isMT5Connected: false },
    body: 'Long $NAS100 on the 9:30 open surge. Stopped out — volume dried up faster than expected.',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    likes: 34, comments: 7, isLiked: false,
    tradeData: { symbol: 'NAS100', direction: 'LONG', entry: 17840, exit: 17795, stopLoss: 17790, takeProfit: 17960, pnl: -450.00, rMultiple: -0.9, timeframe: 'M15', duration: '42m', source: 'MANUAL' },
    lesson: 'Never trade the first 5 minutes of the open. Wait for a clear direction before entering.',
    rule: 'No trades in the first 5 minutes after market open. Minimum 5-minute wait, confirmed by volume.',
  },
  {
    id: 'np-4',
    type: 'INVEST',
    author: { id: 'u4', displayName: 'Jamie T', handle: 'jamiet_inv', avatarInitials: 'JT', bio: 'Growth investor · Tech focus', isVerified: true, isMT5Connected: false },
    body: 'Adding to my $MSFT position after the Azure beat. AI infrastructure spend is just getting started.',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    likes: 201, comments: 33, isLiked: false,
    investData: { symbol: 'MSFT', stance: 'BULLISH', entry: 384.50, target: 440.00, stop: 360.00, horizon: '12-18m', thesis: 'Azure AI workloads are growing at 3x the rate of the broader cloud market. Copilot monetisation begins in Q3. Valuation is reasonable at 28x forward earnings given the growth runway.' },
  },
  {
    id: 'np-5',
    type: 'COMMENTARY',
    author: { id: 'u5', displayName: 'Kay L', handle: 'kayl_macro', avatarInitials: 'KL', bio: 'Macro · Global markets', isVerified: false, isMT5Connected: false },
    body: 'Friday CPI came in hot at 3.5%. Fed rate cut expectations for June are now effectively priced out. Watch $DXY strength and its impact on $EURUSD and $GLD. This changes the picture for risk assets short-term — **stay defensive**.',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    likes: 178, comments: 44, isLiked: false,
  },
  {
    id: 'np-6',
    type: 'PROP_FIRM',
    author: { id: 'u6', displayName: 'Ryan C', handle: 'ryanc_props', avatarInitials: 'RC', bio: 'Full-time trader · FTMO funded', isVerified: true, isMT5Connected: true },
    body: 'Stayed disciplined for 18 days. No revenge trades, stuck to my A-setups only. The process worked.',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    likes: 540, comments: 81, isLiked: false,
    propFirmData: { firm: 'FTMO', accountSize: '$100k', phase: 'Phase 1', result: 'PASSED', daysUsed: 18, finalPnl: 11200, winRate: 67, avgRR: 2.1, lesson: 'The challenge is won in the planning, not the execution. A solid trading plan removes 90% of the emotional decisions.' },
  },
  {
    id: 'np-7',
    type: 'PROP_FIRM',
    author: { id: 'u7', displayName: 'Jordan B', handle: 'jordan_fx', avatarInitials: 'JB', bio: 'Forex · Learning the hard way', isVerified: false, isMT5Connected: false },
    body: 'Blew the drawdown limit on day 6. Three consecutive revenge trades after my first loss. Sharing this because it\'s important to be honest about failures.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    likes: 312, comments: 96, isLiked: true,
    propFirmData: { firm: 'APEX', accountSize: '$50k', phase: 'Phase 1', result: 'FAILED', daysUsed: 6, finalPnl: -2800, winRate: 33, avgRR: 0.6, whatIllDoDifferently: 'Hard stop after 2 losses in a day. Revenge trading is the #1 account killer and I knew this — I just didn\'t enforce it.' },
  },
  {
    id: 'np-8',
    type: 'WEEKLY_RECAP',
    author: { id: 'candl-ai', displayName: 'Candl. AI', handle: 'candl', avatarInitials: 'AI', isVerified: false, isMT5Connected: false },
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    likes: 0, comments: 0, isLiked: false,
    recapData: {
      weekOf: 'Apr 1-7',
      totalPnl: 2340.50,
      winRate: 64,
      avgRR: 1.8,
      tradeCount: 14,
      generatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      narrative: 'A positive week driven by two high-conviction setups on $NVDA and $EURUSD. You stayed patient during Tuesday\'s choppy session and avoided 3 lower-quality setups. Your best performance came during the London session open, which continues to be your strongest time window. Win rate improved 8% from last week.',
    },
  },
];

// ── Feed helpers ──────────────────────────────────────────────────────────────

let CONVERTED_LEGACY: Post[] = [];
try {
  CONVERTED_LEGACY = DEMO_POSTS.map(legacyToPost);
} catch (e) {
  console.error('[FeedPage] Failed to convert legacy posts:', e);
}

function filterPosts(posts: Post[], tab: FeedTab): Post[] {
  if (tab === 'all') return posts;
  if (tab === 'trades') return posts.filter(p => p.type === 'TRADE');
  if (tab === 'investments') return posts.filter(p => p.type === 'INVEST');
  if (tab === 'commentary') return posts.filter(p => p.type === 'COMMENTARY' || p.type === 'PROP_FIRM' || p.type === 'WEEKLY_RECAP');
  return posts;
}

const TABS: { id: FeedTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'trades', label: 'Trades' },
  { id: 'investments', label: 'Investments' },
  { id: 'commentary', label: 'Commentary' },
];

/** Convert a published MT5 trade into the Post shape. */
function publishedPostToPost(
  p: PublishedPost,
  totalTrades: number,
  winRate: number | null,
): Post {
  const t = p.trade;
  return {
    id:        p.id,
    type:      'TRADE',
    author: {
      id:             currentUser.id,
      displayName:    currentUser.name,
      handle:         currentUser.username,
      avatarInitials: currentUser.initials,
      bio:            currentUser.bio,
      isVerified:     currentUser.verified,
      isMT5Connected: true,
      winRate:        winRate ?? undefined,
      totalTrades,
      avgRR:          0,
    },
    body:      p.narrative || undefined,
    createdAt: p.publishedAt,
    likes:     0,
    comments:  0,
    isLiked:   false,
    lesson:    p.lesson || undefined,
    tradeData: {
      symbol:    t.symbol,
      direction: (t.direction.toUpperCase() as 'LONG' | 'SHORT'),
      entry:     t.entry_price,
      exit:      t.exit_price,
      stopLoss:  t.sl  > 0 ? t.sl  : undefined,
      takeProfit:t.tp  > 0 ? t.tp  : undefined,
      pnl:       t.net_profit,
      rMultiple: t.r_multiple,
      timeframe: 'H1',
      duration:  t.duration_formatted,
      source:    'MT5',
      openedAt:  t.open_time,
      closedAt:  t.close_time,
    },
  };
}

export default function FeedPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [tab, setTab] = useState<FeedTab>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKey, setComposerKey] = useState(0);
  const [composerTab, setComposerTab] = useState<'post' | 'trade' | 'invest' | 'commentary'>('post');
  const [activeComposeType, setActiveComposeType] = useState<'post' | 'trade' | 'invest' | 'commentary'>('post');

  function openComposer(t: 'post' | 'trade' | 'invest' | 'commentary' = 'post') {
    setComposerTab(t);
    setComposerOpen(true);
    setComposerKey(k => k + 1);
  }

  const [pendingVisible, setPendingVisible] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const { posts: publishedPosts, addPost } = usePublishedPosts();

  // Deduplicate by trade identity — keep the newest (first in array, since addPost prepends)
  const uniquePublished = useMemo(() => {
    const seen = new Set<string>();
    return publishedPosts.filter(p => {
      const key = p.trade.ticket ? String(p.trade.ticket) : `${p.trade.symbol}|${p.trade.open_time}|${p.trade.close_time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [publishedPosts]);

  const publishedTotal   = uniquePublished.length;
  const publishedWins    = uniquePublished.filter(p => p.trade.net_profit > 0).length;
  const publishedWinRate = publishedTotal === 0
    ? null
    : Math.round((publishedWins / publishedTotal) * 100);

  const { pendingTrade, dismiss, remindLater } = usePendingTrade();

  // Poll MetaAPI for real closed trades
  useMetaApiTrades((trade: PendingTrade) => {
    setPendingVisible(true);
    const key = 'candl_metaapi_pending';
    localStorage.setItem(key, JSON.stringify(trade));
    window.dispatchEvent(new Event('candl-metaapi-trade'));
  });

  // ── Unified, sorted feed ───────────────────────────────────────────────────
  const allPosts = useMemo(() => {
    console.log('[FeedPage] Building feed — published:', uniquePublished.length, 'demo:', DEMO_NEW_POSTS.length, 'legacy:', CONVERTED_LEGACY.length);
    uniquePublished.forEach((p, i) => console.log(`[FeedPage] published[${i}] id=${p.id} publishedAt=${p.publishedAt} symbol=${p.trade.symbol}`));
    const published = uniquePublished.map(p =>
      publishedPostToPost(p, publishedTotal, publishedWinRate),
    );
    published.forEach((p, i) => console.log(`[FeedPage] converted[${i}] id=${p.id} createdAt=${p.createdAt}`));
    const merged = [...published, ...DEMO_NEW_POSTS, ...CONVERTED_LEGACY];
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    merged.slice(0, 3).forEach((p, i) => console.log(`[FeedPage] sorted[${i}] id=${p.id} createdAt=${p.createdAt}`));
    return merged;
  }, [uniquePublished, publishedTotal, publishedWinRate]);

  const visiblePosts = filterPosts(allPosts, tab);

  // News cards keyed by the legacy post id they relate to
  const newsMap = Object.fromEntries(NEWS_ITEMS.map(n => [n.relatedPostId, n]));

  function handlePublish(data: ShareTradeFormData) {
    const post: PublishedPost = {
      id:          `mt5-${Date.now()}`,
      trade:       pendingTrade,
      narrative:   data.narrative,
      emotions:    data.emotions,
      lesson:      data.lesson,
      publishedAt: new Date().toISOString(),
      authorId:    currentUser.id,
    };
    console.log('[FeedPage] Publishing trade:', post.id, post.trade.symbol, post.trade.direction);
    addPost(post);
    console.log('[FeedPage] Post added, closing modal');
    setShareModalOpen(false);
    setPendingVisible(false);
  }

  const composeTypes: { id: 'post' | 'trade' | 'invest' | 'commentary'; label: string }[] = [
    { id: 'trade', label: 'Trade' },
    { id: 'invest', label: 'Investment' },
    { id: 'commentary', label: 'Commentary' },
    { id: 'post', label: 'Post' },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ minHeight: '100%' }}>
        {/* Compose box */}
        <div style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 8,
          margin: '12px 16px',
          padding: '12px 14px',
        }}>
          <textarea
            onClick={() => openComposer(activeComposeType)}
            readOnly
            placeholder="What's happening in the markets?"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, color: '#555555', resize: 'none', minHeight: 48,
              width: '100%', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            }}
            onFocus={e => e.target.blur()}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '0.5px solid var(--border)' }}>
            {composeTypes.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setActiveComposeType(id); openComposer(id); }}
                style={{
                  fontSize: 12, fontWeight: 500, padding: '4px 10px',
                  borderRadius: 4, border: `0.5px solid ${activeComposeType === id ? (isLight ? '#bbf7d0' : '#1d9bf0') : 'var(--border)'}`,
                  color: activeComposeType === id ? (isLight ? '#16a34a' : '#1d9bf0') : 'var(--text-3)',
                  background: activeComposeType === id ? (isLight ? '#f0fdf4' : 'transparent') : 'transparent',
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => openComposer(activeComposeType)}
              style={{
                background: isLight ? '#16a34a' : '#1d9bf0', color: isLight ? '#fff' : '#000', fontWeight: 700,
                fontSize: 14, padding: '6px 18px', borderRadius: 20, border: 'none',
                cursor: 'pointer', marginLeft: 'auto',
              }}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Pending trade card */}
        {pendingVisible && (
          <PendingTradeCard
            trade={pendingTrade}
            onSkip={() => { setPendingVisible(false); dismiss(); }}
            onPublish={() => setShareModalOpen(true)}
            onRemindLater={() => { setPendingVisible(false); remindLater(); }}
          />
        )}

        {/* Feed tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-card)',
          borderBottom: '0.5px solid var(--border)',
          padding: '0 16px',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          {TABS.map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  fontSize: 13,
                  padding: '10px 14px',
                  color: active ? 'var(--text)' : 'var(--text-3)',
                  fontWeight: active ? 500 : 400,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--green)' : '2px solid transparent',
                  borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                  cursor: 'pointer',
                  marginBottom: '-0.5px',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-2)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-3)'; }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Unified posts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '14px 16px 48px' }}>
          {visiblePosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 14 }}>
              No posts to show for this filter.
            </div>
          ) : (
            visiblePosts.map(post => (
              <div key={post.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tab === 'all' && newsMap[post.id] && (
                  <NewsCard item={newsMap[post.id]} />
                )}
                <FeedErrorBoundary>
                  <PostCard post={post} />
                </FeedErrorBoundary>
              </div>
            ))
          )}
        </div>
      </div>

      <ComposerModal key={composerKey} open={composerOpen} initialTab={composerTab} onClose={() => setComposerOpen(false)} />

      {shareModalOpen && (
        <ShareTradeModal
          trade={pendingTrade}
          onClose={() => setShareModalOpen(false)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
