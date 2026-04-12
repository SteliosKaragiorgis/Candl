import { useRef, useEffect, useState } from 'react';
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  LineStyle,
  CandlestickSeries,
  type UTCTimestamp,
  type SeriesMarker,
} from 'lightweight-charts';
import { useTheme } from '../../context/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OHLCCandle = { o: number; h: number; l: number; c: number; t?: number }

export type TradeChartProps = {
  symbol: string
  direction: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  stopLoss: number
  takeProfit: number
  entryTime: string
  exitTime: string
  pnl?: number
  rMultiple?: number
  timeframe?: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1'
  priceData?: OHLCCandle[]
  height?: number
  /** Force dark chart colours regardless of app theme (used in TradePostDark) */
  forceDark?: boolean
  /** When provided, dims candles outside the entry→exit trade window */
  tradeWindow?: { openedAt: string; closedAt: string }
}

type TF = 'M1' | 'M5' | 'M15' | 'H1' | 'H4';
const TIMEFRAMES: TF[] = ['M1', 'M5', 'M15', 'H1', 'H4'];
const TF_MINUTES: Record<string, number> = { M1: 1, M5: 5, M15: 15, H1: 60, H4: 240 };

// ── Seeded OHLC generation ────────────────────────────────────────────────────

const N_CANDLES = 110;
const ENTRY_IDX = 65;
const EXIT_IDX  = 88;

function seededRand(seed: number) {
  let s = Math.abs(Math.round(seed)) || 1;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function generateCandles(
  entry: number, exit: number, sl: number, direction: 'long' | 'short',
): OHLCCandle[] {
  const tick = entry * 0.00085;
  const rand = seededRand(entry * 9999 + exit * 111);
  const out: OHLCCandle[] = [];
  let prev = entry + (rand() - 0.48) * tick * 6;

  for (let i = 0; i < N_CANDLES; i++) {
    const inTrade = i >= ENTRY_IDX && i <= EXIT_IDX;
    const progress = inTrade ? (i - ENTRY_IDX) / Math.max(EXIT_IDX - ENTRY_IDX, 1) : 0;

    const target =
      i < ENTRY_IDX  ? entry + (rand() - 0.48) * tick * 2 :
      i <= EXIT_IDX  ? entry + (exit - entry) * progress :
      exit  + (rand() - 0.48) * tick * 3;

    const pull  = inTrade ? 0.18 : 0.06;
    const noise = (rand() - 0.5) * tick * (inTrade ? 0.75 : 1.2);
    const open  = prev;
    let   close = open + (target - open) * pull + noise;

    if (inTrade) {
      if (direction === 'long')  close = Math.max(close, sl + Math.abs(entry - sl) * 0.06);
      else                       close = Math.min(close, sl - Math.abs(sl - entry) * 0.06);
    }

    const wH = (rand() * 0.7 + 0.2) * tick * 0.6;
    const wL = (rand() * 0.7 + 0.2) * tick * 0.6;
    out.push({ o: open, h: Math.max(open, close) + wH, l: Math.min(open, close) - wL, c: close });
    prev = close;
  }
  return out;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

import { getPriceFormat } from '../../utils/priceFormat';

// ── Component ─────────────────────────────────────────────────────────────────

export default function TradeChart({
  symbol,
  direction,
  entryPrice,
  exitPrice,
  stopLoss,
  takeProfit,
  entryTime,
  exitTime,
  pnl,
  rMultiple,
  timeframe,
  priceData,
  height = 240,
  forceDark = false,
  tradeWindow,
}: TradeChartProps) {
  const { theme } = useTheme();
  const isLong = direction === 'long';
  const defaultTF: TF = TIMEFRAMES.includes(timeframe as TF) ? (timeframe as TF) : 'H1';
  const [activeTF, setActiveTF] = useState<TF>(defaultTF);

  const pnlColor = pnl !== undefined ? (pnl >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-3)';

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isDark    = forceDark || (theme as string) !== 'light';
    const bg        = isDark ? '#0a0a0a' : '#f2f4f7';
    const textColor = isDark ? '#666'    : '#999';
    const gridColor = isDark ? 'transparent' : '#e4e6ea';
    const border    = isDark ? 'rgba(255,255,255,0.06)' : '#d8dce4';

    const chart = createChart(el, {
      width:  el.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: { borderColor: border },
      timeScale: {
        borderColor: border,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: { mode: 1 },
      handleScale: true,
      handleScroll: true,
      watermark: { visible: false },
    });

    const { precision, minMove } = getPriceFormat(symbol, entryPrice);
    const fmtP = (p: number) => p.toFixed(precision);
    const upCol   = isDark ? '#22c55e' : 'var(--green, #16a34a)';
    const downCol = isDark ? '#ef4444' : 'var(--red, #dc2626)';
    const series = chart.addSeries(CandlestickSeries, {
      upColor:       upCol,
      downColor:     downCol,
      borderVisible: false,
      wickUpColor:   upCol,
      wickDownColor: downCol,
      priceFormat:   { type: 'price', precision, minMove },
    });

    // ── Build candle array ───────────────────────────────────────────────────
    const rawCandles: OHLCCandle[] = priceData && priceData.length >= 10
      ? priceData
      : generateCandles(entryPrice, exitPrice, stopLoss, direction);

    const N        = rawCandles.length;
    const entryIdx = priceData ? Math.floor(N * 0.6) : ENTRY_IDX;
    const exitIdx  = priceData ? Math.floor(N * 0.8) : EXIT_IDX;

    // Use real timestamps from MetaAPI candles when available (t field),
    // otherwise synthesise based on the selected timeframe and entryTime.
    const tfMins  = TF_MINUTES[activeTF] ?? 60;
    const baseMs  = entryTime ? new Date(entryTime).getTime() : Date.now();
    const startMs = baseMs - entryIdx * tfMins * 60_000;

    const chartData = rawCandles.map((c, i) => {
      const ts = c.t
        ? c.t                                                   // real timestamp (seconds)
        : Math.floor((startMs + i * tfMins * 60_000) / 1000);  // synthetic

      const base = { time: ts as UTCTimestamp, open: c.o, high: c.h, low: c.l, close: c.c };

      if (tradeWindow) {
        const inWindow = i >= entryIdx && i <= exitIdx;
        const isBull   = c.c >= c.o;
        if (inWindow) {
          const col = isBull ? '#22c55e' : '#ef4444';
          return { ...base, color: col, borderColor: col, wickColor: col };
        }
        return { ...base, color: '#1e1e1e', borderColor: '#1e1e1e', wickColor: '#1e1e1e' };
      }

      return base;
    });

    series.setData(chartData);

    // ── Markers (B / S circles) ──────────────────────────────────────────────
    const entryT = chartData[entryIdx]?.time;
    const exitT  = chartData[exitIdx]?.time;

    if (entryT !== undefined && exitT !== undefined) {
      const markers: SeriesMarker<UTCTimestamp>[] = [
        {
          time:     entryT,
          position: isLong ? 'belowBar' : 'aboveBar',
          color:    isLong ? upCol  : downCol,
          shape:    'circle',
          text:     isLong ? 'B' : 'S',
          size:     1,
        },
        {
          time:     exitT,
          position: isLong ? 'aboveBar' : 'belowBar',
          color:    isLong ? downCol  : upCol,
          shape:    'circle',
          text:     isLong ? 'S' : 'B',
          size:     1,
        },
      ];
      createSeriesMarkers(series, markers);
    }

    // ── Price lines ──────────────────────────────────────────────────────────
    series.createPriceLine({
      price:            entryPrice,
      color:            upCol,
      lineWidth:        1,
      lineStyle:        LineStyle.Dashed,
      axisLabelVisible: true,
      title:            `Entry | ${fmtP(entryPrice)}`,
    });

    // Only draw SL/TP if they are real distinct prices (not synthetic fallbacks at 0)
    const slDist = Math.abs(stopLoss   - entryPrice) / (entryPrice || 1);
    const tpDist = Math.abs(takeProfit - entryPrice) / (entryPrice || 1);

    if (stopLoss > 0 && slDist > 0.0001) {
      series.createPriceLine({
        price:            stopLoss,
        color:            downCol,
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            `SL | ${fmtP(stopLoss)}`,
      });
    }

    if (takeProfit > 0 && tpDist > 0.0001) {
      series.createPriceLine({
        price:            takeProfit,
        color:            upCol,
        lineWidth:        1,
        lineStyle:        LineStyle.Dashed,
        axisLabelVisible: true,
        title:            `TP | ${fmtP(takeProfit)}`,
      });
    }

    // ── Initial viewport — show the trade window with some context ───────────
    const fromIdx = Math.max(0, entryIdx - 20);
    const toIdx   = Math.min(N - 1, exitIdx + 20);
    const visFrom = chartData[fromIdx]?.time;
    const visTo   = chartData[toIdx]?.time;
    if (visFrom !== undefined && visTo !== undefined) {
      chart.timeScale().setVisibleRange({ from: visFrom, to: visTo });
    } else {
      chart.timeScale().fitContent();
    }

    // ── Resize observer ──────────────────────────────────────────────────────
    const ro = new ResizeObserver(entries => {
      if (entries[0]) chart.resize(entries[0].contentRect.width, height);
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, entryPrice, exitPrice, stopLoss, takeProfit, priceData, isLong, entryTime, activeTF, theme, height, forceDark, tradeWindow]);

  const isDark = forceDark || (theme as string) !== 'light';
  const chartBg = isDark ? '#0a0a0a' : '#f2f4f7';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: chartBg }}>

      {/* TF tabs — overlaid top-left like TradingView */}
      <div style={{
        position: 'absolute', top: 8, left: 8, zIndex: 10,
        display: 'flex', gap: 2,
      }}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={e => { e.stopPropagation(); setActiveTF(tf); }}
            style={{
              fontSize: 9, fontWeight: 600, letterSpacing: '0.05em',
              padding: '2px 6px', borderRadius: 3, cursor: 'pointer',
              textTransform: 'uppercase', fontFamily: 'inherit',
              background: activeTF === tf
                ? isDark ? 'rgba(38,166,154,0.18)' : 'rgba(38,166,154,0.12)'
                : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              color:  activeTF === tf ? (isDark ? '#22c55e' : '#16a34a') : isDark ? '#555' : '#aaa',
              border: `1px solid ${activeTF === tf
                ? 'rgba(38,166,154,0.35)'
                : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* P&L overlay — top-right */}
      {(pnl !== undefined || rMultiple !== undefined) && (
        <div style={{
          position: 'absolute', top: 8, right: 60, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {pnl !== undefined && (
            <span style={{ fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: pnlColor }}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
            </span>
          )}
          {rMultiple !== undefined && (
            <span style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums', color: isDark ? '#555' : '#bbb' }}>
              {rMultiple}R
            </span>
          )}
        </div>
      )}

      {/* Lightweight Charts canvas */}
      <div ref={containerRef} style={{ width: '100%' }} />

      {/* Cover the TradingView attribution logo (bottom-left of canvas) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: 60, height: 26,
        background: chartBg,
        zIndex: 10,
        pointerEvents: 'none',
      }} />
    </div>
  );
}
