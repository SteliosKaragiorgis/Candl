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


type FilterTab =
  | 'all' | 'earnings' | 'macro' | 'regulatory' | 'analyst'
  | 'bullish' | 'bearish' | 'ma' | 'crypto' | 'commodity' | 'watchlist'

const FILTER_TABS: { id: FilterTab; label: string; sentiment?: 'bullish' | 'bearish' }[] = [
  { id: 'all',        label: 'All' },
  { id: 'earnings',   label: 'Earnings' },
  { id: 'macro',      label: 'Macro' },
  { id: 'crypto',     label: 'Crypto' },
  { id: 'commodity',  label: 'Commodities' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'ma',         label: 'M&A' },
  { id: 'analyst',    label: 'Analyst' },
  { id: 'bullish',    label: 'Bullish moves', sentiment: 'bullish' },
  { id: 'bearish',    label: 'Bearish moves', sentiment: 'bearish' },
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
  if (/\bbitcoin\b|\bbtc\b|\bethereum\b|\beth\b|\bcrypto(?:currency|currencies)?\b|\bblockchain\b|\bdefi\b|\bnft\b|\bsolana\b|\bxrp\b|\bdogecoin\b|\bripple\b|\bweb3\b/.test(text)) return 'crypto'
  if (/\bgold\b|\bsilver\b|\bcrude\b|\bwti\b|\boil\b|\bnatural gas\b|\bcopper\b|\bwheat\b|\bcorn\b|\bcommodit|\bopec\b|\bbarrel\b|\benergy price|\bfuel\b|\bgas price\b|\bxau\b|\bxag\b/.test(text)) return 'commodity'
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

const KEYWORD_TICKER_MAP: Array<[RegExp, string]> = [
  [/\bbitcoin\b|\bbtc\b/i,                                'BTC'],
  [/\bethereum\b|\beth\b/i,                                'ETH'],
  [/\bcrypto(?:currency|currencies|market|purchases)?\b/i, 'BTC'],
  [/\bsolana\b|\bsol\b/i,                                 'SOL'],
  [/\bxrp\b|\bripple\b/i,                                 'XRP'],
  [/\bdogecoin\b|\bdoge\b/i,                               'DOGE'],
  [/\bcardano\b|\bada\b/i,                                 'ADA'],
  [/\bavalanche\b|\bavax\b/i,                              'AVAX'],
  [/\bchainlink\b|\blink\b/i,                              'LINK'],
  [/\bbinance\b|\bbnb\b/i,                                 'BNB'],
  [/\bgold\b/i,                                            'GLD'],
  [/\bsilver\b/i,                                          'SLV'],
  [/\bcrude oil\b|\bwti\b|\boil price\b|\bpetroleum\b/i,  'USO'],
  [/\bnatural gas\b/i,                                     'UNG'],
  [/\bcopper\b/i,                                          'COPX'],
  [/\bwheat\b|\bcorn\b|\bsoybeans?\b/i,                    'DBA'],
  [/\bs&p 500\b|\bspx\b|\bstock market\b|\bwall street\b|\bequit(?:y|ies)\b/i, 'SPY'],
  [/\bnasdaq\b/i,                                          'QQQ'],
  [/\bdow\b|\bdow jones\b|\bdjia\b/i,                      'SPY'],
  [/\btreasur(?:y|ies)\b|\b10.year yield\b/i,              'TLT'],
  [/\bdollar index\b|\bdxy\b/i,                            'UUP'],
  [/\boil\b|\bcrude\b|\bmiddle east\b|\bgeopolit/i,        'USO'],
  [/\bnvidia\b/i,                                          'NVDA'],
  [/\btesla\b/i,                                           'TSLA'],
  [/\bapple\b/i,                                           'AAPL'],
  [/\bmeta platforms?\b|\bfacebook\b/i,                    'META'],
  [/\bamazon\b/i,                                          'AMZN'],
  [/\bmicrosoft\b/i,                                       'MSFT'],
  [/\bgoogle\b|\balphabet\b/i,                             'GOOGL'],
  [/\b(?:advanced micro devices?|amd\b)/i,                 'AMD'],
  [/\bmicrostrategy\b|\bstrategy.*(?:bitcoin|crypto)\b/i,  'MSTR'],
  [/\bcoinbase\b/i,                                        'COIN'],
]

function extractTickers(headline: string, summary: string): string[] {
  const text = headline + ' ' + summary
  const found = new Set<string>()
  for (const [re, ticker] of KEYWORD_TICKER_MAP) {
    if (re.test(text)) found.add(ticker)
  }
  return Array.from(found)
}

function buildImageFilter(items: FinnhubNewsItem[]): Set<string> {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (item.image) counts.set(item.image, (counts.get(item.image) ?? 0) + 1)
  }
  const logos = new Set<string>()
  for (const [url, n] of counts) {
    if (n >= 2 || /logo|brand|icon|placeholder|default|fallback/i.test(url)) logos.add(url)
  }
  return logos
}

function mapToArticles(items: FinnhubNewsItem[], quotes: Record<string, Quote>): NewsArticle[] {
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

// ─── OG image fetch ────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function articleSentiment(article: NewsArticle): 'bullish' | 'bearish' | 'neutral' {
  if (article.categoryType === 'bullish') return 'bullish'
  if (article.categoryType === 'bearish') return 'bearish'
  return 'neutral'
}

const SENTIMENT_BORDER_COLOR: Record<string, string> = {
  bullish: 'var(--green)',
  bearish: 'var(--red)',
  neutral: 'var(--border)',
}

const THUMB_GRADIENT: Record<string, string> = {
  bullish: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
  bearish: 'linear-gradient(135deg, #1f0d0d 0%, #3a1a1a 100%)',
  neutral: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-card) 100%)',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TickerChip({ symbol, changePct, quotes }: {
  symbol: string
  changePct: number
  quotes: Record<string, Quote>
}) {
  const quote = quotes[symbol]
  const pct = quote ? quote.changePct : changePct
  const up = pct >= 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
      padding: '2px 7px', borderRadius: 4,
      background: up ? 'var(--green-bg)' : 'var(--red-bg)',
      color: up ? 'var(--green)' : 'var(--red)',
      border: `0.5px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
    }}>
      {symbol}
      {(quote || pct !== 0) && (
        <span style={{ fontWeight: 500 }}>{up ? '+' : ''}{pct.toFixed(2)}%</span>
      )}
    </span>
  )
}

// ─── FeaturedCard ─────────────────────────────────────────────────────────────

function FeaturedCard({ article, imageUrl, quotes, onOpen }: {
  article: NewsArticle
  imageUrl?: string
  quotes: Record<string, Quote>
  onOpen: (a: NewsArticle) => void
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 10, overflow: 'hidden',
        marginBottom: 14, cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hard)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      onClick={() => onOpen(article)}
    >
      {/* Hero area */}
      <div style={{
        position: 'relative', height: 320,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c2a 100%)',
        overflow: 'hidden',
      }}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'top',
            }}
          />
        )}
        {/* Dark overlay — always shown */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
        }} />
        {/* Text content over overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 14px', zIndex: 1,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: '#ffffff', color: '#111111',
            padding: '2px 6px', borderRadius: 3,
            display: 'inline-block', marginBottom: 5,
          }}>{article.source}</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
            {article.headline}
          </div>
        </div>
      </div>

      {/* Article body */}
      <div style={{ padding: '12px 14px' }}>
        {article.body && (
          <p style={{
            fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65,
            marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {article.body}
          </p>
        )}

        {article.tickers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Impact</span>
            {article.tickers.slice(0, 5).map(t => (
              <TickerChip key={t.symbol} symbol={t.symbol} changePct={t.change} quotes={quotes} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          borderTop: '0.5px solid var(--border-soft)',
          paddingTop: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            style={{
              fontSize: 12, fontWeight: 500,
              color: 'var(--green)', cursor: 'pointer',
              background: 'none', border: 'none',
              fontFamily: 'Inter, sans-serif', padding: 0,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Read full story →
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {article.publishedAt}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── GridCard ─────────────────────────────────────────────────────────────────

function GridCard({ article, quotes, onOpen }: {
  article: NewsArticle
  quotes: Record<string, Quote>
  onOpen: (a: NewsArticle) => void
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 8, padding: 12,
        cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hard)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      onClick={() => onOpen(article)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 700,
          background: 'var(--bg-surface)', color: 'var(--text-2)',
          padding: '1px 6px', borderRadius: 3,
        }}>{article.source}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {article.publishedAt}
        </span>
      </div>
      <div style={{
        fontSize: 12, fontWeight: 500, color: 'var(--text)',
        lineHeight: 1.4,
        marginBottom: article.tickers.length > 0 ? 8 : 0,
      }}>
        {article.headline}
      </div>
      {article.tickers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {article.tickers.slice(0, 3).map(t => (
            <TickerChip key={t.symbol} symbol={t.symbol} changePct={t.change} quotes={quotes} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ArticleRow ───────────────────────────────────────────────────────────────

function ArticleRow({ article, quotes, onOpen }: {
  article: NewsArticle
  quotes: Record<string, Quote>
  onOpen: (a: NewsArticle) => void
}) {
  const sentiment = articleSentiment(article)
  const leftColor = SENTIMENT_BORDER_COLOR[sentiment]

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderTop: '0.5px solid var(--border)',
        borderRight: '0.5px solid var(--border)',
        borderBottom: '0.5px solid var(--border)',
        borderLeft: `2px solid ${leftColor}`,
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 8,
        cursor: 'pointer',
        display: 'flex', gap: 12,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderTopColor = 'var(--border-hard)'
        e.currentTarget.style.borderRightColor = 'var(--border-hard)'
        e.currentTarget.style.borderBottomColor = 'var(--border-hard)'
        e.currentTarget.style.background = 'var(--bg-surface)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderTopColor = 'var(--border)'
        e.currentTarget.style.borderRightColor = 'var(--border)'
        e.currentTarget.style.borderBottomColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--bg-card)'
      }}
      onClick={() => onOpen(article)}
    >
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: 'var(--bg-surface)', color: 'var(--text-2)',
            padding: '1px 6px', borderRadius: 3,
          }}>{article.source}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{article.category}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
            {article.publishedAt}
          </span>
        </div>
        <div style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text)',
          lineHeight: 1.4, marginBottom: 5,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {article.headline}
        </div>
        {article.body && (
          <div style={{
            fontSize: 12, color: 'var(--text-3)',
            lineHeight: 1.5, marginBottom: 6,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {article.body}
          </div>
        )}
        {article.tickers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {article.tickers.slice(0, 4).map(t => (
              <TickerChip key={t.symbol} symbol={t.symbol} changePct={t.change} quotes={quotes} />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail */}
      {article.image ? (
        <img
          src={article.image}
          alt=""
          loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 64, height: 64, borderRadius: 6, flexShrink: 0,
          background: THUMB_GRADIENT[sentiment],
        }} />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const isMobile = useMobile()
  const navigate = useNavigate()
  const { items: finnhubItems, loading } = useNewsArticles()
  const avItems = useAlphaVantageNews()

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

  const [extraImages, setExtraImages] = useState<Record<string, string>>({})
  const fetchingIds = useRef(new Set<string>())

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

  const hero       = filtered[0] ?? null
  const compact2col = filtered.slice(1, 3)
  const moreStories = filtered.slice(3)
  const storyCount  = rawItems.length > 0 ? rawItems.length : 218

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

  function img(article: NewsArticle): string | undefined {
    return article.image || extraImages[article.id]
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100%' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '0.5px solid var(--border)',
        padding: '14px 20px 0',
      }}>
        {/* Top row: title + controls */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>News</span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--green-bg)',
              border: '0.5px solid var(--green-border)',
              borderRadius: 20, padding: '3px 9px',
            }}>
              <span className="live-pulse" style={{
                width: 5, height: 5, borderRadius: '50%',
                background: 'var(--green)', display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: 'var(--green)' }}>
                Live · {loading ? '…' : `${storyCount} stories today`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <select style={{
              background: 'var(--bg-surface)', border: '0.5px solid var(--border)',
              borderRadius: 6, padding: '5px 10px', fontSize: 12,
              color: 'var(--text-2)', cursor: 'pointer', outline: 'none',
            }}>
              <option>My wall</option>
              <option>All sources</option>
            </select>
            <select style={{
              background: 'var(--bg-surface)', border: '0.5px solid var(--border)',
              borderRadius: 6, padding: '5px 10px', fontSize: 12,
              color: 'var(--text-2)', cursor: 'pointer', outline: 'none',
            }}>
              <option>Sort: Latest</option>
              <option>Sort: Relevance</option>
            </select>
          </div>
        </div>

        {/* Filter chips */}
        <div className="scrollbar-hide" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 12 }}>
          {FILTER_TABS.map(({ id, label, sentiment }) => {
            const active = activeFilter === id
            let chipStyle: React.CSSProperties

            if (sentiment === 'bullish') {
              chipStyle = {
                padding: '5px 12px', borderRadius: 5, fontSize: 12,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif', fontWeight: active ? 500 : 400,
                background: active ? 'var(--green-bg)' : 'transparent',
                border: '0.5px solid var(--green-border)',
                color: 'var(--green)',
              }
            } else if (sentiment === 'bearish') {
              chipStyle = {
                padding: '5px 12px', borderRadius: 5, fontSize: 12,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif', fontWeight: active ? 500 : 400,
                background: active ? 'var(--red-bg)' : 'transparent',
                border: '0.5px solid var(--red-border)',
                color: 'var(--red)',
              }
            } else {
              chipStyle = {
                padding: '5px 12px', borderRadius: 5, fontSize: 12,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif', fontWeight: active ? 500 : 400,
                background: active ? 'var(--bg-surface)' : 'transparent',
                border: `0.5px solid ${active ? 'var(--border-hard)' : 'var(--border)'}`,
                color: active ? 'var(--text)' : 'var(--text-3)',
              }
            }

            return (
              <button
                key={id}
                onClick={() => setActiveFilter(id)}
                className={sentiment ? undefined : 'news-chip-default'}
                style={chipStyle}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div style={{ padding: isMobile ? '16px 16px 100px' : '16px 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-4)', fontSize: 14 }}>
            No stories match this filter.
          </div>
        ) : (
          <>
            {/* Featured article */}
            {hero && (
              <FeaturedCard
                article={hero}
                imageUrl={img(hero)}
                quotes={quotes}
                onOpen={openArticle}
              />
            )}

            {/* 2-column grid */}
            {compact2col.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 8, marginBottom: 8,
              }}>
                {compact2col.map(article => (
                  <GridCard
                    key={article.id}
                    article={article}
                    quotes={quotes}
                    onOpen={openArticle}
                  />
                ))}
              </div>
            )}

            {/* Article rows */}
            {moreStories.map(article => (
              <ArticleRow
                key={article.id}
                article={article}
                quotes={quotes}
                onOpen={openArticle}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
