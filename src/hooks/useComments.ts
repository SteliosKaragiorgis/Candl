import { useState, useCallback } from 'react'
import type { Notification } from '../types/notification'
import type { Post } from '../types/post'
import { currentUser } from '../data/demo'

const STORAGE_KEY = 'candl_comments'
const NOTIF_KEY = 'candl_notifications'

export interface Comment {
  id: string
  authorId: string
  authorName: string
  authorHandle: string
  authorInitials: string
  body: string
  createdAt: string
}

type CommentsStore = Record<string, Comment[]>

function readComments(): CommentsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CommentsStore) : {}
  } catch {
    return {}
  }
}

function writeComments(store: CommentsStore): void {
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

export function useComments() {
  const [store, setStore] = useState<CommentsStore>(readComments)

  const addComment = useCallback((post: Post, body: string): void => {
    const trimmed = body.trim()
    if (!trimmed) return

    const comment: Comment = {
      id: `c-${post.id}-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorHandle: currentUser.username,
      authorInitials: currentUser.initials,
      body: trimmed,
      createdAt: new Date().toISOString(),
    }

    setStore(prev => {
      const existing = prev[post.id] ?? []
      const next: CommentsStore = {
        ...prev,
        [post.id]: [...existing, comment],
      }
      writeComments(next)
      window.dispatchEvent(new Event('candl-comments-updated'))
      return next
    })

    // Push notification when commenting on someone else's post
    if (post.author.id !== currentUser.id) {
      const td = post.tradeData
      const notif: Notification = {
        id: `notif-comment-${post.id}-${Date.now()}`,
        type: 'TRADE_COMMENTED',
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
        commentText: trimmed,
      }
      pushNotification(notif)
    }
  }, [])

  const getComments = useCallback(
    (postId: string): Comment[] => store[postId] ?? [],
    [store],
  )

  const commentCount = useCallback(
    (postId: string, base: number): number => {
      const local = store[postId]?.length ?? 0
      return base + local
    },
    [store],
  )

  return { addComment, getComments, commentCount }
}
