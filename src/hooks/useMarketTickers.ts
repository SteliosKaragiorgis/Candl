import { useState, useEffect } from 'react';

const KEY = import.meta.env.VITE_FINNHUB_KEY as string;

export interface Ticker {
  label: string;
  price: string;
  change: string;
  up: boolean;
}

interface SymbolConfig {
  label: string;
  symbol: string;
  decimals?: number;
}

async function fetchQuote(symbol: string): Promise<{ c: number; dp: number } | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${KEY}`
    );
    if (!res.ok) {
      console.error(`[Finnhub] ${symbol}: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data.c == null || data.c <= 0) {
      console.warn(`[Finnhub] ${symbol}: no price`, data);
      return null;
    }
    return { c: data.c, dp: data.dp ?? 0 };
  } catch (e) {
    console.error(`[Finnhub] ${symbol}:`, e);
    return null;
  }
}

function formatPrice(price: number, decimals: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return price.toFixed(decimals);
}

export function useMarketTickers(configs: SymbolConfig[], intervalMs = 60_000): Ticker[] {
  const [tickers, setTickers] = useState<Ticker[]>(
    configs.map(c => ({ label: c.label, price: '—', change: '—', up: true }))
  );

  useEffect(() => {
    async function fetchAll() {
      for (let i = 0; i < configs.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 300));
        const result = await fetchQuote(configs[i].symbol);
        if (result) {
          const c = configs[i];
          const { c: price, dp } = result;
          const decimals = c.decimals ?? 2;
          setTickers(prev => {
            const next = [...prev];
            next[i] = {
              label: c.label,
              price: formatPrice(price, decimals),
              change: `${dp >= 0 ? '+' : ''}${dp.toFixed(2)}%`,
              up: dp >= 0,
            };
            return next;
          });
        }
      }
    }

    fetchAll();
    const id = setInterval(fetchAll, intervalMs);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return tickers;
}

export const DESKTOP_CONFIGS: SymbolConfig[] = [
  { label: 'NVDA', symbol: 'NVDA' },
  { label: 'SPY',  symbol: 'SPY' },
  { label: 'TSLA', symbol: 'TSLA' },
  { label: 'AAPL', symbol: 'AAPL' },
  { label: 'META', symbol: 'META' },
  { label: 'AMD',  symbol: 'AMD' },
  { label: 'AMZN', symbol: 'AMZN' },
  { label: 'MSFT', symbol: 'MSFT' },
];

export const MOBILE_CONFIGS: SymbolConfig[] = [
  { label: 'S&P', symbol: '^GSPC',            decimals: 2 },
  { label: 'NAS', symbol: '^NDX',             decimals: 2 },
  { label: 'VIX', symbol: '^VIX',             decimals: 2 },
  { label: 'BTC', symbol: 'BINANCE:BTCUSDT',  decimals: 0 },
  { label: 'GOLD', symbol: 'GLD',             decimals: 2 },
];
