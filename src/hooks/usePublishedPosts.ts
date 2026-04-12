import { useState, useEffect, useCallback } from 'react'
import type { PendingTrade } from './usePendingTrade'

const STORAGE_KEY = 'candl_published_posts'

export interface PublishedPost {
  id:          string
  trade:       PendingTrade
  narrative:   string
  emotions:    string[]
  lesson:      string
  publishedAt: string   // ISO string
  authorId:    string
}

function readFromStorage(): PublishedPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PublishedPost[]) : []
  } catch {
    return []
  }
}

function writeToStorage(posts: PublishedPost[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  } catch { /* quota — ignore */ }
}

// Emit a storage event so other components on the same page can react
function notifyOtherInstances() {
  window.dispatchEvent(new Event('candl-posts-updated'))
}

export function usePublishedPosts(filterAuthorId?: string) {
  const [posts, setPosts] = useState<PublishedPost[]>(() => readFromStorage())

  // Sync if another component writes to storage
  useEffect(() => {
    function onUpdate() { setPosts(readFromStorage()) }
    window.addEventListener('candl-posts-updated', onUpdate)
    return () => window.removeEventListener('candl-posts-updated', onUpdate)
  }, [])

  const addPost = useCallback((post: PublishedPost) => {
    const next = [post, ...readFromStorage()]
    writeToStorage(next)
    setPosts(next)
    notifyOtherInstances()
  }, [])

  const filtered = filterAuthorId
    ? posts.filter(p => p.authorId === filterAuthorId)
    : posts

  return { posts: filtered, addPost }
}
