import { useParams, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { DEMO_USERS, DEMO_POSTS } from '../data/demo';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs, { type Tab } from '../components/profile/ProfileTabs';
import TradeCard from '../components/feed/TradeCard';
import InvestCard from '../components/feed/InvestCard';
import CommentaryCard from '../components/feed/CommentaryCard';
import SocialCard from '../components/feed/SocialCard';
import type { Post, User } from '../types';

function findUser(id: string): User | undefined {
  return Object.values(DEMO_USERS).find(u => u.id === id);
}

function PostCard({ post }: { post: Post }) {
  if (post.postType === 'trade') return <TradeCard post={post} />;
  if (post.postType === 'investment') return <InvestCard post={post} />;
  if (post.postType === 'social') return <SocialCard post={post} />;
  return <CommentaryCard post={post} />;
}

function PinnedPost({ post }: { post: Post }) {
  const ticker = post.postType === 'trade' ? post.ticker
    : post.postType === 'investment' ? post.ticker
    : post.postType === 'commentary' ? post.ticker
    : undefined;

  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 8, overflow: 'hidden', marginBottom: 10,
    }}>
      <div style={{ padding: '10px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-3)' }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pinned</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 8px' }}>{post.body}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {ticker && (
            <span style={{
              fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
              padding: '1px 6px', borderRadius: 3,
              background: 'var(--bg)', color: 'var(--text-2)', border: '0.5px solid var(--border)',
            }}>
              ${ticker}
            </span>
          )}
          <span style={{ fontSize: 10, color: 'var(--text-4)' }}>
            Pinned · {post.createdAt}
          </span>
        </div>
      </div>
    </div>
  );
}

function PrivateProfile({ following, onFollowChange }: {
  following: boolean;
  onFollowChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 8, padding: '48px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 14px', color: 'var(--text-4)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
        This account is private
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto 18px' }}>
        Send a follow request to see their trades, investments and commentary.
      </div>
      <button
        onClick={() => onFollowChange(!following)}
        style={{
          padding: '7px 22px', borderRadius: 4,
          border: `0.5px solid ${following ? 'var(--blue-border)' : 'var(--border)'}`,
          background: following ? 'var(--blue-bg)' : 'transparent',
          fontSize: 12, fontWeight: 500,
          color: following ? '#1d9bf0' : 'var(--text-2)',
          cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
        }}
      >
        {following ? 'Request sent' : 'Request to follow'}
      </button>
    </div>
  );
}

function FollowRequestBanner({ user, onAccept, onDecline }: {
  user: User;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--blue-border)',
      borderRadius: 8, padding: '12px 14px', marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: 'var(--border)', border: '0.5px solid var(--border-emphasis)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-3)', fontSize: 10, fontWeight: 500,
      }}>
        {user.initials}
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{user.name}</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}> has requested to follow you</span>
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={onAccept}
          style={{
            padding: '5px 14px', borderRadius: 4, border: '0.5px solid var(--green-border)',
            background: 'var(--green-bg)', fontSize: 11, fontWeight: 500,
            color: '#22c55e', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          style={{
            padding: '5px 14px', borderRadius: 4, border: '0.5px solid var(--border)',
            background: 'transparent', fontSize: 11, fontWeight: 500,
            color: 'var(--text-4)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function EmptyState({ user, following, onFollowChange, followBack }: {
  user: User;
  following: boolean;
  onFollowChange: (v: boolean) => void;
  followBack: boolean;
}) {
  const label = following ? 'Following' : followBack ? 'Follow back' : `Follow ${user.name.split(' ')[0]}`;
  return (
    <div style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 8, padding: '48px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px', color: 'var(--text-4)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>No posts yet</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 240, margin: '0 auto 18px' }}>
        {user.name.split(' ')[0]} hasn't posted anything. Follow them to get notified when they do.
      </div>
      <button
        onClick={() => onFollowChange(!following)}
        style={{
          padding: '7px 22px', borderRadius: 4,
          border: `0.5px solid ${following ? 'var(--blue-border)' : 'var(--border)'}`,
          background: following ? 'var(--blue-bg)' : 'transparent',
          fontSize: 12, fontWeight: 500,
          color: following ? '#1d9bf0' : 'var(--text-2)',
          cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
        }}
      >
        {label}
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [tab, setTab] = useState<Tab>('posts');
  const [following, setFollowing] = useState(false);
  const [requestAccepted, setRequestAccepted] = useState(false);
  const [requestDismissed, setRequestDismissed] = useState(false);

  const user = findUser(userId ?? '');
  if (!user) return <Navigate to="/" replace />;

  const userPosts = DEMO_POSTS.filter(p => p.user.id === user.id);
  const postsCount = userPosts.length;

  const filtered = tab === 'posts' ? userPosts
    : tab === 'investments' ? userPosts.filter(p => p.postType === 'investment')
    : userPosts.filter(p => p.postType === 'commentary');

  const pinnedPost = tab === 'posts' && userPosts.length > 0 ? userPosts[0] : null;
  const feedPosts = tab === 'posts' && pinnedPost ? filtered.slice(1) : filtered;

  const showRequestBanner = !!user.hasSentFollowRequest && !requestDismissed;

  return (
    <div>
      {showRequestBanner && (
        <FollowRequestBanner
          user={user}
          onAccept={() => { setRequestAccepted(true); setRequestDismissed(true); }}
          onDecline={() => setRequestDismissed(true)}
        />
      )}
      <ProfileHeader
        user={user}
        postsCount={postsCount}
        following={following}
        onFollowChange={setFollowing}
        followBack={requestAccepted && !following}
      />
      {user.isPrivate ? (
        <PrivateProfile following={following} onFollowChange={setFollowing} />
      ) : (
        <ProfileTabs active={tab} onChange={setTab}>
          {pinnedPost && <PinnedPost post={pinnedPost} />}
          {feedPosts.length > 0 ? (
            feedPosts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            !pinnedPost && <EmptyState user={user} following={following} onFollowChange={setFollowing} followBack={requestAccepted && !following} />
          )}
        </ProfileTabs>
      )}
    </div>
  );
}
