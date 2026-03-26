import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NOTIFICATIONS } from '../data/demo'
import type { Notification } from '../data/demo'
import { useMobile } from '../hooks/useMobile'

const ACTION_TEXT: Record<Notification['type'], string> = {
  like:    'liked your post',
  comment: 'commented on your post',
  follow:  'started following you',
  reply:   'replied to your comment',
  mention: 'mentioned you in a comment',
}

const TYPE_ICON: Record<Notification['type'], { emoji: string; bg: string }> = {
  like:    { emoji: '❤️', bg: '#ef4444' },
  comment: { emoji: '💬', bg: '#3b82f6' },
  follow:  { emoji: '👤', bg: '#16a34a' },
  reply:   { emoji: '↩️', bg: '#7c3aed' },
  mention: { emoji: '@',  bg: '#d97706' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const isMobile = useMobile()
  const navigate = useNavigate()

  const unreadCount = notifications.filter(n => !n.read).length
  const newGroup    = notifications.filter(n => !n.read)
  const earlierGroup = notifications.filter(n => n.read)

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function handleClick(notif: Notification) {
    markRead(notif.id)
    if (notif.post) navigate(`/post/${notif.post.id}`)
  }

  const [followed, setFollowed] = useState<Record<string, boolean>>({})

  function renderGroup(items: Notification[], label: string) {
    if (!items.length) return null
    return (
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>
          {label}
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {items.map((notif, i) => {
            const icon = TYPE_ICON[notif.type]
            const isLast = i === items.length - 1
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 16px',
                  borderBottom: isLast ? 'none' : '1px solid var(--border2)',
                  cursor: notif.post ? 'pointer' : 'default',
                  background: notif.read ? 'var(--surface)' : 'var(--blue-bg)',
                  transition: 'background 0.15s',
                  position: 'relative',
                }}
              >
                {/* Avatar + type icon */}
                <div style={{ position: 'relative', flexShrink: 0, width: 42, height: 42 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: notif.actor.avatarGradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 13, fontWeight: 700,
                  }}>
                    {notif.actor.initials}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 18, height: 18, borderRadius: '50%',
                    background: icon.bg,
                    border: '2px solid var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: notif.type === 'mention' ? 8 : 9,
                    fontWeight: 900, color: '#fff',
                    lineHeight: 1,
                  }}>
                    {icon.emoji}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
                      {notif.actor.name}
                    </span>
                    {notif.actor.verified && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--blue)" style={{ flexShrink: 0, marginBottom: -1 }}>
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    )}
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {ACTION_TEXT[notif.type]}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto', flexShrink: 0 }}>
                      {notif.createdAt}
                    </span>
                  </div>

                  {notif.post && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                      {notif.post.ticker && (
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700,
                          padding: '1px 5px', borderRadius: 3,
                          background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-border)',
                          flexShrink: 0,
                        }}>
                          {notif.post.ticker}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.post.preview.length > 60 ? notif.post.preview.slice(0, 60) + '…' : notif.post.preview}
                      </span>
                    </div>
                  )}

                  {notif.commentPreview && (
                    <div style={{
                      marginTop: 6,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '6px 10px',
                      fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.5,
                    }}>
                      "{notif.commentPreview}"
                    </div>
                  )}
                </div>

                {/* Follow button for follow type */}
                {notif.type === 'follow' && (
                  <button
                    onClick={e => { e.stopPropagation(); setFollowed(prev => ({ ...prev, [notif.id]: !prev[notif.id] })) }}
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '5px 13px', borderRadius: 7,
                      border: '1px solid var(--blue)',
                      color: followed[notif.id] ? '#fff' : 'var(--blue)',
                      background: followed[notif.id] ? 'var(--blue)' : 'none',
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif', flexShrink: 0, marginLeft: 8,
                      transition: 'all 0.15s',
                    }}
                  >
                    {followed[notif.id] ? 'Following' : 'Follow'}
                  </button>
                )}

                {/* Unread dot */}
                {!notif.read && (
                  <div style={{
                    position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
                    width: 5, height: 5, borderRadius: '50%', background: 'var(--blue)',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg)', minHeight: '100vh',
      maxWidth: 680, margin: '0 auto',
      padding: isMobile ? '12px 14px 100px' : '24px 16px 80px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMobile && (
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px 2px 0', display: 'flex', alignItems: 'center', color: 'var(--text3)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>Notifications</span>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div style={{
          display: 'inline-block',
          background: 'var(--blue-bg)', color: 'var(--blue)',
          border: '1px solid var(--blue-border)',
          borderRadius: 20, fontSize: 11, fontWeight: 700,
          padding: '3px 10px', marginBottom: 14,
        }}>
          {unreadCount} new
        </div>
      )}

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>No notifications yet</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>When someone likes, comments or follows you, it will appear here.</div>
        </div>
      ) : (
        <>
          {renderGroup(newGroup, 'New')}
          {renderGroup(earlierGroup, 'Earlier')}
        </>
      )}
    </div>
  )
}
