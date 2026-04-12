import type { ClosedTrade, DnaPattern, TradeDna } from '../types/tradeDna'

/**
 * Derives behavioural patterns from raw trade data using statistical heuristics.
 * In a production deployment this logic would be replaced by an Anthropic API call
 * (server-side, to keep the key out of the browser bundle).
 */
export function generateDnaPatterns(
  trades: ClosedTrade[],
  stats: Partial<TradeDna>,
): DnaPattern[] {
  const patterns: DnaPattern[] = []
  if (trades.length < 10) return patterns

  const totalWinRate = (trades.filter(t => t.outcome === 'win').length / trades.length) * 100

  // ── Weakness detection ────────────────────────────────────────────────────

  // Revenge trading: back-to-back losses in fast succession
  let revengeCount = 0
  for (let i = 1; i < trades.length; i++) {
    if (trades[i - 1].outcome === 'loss' && trades[i].outcome === 'loss') revengeCount++
  }
  const revengeRate = (revengeCount / Math.max(trades.length - 1, 1)) * 100
  if (revengeRate > 22) {
    patterns.push({
      type: 'weakness',
      label: 'Revenge Trading',
      description: 'Consecutive losses detected after prior loss — elevated emotional risk.',
      frequency: `${Math.round(revengeRate)}% of trades`,
      avgImpact: `-${((stats.avgRR ?? 1) * 0.9).toFixed(1)}R avg`,
    })
  }

  // Session drag: best session outperforms worst session by >20 pp
  const best = stats.sessions?.[0]
  const worst = stats.sessions?.[stats.sessions!.length - 1]
  if (best && worst && best !== worst && best.winRate - worst.winRate > 20) {
    patterns.push({
      type: 'weakness',
      label: `${worst.session} Drag`,
      description: `Win rate drops sharply in the ${worst.session} session — consider avoiding it.`,
      frequency: `${worst.tradeCount} trades`,
      avgImpact: `${worst.winRate}% WR`,
    })
  }

  // Drawdown spirals: long loss streaks combined with sub-55% win rate
  const maxLoss = stats.maxLossStreak ?? 0
  if (maxLoss >= 4 && totalWinRate < 55) {
    patterns.push({
      type: 'weakness',
      label: 'Drawdown Spirals',
      description: `${maxLoss}-trade loss streaks detected — review sizing under adverse conditions.`,
      frequency: `${maxLoss} consecutive`,
      avgImpact: 'compounds losses',
    })
  }

  // ── Strength detection ────────────────────────────────────────────────────

  // Session edge: best session >= 60%
  if (best && best.winRate >= 60) {
    patterns.push({
      type: 'strength',
      label: `${best.session} Edge`,
      description: `Consistently profitable in the ${best.session} session with disciplined execution.`,
      frequency: `${best.tradeCount} trades`,
      avgImpact: `${best.winRate}% WR`,
    })
  }

  // Momentum riding: long win streaks
  const maxWin = stats.maxWinStreak ?? 0
  if (maxWin >= 5) {
    patterns.push({
      type: 'strength',
      label: 'Momentum Riding',
      description: `${maxWin}-trade win streaks show strong ability to press profitable setups.`,
      frequency: `${maxWin} consecutive`,
      avgImpact: `+${((stats.avgRR ?? 1) * 1.2).toFixed(1)}R avg`,
    })
  }

  // High R:R discipline: avg R >= 1.5 with at least 40% win rate
  const avgRR = stats.avgRR ?? 0
  if (avgRR >= 1.5 && totalWinRate >= 40) {
    patterns.push({
      type: 'strength',
      label: 'R:R Discipline',
      description: 'Consistently holds trades to target — excellent trade management and patience.',
      frequency: `${Math.round(totalWinRate)}% WR`,
      avgImpact: `+${avgRR.toFixed(1)}R avg`,
    })
  }

  // Best setup edge
  const topSetup = stats.setups?.[0]
  if (topSetup && topSetup.winRate >= 65 && topSetup.tradeCount >= 8) {
    patterns.push({
      type: 'strength',
      label: `${topSetup.setup} Mastery`,
      description: `${topSetup.setup} setups deliver a clear statistical edge — lean into this pattern.`,
      frequency: `${topSetup.tradeCount} trades`,
      avgImpact: `${topSetup.winRate}% WR`,
    })
  }

  // Return at most 2 weaknesses + 2 strengths
  const weaknesses = patterns.filter(p => p.type === 'weakness').slice(0, 2)
  const strengths  = patterns.filter(p => p.type === 'strength').slice(0, 2)
  return [...weaknesses, ...strengths]
}
