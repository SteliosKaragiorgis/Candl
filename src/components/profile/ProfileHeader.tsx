import { useState } from 'react'
import EditProfileModal from './EditProfileModal'
import type { User } from '../../types'
import type { Badge } from '../../types/badges'
import BadgeRow from '../badges/BadgeRow'

// ── ProfileData shape ────────────────────────────────────────────────────────

export interface ProfileData {
  displayName:    string
  handle:         string
  avatarInitials: string
  bio:            string
  tags:           string[]
  isVerified:     boolean
  isMT5Connected: boolean
  isActiveToday:  boolean
  followers:      number
  following:      number   // followingCount (people they follow)
  postCount:      number
  ytdReturn:      number
  winRate:        number
  avgRR:          number
  _user:          User     // passed through for EditProfileModal
}

interface Props {
  profile:      ProfileData
  isOwnProfile: boolean
  isFollowing:  boolean
  onFollow:     () => void
  badges?:      Badge[]
}

// ── Decorative cover chart ────────────────────────────────────────────────────

function CoverChart() {
  const pts = '0,55 100,40 200,48 320,28 440,38 560,20 680,30 800,15 900,22'
  const dots: [number, number][] = [
    [0, 55], [100, 40], [200, 48], [320, 28], [440, 38], [560, 20], [680, 30], [800, 15], [900, 22],
  ]
  return (
    <svg
      width="100%" height="72"
      viewBox="0 0 900 72"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <polyline
        points={pts}
        fill="none"
        stroke="var(--green)"
        strokeWidth="1.5"
        opacity="0.2"
      />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="var(--green)" opacity="0.25" />
      ))}
    </svg>
  )
}

// ── Share button ──────────────────────────────────────────────────────────────

function ShareButton({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/profile/${handle}`
    if (navigator.share) {
      try { await navigator.share({ title: `@${handle} on Candl.`, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      title="Share profile"
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '7px 12px', borderRadius: 6,
        border: '0.5px solid var(--border-hard)',
        background: 'transparent',
        fontSize: 12, color: copied ? 'var(--green)' : 'var(--text-2)',
        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        transition: 'color 0.15s',
      }}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 12 12" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <polyline points="2,6 5,9 10,3" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
      {copied ? 'Copied' : 'Share'}
    </button>
  )
}

// ── ProfileHeader ─────────────────────────────────────────────────────────────

export default function ProfileHeader({ profile, isOwnProfile, isFollowing, onFollow, badges = [] }: Props) {
  const [editOpen,         setEditOpen]         = useState(false)
  const [followHovered,    setFollowHovered]     = useState(false)

  const {
    displayName, handle, avatarInitials, bio, tags,
    isVerified, isMT5Connected, isActiveToday,
    followers, following, postCount,
    ytdReturn, winRate, avgRR,
    _user,
  } = profile

  // ── Follow button state ─────────────────────────────────────────────────
  let followLabel: string
  let followBg: string
  let followColor: string
  let followBorder: string

  if (isOwnProfile) {
    followLabel  = 'Edit profile'
    followBg     = 'transparent'
    followColor  = 'var(--text-2)'
    followBorder = 'var(--border-hard)'
  } else if (isFollowing) {
    followLabel  = followHovered ? 'Unfollow' : 'Following ✓'
    followBg     = followHovered ? 'var(--red-bg)'   : 'var(--green-bg)'
    followColor  = followHovered ? 'var(--red)'      : 'var(--green)'
    followBorder = followHovered ? 'var(--red-border)' : 'var(--green-border)'
  } else {
    followLabel  = 'Follow'
    followBg     = 'var(--green)'
    followColor  = '#000000'
    followBorder = 'none'
  }

  const stats: Array<{
    value: string
    label: string
    accent?: boolean
    badge?: boolean
  }> = [
    { value: followers.toLocaleString(),    label: 'followers' },
    { value: following.toLocaleString(),    label: 'following' },
    { value: String(postCount),             label: 'posts' },
    {
      value: (ytdReturn >= 0 ? '+' : '') + ytdReturn.toFixed(1) + '%',
      label: 'YTD return',
      accent: true,
      badge: isMT5Connected,
    },
    { value: winRate + '%',                 label: 'win rate' },
    { value: avgRR.toFixed(1) + 'R',        label: 'avg R:R' },
  ]

  return (
    <>
      {/* ── Layer 1: Cover ─────────────────────────────────────────────────── */}
      <div style={{
        height: 72,
        background: 'var(--bg-surface)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <CoverChart />
      </div>

      {/* ── Layer 2: Header body ──────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '0 20px 12px',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}>
          {/* Left: avatar + info */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
            {/* Avatar — overlaps cover by 24px */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--green-bg)',
              border: '3px solid var(--bg-card)',
              marginTop: -24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 600, color: 'var(--green)',
              flexShrink: 0,
            }}>
              {avatarInitials}
            </div>

            {/* Info block */}
            <div style={{ paddingBottom: 2, marginLeft: 12 }}>
              {/* Name row */}
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 6, marginTop: 6,
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                  {displayName}
                </span>

                {isVerified && (
                  <div style={{
                    width: 15, height: 15, borderRadius: '50%',
                    background: 'var(--green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="7" height="7" viewBox="0 0 12 12" fill="none"
                      stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  </div>
                )}

                {isActiveToday && (
                  <>
                    <style>{`
                      @keyframes activeDot {
                        0%,100% { opacity: 1; transform: scale(1) }
                        50%     { opacity: 0.5; transform: scale(1.3) }
                      }
                    `}</style>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 500, color: 'var(--green)',
                      background: 'var(--green-bg)',
                      padding: '2px 8px', borderRadius: 10,
                    }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: 'var(--green)',
                        animation: 'activeDot 2s ease-in-out infinite',
                      }} />
                      Active today
                    </div>
                  </>
                )}
              </div>

              {/* Handle + bio */}
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                @{handle}
                {bio && <> · {bio}</>}
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div style={{
            display: 'flex', gap: 6, paddingBottom: 4, alignItems: 'center',
          }}>
            {isOwnProfile ? (
              <button
                onClick={() => setEditOpen(true)}
                style={{
                  padding: '7px 14px', borderRadius: 6,
                  border: `0.5px solid ${followBorder}`,
                  background: followBg, fontSize: 12,
                  color: followColor, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                {followLabel}
              </button>
            ) : (
              <>
                <button
                  onClick={onFollow}
                  onMouseEnter={() => setFollowHovered(true)}
                  onMouseLeave={() => setFollowHovered(false)}
                  style={{
                    padding: '7px 18px', borderRadius: 6,
                    border: `0.5px solid ${followBorder}`,
                    background: followBg, fontSize: 12, fontWeight: 600,
                    color: followColor,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s',
                  }}
                >
                  {followLabel}
                </button>

                <ShareButton handle={handle} />

                {/* More button */}
                <button style={{
                  width: 32, height: 32, borderRadius: 6,
                  border: '0.5px solid var(--border-hard)',
                  background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-3)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Layer 3: Stats row ────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderBottom: '0.5px solid var(--border)',
          padding: '9px 20px',
          display: 'flex', alignItems: 'center',
          overflowX: 'auto', gap: 0,
        }}
        className="scrollbar-hide"
      >
        {stats.map(({ value, label, accent, badge }, i) => (
          <div
            key={label}
            style={{
              paddingRight: 16, marginRight: 16,
              borderRight: i < stats.length - 1 ? '0.5px solid var(--border)' : 'none',
              whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'baseline', gap: 3,
            }}
          >
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: accent ? 'var(--green)' : 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {value}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {label}
            </span>
            {badge && (
              <span style={{
                fontSize: 9, fontWeight: 600,
                background: 'var(--green-bg)', color: 'var(--green)',
                border: '0.5px solid var(--green-border)',
                padding: '1px 6px', borderRadius: 3, marginLeft: 3,
              }}>
                MT5 verified
              </span>
            )}
          </div>
        ))}

        {/* Tags + badges (right-aligned) */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center',
          gap: 6, flexShrink: 0, paddingLeft: 8, flexWrap: 'wrap',
        }}>
          {tags.slice(0, 4).map(tag => (
            <span key={tag} style={{
              fontSize: 11, padding: '2px 8px',
              borderRadius: 4, border: '0.5px solid var(--border-hard)',
              color: 'var(--text-2)', whiteSpace: 'nowrap',
            }}>
              {tag}
            </span>
          ))}
          {badges.length > 0 && (
            <BadgeRow badges={badges} context="profile" />
          )}
        </div>
      </div>

      {editOpen && <EditProfileModal user={_user} onClose={() => setEditOpen(false)} />}
    </>
  )
}
