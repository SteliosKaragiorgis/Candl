import { useState, useEffect, useCallback, useRef } from 'react';
import type { Trade } from '../types/trade';
import { useMT5Accounts } from './useMT5Accounts';

// ─── Storage keys ─────────────────────────────────────────────────────────────
// User-authored trades (CSV imports + manual entries)
const USER_TRADES_KEY   = 'candl_user_trades';
// MT5 trades cached per account: { [accountId]: Trade[] }
const MT5_CACHE_KEY     = 'candl_mt5_history';
// Journal notes keyed by trade id (survive re-syncs)
const JOURNAL_NOTES_KEY = 'candl_trade_journal';
// Sync metadata: last-synced timestamp per account
const SYNC_META_KEY     = 'candl_sync_meta';

const METAAPI_TOKEN = import.meta.env.VITE_METAAPI_TOKEN as string | undefined;

// How far back to fetch on the first ever sync for an account
const INITIAL_HISTORY_DAYS = 90;
// On subsequent syncs, overlap by this many days to catch late-settling deals
const RESYNC_OVERLAP_DAYS  = 3;

// ─── MetaAPI deal shape ───────────────────────────────────────────────────────
interface MetaApiDeal {
  id: string;
  positionId: string;
  type: string;       // 'DEAL_TYPE_BUY' | 'DEAL_TYPE_SELL' | 'DEAL_TYPE_BALANCE' …
  entryType: string;  // 'DEAL_ENTRY_IN' | 'DEAL_ENTRY_OUT' | 'DEAL_ENTRY_INOUT'
  symbol: string;
  volume: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  time: string;       // ISO
  stopLoss?: number;
  takeProfit?: number;
}

const SKIP_TYPES = new Set([
  'DEAL_TYPE_BALANCE', 'DEAL_TYPE_CREDIT', 'DEAL_TYPE_CHARGE',
  'DEAL_TYPE_CORRECTION', 'DEAL_TYPE_BONUS', 'DEAL_TYPE_COMMISSION',
  'DEAL_TYPE_DIVIDEND', 'DEAL_TYPE_DIVIDEND_FRANKED', 'DEAL_TYPE_TAX',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function detectInstrument(symbol: string): Trade['instrument'] {
  const s = symbol.toUpperCase();
  if (/BTC|ETH|XRP|SOL|BNB|ADA|DOT|AVAX|MATIC/i.test(s)) return 'CRYPTO';
  if (/NAS|SPX|DAX|FTSE|DOW|SP500|NDX|US30|US100|GER40|AUS200|NI225|CAC/i.test(s)) return 'INDICES';
  if (/AAPL|TSLA|MSFT|AMZN|NVDA|GOOGL|META|SPY|QQQ/i.test(s)) return 'STOCKS';
  if (/USD|EUR|GBP|JPY|CHF|AUD|NZD|CAD|XAU|XAG|XPD|XPT/i.test(s)) return 'FX';
  return 'OTHER';
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
function loadUserTrades(): Trade[] {
  try { return JSON.parse(localStorage.getItem(USER_TRADES_KEY) ?? '[]') as Trade[]; }
  catch { return []; }
}

function saveUserTrades(trades: Trade[]) {
  try { localStorage.setItem(USER_TRADES_KEY, JSON.stringify(trades)); } catch { /* quota */ }
}

function loadMT5Cache(): Record<string, Trade[]> {
  try { return JSON.parse(localStorage.getItem(MT5_CACHE_KEY) ?? '{}') as Record<string, Trade[]>; }
  catch { return {}; }
}

function saveMT5Cache(cache: Record<string, Trade[]>) {
  try { localStorage.setItem(MT5_CACHE_KEY, JSON.stringify(cache)); } catch { /* quota */ }
}

function loadJournalNotes(): Record<string, { narrative?: string; emotion?: string; lesson?: string }> {
  try { return JSON.parse(localStorage.getItem(JOURNAL_NOTES_KEY) ?? '{}'); }
  catch { return {}; }
}

function saveJournalNotes(notes: Record<string, { narrative?: string; emotion?: string; lesson?: string }>) {
  try { localStorage.setItem(JOURNAL_NOTES_KEY, JSON.stringify(notes)); } catch { /* quota */ }
}

function loadSyncMeta(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(SYNC_META_KEY) ?? '{}') as Record<string, string>; }
  catch { return {}; }
}

function saveSyncMeta(meta: Record<string, string>) {
  try { localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta)); } catch { /* quota */ }
}

// Apply saved journal notes to a trade array
function applyJournalNotes(trades: Trade[]): Trade[] {
  const notes = loadJournalNotes();
  return trades.map(t => {
    const n = notes[t.id];
    if (!n) return t;
    return { ...t, ...n };
  });
}

// ─── MetaAPI fetch ────────────────────────────────────────────────────────────
async function fetchDeals(
  accountId: string,
  region: string,
  token: string,
  from: Date,
  to: Date,
): Promise<MetaApiDeal[]> {
  const url = `/api/metaapi-client/${region}/users/current/accounts/${accountId}/history-deals/time/${encodeURIComponent(from.toISOString())}/${encodeURIComponent(to.toISOString())}`;
  const res = await fetch(url, { headers: { 'auth-token': token } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MetaAPI ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// Convert MetaAPI deals (grouped by positionId) → Trade objects
function dealsToTrades(deals: MetaApiDeal[], accountId: string): Trade[] {
  // Filter out balance/credit/etc entries
  const tradeDeals = deals.filter(d => d.symbol && d.positionId && !SKIP_TYPES.has(d.type));

  // Group by positionId
  const byPosition = new Map<string, MetaApiDeal[]>();
  for (const d of tradeDeals) {
    if (!byPosition.has(d.positionId)) byPosition.set(d.positionId, []);
    byPosition.get(d.positionId)!.push(d);
  }

  const trades: Trade[] = [];

  for (const [positionId, posDeals] of byPosition) {
    // A completed trade needs at least one exit deal
    const entryDeals = posDeals.filter(d =>
      d.entryType === 'DEAL_ENTRY_IN' || d.entryType === 'DEAL_ENTRY_INOUT',
    );
    const exitDeals = posDeals.filter(d =>
      d.entryType === 'DEAL_ENTRY_OUT' || d.entryType === 'DEAL_ENTRY_INOUT',
    );
    if (exitDeals.length === 0) continue;

    const firstEntry = entryDeals[0];
    // Use last exit deal for exit price (handles partial closes)
    const lastExit = exitDeals[exitDeals.length - 1];
    const symbol   = lastExit.symbol;
    if (!symbol) continue;

    // Direction: opening BUY → LONG; opening SELL → SHORT
    // If no entry deal in range, infer from close type (SELL closes = was LONG)
    let direction: 'LONG' | 'SHORT';
    if (firstEntry) {
      direction = firstEntry.type === 'DEAL_TYPE_BUY' ? 'LONG' : 'SHORT';
    } else {
      direction = lastExit.type === 'DEAL_TYPE_SELL' ? 'LONG' : 'SHORT';
    }

    const entryPrice = firstEntry?.price ?? 0;
    const exitPrice  = lastExit.price;

    // Sum net profit across all deals (covers partial closes + commission + swap)
    const netProfit = Math.round(
      posDeals.reduce((s, d) => s + (d.profit ?? 0) + (d.commission ?? 0) + (d.swap ?? 0), 0) * 100,
    ) / 100;

    // SL/TP from first entry deal
    const stopLoss   = firstEntry?.stopLoss   || undefined;
    const takeProfit = firstEntry?.takeProfit || undefined;

    // R multiple
    let rMultiple = 0;
    if (stopLoss && entryPrice > 0) {
      const risk   = Math.abs(entryPrice - stopLoss);
      const reward = direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;
      if (risk > 0) rMultiple = Math.round((reward / risk) * 100) / 100;
    }

    const lotSize   = firstEntry?.volume ?? lastExit.volume;
    const openTime  = firstEntry?.time ?? lastExit.time;
    const closeTime = lastExit.time;
    const openMs    = new Date(openTime).getTime();
    const closeMs   = new Date(closeTime).getTime();
    const durationMs = Math.max(0, closeMs - openMs);

    trades.push({
      id:          `mt5_${accountId}_${positionId}`,
      symbol:      symbol.toUpperCase(),
      direction,
      entry:       entryPrice,
      exit:        exitPrice,
      stopLoss,
      takeProfit,
      pnl:         netProfit,
      rMultiple,
      lotSize,
      duration:    formatDuration(durationMs),
      durationMs,
      openedAt:    openTime,
      closedAt:    closeTime,
      source:      'MT5',
      instrument:  detectInstrument(symbol),
      isPublished: false,
    });
  }

  return trades;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? '').replace(/^"|"$/g, ''); });
    return row;
  });
}

function mapCSVRow(row: Record<string, string>): Trade | null {
  const symbol    = row['symbol'] || row['pair'] || row['instrument'] || '';
  const dirRaw    = (row['direction'] || row['type'] || row['side'] || row['action'] || '').toLowerCase();
  const direction : Trade['direction'] = dirRaw.includes('sell') || dirRaw.includes('short') ? 'SHORT' : 'LONG';
  const entry     = parseFloat(row['entry'] || row['entry_price'] || row['open_price'] || row['open'] || '0');
  const exit      = parseFloat(row['exit']  || row['exit_price']  || row['close_price']|| row['close']|| '0');
  const pnl       = parseFloat(row['pnl']   || row['profit']      || row['net_profit'] || row['p&l'] || row['pl'] || '0');
  const rMultiple = parseFloat(row['r_multiple'] || row['r-multiple'] || row['rmultiple'] || row['r'] || '0');
  const openedAt  = row['opened_at'] || row['open_time']  || row['open date']  || row['opentime']  || new Date().toISOString();
  const closedAt  = row['closed_at'] || row['close_time'] || row['close date'] || row['closetime'] || new Date().toISOString();
  const lotSize   = parseFloat(row['lot_size'] || row['lots'] || row['volume'] || row['size'] || '0') || undefined;

  if (!symbol || entry === 0) return null;

  const openMs    = new Date(openedAt).getTime();
  const closeMs   = new Date(closedAt).getTime();
  const durationMs = isNaN(openMs) || isNaN(closeMs) ? 0 : Math.max(0, closeMs - openMs);

  return {
    id:          `csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    symbol:      symbol.toUpperCase(),
    direction,
    entry,
    exit,
    stopLoss:    parseFloat(row['stop_loss'] || row['sl'] || '') || undefined,
    takeProfit:  parseFloat(row['take_profit'] || row['tp'] || '') || undefined,
    pnl,
    rMultiple:   isNaN(rMultiple) ? 0 : rMultiple,
    lotSize,
    duration:    formatDuration(durationMs),
    durationMs,
    openedAt:    isNaN(openMs) ? new Date().toISOString() : new Date(openedAt).toISOString(),
    closedAt:    isNaN(closeMs) ? new Date().toISOString() : new Date(closedAt).toISOString(),
    source:      'CSV',
    instrument:  detectInstrument(symbol),
    isPublished: false,
  };
}

// ─── Merge helpers ────────────────────────────────────────────────────────────
function allMT5Trades(): Trade[] {
  const cache = loadMT5Cache();
  return Object.values(cache).flat();
}

function buildMerged(): Trade[] {
  const mt5    = applyJournalNotes(allMT5Trades());
  const user   = applyJournalNotes(loadUserTrades());

  // Deduplicate (user trades win on id collision)
  const seen   = new Set<string>();
  const result : Trade[] = [];
  for (const t of [...user, ...mt5]) {
    if (!seen.has(t.id)) { seen.add(t.id); result.push(t); }
  }
  return result.sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';

export function useMyTrades() {
  const { accounts } = useMT5Accounts();
  const [trades,     setTrades]     = useState<Trade[]>(() => buildMerged());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError,  setSyncError]  = useState<string | null>(null);
  const syncingRef = useRef(false);

  // Re-build merged list whenever underlying storage might have changed
  const refresh = useCallback(() => {
    setTrades(buildMerged());
  }, []);

  // ── Sync MT5 history ───────────────────────────────────────────────────────
  const syncAccounts = useCallback(async () => {
    if (!METAAPI_TOKEN) return;
    if (syncingRef.current) return;

    const connected = accounts.filter(
      a => a.status === 'connected' && a.metaApiAccountId && a.metaApiRegion,
    );
    if (connected.length === 0) return;

    syncingRef.current = true;
    setSyncStatus('syncing');
    setSyncError(null);

    const syncMeta  = loadSyncMeta();
    const cache     = loadMT5Cache();
    const now       = new Date();

    try {
      for (const account of connected) {
        const accountId = account.metaApiAccountId!;
        const region    = account.metaApiRegion!;

        // Determine fetch window
        const lastSync = syncMeta[accountId];
        let from: Date;
        if (lastSync) {
          // Re-fetch from (lastSync - overlap) to catch anything that settled late
          from = new Date(new Date(lastSync).getTime() - RESYNC_OVERLAP_DAYS * 86400_000);
        } else {
          from = new Date(now.getTime() - INITIAL_HISTORY_DAYS * 86400_000);
        }

        const deals = await fetchDeals(accountId, region, METAAPI_TOKEN, from, now);
        const newTrades = dealsToTrades(deals, accountId);

        // Merge new trades into this account's cache, preserving any journal notes
        const existing     = cache[accountId] ?? [];
        const existingById = new Map(existing.map(t => [t.id, t]));

        for (const t of newTrades) {
          const prev = existingById.get(t.id);
          // Keep user journal fields if they've already written notes
          existingById.set(t.id, prev
            ? { ...t, narrative: prev.narrative, emotion: prev.emotion, lesson: prev.lesson, isPublished: prev.isPublished, postId: prev.postId }
            : t,
          );
        }

        cache[accountId] = [...existingById.values()];
        syncMeta[accountId] = now.toISOString();
      }

      saveMT5Cache(cache);
      saveSyncMeta(syncMeta);
      setSyncStatus('done');
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setSyncError(msg);
      setSyncStatus('error');
      console.error('[useMyTrades] sync error:', err);
    } finally {
      syncingRef.current = false;
    }
  }, [accounts, refresh]);

  // Trigger sync whenever connected accounts change
  useEffect(() => {
    const connected = accounts.filter(
      a => a.status === 'connected' && a.metaApiAccountId && a.metaApiRegion,
    );
    if (connected.length > 0 && METAAPI_TOKEN) {
      syncAccounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.map(a => `${a.id}:${a.status}`).join(',')]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalPnl  = trades.reduce((s, t) => s + t.pnl, 0);
  const wins    = trades.filter(t => t.pnl > 0).length;
  const total   = trades.length;
  const winRate = total === 0
    ? null
    : Math.round((wins / total) * 100);

  const lastMT5Trade = trades
    .filter(t => t.source === 'MT5')
    .reduce((latest, t) => {
      const ts = new Date(t.closedAt).getTime();
      return ts > latest ? ts : latest;
    }, 0);

  const lastSyncedAt = lastMT5Trade > 0
    ? new Date(lastMT5Trade).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : syncStatus === 'syncing' ? 'syncing…' : 'never';

  // ── CSV import ─────────────────────────────────────────────────────────────
  const importCsv = useCallback(async (file: File): Promise<void> => {
    const text = await file.text();
    const rows = parseCSV(text);
    const newTrades = rows.map(mapCSVRow).filter((t): t is Trade => t !== null);
    if (newTrades.length === 0) throw new Error('No valid trades found in CSV.');

    const existing   = loadUserTrades();
    const existingIds = new Set(existing.map(t => t.id));
    const unique     = newTrades.filter(t => !existingIds.has(t.id));
    saveUserTrades([...existing, ...unique]);
    refresh();
  }, [refresh]);

  // ── Manual add/update/delete ───────────────────────────────────────────────
  const addTrade = useCallback((trade: Partial<Trade>) => {
    const now  = new Date().toISOString();
    const full : Trade = {
      id:          `manual-${Date.now()}`,
      symbol:      trade.symbol      ?? '',
      direction:   trade.direction   ?? 'LONG',
      entry:       trade.entry       ?? 0,
      exit:        trade.exit        ?? 0,
      pnl:         trade.pnl         ?? 0,
      rMultiple:   trade.rMultiple   ?? 0,
      duration:    trade.duration    ?? '0h 00m',
      durationMs:  trade.durationMs  ?? 0,
      openedAt:    trade.openedAt    ?? now,
      closedAt:    trade.closedAt    ?? now,
      source:      'MANUAL',
      instrument:  trade.instrument  ?? 'OTHER',
      isPublished: false,
      ...trade,
    };
    saveUserTrades([full, ...loadUserTrades()]);
    refresh();
  }, [refresh]);

  const updateTrade = useCallback((id: string, updates: Partial<Trade>) => {
    // Journal fields get saved to the journal store so they survive MT5 re-syncs
    const journalFields = ['narrative', 'emotion', 'lesson'] as const;
    const journalUpdates = Object.fromEntries(
      journalFields.filter(k => k in updates).map(k => [k, updates[k]]),
    );
    if (Object.keys(journalUpdates).length > 0) {
      const notes = loadJournalNotes();
      notes[id] = { ...notes[id], ...journalUpdates };
      saveJournalNotes(notes);
    }

    // Update in user trades if it's a CSV/MANUAL trade
    const user    = loadUserTrades();
    const inUser  = user.some(t => t.id === id);
    if (inUser) {
      saveUserTrades(user.map(t => t.id === id ? { ...t, ...updates } : t));
    } else {
      // Update in MT5 cache
      const cache = loadMT5Cache();
      for (const accountId of Object.keys(cache)) {
        if (cache[accountId].some(t => t.id === id)) {
          cache[accountId] = cache[accountId].map(t => t.id === id ? { ...t, ...updates } : t);
        }
      }
      saveMT5Cache(cache);
    }
    refresh();
  }, [refresh]);

  const deleteTrade = useCallback((id: string) => {
    // Remove from user trades
    const user = loadUserTrades();
    if (user.some(t => t.id === id)) {
      saveUserTrades(user.filter(t => t.id !== id));
    } else {
      // Remove from MT5 cache
      const cache = loadMT5Cache();
      for (const accountId of Object.keys(cache)) {
        cache[accountId] = cache[accountId].filter(t => t.id !== id);
      }
      saveMT5Cache(cache);
    }
    refresh();
  }, [refresh]);

  const shareTrade = useCallback((trade: Trade) => {
    window.dispatchEvent(new CustomEvent('candl-share-trade', { detail: trade }));
  }, []);

  return {
    trades,
    loading: syncStatus === 'syncing',
    syncStatus,
    syncError,
    totalPnl,
    winRate,
    lastSyncedAt,
    syncNow: syncAccounts,
    importCsv,
    addTrade,
    updateTrade,
    deleteTrade,
    shareTrade,
  };
}
