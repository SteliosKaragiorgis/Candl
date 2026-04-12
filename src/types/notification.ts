export type NotificationType =
  | 'TRADE_DETECTED'
  | 'TRADE_LIKED'
  | 'TRADE_COMMENTED'
  | 'TRADE_SHARED'
  | 'NEW_FOLLOWER'
  | 'PROP_MILESTONE'
  | 'DNA_UPDATED'
  | 'WEEKLY_RECAP'
  | 'SYSTEM'

export type NotificationCategory =
  | 'TRADES'
  | 'SOCIAL'
  | 'SYSTEM'

export interface Notification {
  id: string
  type: NotificationType
  category: NotificationCategory
  isRead: boolean
  createdAt: string

  actor?: {
    id: string
    displayName: string
    handle: string
    avatarInitials: string
    bio?: string
    followerCount?: number
    isFollowing: boolean
  }

  trade?: {
    id: string
    symbol: string
    direction: 'LONG' | 'SHORT'
    pnl: number
    rMultiple: number
    entry: number
    exit: number
    postId?: string
  }

  commentText?: string
  recapStats?: {
    totalPnl: number
    winRate: number
    tradeCount: number
    weekOf: string
  }
  dnaHighlights?: {
    topSession: string
    topSessionWR: number
    topSetup: string
    topSetupWR: number
    newPatternCount: number
    totalTrades: number
  }
  propMilestone?: {
    firm: string
    phase: string
    result: 'PASSED' | 'FAILED'
    daysUsed: number
    winRate: number
  }

  actorCount?: number
  additionalActors?: string[]
}
