import { useState, useEffect, useCallback } from 'react';
import type { MT5Account, MT5AccountStatus } from '../types/mt5account';

const STORAGE_KEY = 'candl_mt5_accounts';
const EVENT_KEY   = 'candl-mt5-updated';

function load(): MT5Account[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as MT5Account[];
  } catch {
    return [];
  }
}

function save(accounts: MT5Account[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new Event(EVENT_KEY));
}

export function useMT5Accounts() {
  const [accounts, setAccounts] = useState<MT5Account[]>(load);

  useEffect(() => {
    const handler = () => setAccounts(load());
    window.addEventListener(EVENT_KEY, handler);
    return () => window.removeEventListener(EVENT_KEY, handler);
  }, []);

  const addAccount = useCallback((account: MT5Account) => {
    const next = [...load().filter(a => a.id !== account.id), account];
    save(next);
    setAccounts(next);
  }, []);

  const removeAccount = useCallback((id: string) => {
    const next = load().filter(a => a.id !== id);
    save(next);
    setAccounts(next);
  }, []);

  const updateStatus = useCallback((id: string, status: MT5AccountStatus, errorMessage?: string) => {
    const next = load().map(a =>
      a.id === id ? { ...a, status, errorMessage, lastSync: status === 'connected' ? new Date().toISOString() : a.lastSync } : a
    );
    save(next);
    setAccounts(next);
  }, []);

  const updateAccount = useCallback((id: string, patch: Partial<MT5Account>) => {
    const next = load().map(a => a.id === id ? { ...a, ...patch } : a);
    save(next);
    setAccounts(next);
  }, []);

  return { accounts, addAccount, removeAccount, updateStatus, updateAccount };
}

// ─── MetaAPI integration ──────────────────────────────────────────────────────

const METAAPI_TOKEN = import.meta.env.VITE_METAAPI_TOKEN as string | undefined;
const PROVISION_BASE = '/api/metaapi-provision';
// Upstream: https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai
const CLIENT_BASE = (region: string) => `/api/metaapi-client/${region}`;

const SERVER_FIRM_MAP: Record<string, string> = {
  // Prop firms
  'FTMO-Demo':              'FTMO',
  'FTMO-Demo2':             'FTMO',
  'FTMO-Server':            'FTMO',
  'FTMO-Server2':           'FTMO',
  'TheFundedTrader-Live':   'TFT',
  'TheFundedTrader-Demo':   'TFT',
  'ApexFuturesUSA':         'Apex',
  'Apex-Live':              'Apex',
  'E8FundingFX-Live':       'E8',
  'E8FundingFX-Demo':       'E8',
  'FundedNext-Live':        'FundedNext',
  'FundedNext-Demo':        'FundedNext',
  'MyFundedFX-Demo':        'MyFundedFX',
  'MyFundedFX-Live':        'MyFundedFX',
  'TrueForexFunds-Live':    'TFF',
  'TrueForexFunds-Demo':    'TFF',
  // Retail brokers
  'ICMarketsSC-Demo':       'IC Markets',
  'ICMarketsSC-Live':       'IC Markets',
  'ICMarketsSC-Live2':      'IC Markets',
  'ICMarketsSC-Live3':      'IC Markets',
  'Pepperstone-Demo':       'Pepperstone',
  'Pepperstone-Live':       'Pepperstone',
  'Pepperstone-Live01':     'Pepperstone',
  'Tickmill-Demo':          'Tickmill',
  'Tickmill-Live':          'Tickmill',
  'Vantage-Demo':           'Vantage',
  'Vantage-Live':           'Vantage',
  'MetaQuotes-Demo':        'MetaQuotes',
};

function detectFirm(server: string): string {
  if (SERVER_FIRM_MAP[server]) return SERVER_FIRM_MAP[server];
  const s = server.toLowerCase();
  if (s.includes('ftmo'))                          return 'FTMO';
  if (s.includes('funded') && s.includes('next'))  return 'FundedNext';
  if (s.includes('funded'))                        return 'TFT';
  if (s.includes('apex'))                          return 'Apex';
  if (s.includes('e8funding'))                     return 'E8';
  if (s.includes('icmarket'))                      return 'IC Markets';
  if (s.includes('pepperstone'))                   return 'Pepperstone';
  if (s.includes('exness'))                        return 'Exness';
  if (s.includes('fxpro'))                         return 'FxPro';
  if (s.includes('tickmill'))                      return 'Tickmill';
  if (s.includes('vantage'))                       return 'Vantage';
  if (s.includes('xm'))                            return 'XM';
  if (s.includes('oanda'))                         return 'OANDA';
  return server.split('-')[0] ?? 'Other';
}

interface MetaApiAccountPayload {
  id?: string;
  _id?: string;
  state: string;
  region: string;
  login: string;
  server: string;
  type: string;
}

function getAccountId(a: MetaApiAccountPayload): string {
  const id = a.id ?? a._id;
  if (!id) throw new Error('MetaAPI account has no id field. Check API response.');
  return id;
}

interface MetaApiAccountInfo {
  balance: number;
  equity: number;
  currency: string;
  name: string;
  server: string;
  type: string; // 'ACCOUNT_TRADE_MODE_DEMO' | 'ACCOUNT_TRADE_MODE_REAL'
}

async function metaApiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `MetaAPI error ${res.status}`;
    try {
      const body = await res.json() as Record<string, unknown>;
      msg = (body['message'] ?? body['error'] ?? body['details'] ?? msg) as string;
    } catch { /* ignore */ }
    console.error('[MetaAPI]', res.status, msg);
    throw new Error(msg);
  }
  return res;
}

async function provisionMetaApiAccount(
  login: string,
  password: string,
  server: string,
  token: string,
): Promise<MetaApiAccountPayload> {
  // Always check for existing account first to avoid duplicates
  const listRes = await metaApiFetch(
    `${PROVISION_BASE}/users/current/accounts?limit=1000`,
    { headers: { 'auth-token': token } },
  );
  const existing = await listRes.json() as MetaApiAccountPayload[];
  console.log('[MetaAPI] accounts on file:', existing.length);
  const matches = existing.filter(a => String(a.login) === String(login) && a.server === server);
  console.log('[MetaAPI] matches for', login, server, ':', matches.length);
  if (matches.length > 0) {
    const best = matches.find(a => a.state?.toLowerCase() === 'deployed') ?? matches[0];
    console.log('[MetaAPI] reusing existing account', getAccountId(best), 'state:', best.state);
    return best;
  }

  // Create new account
  const res = await fetch(`${PROVISION_BASE}/users/current/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'auth-token': token },
    body: JSON.stringify({
      login,
      password,
      name: `${detectFirm(server)} #${login}`,
      server,
      platform: 'mt5',
      magic: 0,
      keywords: ['tradeflow'],
    }),
  });

  if (!res.ok) {
    let msg = `MetaAPI error ${res.status}`;
    try {
      const body = await res.json() as Record<string, unknown>;
      const details = body['details'];
      msg = (body['message'] ?? body['error'] ?? msg) as string;
      console.error('[MetaAPI] create account failed', res.status, msg, details);
      if (details) msg += ': ' + JSON.stringify(details);
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  return res.json() as Promise<MetaApiAccountPayload>;
}

async function waitForDeployed(accountId: string, token: string): Promise<MetaApiAccountPayload> {
  const TIMEOUT = 180_000;
  const POLL    = 5_000;
  const start   = Date.now();

  while (Date.now() - start < TIMEOUT) {
    const res = await metaApiFetch(`${PROVISION_BASE}/users/current/accounts/${accountId}`, {
      headers: { 'auth-token': token },
    });
    const data: MetaApiAccountPayload & { connectionStatus?: string; reliability?: string } = await res.json();
    console.log('[MetaAPI] poll', data.state, data.connectionStatus);

    // Accept any connected state — MetaAPI uses CONNECTED, CONNECTED_TO_BROKER, etc.
    console.log('[MetaAPI] poll state:', data.state, 'connectionStatus:', data.connectionStatus, 'reliability:', data.reliability);

    const state = data.state?.toLowerCase();
    if (state === 'deployed') return data;
    if (['deploy-failed', 'deleting', 'deleted'].includes(state)) {
      throw new Error('Account failed to connect. Check your login, password and server.');
    }

    await new Promise(r => setTimeout(r, POLL));
  }

  throw new Error('Timed out waiting for MT5 to connect. The server may be unreachable.');
}

async function fetchAccountInfo(
  accountId: string,
  region: string,
  token: string,
): Promise<MetaApiAccountInfo> {
  const res = await metaApiFetch(
    `${CLIENT_BASE(region)}/users/current/accounts/${accountId}/account-information`,
    { headers: { 'auth-token': token } },
  );
  return res.json() as Promise<MetaApiAccountInfo>;
}

export async function syncMT5Account(account: MT5Account): Promise<Partial<MT5Account>> {
  if (!METAAPI_TOKEN || !account.metaApiAccountId || !account.metaApiRegion) return {};
  const info = await fetchAccountInfo(account.metaApiAccountId, account.metaApiRegion, METAAPI_TOKEN);
  return {
    balance:  info.balance,
    equity:   info.equity,
    currency: info.currency ?? account.currency,
    lastSync: new Date().toISOString(),
    status:   'connected',
  };
}

export async function connectMT5Account(
  login: string,
  password: string,
  server: string,
): Promise<MT5Account> {
  if (!login.trim() || !password || !server.trim()) {
    throw new Error('Login, password and server are required.');
  }
  if (!/^\d{5,10}$/.test(login.trim())) {
    throw new Error('Login ID must be a 5–10 digit number.');
  }

  if (!METAAPI_TOKEN) {
    throw new Error(
      'MetaAPI token not configured. Add VITE_METAAPI_TOKEN to your .env file.',
    );
  }

  // 1. Create / find the MetaAPI account
  const provisioned = await provisionMetaApiAccount(login, password, server, METAAPI_TOKEN);

  // 2. Deploy if needed, then wait (waitForDeployed returns immediately if already deployed)
  console.log('[MetaAPI] provisioned state:', provisioned.state);
  const provisionedId = getAccountId(provisioned);
  if (provisioned.state?.toLowerCase() !== 'deployed') {
    await fetch(`${PROVISION_BASE}/users/current/accounts/${provisionedId}/deploy`, {
      method: 'POST',
      headers: { 'auth-token': METAAPI_TOKEN },
    });
  }
  const deployed = await waitForDeployed(provisionedId, METAAPI_TOKEN);

  // 3. Fetch real account information (may fail if terminal not yet streaming — that's ok)
  const region = deployed.region ?? 'new-york';
  const firm   = detectFirm(server);
  const isDemo = server.toLowerCase().includes('demo');

  let balance = 0, equity = 0, currency = 'USD', accountType: 'demo' | 'live' = isDemo ? 'demo' : 'live';
  try {
    const info = await fetchAccountInfo(provisionedId, region, METAAPI_TOKEN);
    balance     = info.balance;
    equity      = info.equity;
    currency    = info.currency ?? 'USD';
    accountType = info.type?.includes('DEMO') ? 'demo' : 'live';
  } catch (err) {
    console.warn('[MetaAPI] Could not fetch account info (will sync later):', err);
  }

  return {
    id:               `mt5_${login.trim()}_${server.replace(/[^a-zA-Z0-9]/g, '_')}`,
    login:            login.trim(),
    server,
    firm,
    balance,
    equity,
    currency,
    accountType,
    status:           'connected',
    lastSync:         new Date().toISOString(),
    metaApiAccountId: provisionedId,
    metaApiRegion:    region,
  };
}
