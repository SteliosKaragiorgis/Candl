import { useState, useEffect } from 'react'
import type { FinnhubNewsItem } from './useNewsArticles'

const KEY = import.meta.env.VITE_ALPHAVANTAGE_KEY as string
const TOPICS = 'energy_transportation,commodities,economy_macro'

// Module-level cache — prevents React StrictMode double-fetch from hitting rate limits
let _cache: FinnhubNewsItem[] | null = null
let _lastFetch = 0

const SESSION_KEY = 'av_news_cache'

function loadSessionCache(): FinnhubNewsItem[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { items, ts } = JSON.parse(raw)
    // Use session cache if it's less than 60 minutes old
    if (Date.now() - ts < 60 * 60_000) return items
  } catch {}
  return null
}

function saveSessionCache(items: FinnhubNewsItem[]) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ items, ts: Date.now() })) } catch {}
}

interface AVFeedItem {
  title: string
  url: string
  time_published: string   // "20240328T120000"
  summary: string
  banner_image?: string
  source: string
  topics: { topic: string; relevance_score: string }[]
  ticker_sentiment: { ticker: string; relevance_score: string }[]
}

function parseAVTime(t: string): number {
  const year  = parseInt(t.slice(0, 4))
  const month = parseInt(t.slice(4, 6)) - 1
  const day   = parseInt(t.slice(6, 8))
  const hour  = parseInt(t.slice(9, 11))
  const min   = parseInt(t.slice(11, 13))
  const sec   = parseInt(t.slice(13, 15))
  return Math.floor(new Date(Date.UTC(year, month, day, hour, min, sec)).getTime() / 1000)
}

function hashUrl(url: string): number {
  let h = 0
  for (let i = 0; i < url.length; i++) h = Math.imul(31, h) + url.charCodeAt(i) | 0
  return Math.abs(h) + 2_000_000_000
}

function toFinnhubItem(item: AVFeedItem): FinnhubNewsItem {
  const related = item.ticker_sentiment
    .filter(t => parseFloat(t.relevance_score) >= 0.3)
    .map(t => t.ticker)
    .join(',')
  return {
    id:       hashUrl(item.url),
    category: 'commodity',
    datetime: parseAVTime(item.time_published),
    headline: item.title,
    image:    item.banner_image ?? '',
    related,
    source:   item.source,
    summary:  item.summary,
    url:      item.url,
  }
}

export function useAlphaVantageNews(refreshMs = 10 * 60_000) {
  const [items, setItems] = useState<FinnhubNewsItem[]>(() => _cache ?? loadSessionCache() ?? [])

  useEffect(() => {
    if (!KEY) return
    let cancelled = false

    async function load() {
      // Use in-memory cache if fresh (StrictMode guard — prevents double fetch)
      if (_cache && Date.now() - _lastFetch < 30_000) {
        setItems(_cache)
        return
      }
      // Use session cache if rate limit was hit earlier today
      const session = loadSessionCache()
      if (session && Date.now() - _lastFetch < 30_000) {
        setItems(session)
        return
      }
      try {
        const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${TOPICS}&limit=50&sort=LATEST&apikey=${KEY}`
        const res = await fetch(url)
        const data = await res.json()
        // Rate limited or premium required — fall back to session cache silently
        if (data.Information || data.Note) {
          const fallback = loadSessionCache()
          if (fallback && !cancelled) setItems(fallback)
          return
        }
        if (cancelled) return
        const feed: AVFeedItem[] = data.feed ?? []
        const mapped = feed.map(toFinnhubItem)
        _cache = mapped
        _lastFetch = Date.now()
        saveSessionCache(mapped)
        setItems(mapped)
      } catch (e) {
        console.error('[AV]', e)
      }
    }

    load()
    const id = setInterval(load, refreshMs)
    return () => { cancelled = true; clearInterval(id) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return items
}
