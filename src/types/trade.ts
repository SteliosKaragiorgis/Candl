export interface Trade {
  id: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  entry: number
  exit: number
  stopLoss?: number
  takeProfit?: number
  pnl: number
  rMultiple: number
  lotSize?: number
  duration: string        // formatted: "2h 14m"
  durationMs: number      // raw milliseconds for sorting
  openedAt: string        // ISO timestamp
  closedAt: string        // ISO timestamp
  source: 'MT5' | 'CSV' | 'MANUAL'
  instrument: 'FX' | 'STOCKS' | 'INDICES' | 'CRYPTO' | 'OTHER'
  isPublished: boolean
  postId?: string         // if published, links to the feed post
  narrative?: string      // user's private journal note
  emotion?: string        // emotion tag
  lesson?: string         // lesson learned
  setupType?: 'BREAKOUT' | 'TREND_FOLLOW' | 'REVERSAL' | 'RANGE' | 'NEWS' | 'SCALP'
}
