import { useState, useEffect, useCallback } from 'react'
import type { Notification } from '../types/notification'

const STORAGE_KEY = 'candl_notifications'
const EVENT_KEY = 'candl-notifications-updated'

function todayISO(hoursAgo: number): string {
  const d = new Date()
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}

function yesterdayISO(hoursAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  d.setHours(d.getHours() - hoursAgo)
  return d.toISOString()
}

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

const SEED: Notification[] = [
  {
    id: 'n1',
    type: 'TRADE_DETECTED',
    category: 'TRADES',
    isRead: false,
    createdAt: todayISO(0.5),
    trade: {
      id: 't-mt5-1',
      symbol: 'EURUSD',
      direction: 'LONG',
      pnl: 234.50,
      rMultiple: 2.3,
      entry: 1.0842,
      exit: 1.0876,
    },
  },
  {
    id: 'n2',
    type: 'TRADE_LIKED',
    category: 'TRADES',
    isRead: false,
    createdAt: todayISO(1),
    actor: {
      id: 'u-alex',
      displayName: 'Alex Morgan',
      handle: 'alexfx',
      avatarInitials: 'AM',
      isFollowing: true,
    },
    trade: {
      id: 't-1',
      symbol: 'NAS100',
      direction: 'LONG',
      pnl: 1280,
      rMultiple: 3.2,
      entry: 17520,
      exit: 17648,
      postId: 'p-1',
    },
    actorCount: 4,
    additionalActors: ['Sarah K', 'Mike T', 'Jordan L'],
  },
  {
    id: 'n3',
    type: 'TRADE_COMMENTED',
    category: 'TRADES',
    isRead: false,
    createdAt: todayISO(2),
    actor: {
      id: 'u-sarah',
      displayName: 'Sarah Kim',
      handle: 'sarahk',
      avatarInitials: 'SK',
      isFollowing: false,
    },
    trade: {
      id: 't-2',
      symbol: 'GBPJPY',
      direction: 'SHORT',
      pnl: -180,
      rMultiple: -0.9,
      entry: 191.42,
      exit: 191.60,
      postId: 'p-2',
    },
    commentText: 'Great analysis on this one — the confluence with the H4 order block was spot on. Been watching this pair too.',
  },
  {
    id: 'n4',
    type: 'TRADE_SHARED',
    category: 'TRADES',
    isRead: false,
    createdAt: todayISO(3),
    actor: {
      id: 'u-mike',
      displayName: 'Mike Torres',
      handle: 'miketrades',
      avatarInitials: 'MT',
      isFollowing: true,
    },
    trade: {
      id: 't-3',
      symbol: 'XAUUSD',
      direction: 'LONG',
      pnl: 560,
      rMultiple: 2.8,
      entry: 2315.40,
      exit: 2321.00,
      postId: 'p-3',
    },
  },
  {
    id: 'n5',
    type: 'NEW_FOLLOWER',
    category: 'SOCIAL',
    isRead: false,
    createdAt: todayISO(4),
    actor: {
      id: 'u-jordan',
      displayName: 'Jordan Lee',
      handle: 'jordanfx',
      avatarInitials: 'JL',
      bio: 'Forex trader | ICT student | 2 years in',
      followerCount: 342,
      isFollowing: false,
    },
  },
  {
    id: 'n6',
    type: 'PROP_MILESTONE',
    category: 'SOCIAL',
    isRead: false,
    createdAt: yesterdayISO(2),
    actor: {
      id: 'u-ryan',
      displayName: 'Ryan Chen',
      handle: 'ryanc',
      avatarInitials: 'RC',
      isFollowing: true,
    },
    propMilestone: {
      firm: 'FTMO',
      phase: 'Phase 1',
      result: 'PASSED',
      daysUsed: 12,
      winRate: 68,
    },
  },
  {
    id: 'n7',
    type: 'DNA_UPDATED',
    category: 'SYSTEM',
    isRead: true,
    createdAt: yesterdayISO(6),
    dnaHighlights: {
      topSession: 'London',
      topSessionWR: 72,
      topSetup: 'OB + FVG',
      topSetupWR: 78,
      newPatternCount: 3,
      totalTrades: 147,
    },
  },
  {
    id: 'n8',
    type: 'WEEKLY_RECAP',
    category: 'SYSTEM',
    isRead: true,
    createdAt: daysAgoISO(3),
    recapStats: {
      totalPnl: 1840,
      winRate: 64,
      tradeCount: 18,
      weekOf: 'Apr 1 – Apr 7',
    },
  },
  {
    id: 'n9',
    type: 'SYSTEM',
    category: 'SYSTEM',
    isRead: true,
    createdAt: daysAgoISO(5),
  },
  {
    id: 'n10',
    type: 'TRADE_LIKED',
    category: 'TRADES',
    isRead: true,
    createdAt: daysAgoISO(4),
    actor: {
      id: 'u-emma',
      displayName: 'Emma Davis',
      handle: 'emmad',
      avatarInitials: 'ED',
      isFollowing: false,
    },
    trade: {
      id: 't-4',
      symbol: 'USDJPY',
      direction: 'SHORT',
      pnl: 420,
      rMultiple: 2.1,
      entry: 151.80,
      exit: 151.38,
      postId: 'p-4',
    },
    actorCount: 1,
  },
  {
    id: 'n11',
    type: 'NEW_FOLLOWER',
    category: 'SOCIAL',
    isRead: true,
    createdAt: daysAgoISO(5),
    actor: {
      id: 'u-noah',
      displayName: 'Noah Patel',
      handle: 'noahp',
      avatarInitials: 'NP',
      bio: 'Prop firm funded | Swing trader',
      followerCount: 891,
      isFollowing: true,
    },
  },
  {
    id: 'n12',
    type: 'PROP_MILESTONE',
    category: 'SOCIAL',
    isRead: true,
    createdAt: daysAgoISO(6),
    actor: {
      id: 'u-lisa',
      displayName: 'Lisa Wang',
      handle: 'lisaw',
      avatarInitials: 'LW',
      isFollowing: true,
    },
    propMilestone: {
      firm: 'TFT',
      phase: 'Phase 2',
      result: 'FAILED',
      daysUsed: 28,
      winRate: 41,
    },
  },
]

function load(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Notification[]
  } catch { /* ignore */ }
  return SEED
}

function save(data: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new Event(EVENT_KEY))
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(load)
  const [loading] = useState(false)

  useEffect(() => {
    const handler = () => setNotifications(load())
    window.addEventListener(EVENT_KEY, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(EVENT_KEY, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      save(next)
      return next
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, isRead: true }))
      save(next)
      return next
    })
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id)
      save(next)
      return next
    })
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}
