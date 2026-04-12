import React, { useState } from 'react';
import type { CommunityPost, Rule } from '../../types/propfirm';
import { firmBadge, phaseBadge, Avatar, PostActions, LessonBlock } from './MilestonePost';

function barColor(used: number, limit: number): string {
  const pct = limit > 0 ? used / limit : 0;
  if (pct >= 0.8) return 'var(--red)';
  if (pct >= 0.6) return 'var(--amber)';
  return 'var(--green)';
}

function RuleBar({ rule, isLast }: { rule: Rule; isLast: boolean }) {
  const pct = rule.limit > 0 ? Math.min(rule.used / rule.limit, 1) : 0;
  const color = barColor(rule.used, rule.limit);

  const formatVal = (v: number, type: Rule['type']) => {
    if (type === 'min_trading_days') return `${v}d`;
    if (type === 'news_trading' || type === 'weekend_holding') return v ? 'Yes' : 'No';
    return `$${v.toLocaleString()}`;
  };

  return (
    <div style={{
      padding: '6px 10px',
      borderBottom: isLast ? 'none' : '0.5px solid var(--border-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {rule.name}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 8 }}>
          {formatVal(rule.used, rule.type)} / {formatVal(rule.limit, rule.type)}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 4 }} />
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
        background: 'var(--bg-card)',
        border: `0.5px solid ${hovered ? 'var(--border-soft)' : 'var(--border)'}`,
        borderLeft: '2px solid var(--blue)',
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
            {phaseBadge(phase)}
            <span style={{
              fontSize: 10, fontWeight: 500, color: 'var(--text-muted)',
              padding: '2px 7px', borderRadius: 3,
              background: 'var(--bg-surface)', border: '0.5px solid var(--border)',
            }}>
              Day {dayNumber}
            </span>
          </div>

          {/* Narrative */}
          {narrative && (
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 10px 0' }}>
              {narrative}
            </p>
          )}

          {/* Rule bars card */}
          {rules && rules.length > 0 && (
            <div style={{
              background: 'var(--bg-surface)',
              border: '0.5px solid var(--border)',
              borderRadius: 6,
              marginBottom: 10,
              overflow: 'hidden',
            }}>
              {rules.map((r, i) => (
                <RuleBar key={r.type} rule={r} isLast={i === rules.length - 1} />
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
                  fontSize: 11, color: isFollowing ? 'var(--green)' : 'var(--text-hint)',
                  fontFamily: 'inherit', borderRadius: 4,
                }}
                onMouseEnter={e => { if (!isFollowing) (e.currentTarget as HTMLButtonElement).style.color = 'var(--blue)'; }}
                onMouseLeave={e => { if (!isFollowing) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-hint)'; }}
              >
                {isFollowing ? 'Following ✓' : 'Follow challenge ↗'}
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
