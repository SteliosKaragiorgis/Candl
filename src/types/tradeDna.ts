export interface ClosedTrade {
  id: string
  symbol: string
  direction: 'long' | 'short'
  outcome: 'win' | 'loss'
  rMultiple: number
  openTime: string    // ISO string UTC
  riskPercent?: number
  setupTag?: string
}

export interface SessionStats {
  session: 'London' | 'New York' | 'Asia'
  winRate: number
  tradeCount: number
}

export interface SetupStats {
  setup: string
  winRate: number
  tradeCount: number
}

export interface InstrumentStats {
  instrument: string
  winRate: number
  tradeCount: number
}

export interface DnaPattern {
  type: 'strength' | 'weakness'
  label: string
  description: string
  frequency?: string
  avgImpact?: string
}

export interface TradeDna {
  userId: string
  generatedAt: string
  tradeCount: number
  sessions: SessionStats[]
  setups: SetupStats[]
  instruments: InstrumentStats[]
  patterns: DnaPattern[]
  avgRiskPercent: number
  avgRR: number
  maxWinStreak: number
  maxLossStreak: number
  lastUpdated: string
}
