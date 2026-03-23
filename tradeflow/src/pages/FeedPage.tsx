import { useState, useEffect } from 'react';
import StatBar from '../components/feed/StatBar';
import ComposeBox from '../components/feed/ComposeBox';
import TradeCard from '../components/feed/TradeCard';
import InvestCard from '../components/feed/InvestCard';
import CommentaryCard from '../components/feed/CommentaryCard';
import SkeletonCard from '../components/feed/SkeletonCard';
import { DEMO_POSTS, currentUser } from '../data/demo';
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
  return posts.filter(p => p.postType === 'commentary');
}

function PostCard({ post }: { post: Post }) {
  if (post.postType === 'trade') return <TradeCard post={post} />;
  if (post.postType === 'investment') return <InvestCard post={post} />;
  return <CommentaryCard post={post} />;
}

export default function FeedPage() {
  const isMobile = useMobile();
  const [tab, setTab] = useState<FeedTab>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const posts = filterPosts(DEMO_POSTS, tab);

  return (
    <div style={{ maxWidth: '740px', margin: '0 auto', padding: isMobile ? '12px 10px 0' : undefined, background: 'var(--bg)', minHeight: '100%' }}>
      <StatBar />

      {/* Compose box — simplified on mobile */}
      {isMobile ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '10px 12px', marginBottom: 12,
        }}>
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
          <button style={{
            background: 'var(--blue)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '6px 14px',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>
            Post
          </button>
        </div>
      ) : (
        <ComposeBox />
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

      {/* Posts */}
      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : (
        posts.map(post => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
