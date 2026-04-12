import { formatRelativeTime } from '../../lib/postUtils';
import type { Post } from '../../types/post';
import type { Badge } from '../../types/badges';
import BadgeRow from '../badges/BadgeRow';

interface PostHeaderProps {
  post: Post
  showFirmBadge?: boolean
  propBadges?: Badge[]
}

const TYPE_LABELS: Record<Post['type'], string> = {
  TRADE: 'Trade',
  INVEST: 'Invest',
  COMMENTARY: 'Commentary',
  PROP_FIRM: 'Prop Firm',
  WEEKLY_RECAP: 'Weekly Recap',
};

const FIRM_BADGE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  FTMO: { bg: 'var(--blue-bg)', color: 'var(--blue)', border: 'var(--blue-border)' },
  TFT:  { bg: '#1a0d27',        color: '#8b5cf6',     border: '#2d1a5c' },
  APEX: { bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber-border)' },
  E8:   { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)' },
  FUNDEDNEXT: { bg: 'var(--blue-bg)', color: 'var(--blue)', border: 'var(--blue-border)' },
};

const TYPE_BADGE_STYLES: Record<Post['type'], { bg: string; color: string; border: string }> = {
  TRADE:        { bg: 'var(--green-bg)',  color: 'var(--green)',  border: 'var(--green-border)' },
  INVEST:       { bg: 'var(--amber-bg)',  color: 'var(--amber)',  border: 'var(--amber-border)' },
  COMMENTARY:   { bg: 'var(--bg-surface)', color: 'var(--text-3)', border: 'var(--border)' },
  PROP_FIRM:    { bg: '#2d1a5c',          color: '#a78bfa',       border: '#4c1d95' },
  WEEKLY_RECAP: { bg: 'var(--blue-bg)',   color: 'var(--blue)',   border: 'var(--blue-border)' },
};

const AVATAR_STYLES: Record<Post['type'], { bg: string; color: string; border: string }> = {
  TRADE:        { bg: 'var(--green-bg)',   color: 'var(--green)',  border: 'var(--green-border)' },
  INVEST:       { bg: 'var(--green-bg)',   color: 'var(--green)',  border: 'var(--green-border)' },
  COMMENTARY:   { bg: 'var(--bg-surface)', color: 'var(--text-3)', border: 'var(--border)' },
  PROP_FIRM:    { bg: '#2d1a5c',           color: '#a78bfa',       border: '#4c1d95' },
  WEEKLY_RECAP: { bg: 'var(--blue-bg)',    color: 'var(--blue)',   border: 'var(--blue-border)' },
};

export default function PostHeader({ post, showFirmBadge, propBadges = [] }: PostHeaderProps) {
  const avatarStyle = AVATAR_STYLES[post.type];
  const typeBadge = TYPE_BADGE_STYLES[post.type];
  const isWeeklyRecap = post.type === 'WEEKLY_RECAP';
  const initials = isWeeklyRecap
    ? 'AI'
    : post.author.avatarInitials.slice(0, 2).toUpperCase();

  const firmStyle = post.propFirmData
    ? FIRM_BADGE_STYLES[post.propFirmData.firm] ?? FIRM_BADGE_STYLES.FTMO
    : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: avatarStyle.bg,
        color: avatarStyle.color,
        border: `0.5px solid ${avatarStyle.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Name */}
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            {post.author.displayName}
          </span>

          {/* Verified badge */}
          {post.author.isVerified && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--green)', flexShrink: 0,
            }}>
              <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}

          {/* Handle */}
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>@{post.author.handle}</span>
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {formatRelativeTime(post.createdAt)}
          </span>

          {/* Firm badge */}
          {showFirmBadge && post.propFirmData && firmStyle && (
            <span style={{
              fontSize: 10, fontWeight: 500,
              padding: '2px 7px', borderRadius: 3,
              background: firmStyle.bg,
              color: firmStyle.color,
              border: `0.5px solid ${firmStyle.border}`,
            }}>
              {post.propFirmData.firm}
            </span>
          )}

          {/* Prop firm funded badges */}
          {propBadges.length > 0 && (
            <BadgeRow badges={propBadges} context="post" maxCount={1} />
          )}

          {/* Type badge */}
          <span style={{
            fontSize: 10, fontWeight: 500,
            padding: '1px 7px', borderRadius: 3,
            background: typeBadge.bg,
            color: typeBadge.color,
            border: `0.5px solid ${typeBadge.border}`,
            marginLeft: 'auto',
          }}>
            {TYPE_LABELS[post.type]}
          </span>
        </div>

        {/* Bio sub-row */}
        {post.author.bio && (
          <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>
            {isWeeklyRecap
              ? `Generated by Candl. AI · ${post.recapData?.weekOf ?? ''}`
              : post.author.bio}
          </div>
        )}
      </div>
    </div>
  );
}
