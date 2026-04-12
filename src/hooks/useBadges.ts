import { useMemo } from 'react'
import type { Trade } from '../types/trade'
import type { Challenge, PropFirm } from '../types/propfirm'
import type { Badge, BadgeCategory, BadgeColour, BadgeSource } from '../types/badges'
import { calculateBadges } from '../utils/calculateBadges'

// ── User profile shape (badge-relevant fields) ────────────────────────────────

export type MethodologyKey =
  | 'PRICE_ACTION'
  | 'ICT_SMC'
  | 'WYCKOFF'
  | 'ELLIOTT'
  | 'FUNDAMENTAL'
  | 'OPTIONS_FLOW'
  | 'QUANT_ALGO'
  | 'SUPPLY_DEMAND'

export type MarketKey =
  | 'FX'
  | 'EQUITIES'
  | 'CRYPTO'
  | 'OPTIONS'
  | 'FUTURES'
  | 'COMMODITIES'

export interface UserProfile {
  id?:            string
  methodologies?: MethodologyKey[]
  markets?:       MarketKey[]
}

// ── Label maps ────────────────────────────────────────────────────────────────

export const METHODOLOGY_LABELS: Record<MethodologyKey, string> = {
  PRICE_ACTION:  'Price action',
  ICT_SMC:       'ICT / SMC',
  WYCKOFF:       'Wyckoff',
  ELLIOTT:       'Elliott wave',
  FUNDAMENTAL:   'Fundamental',
  OPTIONS_FLOW:  'Options flow',
  QUANT_ALGO:    'Quant / Algo',
  SUPPLY_DEMAND: 'Supply & demand',
}

export const MARKET_LABELS: Record<MarketKey, string> = {
  FX:          'FX',
  EQUITIES:    'Equities',
  CRYPTO:      'Crypto',
  OPTIONS:     'Options',
  FUTURES:     'Futures',
  COMMODITIES: 'Commodities',
}

// ── Prop firm colour map ──────────────────────────────────────────────────────

function getFirmColour(firm: PropFirm): BadgeColour {
  const f = firm.toUpperCase()
  if (f === 'FTMO')                              return 'blue'
  if (f === 'TFT')                               return 'purple'
  if (f === 'APEX' || firm === 'Apex')           return 'amber'
  if (f === 'E8')                                return 'green'
  if (f === 'FUNDEDNEXT' || firm === 'FundedNext') return 'blue'
  return 'blue'
}

// ── LocalStorage cache ────────────────────────────────────────────────────────

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface BadgeCache {
  autoBadges: Badge[]
  timestamp:  number
  tradeCount: number
}

function readCache(userId: string): BadgeCache | null {
  try {
    const raw = localStorage.getItem(`badges-${userId}`)
    if (!raw) return null
    const cache: BadgeCache = JSON.parse(raw)
    if (Date.now() - cache.timestamp > CACHE_TTL) return null
    return cache
  } catch {
    return null
  }
}

function writeCache(userId: string, autoBadges: Badge[], tradeCount: number): void {
  try {
    const cache: BadgeCache = { autoBadges, timestamp: Date.now(), tradeCount }
    localStorage.setItem(`badges-${userId}`, JSON.stringify(cache))
  } catch {
    // Ignore storage quota errors
  }
}

// ── useBadges ─────────────────────────────────────────────────────────────────

interface UseBadgesResult {
  allBadges:    Badge[]
  autoBadges:   Badge[]   // green — from trades
  propBadges:   Badge[]   // blue/purple/green — from prop firm
  manualBadges: Badge[]   // gray — self-declared
  isLoading:    false
}

export function useBadges(
  trades:     Trade[],
  challenges: Challenge[],
  profile:    UserProfile,
): UseBadgesResult {
  return useMemo(() => {
    const userId = profile.id ?? 'anon'

    // ── Auto badges (cached) ──────────────────────────────────────────────────
    let autoBadges: Badge[] = []
    const cached = readCache(userId)

    if (cached && cached.tradeCount === trades.length) {
      // Cache hit: trade count unchanged, TTL not expired
      autoBadges = cached.autoBadges
    } else {
      autoBadges = calculateBadges(trades)
      writeCache(userId, autoBadges, trades.length)
    }

    // ── Prop firm badges (challenges with 'passed' status = funded) ───────────
    const propBadges: Badge[] = challenges
      .filter(c => c.status === 'passed')
      .map(c => ({
        id:       `prop-${c.firm}-${c.id}`,
        label:    `${c.firm} funded`,
        category: 'PROP_FIRM' as BadgeCategory,
        source:   'PROP_FIRM' as BadgeSource,
        colour:   getFirmColour(c.firm),
        verified: true,
      }))

    // ── Manual badges ─────────────────────────────────────────────────────────
    const manualBadges: Badge[] = [
      ...(profile.methodologies ?? []).map(m => ({
        id:       `method-${m}`,
        label:    METHODOLOGY_LABELS[m],
        category: 'METHODOLOGY' as BadgeCategory,
        source:   'MANUAL' as BadgeSource,
        colour:   'gray' as BadgeColour,
        verified: false,
      })),
      ...(profile.markets ?? []).map(m => ({
        id:       `market-${m}`,
        label:    MARKET_LABELS[m],
        category: 'MARKETS' as BadgeCategory,
        source:   'MANUAL' as BadgeSource,
        colour:   'gray' as BadgeColour,
        verified: false,
      })),
    ]

    const allBadges = [...autoBadges, ...propBadges, ...manualBadges]

    return { allBadges, autoBadges, propBadges, manualBadges, isLoading: false }
  }, [trades, challenges, profile])
}
