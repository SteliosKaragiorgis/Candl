import { useState, useEffect, useRef } from 'react';
import type { PendingTrade } from '../types/mt5';
import { applyTradeToChallenge } from './useChallenge';

export type { PendingTrade };

const DEMO_KEY = 'candl_demo_key_jamied';
const POLL_MS = 10_000;
const REMIND_MS = 30 * 60 * 1000;

// Demo fallback used when the API is unreachable (local dev without vercel dev)
const DEMO_TRADE: PendingTrade = {
  ticket: 123456789,
  symbol: 'EURUSD',
  direction: 'long',
  volume: 0.10,
  entry_price: 1.08620,
  exit_price: 1.09100,
  sl: 1.08200,
  tp: 1.09500,
  profit: 480.00,
  net_profit: 476.30,
  r_multiple: 3.2,
  duration_formatted: '2h 14m',
  open_time: '2026-04-04T10:15:00Z',
  close_time: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  status: 'pending',
};

type HookReturn = {
  pendingTrade: PendingTrade
  isLoading: boolean
  dismiss: () => void
  remindLater: () => void
}

export function usePendingTrade(): HookReturn {
  const [pendingTrade, setPendingTrade] = useState<PendingTrade>(DEMO_TRADE);
  const [isLoading, setIsLoading] = useState(false);
  const remindTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissed = useRef(false);
  const lastProcessedTicket = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      if (dismissed.current) return;
      try {
        const res = await fetch(`/api/mt5/trade?api_key=${DEMO_KEY}`);
        if (!res.ok) return;
        const data = await res.json() as { pending: boolean; trade?: PendingTrade };
        if (mounted && data.pending && data.trade) {
          setPendingTrade(data.trade);
          // Update challenge stats on each new unique trade
          if (data.trade.ticket !== lastProcessedTicket.current) {
            lastProcessedTicket.current = data.trade.ticket;
            applyTradeToChallenge(data.trade);
          }
        }
      } catch {
        // API not available (local dev without vercel dev) — keep demo trade
      }
    }

    setIsLoading(true);
    poll().finally(() => { if (mounted) setIsLoading(false); });

    const interval = setInterval(poll, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  function dismiss() {
    dismissed.current = true;
    fetch('/api/mt5/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: DEMO_KEY }),
    }).catch(() => {}); // Fire-and-forget
  }

  function remindLater() {
    dismissed.current = true;
    if (remindTimer.current) clearTimeout(remindTimer.current);
    remindTimer.current = setTimeout(() => {
      dismissed.current = false;
    }, REMIND_MS);
  }

  return { pendingTrade, isLoading, dismiss, remindLater };
}
