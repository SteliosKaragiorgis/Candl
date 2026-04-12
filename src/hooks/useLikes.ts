import { useState, useCallback } from 'react'
import type { Post } from '../types/post'
import type { Notification } from '../types/notification'
import { currentUser } from '../data/demo'

const STORAGE_KEY = 'candl_likes'
const NOTIF_KEY = 'candl_notifications'

interface LikeEntry {
  liked: boolean
  delta: number
}

type LikesStore = Record<string, LikeEntry>

function readLikes(): LikesStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LikesStore) : {}
  } catch {
    return {}
  }
}

function writeLikes(store: LikesStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch { /* quota */ }
}

function pushNotification(notif: Notification): void {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    const existing: Notification[] = raw ? (JSON.parse(raw) as Notification[]) : []
    const next = [notif, ...existing]
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('candl-notifications-updated'))
  } catch { /* quota */ }
}

export function useLikes() {
  const [store, setStore] = useState<LikesStore>(readLikes)

  const toggle = useCallback((post: Post) => {
    setStore(prev => {
      const entry = prev[post.id] ?? { liked: post.isLiked, delta: 0 }
      const nextLiked = !entry.liked
      const nextDelta = entry.delta + (nextLiked ? 1 : -1)
      const next: LikesStore = {
        ...prev,
        [post.id]: { liked: nextLiked, delta: nextDelta },
      }
      writeLikes(next)
      window.dispatchEvent(new Event('candl-likes-updated'))

      // Push a notification when liking a post by someone else
      if (nextLiked && post.author.id !== currentUser.id) {
        const td = post.tradeData
        const notif: Notification = {
          id: `notif-like-${post.id}-${Date.now()}`,
          type: 'TRADE_LIKED',
          category: 'TRADES',
          isRead: false,
          createdAt: new Date().toISOString(),
          actor: {
            id: currentUser.id,
            displayName: currentUser.name,
            handle: currentUser.username,
            avatarInitials: currentUser.initials,
            isFollowing: false,
          },
          trade: {
            id: post.id,
            symbol: td?.symbol ?? post.investData?.symbol ?? '—',
            direction: td?.direction ?? (post.investData?.stance === 'BEARISH' ? 'SHORT' : 'LONG'),
            pnl: td?.pnl ?? 0,
            rMultiple: td?.rMultiple ?? 0,
            entry: td?.entry ?? post.investData?.entry ?? 0,
            exit: td?.exit ?? post.investData?.target ?? 0,
            postId: post.id,
          },
          actorCount: 1,
        }
        pushNotification(notif)
      }

      return next
    })
  }, [])

  const isLiked = useCallback(
    (postId: string, baseIsLiked: boolean): boolean => {
      const entry = store[postId]
      if (!entry) return baseIsLiked
      return entry.liked
    },
    [store],
  )

  const getLikeCount = useCallback(
    (postId: string, base: number): number => {
      const entry = store[postId]
      if (!entry) return base
      return Math.max(0, base + entry.delta)
    },
    [store],
  )

  return { toggle, isLiked, getLikeCount }
}
