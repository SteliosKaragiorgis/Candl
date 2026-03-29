import {
  createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode,
} from 'react';

const KEY = import.meta.env.VITE_FINNHUB_KEY as string | undefined;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WatchlistTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  sparkPoints: string;
  hasAlert: boolean;
  addedAt: number;
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  type: string;
}

interface WatchlistCtx {
  tickers: WatchlistTicker[];
  quotesLoading: boolean;
  searchSymbols: (query: string) => Promise<SymbolSearchResult[]>;
  addTicker: (symbol: string, name: string) => void;
  removeTicker: (symbol: string) => void;
  toggleAlert: (symbol: string) => void;
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const LS_SYMBOLS = 'candl_wl_symbols';
const LS_NAMES   = 'candl_wl_names';
const LS_ALERTS  = 'candl_wl_alerts';
const LS_ADDED   = 'candl_wl_added';

// ── Default symbols (shown on first load) ─────────────────────────────────────

const DEFAULT_SYMBOLS = ['NVDA', 'TSLA', 'META', 'SPY', 'AAPL', 'AMD', 'MSFT', 'AMZN'];

const DEFAULT_NAMES: Record<string, string> = {
  NVDA: 'Nvidia Corporation',
  TSLA: 'Tesla Inc',
  META: 'Meta Platforms',
  SPY:  'S&P 500 ETF',
  AAPL: 'Apple Inc',
  AMD:  'Advanced Micro Devices',
  MSFT: 'Microsoft Corp',
  AMZN: 'Amazon.com Inc',
};

// ── Demo sparklines for the default set ───────────────────────────────────────

const DEMO_SPARK: Record<string, string> = {
  NVDA: '0,28 8,22 16,26 24,18 32,10 40,14 48,8 56,4 64,2',
  TSLA: '0,4 8,8 16,6 24,12 32,18 40,16 48,22 56,26 64,30',
  META: '0,28 8,24 16,20 24,16 32,12 40,8 48,6 56,4 64,2',
  SPY:  '0,12 8,10 16,14 24,12 32,16 40,14 48,18 56,16 64,20',
  AAPL: '0,20 8,18 16,16 24,14 32,12 40,10 48,8 56,6 64,4',
  AMD:  '0,24 8,20 16,22 24,16 32,12 40,10 48,8 56,6 64,4',
  MSFT: '0,18 8,16 16,18 24,14 32,12 40,10 48,9 56,8 64,6',
  AMZN: '0,12 8,14 16,12 24,14 32,16 40,18 48,20 56,18 64,20',
};

function generateSparkline(changePct: number): string {
  // Simple 9-point sparkline derived from overall trend
  const up = changePct >= 0;
  const steps = 8;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = i * 8;
    // Add some noise + trend
    const trend = up ? (i / steps) * 26 : 26 - (i / steps) * 26;
    const noise = Math.sin(i * 2.1) * 4;
    const y = Math.max(2, Math.min(30, up ? 28 - trend + noise : 4 + trend + noise));
    points.push(`${x},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchQuote(symbol: string) {
  if (!KEY) return null;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${KEY}`
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.c || d.c <= 0) return null;
    return { price: d.c as number, change: d.d as number, changePct: d.dp as number, open: d.o as number, high: d.h as number, low: d.l as number };
  } catch {
    return null;
  }
}

async function searchFinnhub(query: string): Promise<SymbolSearchResult[]> {
  if (!KEY || query.length < 1) return [];
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${KEY}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return ((data.result ?? []) as { symbol: string; description: string; type: string }[])
      .filter(r => r.type === 'Common Stock' || r.type === 'ETP')
      .slice(0, 8)
      .map(r => ({ symbol: r.symbol, name: r.description, type: r.type }));
  } catch {
    return [];
  }
}

function loadFromStorage(): { symbols: string[]; names: Record<string,string>; alerts: Record<string,boolean>; added: Record<string,number> } {
  try {
    const symbols = JSON.parse(localStorage.getItem(LS_SYMBOLS) ?? 'null') ?? DEFAULT_SYMBOLS;
    const names   = JSON.parse(localStorage.getItem(LS_NAMES)   ?? 'null') ?? { ...DEFAULT_NAMES };
    const alerts  = JSON.parse(localStorage.getItem(LS_ALERTS)  ?? 'null') ?? {};
    const added   = JSON.parse(localStorage.getItem(LS_ADDED)   ?? 'null') ?? {};
    return { symbols, names, alerts, added };
  } catch {
    return { symbols: DEFAULT_SYMBOLS, names: { ...DEFAULT_NAMES }, alerts: {}, added: {} };
  }
}

function saveSymbols(symbols: string[], names: Record<string,string>, alerts: Record<string,boolean>, added: Record<string,number>) {
  localStorage.setItem(LS_SYMBOLS, JSON.stringify(symbols));
  localStorage.setItem(LS_NAMES,   JSON.stringify(names));
  localStorage.setItem(LS_ALERTS,  JSON.stringify(alerts));
  localStorage.setItem(LS_ADDED,   JSON.stringify(added));
}

// ── Context ───────────────────────────────────────────────────────────────────

const WatchlistContext = createContext<WatchlistCtx>({
  tickers: [], quotesLoading: false,
  searchSymbols: async () => [],
  addTicker: () => {}, removeTicker: () => {}, toggleAlert: () => {},
});

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();

  const [symbols, setSymbols] = useState<string[]>(stored.symbols);
  const [names,   setNames]   = useState<Record<string,string>>(stored.names);
  const [alerts,  setAlerts]  = useState<Record<string,boolean>>(stored.alerts);
  const [added,   setAdded]   = useState<Record<string,number>>(stored.added);
  const [quotes,  setQuotes]  = useState<Record<string, ReturnType<typeof fetchQuote> extends Promise<infer T> ? NonNullable<T> : never>>({});
  const [quotesLoading, setQuotesLoading] = useState(true);

  const wsRef      = useRef<WebSocket | null>(null);
  const wsSymbols  = useRef<Set<string>>(new Set());
  const pricesRef  = useRef<Record<string, number>>({});

  // ── REST quote fetch ──────────────────────────────────────────────────────

  const fetchAllQuotes = useCallback(async (syms: string[]) => {
    setQuotesLoading(true);
    for (let i = 0; i < syms.length; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 450));
      const q = await fetchQuote(syms[i]);
      if (q) {
        setQuotes(prev => ({ ...prev, [syms[i]]: q }));
        pricesRef.current[syms[i]] = q.price;
      }
    }
    setQuotesLoading(false);
  }, []);

  useEffect(() => {
    fetchAllQuotes(symbols);
    const id = setInterval(() => fetchAllQuotes(symbols), 90_000);
    return () => clearInterval(id);
  }, [symbols, fetchAllQuotes]);

  // ── WebSocket real-time trades ────────────────────────────────────────────

  useEffect(() => {
    if (!KEY) return;

    function connect() {
      const ws = new WebSocket(`wss://ws.finnhub.io?token=${KEY}`);
      wsRef.current = ws;

      ws.onopen = () => {
        symbols.forEach(s => {
          ws.send(JSON.stringify({ type: 'subscribe', symbol: s }));
          wsSymbols.current.add(s);
        });
      };

      ws.onmessage = (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data as string);
          if (msg.type === 'trade' && Array.isArray(msg.data)) {
            const updates: Record<string, number> = {};
            for (const t of msg.data as { s: string; p: number }[]) {
              updates[t.s] = t.p;
            }
            if (Object.keys(updates).length) {
              pricesRef.current = { ...pricesRef.current, ...updates };
              setQuotes(prev => {
                const next = { ...prev };
                for (const [sym, price] of Object.entries(updates)) {
                  if (next[sym]) {
                    const change    = price - (next[sym].open || price);
                    const changePct = next[sym].open > 0 ? ((price - next[sym].open) / next[sym].open) * 100 : next[sym].changePct;
                    next[sym] = { ...next[sym], price, change, changePct };
                  }
                }
                return next;
              });
            }
          }
        } catch { /* ignore malformed frames */ }
      };

      ws.onerror   = () => setTimeout(connect, 5000);
      ws.onclose   = () => { wsRef.current = null; };
    }

    connect();

    return () => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        wsSymbols.current.forEach(s =>
          ws.send(JSON.stringify({ type: 'unsubscribe', symbol: s }))
        );
        ws.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Connect once; subscribe new symbols separately below

  // Subscribe newly added symbols to existing WebSocket
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    symbols.forEach(s => {
      if (!wsSymbols.current.has(s)) {
        ws.send(JSON.stringify({ type: 'subscribe', symbol: s }));
        wsSymbols.current.add(s);
      }
    });
  }, [symbols]);

  // ── Persist to localStorage ───────────────────────────────────────────────

  useEffect(() => {
    saveSymbols(symbols, names, alerts, added);
  }, [symbols, names, alerts, added]);

  // ── Public actions ────────────────────────────────────────────────────────

  const addTicker = useCallback((symbol: string, name: string) => {
    const sym = symbol.toUpperCase();
    setSymbols(prev => prev.includes(sym) ? prev : [...prev, sym]);
    setNames(prev => ({ ...prev, [sym]: name }));
    setAdded(prev => ({ ...prev, [sym]: Date.now() }));
    // Fetch quote immediately for the new ticker
    fetchQuote(sym).then(q => {
      if (q) setQuotes(prev => ({ ...prev, [sym]: q }));
    });
    // Subscribe on WS
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN && !wsSymbols.current.has(sym)) {
      ws.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
      wsSymbols.current.add(sym);
    }
  }, []);

  const removeTicker = useCallback((symbol: string) => {
    setSymbols(prev => prev.filter(s => s !== symbol));
    // Unsubscribe from WS
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
      wsSymbols.current.delete(symbol);
    }
  }, []);

  const toggleAlert = useCallback((symbol: string) => {
    setAlerts(prev => ({ ...prev, [symbol]: !prev[symbol] }));
  }, []);

  const searchSymbols = useCallback(searchFinnhub, []);

  // ── Assemble tickers ──────────────────────────────────────────────────────

  const tickers: WatchlistTicker[] = symbols.map(sym => {
    const q = quotes[sym];
    const changePct = q?.changePct ?? 0;
    return {
      symbol:     sym,
      name:       names[sym] ?? sym,
      price:      q?.price      ?? 0,
      change:     q?.change     ?? 0,
      changePct,
      open:       q?.open       ?? 0,
      high:       q?.high       ?? 0,
      low:        q?.low        ?? 0,
      sparkPoints: DEMO_SPARK[sym] ?? generateSparkline(changePct),
      hasAlert:   alerts[sym]  ?? false,
      addedAt:    added[sym]   ?? 0,
    };
  });

  return (
    <WatchlistContext.Provider value={{ tickers, quotesLoading, searchSymbols, addTicker, removeTicker, toggleAlert }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
