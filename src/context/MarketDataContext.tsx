import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const KEY = import.meta.env.VITE_FINNHUB_KEY as string;

export interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
}

// All symbols needed across the entire app
const ALL_SYMBOLS = [
  // Core equities
  'NVDA', 'SPY', 'TSLA', 'AAPL', 'META', 'AMD', 'AMZN', 'MSFT', 'GOOGL',
  // Macro / index ETFs
  'QQQ', 'TLT',
  // Commodity ETFs
  'GLD', 'SLV', 'USO', 'UNG', 'COPX', 'DBA', 'UUP',
  // Notable stocks often in news
  'MSTR', 'COIN',
];

const EMPTY_QUOTE = (ticker: string): Quote => ({
  ticker, price: 0, change: 0, changePct: 0, open: 0, high: 0, low: 0,
});

async function fetchQuote(symbol: string) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${KEY}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ c: number; d: number; dp: number; h: number; l: number; o: number }>;
}

interface MarketDataCtx {
  quotes: Record<string, Quote>;
}

const MarketDataContext = createContext<MarketDataCtx>({ quotes: {} });

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>(
    () => Object.fromEntries(ALL_SYMBOLS.map(s => [s, EMPTY_QUOTE(s)]))
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      for (let i = 0; i < ALL_SYMBOLS.length; i++) {
        if (cancelled) return;
        if (i > 0) await new Promise(r => setTimeout(r, 350));
        const symbol = ALL_SYMBOLS[i];
        try {
          const data = await fetchQuote(symbol);
          if (!cancelled && data.c > 0) {
            setQuotes(prev => ({
              ...prev,
              [symbol]: {
                ticker: symbol,
                price: data.c,
                change: data.d,
                changePct: data.dp,
                open: data.o,
                high: data.h,
                low: data.l,
              },
            }));
          }
        } catch (e) {
          console.error(`[Market] ${symbol}:`, e);
        }
      }
    }

    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <MarketDataContext.Provider value={{ quotes }}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  return useContext(MarketDataContext);
}
