import { useState, useEffect, useRef } from 'react';
import type { Challenge, ChallengeStatus, Rule } from '../types/propfirm';
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
    created_at: '2026-03-11T08:30:00Z',
  },
];

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

/** Applies an MT5 closed trade to all active challenges in localStorage. */
export function applyTradeToChallenge(trade: PendingTrade): void {
  const challenges = load();
  if (!challenges) return;

  const tradeDate = (trade.close_time ?? new Date().toISOString()).split('T')[0];
  const netPnl = trade.net_profit ?? trade.profit ?? 0;

  const updated = challenges.map((c): Challenge => {
    if (c.status === 'failed' || c.status === 'passed') return c;
    // If challenge has an mt5 account, only update if it matches
    if (c.mt5_account && trade.ticket && c.mt5_account !== String(trade.ticket).slice(0, 6)) {
      return c;
    }

    const newBalance = c.current_balance + netPnl;
    const newPnl = c.total_pnl + netPnl;

    const updatedRules = c.rules.map((r): Rule => {
      let used = r.used;
      switch (r.type) {
        case 'profit_target':
          used = Math.max(0, newPnl);
          break;
        case 'daily_loss':
          if (netPnl < 0) used = r.used + Math.abs(netPnl);
          break;
        case 'total_drawdown':
          used = Math.max(0, c.starting_balance - newBalance);
          break;
        case 'min_trading_days': {
          const alreadyTraded = c.trading_days.some(d => d.date === tradeDate);
          if (!alreadyTraded) used = r.used + 1;
          break;
        }
        default:
          break;
      }
      return { ...r, used, status: computeRuleStatus(used, r.limit) };
    });

    const tradingDayResult =
      netPnl > 0 ? 'win' : netPnl < 0 ? 'loss' : 'breakeven';

    const existingDayIdx = c.trading_days.findIndex(d => d.date === tradeDate);
    let updatedDays = [...c.trading_days];
    if (existingDayIdx >= 0) {
      const prev = updatedDays[existingDayIdx];
      updatedDays[existingDayIdx] = {
        ...prev,
        pnl: prev.pnl + netPnl,
        result: prev.pnl + netPnl > 0 ? 'win' : prev.pnl + netPnl < 0 ? 'loss' : 'breakeven',
      };
    } else {
      updatedDays.push({ date: tradeDate, result: tradingDayResult, pnl: netPnl });
    }

    return {
      ...c,
      current_balance: newBalance,
      total_pnl: newPnl,
      rules: updatedRules,
      trading_days: updatedDays,
      status: computeChallengeStatus(updatedRules),
    };
  });

  save(updated);
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>(() => seed());

  useEffect(() => {
    const handler = () => {
      const data = load();
      if (data) setChallenges(data);
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
      id: `challenge-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    save([...existing, newChallenge]);
    return newChallenge;
  };
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
