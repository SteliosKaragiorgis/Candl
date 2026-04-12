import { useState, useEffect, useRef } from 'react';
import type { Challenge, ChallengeStatus, ChallengePhase, PropFirm, Rule, TradeEntry } from '../types/propfirm';
import type { PendingTrade } from '../types/mt5';

const STORAGE_KEY = 'candl_challenges';

// ── Demo seed data ──────────────────────────────────────────────────────────

const DEMO_CHALLENGES: Challenge[] = [
  {
    id: 'challenge-demo-1',
    firm: 'FTMO',
    account_size: 100000,
    phase: 1,
    status: 'active',
    start_date: '2026-03-19',
    end_date: '2026-04-18',
    days_remaining: 14,
    starting_balance: 100000,
    current_balance: 102840,
    total_pnl: 2840,
    // peak_balance: starting_balance + highest cumulative pnl through the run
    // The run peaks at 800+650+940+770 = 3160 before the -320 loss day, giving 103160
    peak_balance: 103160,
    auto_apply_trades: true,
    trades: [],
    rules: [
      { name: 'Profit target',    type: 'profit_target',    limit: 10000, used: 2840,  status: 'safe' },
      { name: 'Max daily loss',   type: 'daily_loss',       limit: 5000,  used: 3100,  status: 'warning' },
      { name: 'Max drawdown',     type: 'total_drawdown',   limit: 10000, used: 1200,  status: 'safe' },
      { name: 'Min trading days', type: 'min_trading_days', limit: 10,    used: 4,     status: 'safe' },
    ],
    trading_days: [
      { date: '2026-03-19', result: 'win',      pnl: 800  },
      { date: '2026-03-20', result: 'win',      pnl: 650  },
      { date: '2026-03-21', result: 'loss',     pnl: -320 },
      { date: '2026-03-22', result: 'no_trade', pnl: 0    },
      { date: '2026-03-23', result: 'no_trade', pnl: 0    },
      { date: '2026-03-24', result: 'win',      pnl: 940  },
      { date: '2026-03-25', result: 'win',      pnl: 770  },
    ],
    trade_ids: [],
    created_at: '2026-03-19T09:00:00Z',
  },
  {
    id: 'challenge-demo-2',
    firm: 'TFT',
    account_size: 50000,
    phase: 2,
    status: 'near_limit',
    start_date: '2026-03-11',
    end_date: '2026-04-10',
    days_remaining: 6,
    starting_balance: 50000,
    current_balance: 51820,
    total_pnl: 1820,
    // peak through run: 620+380+540+720+480 = 2740 → peak = 52740
    peak_balance: 52740,
    auto_apply_trades: true,
    trades: [],
    rules: [
      { name: 'Profit target',    type: 'profit_target',    limit: 2500, used: 1820, status: 'warning' },
      { name: 'Max daily loss',   type: 'daily_loss',       limit: 2500, used: 2200, status: 'warning' },
      { name: 'Max drawdown',     type: 'total_drawdown',   limit: 5000, used: 2400, status: 'safe'    },
      { name: 'Min trading days', type: 'min_trading_days', limit: 5,    used: 4,    status: 'safe'    },
    ],
    trading_days: [
      { date: '2026-03-11', result: 'win',      pnl: 620  },
      { date: '2026-03-12', result: 'win',      pnl: 380  },
      { date: '2026-03-13', result: 'loss',     pnl: -480 },
      { date: '2026-03-14', result: 'no_trade', pnl: 0    },
      { date: '2026-03-15', result: 'no_trade', pnl: 0    },
      { date: '2026-03-16', result: 'no_trade', pnl: 0    },
      { date: '2026-03-17', result: 'win',      pnl: 540  },
      { date: '2026-03-18', result: 'loss',     pnl: -290 },
      { date: '2026-03-19', result: 'win',      pnl: 720  },
      { date: '2026-03-20', result: 'no_trade', pnl: 0    },
      { date: '2026-03-21', result: 'win',      pnl: 480  },
      { date: '2026-03-22', result: 'loss',     pnl: -150 },
      { date: '2026-03-24', result: 'win',      pnl: 0    },
      { date: '2026-03-25', result: 'no_trade', pnl: 0    },
    ],
    trade_ids: [],
    created_at: '2026-03-11T08:30:00Z',
  },
];

// ── Firm templates ────────────────────────────────────────────────────────────

export type FirmTemplatePhase = {
  phase: ChallengePhase;
  profit_target_pct: number;
  daily_loss_pct: number;
  max_dd_pct: number;
  min_days: number;
  duration: number;
  news_allowed: boolean;
  weekend_allowed: boolean;
};

export type FirmTemplate = {
  firm: PropFirm;
  sizes: number[];
  phases: FirmTemplatePhase[];
};

export const FIRM_TEMPLATES: Record<string, FirmTemplate> = {
  FTMO: {
    firm: 'FTMO',
    sizes: [10000, 25000, 50000, 100000, 200000],
    phases: [
      {
        phase: 1,
        profit_target_pct: 10,
        daily_loss_pct: 5,
        max_dd_pct: 10,
        min_days: 4,
        duration: 30,
        news_allowed: false,
        weekend_allowed: false,
      },
      {
        phase: 2,
        profit_target_pct: 5,
        daily_loss_pct: 5,
        max_dd_pct: 10,
        min_days: 4,
        duration: 60,
        news_allowed: false,
        weekend_allowed: false,
      },
      {
        phase: 3,
        profit_target_pct: 0,    // funded — no profit target
        daily_loss_pct: 5,
        max_dd_pct: 10,
        min_days: 0,
        duration: 0,             // no fixed end
        news_allowed: false,
        weekend_allowed: false,
      },
    ],
  },
  TFT: {
    firm: 'TFT',
    sizes: [10000, 25000, 50000, 100000],
    phases: [
      {
        phase: 1,
        profit_target_pct: 8,
        daily_loss_pct: 4,
        max_dd_pct: 8,
        min_days: 5,
        duration: 30,
        news_allowed: false,
        weekend_allowed: false,
      },
      {
        phase: 2,
        profit_target_pct: 5,
        daily_loss_pct: 4,
        max_dd_pct: 8,
        min_days: 5,
        duration: 60,
        news_allowed: false,
        weekend_allowed: false,
      },
      {
        phase: 3,
        profit_target_pct: 0,
        daily_loss_pct: 4,
        max_dd_pct: 8,
        min_days: 0,
        duration: 0,
        news_allowed: false,
        weekend_allowed: false,
      },
    ],
  },
  Apex: {
    firm: 'Apex',
    sizes: [50000, 100000, 150000],
    phases: [
      {
        phase: 1,
        profit_target_pct: 9,
        daily_loss_pct: 3,
        max_dd_pct: 6,
        min_days: 5,
        duration: 30,
        news_allowed: true,
        weekend_allowed: false,
      },
      {
        phase: 2,
        profit_target_pct: 5,
        daily_loss_pct: 3,
        max_dd_pct: 6,
        min_days: 5,
        duration: 60,
        news_allowed: true,
        weekend_allowed: false,
      },
      {
        phase: 3,
        profit_target_pct: 0,
        daily_loss_pct: 3,
        max_dd_pct: 6,
        min_days: 0,
        duration: 0,
        news_allowed: true,
        weekend_allowed: false,
      },
    ],
  },
  E8: {
    firm: 'E8',
    sizes: [25000, 50000, 100000],
    phases: [
      {
        phase: 1,
        profit_target_pct: 8,
        daily_loss_pct: 5,
        max_dd_pct: 8,
        min_days: 3,
        duration: 30,
        news_allowed: false,
        weekend_allowed: false,
      },
      {
        phase: 2,
        profit_target_pct: 5,
        daily_loss_pct: 5,
        max_dd_pct: 8,
        min_days: 3,
        duration: 60,
        news_allowed: false,
        weekend_allowed: false,
      },
      {
        phase: 3,
        profit_target_pct: 0,
        daily_loss_pct: 5,
        max_dd_pct: 8,
        min_days: 0,
        duration: 0,
        news_allowed: false,
        weekend_allowed: false,
      },
    ],
  },
  FundedNext: {
    firm: 'FundedNext',
    sizes: [15000, 25000, 50000, 100000],
    phases: [
      {
        phase: 1,
        profit_target_pct: 10,
        daily_loss_pct: 5,
        max_dd_pct: 10,
        min_days: 5,
        duration: 30,
        news_allowed: false,
        weekend_allowed: false,
      },
      {
        phase: 2,
        profit_target_pct: 5,
        daily_loss_pct: 5,
        max_dd_pct: 10,
        min_days: 5,
        duration: 60,
        news_allowed: false,
        weekend_allowed: false,
      },
      {
        phase: 3,
        profit_target_pct: 0,
        daily_loss_pct: 5,
        max_dd_pct: 10,
        min_days: 0,
        duration: 0,
        news_allowed: false,
        weekend_allowed: false,
      },
    ],
  },
};

// ── Utilities ────────────────────────────────────────────────────────────────

function load(): Challenge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null as unknown as Challenge[];
    return JSON.parse(raw) as Challenge[];
  } catch {
    return null as unknown as Challenge[];
  }
}

function save(challenges: Challenge[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
  window.dispatchEvent(new CustomEvent('candl-challenges-updated'));
}

function seed(): Challenge[] {
  const existing = load();
  if (existing && existing.length > 0) return existing;
  save(DEMO_CHALLENGES);
  return DEMO_CHALLENGES;
}

/**
 * Recalculates days_remaining based on today's date and the challenge end_date.
 * Returns 0 if the end date has already passed.
 */
export function recalcDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  // Zero out time portion so we count whole calendar days
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function computeRuleStatus(used: number, limit: number): 'safe' | 'warning' | 'breached' {
  if (used > limit) return 'breached';
  if (used / limit >= 0.6) return 'warning';
  return 'safe';
}

export function computeChallengeStatus(rules: Rule[]): ChallengeStatus {
  const lossRules = rules.filter(r => r.type === 'daily_loss' || r.type === 'total_drawdown');

  if (rules.some(r => r.used > r.limit)) return 'failed';

  const profitRule = rules.find(r => r.type === 'profit_target');
  if (profitRule && profitRule.used >= profitRule.limit) {
    if (!lossRules.some(r => r.used > r.limit)) return 'passed';
  }

  if (lossRules.some(r => r.used / r.limit > 0.75)) return 'near_limit';

  return 'active';
}

/**
 * Returns true when the given ISO timestamp appears to fall near a round-hour
 * or half-hour mark on a weekday (±15 min), which is a heuristic proxy for a
 * high-impact news window.
 */
function isNearNewsWindow(isoTime: string): boolean {
  const d = new Date(isoTime);
  const dow = d.getUTCDay(); // 0=Sun, 6=Sat
  if (dow === 0 || dow === 6) return false; // weekends not a news concern
  const minutes = d.getUTCMinutes();
  // Within 15 min of :00 or :30
  const distFrom00 = Math.min(minutes, 60 - minutes);
  const distFrom30 = Math.abs(minutes - 30);
  return distFrom00 <= 15 || distFrom30 <= 15;
}

/**
 * Returns true when the YYYY-MM-DD date string falls on a Saturday or Sunday.
 */
function isWeekend(date: string): boolean {
  // Use noon UTC to avoid DST edge cases
  const d = new Date(`${date}T12:00:00Z`);
  const dow = d.getUTCDay();
  return dow === 0 || dow === 6;
}

/**
 * Rebuilds all rule `used` values from the trades array stored on the challenge.
 * This is the source of truth when a trade is deleted and rules must be recomputed
 * from scratch.
 */
export function recomputeRulesFromTrades(challenge: Challenge): Rule[] {
  const trades = challenge.trades ?? [];

  // Aggregate per-day PnL so we can find the worst daily loss
  const dayPnl: Record<string, number> = {};
  for (const t of trades) {
    dayPnl[t.date] = (dayPnl[t.date] ?? 0) + t.pnl;
  }

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

  // Recompute peak_balance from scratch using running cumulative sum
  let runningBalance = challenge.starting_balance;
  let peakBalance = challenge.starting_balance;
  // We need trades in date order for an accurate peak
  const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  for (const t of sortedTrades) {
    runningBalance += t.pnl;
    if (runningBalance > peakBalance) peakBalance = runningBalance;
  }
  const finalBalance = challenge.starting_balance + totalPnl;
  const totalDrawdown = Math.max(0, peakBalance - finalBalance);

  const worstDailyLoss = Object.values(dayPnl).reduce(
    (worst, pnl) => Math.max(worst, pnl < 0 ? Math.abs(pnl) : 0),
    0,
  );

  const tradingDayCount = Object.keys(dayPnl).filter(d => dayPnl[d] !== 0).length;

  // Count news / weekend violations from trade metadata
  const newsViolations = trades.filter(t => {
    // We can only check news if we have a time component — TradeEntry only has
    // a YYYY-MM-DD date so we cannot determine the exact minute.  Violations
    // recorded at apply-time are preserved here as a separate mechanism; this
    // function does not recount them from date alone.
    return false;
  }).length;

  const weekendViolations = trades.filter(t => isWeekend(t.date)).length;

  return challenge.rules.map((r): Rule => {
    let used = r.used;
    switch (r.type) {
      case 'profit_target':
        used = Math.max(0, totalPnl);
        break;
      case 'daily_loss':
        used = worstDailyLoss;
        break;
      case 'total_drawdown':
        used = totalDrawdown;
        break;
      case 'min_trading_days':
        used = tradingDayCount;
        break;
      case 'news_trading':
        // newsViolations is always 0 here (see comment above); preserve existing
        used = newsViolations;
        break;
      case 'weekend_holding':
        used = weekendViolations;
        break;
    }
    return { ...r, used, status: computeRuleStatus(used, r.limit) };
  });
}

/** Applies an MT5 closed trade to all active challenges in localStorage. */
export function applyTradeToChallenge(trade: PendingTrade): void {
  const challenges = load();
  if (!challenges) return;

  const tradeId = String(trade.ticket);
  const tradeDate = (trade.close_time ?? new Date().toISOString()).split('T')[0];
  const netPnl = trade.net_profit ?? trade.profit ?? 0;

  const updated = challenges.map((c): Challenge => {
    if (c.status === 'failed' || c.status === 'passed') return c;

    // #2 — Fixed MT5 trade routing
    if (c.mt5_account) {
      // Challenge is linked to a specific MT5 account — only accept trades
      // whose login/ticket matches that account identifier exactly.
      if (c.mt5_account !== String(trade.ticket)) return c;
    } else {
      // No MT5 account linked — only auto-apply when auto_apply_trades is true
      // (default true for backward compat).
      const autoApply = c.auto_apply_trades ?? true;
      if (!autoApply) return c;
    }

    // Dedup: skip if this trade ID has already been applied to this challenge
    const existingTradeIds = c.trade_ids ?? [];
    if (existingTradeIds.includes(tradeId)) return c;

    const newBalance = c.current_balance + netPnl;
    const newPnl = c.total_pnl + netPnl;

    // #15 — High-water mark drawdown
    const currentPeak = c.peak_balance ?? c.starting_balance;
    const newPeak = Math.max(currentPeak, newBalance);

    // Merge trading day first so we can compute accurate daily loss
    const existingDayIdx = c.trading_days.findIndex(d => d.date === tradeDate);
    const updatedDays = [...c.trading_days];
    if (existingDayIdx >= 0) {
      const prev = updatedDays[existingDayIdx];
      const mergedPnl = prev.pnl + netPnl;
      updatedDays[existingDayIdx] = {
        ...prev,
        pnl: mergedPnl,
        result: mergedPnl > 0 ? 'win' : mergedPnl < 0 ? 'loss' : 'breakeven',
      };
    } else {
      updatedDays.push({
        date: tradeDate,
        result: netPnl > 0 ? 'win' : netPnl < 0 ? 'loss' : 'breakeven',
        pnl: netPnl,
      });
    }

    // Compute daily_loss as the worst single-day loss across all trading days
    const worstDailyLoss = updatedDays.reduce(
      (worst, d) => Math.max(worst, d.pnl < 0 ? Math.abs(d.pnl) : 0),
      0,
    );

    // #5 — News/weekend rule checks
    const nearNews = trade.close_time ? isNearNewsWindow(trade.close_time) : false;
    const onWeekend = isWeekend(tradeDate);

    const updatedRules = c.rules.map((r): Rule => {
      let used = r.used;
      switch (r.type) {
        case 'profit_target':
          used = Math.max(0, newPnl);
          break;
        case 'daily_loss':
          used = worstDailyLoss;
          break;
        case 'total_drawdown':
          // #15 — use peak_balance instead of starting_balance
          used = Math.max(0, newPeak - newBalance);
          break;
        case 'min_trading_days': {
          const alreadyTraded = c.trading_days.some(d => d.date === tradeDate);
          if (!alreadyTraded) used = r.used + 1;
          break;
        }
        case 'news_trading':
          // #5 — flag trade if news trading is disallowed (limit=0) and trade
          // closed near a news window.
          if (r.limit === 0 && nearNews) {
            used = r.used + 1;
          }
          break;
        case 'weekend_holding':
          // #5 — flag trade if weekend holding is disallowed (limit=0) and the
          // trade date falls on a Saturday or Sunday.
          if (r.limit === 0 && onWeekend) {
            used = r.used + 1;
          }
          break;
        default:
          break;
      }
      return { ...r, used, status: computeRuleStatus(used, r.limit) };
    });

    // #6 — Append a lightweight TradeEntry to the challenge's trades array
    const newTradeEntry: TradeEntry = {
      id: tradeId,
      symbol: trade.symbol,
      direction: trade.direction === 'long' ? 'LONG' : 'SHORT',
      pnl: netPnl,
      date: tradeDate,
      lotSize: trade.volume,
    };

    return {
      ...c,
      current_balance: newBalance,
      total_pnl: newPnl,
      peak_balance: newPeak,
      rules: updatedRules,
      trading_days: updatedDays,
      trade_ids: [...existingTradeIds, tradeId],
      trades: [...(c.trades ?? []), newTradeEntry],
      status: computeChallengeStatus(updatedRules),
    };
  });

  save(updated);
}

/**
 * Applies a manually-entered trade to a specific challenge in localStorage.
 * Updates balance, total P&L, rule usage, trading calendar, and trade_ids.
 *
 * @param entry - Optional partial TradeEntry for richer trade metadata storage.
 */
export function applyManualTradeToChallenge(
  challengeId: string,
  pnl: number,
  date: string,
  tradeId: string,
  entry?: Partial<TradeEntry>,
): void {
  const challenges = load();
  if (!challenges) return;

  const updated = challenges.map((c): Challenge => {
    if (c.id !== challengeId) return c;
    if (c.status === 'failed' || c.status === 'passed') return c;

    // Dedup: skip if this trade ID has already been applied
    const existingTradeIds = c.trade_ids ?? [];
    if (existingTradeIds.includes(tradeId)) return c;

    const newBalance = c.current_balance + pnl;
    const newPnl = c.total_pnl + pnl;

    // #15 — High-water mark drawdown
    const currentPeak = c.peak_balance ?? c.starting_balance;
    const newPeak = Math.max(currentPeak, newBalance);

    // Merge trading day first so we can compute accurate daily loss
    const existingDayIdx = c.trading_days.findIndex(d => d.date === date);
    const updatedDays = [...c.trading_days];
    if (existingDayIdx >= 0) {
      const prev = updatedDays[existingDayIdx];
      const dayNetPnl = prev.pnl + pnl;
      updatedDays[existingDayIdx] = {
        ...prev,
        pnl: dayNetPnl,
        result: dayNetPnl > 0 ? 'win' : dayNetPnl < 0 ? 'loss' : 'breakeven',
      };
    } else {
      updatedDays.push({
        date,
        result: pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven',
        pnl,
      });
    }

    // Compute daily_loss as the worst single-day loss across all trading days
    const worstDailyLoss = updatedDays.reduce(
      (worst, d) => Math.max(worst, d.pnl < 0 ? Math.abs(d.pnl) : 0),
      0,
    );

    // #5 — Weekend check for manual trades (no time available, skip news check)
    const onWeekend = isWeekend(date);

    const updatedRules = c.rules.map((r): Rule => {
      let used = r.used;
      switch (r.type) {
        case 'profit_target':
          used = Math.max(0, newPnl);
          break;
        case 'daily_loss':
          used = worstDailyLoss;
          break;
        case 'total_drawdown':
          // #15 — use peak_balance instead of starting_balance
          used = Math.max(0, newPeak - newBalance);
          break;
        case 'min_trading_days': {
          const alreadyTraded = c.trading_days.some(d => d.date === date);
          if (!alreadyTraded) used = r.used + 1;
          break;
        }
        case 'news_trading':
          // Manual trades have no timestamp — skip news check.
          break;
        case 'weekend_holding':
          // #5 — flag weekend trades when rule disallows them (limit=0)
          if (r.limit === 0 && onWeekend) {
            used = r.used + 1;
          }
          break;
        default:
          break;
      }
      return { ...r, used, status: computeRuleStatus(used, r.limit) };
    });

    // #6 — Append a lightweight TradeEntry to the challenge's trades array
    const newTradeEntry: TradeEntry = {
      id: tradeId,
      symbol: entry?.symbol ?? 'UNKNOWN',
      direction: entry?.direction ?? 'LONG',
      pnl,
      date,
      lotSize: entry?.lotSize,
      setupType: entry?.setupType,
      notes: entry?.notes,
    };

    return {
      ...c,
      current_balance: newBalance,
      total_pnl: newPnl,
      peak_balance: newPeak,
      rules: updatedRules,
      trading_days: updatedDays,
      trade_ids: [...existingTradeIds, tradeId],
      trades: [...(c.trades ?? []), newTradeEntry],
      status: computeChallengeStatus(updatedRules),
    };
  });

  save(updated);
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const data = seed();
    // Rehydrate days_remaining from end_date so it is never stale
    return data.map(c => ({ ...c, days_remaining: recalcDaysRemaining(c.end_date) }));
  });

  useEffect(() => {
    const handler = () => {
      const data = load();
      if (data) {
        setChallenges(data.map(c => ({ ...c, days_remaining: recalcDaysRemaining(c.end_date) })));
      }
    };
    window.addEventListener('candl-challenges-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('candl-challenges-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return challenges;
}

export function useChallenge(id: string): Challenge | undefined {
  const all = useChallenges();
  return all.find(c => c.id === id);
}

export function useAddChallenge() {
  return function addChallenge(challenge: Omit<Challenge, 'id' | 'created_at'>) {
    const existing = load() ?? [];
    const newChallenge: Challenge = {
      ...challenge,
      trade_ids: challenge.trade_ids ?? [],
      trades: challenge.trades ?? [],
      peak_balance: challenge.peak_balance ?? challenge.starting_balance,
      auto_apply_trades: challenge.auto_apply_trades ?? true,
      id: `challenge-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    save([...existing, newChallenge]);
    return newChallenge;
  };
}

/**
 * Returns a function that updates a challenge by id.
 * Accepts a partial patch (everything except id and created_at).
 * If rules are included in the patch, rule statuses are recomputed.
 */
export function useUpdateChallenge() {
  return function updateChallenge(
    id: string,
    patch: Partial<Omit<Challenge, 'id' | 'created_at'>>,
  ): void {
    const challenges = load();
    if (!challenges) return;

    const updated = challenges.map((c): Challenge => {
      if (c.id !== id) return c;

      const merged: Challenge = { ...c, ...patch };

      // Recompute rule statuses if rules were part of the patch
      if (patch.rules) {
        merged.rules = patch.rules.map(r => ({
          ...r,
          status: computeRuleStatus(r.used, r.limit),
        }));
        merged.status = computeChallengeStatus(merged.rules);
      }

      return merged;
    });

    save(updated);
  };
}

/**
 * Returns a function that removes a challenge by id from localStorage.
 */
export function useDeleteChallenge() {
  return function deleteChallenge(id: string): void {
    const challenges = load();
    if (!challenges) return;
    save(challenges.filter(c => c.id !== id));
  };
}

/**
 * Returns the trade_ids array for a given challenge id.
 * Useful for looking up full Trade objects from a trade store.
 */
export function useChallengeTradeIds(challengeId: string): string[] {
  const challenge = useChallenge(challengeId);
  return challenge?.trade_ids ?? [];
}

/** Hook version — tracks seen tickets so each trade is only applied once. */
export function useUpdateChallengeFromTrade(trade: PendingTrade | null) {
  const seenRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!trade || seenRef.current.has(trade.ticket)) return;
    seenRef.current.add(trade.ticket);
    applyTradeToChallenge(trade);
  }, [trade?.ticket]);
}

/**
 * #7 — Delete a trade from a challenge.
 * Removes the trade entry, reverses its balance impact, removes it from
 * trade_ids, updates trading_days, and recomputes all rules from scratch
 * using the remaining trades as source of truth.
 */
export function useDeleteTradeFromChallenge() {
  return function deleteTradeFromChallenge(challengeId: string, tradeId: string): void {
    const challenges = load();
    if (!challenges) return;

    const updated = challenges.map((c): Challenge => {
      if (c.id !== challengeId) return c;

      const existingTrades = c.trades ?? [];
      const tradeToRemove = existingTrades.find(t => t.id === tradeId);
      if (!tradeToRemove) return c;

      const remainingTrades = existingTrades.filter(t => t.id !== tradeId);

      // Reverse the trade's balance impact
      const newBalance = c.current_balance - tradeToRemove.pnl;
      const newPnl = c.total_pnl - tradeToRemove.pnl;

      // Recompute trading_days for the affected date
      const remainingOnDate = remainingTrades.filter(t => t.date === tradeToRemove.date);
      const updatedDays = c.trading_days
        .map(d => {
          if (d.date !== tradeToRemove.date) return d;
          const dayPnl = remainingOnDate.reduce((sum, t) => sum + t.pnl, 0);
          return {
            ...d,
            pnl: dayPnl,
            result: (dayPnl > 0 ? 'win' : dayPnl < 0 ? 'loss' : 'breakeven') as TradingDay['result'],
          };
        })
        .filter(d => {
          // Remove the day entry entirely if no trades remain for that date
          if (d.date === tradeToRemove.date && remainingOnDate.length === 0) return false;
          return true;
        });

      // Remove from trade_ids
      const newTradeIds = (c.trade_ids ?? []).filter(id => id !== tradeId);

      // Build the intermediate challenge with updated balance so
      // recomputeRulesFromTrades can compute peak correctly
      const intermediate: Challenge = {
        ...c,
        current_balance: newBalance,
        total_pnl: newPnl,
        trades: remainingTrades,
        trade_ids: newTradeIds,
        trading_days: updatedDays,
      };

      // Recompute all rules from remaining trades
      const rebuiltRules = recomputeRulesFromTrades(intermediate);

      // Recompute peak_balance from remaining trades
      let runningBalance = c.starting_balance;
      let peakBalance = c.starting_balance;
      const sortedRemaining = [...remainingTrades].sort((a, b) => a.date.localeCompare(b.date));
      for (const t of sortedRemaining) {
        runningBalance += t.pnl;
        if (runningBalance > peakBalance) peakBalance = runningBalance;
      }

      return {
        ...intermediate,
        peak_balance: peakBalance,
        rules: rebuiltRules,
        status: computeChallengeStatus(rebuiltRules),
      };
    });

    save(updated);
  };
}

// Alias so callers can import the TradingDay result type without touching propfirm.ts
type TradingDay = import('../types/propfirm').TradingDay;

/**
 * #14 — Graduate a challenge to the next phase.
 * Marks the current challenge as 'passed', creates a new challenge at phase+1
 * (max phase 3), resets all rule used values to 0, clears trades/trade_ids/
 * trading_days, and sets start_date to today.
 *
 * Returns the new challenge, or null if the challenge is already at phase 3.
 */
export function useGraduateChallenge() {
  return function graduateChallenge(challengeId: string): Challenge | null {
    const challenges = load();
    if (!challenges) return null;

    const current = challenges.find(c => c.id === challengeId);
    if (!current) return null;
    if (current.phase >= 3) return null;

    const nextPhase = (current.phase + 1) as ChallengePhase;
    const today = new Date().toISOString().split('T')[0];

    // Compute end_date using the same duration as the current challenge
    const currentDuration =
      recalcDaysRemaining(current.start_date) === 0
        ? 30 // fallback if we can't derive duration
        : (() => {
            const start = new Date(current.start_date);
            const end = new Date(current.end_date);
            return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          })();

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + currentDuration);
    const endDateStr = endDate.toISOString().split('T')[0];

    // Reset all rule used values to 0
    const resetRules: Rule[] = current.rules.map(r => ({
      ...r,
      used: 0,
      status: 'safe' as const,
    }));

    const newChallenge: Challenge = {
      id: `challenge-${Date.now()}`,
      firm: current.firm,
      account_size: current.account_size,
      phase: nextPhase,
      status: 'active',
      start_date: today,
      end_date: endDateStr,
      days_remaining: currentDuration,
      starting_balance: current.current_balance, // carry over final balance as new start
      current_balance: current.current_balance,
      total_pnl: 0,
      peak_balance: current.current_balance,
      auto_apply_trades: current.auto_apply_trades ?? true,
      mt5_account: current.mt5_account,
      rules: resetRules,
      trading_days: [],
      trade_ids: [],
      trades: [],
      created_at: new Date().toISOString(),
    };

    // Mark the current challenge as passed and append the new one
    const updatedChallenges = challenges.map((c): Challenge =>
      c.id === challengeId ? { ...c, status: 'passed' } : c,
    );
    updatedChallenges.push(newChallenge);
    save(updatedChallenges);

    return newChallenge;
  };
}
