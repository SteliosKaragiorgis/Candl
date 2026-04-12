import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import NotificationFeed from '../components/notifications/NotificationFeed'
import type { NotificationCategory } from '../types/notification'

type FilterTab = 'ALL' | NotificationCategory

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL',    label: 'All' },
  { key: 'TRADES', label: 'Trades' },
  { key: 'SOCIAL', label: 'Social' },
  { key: 'SYSTEM', label: 'System' },
]

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')

  // Auto-mark all as read after 2s on this page
  useEffect(() => {
    if (unreadCount === 0) return
    const t = setTimeout(markAllAsRead, 2000)
    return () => clearTimeout(t)
  }, [unreadCount, markAllAsRead])

  function countForTab(tab: FilterTab): number {
    if (tab === 'ALL') return notifications.filter(n => !n.isRead).length
    return notifications.filter(n => n.category === tab && !n.isRead).length
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)', borderBottom: '0.5px solid var(--border)',
        padding: '14px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>Notifications</div>
          {unreadCount > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>
              {unreadCount} unread
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                fontSize: 12, color: 'var(--green)', background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >Mark all as read</button>
          )}
          <button
            onClick={() => navigate('/settings')}
            style={{
              width: 28, height: 28, borderRadius: 6, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: '0.5px solid var(--border-emphasis)', background: 'transparent',
              cursor: 'pointer', color: 'var(--text-3)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        background: 'var(--surface)', borderBottom: '0.5px solid var(--border)',
        display: 'flex', padding: '0 20px', flexShrink: 0,
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key
          const count = countForTab(tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                fontSize: 13, padding: '10px 14px',
                color: active ? 'var(--text)' : 'var(--text-3)',
                fontWeight: active ? 500 : 400,
                borderBottom: `2px solid ${active ? 'var(--green)' : 'transparent'}`,
                marginBottom: -0.5, cursor: 'pointer',
                background: 'none', border: 'none',
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: active ? 'var(--green)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  padding: '1px 6px', borderRadius: 10,
                  background: 'var(--red-bg)', color: 'var(--red)',
                }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Feed */}
      <NotificationFeed
        notifications={notifications}
        activeTab={activeTab}
        onMarkAsRead={markAsRead}
      />
    </div>
  )
}
