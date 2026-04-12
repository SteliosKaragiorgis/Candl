import { useRef, useEffect } from 'react';
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  LineSeries,
  type UTCTimestamp,
  type SeriesMarker,
} from 'lightweight-charts';
import type { Trade } from '../../../types/trade';
import type { ShareCardUser } from '../ShareableTradeCard';
import { FF, fmtPrice, fmtPnl } from './CardA';

// ── Constants ──────────────────────────────────────────────────────────────────

const N_CANDLES = 80;
const ENTRY_IDX = 40;
const EXIT_IDX  = 60;
const SHOW_BEFORE = 5;
const SHOW_AFTER  = 5;
const FROM_IDX = ENTRY_IDX - SHOW_BEFORE;
const TO_IDX   = EXIT_IDX  + SHOW_AFTER;
const VISIBLE_COUNT = TO_IDX - FROM_IDX;

const entryPct = ((ENTRY_IDX - FROM_IDX) / VISIBLE_COUNT) * 100;
const exitPct  = ((EXIT_IDX  - FROM_IDX) / VISIBLE_COUNT) * 100;
const linePct  = exitPct - entryPct;

// ── Helpers ────────────────────────────────────────────────────────────────────

type OHLCCandle = { o: number; h: number; l: number; c: number };

function seededRand(seed: number) {
  let s = Math.abs(Math.round(seed)) || 1;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function generateCandles(entry: number, exit: number, sl: number, direction: 'LONG' | 'SHORT'): OHLCCandle[] {
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
      exit + (rand() - 0.48) * tick * 3;
    const pull  = inTrade ? 0.18 : 0.06;
    const noise = (rand() - 0.5) * tick * (inTrade ? 0.75 : 1.2);
    const open  = prev;
    let   close = open + (target - open) * pull + noise;
    if (inTrade && sl > 0) {
      if (direction === 'LONG') close = Math.max(close, sl + Math.abs(entry - sl) * 0.06);
      else                      close = Math.min(close, sl - Math.abs(sl - entry) * 0.06);
    }
    const wH = (rand() * 0.7 + 0.2) * tick * 0.6;
    const wL = (rand() * 0.7 + 0.2) * tick * 0.6;
    out.push({ o: open, h: Math.max(open, close) + wH, l: Math.min(open, close) - wL, c: close });
    prev = close;
  }
  return out;
}

function getPriceFormat(symbol: string, price: number) {
  const sym = symbol.toUpperCase();
  if (sym.includes('JPY'))  return { precision: 3, minMove: 0.001 };
  if (price >= 10000)       return { precision: 1, minMove: 0.1 };
  if (price >= 100)         return { precision: 2, minMove: 0.01 };
  if (price >= 10)          return { precision: 3, minMove: 0.001 };
  return                           { precision: 5, minMove: 0.00001 };
}

function fmtTimeShort(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  trade: Trade;
  user: ShareCardUser;
}

export default function CardC({ trade, user }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  const isLong  = trade.direction === 'LONG';
  const pnlPos  = trade.pnl >= 0;
  const pnlStr  = fmtPnl(trade.pnl);
  const rStr    = trade.rMultiple >= 0
    ? `+${trade.rMultiple.toFixed(2)}R`
    : `${trade.rMultiple.toFixed(2)}R`;

  const sl = trade.stopLoss ?? 0;

  const TF_MINS = 60;
  const baseMs  = trade.openedAt ? new Date(trade.openedAt).getTime() : Date.now();
  const startMs = baseMs - ENTRY_IDX * TF_MINS * 60_000;

  const visFromSec = Math.floor((startMs + FROM_IDX * TF_MINS * 60_000) / 1000);
  const visToSec   = Math.floor((startMs + TO_IDX   * TF_MINS * 60_000) / 1000);

  const capLeft  = fmtTimeShort(visFromSec);
  const capRight = fmtTimeShort(visToSec);
  const capCenter = `${pnlStr} · ${rStr}`;

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width:  400,
      height: 200,
      layout: {
        background: { type: ColorType.Solid, color: '#080808' },
        textColor: '#1a1a1a',
      },
      grid: {
        vertLines: { color: '#0f0f0f' },
        horzLines: { color: '#0f0f0f' },
      },
      rightPriceScale: { visible: false },
      timeScale:       { visible: false },
      handleScroll: false,
      handleScale:  false,
      crosshair: { mode: 0 },
    });

    const { precision, minMove } = getPriceFormat(trade.symbol, trade.entry);

    const beforeSeries = chart.addSeries(LineSeries, {
      color: '#333333', lineWidth: 2, lastValueVisible: false, priceLineVisible: false,
      priceFormat: { type: 'price', precision, minMove },
    });
    const duringSeries = chart.addSeries(LineSeries, {
      color: '#22c55e', lineWidth: 2, lastValueVisible: false, priceLineVisible: false,
      priceFormat: { type: 'price', precision, minMove },
    });
    const afterSeries = chart.addSeries(LineSeries, {
      color: '#333333', lineWidth: 2, lastValueVisible: false, priceLineVisible: false,
      priceFormat: { type: 'price', precision, minMove },
    });

    const rawCandles = generateCandles(trade.entry, trade.exit, sl, trade.direction);
    const lineData = rawCandles.map((c: OHLCCandle, i: number) => ({
      time:  Math.floor((startMs + i * TF_MINS * 60_000) / 1000) as UTCTimestamp,
      value: c.c,
    }));

    beforeSeries.setData(lineData.slice(FROM_IDX, ENTRY_IDX + 1));
    duringSeries.setData(lineData.slice(ENTRY_IDX, EXIT_IDX + 1));
    afterSeries.setData(lineData.slice(EXIT_IDX, Math.min(N_CANDLES, TO_IDX + 1)));

    // Markers
    const entryT = lineData[ENTRY_IDX]?.time;
    const exitT  = lineData[EXIT_IDX]?.time;
    if (entryT !== undefined && exitT !== undefined) {
      const markers: SeriesMarker<UTCTimestamp>[] = [
        {
          time: entryT, position: isLong ? 'belowBar' : 'aboveBar',
          color: isLong ? '#22c55e' : '#ef4444',
          shape: isLong ? 'arrowUp' : 'arrowDown', text: isLong ? 'B' : 'S', size: 1,
        },
        {
          time: exitT, position: isLong ? 'aboveBar' : 'belowBar',
          color: isLong ? '#ef4444' : '#22c55e',
          shape: isLong ? 'arrowDown' : 'arrowUp', text: isLong ? 'S' : 'B', size: 1,
        },
      ];
      createSeriesMarkers(duringSeries, markers);
    }

    // Viewport
    const visFrom = lineData[FROM_IDX]?.time;
    const visTo   = lineData[TO_IDX]?.time;
    if (visFrom !== undefined && visTo !== undefined) {
      chart.timeScale().setVisibleRange({ from: visFrom, to: visTo });
    } else {
      chart.timeScale().fitContent();
    }

    return () => { chart.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade.symbol, trade.entry, trade.exit, trade.direction, sl]);

  return (
    <div style={{
      width: 400, background: '#0d0d0d', border: '0.5px solid #1e1e1e',
      borderRadius: 12, overflow: 'hidden', fontFamily: FF,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 15px', borderBottom: '0.5px solid #1a1a1a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#0d1f12', border: '1.5px solid #22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 500, color: '#22c55e', fontFamily: FF, flexShrink: 0,
          }}>{user.avatarInitials}</div>
          <div style={{ marginLeft: 9 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8e8', fontFamily: FF, lineHeight: 1.2 }}>{user.displayName}</div>
            <div style={{ fontSize: 11, color: '#444', marginLeft: 4, fontFamily: FF, display: 'inline' }}>@{user.handle}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', fontFamily: FF, lineHeight: 1 }}>Candl.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: '#333', fontFamily: FF }}>MT5 verified</span>
          </div>
        </div>
      </div>

      {/* Symbol Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 15px 10px' }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#e8e8e8', letterSpacing: '-0.02em', fontFamily: FF }}>{trade.symbol}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 3, fontFamily: FF,
          background: isLong ? '#0d1f12' : '#1f0d0d', color: isLong ? '#22c55e' : '#ef4444',
          border: `0.5px solid ${isLong ? '#1a3a22' : '#3a1a1a'}`,
        }}>{isLong ? 'LONG' : 'SHORT'}</span>
        <span style={{
          marginLeft: 'auto', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
          color: pnlPos ? '#22c55e' : '#ef4444', fontVariantNumeric: 'tabular-nums', fontFamily: FF,
        }}>{pnlStr}</span>
      </div>

      {/* Line Chart */}
      <div style={{ background: '#080808', height: 200, overflow: 'hidden', position: 'relative' }}>
        <div ref={chartRef} style={{ width: 400, height: 200 }} />
        <div style={{
          position: 'absolute', bottom: 10, left: `${entryPct}%`, width: `${linePct}%`,
          display: 'flex', alignItems: 'center', pointerEvents: 'none',
        }}>
          <div style={{ width: 1, height: 7, background: '#1a3a22', flexShrink: 0 }} />
          <div style={{ flex: 1, height: 1, background: '#1a3a22' }} />
          <div style={{ fontSize: 9, color: '#22c55e', fontFamily: FF, background: '#080808', padding: '0 4px', whiteSpace: 'nowrap', flexShrink: 0 }}>{trade.duration}</div>
          <div style={{ flex: 1, height: 1, background: '#1a3a22' }} />
          <div style={{ width: 1, height: 7, background: '#1a3a22', flexShrink: 0 }} />
        </div>
      </div>

      {/* Caption Bar */}
      <div style={{
        background: '#080808', borderBottom: '0.5px solid #1a1a1a', padding: '5px 15px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 9, color: '#222', fontFamily: FF }}>{capLeft}</span>
        <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 500, fontFamily: FF }}>{capCenter}</span>
        <span style={{ fontSize: 9, color: '#222', fontFamily: FF }}>{capRight}</span>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#1a1a1a' }}>
        {[
          { label: 'Entry', value: fmtPrice(trade.entry), color: '#c8c8c8' },
          { label: 'Exit', value: fmtPrice(trade.exit), color: '#c8c8c8' },
          { label: 'Stop Loss', value: trade.stopLoss && trade.stopLoss > 0 ? fmtPrice(trade.stopLoss) : '—', color: trade.stopLoss && trade.stopLoss > 0 ? '#ef4444' : '#333' },
          { label: 'R Multiple', value: rStr, color: trade.rMultiple >= 0 ? '#22c55e' : '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#111', padding: '8px 11px' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums', fontFamily: FF }}>{value}</div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#2a2a2a', marginTop: 2, fontFamily: FF }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 15px', borderTop: '0.5px solid #1a1a1a',
      }}>
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'Win Rate', value: `${user.winRate}%`, color: '#22c55e' },
            { label: 'Total Trades', value: String(user.totalTrades), color: '#666666' },
            { label: 'Avg R:R', value: `${user.avgRR.toFixed(1)}R`, color: '#666666' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 12, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums', fontFamily: FF }}>{value}</div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#222', marginTop: 1, fontFamily: FF }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 500, color: '#22c55e', background: '#0d1f12',
          border: '0.5px solid #1a3a22', padding: '3px 9px', borderRadius: 4, fontFamily: FF, whiteSpace: 'nowrap',
        }}>candl.io/@{user.handle}</div>
      </div>
    </div>
  );
}
