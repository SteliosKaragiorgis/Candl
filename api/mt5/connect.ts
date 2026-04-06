import type { IncomingMessage, ServerResponse } from 'node:http';

// ─── Known prop firm server → firm name mapping ───────────────────────────────

const SERVER_FIRM_MAP: Record<string, string> = {
  'FTMO-Demo':          'FTMO',
  'FTMO-Demo2':         'FTMO',
  'FTMO-Server':        'FTMO',
  'FTMO-Server2':       'FTMO',
  'TheFundedTrader-Live': 'TFT',
  'TheFundedTrader-Demo': 'TFT',
  'ApexFuturesUSA':     'Apex',
  'Apex-Live':          'Apex',
  'E8FundingFX-Live':   'E8',
  'E8FundingFX-Demo':   'E8',
  'FundedNext-Live':    'FundedNext',
  'FundedNext-Demo':    'FundedNext',
  'MyForexFunds-Live':  'MFF',
  'TrueForexFunds-Live':'TFF',
};

function detectFirm(server: string): string {
  // Exact match first
  if (SERVER_FIRM_MAP[server]) return SERVER_FIRM_MAP[server];
  // Partial match
  const s = server.toLowerCase();
  if (s.includes('ftmo'))        return 'FTMO';
  if (s.includes('funded'))      return s.includes('next') ? 'FundedNext' : 'TFT';
  if (s.includes('apex'))        return 'Apex';
  if (s.includes('e8'))          return 'E8';
  if (s.includes('forex'))       return 'MFF';
  return 'Other';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  let body: string;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: 'Failed to read request body' });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  const p = payload as Record<string, unknown>;

  const login    = typeof p['login']    === 'string' ? p['login'].trim()    : '';
  const password = typeof p['password'] === 'string' ? p['password']        : '';
  const server   = typeof p['server']   === 'string' ? p['server'].trim()   : '';

  if (!login || !password || !server) {
    return json(res, 400, { error: 'login, password and server are required' });
  }

  if (!/^\d{5,10}$/.test(login)) {
    return json(res, 400, { error: 'Login must be a 5–10 digit account number' });
  }

  // ── TODO: Replace this block with real MetaStats API call ────────────────
  //
  //   const metastats = await fetch(
  //     `https://metastats-api-v1.agiliumtrade.ai/users/current/accounts/${accountId}/metrics`,
  //     { headers: { 'auth-token': process.env.METASTATS_TOKEN! } }
  //   )
  //
  // For now we return a plausible demo response so the frontend is fully wired.
  // A wrong password returns a 401 (simulated by any password starting with 'wrong').

  if (password.toLowerCase().startsWith('wrong')) {
    return json(res, 401, { error: 'Invalid login or password. Check your MT5 credentials.' });
  }

  await new Promise(r => setTimeout(r, 1200)); // simulate network latency

  const firm        = detectFirm(server);
  const isDemo      = server.toLowerCase().includes('demo');
  const accountType = isDemo ? 'demo' : 'live';

  // Seed a deterministic-ish balance based on the login number
  const loginNum = parseInt(login, 10);
  const balance  = Math.round((50000 + (loginNum % 5) * 25000) * 100) / 100;
  const equity   = Math.round(balance * (0.98 + (loginNum % 7) * 0.004) * 100) / 100;

  const account = {
    id:          `mt5_${login}_${server.replace(/[^a-zA-Z0-9]/g, '_')}`,
    login,
    server,
    firm,
    balance,
    equity,
    currency:    'USD',
    accountType,
    status:      'connected' as const,
    lastSync:    new Date().toISOString(),
  };

  return json(res, 200, { success: true, account });
}
