import type { IncomingMessage, ServerResponse } from 'node:http';

// ── In-memory store (persists within a single serverless instance) ────────────

interface StoredTrade {
  ticket: number
  symbol: string
  direction: 'long' | 'short'
  volume: number
  entry_price: number
  exit_price: number
  sl: number
  tp: number
  profit: number
  net_profit: number
  r_multiple: number
  duration_formatted: string
  open_time: string
  close_time: string
  status: 'pending' | 'published' | 'dismissed'
  processed_at: string
}

const pendingTrades = new Map<string, StoredTrade>();

// ── Mock auth ────────────────────────────────────────────────────────────────

const VALID_KEYS: Record<string, { id: string; name: string; handle: string }> = {
  'candl_demo_key_jamied': { id: 'user_demo', name: 'Jamie D.', handle: 'jamied' },
};

function validateApiKey(apiKey: string) {
  return VALID_KEYS[apiKey] ?? null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcRMultiple(direction: 'long' | 'short', entry: number, exit: number, sl: number): number {
  if (sl === 0 || entry === sl) return 0;
  const riskPerUnit = Math.abs(entry - sl);
  const rewardPerUnit = direction === 'long' ? exit - entry : entry - exit;
  return Math.round((rewardPerUnit / riskPerUnit) * 100) / 100;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return;
  }

  // ── GET: poll for pending trade ──────────────────────────────────────────
  if (req.method === 'GET') {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const apiKey = url.searchParams.get('api_key') ?? '';
    const user = validateApiKey(apiKey);
    if (!user) return json(res, 401, { error: 'Invalid API key' });

    const trade = pendingTrades.get(user.id);
    if (trade && trade.status === 'pending') {
      return json(res, 200, { pending: true, trade });
    }
    return json(res, 200, { pending: false });
  }

  // ── POST: receive trade from EA ──────────────────────────────────────────
  if (req.method === 'POST') {
    let body: string;
    try {
      body = await readBody(req);
    } catch {
      return json(res, 400, { error: 'Failed to read request body' });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(body) as unknown;
    } catch {
      return json(res, 400, { error: 'Invalid JSON' });
    }

    if (typeof payload !== 'object' || payload === null) {
      return json(res, 400, { error: 'Invalid payload' });
    }

    const p = payload as Record<string, unknown>;

    // Validate api_key
    if (typeof p['api_key'] !== 'string' || !p['api_key']) {
      return json(res, 400, { error: 'Missing api_key' });
    }
    const user = validateApiKey(p['api_key']);
    if (!user) return json(res, 401, { error: 'Invalid API key' });

    // Validate event
    if (p['event'] !== 'trade_closed' && p['event'] !== 'trade_opened') {
      return json(res, 400, { error: 'Invalid event. Must be trade_closed or trade_opened' });
    }

    const trade = p['trade'] as Record<string, unknown> | undefined;
    if (typeof trade !== 'object' || trade === null) {
      return json(res, 400, { error: 'Missing trade object' });
    }

    // Only process closed trades as pending
    if (p['event'] === 'trade_closed') {
      const ticket = Number(trade['ticket']);
      const symbol = String(trade['symbol'] ?? '');
      const direction = String(trade['direction'] ?? '') as 'long' | 'short';
      const volume = Number(trade['volume'] ?? 0);
      const entryPrice = Number(trade['entry_price'] ?? 0);
      const exitPrice = Number(trade['exit_price'] ?? 0);
      const sl = Number(trade['sl'] ?? 0);
      const tp = Number(trade['tp'] ?? 0);
      const profit = Math.round(Number(trade['profit'] ?? 0) * 100) / 100;
      const commission = Number(trade['commission'] ?? 0);
      const swap = Number(trade['swap'] ?? 0);
      const netProfit = Math.round((profit + commission + swap) * 100) / 100;
      const openTime = String(trade['open_time'] ?? new Date().toISOString());
      const closeTime = String(trade['close_time'] ?? new Date().toISOString());
      const durationSecs = Number(trade['duration_seconds'] ?? 0);

      if (!symbol || !direction || !entryPrice || !exitPrice) {
        return json(res, 400, { error: 'Missing required trade fields' });
      }

      const rMultiple = calcRMultiple(direction, entryPrice, exitPrice, sl);
      const durationFormatted = formatDuration(durationSecs);

      const stored: StoredTrade = {
        ticket,
        symbol,
        direction,
        volume,
        entry_price: Math.round(entryPrice * 100000) / 100000,
        exit_price: Math.round(exitPrice * 100000) / 100000,
        sl,
        tp,
        profit,
        net_profit: netProfit,
        r_multiple: rMultiple,
        duration_formatted: durationFormatted,
        open_time: openTime,
        close_time: closeTime,
        status: 'pending',
        processed_at: new Date().toISOString(),
      };

      pendingTrades.set(user.id, stored);
      return json(res, 200, { success: true, message: 'Trade received', trade_id: ticket });
    }

    // trade_opened — acknowledge but don't store as pending
    return json(res, 200, { success: true, message: 'Trade open noted' });
  }

  return json(res, 405, { error: 'Method not allowed' });
}
