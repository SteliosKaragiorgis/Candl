import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMobile } from '../hooks/useMobile'
import { useMarketData } from '../context/MarketDataContext'
import { useCryptoQuotes } from '../hooks/useCryptoQuotes'
import { fetchSearch, useDebounce } from '../components/feed/TickerChart'
import type { SearchResult } from '../components/feed/TickerChart'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ArticleNavState {
  headline: string
  summary: string
  source: string
  sourceColor: string
  publishedAt: string
  url?: string
  image?: string
  tickers: string[]
  category?: string
}

interface ArticleTicker {
  symbol: string
  exchange?: string
  name?: string
}

// ─── TradingView symbol resolution ─────────────────────────────────────────────

const TV_MAP: Record<string, string> = {
  // Commodities
  GOLD: 'TVC:GOLD', XAU: 'TVC:GOLD', XAUUSD: 'OANDA:XAUUSD',
  SILVER: 'TVC:SILVER', XAG: 'TVC:SILVER',
  OIL: 'TVC:USOIL', WTI: 'TVC:USOIL', CRUDE: 'TVC:USOIL',
  BRENT: 'TVC:UKOIL',
  NATGAS: 'TVC:NGAS', NG: 'TVC:NGAS',
  COPPER: 'TVC:COPPER', HG: 'TVC:COPPER',
  // Crypto
  BTC: 'BINANCE:BTCUSDT', BTCUSD: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT', ETHUSD: 'BINANCE:ETHUSDT',
  SOL: 'BINANCE:SOLUSDT',
  // Macro / Indices
  SPX: 'SP:SPX', SP500: 'SP:SPX',
  NDX: 'NASDAQ:NDX',
  DJI: 'DJ:DJI', DOW: 'DJ:DJI',
  VIX: 'CBOE:VIX',
  DXY: 'TVC:DXY',
  // Bonds / Rates
  TLT: 'NASDAQ:TLT', TNX: 'TVC:TNX', US10Y: 'TVC:US10Y',
  // Forex
  EURUSD: 'FX:EURUSD', EUR: 'FX:EURUSD',
  GBPUSD: 'FX:GBPUSD', GBP: 'FX:GBPUSD',
  USDJPY: 'FX:USDJPY', JPY: 'FX:USDJPY',
  USDCAD: 'FX:USDCAD', AUDUSD: 'FX:AUDUSD',
}

function toTVSymbol(symbol: string, exchange?: string): string {
  const sym = symbol.toUpperCase()
  if (TV_MAP[sym]) return TV_MAP[sym]
  if (exchange) {
    const ex = exchange.toLowerCase()
    if (ex === 'forex')                          return `FX:${sym.replace('/', '')}`
    if (ex === 'crypto' || ex === 'digital currency') return `BINANCE:${sym}USDT`
    return `${exchange}:${sym}`
  }
  return sym  // TradingView auto-resolves US equities by bare symbol
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NewsArticlePage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const isMobile  = useMobile()
  const { quotes: stockQuotes } = useMarketData()
  const cryptoQuotes = useCryptoQuotes()
  const quotes = useMemo(
    () => ({ ...stockQuotes, ...cryptoQuotes }),
    [stockQuotes, cryptoQuotes]
  )

  const article = location.state as ArticleNavState | null

  // ── Fetch full article content ────────────────────────────────────────────────
  const [enriched, setEnriched] = useState<{
    fullText?: string; description?: string; image?: string; failed?: boolean
  } | null>(null)
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    if (!article?.url) return
    let cancelled = false
    setContentLoading(true)

    async function extractFromHtml(html: string): Promise<{ paras: string[]; image?: string }> {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      doc.querySelectorAll(
        'script,style,nav,header,footer,aside,figure,figcaption,[class*="ad-"],[id*="ad-"],[class*="cookie"],[class*="promo"],[class*="related"],[class*="newsletter"],[class*="signup"],[class*="paywall"],[class*="subscription"]'
      ).forEach(el => el.remove())
      const ogImg = doc.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content
      const containers = [
        'article',
        '[class*="article-body"]', '[class*="ArticleBody"]',
        '[class*="story-body"]',  '[class*="StoryBody"]',
        '[class*="article-content"]', '[class*="post-content"]',
        '[class*="body-text"]',   '[itemprop="articleBody"]',
        'main',
      ]
      let container: Element | null = null
      for (const sel of containers) {
        container = doc.querySelector(sel)
        if (container) break
      }
      if (!container) container = doc.body
      const paras = Array.from(container.querySelectorAll('p'))
        .map(p => p.textContent?.trim() ?? '')
        .filter(t => t.length > 60)
      return { paras, image: ogImg ?? undefined }
    }

    async function fetchContent() {
      let fullText: string | undefined
      let description: string | undefined
      let image: string | undefined
      let failed = false

      // Stage 1a: allorigins.win (returns JSON with .contents)
      try {
        const res = await fetch(
          `https://allorigins.win/get?disableCache=true&url=${encodeURIComponent(article!.url!)}`,
          { signal: AbortSignal.timeout(10000) }
        )
        const data = await res.json()
        const html: string = data.contents ?? ''
        if (html) {
          const { paras, image: img } = await extractFromHtml(html)
          if (img && !image) image = img
          if (paras.length >= 3) fullText = paras.slice(0, 20).join('\n\n')
        }
      } catch { /* timed out or network error */ }

      // Stage 1b: corsproxy.io (returns raw HTML) — try if allorigins didn't get content
      if (!fullText) {
        try {
          const res = await fetch(
            `https://corsproxy.io/?url=${encodeURIComponent(article!.url!)}`,
            { signal: AbortSignal.timeout(10000) }
          )
          const html = await res.text()
          if (html) {
            const { paras, image: img } = await extractFromHtml(html)
            if (img && !image) image = img
            if (paras.length >= 3) fullText = paras.slice(0, 20).join('\n\n')
          }
        } catch { /* ignore */ }
      }

      // Stage 2: Microlink — og:image + meta description fallback
      if (!image || !fullText) {
        try {
          const ml = await fetch(
            `https://api.microlink.io/?url=${encodeURIComponent(article!.url!)}&filter=description,image`,
            { signal: AbortSignal.timeout(7000) }
          ).then(r => r.json())
          if (!image) image = ml?.data?.image?.url ?? undefined
          if (!fullText) description = ml?.data?.description ?? undefined
        } catch { /* ignore */ }
      }

      // Mark as failed if we still have no real content
      if (!fullText) failed = true

      if (!cancelled) setEnriched({ fullText, description, image, failed })
      if (!cancelled) setContentLoading(false)
    }

    fetchContent()
    return () => { cancelled = true }
  }, [article?.url])

  const [tickers, setTickers] = useState<ArticleTicker[]>(
    () => (article?.tickers ?? []).filter(Boolean).map(s => ({ symbol: s }))
  )
  const [active, setActive] = useState<ArticleTicker | null>(
    () => (article?.tickers ?? []).filter(Boolean)[0]
      ? { symbol: (article?.tickers ?? [])[0] }
      : null
  )

  // ── Add-ticker search ────────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery) { setSuggestions([]); return }
    let cancelled = false
    setSearchLoading(true)
    fetchSearch(debouncedQuery)
      .then(r => { if (!cancelled) setSuggestions(r) })
      .catch(() => { if (!cancelled) setSuggestions([]) })
      .finally(() => { if (!cancelled) setSearchLoading(false) })
    return () => { cancelled = true }
  }, [debouncedQuery])

  function addTicker(r: SearchResult) {
    const t: ArticleTicker = { symbol: r.symbol, exchange: r.exchange, name: r.instrument_name }
    if (!tickers.find(x => x.symbol === r.symbol)) {
      setTickers(prev => [...prev, t])
    }
    setActive(t)
    setShowSearch(false)
    setQuery('')
    setSuggestions([])
  }

  function removeTicker(symbol: string) {
    const next = tickers.filter(t => t.symbol !== symbol)
    setTickers(next)
    if (active?.symbol === symbol) setActive(next[0] ?? null)
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  // Resolve the best available image
  const heroImage = article?.image || enriched?.image

  // Fuzzy similarity: normalise then check if one string is substantially contained in the other
  function isSimilarToHeadline(text: string): boolean {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
    const nh = norm(article?.headline ?? '')
    const nt = norm(text)
    if (!nh || !nt) return false
    // If either fully contains the other, or they share the same first 40 chars
    return nh.includes(nt) || nt.includes(nh) || (nh.slice(0, 40) === nt.slice(0, 40))
  }

  const isFullText = !!(enriched?.fullText)
  const bodyText = (() => {
    if (enriched?.fullText) return enriched.fullText
    const fromMicrolink = enriched?.description
    const fromFinnhub   = article?.summary && !isSimilarToHeadline(article.summary)
      ? article.summary
      : undefined
    if (fromMicrolink && fromMicrolink.length > 80 && !isSimilarToHeadline(fromMicrolink)) {
      return fromMicrolink
    }
    return fromFinnhub ?? null
  })()

  if (!article) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text4)', fontSize: 14 }}>
        Article not found.{' '}
        <button
          onClick={() => navigate('/news')}
          style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
        >
          ← Back to News
        </button>
      </div>
    )
  }

  const activeQuote = active ? quotes[active.symbol] : null

  return (
    <div style={{ padding: isMobile ? '12px 16px 80px' : '0 0 48px' }}>

      {/* ── Back ─────────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: 'var(--text-2)',
          padding: '0 0 16px', fontFamily: 'Inter, sans-serif',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        News
      </button>

      {/* ── Article card ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', marginBottom: 16,
      }}>
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{ width: '100%', height: isMobile ? 260 : 420, objectFit: 'cover', objectPosition: 'top', display: 'block' }}
          />
        )}
        <div style={{ padding: isMobile ? '18px 16px' : '24px 28px' }}>

          {/* Source + meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{
              background: article.sourceColor, color: '#fff',
              fontSize: 9, fontWeight: 800, letterSpacing: 1,
              padding: '3px 8px', borderRadius: 4,
            }}>
              {article.source}
            </span>
            {article.category && (
              <span style={{ fontSize: 11, color: 'var(--text4)', textTransform: 'capitalize' }}>{article.category}</span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' }}>
              {article.publishedAt}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: isMobile ? 20 : 26, fontWeight: 800,
            color: 'var(--text)', lineHeight: 1.3,
            margin: '0 0 16px', letterSpacing: '-0.4px',
          }}>
            {article.headline}
          </h1>

          {/* Body */}
          {contentLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 20px' }}>
              <span style={{ fontSize: 13, color: 'var(--text4)', fontStyle: 'italic' }}>Fetching article content…</span>
            </div>
          ) : bodyText ? (
            <div style={{ margin: '0 0 20px' }}>
              {isFullText
                ? bodyText.split('\n\n').map((para, i) => (
                    <p key={i} style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8, margin: i === 0 ? 0 : '14px 0 0' }}>
                      {para}
                    </p>
                  ))
                : (
                    <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8, margin: 0 }}>
                      {bodyText}
                    </p>
                  )
              }
            </div>
          ) : enriched?.failed ? (
            <div style={{
              margin: '0 0 20px', padding: '12px 16px', borderRadius: 10,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              fontSize: 13, color: 'var(--text4)',
            }}>
              Full content couldn't be loaded — {article.source} may require a subscription or blocks automated access.
            </div>
          ) : null}

          {/* Ticker chips with live prices */}
          {tickers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
              {tickers.map(t => {
                const q = quotes[t.symbol]
                const pct = q?.changePct ?? 0
                const up  = pct >= 0
                return (
                  <button
                    key={t.symbol}
                    onClick={() => setActive(t)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
                      padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: up ? 'var(--green-bg)' : 'var(--red-bg)',
                      color:      up ? 'var(--green)'    : 'var(--red)',
                      border: `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
                      outline: active?.symbol === t.symbol ? `2px solid ${up ? 'var(--green)' : 'var(--red)'}` : 'none',
                      outlineOffset: 1,
                    }}
                  >
                    {t.symbol}
                    {pct !== 0 && (
                      <span style={{ fontWeight: 500 }}>
                        {up ? '+' : ''}{pct.toFixed(2)}%
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Source link */}
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 14px',
                fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
                textDecoration: 'none', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--blue-border)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
            >
              {isFullText ? `Source: ${article.source}` : `Read full story on ${article.source}`}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
            </a>
          )}
        </div>
      </div>

      {/* ── Affected Markets ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', marginBottom: 16,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: tickers.length > 0 ? '1px solid var(--border2)' : 'none',
          gap: 8,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Affected Markets</span>
          <button
            onClick={() => setShowSearch(s => !s)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: showSearch ? 'var(--blue)' : 'var(--surface2)',
              border: `1px solid ${showSearch ? 'var(--blue)' : 'var(--border)'}`,
              borderRadius: 8, padding: '5px 12px',
              fontSize: 12, fontWeight: 600,
              color: showSearch ? '#fff' : 'var(--text-2)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            Add ticker
          </button>
        </div>

        {/* Search box */}
        {showSearch && (
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border2)', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: 'var(--text4)', pointerEvents: 'none',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                $
              </span>
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value.toUpperCase())}
                placeholder="NVDA · GOLD · BTC · OIL · EURUSD"
                maxLength={20}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--surface2)', border: '1.5px solid var(--border)',
                  borderRadius: suggestions.length > 0 ? '8px 8px 0 0' : 8,
                  padding: '9px 36px 9px 28px',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 14,
                  color: 'var(--text)', outline: 'none',
                }}
              />
              {searchLoading && (
                <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text4)' }}>…</span>
              )}
            </div>

            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', left: 18, right: 18, zIndex: 100,
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                borderTop: 'none', borderRadius: '0 0 8px 8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden',
              }}>
                {suggestions.map((s, i) => (
                  <div
                    key={`${s.symbol}-${s.exchange}`}
                    onMouseDown={() => addTicker(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', cursor: 'pointer',
                      borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--surface2)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 56 }}>{s.symbol}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.instrument_name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text4)', flexShrink: 0 }}>{s.exchange}</span>
                    <span style={{ fontSize: 10, color: 'var(--text4)', flexShrink: 0 }}>{s.instrument_type}</span>
                  </div>
                ))}
              </div>
            )}

            {query.length > 0 && suggestions.length === 0 && !searchLoading && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text4)' }}>No results for "{query}"</p>
            )}
          </div>
        )}

        {/* Ticker chips */}
        {tickers.length > 0 ? (
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            padding: '14px 18px',
          }}>
            {tickers.map(t => {
              const q = quotes[t.symbol]
              const pct = q?.changePct ?? 0
              const price = q?.price ?? 0
              const up = pct >= 0
              const isActive = active?.symbol === t.symbol
              return (
                <button
                  key={t.symbol}
                  onClick={() => setActive(t)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 0,
                    border: '1.5px solid',
                    borderRadius: 8, padding: '6px 0 6px 10px',
                    cursor: 'pointer', transition: 'all 0.15s',
                    fontFamily: 'JetBrains Mono, monospace',
                    background: isActive
                      ? (up ? 'var(--green-bg)' : 'var(--red-bg)')
                      : 'var(--surface2)',
                    borderColor: isActive
                      ? (up ? 'var(--green)' : 'var(--red)')
                      : 'var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? (up ? 'var(--green)' : 'var(--red)') : 'var(--text)', lineHeight: 1.2 }}>
                      {t.symbol}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                      {price > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                          ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                      {pct !== 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: up ? 'var(--green)' : 'var(--red)' }}>
                          {up ? '+' : ''}{pct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    {t.name && (
                      <div style={{ fontSize: 9, color: 'var(--text4)', marginTop: 1, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.name}
                      </div>
                    )}
                  </div>
                  {/* Remove button */}
                  <button
                    onClick={e => { e.stopPropagation(); removeTicker(t.symbol) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text4)', padding: '0 8px 0 6px',
                      fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center',
                    }}
                  >
                    ×
                  </button>
                </button>
              )
            })}
          </div>
        ) : (
          <div style={{ padding: '20px 18px', fontSize: 13, color: 'var(--text4)' }}>
            No tickers linked to this article. Use "Add ticker" to attach a market chart.
          </div>
        )}
      </div>

      {/* ── TradingView chart ─────────────────────────────────────────────── */}
      {active && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
        }}>
          {/* Chart header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px', borderBottom: '1px solid var(--border2)',
            flexWrap: 'wrap', gap: 8,
          }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
              {active.symbol}
            </span>
            {active.name && (
              <span style={{ fontSize: 12, color: 'var(--text4)', flex: 1 }}>{active.name}</span>
            )}
            {activeQuote && activeQuote.price > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  ${activeQuote.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
                  padding: '3px 9px', borderRadius: 20,
                  background: activeQuote.changePct >= 0 ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
                  color: activeQuote.changePct >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {activeQuote.changePct >= 0 ? '+' : ''}{activeQuote.changePct.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* TradingView iframe */}
          <iframe
            key={active.symbol + isDark}
            src={`https://www.tradingview.com/widgetembed/?symbol=${toTVSymbol(active.symbol, active.exchange)}&interval=D&theme=${isDark ? 'dark' : 'light'}&style=1&locale=en&hide_top_toolbar=0&hide_side_toolbar=0&saveimage=0&calendar=0&studies=[]`}
            style={{
              width: '100%',
              height: isMobile ? 320 : 460,
              border: 'none',
              display: 'block',
            }}
            allowTransparency={true}
            allowFullScreen={true}
            title={`${active.symbol} chart`}
          />

          {/* OHLC row (if tracked) */}
          {activeQuote && activeQuote.price > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              borderTop: '1px solid var(--border)',
              padding: '12px 18px', gap: 8,
            }}>
              {[
                { label: 'OPEN',  value: activeQuote.open  > 0 ? `$${activeQuote.open.toFixed(2)}`  : '—', color: 'var(--text)' },
                { label: 'HIGH',  value: activeQuote.high  > 0 ? `$${activeQuote.high.toFixed(2)}`  : '—', color: 'var(--green)' },
                { label: 'LOW',   value: activeQuote.low   > 0 ? `$${activeQuote.low.toFixed(2)}`   : '—', color: 'var(--red)' },
                { label: 'CHG',   value: activeQuote.change !== 0 ? `${activeQuote.change >= 0 ? '+' : ''}$${Math.abs(activeQuote.change).toFixed(2)}` : '—', color: activeQuote.change >= 0 ? 'var(--green)' : 'var(--red)' },
              ].map(col => (
                <div key={col.label}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: 'var(--text4)', textTransform: 'uppercase', marginBottom: 3 }}>{col.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: col.color }}>{col.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
