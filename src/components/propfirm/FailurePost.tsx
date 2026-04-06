import React, { useState } from 'react';
import type { CommunityPost } from '../../types/propfirm';
import { firmBadge, Avatar, PostActions, ActionLink } from './MilestonePost';

interface FailurePostProps {
  post: CommunityPost;
  isLiked: boolean;
  onLike: (id: string) => void;
}

export default function FailurePost({ post, isLiked, onLike }: FailurePostProps) {
  const { user, firm, dayNumber, stats, narrative, improvement, createdAt, isVerified } = post;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 12,
        paddingTop: '14px', paddingBottom: '14px', paddingRight: '16px', paddingLeft: '12px',
        borderLeft: '2px solid #ef4444',
        borderBottom: '0.5px solid #1e1e1e',
        background: hovered ? 'var(--surface)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      {/* Avatar */}
      <Avatar initials={user.avatar} color="var(--border)" size={40} />

      {/* Right column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user.name}</span>
          {isVerified && (
            <span style={{
              width: 16, height: 16, borderRadius: '50%', background: '#1d9bf0',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: 2, flexShrink: 0,
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          )}
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>@{user.handle}</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>·</span>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{createdAt}</span>
          {firmBadge(firm)}
          <span style={{
            fontSize: 11, fontWeight: 500, color: '#ef4444',
            padding: '1px 6px', borderRadius: 3,
            background: '#1f0d0d', border: '0.5px solid #3a1a1a',
          }}>
            Failed · Day {dayNumber}
          </span>
        </div>

        {/* Stats grid */}
        <div style={{
          borderRadius: 8, border: '0.5px solid var(--border)',
          background: 'var(--bg)', marginBottom: 12, overflow: 'hidden',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Final P&L', value: `$${stats.pnl.toLocaleString()}` },
              { label: 'Days',      value: String(stats.daysUsed) },
              { label: 'Win rate',  value: `${stats.winRate}%` },
              { label: 'Avg RR',    value: `${stats.avgRR.toFixed(1)}R` },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                padding: '10px 14px',
                borderRight: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--border-emphasis)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Narrative */}
        {narrative && (
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 12px 0' }}>
            {narrative}
          </p>
        )}

        {/* Improvement block */}
        {improvement && (
          <div style={{
            borderRadius: 8, border: '0.5px solid var(--border)',
            background: 'var(--surface)', marginBottom: 12, overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', gap: 12, padding: '10px 14px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: '#ef4444' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--border-emphasis)', textTransform: 'uppercase', marginBottom: 4 }}>
                  What I'll do differently
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  {improvement}
                </div>
              </div>
            </div>
          </div>
        )}

        <PostActions
          likes={post.likes}
          comments={post.comments}
          postId={post.id}
          isLiked={isLiked}
          onLike={onLike}
          extra={<ActionLink label="Full breakdown ↗" />}
        />
      </div>
    </div>
  );
}
