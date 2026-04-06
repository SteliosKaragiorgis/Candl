import React, { useState } from 'react';
import type { CommunityPost, PropFirm, ChallengePhase } from '../../types/propfirm';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const FIRM_COLORS: Record<PropFirm, { color: string; bg: string; border: string }> = {
  FTMO:       { color: '#3b82f6', bg: '#0d1627', border: '#1a3a5c' },
  TFT:        { color: '#8b5cf6', bg: '#1a0d27', border: '#2d1a5c' },
  Apex:       { color: '#f59e0b', bg: '#1f1200', border: '#3a2200' },
  E8:         { color: '#22c55e', bg: '#0d1f12', border: '#1a3a22' },
  FundedNext: { color: '#8b5cf6', bg: '#1a0d27', border: '#2d1a5c' },
  MFF:        { color: 'var(--text-3)', bg: 'var(--surface)', border: 'var(--border)' },
  TFF:        { color: 'var(--text-3)', bg: 'var(--surface)', border: 'var(--border)' },
  Other:      { color: 'var(--text-3)', bg: 'var(--surface)', border: 'var(--border)' },
};

export function firmBadge(firm: PropFirm) {
  const s = FIRM_COLORS[firm] ?? FIRM_COLORS.Other;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '1px 6px',
      borderRadius: 3, flexShrink: 0,
      background: s.bg, color: s.color,
      border: `0.5px solid ${s.border}`,
    }}>
      {firm}
    </span>
  );
}

export function phaseBadge(phase: ChallengePhase) {
  const label = phase === 3 ? 'Funded' : `Phase ${phase}`;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '1px 6px',
      borderRadius: 3, flexShrink: 0,
      background: 'var(--surface)', color: 'var(--text-2)',
      border: '0.5px solid var(--border)',
    }}>
      {label}
    </span>
  );
}

export function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--border)', border: '0.5px solid var(--border-emphasis)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-2)', fontSize: Math.round(size * 0.33), fontWeight: 500,
    }}>
      {initials}
    </div>
  );
}

export function PostActions({
  likes, comments, extra, postId, isLiked, onLike,
}: {
  likes: number;
  comments: number;
  extra?: React.ReactNode;
  postId: string;
  isLiked: boolean;
  onLike: (id: string) => void;
}) {
  const [likeHov, setLikeHov] = useState(false);
  const [commentHov, setCommentHov] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 12 }}>
      <button
        onClick={() => onLike(postId)}
        onMouseEnter={() => setCommentHov(true)}
        onMouseLeave={() => setCommentHov(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: commentHov ? 'var(--text-2)' : 'var(--text-3)', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span style={{ fontSize: 12 }}>{comments}</span>
      </button>
      <button
        onClick={() => onLike(postId)}
        onMouseEnter={() => setLikeHov(true)}
        onMouseLeave={() => setLikeHov(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: isLiked || likeHov ? '#f91880' : 'var(--text-3)', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? '#f91880' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span style={{ fontSize: 12 }}>{likes + (isLiked ? 1 : 0)}</span>
      </button>
      {extra}
    </div>
  );
}

export function LessonBlock({ text }: { text: string }) {
  return (
    <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 10, marginTop: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--border-emphasis)', textTransform: 'uppercase', marginBottom: 4 }}>
        Key Lesson
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, fontStyle: 'italic' }}>
        {text}
      </div>
    </div>
  );
}

export function ActionLink({ label }: { label: string }) {
  return (
    <button
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
        fontSize: 12, color: 'var(--text-3)', fontFamily: 'inherit', borderRadius: 4,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; }}
    >
      {label}
    </button>
  );
}

// ─── MilestonePost ────────────────────────────────────────────────────────────

interface MilestonePostProps {
  post: CommunityPost;
  isLiked: boolean;
  onLike: (id: string) => void;
}

export default function MilestonePost({ post, isLiked, onLike }: MilestonePostProps) {
  const { user, firm, accountSize, phase, stats, narrative, lesson, createdAt, isVerified } = post;
  const label = phase === 3 ? 'Funded' : `Phase ${phase}`;
  const sizeLabel = `$${(accountSize / 1000).toFixed(0)}k`;
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
        </div>

        {/* Milestone banner */}
        <div style={{
          borderRadius: 8, border: '0.5px solid #1a3a22',
          background: 'var(--surface)', borderTop: '1px solid #22c55e',
          marginBottom: 12, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#0d1f12', border: '0.5px solid #1a3a22',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              {firm} {sizeLabel} — {label} passed
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {stats.daysUsed} days · {stats.winRate}% win rate · Avg {stats.avgRR.toFixed(1)}R
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          borderRadius: 8, border: '0.5px solid var(--border)',
          background: 'var(--bg)', marginBottom: 12, overflow: 'hidden',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { label: 'Final P&L', value: `+$${stats.pnl.toLocaleString()}`, color: '#22c55e' },
              { label: 'Days used', value: String(stats.daysUsed), color: 'var(--text)' },
              { label: 'Win rate',  value: `${stats.winRate}%`,               color: 'var(--text)' },
              { label: 'Avg RR',    value: `${stats.avgRR.toFixed(1)}R`,      color: 'var(--text)' },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                padding: '10px 14px',
                borderRight: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
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

        {/* Lesson block */}
        {lesson && (
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--border-emphasis)', textTransform: 'uppercase', marginBottom: 4 }}>KEY LESSON</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, fontStyle: 'italic' }}>{lesson}</div>
          </div>
        )}

        <PostActions
          likes={post.likes}
          comments={post.comments}
          postId={post.id}
          isLiked={isLiked}
          onLike={onLike}
          extra={
            <>
              <ActionLink label="Full journal ↗" />
              <ActionLink label="Stats breakdown ↗" />
            </>
          }
        />
      </div>
    </div>
  );
}
