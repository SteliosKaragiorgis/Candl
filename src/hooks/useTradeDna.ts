import { useState, useEffect, useCallback } from 'react'
import type { TradeDna, ClosedTrade } from '../types/tradeDna'
import { calculateTradeDna } from '../utils/calculateTradeDna'
import { generateDnaPatterns } from '../utils/generateDnaPatterns'

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000   // 7 days

function loadCached(userId: string): TradeDna | null {
  try {
    const raw = localStorage.getItem(`candl_dna_${userId}`)
    return raw ? (JSON.parse(raw) as TradeDna) : null
  } catch {
    return null
  }
}

function saveCached(dna: TradeDna): void {
  try {
    localStorage.setItem(`candl_dna_${dna.userId}`, JSON.stringify(dna))
  } catch {
    // Storage quota exceeded — silently skip
  }
}

function isStale(dna: TradeDna, currentTradeCount: number): boolean {
  if (dna.tradeCount !== currentTradeCount) return true
  return Date.now() - new Date(dna.lastUpdated).getTime() > CACHE_TTL_MS
}

export function useTradeDna(userId: string, trades: ClosedTrade[]) {
  const [dna, setDna]         = useState<TradeDna | null>(() => loadCached(userId))
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const generateDna = useCallback(async () => {
    if (!trades || trades.length < 10) {
      setDna(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const stats = calculateTradeDna(trades)
      if (!stats) { setDna(null); return }

      const patterns = generateDnaPatterns(trades, stats)

      const newDna: TradeDna = {
        userId,
        generatedAt:    new Date().toISOString(),
        lastUpdated:    new Date().toISOString(),
        tradeCount:     trades.length,
        patterns,
        sessions:       stats.sessions    ?? [],
        setups:         stats.setups      ?? [],
        instruments:    stats.instruments ?? [],
        avgRiskPercent: stats.avgRiskPercent ?? 1.0,
        avgRR:          stats.avgRR          ?? 0,
        maxWinStreak:   stats.maxWinStreak   ?? 0,
        maxLossStreak:  stats.maxLossStreak  ?? 0,
      }

      setDna(newDna)
      saveCached(newDna)
    } catch {
      setError('Failed to generate Trade DNA')
    } finally {
      setLoading(false)
    }
  }, [userId, trades])

  useEffect(() => {
    if (!trades || trades.length < 10) {
      setDna(null)
      return
    }
    const cached = loadCached(userId)
    if (cached && !isStale(cached, trades.length)) {
      setDna(cached)
      return
    }
    generateDna()
  // Re-run whenever the trade count changes or the userId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, trades.length])

  return { dna, loading, error, refresh: generateDna }
}
