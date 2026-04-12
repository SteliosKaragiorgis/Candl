import { useRef, useEffect } from 'react'
import {
  createChart,
  createSeriesMarkers,
  LineStyle,
  CandlestickSeries,
  type UTCTimestamp,
  type SeriesMarker,
  type DeepPartial,
  type ChartOptions,
} from 'lightweight-charts'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TradeChartTrade {
  symbol:      string
  direction:   'LONG' | 'SHORT'
  entry:       number
  exit:        number
  stopLoss?:   number
  takeProfit?: number
  pnl?:        number
  rMultiple?:  number
  timeframe?:  string
  openedAt?:   string
  closedAt?:   string
}

interface Props {
  trade:         TradeChartTrade
  height?:       number
  chartOptions?: DeepPartial<ChartOptions>
}

// ── Timeframe map ─────────────────────────────────────────────────────────────

const TF_MS: Record<string, number> = {
  M1:  60_000,
  M5:  300_000,
  M15: 900_000,
  H1:  3_600_000,
  H4:  14_400_000,
  D1:  86_400_000,
}

// ── Price format ──────────────────────────────────────────────────────────────

import { getPriceFormat } from '../../utils/priceFormat'

// ── Seeded PRNG ───────────────────────────────────────────────────────────────

function seededRand(seed: number) {
  let s = Math.abs(Math.round(seed)) || 1
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
}

// ── Synthetic OHLCV generation ────────────────────────────────────────────────

interface OHLCV {
  time:  UTCTimestamp
  open:  number
  high:  number
  low:   number
  close: number
}

function generateOHLCV(
  entry:   number,
  exit:    number,
  openTs:  number,   // ms
  closeTs: number,   // ms
  tfMs:    number,
): OHLCV[] {
  const rand      = seededRand(entry * 9999 + exit * 111 + openTs % 1_000_000 + tfMs)
  // Scale tick size with timeframe so candles look proportional at any zoom
  const tfScale   = Math.sqrt(tfMs / 3_600_000)  // 1.0 at H1, smaller for M1/M5, larger for H4/D1
  const tick      = entry * 0.0009 * tfScale
  const alignedStart = Math.floor(openTs / tfMs) * tfMs - 14 * tfMs
  const alignedEnd   = Math.ceil(closeTs / tfMs) * tfMs  + 14 * tfMs
  const totalTicks   = Math.max(Math.round((alignedEnd - alignedStart) / tfMs), 20)

  const candles: OHLCV[] = []
  let prev = entry + (rand() - 0.5) * tick * 3

  for (let i = 0; i < totalTicks; i++) {
    const ts       = alignedStart + i * tfMs
    const isIn     = ts >= openTs && ts <= closeTs
    const progress = isIn
      ? (ts - openTs) / Math.max(closeTs - openTs, tfMs)
      : 0

    const target = ts < openTs
      ? entry + (rand() - 0.48) * tick * 2
      : ts > closeTs
        ? exit + (rand() - 0.5) * tick * 3
        : entry + (exit - entry) * Math.min(progress, 1)

    const pull  = isIn ? 0.22 : 0.07
    const noise = (rand() - 0.5) * tick * (isIn ? 0.65 : 1.1)
    const open  = prev
    const close = open + (target - open) * pull + noise
    const wH    = (rand() * 0.55 + 0.18) * tick * 0.45
    const wL    = (rand() * 0.55 + 0.18) * tick * 0.45

    candles.push({
      time:  Math.floor(ts / 1000) as UTCTimestamp,
      open,
      high:  Math.max(open, close) + wH,
      low:   Math.min(open, close) - wL,
      close,
    })
    prev = close
  }

  return candles
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TradeChart({ trade, height = 260, chartOptions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // ── Timestamps ───────────────────────────────────────────────────────────
    const now     = Date.now()
    const openTs  = trade.openedAt  ? new Date(trade.openedAt).getTime()  : now - 4 * 3_600_000
    const closeTs = trade.closedAt  ? new Date(trade.closedAt).getTime()  : now - 1 * 3_600_000
    const tfMs    = TF_MS[trade.timeframe ?? 'H1'] ?? TF_MS.H1

    // ── Chart ────────────────────────────────────────────────────────────────
    const chart = createChart(el, {
      width:  el.clientWidth,
      height,
      layout: {
        background:  { color: '#060606' },
        textColor:   '#1a1a1a',
        fontSize:    11,
        fontFamily:  '-apple-system, Inter, sans-serif',
      },
      grid: {
        vertLines: { color: '#0b0b0b', style: LineStyle.Solid },
        horzLines: { color: '#0c0c0c', style: LineStyle.Solid },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color:                '#1e1e1e',
          width:                1,
          style:                LineStyle.Dashed,
          labelBackgroundColor: '#141414',
        },
        horzLine: {
          color:                '#1e1e1e',
          width:                1,
          style:                LineStyle.Dashed,
          labelBackgroundColor: '#141414',
        },
      },
      rightPriceScale: {
        borderColor:  '#0d0d0d',
        textColor:    '#1a1a1a',
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor:    '#0d0d0d',
        textColor:      '#1a1a1a',
        timeVisible:    true,
        secondsVisible: false,
      },
      watermark:    { visible: false },
      handleScroll: {
        mouseWheel:       true,
        pressedMouseMove: true,
        horzTouchDrag:    true,
        vertTouchDrag:    false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel:           true,
        pinch:                true,
      },
    })

    if (chartOptions) chart.applyOptions(chartOptions)

    // ── Candlestick series ───────────────────────────────────────────────────
    const { precision, minMove } = getPriceFormat(trade.symbol, trade.entry)

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:          '#22c55e',
      downColor:        '#ef4444',
      borderUpColor:    '#22c55e',
      borderDownColor:  '#ef4444',
      wickUpColor:      '#22c55e',
      wickDownColor:    '#ef4444',
      borderVisible:    true,
      wickVisible:      true,
      lastValueVisible: false,
      priceLineVisible: false,
      priceFormat:      { type: 'price', precision, minMove },
    })

    // ── Candle data with dimming ─────────────────────────────────────────────
    const rawCandles = generateOHLCV(
      trade.entry,
      trade.exit || trade.entry,
      openTs,
      closeTs,
      tfMs,
    )

    const coloredData = rawCandles.map(candle => {
      const candleTs = (candle.time as number) * 1000
      // In-window: candle starts at or after openTs and overlaps closeTs
      const inWindow = candleTs >= openTs && candleTs < closeTs + tfMs
      if (inWindow) return candle
      const isBull = candle.close >= candle.open
      const dimColor = isBull ? '#1e4d2e' : '#4d1e1e'
      return {
        ...candle,
        color:       dimColor,
        borderColor: dimColor,
        wickColor:   dimColor,
      }
    })

    candleSeries.setData(coloredData)


    // ── B / S markers ────────────────────────────────────────────────────────
    const isLong  = trade.direction === 'LONG'
    const markers: SeriesMarker<UTCTimestamp>[] = []

    markers.push({
      time:     Math.floor(openTs / 1000) as UTCTimestamp,
      position: isLong ? 'belowBar' : 'aboveBar',
      color:    isLong ? '#22c55e' : '#ef4444',
      shape:    isLong ? 'arrowUp' : 'arrowDown',
      text:     isLong ? 'B' : 'S',
      size:     1,
    })

    if (trade.exit > 0 && trade.exit !== trade.entry) {
      markers.push({
        time:     Math.floor(closeTs / 1000) as UTCTimestamp,
        position: isLong ? 'aboveBar' : 'belowBar',
        color:    isLong ? '#ef4444' : '#22c55e',
        shape:    isLong ? 'arrowDown' : 'arrowUp',
        text:     isLong ? 'S' : 'B',
        size:     1,
      })
    }

    createSeriesMarkers(
      candleSeries,
      markers.sort((a, b) => (a.time as number) - (b.time as number)),
    )

    // ── Zoom to trade window ─────────────────────────────────────────────────
    {
      const durationMs = Math.max(closeTs - openTs, tfMs * 2)
      const padding    = Math.min(Math.max(durationMs * 0.5, 30 * 60 * 1000), 2 * 60 * 60 * 1000)
      chart.timeScale().setVisibleRange({
        from: Math.floor((openTs  - padding) / 1000) as UTCTimestamp,
        to:   Math.ceil ((closeTs + padding) / 1000) as UTCTimestamp,
      })
    }

    // ── Resize observer ──────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.remove()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    trade.symbol, trade.direction, trade.entry, trade.exit,
    trade.stopLoss, trade.takeProfit, trade.openedAt, trade.closedAt,
    trade.timeframe, height,
  ])

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', background: '#060606', borderRadius: 6, overflow: 'hidden' }} />
      {/* Covers the TradingView attribution logo rendered bottom-left of the canvas */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: 60, height: 26,
        background: '#060606',
        zIndex: 10,
        pointerEvents: 'none',
        borderRadius: '0 0 0 6px',
      }} />
    </div>
  )
}
