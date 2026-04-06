import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import MarketsPanel from '../components/feed/MarketsPanel';
import ComposerModal from '../components/feed/ComposerModal';
import TradeCard from '../components/feed/TradeCard';
import InvestCard from '../components/feed/InvestCard';
import CommentaryCard from '../components/feed/CommentaryCard';
import SocialCard from '../components/feed/SocialCard';
import SkeletonCard from '../components/feed/SkeletonCard';
import NewsCard from '../components/feed/NewsCard';
import TradeDetectedToast from '../components/feed/TradeDetectedToast';
import PendingTradeCard from '../components/feed/PendingTradeCard';
import ShareTradeModal from '../components/feed/ShareTradeModal';
import { DEMO_POSTS, NEWS_ITEMS, currentUser } from '../data/demo';
import type { Post } from '../types';
import { useMobile } from '../hooks/useMobile';
import { usePendingTrade } from '../hooks/usePendingTrade';
import type { PendingTrade } from '../hooks/usePendingTrade';
import type { ShareTradeFormData } from '../components/feed/ShareTradeModal';

type FeedTab = 'all' | 'trades' | 'investments' | 'commentary';

const TABS: { id: FeedTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'trades', label: 'Trades' },
  { id: 'investments', label: 'Investments' },
  { id: 'commentary', label: 'Commentary' },
];

function filterPosts(posts: Post[], tab: FeedTab): Post[] {
  if (tab === 'all') return posts;
  if (tab === 'trades') return posts.filter(p => p.postType === 'trade');
  if (tab === 'investments') return posts.filter(p => p.postType === 'investment');
  return posts.filter(p => p.postType === 'commentary' || p.postType === 'social');
}

function PostCard({ post }: { post: Post }) {
  if (post.postType === 'trade') return <TradeCard post={post} />;
  if (post.postType === 'investment') return <InvestCard post={post} />;
  if (post.postType === 'social') return <SocialCard post={post} />;
  return <CommentaryCard post={post} />;
}

interface PublishedMT5Post {
  id: string;
  trade: PendingTrade;
  narrative: string;
  emotions: string[];
  lesson: string;
  publishedAt: Date;
}

function PublishedMT5Card({ post }: { post: PublishedMT5Post }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [likeHov, setLikeHov] = useState(false);
  const [commentHov, setCommentHov] = useState(false);
  const pnlStr = post.trade.net_profit >= 0
    ? `+$${post.trade.net_profit.toFixed(2)}`
    : `-$${Math.abs(post.trade.net_profit).toFixed(2)}`;
  const primaryEmotion = post.emotions[0];
  const isLong = true;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 12, padding: '12px 16px',
        borderBottom: '0.5px solid var(--border)',
        background: hovered ? 'var(--surface)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: 'var(--surface2)', border: '0.5px solid var(--border-emphasis)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-3)', fontSize: 13, fontWeight: 500,
      }}>
        {currentUser.initials}
      </div>

      {/* Right column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{currentUser.name}</span>
          <span style={{ fontSize: 15, color: 'var(--text-3)' }}>@{currentUser.username}</span>
          <span style={{ fontSize: 15, color: 'var(--text-3)' }}>·</span>
          <span style={{ fontSize: 15, color: 'var(--text-3)' }}>just now</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1d9bf0', padding: '1px 8px', borderRadius: 4, background: 'var(--blue-bg)', border: '0.5px solid var(--blue-border)', marginLeft: 6 }}>
            MT5
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', padding: '1px 8px', borderRadius: 4, background: 'var(--green-bg)', border: '0.5px solid var(--green-border)', marginLeft: 2 }}>
            Tradezella
          </span>
          {primaryEmotion && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', padding: '1px 8px', borderRadius: 4, background: 'var(--surface2)', border: '0.5px solid var(--border-emphasis)', marginLeft: 2 }}>
              {primaryEmotion}
            </span>
          )}
        </div>

        {/* Narrative */}
        {post.narrative && (
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 12px 0' }}>
            {post.narrative}
          </p>
        )}

        {/* Trade block */}
        <div style={{ borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg)', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '0.5px solid var(--border)' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {post.trade.symbol}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: isLong ? 'var(--green-bg)' : 'var(--red-bg)',
              color: isLong ? '#22c55e' : '#ef4444',
            }}>
              LONG
            </span>
            <span style={{
              fontSize: 14, fontWeight: 600, marginLeft: 'auto',
              color: post.trade.net_profit >= 0 ? '#22c55e' : '#ef4444',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {pnlStr}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Entry',    value: post.trade.entry_price.toFixed(4) },
              { label: 'Exit',     value: post.trade.exit_price.toFixed(4) },
              { label: 'R Mult',   value: `${post.trade.r_multiple}R` },
              { label: 'Duration', value: post.trade.duration_formatted },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{
                padding: '10px 14px',
                borderRight: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none',
                borderTop: '0.5px solid var(--border)',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#d4d4d4', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                <div style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lesson */}
        {post.lesson && (
          <div style={{ borderLeft: '2px solid var(--border-emphasis)', paddingLeft: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: '#555555', textTransform: 'uppercase', marginBottom: 4 }}>LESSON</div>
            <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: '#c8c8c8', lineHeight: 1.6 }}>{post.lesson}</p>
          </div>
        )}

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 4 }}>
          <button
            onMouseEnter={() => setCommentHov(true)}
            onMouseLeave={() => setCommentHov(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: commentHov ? 'var(--text-2)' : 'var(--text-3)', padding: 4, borderRadius: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span style={{ fontSize: 13 }}>0</span>
          </button>
          <button
            onClick={() => { const next = !liked; setLiked(next); setLikeCount(c => next ? c + 1 : c - 1); }}
            onMouseEnter={() => setLikeHov(true)}
            onMouseLeave={() => setLikeHov(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: liked || likeHov ? '#f91880' : 'var(--text-3)', padding: 4, borderRadius: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#f91880' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ fontSize: 13 }}>{likeCount}</span>
          </button>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '0.5px solid var(--border)', cursor: 'pointer', color: 'var(--text-3)', padding: '4px 14px', borderRadius: 4, fontSize: 13 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1d9bf0'; (e.currentTarget as HTMLElement).style.color = '#1d9bf0'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
          >
            View case study →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const isMobile = useMobile();
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

  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(true);
  const [pendingVisible, setPendingVisible] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [publishedPosts, setPublishedPosts] = useState<PublishedMT5Post[]>([]);

  const { pendingTrade, dismiss, remindLater } = usePendingTrade();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const posts = filterPosts(DEMO_POSTS, tab);
  const newsMap = Object.fromEntries(NEWS_ITEMS.map(n => [n.relatedPostId, n]));

  const showTradeDetected = toastVisible && pendingVisible;

  function handlePublish(data: ShareTradeFormData) {
    const newPost: PublishedMT5Post = {
      id: `mt5-${Date.now()}`,
      trade: pendingTrade,
      narrative: data.narrative,
      emotions: data.emotions,
      lesson: data.lesson,
      publishedAt: new Date(),
    };
    setPublishedPosts(prev => [newPost, ...prev]);
    setShareModalOpen(false);
    setToastVisible(false);
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
      <MarketsPanel />

      {/* Feed container */}
      <div style={{
        minHeight: '100%',
      }}>
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

        {/* Trade detected toast */}
        {showTradeDetected && (
          <div style={{ padding: '0 16px' }}>
            <TradeDetectedToast
              trade={pendingTrade}
              onAddStory={() => setShareModalOpen(true)}
              onDismiss={() => { setToastVisible(false); dismiss(); }}
            />
          </div>
        )}

        {/* Feed tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)' }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, fontSize: 14, fontWeight: tab === id ? 500 : 400,
                padding: '16px 0', textAlign: 'center',
                color: tab === id ? 'var(--text)' : 'var(--text-3)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: tab === id ? `2px solid ${isLight ? '#16a34a' : '#1d9bf0'}` : '2px solid transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Pending trade card */}
        {pendingVisible && (
          <PendingTradeCard
            trade={pendingTrade}
            onSkip={() => { setPendingVisible(false); dismiss(); }}
            onPublish={() => setShareModalOpen(true)}
            onRemind={() => { setPendingVisible(false); remindLater(); }}
          />
        )}

        {/* Published MT5 posts */}
        {publishedPosts.map(post => (
          <PublishedMT5Card key={post.id} post={post} />
        ))}

        {/* Posts with interleaved news cards */}
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          posts.map(post => (
            <div key={post.id}>
              {tab === 'all' && newsMap[post.id] && (
                <NewsCard item={newsMap[post.id]} />
              )}
              <PostCard post={post} />
            </div>
          ))
        )}
      </div>

      <ComposerModal key={composerKey} open={composerOpen} initialTab={composerTab} onClose={() => setComposerOpen(false)} />

      {/* Share trade modal */}
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
