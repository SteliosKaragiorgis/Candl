import { useState, useEffect } from 'react';
import type { OHLCCandle } from '../components/feed/TradeChart';

const METAAPI_TOKEN = import.meta.env.VITE_METAAPI_TOKEN as string | undefined;

// TradeChart only supports M1 M5 M15 H1 H4 as tab labels — cap at H4.
export type ChartTF = 'M1' | 'M5' | 'M15' | 'H1' | 'H4';

function pickTf(openTime: string, closeTime: string): { tf: ChartTF; mins: number } {
  const durMins = (Date.parse(closeTime) - Date.parse(openTime)) / 60_000;
  if (durMins <= 30)   return { tf: 'M1',  mins: 1   };
  if (durMins <= 120)  return { tf: 'M5',  mins: 5   };
  if (durMins <= 480)  return { tf: 'M15', mins: 15  };
  if (durMins <= 2880) return { tf: 'H1',  mins: 60  };
  return                      { tf: 'H4',  mins: 240 };
}

interface Params {
  symbol:    string;
  openTime:  string;
  closeTime: string;
  accountId: string;
  region:    string;
  enabled?:  boolean;
}

export function useTradeCandles({
  symbol, openTime, closeTime, accountId, region, enabled = true,
}: Params): { candles: OHLCCandle[] | null; loading: boolean; timeframe: ChartTF } {
  const { tf: initialTf, mins } = pickTf(openTime, closeTime);
  const [candles,   setCandles]   = useState<OHLCCandle[] | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [timeframe, setTimeframe] = useState<ChartTF>(initialTf);

  useEffect(() => {
    if (!enabled || !METAAPI_TOKEN || !accountId || !region || !symbol) return;

    let mounted = true;
    setCandles(null);
    setLoading(true);

    const { tf, mins: tfMins } = pickTf(openTime, closeTime);
    const preMs   = 70 * tfMins * 60_000;
    const postMs  = 25 * tfMins * 60_000;
    const startMs = Date.parse(openTime)  - preMs;
    const endMs   = Date.parse(closeTime) + postMs;
    const limit   = Math.min(Math.ceil((endMs - startMs) / (tfMins * 60_000)) + 10, 200);

    const url =
      `/api/metaapi-client/${region}/users/current/accounts/${accountId}` +
      `/historical-market-data/symbols/${encodeURIComponent(symbol)}` +
      `/timeframes/${tf}/candles` +
      `?startTime=${encodeURIComponent(new Date(startMs).toISOString())}` +
      `&limit=${limit}`;

    fetch(url)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((raw: unknown) => {
        if (!mounted) return;
        if (!Array.isArray(raw) || raw.length < 5) return;
        const sorted = (raw as Array<{ time: string; open: number; high: number; low: number; close: number }>)
          .slice()
          .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
        setTimeframe(tf);
        // Include Unix-second timestamps so Lightweight Charts can use real X-axis positions
        setCandles(sorted.map(c => ({
          o: c.open, h: c.high, l: c.low, c: c.close,
          t: Math.floor(Date.parse(c.time) / 1000),
        })));
      })
      .catch(() => { /* fall back to generated data */ })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, openTime, closeTime, accountId, region, enabled]);

  return { candles, loading, timeframe };
}

/**
 * When a trade has no SL or TP configured (value is 0 or falsy), synthesise
 * visual bounds so the chart Y-axis doesn't collapse to 0→price.
 * The fallback places SL 2× the trade range beyond entry, TP 1× beyond exit.
 */
export function chartBounds(
  direction: 'LONG' | 'SHORT' | 'long' | 'short',
  entry: number,
  exit: number,
  stopLoss: number | undefined,
  takeProfit: number | undefined,
): { sl: number; tp: number } {
  const isLong  = direction.toUpperCase() === 'LONG';
  const spread  = Math.abs(exit - entry) || entry * 0.003;

  const sl = stopLoss && stopLoss > 0
    ? stopLoss
    : isLong ? entry - spread * 2 : entry + spread * 2;

  const tp = takeProfit && takeProfit > 0
    ? takeProfit
    : isLong ? exit + spread : exit - spread;

  return { sl, tp };
}
