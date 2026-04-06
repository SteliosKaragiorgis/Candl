import { useRef, useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OHLCCandle = { o: number; h: number; l: number; c: number }

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
}

type TF = 'M1' | 'M5' | 'M15' | 'H1' | 'H4';
const TIMEFRAMES: TF[] = ['M1', 'M5', 'M15', 'H1', 'H4'];
const TF_MINUTES: Record<string, number> = { M1: 1, M5: 5, M15: 15, H1: 60, H4: 240, D1: 1440 };

// ── Canvas colour palettes ────────────────────────────────────────────────────

type Palette = {
  bg:             string
  grid:           string
  axisText:       string
  bull:           string
  bear:           string
  slLine:         string   // dashed line colour
  tpLine:         string
  entryLine:      string
  slPillBg:       string
  slPillBorder:   string
  slPillText:     string
  tpPillBg:       string
  tpPillBorder:   string
  tpPillText:     string
  entryPillBg:    string
  entryPillText:  string
  buyMarker:      string   // B circle fill
  sellMarker:     string   // S circle fill
}

const DARK: Palette = {
  bg:            '#0e0e0e',
  grid:          '#181818',
  axisText:      '#444',
  bull:          '#26a69a',
  bear:          '#ef5350',
  slLine:        '#ef535066',
  tpLine:        '#26a69a55',
  entryLine:     '#26a69a88',
  slPillBg:      '#1e1e1e',
  slPillBorder:  '#ef535066',
  slPillText:    '#aaa',
  tpPillBg:      '#1e1e1e',
  tpPillBorder:  '#26a69a55',
  tpPillText:    '#aaa',
  entryPillBg:   '#26a69a',
  entryPillText: '#fff',
  buyMarker:     '#26a69a',
  sellMarker:    '#ef5350',
}

const LIGHT: Palette = {
  bg:            '#f8f9fb',
  grid:          '#e2e4e8',
  axisText:      '#aaa',
  bull:          '#16a34a',
  bear:          '#dc2626',
  slLine:        '#ef444466',
  tpLine:        '#16a34a55',
  entryLine:     '#2563eb88',
  slPillBg:      '#f0f0f2',
  slPillBorder:  '#ef444455',
  slPillText:    '#888',
  tpPillBg:      '#f0f0f2',
  tpPillBorder:  '#16a34a55',
  tpPillText:    '#888',
  entryPillBg:   '#2563eb',
  entryPillText: '#fff',
  buyMarker:     '#2563eb',
  sellMarker:    '#ef4444',
}

// ── Data generation ───────────────────────────────────────────────────────────

const N_CANDLES  = 110
const ENTRY_IDX  = 65
const EXIT_IDX   = 88

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
    const progress = inTrade
      ? (i - ENTRY_IDX) / Math.max(EXIT_IDX - ENTRY_IDX, 1) : 0;

    const target =
      i < ENTRY_IDX  ? entry + (rand() - 0.48) * tick * 2 :
      i <= EXIT_IDX  ? entry + (exit - entry) * progress :
      exit + (rand() - 0.48) * tick * 3;

    const pull  = inTrade ? 0.18 : 0.06;
    const noise = (rand() - 0.5) * tick * (inTrade ? 0.75 : 1.2);
    const open  = prev;
    let   close = open + (target - open) * pull + noise;

    // Never breach SL during trade
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

// ── Axis helpers ──────────────────────────────────────────────────────────────

function niceStep(range: number, ticks: number): number {
  const rough = range / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * mag >= rough) return f * mag;
  return 10 * mag;
}

function formatPrice(p: number): string {
  if (p >= 10000) return p.toFixed(1);
  if (p >= 100)   return p.toFixed(2);
  if (p >= 1)     return p.toFixed(4);
  return p.toFixed(5);
}

function formatDuration(a: string, b: string): string {
  try {
    const ms = new Date(b).getTime() - new Date(a).getTime();
    if (isNaN(ms) || ms <= 0) return '—';
    const mins = Math.floor(ms / 60000);
    const hrs  = Math.floor(mins / 60);
    return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
  } catch { return '—'; }
}

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
}: TradeChartProps) {
  const { theme } = useTheme();
  const palRef = useRef(theme === 'light' ? LIGHT : DARK);

  const defaultTF: TF = TIMEFRAMES.includes(timeframe as TF) ? (timeframe as TF) : 'H1';
  const [activeTF, setActiveTF] = useState<TF>(defaultTF);
  const activeTFRef = useRef(activeTF);

  const isLong   = direction === 'long';
  const pnlColor = pnl !== undefined ? (pnl >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-3)';
  const duration = formatDuration(entryTime, exitTime);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const paintRef     = useRef<() => void>(() => {});

  // Mutable viewport — avoids React re-renders on every wheel/drag
  const view = useRef({ offset: 0.0, candleW: 8.5 });
  const drag = useRef({ active: false, startX: 0, startOffset: 0 });

  // Keep palette ref in sync
  useEffect(() => {
    palRef.current = theme === 'light' ? LIGHT : DARK;
    paintRef.current();
  }, [theme]);

  // Keep activeTF ref in sync and repaint
  useEffect(() => {
    activeTFRef.current = activeTF;
    paintRef.current();
  }, [activeTF]);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const candles: OHLCCandle[] = priceData && priceData.length >= 10
      ? priceData
      : generateCandles(entryPrice, exitPrice, stopLoss, direction);

    const N        = candles.length;
    const entryIdx = priceData ? Math.floor(N * 0.6)  : ENTRY_IDX;
    const exitIdx  = priceData ? Math.floor(N * 0.8)  : EXIT_IDX;

    // ── Constants
    const PAD_L   = 8;
    const PAD_R   = 88;   // price axis + pills
    const PAD_T   = 10;
    const PAD_B   = 26;   // time labels

    function paint() {
      const pal = palRef.current;
      const dpr = window.devicePixelRatio || 1;
      const W   = container.getBoundingClientRect().width;
      const H   = 240;
      if (!W) return;

      canvas.width        = Math.round(W * dpr);
      canvas.height       = Math.round(H * dpr);
      canvas.style.width  = `${W}px`;
      canvas.style.height = `${H}px`;

      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cW     = W - PAD_L - PAD_R;
      const cH     = H - PAD_T - PAD_B;
      const slotW  = view.current.candleW;
      const offset = view.current.offset;

      // Clamp offset
      const maxOffset = N - Math.max(Math.floor(cW / slotW), 5);
      view.current.offset = Math.max(-3, Math.min(maxOffset + 3, offset));

      // Visible candle range
      const firstVis = Math.max(0, Math.floor(view.current.offset));
      const lastVis  = Math.min(N - 1, Math.ceil(view.current.offset + cW / slotW));

      // Price range from visible candles (+ reference levels)
      const visPrices: number[] = [];
      for (let i = firstVis; i <= lastVis; i++) {
        visPrices.push(candles[i].h, candles[i].l);
      }
      visPrices.push(stopLoss, takeProfit, entryPrice, exitPrice);
      const rawMin  = Math.min(...visPrices);
      const rawMax  = Math.max(...visPrices);
      const rawRng  = rawMax - rawMin || rawMax * 0.01;
      const dispMin = rawMin - rawRng * 0.15;
      const dispMax = rawMax + rawRng * 0.15;
      const dispRng = dispMax - dispMin;

      const pToY = (p: number) => PAD_T + (1 - (p - dispMin) / dispRng) * cH;
      // X of candle i: position relative to view.current.offset
      const cxOf  = (i: number) => PAD_L + (i - view.current.offset + 0.5) * slotW;

      // ── Background
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);

      // ── Clip chart area (no candles drawn in padding)
      ctx.save();
      ctx.beginPath();
      ctx.rect(PAD_L, PAD_T, cW, cH);
      ctx.clip();

      // ── Grid + price axis ticks
      const step = niceStep(dispRng, 5);
      const firstTick = Math.ceil(dispMin / step) * step;

      ctx.strokeStyle = pal.grid;
      ctx.lineWidth   = 0.5;
      for (let p = firstTick; p <= dispMax; p += step) {
        const y = pToY(p);
        ctx.beginPath();
        ctx.moveTo(PAD_L, y);
        ctx.lineTo(W - PAD_R, y);
        ctx.stroke();
      }

      // ── Reference dashed lines (clipped to chart area)
      function dashedLine(price: number, color: string) {
        const y = pToY(price);
        ctx.strokeStyle = color;
        ctx.lineWidth   = 0.8;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(PAD_L, y);
        ctx.lineTo(W - PAD_R, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      dashedLine(stopLoss,   pal.slLine);
      dashedLine(takeProfit, pal.tpLine);
      dashedLine(entryPrice, pal.entryLine);

      // ── Candlesticks
      const bodyW = Math.max(slotW * 0.64, 1.2);
      const wickW = Math.max(bodyW * 0.18, 0.7);

      for (let i = firstVis; i <= lastVis; i++) {
        const { o, h, l, c } = candles[i];
        const bull   = c >= o;
        const color  = bull ? pal.bull : pal.bear;
        const cx     = cxOf(i);
        const openY  = pToY(o);
        const closeY = pToY(c);
        const highY  = pToY(h);
        const lowY   = pToY(l);
        const bTop   = Math.min(openY, closeY);
        const bH     = Math.max(Math.abs(closeY - openY), 1.0);

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth   = wickW;
        ctx.beginPath();
        ctx.moveTo(cx, highY);
        ctx.lineTo(cx, lowY);
        ctx.stroke();

        // Body — hollow outline for doji/tiny candles looks cleaner
        ctx.fillStyle = color;
        ctx.fillRect(cx - bodyW / 2, bTop, bodyW, bH);
      }

      // ── B / S circle markers
      function marker(idx: number, price: number, letter: string, fill: string) {
        if (idx < firstVis || idx > lastVis) return;
        const cx = cxOf(idx);
        const cy = pToY(price);
        const r  = Math.min(8, slotW * 1.1);

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font      = `600 ${Math.round(r * 1.1)}px Inter,system-ui,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, cx, cy);
        ctx.textBaseline = 'alphabetic';
      }

      marker(entryIdx, entryPrice, isLong ? 'B' : 'S', isLong ? pal.buyMarker  : pal.sellMarker);
      marker(exitIdx,  exitPrice,  isLong ? 'S' : 'B', isLong ? pal.sellMarker : pal.buyMarker);

      ctx.restore(); // end chart clip

      // ── Price axis (right of chart, outside clip)
      ctx.fillStyle = pal.axisText;
      ctx.font      = '9px Inter,system-ui,sans-serif';
      ctx.textAlign = 'left';
      for (let p = firstTick; p <= dispMax; p += step) {
        const y = pToY(p);
        if (y < PAD_T || y > H - PAD_B) continue;
        ctx.fillText(formatPrice(p), W - PAD_R + 4, y + 3.5);
      }

      // ── Right-edge pill labels
      function pill(
        price: number,
        text: string,
        bg: string, border: string, textColor: string,
      ) {
        const y   = pToY(price);
        const ph  = 14;
        const py  = Math.max(PAD_T, Math.min(H - PAD_B - ph, y - ph / 2));
        const px  = W - PAD_R + 4;

        ctx.font = '8.5px Inter,system-ui,sans-serif';
        const tw  = ctx.measureText(text).width;
        const pw  = tw + 12;

        // Pill background
        ctx.fillStyle   = bg;
        roundRect(ctx, px, py, pw, ph, 2);
        ctx.fill();
        // Pill border
        ctx.strokeStyle = border;
        ctx.lineWidth   = 0.5;
        roundRect(ctx, px, py, pw, ph, 2);
        ctx.stroke();
        // Pill text
        ctx.fillStyle   = textColor;
        ctx.textAlign   = 'left';
        ctx.fillText(text, px + 6, py + ph - 3.5);
      }

      pill(
        stopLoss,
        `Stop Loss | ${formatPrice(stopLoss)}`,
        pal.slPillBg, pal.slPillBorder, pal.slPillText,
      );
      pill(
        takeProfit,
        `Take Profit | ${formatPrice(takeProfit)}`,
        pal.tpPillBg, pal.tpPillBorder, pal.tpPillText,
      );
      pill(
        entryPrice,
        `Entry | ${formatPrice(entryPrice)}`,
        pal.entryPillBg, pal.entryPillBg, pal.entryPillText,
      );

      // ── Separator above time axis
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth   = 0.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(PAD_L, H - PAD_B);
      ctx.lineTo(W - PAD_R, H - PAD_B);
      ctx.stroke();

      // ── Time labels
      const tfMins  = TF_MINUTES[activeTFRef.current] ?? 60;
      const base    = entryTime ? new Date(entryTime) : null;
      const validTs = base && !isNaN(base.getTime());

      ctx.fillStyle    = pal.axisText;
      ctx.font         = '8px Inter,system-ui,sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'alphabetic';

      // Show a label every ~80px of chart width
      const labelEvery = Math.max(1, Math.round(80 / slotW));
      let lastLabelX   = -9999;

      for (let i = firstVis; i <= lastVis; i++) {
        if ((i % labelEvery) !== 0) continue;
        const cx = cxOf(i);
        if (cx < PAD_L + 20 || cx > W - PAD_R - 20) continue;
        if (cx - lastLabelX < 55) continue;

        let label: string;
        if (validTs) {
          const ms = (i - entryIdx) * tfMins * 60000;
          const d  = new Date(base!.getTime() + ms);
          label = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
          const dm = (i - entryIdx) * tfMins;
          label = dm === 0     ? 'Entry'
               : Math.abs(dm) >= 60 ? `${dm > 0 ? '+' : ''}${Math.round(dm / 60)}h`
               : `${dm > 0 ? '+' : ''}${dm}m`;
        }
        ctx.fillText(label, cx, H - 6);
        lastLabelX = cx;
      }
    }

    paintRef.current = paint;

    // Set initial offset so entry candle is about 60% from the left
    function initView() {
      const W  = container.getBoundingClientRect().width;
      const cW = W - PAD_L - PAD_R;
      if (!cW) return;
      // Fit all candles initially with a small gap
      const fitCW = cW / N;
      view.current.candleW = Math.max(4, Math.min(fitCW, 12));
      // Center the trade window (entry → exit) in the viewport
      const tradeCenter = (entryIdx + exitIdx) / 2;
      const visibleN = cW / view.current.candleW;
      view.current.offset = Math.max(0, tradeCenter - visibleN * 0.55);
    }

    initView();
    paint();

    // ── Interaction: wheel zoom ───────────────────────────────────────────────
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect    = canvas.getBoundingClientRect();
      const mouseX  = (e.clientX - rect.left) - PAD_L;
      const oldCW   = view.current.candleW;
      const factor  = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newCW   = Math.max(2, Math.min(50, oldCW * factor));

      // Keep the candle under the cursor fixed while zooming
      const idxUnderMouse = view.current.offset + mouseX / oldCW;
      view.current.candleW = newCW;
      view.current.offset  = idxUnderMouse - mouseX / newCW;
      paint();
    }

    // ── Interaction: drag pan ─────────────────────────────────────────────────
    function onMouseDown(e: MouseEvent) {
      drag.current = { active: true, startX: e.clientX, startOffset: view.current.offset };
      canvas.style.cursor = 'grabbing';
    }
    function onMouseMove(e: MouseEvent) {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.startX;
      view.current.offset = drag.current.startOffset - dx / view.current.candleW;
      paint();
    }
    function onMouseUp() {
      drag.current.active = false;
      canvas.style.cursor = 'crosshair';
    }

    // ── Interaction: touch pan + pinch zoom ───────────────────────────────────
    let lastTouchDist = 0;
    let lastTouchMidX = 0;
    let touchStartOffset = 0;
    let touchStartX = 0;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
        lastTouchMidX = ((e.touches[0].clientX + e.touches[1].clientX) / 2)
          - canvas.getBoundingClientRect().left - PAD_L;
      } else if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartOffset = view.current.offset;
      }
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const midX = ((e.touches[0].clientX + e.touches[1].clientX) / 2)
          - canvas.getBoundingClientRect().left - PAD_L;

        const factor = dist / lastTouchDist;
        const oldCW  = view.current.candleW;
        const newCW  = Math.max(2, Math.min(50, oldCW * factor));
        const idxUnderMid = view.current.offset + lastTouchMidX / oldCW;
        view.current.candleW = newCW;
        view.current.offset  = idxUnderMid - midX / newCW;
        lastTouchDist = dist;
        lastTouchMidX = midX;
        paint();
      } else if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        view.current.offset = touchStartOffset - dx / view.current.candleW;
        paint();
      }
    }

    canvas.addEventListener('wheel',      onWheel,     { passive: false });
    canvas.addEventListener('mousedown',  onMouseDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    window.addEventListener('mousemove',  onMouseMove);
    window.addEventListener('mouseup',    onMouseUp);

    canvas.style.cursor = 'crosshair';

    const ro = new ResizeObserver(() => { initView(); paint(); });
    ro.observe(container);

    return () => {
      canvas.removeEventListener('wheel',      onWheel);
      canvas.removeEventListener('mousedown',  onMouseDown);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseup',    onMouseUp);
      ro.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, entryPrice, exitPrice, stopLoss, takeProfit, priceData, isLong, entryTime]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--surface)', border: 'var(--bw) solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 6px', flexWrap: 'wrap', borderBottom: 'var(--bw) solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
            {symbol}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 500, letterSpacing: '0.06em',
            padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase',
            color: isLong ? 'var(--green)' : 'var(--red)',
            background: isLong ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `var(--bw) solid ${isLong ? 'var(--green-border)' : 'var(--red-border)'}`,
            flexShrink: 0,
          }}>
            {isLong ? 'LONG' : 'SHORT'}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-4)', marginLeft: 2 }}>
            scroll to zoom · drag to pan
          </span>
        </div>

        {/* Timeframe tabs */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={e => { e.stopPropagation(); setActiveTF(tf); }}
              style={{
                fontSize: 9, fontWeight: 500, letterSpacing: '0.04em',
                padding: '2px 5px', borderRadius: 3, cursor: 'pointer',
                textTransform: 'uppercase',
                border: `var(--bw) solid ${activeTF === tf ? 'var(--green)' : 'var(--border)'}`,
                background: activeTF === tf ? 'var(--green-bg)' : 'transparent',
                color: activeTF === tf ? 'var(--green)' : 'var(--text-4)',
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* P&L */}
        {(pnl !== undefined || rMultiple !== undefined) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {pnl !== undefined && (
              <span style={{ fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: pnlColor }}>
                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
              </span>
            )}
            {rMultiple !== undefined && (
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                {rMultiple}R
              </span>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ width: '100%', touchAction: 'none' }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, padding: '6px 12px 10px', borderTop: 'var(--bw) solid var(--border-subtle)' }}>
        {[
          { label: 'ENTRY',    value: formatPrice(entryPrice), color: 'var(--text-2)' },
          { label: 'EXIT',     value: formatPrice(exitPrice),  color: 'var(--text-2)' },
          { label: 'SL',       value: formatPrice(stopLoss),   color: 'var(--red)' },
          { label: 'TP',       value: formatPrice(takeProfit), color: 'var(--green)' },
          { label: 'DURATION', value: duration,                color: 'var(--text-2)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--surface2)', border: 'var(--bw) solid var(--border)', borderRadius: 4, padding: '5px 6px' }}>
            <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--text-4)', textTransform: 'uppercase', marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Util ──────────────────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
