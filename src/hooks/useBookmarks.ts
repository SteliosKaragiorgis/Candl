import { useState, useCallback } from 'react'

const STORAGE_KEY = 'candl_bookmarks'

function readBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function writeBookmarks(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch { /* quota */ }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(readBookmarks)

  const toggle = useCallback((postId: string) => {
    setBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      writeBookmarks(next)
      return next
    })
  }, [])

  const isBookmarked = useCallback(
    (postId: string) => bookmarks.has(postId),
    [bookmarks],
  )

  return { bookmarks, toggle, isBookmarked }
}
