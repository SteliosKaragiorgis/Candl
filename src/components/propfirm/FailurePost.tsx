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
        background: 'var(--bg-card)',
        border: `0.5px solid ${hovered ? 'var(--border-soft)' : 'var(--border)'}`,
        borderLeft: '2px solid var(--red)',
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
        transition: 'border-color 0.1s',
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Avatar */}
        <Avatar initials={user.avatar} color="" size={36} />

        {/* Right column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
            {isVerified && (
              <span style={{
                width: 15, height: 15, borderRadius: '50%', background: '#1d9bf0',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 2, flexShrink: 0,
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{user.handle}</span>
            <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>{createdAt}</span>
            {firmBadge(firm)}
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'var(--red)',
              padding: '2px 7px', borderRadius: 3,
              background: 'var(--red-bg)', border: '0.5px solid var(--red-border)',
            }}>
              Failed · Day {dayNumber}
            </span>
          </div>

          {/* Stats mini grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1,
            background: 'var(--border-soft)',
            borderRadius: 6, overflow: 'hidden',
            marginBottom: 10,
          }}>
            {[
              { label: 'Final P&L', value: `$${stats.pnl.toLocaleString()}` },
              { label: 'Days',      value: String(stats.daysUsed)            },
              { label: 'Win rate',  value: `${stats.winRate}%`               },
              { label: 'Avg RR',    value: `${stats.avgRR.toFixed(1)}R`      },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-surface)', padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Narrative */}
          {narrative && (
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 10px 0' }}>
              {narrative}
            </p>
          )}

          {/* Failure lesson block */}
          {improvement && (
            <div style={{
              borderLeft: '2px solid var(--red-border)',
              paddingLeft: 10,
              marginBottom: 10,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 500, letterSpacing: '0.04em',
                color: 'var(--red)', textTransform: 'uppercase', marginBottom: 4,
              }}>
                What I'll do differently
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                {improvement}
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
    </div>
  );
}
