import type { Trade } from '../types/trade'
import type { Badge } from '../types/badges'

// ── Session boundaries (UTC hours) ───────────────────────────────────────────

const SESSION_RANGES: Array<{ name: string; start: number; end: number }> = [
  { name: 'London',   start: 8,  end: 16 },
  { name: 'New York', start: 13, end: 21 },
  { name: 'Asia',     start: 0,  end: 8  },
]

function getTradeSession(openedAt: string): string | null {
  const utcHour = new Date(openedAt).getUTCHours()
  // Priority: London first (covers 13-16 overlap with NY)
  for (const s of SESSION_RANGES) {
    if (utcHour >= s.start && utcHour < s.end) return s.name
  }
  return null
}

// ── Instrument classification ─────────────────────────────────────────────────

type InstrumentClass = 'FX' | 'STOCKS' | 'INDICES' | 'CRYPTO' | 'COMMODITIES'

const COMMODITY_PATTERNS = ['GOLD', 'XAUUSD', 'OIL', 'WTI', 'SILVER', 'XAGUSD']

function classifyInstrument(trade: Trade): InstrumentClass | null {
  const sym = trade.symbol.toUpperCase()

  // Commodities first (some overlap with FX symbols like XAUUSD)
  if (COMMODITY_PATTERNS.some(c => sym.includes(c))) return 'COMMODITIES'

  // Use the existing instrument field for the rest
  switch (trade.instrument) {
    case 'FX':      return 'FX'
    case 'STOCKS':  return 'STOCKS'
    case 'INDICES': return 'INDICES'
    case 'CRYPTO':  return 'CRYPTO'
    default:        return null
  }
}

const INSTRUMENT_LABELS: Record<InstrumentClass, string> = {
  FX:          'FX',
  STOCKS:      'US stocks',
  INDICES:     'Indices',
  CRYPTO:      'Crypto',
  COMMODITIES: 'Commodities',
}

// ── Setup labels ──────────────────────────────────────────────────────────────

const SETUP_LABELS: Record<string, string> = {
  BREAKOUT:     'Breakout',
  TREND_FOLLOW: 'Trend follow',
  REVERSAL:     'Reversal',
  RANGE:        'Range',
  NEWS:         'News',
  SCALP:        'Scalp',
}

// ── Win/loss helper ───────────────────────────────────────────────────────────

interface Bucket {
  wins:  number
  total: number
}

function winRate(b: Bucket): number {
  return b.total === 0 ? 0 : (b.wins / b.total) * 100
}

// ── Session badge ─────────────────────────────────────────────────────────────

function calculateSessionBadge(trades: Trade[]): Badge | null {
  const buckets: Record<string, Bucket> = {
    London:     { wins: 0, total: 0 },
    'New York': { wins: 0, total: 0 },
    Asia:       { wins: 0, total: 0 },
  }

  for (const t of trades) {
    const session = getTradeSession(t.openedAt)
    if (!session) continue
    buckets[session].total++
    if (t.pnl > 0) buckets[session].wins++
  }

  // Priority order for tie-breaking
  const priority = ['London', 'New York', 'Asia']
  let bestSession: string | null = null
  let bestRate = -1

  for (const session of priority) {
    const b = buckets[session]
    if (b.total < 10) continue
    const rate = winRate(b)
    if (rate > bestRate) {
      bestRate     = rate
      bestSession  = session
    }
  }

  if (!bestSession) return null

  const wr = Math.round(bestRate)
  return {
    id:       `session-${bestSession.toLowerCase().replace(' ', '-')}`,
    label:    bestSession,
    category: 'SESSION',
    source:   'MT5',
    colour:   'green',
    verified: true,
    value:    wr,
    sublabel: `${wr}% WR`,
  }
}

// ── Instrument badge ──────────────────────────────────────────────────────────

function calculateInstrumentBadge(trades: Trade[]): Badge | null {
  const buckets: Partial<Record<InstrumentClass, Bucket>> = {}

  for (const t of trades) {
    const cls = classifyInstrument(t)
    if (!cls) continue
    if (!buckets[cls]) buckets[cls] = { wins: 0, total: 0 }
    buckets[cls]!.total++
    if (t.pnl > 0) buckets[cls]!.wins++
  }

  let bestClass: InstrumentClass | null = null
  let bestRate = -1

  for (const [cls, b] of Object.entries(buckets) as [InstrumentClass, Bucket][]) {
    if (b.total < 5) continue
    const rate = winRate(b)
    if (rate > bestRate) {
      bestRate  = rate
      bestClass = cls
    }
  }

  if (!bestClass) return null

  const wr = Math.round(bestRate)
  return {
    id:       `instrument-${bestClass.toLowerCase()}`,
    label:    INSTRUMENT_LABELS[bestClass],
    category: 'INSTRUMENT',
    source:   'MT5',
    colour:   'green',
    verified: true,
    value:    wr,
    sublabel: `${wr}% WR`,
  }
}

// ── Style badge ───────────────────────────────────────────────────────────────

const MS_15_MIN  =     900_000
const MS_24_HOUR =  86_400_000
const MS_14_DAYS = 1_209_600_000

function calculateStyleBadge(trades: Trade[]): Badge | null {
  if (trades.length < 20) return null

  const totalMs   = trades.reduce((sum, t) => sum + (t.durationMs ?? 0), 0)
  const avgMs     = totalMs / trades.length

  let label: string
  if (avgMs < MS_15_MIN)      label = 'Scalper'
  else if (avgMs < MS_24_HOUR) label = 'Day trader'
  else if (avgMs < MS_14_DAYS) label = 'Swing trader'
  else                         label = 'Position trader'

  return {
    id:       `style-${label.toLowerCase().replace(' ', '-')}`,
    label,
    category: 'STYLE',
    source:   'MT5',
    colour:   'green',
    verified: true,
  }
}

// ── Setup badge ───────────────────────────────────────────────────────────────

function calculateSetupBadge(trades: Trade[]): Badge | null {
  const buckets: Record<string, Bucket> = {}

  for (const t of trades) {
    if (!t.setupType) continue
    if (!buckets[t.setupType]) buckets[t.setupType] = { wins: 0, total: 0 }
    buckets[t.setupType].total++
    if (t.pnl > 0) buckets[t.setupType].wins++
  }

  let bestSetup: string | null = null
  let bestRate = -1

  for (const [setup, b] of Object.entries(buckets)) {
    if (b.total < 10) continue
    const rate = winRate(b)
    if (rate > bestRate) {
      bestRate  = rate
      bestSetup = setup
    }
  }

  if (!bestSetup) return null

  const wr = Math.round(bestRate)
  return {
    id:       `setup-${bestSetup.toLowerCase()}`,
    label:    SETUP_LABELS[bestSetup] ?? bestSetup,
    category: 'SETUP',
    source:   'MT5',
    colour:   'green',
    verified: true,
    value:    wr,
    sublabel: `${wr}% WR`,
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function calculateBadges(trades: Trade[]): Badge[] {
  const badges: Badge[] = []

  const sessionBadge = calculateSessionBadge(trades)
  if (sessionBadge) badges.push(sessionBadge)

  const instrumentBadge = calculateInstrumentBadge(trades)
  if (instrumentBadge) badges.push(instrumentBadge)

  const styleBadge = calculateStyleBadge(trades)
  if (styleBadge) badges.push(styleBadge)

  const setupBadge = calculateSetupBadge(trades)
  if (setupBadge) badges.push(setupBadge)

  return badges
}
