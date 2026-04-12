export type PostType =
  | 'TRADE'
  | 'INVEST'
  | 'COMMENTARY'
  | 'PROP_FIRM'
  | 'WEEKLY_RECAP'

export interface PostAuthor {
  id: string
  displayName: string
  handle: string
  avatarInitials: string
  bio?: string
  isVerified: boolean
  isMT5Connected: boolean
  // Optional author-level stats shown on the dark trade card watermark
  winRate?: number      // e.g. 74
  totalTrades?: number  // e.g. 312
  avgRR?: number        // e.g. 1.8
}

export interface TradeData {
  symbol: string
  direction: 'LONG' | 'SHORT'
  entry: number
  exit: number
  stopLoss?: number
  takeProfit?: number
  pnl: number
  rMultiple: number
  timeframe: string
  duration: string
  source: 'MT5' | 'CSV' | 'MANUAL'
  openedAt?: string
  closedAt?: string
}

export interface InvestData {
  symbol: string
  stance: 'BULLISH' | 'BEARISH'
  entry: number
  target?: number
  stop?: number
  horizon?: string
  thesis: string
}

export interface PropFirmData {
  firm: 'FTMO' | 'TFT' | 'APEX' | 'E8' | 'FUNDEDNEXT'
  accountSize: string
  phase: string
  result: 'PASSED' | 'FAILED'
  daysUsed: number
  finalPnl: number
  winRate: number
  avgRR: number
  lesson?: string
  whatIllDoDifferently?: string
}

export interface WeeklyRecapData {
  weekOf: string
  totalPnl: number
  winRate: number
  avgRR: number
  tradeCount: number
  narrative: string
  generatedAt: string
}

export interface Post {
  id: string
  type: PostType
  author: PostAuthor
  body?: string
  createdAt: string
  likes: number
  comments: number
  isLiked: boolean
  isPinned?: boolean

  tradeData?: TradeData
  investData?: InvestData
  propFirmData?: PropFirmData
  recapData?: WeeklyRecapData
  lesson?: string
  rule?: string        // new trading rule the author commits to after the loss
  setupType?: string   // e.g. "Breakout", "Trend follow", "Reversal"
}
