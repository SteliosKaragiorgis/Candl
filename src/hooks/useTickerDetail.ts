import { useState, useEffect, useRef } from 'react';

const KEY = import.meta.env.VITE_FINNHUB_KEY as string | undefined;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CandlePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyProfile {
  name: string;
  exchange: string;
  sector: string;
}

export interface TickerFinancials {
  pe: string;
  eps: string;
  revenue: string;
  grossMargin: string;
  high52: number;
  low52: number;
  analystTarget: string;
  nextEarnings: string;
}

export type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'All';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getResolution(tf: Timeframe): string {
  if (tf === '1D')  return '5';
  if (tf === '5D')  return '15';
  if (tf === '1M' || tf === '3M') return 'D';
  if (tf === '6M' || tf === '1Y') return 'W';
  return 'M';
}

function getFrom(tf: Timeframe): number {
  const now = Math.floor(Date.now() / 1000);
  const d = 86400;
  const offsets: Record<Timeframe, number> = {
    '1D': d, '5D': d * 7, '1M': d * 35, '3M': d * 95,
    '6M': d * 190, '1Y': d * 370, 'All': d * 1825,
  };
  return now - offsets[tf];
}

export function candlesToSvgPoints(candles: CandlePoint[], width = 520, height = 100, pad = 8): string {
  if (!candles.length) return '';
  const closes = candles.map(c => c.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  return candles.map((c, i) => {
    const x = candles.length === 1 ? width / 2 : (i / (candles.length - 1)) * width;
    const y = height - pad - ((c.close - min) / range) * (height - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function formatRevenue(millions: number): string {
  if (millions >= 1000) return `$${(millions / 1000).toFixed(1)}B`;
  return `$${millions.toFixed(0)}M`;
}

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Candles ───────────────────────────────────────────────────────────────────

export function useTickerCandles(symbol: string, timeframe: Timeframe) {
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!KEY || !symbol) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setCandles([]);

    const resolution = getResolution(timeframe);
    const from = getFrom(timeframe);
    const to = Math.floor(Date.now() / 1000);

    fetchJSON(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${KEY}`
    )
      .then(data => {
        if (cancelled) return;
        if (data.s === 'ok' && Array.isArray(data.c) && data.c.length) {
          setCandles(data.c.map((_: number, i: number) => ({
            time: data.t[i], open: data.o[i], high: data.h[i],
            low: data.l[i], close: data.c[i], volume: data.v[i],
          })));
        }
      })
      .catch(e => console.error('[Candles]', symbol, e))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [symbol, timeframe]);

  return { candles, loading };
}

// ── Company profile ───────────────────────────────────────────────────────────

export function useCompanyProfile(symbol: string) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!KEY || !symbol) { setLoading(false); return; }
    let cancelled = false;

    fetchJSON(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${KEY}`)
      .then(data => {
        if (cancelled || !data.name) return;
        setProfile({
          name: data.name,
          exchange: data.exchange ?? '',
          sector: data.finnhubIndustry ?? '',
        });
      })
      .catch(e => console.error('[Profile]', symbol, e))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [symbol]);

  return { profile, loading };
}

// ── Basic financials ──────────────────────────────────────────────────────────

export function useBasicFinancials(symbol: string) {
  const [financials, setFinancials] = useState<TickerFinancials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!KEY || !symbol) { setLoading(false); return; }
    let cancelled = false;

    const today = new Date().toISOString().slice(0, 10);
    const sixMonths = new Date(Date.now() + 86400000 * 180).toISOString().slice(0, 10);

    Promise.all([
      fetchJSON(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${KEY}`),
      fetchJSON(`https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${KEY}`),
      fetchJSON(`https://finnhub.io/api/v1/calendar/earnings?from=${today}&to=${sixMonths}&symbol=${symbol}&token=${KEY}`),
    ])
      .then(([metricRes, targetRes, earningsRes]) => {
        if (cancelled) return;
        const m = metricRes?.metric ?? {};

        const upcoming = earningsRes?.earningsCalendar ?? [];
        const next = upcoming.find((e: { date: string }) => new Date(e.date) >= new Date());
        const nextEarnings = next
          ? new Date(next.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '—';

        setFinancials({
          pe: m.peNormalizedAnnual ? `${(m.peNormalizedAnnual as number).toFixed(1)}×` : '—',
          eps: m.epsNormalizedAnnual != null ? `$${(m.epsNormalizedAnnual as number).toFixed(2)}` : '—',
          revenue: m.revenueTTM ? formatRevenue(m.revenueTTM as number) : '—',
          grossMargin: m.grossMarginTTM != null ? `${(m.grossMarginTTM as number).toFixed(1)}%` : '—',
          high52: (m['52WeekHigh'] as number) ?? 0,
          low52: (m['52WeekLow'] as number) ?? 0,
          analystTarget: targetRes?.targetMean ? `$${(targetRes.targetMean as number).toFixed(0)} avg` : '—',
          nextEarnings,
        });
      })
      .catch(e => console.error('[Financials]', symbol, e))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [symbol]);

  return { financials, loading };
}

// ── WebSocket real-time price ─────────────────────────────────────────────────

export function useRealtimePrice(symbol: string, initialPrice: number) {
  const [price, setPrice] = useState(initialPrice);

  // Sync initial price when quote data arrives from REST
  useEffect(() => {
    if (initialPrice > 0) setPrice(initialPrice);
  }, [initialPrice]);

  useEffect(() => {
    if (!KEY || !symbol) return;

    let ws: WebSocket;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(`wss://ws.finnhub.io?token=${KEY}`);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      };

      ws.onmessage = (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data as string);
          if (msg.type === 'trade' && Array.isArray(msg.data)) {
            const trades = (msg.data as { s: string; p: number }[]).filter(t => t.s === symbol);
            if (trades.length) setPrice(trades[trades.length - 1].p);
          }
        } catch { /* ignore malformed frames */ }
      };

      ws.onerror = () => {
        // Reconnect after 5s on error
        retryTimeout = setTimeout(connect, 5000);
      };

      ws.onclose = () => { /* no auto-reconnect on intentional close */ };
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
        ws.close();
      }
    };
  }, [symbol]);

  return price;
}
