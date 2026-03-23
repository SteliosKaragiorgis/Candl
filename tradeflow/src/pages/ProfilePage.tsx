import { useParams, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { DEMO_USERS, DEMO_POSTS } from '../data/demo';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs, { type Tab } from '../components/profile/ProfileTabs';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import TradeCard from '../components/feed/TradeCard';
import InvestCard from '../components/feed/InvestCard';
import CommentaryCard from '../components/feed/CommentaryCard';
import type { Post, User } from '../types';

function findUser(id: string): User | undefined {
  return Object.values(DEMO_USERS).find(u => u.id === id);
}

function PostCard({ post }: { post: Post }) {
  if (post.postType === 'trade') return <TradeCard post={post} />;
  if (post.postType === 'investment') return <InvestCard post={post} />;
  return <CommentaryCard post={post} />;
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [tab, setTab] = useState<Tab>('posts');

  const user = findUser(userId ?? '');
  if (!user) return <Navigate to="/" replace />;

  const userPosts = DEMO_POSTS.filter(p => p.user.id === user.id);
  const filtered = tab === 'posts' ? userPosts
    : tab === 'trades' ? userPosts.filter(p => p.postType === 'trade')
    : tab === 'investments' ? userPosts.filter(p => p.postType === 'investment')
    : tab === 'commentary' ? userPosts.filter(p => p.postType === 'commentary')
    : [];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '16px', alignItems: 'start' }}>
        <div>
          <ProfileHeader user={user} />
          <ProfileTabs active={tab} onChange={setTab}>
            {filtered.length > 0 ? (
              filtered.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div style={{
                textAlign: 'center', padding: '40px 0',
                color: 'var(--text-3)', fontSize: '13px',
              }}>
                No posts in this category yet.
              </div>
            )}
          </ProfileTabs>
        </div>
        <div style={{ position: 'sticky', top: '20px' }}>
          <ProfileSidebar user={user} />
        </div>
      </div>
    </div>
  );
}
