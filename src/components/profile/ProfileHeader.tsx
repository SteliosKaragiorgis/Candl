import { useState } from 'react';
import type { User } from '../../types';
import { currentUser } from '../../data/demo';
import { useMobile } from '../../hooks/useMobile';
import EditProfileModal from './EditProfileModal';

function VerifiedBadge() {
  return (
    <div title="Verified trader" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 16, height: 16, borderRadius: '50%',
      background: '#0d1f12', border: '0.5px solid #1a3a22', flexShrink: 0,
    }}>
      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2,6 5,9 10,3"/>
      </svg>
    </div>
  );
}

function ShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/profile/${username}`;
    if (navigator.share) {
      try { await navigator.share({ title: `@${username} on Candl.`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleShare}
        style={{
          width: 30, height: 30, borderRadius: 4, border: '0.5px solid var(--border)',
          background: copied ? '#0d1f12' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: copied ? '#22c55e' : 'var(--border-emphasis)',
          flexShrink: 0, transition: 'all 0.15s',
        }}
        title="Share profile"
      >
        {copied ? (
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="2,6 5,9 10,3"/>
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        )}
      </button>
      {copied && (
        <div style={{
          position: 'absolute', bottom: 38, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', color: 'var(--text-2)', fontSize: 10, fontWeight: 500,
          padding: '4px 8px', borderRadius: 4, whiteSpace: 'nowrap', pointerEvents: 'none',
          border: '0.5px solid var(--border)',
        }}>
          Link copied!
        </div>
      )}
    </div>
  );
}

const ACHIEVEMENTS: {
  label: string; desc: string; meta: string; color: string; unlocked: boolean;
  icon: React.ReactNode;
}[] = [
  {
    label: 'Top Trader', desc: 'Ranked in the top 10%', meta: 'This month',
    color: '#f59e0b', unlocked: true,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
  },
  {
    label: '7-Day Streak', desc: 'Posted 7 days in a row', meta: 'Best: 12 days',
    color: '#ef4444', unlocked: true,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  },
  {
    label: 'Win Rate 60%+', desc: '15 closed trades', meta: '64% win rate',
    color: '#10b981', unlocked: true,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  },
  {
    label: '100 Followers', desc: 'Community milestone', meta: '142 followers',
    color: '#8b5cf6', unlocked: true,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    label: 'First Pin', desc: 'Pin a post to your profile', meta: 'Not unlocked',
    color: '#6b7280', unlocked: false,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>,
  },
  {
    label: 'Verified Link', desc: 'Connect your brokerage', meta: 'Not unlocked',
    color: '#6b7280', unlocked: false,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  },
];

function AchievementCard({ a }: { a: typeof ACHIEVEMENTS[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: a.unlocked ? 'var(--surface)' : 'var(--bg)',
        border: `0.5px solid ${a.unlocked && hovered ? a.color + '44' : 'var(--border)'}`,
        borderRadius: 4, padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 6,
        opacity: a.unlocked ? 1 : 0.4,
        transition: 'border-color 0.15s',
        cursor: 'default',
        overflow: 'hidden',
      }}
    >
      {/* Subtle color glow top bar when unlocked */}
      {a.unlocked && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: a.color, borderRadius: '10px 10px 0 0' }} />
      )}
      {/* Icon circle */}
      <div style={{
        width: 28, height: 28, borderRadius: 4,
        background: a.unlocked ? a.color + '15' : 'var(--surface)',
        border: `0.5px solid ${a.unlocked ? a.color + '33' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: a.unlocked ? a.color : 'var(--border-emphasis)',
      }}>
        {a.unlocked ? a.icon : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        )}
      </div>
      {/* Text */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: a.unlocked ? 'var(--text-2)' : 'var(--border-emphasis)', lineHeight: 1.2, marginBottom: 2 }}>
          {a.label}
        </div>
        <div style={{ fontSize: 9, color: 'var(--border-emphasis)', lineHeight: 1.3 }}>
          {a.meta}
        </div>
      </div>
    </div>
  );
}

const FAV_TICKERS = [
  { t: 'NVDA', p: 882.60, c: 3.17 },
  { t: 'AAPL', p: 211.45, c: 0.59 },
  { t: 'SPY',  p: 512.50, c: -0.40 },
  { t: 'AMD',  p: 162.50, c: 1.88 },
  { t: 'TSLA', p: 172.00, c: -4.16 },
];

function RightPanelContent() {
  return (
    <>
      {/* Achievements */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--border-emphasis)', textTransform: 'uppercase' }}>Achievements</span>
          <span style={{ fontSize: 10, color: 'var(--border-emphasis)' }}>{ACHIEVEMENTS.filter(a => a.unlocked).length}/{ACHIEVEMENTS.length} unlocked</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {ACHIEVEMENTS.map(a => <AchievementCard key={a.label} a={a} />)}
        </div>
      </div>

      {/* Favorite tickers */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--border-emphasis)', textTransform: 'uppercase', marginBottom: 10 }}>
          Favorite Tickers
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FAV_TICKERS.map(({ t, p, c }) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{t}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>${p.toFixed(2)}</span>
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  color: c >= 0 ? '#22c55e' : '#ef4444',
                  background: c >= 0 ? '#0d1f12' : '#1f0d0d',
                  border: `0.5px solid ${c >= 0 ? '#1a3a22' : '#3a1a1a'}`,
                  borderRadius: 3, padding: '1px 5px',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {c >= 0 ? '+' : ''}{c.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ActivityBadge({ userId }: { userId: string }) {
  const active = userId === 'u0' || userId === 'u1' || userId === 'u2';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: active ? '#22c55e' : 'var(--border-emphasis)',
      }} />
      <span style={{ fontSize: 11, color: active ? '#22c55e' : 'var(--border-emphasis)' }}>
        {active ? 'Active today' : 'Last active 3d ago'}
      </span>
    </div>
  );
}

function CompletenessCard({ user, postsCount }: { user: User; postsCount: number }) {
  const checks = [
    { label: 'Add a profile photo',   done: true },
    { label: 'Write your bio',        done: user.bio.length > 10 },
    { label: 'Set sector exposure',   done: true },
    { label: 'Make your first post',  done: postsCount > 0 },
    { label: 'Follow 5 traders',      done: user.followingCount >= 5 },
  ];
  const pct = Math.round((checks.filter(c => c.done).length / checks.length) * 100);

  return (
    <div style={{
      background: 'var(--bg)', border: '0.5px solid var(--border)',
      borderRadius: 4, padding: '12px 14px', marginTop: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Complete your profile</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#22c55e', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      </div>
      <div style={{ height: 2, background: 'var(--border)', marginBottom: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#22c55e', transition: 'width 0.4s' }} />
      </div>
      {checks.map(({ label, done }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0' }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
            background: done ? '#0d1f12' : 'transparent',
            border: `0.5px solid ${done ? '#1a3a22' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {done && (
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                <polyline points="2,6 5,9 10,3"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: 11, color: done ? 'var(--border-emphasis)' : 'var(--text-3)', textDecoration: done ? 'line-through' : 'none' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ProfileHeader({ user, postsCount, following, onFollowChange, followBack = false }: {
  user: User;
  postsCount: number;
  following: boolean;
  onFollowChange: (v: boolean) => void;
  followBack?: boolean;
}) {
  const isOwn = user.id === currentUser.id;
  const [hovered, setHovered] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const isMobile = useMobile();

  const tags = user.mostActive.split(' · ');

  const isPrivate = user.isPrivate ?? false;

  const followLabel = following
    ? (isPrivate ? (hovered ? 'Cancel request' : 'Request sent') : (hovered ? 'Unfollow' : 'Following'))
    : followBack ? 'Follow back'
    : (isPrivate ? 'Request to follow' : 'Follow');
  const followBg = following
    ? (hovered ? '#1f0d0d' : '#0d1a27')
    : 'transparent';
  const followColor = following
    ? (hovered ? '#ef4444' : '#1d9bf0')
    : 'var(--text-2)';
  const followBorder = following
    ? (hovered ? '#3a1a1a' : '#1a3a5c')
    : 'var(--border)';

  if (isMobile) {
    return (
      <>
        <div style={{ background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', paddingBottom: 20 }}>

          <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--border)', border: '0.5px solid var(--border-emphasis)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', fontSize: 20, fontWeight: 500, marginBottom: 10,
            }}>
              {user.initials}
            </div>

            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{user.name}</span>
              {user.verified && <VerifiedBadge />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--border-emphasis)' }}>@{user.username}</span>
              <span style={{ color: 'var(--border-emphasis)' }}>·</span>
              <ActivityBadge userId={user.id} />
            </div>

            {/* Bio */}
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, textAlign: 'center', margin: '0 0 12px', maxWidth: 280 }}>
              {user.bio}
            </p>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center', marginBottom: 14 }}>
              {tags.map((tag, i) => (
                <span key={tag} style={{
                  fontSize: 11, fontWeight: 500, padding: '2px 10px', borderRadius: 3,
                  border: `0.5px solid ${i < 2 ? '#1a3a22' : 'var(--border)'}`,
                  color: i < 2 ? '#22c55e' : 'var(--text-3)',
                  background: 'transparent',
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 0, width: '100%', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)', marginBottom: 12 }}>
              {[
                { label: 'Followers', value: user.followersCount.toLocaleString() },
                { label: 'Following', value: user.followingCount.toLocaleString() },
                { label: 'Posts',     value: String(postsCount) },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{
                  flex: 1, padding: '10px 0', textAlign: 'center',
                  borderRight: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                  <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--border-emphasis)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Follow + Share */}
            <div style={{ display: 'flex', gap: 6, width: '100%' }}>
              {isOwn ? (
                <button
                  onClick={() => setEditOpen(true)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 4,
                    border: '0.5px solid var(--border)', background: 'transparent',
                    fontSize: 12, fontWeight: 500, color: 'var(--text-2)',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => onFollowChange(!following)}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 4,
                    border: `0.5px solid ${followBorder}`, background: followBg,
                    fontSize: 12, fontWeight: 500, color: followColor,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                  }}
                >
                  {followLabel}
                </button>
              )}
              <ShareButton username={user.username} />
            </div>

            {/* Completeness (own) or Sector Donut (others) */}
            {isOwn ? (
              <div style={{ width: '100%' }}>
                <CompletenessCard user={user} postsCount={postsCount} />
              </div>
            ) : (
              <div style={{ width: '100%', marginTop: 16 }}>
                <RightPanelContent />
              </div>
            )}
          </div>
        </div>

        {editOpen && <EditProfileModal user={user} onClose={() => setEditOpen(false)} />}
      </>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────────
  return (
    <>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 8, overflow: 'hidden', marginBottom: 14,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr' }}>
          {/* Left */}
          <div style={{
            padding: '20px 20px 24px',
            borderRight: '0.5px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--border)', border: '0.5px solid var(--border-emphasis)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', fontSize: 14, fontWeight: 500,
            }}>
              {user.initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{user.name}</span>
                {user.verified && <VerifiedBadge />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: 'var(--border-emphasis)' }}>@{user.username}</span>
                <ActivityBadge userId={user.id} />
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>{user.bio}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {tags.map((tag, i) => (
                <span key={tag} style={{
                  fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 3,
                  border: `0.5px solid ${i < 2 ? '#1a3a22' : 'var(--border)'}`,
                  color: i < 2 ? '#22c55e' : 'var(--text-3)',
                  background: 'transparent',
                }}>
                  {tag}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              {isOwn ? (
                <button
                  onClick={() => setEditOpen(true)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 4,
                    border: '0.5px solid var(--border)', background: 'transparent',
                    fontSize: 12, fontWeight: 500, color: 'var(--text-2)',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => onFollowChange(!following)}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 4,
                    border: `0.5px solid ${followBorder}`, background: followBg,
                    fontSize: 12, fontWeight: 500, color: followColor,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                  }}
                >
                  {followLabel}
                </button>
              )}
              <ShareButton username={user.username} />
            </div>

            {isOwn && <CompletenessCard user={user} postsCount={postsCount} />}
          </div>

          {/* Right */}
          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--border-emphasis)', textTransform: 'uppercase', marginBottom: 14 }}>
              Community
            </div>
            <div style={{ display: 'flex', gap: 28, marginBottom: 20 }}>
              {[
                { label: 'Followers', value: user.followersCount.toLocaleString() },
                { label: 'Following', value: user.followingCount.toLocaleString() },
                { label: 'Posts',     value: String(postsCount) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: 'var(--border-emphasis)', textTransform: 'uppercase', marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
              <RightPanelContent />
            </div>
          </div>
        </div>
      </div>

      {editOpen && <EditProfileModal user={user} onClose={() => setEditOpen(false)} />}
    </>
  );
}
