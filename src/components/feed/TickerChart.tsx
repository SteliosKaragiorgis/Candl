// TickerChart.tsx
// Set API key in .env.local: VITE_TWELVEDATA_KEY=your_key_here

import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries, LineStyle, ColorType } from 'lightweight-charts'
import type { IChartApi, ISeriesApi } from 'lightweight-charts'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TickerMeta {
  symbol: string
  name: string
  exchange: string
  change: number
  changePercent: number
  close: number
}

interface TickerChartProps {
  onConfirm?: (ticker: string, meta: TickerMeta) => void
  entry?: string
  target?: string
  stop?: string
  direction?: 'long' | 'short'
  onTargetChange?: (val: string) => void
  onStopChange?: (val: string) => void
  showLevels?: boolean
  entryOnly?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_TWELVEDATA_KEY ?? ''

export interface SearchResult {
  symbol: string
  instrument_name: string
  exchange: string
  instrument_type: string
  currency: string
}

export async function fetchSearch(query: string): Promise<SearchResult[]> {
  const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${API_KEY}`
  const res = await fetch(url)
  const json = await res.json()
  if (!json.data) return []
  return (json.data as SearchResult[]).slice(0, 7)
}

export async function fetchQuote(symbol: string): Promise<TickerMeta> {
  const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${API_KEY}`
  const res = await fetch(url)
  const json = await res.json()
  if (json.status === 'error') throw new Error(json.message)
  return {
    symbol: json.symbol,
    name: json.name,
    exchange: json.exchange,
    close: parseFloat(json.close),
    change: parseFloat(json.change),
    changePercent: parseFloat(json.percent_change),
  }
}

const TF_OPTIONS = [
  { label: '15m', interval: '15min', outputsize: 150 },
  { label: '1H',  interval: '1h',    outputsize: 150 },
  { label: '4H',  interval: '4h',    outputsize: 120 },
  { label: '1D',  interval: '1day',  outputsize: 120 },
  { label: '1W',  interval: '1week', outputsize: 52  },
] as const

type TFLabel = typeof TF_OPTIONS[number]['label']

async function fetchCandles(symbol: string, interval: string, outputsize: number) {
  if (!API_KEY) return []
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`
    const json = await (await fetch(url)).json()
    if (!json.values) return []
    const isIntraday = interval !== '1day' && interval !== '1week' && interval !== '1month'
    return (json.values as { datetime: string; open: string; high: string; low: string; close: string }[])
      .reverse()
      .map(v => ({
        // Intraday needs a Unix timestamp (seconds); daily can use "YYYY-MM-DD" string
        time: isIntraday
          ? Math.floor(new Date(v.datetime.replace(' ', 'T') + 'Z').getTime() / 1000) as unknown as string
          : v.datetime,
        open: +v.open, high: +v.high, low: +v.low, close: +v.close,
      }))
  } catch { return [] }
}

/** Convert TwelveData exchange+symbol into a TradingView-compatible symbol (used for preview iframe) */
function toTVSymbol(exchange: string, symbol: string): string {
  const sym = symbol.replace('/', '')
  const ex = exchange.toLowerCase()
  if (ex === 'forex') return `FX:${sym}`
  if (ex === 'crypto' || ex === 'digital currency') return sym
  return `${exchange}:${sym}`
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function fmtPrice(p: number): string {
  if (p >= 100) return p.toFixed(2)
  if (p >= 10)  return p.toFixed(3)
  if (p >= 0.1) return p.toFixed(4)
  return p.toFixed(5)
}

// ─── ConfirmedChart ───────────────────────────────────────────────────────────

const CHART_H = window.innerWidth <= 768 ? 240 : 340

interface ConfirmedChartProps {
  meta: TickerMeta
  entry: number
  target: number
  stop: number
  onTargetChange?: (v: string) => void
  onStopChange?: (v: string) => void
  showLevels?: boolean
  entryOnly?: boolean
}

function ConfirmedChart({ meta, entry, target, stop, onTargetChange, onStopChange, showLevels = true, entryOnly = false }: ConfirmedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartApi     = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesApi    = useRef<ISeriesApi<'Candlestick'> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entryLine    = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const targetLine   = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stopLine     = useRef<any>(null)
  const draggingRef  = useRef<'target' | 'stop' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [timeframe, setTimeframe] = useState<TFLabel>('1D')

  // Keep current prices in refs so subscription callbacks always see fresh values
  const entryRef  = useRef(entry)
  const targetRef = useRef(target)
  const stopRef   = useRef(stop)

  // Label Y positions (px from top of chart)
  const [labelY, setLabelY] = useState<{ t: number | null; e: number | null; s: number | null }>({ t: null, e: null, s: null })

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  function syncLabels() {
    const s = seriesApi.current
    if (!s) return
    setLabelY({
      t: s.priceToCoordinate(targetRef.current) ?? null,
      e: s.priceToCoordinate(entryRef.current)  ?? null,
      s: s.priceToCoordinate(stopRef.current)   ?? null,
    })
  }

  // Create chart on mount
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const bg   = isDark ? '#1a1a1f' : '#ffffff'
    const grid = isDark ? '#2e2e36' : '#f0f0f0'
    const tc   = isDark ? '#686878' : '#999'
    const bc   = isDark ? '#2e2e36' : '#e8e8e8'

    const chart = createChart(el, {
      width: el.clientWidth,
      height: CHART_H,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: tc,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
      },
      grid: { vertLines: { color: grid }, horzLines: { color: grid } },
      rightPriceScale: { borderColor: bc },
      timeScale: { borderColor: bc, timeVisible: true },
      crosshair: { mode: 1 },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#16a34a', downColor: '#dc2626',
      borderUpColor: '#16a34a', borderDownColor: '#dc2626',
      wickUpColor: '#16a34a', wickDownColor: '#dc2626',
    })

    if (showLevels || entryOnly) {
      entryLine.current = series.createPriceLine({ price: entryRef.current, color: '#3b82f6', lineWidth: 2, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: ' ENTRY' })
    }
    if (showLevels && !entryOnly) {
      const tPct  = (targetRef.current - entryRef.current) / entryRef.current * 100
      const sPct  = (stopRef.current   - entryRef.current) / entryRef.current * 100
      const tSign = tPct >= 0 ? '+' : ''
      const sSign = sPct >= 0 ? '+' : ''

      targetLine.current = series.createPriceLine({ price: targetRef.current, color: '#16a34a', lineWidth: 2, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: ` TARGET ${tSign}${tPct.toFixed(2)}%` })
      stopLine.current   = series.createPriceLine({ price: stopRef.current,   color: '#dc2626', lineWidth: 2, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: ` STOP ${sSign}${sPct.toFixed(2)}%` })
    }

    chartApi.current  = chart
    seriesApi.current = series

    chart.timeScale().subscribeVisibleLogicalRangeChange(syncLabels)

    const ro = new ResizeObserver(([e]) => {
      chart.resize(e.contentRect.width, CHART_H)
      setTimeout(syncLabels, 50)
    })
    ro.observe(el)

    return () => { ro.disconnect(); chart.remove() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch candles whenever timeframe changes (also handles initial load)
  useEffect(() => {
    const tf = TF_OPTIONS.find(o => o.label === timeframe)!
    let cancelled = false
    function load() {
      const s = seriesApi.current
      const c = chartApi.current
      if (!s || !c) {
        // Chart not ready yet — retry once it renders
        setTimeout(load, 50)
        return
      }
      fetchCandles(meta.symbol, tf.interval, tf.outputsize).then(candles => {
        if (cancelled) return
        if (candles.length) {
          s.setData(candles)
          c.timeScale().fitContent()
        }
        setTimeout(syncLabels, 80)
      })
    }
    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe])

  // Sync price lines + label positions when prices change
  useEffect(() => {
    entryRef.current = entry
    entryLine.current?.applyOptions({ price: entry })
    setTimeout(syncLabels, 10)
  }, [entry])

  useEffect(() => {
    targetRef.current = target
    const pct  = (target - entryRef.current) / entryRef.current * 100
    const sign = pct >= 0 ? '+' : ''
    targetLine.current?.applyOptions({ price: target, title: ` TARGET ${sign}${pct.toFixed(2)}%` })
    setTimeout(syncLabels, 10)
  }, [target])

  useEffect(() => {
    stopRef.current = stop
    const pct  = (stop - entryRef.current) / entryRef.current * 100
    const sign = pct >= 0 ? '+' : ''
    stopLine.current?.applyOptions({ price: stop, title: ` STOP ${sign}${pct.toFixed(2)}%` })
    setTimeout(syncLabels, 10)
  }, [stop])

  // Drag handlers — supports both mouse and touch
  function startDrag(which: 'target' | 'stop') {
    return (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      draggingRef.current = which
      setIsDragging(true)

      function getClientY(ev: MouseEvent | TouchEvent): number {
        return ev instanceof MouseEvent ? ev.clientY : ev.touches[0].clientY
      }

      const onMove = (ev: MouseEvent | TouchEvent) => {
        const el = containerRef.current
        const s  = seriesApi.current
        if (!el || !s) return
        const y     = getClientY(ev) - el.getBoundingClientRect().top
        const price = s.coordinateToPrice(y)
        if (price == null) return
        if (which === 'target') onTargetChange?.(fmtPrice(price))
        else                    onStopChange?.(fmtPrice(price))
      }

      const onUp = () => {
        draggingRef.current = null
        setIsDragging(false)
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.removeEventListener('touchmove', onMove)
        document.removeEventListener('touchend', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.addEventListener('touchmove', onMove, { passive: false })
      document.addEventListener('touchend', onUp)
    }
  }

  const targetPct = (target - entry) / entry * 100
  const stopPct   = (stop   - entry) / entry * 100
  const tSign     = targetPct >= 0 ? '+' : ''
  const sSign     = stopPct   >= 0 ? '+' : ''

  const HANDLE_H = 28 // px — tall grab zone for each draggable line

  return (
    <div ref={wrapperRef} style={{ position: 'relative', userSelect: 'none', cursor: isDragging ? 'ns-resize' : 'auto' }}>
      {/* Timeframe selector */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 20, display: 'flex', gap: 3 }}>
        {TF_OPTIONS.map(({ label }) => (
          <button
            key={label}
            onClick={() => setTimeframe(label)}
            style={{
              padding: '3px 8px', borderRadius: 5, border: '1px solid',
              fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif',
              cursor: 'pointer', transition: 'all 0.12s',
              background: timeframe === label ? 'var(--blue)' : 'rgba(0,0,0,0.45)',
              color: timeframe === label ? '#fff' : 'rgba(255,255,255,0.6)',
              borderColor: timeframe === label ? 'var(--blue)' : 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart canvas (crosshair / pan only) */}
      <div ref={containerRef} style={{ overflow: 'hidden' }} />

      {/* ── Drag handle: TARGET ── */}
      {showLevels && !entryOnly && labelY.t !== null && (
        <div
          onMouseDown={startDrag('target')}
          onTouchStart={startDrag('target')}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: labelY.t - HANDLE_H / 2, height: HANDLE_H,
            cursor: 'ns-resize', zIndex: 15,
            display: 'flex', alignItems: 'center',
            touchAction: 'none',
          }}
        >
          {/* Visible label (left) */}
          <div style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
            <span style={{ background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.4 }}>TARGET</span>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#16a34a', background: 'rgba(0,0,0,0.45)', padding: '1px 5px', borderRadius: 3 }}>{tSign}{targetPct.toFixed(2)}%</span>
          </div>
        </div>
      )}

      {/* ── Entry label (not draggable) ── */}
      {(showLevels || entryOnly) && labelY.e !== null && (
        <div style={{ position: 'absolute', left: 8, top: labelY.e, transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 4, zIndex: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
          <span style={{ background: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.4 }}>ENTRY</span>
        </div>
      )}

      {/* ── Drag handle: STOP ── */}
      {showLevels && !entryOnly && labelY.s !== null && (
        <div
          onMouseDown={startDrag('stop')}
          onTouchStart={startDrag('stop')}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: labelY.s - HANDLE_H / 2, height: HANDLE_H,
            cursor: 'ns-resize', zIndex: 15,
            display: 'flex', alignItems: 'center',
            touchAction: 'none',
          }}
        >
          {/* Visible label (left) */}
          <div style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
            <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.4 }}>STOP</span>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#dc2626', background: 'rgba(0,0,0,0.45)', padding: '1px 5px', borderRadius: 3 }}>{sSign}{stopPct.toFixed(2)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TickerChart ──────────────────────────────────────────────────────────────

export function TickerChart({ onConfirm, entry, target, stop, direction: _direction, onTargetChange, onStopChange, showLevels = true, entryOnly = false }: TickerChartProps) {
  const [input, setInput]         = useState('')
  const [status, setStatus]       = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [meta, setMeta]           = useState<TickerMeta | null>(null)
  const [error, setError]         = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [focused, setFocused]     = useState(false)

  const debouncedTicker = useDebounce(input.trim().toUpperCase(), 300)

  useEffect(() => {
    if (!debouncedTicker) { setSuggestions([]); return }
    let cancelled = false
    fetchSearch(debouncedTicker)
      .then(r => { if (!cancelled) setSuggestions(r) })
      .catch(() => { if (!cancelled) setSuggestions([]) })
    return () => { cancelled = true }
  }, [debouncedTicker])

  useEffect(() => {
    if (!debouncedTicker) { setStatus('idle'); setMeta(null); return }
    let cancelled = false
    setStatus('loading'); setError('')
    fetchQuote(debouncedTicker)
      .then(q  => { if (!cancelled) { setMeta(q);  setStatus('success') } })
      .catch(e => { if (!cancelled) { setStatus('error'); setError((e as Error).message ?? 'Ticker not found') } })
    return () => { cancelled = true }
  }, [debouncedTicker])

  function selectSuggestion(s: SearchResult) {
    setInput(s.symbol)
    setSuggestions([])
    setFocused(false)
  }

  const isUp   = (meta?.changePercent ?? 0) >= 0
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  // ── Confirmed view ───────────────────────────────────────────────────────────
  if (confirmed && meta) {
    const entryNum  = parseFloat(entry  ?? '0') || meta.close
    const targetNum = parseFloat(target ?? '0') || entryNum * 1.05
    const stopNum   = parseFloat(stop   ?? '0') || entryNum * 0.97

    return (
      <div style={{ marginTop: 10, background: 'var(--surface)', border: '1.5px solid var(--green)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Quote bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border2)' }}>
          <span style={{ fontSize: 13, color: 'var(--green)', flexShrink: 0 }}>✓</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{meta.symbol}</span>
          <span style={{ fontSize: 12, color: 'var(--text4)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.name}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text)', flexShrink: 0 }}>${meta.close.toFixed(2)}</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: isUp ? 'var(--green)' : 'var(--red)', flexShrink: 0 }}>
            {isUp ? '+' : ''}{meta.changePercent.toFixed(2)}%
          </span>
          <button onClick={() => setConfirmed(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', cursor: 'pointer', flexShrink: 0 }}>
            Change
          </button>
        </div>

        {/* Lightweight-charts candlestick with exact price lines */}
        <ConfirmedChart
          meta={meta}
          entry={entryNum}
          target={targetNum}
          stop={stopNum}
          onTargetChange={onTargetChange}
          onStopChange={onStopChange}
          showLevels={showLevels}
          entryOnly={entryOnly}
        />
      </div>
    )
  }

  // ── Search + preview chart ───────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text4)', pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace' }}>$</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search ticker or company — e.g. NVDA or Nvidia"
          maxLength={20}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: `1.5px solid ${status === 'error' ? 'var(--red)' : status === 'success' ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: focused && suggestions.length > 0 ? '10px 10px 0 0' : 10,
            padding: '10px 36px 10px 30px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 500,
            color: 'var(--text)', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
          }}
        />
        {status === 'loading' && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text4)' }}>…</span>}
        {status === 'success' && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--green)' }}>✓</span>}

        {focused && suggestions.length > 0 && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 200, background: 'var(--surface)', border: '1.5px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
            {suggestions.map((s, i) => (
              <div
                key={`${s.symbol}-${s.exchange}`}
                onMouseDown={() => selectSuggestion(s)}
                style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderTop: i > 0 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 56 }}>{s.symbol}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.instrument_name}</span>
                <span style={{ fontSize: 10, color: 'var(--text4)', flexShrink: 0 }}>{s.exchange}</span>
                <span style={{ fontSize: 10, color: 'var(--text4)', flexShrink: 0 }}>{s.instrument_type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {status === 'error' && (
        <p style={{ marginTop: 6, fontSize: 12, color: 'var(--red)', margin: '6px 0 0' }}>{error} — check the ticker symbol</p>
      )}

      {status === 'success' && meta && (
        <div style={{ marginTop: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{meta.symbol}</span>
              <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text4)' }}>{meta.name}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>${meta.close.toFixed(2)}</span>
              <span style={{ marginLeft: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 500, color: isUp ? 'var(--green)' : 'var(--red)' }}>
                {isUp ? '+' : ''}{meta.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* TradingView preview (before confirmation — no levels needed here) */}
          <iframe
            src={`https://www.tradingview.com/widgetembed/?symbol=${toTVSymbol(meta.exchange, meta.symbol)}&interval=D&theme=${isDark ? 'dark' : 'light'}&style=1&locale=en&hide_top_toolbar=1&hide_side_toolbar=1&saveimage=0&calendar=0&hide_volume=1`}
            style={{ width: '100%', height: 220, border: 'none', display: 'block' }}
            allowTransparency={true}
            allowFullScreen={true}
            title={`${meta.symbol} chart`}
          />

          {onConfirm && (
            <div style={{ padding: '10px 14px' }}>
              <button
                onClick={() => { onConfirm(meta.symbol, meta); setConfirmed(true) }}
                style={{ width: '100%', padding: '9px 0', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Use {meta.symbol} for this post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
