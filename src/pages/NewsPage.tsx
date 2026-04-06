import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { NEWS_ARTICLES } from '../data/demo'
import type { NewsArticle } from '../data/demo'
import { useMobile } from '../hooks/useMobile'
import { useNewsArticles } from '../hooks/useNewsArticles'
import type { FinnhubNewsItem } from '../hooks/useNewsArticles'
import { useAlphaVantageNews } from '../hooks/useAlphaVantageNews'
import { useMarketData } from '../context/MarketDataContext'
import type { Quote } from '../context/MarketDataContext'
import { useCryptoQuotes } from '../hooks/useCryptoQuotes'
import type { ArticleNavState } from './NewsArticlePage'

type FilterTab = 'all' | 'earnings' | 'macro' | 'regulatory' | 'analyst' | 'bullish' | 'bearish' | 'ma' | 'crypto' | 'commodity' | 'watchlist'

const FILTER_TABS: { id: FilterTab; label: string; color?: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'earnings',   label: 'Earnings' },
  { id: 'macro',      label: 'Macro' },
  { id: 'crypto',     label: 'Crypto',       color: 'orange' },
  { id: 'commodity',  label: 'Commodities',  color: 'yellow' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'ma',         label: 'M&A' },
  { id: 'analyst',    label: 'Analyst' },
  { id: 'bullish',    label: 'Bullish moves', color: 'green' },
  { id: 'bearish',    label: 'Bearish moves', color: 'red' },
  { id: 'watchlist',  label: 'Watchlist only' },
]

// ─── Source helpers ────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  Reuters: '#e05c1a',
  CNBC: '#b45309',
  Bloomberg: '#374151',
  'The Wall Street Journal': '#1d4ed8',
  'Financial Times': '#9d174d',
  MarketWatch: '#1e40af',
  'Seeking Alpha': '#15803d',
  "Barron's": '#7c3aed',
  'Yahoo Finance': '#7c2d12',
  'Business Insider': '#dc2626',
  Forbes: '#1e3a5f',
  Benzinga: '#f59e0b',
  "Investor's Business Daily": '#0e7490',
  'Associated Press': '#374151',
}

const SOURCE_SHORT: Record<string, string> = {
  'The Wall Street Journal': 'WSJ',
  'Financial Times': 'FT',
  "Barron's": "BARRON'S",
  "Investor's Business Daily": 'IBD',
  'Business Insider': 'BI',
  'Associated Press': 'AP',
  'Seeking Alpha': 'SA',
  'Yahoo Finance': 'YAHOO',
}

function sourceColor(s: string): string { return SOURCE_COLORS[s] ?? '#64748b' }
function sourceShort(s: string): string {
  return (SOURCE_SHORT[s] ?? s).toUpperCase().slice(0, 10)
}

// ─── Category inference ────────────────────────────────────────────────────────

type CategoryType = NewsArticle['categoryType']

function inferCategoryType(item: FinnhubNewsItem): CategoryType {
  if (item.category === 'merger') return 'ma'
  if (item.category === 'commodity') return 'commodity'
  const text = (item.headline + ' ' + item.summary).toLowerCase()
  // Crypto — check early so "crypto earnings" → crypto
  if (/\bbitcoin\b|\bbtc\b|\bethereum\b|\beth\b|\bcrypto(?:currency|currencies)?\b|\bblockchain\b|\bdefi\b|\bnft\b|\bsolana\b|\bxrp\b|\bdogecoin\b|\bripple\b|\bweb3\b/.test(text)) return 'crypto'
  // Commodities
  if (/\bgold\b|\bsilver\b|\bcrude\b|\bwti\b|\boil\b|\bnatural gas\b|\bcopper\b|\bwheat\b|\bcorn\b|\bcommodit|\bopec\b|\bbarrel\b|\benergy price|\bfuel\b|\bgas price\b|\bxau\b|\bxag\b/.test(text)) return 'commodity'
  // Standard categories
  if (/\bearnings\b|eps\b|\brevenue\b|guidance\b|beat\b|miss\b|profit\b|q[1-4]\s+\d|results\b/.test(text)) return 'earnings'
  if (/\bfed\b|\bfomc\b|interest rate|cpi\b|inflation\b|\bgdp\b|\bmacro\b|\beconomy\b|monetary|nonfarm|jobs report|unemployment/.test(text)) return 'macro'
  if (/recall\b|probe\b|\bsec\b|regulat|fda\b|ftc\b|doj\b|lawsuit|fine\b|penalty|violation|settlement/.test(text)) return 'regulatory'
  if (/acqui|merger\b|buyout|takeover|\bdeal\b|\bbid\b/.test(text)) return 'ma'
  if (/upgrade|price target|analyst\b|rating\b|\bbuy\b|overweight|outperform|raised target/.test(text)) return 'analyst'
  if (/surge|soar|jump|rally|bullish|record high/.test(text)) return 'bullish'
  if (/plunge|tumble|\bdrop\b|decline|bearish|crash\b|slump/.test(text)) return 'bearish'
  return 'macro'
}

function formatTimestamp(unix: number): string {
  const d = new Date(unix * 1000)
  const diffM = Math.floor((Date.now() - unix * 1000) / 60_000)
  const h = d.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York',
  })
  const t = `${h} EST`
  if (diffM < 1) return `${t} · just now`
  if (diffM < 60) return `${t} · ${diffM}m ago`
  const diffH = Math.floor(diffM / 60)
  if (diffH < 24) return `${t} · ${diffH}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' })
}

// ─── Keyword → ticker extraction ──────────────────────────────────────────────
// Supplements the Finnhub `related` field which is often empty or just one ticker

const KEYWORD_TICKER_MAP: Array<[RegExp, string]> = [
  // ── Crypto (CoinGecko-backed) ───────────────────────────────────────────────
  [/\bbitcoin\b|\bbtc\b/i,                             'BTC'],
  [/\bethereum\b|\beth\b/i,                             'ETH'],
  [/\bcrypto(?:currency|currencies|market|purchases)?\b/i, 'BTC'],
  [/\bsolana\b|\bsol\b/i,                              'SOL'],
  [/\bxrp\b|\bripple\b/i,                              'XRP'],
  [/\bdogecoin\b|\bdoge\b/i,                            'DOGE'],
  [/\bcardano\b|\bada\b/i,                              'ADA'],
  [/\bavalanche\b|\bavax\b/i,                           'AVAX'],
  [/\bchainlink\b|\blink\b/i,                           'LINK'],
  [/\bbinance\b|\bbnb\b/i,                              'BNB'],
  // ── Commodities (Finnhub ETF proxies) ──────────────────────────────────────
  [/\bgold\b/i,                                         'GLD'],   // SPDR Gold ETF
  [/\bsilver\b/i,                                       'SLV'],   // iShares Silver ETF
  [/\bcrude oil\b|\bwti\b|\boil price\b|\bpetroleum\b/i,'USO'],  // Oil ETF
  [/\bnatural gas\b/i,                                  'UNG'],   // Natural Gas ETF
  [/\bcopper\b/i,                                       'COPX'],  // Copper ETF
  [/\bwheat\b|\bcorn\b|\bsoybeans?\b/i,                 'DBA'],   // Agricultural ETF
  // ── Macro / index ETFs (Finnhub-backed) ────────────────────────────────────
  [/\bs&p 500\b|\bspx\b|\bstock market\b|\bwall street\b|\bequit(?:y|ies)\b/i, 'SPY'],
  [/\bnasdaq\b/i,                                       'QQQ'],
  [/\bdow\b|\bdow jones\b|\bdjia\b/i,                   'SPY'],   // Dow proxy
  [/\btreasur(?:y|ies)\b|\b10.year yield\b/i,           'TLT'],
  [/\bdollar index\b|\bdxy\b/i,                         'UUP'],   // Dollar ETF
  [/\boil\b|\bcrude\b|\bmiddle east\b|\bgeopolit/i,     'USO'],   // Broad oil / geopolitical
  // ── Mega-cap stocks ─────────────────────────────────────────────────────────
  [/\bnvidia\b/i,                                       'NVDA'],
  [/\btesla\b/i,                                        'TSLA'],
  [/\bapple\b/i,                                        'AAPL'],
  [/\bmeta platforms?\b|\bfacebook\b/i,                 'META'],
  [/\bamazon\b/i,                                       'AMZN'],
  [/\bmicrosoft\b/i,                                    'MSFT'],
  [/\bgoogle\b|\balphabet\b/i,                          'GOOGL'],
  [/\b(?:advanced micro devices?|amd\b)/i,              'AMD'],
  [/\bmicrostrategy\b|\bstrategy.*(?:bitcoin|crypto)\b/i,'MSTR'],
  [/\bcoinbase\b/i,                                     'COIN'],
]

function extractTickers(headline: string, summary: string): string[] {
  const text = headline + ' ' + summary
  const found = new Set<string>()
  for (const [re, ticker] of KEYWORD_TICKER_MAP) {
    if (re.test(text)) found.add(ticker)
  }
  return Array.from(found)
}

// Images that appear on 2+ articles are source logos/placeholders — filter them out
function buildImageFilter(items: FinnhubNewsItem[]): Set<string> {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (item.image) counts.set(item.image, (counts.get(item.image) ?? 0) + 1)
  }
  const logos = new Set<string>()
  for (const [url, n] of counts) {
    if (n >= 2 || /logo|brand|icon|placeholder|default|fallback/i.test(url)) {
      logos.add(url)
    }
  }
  return logos
}

function mapToArticles(
  items: FinnhubNewsItem[],
  quotes: Record<string, Quote>,
): NewsArticle[] {
  const logoUrls = buildImageFilter(items)
  return items.map((item, i) => {
    const relatedSymbols = item.related
      ? item.related.split(',').map(s => s.trim()).filter(Boolean)
      : []
    const keywordSymbols = extractTickers(item.headline, item.summary)
    const symbols = [...new Set([...relatedSymbols, ...keywordSymbols])].slice(0, 8)
    const image = item.image && !logoUrls.has(item.image) ? item.image : undefined
    return {
      id: String(item.id),
      source: sourceShort(item.source),
      sourceColor: sourceColor(item.source),
      category: item.category,
      categoryType: inferCategoryType(item),
      headline: item.headline,
      body: i < 3 ? item.summary : '',
      publishedAt: formatTimestamp(item.datetime),
      tickers: symbols.map(sym => ({
        symbol: sym,
        change: quotes[sym]?.changePct ?? 0,
      })),
      image,
      featured: i === 0,
    }
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Fetch og:image from a URL via Microlink (no API key needed for basic usage)
const ogImageCache = new Map<string, string | null>()

async function fetchOgImage(articleUrl: string): Promise<string | null> {
  if (ogImageCache.has(articleUrl)) return ogImageCache.get(articleUrl) ?? null
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(articleUrl)}&filter=image`,
      { signal: AbortSignal.timeout(6000) }
    )
    const data = await res.json()
    const img: string | null = data?.data?.image?.url ?? null
    ogImageCache.set(articleUrl, img)
    return img
  } catch {
    ogImageCache.set(articleUrl, null)
    return null
  }
}

export default function NewsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const isMobile = useMobile()
  const navigate = useNavigate()
  const { items: finnhubItems, loading } = useNewsArticles()
  const avItems = useAlphaVantageNews()

  // Merge + deduplicate by ID, sort latest first
  const rawItems = useMemo(() => {
    const seen = new Set<number>()
    const merged: FinnhubNewsItem[] = []
    for (const item of [...finnhubItems, ...avItems]) {
      if (!seen.has(item.id)) { seen.add(item.id); merged.push(item) }
    }
    merged.sort((a, b) => b.datetime - a.datetime)
    return merged
  }, [finnhubItems, avItems])
  const { quotes: stockQuotes } = useMarketData()
  const cryptoQuotes = useCryptoQuotes()
  const quotes = useMemo(
    () => ({ ...stockQuotes, ...cryptoQuotes }),
    [stockQuotes, cryptoQuotes]
  )

  // Extra images fetched via og:image when Finnhub provides none
  const [extraImages, setExtraImages] = useState<Record<string, string>>({})
  const fetchingIds = useRef(new Set<string>())

  // Build a map of article ID → URL for og:image lookups
  const urlById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const item of rawItems) if (item.url) m[String(item.id)] = item.url
    return m
  }, [rawItems])

  function openArticle(article: NewsArticle) {
    const raw = rawItems.find(i => String(i.id) === article.id)
    const effectiveImage = article.image || extraImages[article.id]
    const state: ArticleNavState = {
      headline:    article.headline,
      summary:     article.body || (raw?.summary ?? ''),
      source:      article.source,
      sourceColor: article.sourceColor,
      publishedAt: article.publishedAt,
      url:         raw?.url,
      image:       effectiveImage,
      tickers:     article.tickers.map(t => t.symbol),
      category:    article.category,
    }
    navigate('/news/article', { state })
  }

  const articles = useMemo(
    () => rawItems.length > 0 ? mapToArticles(rawItems, quotes) : NEWS_ARTICLES,
    [rawItems, quotes],
  )

  const filtered = activeFilter === 'all' || activeFilter === 'watchlist'
    ? articles
    : articles.filter(a => a.categoryType === activeFilter)

  const hero = filtered[0] ?? null
  const compact2col = filtered.slice(1, 3)
  const moreStories = filtered.slice(3)
  const storyCount = rawItems.length > 0 ? rawItems.length : 218

  // Lazily fetch og:image for featured cards that Finnhub didn't give an image for
  useEffect(() => {
    const candidates = [hero, ...compact2col].filter(
      (a): a is NewsArticle => !!a && !a.image && !!urlById[a.id] && !fetchingIds.current.has(a.id)
    )
    for (const article of candidates) {
      const url = urlById[article.id]
      fetchingIds.current.add(article.id)
      fetchOgImage(url).then(img => {
        if (img) setExtraImages(prev => ({ ...prev, [article.id]: img }))
      })
    }
  }, [hero?.id, compact2col[0]?.id, compact2col[1]?.id, urlById])

  // Merge extraImages into articles for rendering
  function img(article: NewsArticle): string | undefined {
    return article.image || extraImages[article.id]
  }

  return (
    <div style={{ padding: isMobile ? '16px 16px 100px' : 0 }}>
      <div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>News</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 20, padding: '3px 10px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>
              Live · {loading ? '…' : `${storyCount} stories today`}
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <select style={{ fontSize: 11, fontWeight: 600, color: '#888888', background: '#161616', border: '1px solid #1e1e1e', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', outline: 'none' }}>
              <option>My wall</option>
              <option>All sources</option>
            </select>
            <select style={{ fontSize: 11, fontWeight: 600, color: '#888888', background: '#161616', border: '1px solid #1e1e1e', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', outline: 'none' }}>
              <option>Sort: Latest</option>
              <option>Sort: Relevance</option>
            </select>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="scrollbar-hide" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          {FILTER_TABS.map(({ id, label }) => {
            const active = activeFilter === id
            return (
              <button
                key={id}
                onClick={() => setActiveFilter(id)}
                style={{
                  padding: '5px 13px', borderRadius: 4, border: '1px solid',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'Inter, sans-serif',
                  background: active ? '#161616' : 'transparent',
                  color:      active ? '#e8e8e8' : '#555555',
                  borderColor: active ? '#2a2a2a' : '#1e1e1e',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text4)', fontSize: 14 }}>No stories match this filter.</div>
        ) : (
          <>
            {/* Hero card */}
            {hero && (
              <div
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 14, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue-border)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                onClick={() => openArticle(hero)}
              >
                {/* Hero thumbnail */}
                {img(hero) && (
                  <img
                    src={img(hero)}
                    alt=""
                    loading="lazy"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    style={{ width: '100%', height: isMobile ? 300 : 480, objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                  />
                )}
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ background: hero.sourceColor, color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: '2px 7px', borderRadius: 4 }}>{hero.source}</span>
                    <span style={{ fontSize: 11, color: 'var(--text4)' }}>{hero.category}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>{hero.publishedAt}</span>
                  </div>
                  <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3, margin: '0 0 12px', letterSpacing: '-0.3px' }}>
                    {hero.headline}
                  </h2>
                  {hero.body && (
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 16px',
                      display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {hero.body}
                    </p>
                  )}
                  {hero.tickers.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {hero.tickers.map(t => (
                        <TickerChip key={t.symbol} symbol={t.symbol} changePct={t.change} quotes={quotes} />
                      ))}
                    </div>
                  )}
                  <button style={{ background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 4, padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#555555', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    Read full story →
                  </button>
                </div>
              </div>
            )}

            {/* 2-column compact cards */}
            {compact2col.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {compact2col.map(article => (
                  <ArticleCard key={article.id} article={article} quotes={quotes} onOpen={openArticle} extraImage={extraImages[article.id]} />
                ))}
              </div>
            )}

            {/* More stories */}
            {moreStories.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border2)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>More stories today</span>
                  <button style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    See all {storyCount}
                  </button>
                </div>
                {moreStories.map((article, i) => (
                  <CompactRow key={article.id} article={article} isLast={i === moreStories.length - 1} quotes={quotes} onOpen={openArticle} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── TickerChip ────────────────────────────────────────────────────────────────

function TickerChip({ symbol, changePct, quotes }: { symbol: string; changePct: number; quotes: Record<string, Quote> }) {
  const quote = quotes[symbol]
  const pct = quote ? quote.changePct : changePct
  const up = pct >= 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
      padding: '4px 10px', borderRadius: 6,
      background: up ? 'var(--green-bg)' : 'var(--red-bg)',
      color: up ? 'var(--green)' : 'var(--red)',
      border: `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
    }}>
      {symbol}
      {quote ? (
        <span style={{ fontWeight: 500 }}>{up ? '+' : ''}{pct.toFixed(2)}%</span>
      ) : pct !== 0 ? (
        <span style={{ fontWeight: 500 }}>{up ? '+' : ''}{pct.toFixed(2)}%</span>
      ) : null}
    </span>
  )
}

// ─── ArticleCard ───────────────────────────────────────────────────────────────

function ArticleCard({ article, quotes, onOpen, extraImage }: { article: NewsArticle; quotes: Record<string, Quote>; onOpen: (a: NewsArticle) => void; extraImage?: string }) {
  const thumb = article.image || extraImage
  return (
    <div
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue-border)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      onClick={() => onOpen(article)}
    >
      {thumb && (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          style={{ width: '100%', height: 200, objectFit: 'cover', objectPosition: 'top', display: 'block' }}
        />
      )}
      <div style={{ padding: '14px 14px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ background: article.sourceColor, color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.8, padding: '2px 6px', borderRadius: 4 }}>{article.source}</span>
        <span style={{ fontSize: 10, color: 'var(--text4)' }}>{article.category}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>{article.publishedAt}</span>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, margin: '0 0 8px' }}>{article.headline}</h3>
      {article.body && (
        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 12px',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.body}
        </p>
      )}
      {article.tickers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {article.tickers.map(t => (
            <TickerChip key={t.symbol} symbol={t.symbol} changePct={t.change} quotes={quotes} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

// ─── CompactRow ────────────────────────────────────────────────────────────────

function CompactRow({ article, isLast, quotes, onOpen }: { article: NewsArticle; isLast: boolean; quotes: Record<string, Quote>; onOpen: (a: NewsArticle) => void }) {
  const mainTicker = article.tickers[0]
  const quote = mainTicker ? quotes[mainTicker.symbol] : null
  const price = quote?.price ?? 0
  const pct = quote?.changePct ?? mainTicker?.change ?? 0
  const up = pct >= 0

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid var(--border2)', cursor: 'pointer', transition: 'background 0.12s' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      onClick={() => onOpen(article)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ background: article.sourceColor, color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.8, padding: '1px 6px', borderRadius: 3 }}>{article.source}</span>
          <span style={{ fontSize: 10, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>{article.publishedAt}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {article.headline}
        </div>
        {article.tickers.length > 0 && (
          <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
            {article.tickers.slice(0, 4).map(t => {
              const q = quotes[t.symbol]
              const p = q?.changePct ?? t.change
              const up = p >= 0
              return (
                <span key={t.symbol} style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 5,
                  background: up ? 'var(--green-bg)' : 'var(--red-bg)',
                  color: up ? 'var(--green)' : 'var(--red)',
                  border: `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
                }}>
                  {t.symbol} {p !== 0 && <span style={{ fontWeight: 500 }}>{up ? '+' : ''}{p.toFixed(2)}%</span>}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Right side: thumbnail if available, otherwise price info */}
      {article.image ? (
        <img
          src={article.image}
          alt=""
          loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
        />
      ) : mainTicker && (
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 72 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: 'var(--text4)', marginBottom: 2 }}>{mainTicker.symbol}</div>
          {price > 0 && (
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, color: up ? 'var(--green)' : 'var(--red)' }}>
            {up ? '+' : ''}{pct.toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  )
}
