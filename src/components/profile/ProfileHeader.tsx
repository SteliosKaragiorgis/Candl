import { useState } from 'react';
import type { User } from '../../types';
import { currentUser } from '../../data/demo';
import { useMobile } from '../../hooks/useMobile';

export default function ProfileHeader({ user }: { user: User }) {
  const isOwn = user.id === currentUser.id;
  const [following, setFollowing] = useState(false);
  const isMobile = useMobile();

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: isMobile ? 0 : 'var(--radius-lg)',
      marginBottom: '14px', overflow: 'hidden',
    }}>
      {/* Cover — dark on mobile, gradient on desktop */}
      <div style={{
        height: isMobile ? '80px' : '100px',
        position: 'relative',
        background: isMobile
          ? '#0a0a0a'
          : (user.coverColor
            ? `linear-gradient(135deg, ${user.coverColor}, ${user.avatarGradient[0]})`
            : `linear-gradient(135deg, ${user.avatarGradient[0]}, ${user.avatarGradient[1]})`),
      }}>
        {isMobile && (
          <>
            {/* Dot pattern overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }} />
            {/* Blue accent line at bottom */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '2px', background: 'var(--blue)',
            }} />
          </>
        )}
      </div>

      {/* Info row */}
      <div style={{ padding: isMobile ? '0 16px 16px' : '0 20px 18px', position: 'relative' }}>
        {/* Avatar */}
        <div style={{
          width: isMobile ? '54px' : '64px',
          height: isMobile ? '54px' : '64px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${user.avatarGradient[0]}, ${user.avatarGradient[1]})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: isMobile ? '18px' : '22px', fontWeight: 800,
          border: '3px solid var(--surface)',
          position: 'absolute', top: isMobile ? '-27px' : '-32px',
        }}>
          {user.initials}
        </div>

        {/* Action button top right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
          {isOwn ? (
            <button style={{
              fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
              color: 'var(--text)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '5px 14px', background: 'transparent',
            }}>
              Edit Profile
            </button>
          ) : (
            <button
              className={`follow-btn ${following ? 'follow-btn-active' : ''}`}
              style={{ fontSize: '11px', padding: '5px 16px' }}
              onClick={() => setFollowing(f => !f)}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Name + bio */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>{user.name}</span>
            {user.verified && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--blue)">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '8px' }}>
            @{user.username}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: '12px' }}>
            {user.bio}
          </div>

          {/* Follow counts */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { label: 'Followers', value: user.followersCount.toLocaleString() },
              { label: 'Following', value: user.followingCount.toLocaleString() },
              { label: 'Posts', value: String(user.tradesCount + (user.investmentsCount ?? 0)) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {value}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text4)', marginTop: '8px' }}>
            {user.mostActive}
          </div>
        </div>
      </div>
    </div>
  );
}
