import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NEWS_ARTICLES } from '../data/demo'
import type { NewsArticle } from '../data/demo'
import { useMobile } from '../hooks/useMobile'

type FilterTab = 'all' | 'earnings' | 'macro' | 'regulatory' | 'analyst' | 'bullish' | 'bearish' | 'ma' | 'watchlist'

const FILTER_TABS: { id: FilterTab; label: string; color?: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'earnings',   label: 'Earnings' },
  { id: 'macro',      label: 'Macro' },
  { id: 'regulatory', label: 'Regulatory' },
  { id: 'ma',         label: 'M&A' },
  { id: 'analyst',    label: 'Analyst' },
  { id: 'bullish',    label: 'Bullish moves', color: 'green' },
  { id: 'bearish',    label: 'Bearish moves', color: 'red' },
  { id: 'watchlist',  label: 'Watchlist only' },
]

export default function NewsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const isMobile = useMobile()
  const _navigate = useNavigate()

  const filtered = activeFilter === 'all' || activeFilter === 'watchlist'
    ? NEWS_ARTICLES
    : NEWS_ARTICLES.filter(a => a.categoryType === activeFilter)

  const hero = filtered.find(a => a.featured) ?? filtered[0]
  const compact2col = filtered.filter(a => !a.featured && a.body).slice(0, 2)
  const moreStories = filtered.filter(a => !a.featured && !a.body)

  return (
    <div>
      <div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>News</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 20, padding: '3px 10px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>Live · 218 stories today</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <select style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', outline: 'none' }}>
              <option>My wall</option>
              <option>All sources</option>
            </select>
            <select style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', outline: 'none' }}>
              <option>Sort: Latest</option>
              <option>Sort: Relevance</option>
            </select>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="scrollbar-hide" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          {FILTER_TABS.map(({ id, label, color }) => {
            const active = activeFilter === id
            const isGreen = color === 'green'
            const isRed   = color === 'red'
            return (
              <button
                key={id}
                onClick={() => setActiveFilter(id)}
                style={{
                  padding: '5px 13px', borderRadius: 20, border: '1px solid',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'Inter, sans-serif',
                  background: active
                    ? isGreen ? 'var(--green)' : isRed ? 'var(--red)' : 'var(--blue)'
                    : isGreen && !active ? 'var(--green-bg)'
                    : isRed   && !active ? 'var(--red-bg)'
                    : 'transparent',
                  color: active ? '#fff'
                    : isGreen ? 'var(--green)'
                    : isRed   ? 'var(--red)'
                    : 'var(--text-2)',
                  borderColor: active
                    ? isGreen ? 'var(--green)' : isRed ? 'var(--red)' : 'var(--blue)'
                    : isGreen ? 'var(--green-border)'
                    : isRed   ? 'var(--red-border)'
                    : 'var(--border)',
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
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, overflow: 'hidden', marginBottom: 14,
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue-border)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ padding: '18px 20px' }}>
                  {/* Source + meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ background: hero.sourceColor, color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 1, padding: '2px 7px', borderRadius: 4 }}>{hero.source}</span>
                    <span style={{ fontSize: 11, color: 'var(--text4)' }}>{hero.category}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>{hero.publishedAt}</span>
                  </div>
                  {/* Headline */}
                  <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3, margin: '0 0 12px', letterSpacing: '-0.3px' }}>
                    {hero.headline}
                  </h2>
                  {/* Body */}
                  {hero.body && (
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, margin: '0 0 16px' }}>{hero.body}</p>
                  )}
                  {/* Ticker chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {hero.tickers.map(t => (
                      <span key={t.symbol} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
                        padding: '4px 10px', borderRadius: 6,
                        background: t.change >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
                        color: t.change >= 0 ? 'var(--green)' : 'var(--red)',
                        border: `1px solid ${t.change >= 0 ? 'var(--green-border)' : 'var(--red-border)'}`,
                      }}>
                        {t.symbol} <span style={{ fontWeight: 500 }}>{t.change >= 0 ? '+' : ''}{t.change.toFixed(2)}%</span>
                      </span>
                    ))}
                  </div>
                  {/* Read more */}
                  <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    Read full story →
                  </button>
                </div>
              </div>
            )}

            {/* 2-column compact cards */}
            {compact2col.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {compact2col.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}

            {/* More stories */}
            {moreStories.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border2)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>More stories today</span>
                  <button style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>See all 218</button>
                </div>
                {moreStories.map((article, i) => (
                  <CompactRow key={article.id} article={article} isLast={i === moreStories.length - 1} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── ArticleCard (2-col compact) ──────────────────────────────────────────────

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '16px', cursor: 'pointer', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue-border)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ background: article.sourceColor, color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.8, padding: '2px 6px', borderRadius: 4 }}>{article.source}</span>
        <span style={{ fontSize: 10, color: 'var(--text4)' }}>{article.category}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>{article.publishedAt}</span>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, margin: '0 0 8px' }}>{article.headline}</h3>
      {article.body && <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 12px' }}>{article.body}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {article.tickers.map(t => (
          <span key={t.symbol} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
            padding: '2px 7px', borderRadius: 4,
            background: 'var(--surface2)', color: 'var(--text-2)', border: '1px solid var(--border)',
          }}>
            {t.symbol}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── CompactRow (more stories list) ──────────────────────────────────────────

function CompactRow({ article, isLast }: { article: NewsArticle; isLast: boolean }) {
  const mainTicker = article.tickers[0]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border2)',
      cursor: 'pointer', transition: 'background 0.12s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ background: article.sourceColor, color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: 0.8, padding: '1px 6px', borderRadius: 3 }}>{article.source}</span>
          <span style={{ fontSize: 10, color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace' }}>{article.publishedAt}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {article.headline}
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
          {article.tickers.map(t => (
            <span key={t.symbol} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--surface2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{t.symbol}</span>
          ))}
        </div>
      </div>
      {mainTicker && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{mainTicker.symbol}</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            ${article.tickers[0].symbol === 'SPY' ? '512.50' : article.tickers[0].symbol === 'AAPL' ? '211.45' : article.tickers[0].symbol === 'AMD' ? '162.50' : article.tickers[0].symbol === 'MSFT' ? '415.20' : '—'}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: mainTicker.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {mainTicker.change >= 0 ? '+' : ''}{mainTicker.change.toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  )
}
