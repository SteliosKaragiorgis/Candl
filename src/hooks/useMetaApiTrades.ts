import { useEffect, useRef } from 'react';
import { useMT5Accounts } from './useMT5Accounts';
import type { PendingTrade } from '../types/mt5';

const POLL_MS = 15_000;
const SEEN_KEY = 'candl_seen_deals';

const METAAPI_TOKEN = import.meta.env.VITE_METAAPI_TOKEN as string | undefined;

function getSeenDeals(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(JSON.parse(raw ?? '[]') as string[]);
  } catch { return new Set(); }
}

function addSeenDeal(id: string) {
  const seen = getSeenDeals();
  seen.add(id);
  const arr = [...seen].slice(-200);
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
}

interface MetaApiDeal {
  id: string;
  type: string;        // 'DEAL_TYPE_BUY' | 'DEAL_TYPE_SELL' | ...
  entryType: string;   // 'DEAL_ENTRY_IN' | 'DEAL_ENTRY_OUT' | 'DEAL_ENTRY_INOUT'
  symbol: string;
  volume: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  time: string;
  positionId: string;
  stopLoss?: number;
  takeProfit?: number;
}

const SKIP_TYPES = new Set([
  'DEAL_TYPE_BALANCE', 'DEAL_TYPE_CREDIT', 'DEAL_TYPE_CHARGE',
  'DEAL_TYPE_CORRECTION', 'DEAL_TYPE_BONUS', 'DEAL_TYPE_COMMISSION',
]);

async function fetchDeals(accountId: string, region: string, token: string): Promise<MetaApiDeal[]> {
  const to   = new Date();
  const from = new Date(to.getTime() - 48 * 60 * 60 * 1000); // last 48h

  const url = `/api/metaapi-client/${region}/users/current/accounts/${accountId}/history-deals/time/${encodeURIComponent(from.toISOString())}/${encodeURIComponent(to.toISOString())}`;
  console.log('[MetaAPI trades] fetching deals:', url);
  const res = await fetch(url, { headers: { 'auth-token': token } });
  console.log('[MetaAPI trades] deals response status:', res.status);
  if (!res.ok) {
    console.warn('[MetaAPI trades] deals fetch failed:', res.status, await res.text());
    return [];
  }
  const data = await res.json();
  console.log('[MetaAPI trades] raw deals response:', JSON.stringify(data).slice(0, 500));
  return Array.isArray(data) ? data : [];
}

/** Pair entry+exit deals by positionId and build PendingTrade objects. */
function buildPendingTrades(deals: MetaApiDeal[]): PendingTrade[] {
  const tradeDeals = deals.filter(d => d.symbol && d.positionId && !SKIP_TYPES.has(d.type));

  // Group by positionId
  const byPosition = new Map<string, MetaApiDeal[]>();
  for (const d of tradeDeals) {
    if (!byPosition.has(d.positionId)) byPosition.set(d.positionId, []);
    byPosition.get(d.positionId)!.push(d);
  }

  const results: PendingTrade[] = [];

  for (const [, posDeals] of byPosition) {
    const entryDeal = posDeals.find(d =>
      d.entryType === 'DEAL_ENTRY_IN' || d.entryType === 'DEAL_ENTRY_INOUT',
    );
    const exitDeal = posDeals.find(d =>
      d.entryType === 'DEAL_ENTRY_OUT' || d.entryType === 'DEAL_ENTRY_INOUT',
    );

    // Only surface completed trades
    if (!exitDeal) continue;

    const openPrice  = entryDeal?.price ?? exitDeal.price;
    const exitPrice  = exitDeal.price;
    const sl         = entryDeal?.stopLoss  ?? 0;
    const tp         = entryDeal?.takeProfit ?? 0;
    const openTime   = entryDeal?.time ?? exitDeal.time;
    const closeTime  = exitDeal.time;

    // Direction: opening BUY = LONG, opening SELL = SHORT
    // If no entry deal, infer from exit: SELL closes a LONG position
    let direction: 'long' | 'short';
    if (entryDeal) {
      direction = entryDeal.type === 'DEAL_TYPE_BUY' ? 'long' : 'short';
    } else {
      direction = exitDeal.type === 'DEAL_TYPE_SELL' ? 'long' : 'short';
    }

    const netProfit = Math.round(
      posDeals.reduce((s, d) => s + (d.profit ?? 0) + (d.commission ?? 0) + (d.swap ?? 0), 0) * 100,
    ) / 100;

    const riskPerUnit   = sl > 0 ? Math.abs(openPrice - sl) : 0;
    const rewardPerUnit = direction === 'long' ? exitPrice - openPrice : openPrice - exitPrice;
    const rMultiple     = riskPerUnit > 0 ? Math.round((rewardPerUnit / riskPerUnit) * 100) / 100 : 0;

    const openMs  = new Date(openTime).getTime();
    const closeMs = new Date(closeTime).getTime();
    const durSecs = Math.max(0, Math.round((closeMs - openMs) / 1000));
    const mins    = Math.floor(durSecs / 60);
    const hours   = Math.floor(mins / 60);
    const days    = Math.floor(hours / 24);
    let duration_formatted = `${mins}m`;
    if (days > 0)       duration_formatted = `${days}d ${hours % 24}h`;
    else if (hours > 0) duration_formatted = `${hours}h ${mins % 60}m`;

    results.push({
      ticket:             parseInt(exitDeal.positionId ?? exitDeal.id, 10) || 0,
      symbol:             exitDeal.symbol,
      direction,
      volume:             exitDeal.volume,
      entry_price:        openPrice,
      exit_price:         exitPrice,
      sl,
      tp,
      profit:             Math.round(exitDeal.profit * 100) / 100,
      net_profit:         netProfit,
      r_multiple:         rMultiple,
      duration_formatted,
      open_time:          openTime,
      close_time:         closeTime,
      status:             'pending',
    });
  }

  return results;
}

export function useMetaApiTrades(onNewTrade: (trade: PendingTrade) => void) {
  const { accounts } = useMT5Accounts();
  const onNewTradeRef = useRef(onNewTrade);
  onNewTradeRef.current = onNewTrade;

  useEffect(() => {
    if (!METAAPI_TOKEN) return;

    const connectedAccounts = accounts.filter(
      a => a.status === 'connected' && a.metaApiAccountId && a.metaApiRegion,
    );
    if (connectedAccounts.length === 0) return;

    let mounted = true;

    async function poll() {
      if (!mounted || !METAAPI_TOKEN) return;

      for (const account of connectedAccounts) {
        if (!account.metaApiAccountId || !account.metaApiRegion) continue;
        try {
          const deals  = await fetchDeals(account.metaApiAccountId, account.metaApiRegion, METAAPI_TOKEN);
          const trades = buildPendingTrades(deals);

          console.log('[MetaAPI trades] completed trades found:', trades.length);

          for (const trade of trades) {
            // Use positionId (ticket) as the dedup key
            const dealKey = `${account.metaApiAccountId}_${trade.ticket}`;
            if (getSeenDeals().has(dealKey)) continue;

            addSeenDeal(dealKey);
            console.log('[MetaAPI trades] firing new trade:', trade.symbol, trade.direction, trade.net_profit, 'entry:', trade.entry_price, 'exit:', trade.exit_price);
            onNewTradeRef.current(trade);
          }
        } catch (err) {
          console.warn('[MetaAPI trades] poll error:', err);
        }
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [accounts]);
}
