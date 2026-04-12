import { useParams, Navigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { DEMO_USERS, DEMO_POSTS, currentUser } from '../data/demo'
import { usePublishedPosts } from '../hooks/usePublishedPosts'
import type { PublishedPost } from '../hooks/usePublishedPosts'
import ProfileHeader, { type ProfileData } from '../components/profile/ProfileHeader'
import TradeDnaBanner from '../components/profile/TradeDnaBanner'
import TradeDnaCard from '../components/profile/TradeDnaCard'
import { useTradeDna } from '../hooks/useTradeDna'
import { calculateTradeDna } from '../utils/calculateTradeDna'
import type { Post, TradePost, User } from '../types'
import type { ClosedTrade } from '../types/tradeDna'
import { useChallenges } from '../hooks/useChallenge'
import type { Badge, BadgeColour } from '../types/badges'
import type { PropFirm } from '../types/propfirm'

// ── Demo trade generator ──────────────────────────────────────────────────────

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'NAS100', 'AAPL', 'BTCUSD', 'GBPJPY']
const SETUPS  = ['Breakout', 'Trend continuation', 'Reversal', 'Scalp', 'Range']

function seededRand(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function generateDemoTrades(userId: string, count = 48): ClosedTrade[] {
  const seed   = userId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand   = seededRand(seed)
  const baseWR = 0.42 + rand() * 0.28
  const base   = new Date('2025-01-01T00:00:00Z').getTime()
  return Array.from({ length: count }, (_, i) => {
    const win      = rand() < baseWR
    const rMult    = win ? 0.8 + rand() * 3.2 : -(0.5 + rand() * 1.2)
    const hoursAgo = (count - i) * (18 + rand() * 32)
    const d = new Date(base + hoursAgo * 3_600_000)
    d.setUTCHours(Math.floor(rand() * 24), 0, 0, 0)
    return {
      id:          `demo_${userId}_${i}`,
      symbol:      SYMBOLS[Math.floor(rand() * SYMBOLS.length)],
      direction:   rand() > 0.5 ? 'long' : 'short',
      outcome:     win ? 'win' : 'loss',
      rMultiple:   Math.round(rMult * 100) / 100,
      openTime:    d.toISOString(),
      riskPercent: 0.5 + rand() * 1.5,
      setupTag:    SETUPS[Math.floor(rand() * SETUPS.length)],
    } satisfies ClosedTrade
  })
}

function computeProfileStats(trades: ClosedTrade[]) {
  if (trades.length === 0) return { winRate: 0, avgRR: 0, ytdReturn: 0 }
  const wins      = trades.filter(t => t.outcome === 'win').length
  const winRate   = Math.round((wins / trades.length) * 100)
  const stats     = calculateTradeDna(trades)
  const avgRR     = stats?.avgRR ?? 0
  const totalR    = trades.reduce((s, t) => s + t.rMultiple, 0)
  const avgRisk   = stats?.avgRiskPercent ?? 1
  const ytdReturn = Math.round(totalR * avgRisk * 10) / 10
  return { winRate, avgRR, ytdReturn }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function findUser(id: string): User | undefined {
  return Object.values(DEMO_USERS).find(u => u.id === id)
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function BodyText({ text }: { text: string }) {
  const parts = text.split(/(\$[A-Z]{1,6})/g)
  return (
    <span>
      {parts.map((p, i) =>
        /^\$[A-Z]{1,6}$/.test(p)
          ? <span key={i} style={{ color: 'var(--blue)', fontWeight: 500 }}>{p}</span>
          : <span key={i}>{p}</span>
      )}
    </span>
  )
}

function getPnL(post: TradePost): { label: string; positive: boolean } {
  if (post.isOpen) return { label: 'Active', positive: true }
  const pct = post.direction === 'BUY'
    ? (post.target - post.entry) / post.entry * 100
    : (post.entry - post.target) / post.entry * 100
  return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, positive: pct >= 0 }
}

// ── Feed tab types ────────────────────────────────────────────────────────────

type FeedTab = 'all' | 'trades' | 'investments' | 'casestudies' | 'recaps'

const FEED_TABS: { id: FeedTab; label: string }[] = [
  { id: 'all',         label: 'All posts'    },
  { id: 'trades',      label: 'Trades'       },
  { id: 'investments', label: 'Investments'  },
  { id: 'casestudies', label: 'Case studies' },
  { id: 'recaps',      label: 'Recaps'       },
]

function filterByTab(posts: Post[], tab: FeedTab): Post[] {
  switch (tab) {
    case 'trades':      return posts.filter(p => p.postType === 'trade')
    case 'investments': return posts.filter(p => p.postType === 'investment')
    case 'casestudies': return posts.filter(p => p.postType === 'commentary')
    case 'recaps':      return posts.filter(p => p.postType === 'social')
    default:            return posts
  }
}

// ── Post card sub-components ──────────────────────────────────────────────────

function PostAvatar({ postType }: { postType: Post['postType'] }) {
  const isInvest = postType === 'investment'
  const isComm   = postType === 'commentary' || postType === 'social'
  const bg     = isInvest ? 'var(--amber-bg)' : isComm ? 'var(--bg-surface)' : 'var(--green-bg)'
  const color  = isInvest ? 'var(--amber)'    : isComm ? 'var(--text-3)'     : 'var(--green)'
  const border = isInvest ? 'var(--amber-border)' : isComm ? 'var(--border)' : 'var(--green-border)'
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: bg, border: `0.5px solid ${border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 600, color,
    }} />
  )
}

function TypeBadge({ postType }: { postType: Post['postType'] }) {
  const cfg = postType === 'trade'
    ? { label: 'Trade',       bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green-border)' }
    : postType === 'investment'
    ? { label: 'Investment',  bg: 'var(--amber-bg)', color: 'var(--amber)', border: 'var(--amber-border)' }
    : { label: postType === 'commentary' ? 'Commentary' : 'Social',
        bg: 'var(--bg-surface)', color: 'var(--text-3)', border: 'var(--border)' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 600,
      padding: '1px 6px', borderRadius: 3,
      background: cfg.bg, color: cfg.color,
      border: `0.5px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

function leftBorder(postType: Post['postType']): string {
  if (postType === 'trade')      return '2px solid var(--green)'
  if (postType === 'investment') return '2px solid var(--amber)'
  return '2px solid var(--border)'
}

function ActionRow({ likes, comments, shares }: { likes: number; comments: number; shares: number }) {
  const btn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 11, color: 'var(--text-4)', fontFamily: 'Inter, sans-serif',
    padding: 0, display: 'flex', alignItems: 'center', gap: 4,
  }
  return (
    <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
      <button style={btn}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {likes.toLocaleString()}
      </button>
      <button style={btn}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {comments}
      </button>
      <button style={btn}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        {shares}
      </button>
    </div>
  )
}

function TradeBlock({ post }: { post: TradePost }) {
  const { label: pnlLabel, positive } = getPnL(post)
  const isLong = post.direction === 'BUY'
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '0.5px solid var(--border)',
      borderRadius: 7, overflow: 'hidden', marginBottom: 8,
    }}>
      <div style={{
        padding: '7px 11px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1 }}>
          {post.ticker}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
          background: isLong ? 'var(--green-bg)' : 'var(--red-bg)',
          color: isLong ? 'var(--green)' : 'var(--red)',
          border: `0.5px solid ${isLong ? 'var(--green-border)' : 'var(--red-border)'}`,
        }}>
          {isLong ? 'LONG' : 'SHORT'}
        </span>
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: positive ? 'var(--green)' : 'var(--red)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {pnlLabel}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { v: fmt(post.entry),  l: 'Entry' },
          { v: fmt(post.target), l: 'Exit' },
          { v: post.rrRatio,     l: 'R multiple' },
          { v: post.timeframe,   l: 'Timeframe' },
        ].map(({ v, l }, i) => (
          <div key={l} style={{
            padding: '6px 10px',
            borderRight: i < 3 ? '0.5px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Published MT5 card (for own profile) ─────────────────────────────────────

function PublishedMT5ProfileCard({ post, user }: { post: PublishedPost; user: User }) {
  const [hovered, setHovered] = useState(false)
  const isLong = post.trade.direction.toUpperCase() === 'LONG'
  const pnl    = post.trade.net_profit
  const pnlStr = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `0.5px solid ${hovered ? 'var(--border-hard)' : 'var(--border)'}`,
        borderLeft: '2px solid var(--green)',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 8,
        display: 'flex', gap: 10, cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <PostAvatar postType="trade" />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>@{user.username}</span>
          <span style={{ color: 'var(--border-hard)', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 600,
            background: 'var(--green-bg)', color: 'var(--green)',
            border: '0.5px solid var(--green-border)',
            padding: '1px 6px', borderRadius: 3,
          }}>MT5</span>
          <span style={{ marginLeft: 'auto' }}>
            <TypeBadge postType="trade" />
          </span>
        </div>

        {/* Narrative */}
        {post.narrative && (
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 8px' }}>
            {post.narrative}
          </p>
        )}

        {/* Trade block */}
        <div style={{
          background: 'var(--bg-surface)', border: '0.5px solid var(--border)',
          borderRadius: 7, overflow: 'hidden', marginBottom: 8,
        }}>
          <div style={{
            padding: '7px 11px', borderBottom: '0.5px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1 }}>
              {post.trade.symbol}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 3,
              background: isLong ? 'var(--green-bg)' : 'var(--red-bg)',
              color: isLong ? 'var(--green)' : 'var(--red)',
              border: `0.5px solid ${isLong ? 'var(--green-border)' : 'var(--red-border)'}`,
            }}>
              {isLong ? 'LONG' : 'SHORT'}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: pnl >= 0 ? 'var(--green)' : 'var(--red)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {pnlStr}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { v: post.trade.entry_price.toFixed(4), l: 'Entry' },
              { v: post.trade.exit_price.toFixed(4),  l: 'Exit' },
              { v: `${post.trade.r_multiple}R`,        l: 'R multiple' },
              { v: post.trade.duration_formatted,      l: 'Duration' },
            ].map(({ v, l }, i) => (
              <div key={l} style={{
                padding: '6px 10px',
                borderRight: i < 3 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <ActionRow likes={0} comments={0} shares={0} />
      </div>
    </div>
  )
}

// ── Post feed card ────────────────────────────────────────────────────────────

function PostFeedCard({ post, user, pinned = false }: {
  post: Post; user: User; pinned?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const cardStyle: React.CSSProperties = pinned
    ? { padding: '12px 14px', display: 'flex', gap: 10, cursor: 'pointer' }
    : {
        background: 'var(--bg-card)',
        border: `0.5px solid ${hovered ? 'var(--border-hard)' : 'var(--border)'}`,
        borderLeft: leftBorder(post.postType),
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 8,
        display: 'flex', gap: 10, cursor: 'pointer',
        transition: 'border-color 0.15s',
      }

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <PostAvatar postType={post.postType} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>@{user.username}</span>
          <span style={{ color: 'var(--border-hard)', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{post.createdAt}</span>
          <span style={{ marginLeft: 'auto' }}>
            <TypeBadge postType={post.postType} />
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 8px' }}>
          <BodyText text={post.body} />
        </p>

        {post.postType === 'trade' && <TradeBlock post={post} />}

        <ActionRow likes={post.likes} comments={post.comments} shares={post.shares} />
      </div>
    </div>
  )
}

// ── DNA auto-post ─────────────────────────────────────────────────────────────

function DnaAutoPost({
  dna, userName, onViewDna,
}: {
  dna: NonNullable<ReturnType<typeof useTradeDna>['dna']>
  userName: string
  onViewDna: () => void
}) {
  const topSession = dna.sessions[0]
  const topSetup   = dna.setups[0]
  const weaknesses = dna.patterns.filter(p => p.type === 'weakness')

  let body = `${userName}'s Trade DNA updated — ${dna.tradeCount} verified trades.`
  if (topSession) body += ` Best session: ${topSession.session} (${topSession.winRate}% WR).`
  if (topSetup)   body += ` Best setup: ${topSetup.setup} (${topSetup.winRate}% WR).`
  if (weaknesses.length > 0)
    body += ` ${weaknesses.length} recurring pattern flagged — see full DNA above.`

  return (
    <div style={{
      background: 'var(--green-bg)',
      border: '0.5px solid var(--green-border)',
      borderLeft: '2px solid var(--green)',
      borderRadius: 8, padding: '12px 14px',
      marginBottom: 8, display: 'flex', gap: 10,
    }}>
      {/* AI avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'var(--green-bg)', border: '0.5px solid var(--green-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 600, color: 'var(--green)',
      }}>
        AI
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Candl. AI</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>@candl</span>
          <span style={{ color: 'var(--border-hard)', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Weekly</span>
          <span style={{
            fontSize: 9, fontWeight: 600,
            background: 'var(--green-bg)', color: 'var(--green)',
            border: '0.5px solid var(--green-border)',
            padding: '1px 6px', borderRadius: 3,
          }}>
            Trade DNA
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 8px' }}>
          {body}
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onViewDna}
            style={{
              background: 'var(--green-bg)', color: 'var(--green)',
              border: '0.5px solid var(--green-border)',
              borderRadius: 4, padding: '4px 10px',
              fontSize: 11, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            View full DNA ↗
          </button>
          <button style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'var(--text-4)', fontFamily: 'Inter, sans-serif',
          }}>
            ♥ {Math.floor(dna.tradeCount * 1.2)} likes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pinned post wrapper ───────────────────────────────────────────────────────

function PinnedWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        background: 'var(--amber-bg)',
        borderBottom: '0.5px solid var(--amber-border)',
        borderRadius: '8px 8px 0 0',
        padding: '6px 14px',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="var(--amber)" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="17" x2="12" y2="22" />
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />
        </svg>
        <span style={{ fontSize: 11, color: 'var(--amber)' }}>Pinned post</span>
      </div>
      <div style={{
        background: 'var(--amber-bg)',
        border: '0.5px solid var(--amber-border)', borderTop: 'none',
        borderRadius: '0 0 8px 8px', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── Tabs bar ──────────────────────────────────────────────────────────────────

function TabsBar({ active, onChange }: { active: FeedTab; onChange: (t: FeedTab) => void }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', padding: '0 20px',
        position: 'sticky', top: 0, zIndex: 10,
        overflowX: 'auto',
      }}
      className="scrollbar-hide"
    >
      {FEED_TABS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            fontSize: 13, padding: '10px 14px',
            color: active === id ? 'var(--text)' : 'var(--text-3)',
            fontWeight: active === id ? 600 : 400,
            background: 'none', border: 'none',
            borderBottom: `2px solid ${active === id ? 'var(--green)' : 'transparent'}`,
            marginBottom: '-0.5px', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
            transition: 'color 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Follow request banner ─────────────────────────────────────────────────────

function FollowRequestBanner({ user, onAccept, onDecline }: {
  user: User; onAccept: () => void; onDecline: () => void
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderBottom: '0.5px solid var(--blue-border)',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-3)', fontSize: 10, fontWeight: 500,
      }}>
        {user.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{user.name}</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}> has requested to follow you</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onAccept} style={{
          padding: '5px 14px', borderRadius: 4,
          border: '0.5px solid var(--green-border)',
          background: 'var(--green-bg)', fontSize: 11, fontWeight: 500,
          color: 'var(--green)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}>Accept</button>
        <button onClick={onDecline} style={{
          padding: '5px 14px', borderRadius: 4,
          border: '0.5px solid var(--border)',
          background: 'transparent', fontSize: 11, fontWeight: 500,
          color: 'var(--text-4)', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}>Decline</button>
      </div>
    </div>
  )
}

// ── Private profile ───────────────────────────────────────────────────────────

function PrivateProfile({ following, onFollowChange }: {
  following: boolean; onFollowChange: (v: boolean) => void
}) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 14px', color: 'var(--text-4)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
        This account is private
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto 18px' }}>
        Send a follow request to see their trades, investments and commentary.
      </div>
      <button
        onClick={() => onFollowChange(!following)}
        style={{
          padding: '7px 22px', borderRadius: 4,
          border: `0.5px solid ${following ? 'var(--blue-border)' : 'var(--border)'}`,
          background: following ? 'var(--blue-bg)' : 'transparent',
          fontSize: 12, fontWeight: 500,
          color: following ? 'var(--blue)' : 'var(--text-2)',
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}
      >
        {following ? 'Request sent' : 'Request to follow'}
      </button>
    </div>
  )
}

// ── Empty feed state ──────────────────────────────────────────────────────────

function EmptyFeed({ tab }: { tab: FeedTab }) {
  const labels: Record<FeedTab, string> = {
    all: 'No posts yet', trades: 'No trades posted yet',
    investments: 'No investments posted yet',
    casestudies: 'No case studies yet', recaps: 'No recaps yet',
  }
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: 'var(--text-4)' }}>{labels[tab]}</div>
    </div>
  )
}

// ── DNA full expand modal ─────────────────────────────────────────────────────

function DnaModal({ dna, loading, onClose }: {
  dna: ReturnType<typeof useTradeDna>['dna']
  loading: boolean
  onClose: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderTop: '2px solid var(--green)',
          borderRadius: 12,
          padding: 20,
          width: 480, maxWidth: 'calc(100% - 40px)',
          position: 'relative',
          maxHeight: 'calc(100vh - 80px)',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
        className="scrollbar-hide"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border)',
            fontSize: 14, color: 'var(--text-3)',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>
            Full Trading DNA
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            AI-powered analysis of your complete trade history
          </div>
        </div>

        {/* Render TradeDnaCard content inline (without its own card shell) */}
        <TradeDnaCard dna={dna} loading={loading} />
      </div>
    </div>
  )
}

// ── Prop firm badge colour map ───────────────────────────────────────────────

const PROP_FIRM_BADGE_COLOUR: Partial<Record<PropFirm, BadgeColour>> = {
  FTMO:       'blue',
  TFT:        'purple',
  Apex:       'amber',
  E8:         'green',
  FundedNext: 'blue',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>()

  const [tab, setTab]                           = useState<FeedTab>('all')
  const [following, setFollowing]               = useState(false)
  const [dnaExpanded, setDnaExpanded]           = useState(false)
  const [requestAccepted, setRequestAccepted]   = useState(false)
  const [requestDismissed, setRequestDismissed] = useState(false)

  // useChallenges must be called unconditionally (rules of hooks)
  const challenges = useChallenges()

  const user = findUser(userId ?? '')
  if (!user) return <Navigate to="/" replace />

  const isOwnProfile = user.id === currentUser.id

  // Published MT5 posts for this user
  const { posts: mt5Posts } = usePublishedPosts(user.id)

  // Trades & DNA
  const trades = useMemo(() => generateDemoTrades(user.id), [user.id])
  const { dna, loading: dnaLoading } = useTradeDna(user.id, trades)

  // Profile stats
  const pStats = useMemo(() => computeProfileStats(trades), [trades])

  // Prop firm badges — only for own profile, only for passed challenges
  const propFirmBadges: Badge[] = isOwnProfile
    ? challenges
        .filter(c => c.status === 'passed')
        .map(c => ({
          id:       `prop-${c.id}`,
          label:    `${c.firm} Phase ${c.phase} Funded`,
          category: 'PROP_FIRM' as const,
          source:   'PROP_FIRM' as const,
          colour:   (PROP_FIRM_BADGE_COLOUR[c.firm] ?? 'blue') as BadgeColour,
          verified: true,
        }))
    : []

  // Posts
  const userPosts  = DEMO_POSTS.filter(p => p.user.id === user.id)
  const pinnedPost = tab === 'all' ? (userPosts[0] ?? null) : null
  const allFiltered = filterByTab(userPosts, tab)
  const feedPosts  = pinnedPost
    ? allFiltered.filter(p => p.id !== pinnedPost.id)
    : allFiltered

  // Profile data object
  const profile: ProfileData = {
    displayName:    user.name,
    handle:         user.username,
    avatarInitials: user.initials,
    bio:            user.bio,
    tags:           user.mostActive.split(' · '),
    isVerified:     user.verified,
    isMT5Connected: user.verified,
    isActiveToday:  ['u0', 'u1', 'u2'].includes(user.id),
    followers:      user.followersCount,
    following:      user.followingCount,
    postCount:      userPosts.length,
    ytdReturn:      pStats.ytdReturn,
    winRate:        pStats.winRate,
    avgRR:          pStats.avgRR,
    _user:          user,
  }

  const showRequestBanner = !!user.hasSentFollowRequest && !requestDismissed

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Follow request banner */}
      {showRequestBanner && (
        <FollowRequestBanner
          user={user}
          onAccept={() => { setRequestAccepted(true); setRequestDismissed(true) }}
          onDecline={() => setRequestDismissed(true)}
        />
      )}

      {/* Layer 1+2+3 — Cover, Header body, Stats row */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={following}
        onFollow={() => setFollowing(f => !f)}
        badges={propFirmBadges}
      />

      {/* Private gate */}
      {user.isPrivate ? (
        <PrivateProfile following={following} onFollowChange={setFollowing} />
      ) : (
        <>
          {/* Layer 4 — DNA Banner */}
          <TradeDnaBanner
            dna={dna}
            loading={dnaLoading}
            onExpand={() => setDnaExpanded(true)}
          />

          {/* Layer 5 — Tabs */}
          <TabsBar active={tab} onChange={setTab} />

          {/* Layer 6 — Feed */}
          <div style={{
            background: 'var(--bg-page)',
            padding: '10px 20px',
            flex: 1,
          }}>
            {/* DNA auto-post */}
            {dna && (
              <DnaAutoPost
                dna={dna}
                userName={user.name}
                onViewDna={() => setDnaExpanded(true)}
              />
            )}

            {/* Published MT5 posts */}
            {(tab === 'all' || tab === 'trades') && mt5Posts.map(post => (
              <PublishedMT5ProfileCard key={post.id} post={post} user={user} />
            ))}

            {/* Pinned post */}
            {pinnedPost && (
              <PinnedWrapper>
                <PostFeedCard post={pinnedPost} user={user} pinned />
              </PinnedWrapper>
            )}

            {/* Regular posts */}
            {feedPosts.length > 0
              ? feedPosts.map(post => (
                  <PostFeedCard key={post.id} post={post} user={user} />
                ))
              : !pinnedPost && <EmptyFeed tab={tab} />
            }

            <div style={{ height: 40 }} />
          </div>
        </>
      )}

      {/* DNA full modal */}
      {dnaExpanded && (
        <DnaModal
          dna={dna}
          loading={dnaLoading}
          onClose={() => setDnaExpanded(false)}
        />
      )}
    </div>
  )
}
