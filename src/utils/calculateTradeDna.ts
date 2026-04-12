import type { ClosedTrade, TradeDna, SessionStats, SetupStats, InstrumentStats } from '../types/tradeDna'

// Session windows (UTC hour, inclusive start, exclusive end)
// London/NY overlap 12-16 → assigned to London (opened first)
function getSession(openTime: string): 'London' | 'New York' | 'Asia' {
  const hour = new Date(openTime).getUTCHours()
  if (hour >= 7 && hour < 16) return 'London'
  if (hour >= 16 && hour < 21) return 'New York'
  return 'Asia'
}

function categorizeInstrument(symbol: string): string {
  const s = symbol.toUpperCase().replace('/', '')
  const fxPairs = ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','NZDUSD','USDCAD',
                   'EURGBP','EURJPY','GBPJPY','AUDCAD','AUDNZD','CADJPY']
  if (fxPairs.some(p => s.startsWith(p.slice(0,3)) && s.length === 6)) return 'FX Majors'
  if (['AAPL','MSFT','NVDA','GOOGL','GOOG','META','AMZN','TSLA','AMD','INTC','NFLX'].includes(s)) return 'US Tech'
  if (['NAS100','US100','NDX','SPX','SPY','QQQ','ES','NQ','DAX','FTSE','DOW30'].includes(s)) return 'Indices'
  if (s.includes('BTC') || s.includes('ETH') || s.includes('SOL') ||
      s.includes('BNB') || s.includes('XRP') || s.includes('ADA')) return 'Crypto'
  return 'Other'
}

function winRate(trades: ClosedTrade[]): number {
  if (trades.length === 0) return 0
  return (trades.filter(t => t.outcome === 'win').length / trades.length) * 100
}

export function calculateTradeDna(trades: ClosedTrade[]): Partial<TradeDna> | null {
  if (trades.length < 10) return null

  // ── Sessions ──────────────────────────────────────────────────────────────
  const bySession: Record<string, ClosedTrade[]> = { London: [], 'New York': [], Asia: [] }
  for (const t of trades) {
    bySession[getSession(t.openTime)].push(t)
  }
  const sessions: SessionStats[] = (Object.entries(bySession) as [SessionStats['session'], ClosedTrade[]][])
    .filter(([, ts]) => ts.length >= 5)
    .map(([session, ts]) => ({
      session,
      winRate: Math.round(winRate(ts)),
      tradeCount: ts.length,
    }))
    .sort((a, b) => b.winRate - a.winRate)

  // ── Instruments ────────────────────────────────────────────────────────────
  const byInstrument: Record<string, ClosedTrade[]> = {}
  for (const t of trades) {
    const cat = categorizeInstrument(t.symbol)
    ;(byInstrument[cat] ??= []).push(t)
  }
  const instruments: InstrumentStats[] = Object.entries(byInstrument)
    .filter(([, ts]) => ts.length >= 3)
    .map(([instrument, ts]) => ({
      instrument,
      winRate: Math.round(winRate(ts)),
      tradeCount: ts.length,
    }))
    .sort((a, b) => b.winRate - a.winRate)

  // ── Setups ─────────────────────────────────────────────────────────────────
  const bySetup: Record<string, ClosedTrade[]> = {}
  for (const t of trades) {
    const setup = t.setupTag ?? 'Untagged'
    ;(bySetup[setup] ??= []).push(t)
  }
  const setups: SetupStats[] = Object.entries(bySetup)
    .filter(([, ts]) => ts.length >= 3)
    .map(([setup, ts]) => ({
      setup,
      winRate: Math.round(winRate(ts)),
      tradeCount: ts.length,
    }))
    .sort((a, b) => b.winRate - a.winRate)

  // ── Risk stats ─────────────────────────────────────────────────────────────
  const withRisk = trades.filter(t => t.riskPercent != null)
  const avgRiskPercent = withRisk.length > 0
    ? withRisk.reduce((s, t) => s + (t.riskPercent ?? 0), 0) / withRisk.length
    : 1.0
  const avgRR = trades.reduce((s, t) => s + t.rMultiple, 0) / trades.length

  // ── Streaks ────────────────────────────────────────────────────────────────
  let maxWinStreak = 0, maxLossStreak = 0, curWin = 0, curLoss = 0
  for (const t of trades) {
    if (t.outcome === 'win') {
      curWin++; curLoss = 0
      if (curWin > maxWinStreak) maxWinStreak = curWin
    } else {
      curLoss++; curWin = 0
      if (curLoss > maxLossStreak) maxLossStreak = curLoss
    }
  }

  return {
    tradeCount: trades.length,
    sessions,
    setups,
    instruments,
    avgRiskPercent: Math.round(avgRiskPercent * 10) / 10,
    avgRR: Math.round(avgRR * 10) / 10,
    maxWinStreak,
    maxLossStreak,
  }
}
