import React, { useState } from 'react';
import type { CommunityPost, Rule } from '../../types/propfirm';
import { firmBadge, phaseBadge, Avatar, PostActions, LessonBlock } from './MilestonePost';

function barColor(used: number, limit: number): string {
  const pct = limit > 0 ? used / limit : 0;
  if (pct >= 0.8) return '#ef4444';
  if (pct >= 0.6) return '#f59e0b';
  return '#22c55e';
}

function RuleBar({ rule }: { rule: Rule }) {
  const pct = rule.limit > 0 ? Math.min(rule.used / rule.limit, 1) : 0;
  const color = barColor(rule.used, rule.limit);

  const formatVal = (v: number, type: Rule['type']) => {
    if (type === 'min_trading_days') return `${v}d`;
    if (type === 'news_trading' || type === 'weekend_holding') return v ? 'Yes' : 'No';
    return `$${v.toLocaleString()}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ width: 100, fontSize: 12, color: 'var(--text-3)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {rule.name}
      </div>
      <div style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, textAlign: 'right', minWidth: 40 }}>
        {formatVal(rule.used, rule.type)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--border-emphasis)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
        / {formatVal(rule.limit, rule.type)}
      </div>
    </div>
  );
}

interface ProgressPostProps {
  post: CommunityPost;
  isLiked: boolean;
  onLike: (id: string) => void;
  isFollowing: boolean;
  onFollow: (id: string) => void;
}

export default function ProgressPost({ post, isLiked, onLike, isFollowing, onFollow }: ProgressPostProps) {
  const { user, firm, phase, dayNumber, rules, narrative, lesson, createdAt, isVerified } = post;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 12,
        paddingTop: '14px', paddingBottom: '14px', paddingRight: '16px', paddingLeft: '12px',
        borderLeft: '2px solid #8b5cf6',
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
          {phaseBadge(phase)}
          <span style={{
            fontSize: 11, fontWeight: 500, color: 'var(--text-3)',
            padding: '1px 6px', borderRadius: 3,
            background: 'var(--surface)', border: '0.5px solid var(--border)',
          }}>
            Day {dayNumber}
          </span>
        </div>

        {/* Narrative */}
        {narrative && (
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 12px 0' }}>
            {narrative}
          </p>
        )}

        {/* Rule bars embedded card */}
        {rules && rules.length > 0 && (
          <div style={{
            borderRadius: 8, border: '0.5px solid var(--border)',
            background: 'var(--surface)', marginBottom: 12, overflow: 'hidden',
          }}>
            {rules.map((r, i) => (
              <div key={r.type} style={{ borderBottom: i < rules.length - 1 ? 'none' : undefined }}>
                <RuleBar rule={r} />
              </div>
            ))}
          </div>
        )}

        {lesson && <LessonBlock text={lesson} />}

        <PostActions
          likes={post.likes}
          comments={post.comments}
          postId={post.id}
          isLiked={isLiked}
          onLike={onLike}
          extra={
            <button
              onClick={() => onFollow(post.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                fontSize: 12, color: isFollowing ? '#22c55e' : 'var(--text-3)', fontFamily: 'inherit', borderRadius: 4,
              }}
              onMouseEnter={e => { if (!isFollowing) (e.currentTarget as HTMLButtonElement).style.color = '#1d9bf0'; }}
              onMouseLeave={e => { if (!isFollowing) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; }}
            >
              {isFollowing ? 'Following ✓' : 'Follow challenge ↗'}
            </button>
          }
        />
      </div>
    </div>
  );
}
