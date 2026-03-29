import { useState, useEffect } from 'react';
import MarketsPanel from '../components/feed/MarketsPanel';
import ComposeBox from '../components/feed/ComposeBox';
import ComposerModal from '../components/feed/ComposerModal';
import TradeCard from '../components/feed/TradeCard';
import InvestCard from '../components/feed/InvestCard';
import CommentaryCard from '../components/feed/CommentaryCard';
import SocialCard from '../components/feed/SocialCard';
import SkeletonCard from '../components/feed/SkeletonCard';
import NewsCard from '../components/feed/NewsCard';
import { DEMO_POSTS, NEWS_ITEMS, currentUser } from '../data/demo';
import type { Post } from '../types';
import { useMobile } from '../hooks/useMobile';

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

export default function FeedPage() {
  const isMobile = useMobile();
  const [tab, setTab] = useState<FeedTab>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKey, setComposerKey] = useState(0);
  const [composerTab, setComposerTab] = useState<'post' | 'trade' | 'invest' | 'commentary'>('post');

  function openComposer(tab: 'post' | 'trade' | 'invest' | 'commentary' = 'post') {
    setComposerTab(tab);
    setComposerOpen(true);
    setComposerKey(k => k + 1);
  }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const posts = filterPosts(DEMO_POSTS, tab);

  // Build a map of postId → NewsItem for quick lookup
  const newsMap = Object.fromEntries(NEWS_ITEMS.map(n => [n.relatedPostId, n]));

  return (
    <div style={{ padding: isMobile ? '12px 10px 0' : undefined, background: 'var(--bg)', minHeight: '100%' }}>
      <MarketsPanel />

      {/* Compose box — simplified on mobile */}
      {isMobile ? (
        <div
          onClick={() => openComposer()}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '10px 12px', marginBottom: 12,
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${currentUser.avatarGradient[0]}, ${currentUser.avatarGradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 10, fontWeight: 700,
          }}>
            {currentUser.initials}
          </div>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text4)' }}>
            Share a trade or idea…
          </span>
          <button
            onClick={e => { e.stopPropagation(); openComposer(); }}
            style={{
              background: 'var(--blue)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '6px 14px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Post
          </button>
        </div>
      ) : (
        <ComposeBox onOpen={t => openComposer(t === 'investment' ? 'invest' : t as 'post' | 'trade' | 'invest' | 'commentary')} />
      )}

      {/* Feed tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        marginBottom: '14px',
      }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`feed-tab ${tab === id ? 'feed-tab-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

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

      <ComposerModal key={composerKey} open={composerOpen} initialTab={composerTab} onClose={() => setComposerOpen(false)} />
    </div>
  );
}
