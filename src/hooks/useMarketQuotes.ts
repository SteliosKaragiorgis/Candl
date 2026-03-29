import { useState, useEffect } from 'react';

const KEY = import.meta.env.VITE_FINNHUB_KEY as string;

export interface MarketQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
}

export const PANEL_SYMBOLS: { ticker: string; name: string }[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation' },
  { ticker: 'TSLA', name: 'Tesla, Inc.' },
  { ticker: 'SPY',  name: 'S&P 500 ETF' },
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'META', name: 'Meta Platforms, Inc.' },
];

const FALLBACK: MarketQuote[] = PANEL_SYMBOLS.map(s => ({
  ...s, price: 0, change: 0, changePct: 0, open: 0, high: 0, low: 0,
}));

async function fetchQuote(symbol: string) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${KEY}`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ c: number; d: number; dp: number; h: number; l: number; o: number }>;
}

export function useMarketQuotes(intervalMs = 60_000) {
  const [quotes, setQuotes] = useState<MarketQuote[]>(FALLBACK);

  useEffect(() => {
    // Stagger panel fetches after ticker bar fetches settle (1s head-start offset)
    let cancelled = false;

    async function fetchAll() {
      for (let i = 0; i < PANEL_SYMBOLS.length; i++) {
        if (cancelled) return;
        if (i > 0) await new Promise(r => setTimeout(r, 400));
        try {
          const data = await fetchQuote(PANEL_SYMBOLS[i].ticker);
          if (!cancelled && data.c > 0) {
            setQuotes(prev => {
              const next = [...prev];
              next[i] = {
                ticker: PANEL_SYMBOLS[i].ticker,
                name: PANEL_SYMBOLS[i].name,
                price: data.c,
                change: data.d,
                changePct: data.dp,
                open: data.o,
                high: data.h,
                low: data.l,
              };
              return next;
            });
          }
        } catch (e) {
          console.error(`[Finnhub panel] ${PANEL_SYMBOLS[i].ticker}:`, e);
        }
      }
    }

    const init = setTimeout(fetchAll, 1000);
    const id = setInterval(fetchAll, intervalMs);
    return () => { cancelled = true; clearTimeout(init); clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { quotes };
}
