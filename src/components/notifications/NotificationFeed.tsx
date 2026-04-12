import type { Notification, NotificationCategory } from '../../types/notification'
import NotificationRow from './NotificationRow'

type FilterTab = 'ALL' | NotificationCategory

interface Props {
  notifications: Notification[]
  activeTab: FilterTab
  onMarkAsRead: (id: string) => void
}

function dateLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (target.getTime() === today.getTime()) return 'Today'
  if (target.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDate(items: Notification[]): { label: string; items: Notification[] }[] {
  const map = new Map<string, Notification[]>()
  for (const n of items) {
    const label = dateLabel(n.createdAt)
    const group = map.get(label)
    if (group) group.push(n)
    else map.set(label, [n])
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

export default function NotificationFeed({ notifications, activeTab, onMarkAsRead }: Props) {
  const filtered = activeTab === 'ALL'
    ? notifications
    : notifications.filter(n => n.category === activeTab)

  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const groups = groupByDate(sorted)

  if (sorted.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '60px 20px',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-emphasis)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 12 }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 4 }}>All caught up</div>
        <div style={{ fontSize: 12, color: 'var(--text-4)', textAlign: 'center', maxWidth: 240 }}>
          New likes, comments and trade alerts will appear here
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {groups.map(g => (
        <div key={g.label}>
          <div style={{
            fontSize: 11, fontWeight: 500, color: 'var(--text-4)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '10px 20px 4px', background: 'var(--bg)',
            position: 'sticky', top: 0, zIndex: 5,
          }}>
            {g.label}
          </div>
          {g.items.map(n => (
            <NotificationRow
              key={n.id}
              notification={n}
              onAction={() => onMarkAsRead(n.id)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
