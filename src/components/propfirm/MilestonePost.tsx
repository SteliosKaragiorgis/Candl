import React, { useState } from 'react';
import type { CommunityPost, PropFirm, ChallengePhase } from '../../types/propfirm';

// ─── Firm colours via CSS vars ────────────────────────────────────────────────

const FIRM_COLORS: Record<PropFirm, { color: string; bg: string; border: string }> = {
  FTMO:       { color: 'var(--ftmo-color)', bg: 'var(--ftmo-bg)',    border: 'var(--ftmo-border)'  },
  TFT:        { color: 'var(--tft-color)',  bg: 'var(--tft-bg)',     border: 'var(--tft-border)'   },
  Apex:       { color: 'var(--apex-color)', bg: 'var(--apex-bg)',    border: 'var(--apex-border)'  },
  E8:         { color: 'var(--e8-color)',   bg: 'var(--e8-bg)',      border: 'var(--e8-border)'    },
  FundedNext: { color: 'var(--tft-color)',  bg: 'var(--tft-bg)',     border: 'var(--tft-border)'   },
  MFF:        { color: 'var(--text-muted)', bg: 'var(--bg-surface)', border: 'var(--border)'       },
  TFF:        { color: 'var(--text-muted)', bg: 'var(--bg-surface)', border: 'var(--border)'       },
  Other:      { color: 'var(--text-muted)', bg: 'var(--bg-surface)', border: 'var(--border)'       },
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function firmBadge(firm: PropFirm) {
  const s = FIRM_COLORS[firm] ?? FIRM_COLORS.Other;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px',
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
      fontSize: 10, fontWeight: 500, padding: '2px 7px',
      borderRadius: 3, flexShrink: 0,
      background: 'var(--bg-surface)', color: 'var(--text-muted)',
      border: '0.5px solid var(--border)',
    }}>
      {label}
    </span>
  );
}

export function Avatar({ initials, color: _color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--bg-surface)', border: '0.5px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', fontSize: Math.round(size * 0.33), fontWeight: 500,
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
    <div style={{
      display: 'flex', alignItems: 'center', gap: 24,
      marginTop: 10,
      borderTop: '0.5px solid var(--border-soft)',
      paddingTop: 8,
    }}>
      <button
        onClick={() => onLike(postId)}
        onMouseEnter={() => setCommentHov(true)}
        onMouseLeave={() => setCommentHov(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: commentHov ? 'var(--text-muted)' : 'var(--text-hint)', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4,
          fontSize: 11,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>{comments}</span>
      </button>
      <button
        onClick={() => onLike(postId)}
        onMouseEnter={() => setLikeHov(true)}
        onMouseLeave={() => setLikeHov(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: isLiked || likeHov ? '#f91880' : 'var(--text-hint)', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4,
          fontSize: 11,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? '#f91880' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span>{likes + (isLiked ? 1 : 0)}</span>
      </button>
      {extra}
    </div>
  );
}

export function LessonBlock({ text }: { text: string }) {
  return (
    <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 10, marginTop: 10, marginBottom: 10 }}>
      <div style={{
        fontSize: 10, fontWeight: 500, letterSpacing: '0.04em',
        color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4,
      }}>
        Key Lesson
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic' }}>
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
        fontSize: 11, color: 'var(--text-hint)', fontFamily: 'inherit', borderRadius: 4,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-hint)'; }}
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
        background: 'var(--bg-card)',
        border: `0.5px solid ${hovered ? 'var(--border-soft)' : 'var(--border)'}`,
        borderTop: '2px solid var(--green)',
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
          </div>

          {/* Milestone banner */}
          <div style={{
            background: 'var(--green-bg)',
            border: '0.5px solid var(--green-border)',
            borderRadius: 6,
            padding: '10px 12px',
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                {firm} {sizeLabel} — {label} passed
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {stats.daysUsed} days · {stats.winRate}% win rate · Avg {stats.avgRR.toFixed(1)}R
            </div>
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
              { label: 'Final P&L', value: `+$${stats.pnl.toLocaleString()}`, color: 'var(--green)' },
              { label: 'Days used', value: String(stats.daysUsed),             color: 'var(--text-primary)' },
              { label: 'Win rate',  value: `${stats.winRate}%`,                color: 'var(--text-primary)' },
              { label: 'Avg RR',    value: `${stats.avgRR.toFixed(1)}R`,       color: 'var(--text-primary)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-surface)', padding: '10px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
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

          {/* Lesson block */}
          {lesson && (
            <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                Key Lesson
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                {lesson}
              </div>
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
    </div>
  );
}
