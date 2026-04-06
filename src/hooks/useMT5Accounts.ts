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

  return { accounts, addAccount, removeAccount, updateStatus };
}

// ─── Connect helper ───────────────────────────────────────────────────────────
// Validates credentials and builds an MT5Account locally.
// In production, swap this body for a real MetaStats/broker API call.

const SERVER_FIRM_MAP: Record<string, string> = {
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
};

function detectFirm(server: string): string {
  if (SERVER_FIRM_MAP[server]) return SERVER_FIRM_MAP[server];
  const s = server.toLowerCase();
  if (s.includes('ftmo'))        return 'FTMO';
  if (s.includes('funded') && s.includes('next')) return 'FundedNext';
  if (s.includes('funded'))      return 'TFT';
  if (s.includes('apex'))        return 'Apex';
  if (s.includes('e8'))          return 'E8';
  return 'Other';
}

export async function connectMT5Account(
  login: string,
  password: string,
  server: string,
  accountBalance?: number,
): Promise<MT5Account> {
  // Basic client-side validation
  if (!login.trim() || !password || !server.trim()) {
    throw new Error('Login, password and server are required.');
  }
  if (!/^\d{5,10}$/.test(login.trim())) {
    throw new Error('Login ID must be a 5–10 digit number.');
  }

  // Simulate network latency (replace with real API call in production)
  await new Promise(r => setTimeout(r, 1400));

  // Simulate an auth failure for obviously wrong passwords so the error
  // path is exercisable in dev without a real broker server.
  if (password.toLowerCase() === 'wrong' || password === '00000') {
    throw new Error('Invalid login or password. Check your MT5 credentials and try again.');
  }

  const firm        = detectFirm(server);
  const isDemo      = server.toLowerCase().includes('demo');
  const accountType = isDemo ? 'demo' : 'live';

  const balance = accountBalance && accountBalance > 0 ? accountBalance : 0;
  const equity  = balance;

  const account: MT5Account = {
    id:          `mt5_${login.trim()}_${server.replace(/[^a-zA-Z0-9]/g, '_')}`,
    login:       login.trim(),
    server,
    firm,
    balance,
    equity,
    currency:    'USD',
    accountType,
    status:      'connected',
    lastSync:    new Date().toISOString(),
  };

  return account;
}
