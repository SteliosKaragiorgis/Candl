// Left-column data cards for the Profile page

// ── Types ─────────────────────────────────────────────────────────────────────

type Firm = 'FTMO' | 'TFT' | 'Apex' | 'E8'

interface DemoChallenge {
  firm: Firm
  phase: string
  currentProfit: number
  targetProfit: number
  daysLeft: number
}

interface TickerRow {
  t: string
  p: number
  c: number   // change %
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_CHALLENGES: Record<string, DemoChallenge> = {
  u1: { firm: 'FTMO', phase: 'Phase 2', currentProfit: 4200,  targetProfit: 10000, daysLeft: 12 },
  u0: { firm: 'TFT',  phase: 'Phase 1', currentProfit: 800,   targetProfit: 5000,  daysLeft: 21 },
  u3: { firm: 'E8',   phase: 'Phase 1', currentProfit: 1500,  targetProfit: 8000,  daysLeft: 8  },
  u5: { firm: 'Apex', phase: 'Phase 2', currentProfit: 6800,  targetProfit: 12500, daysLeft: 4  },
}

const FAV_TICKERS: TickerRow[] = [
  { t: 'NVDA', p: 882.60, c:  3.17 },
  { t: 'AAPL', p: 211.45, c:  0.59 },
  { t: 'SPY',  p: 512.50, c: -0.40 },
  { t: 'AMD',  p: 162.50, c:  1.88 },
  { t: 'TSLA', p: 172.00, c: -4.16 },
]

// ── Firm badge styles ─────────────────────────────────────────────────────────

type FirmStyle = { bg: string; color: string; border: string }

function firmStyle(firm: Firm): FirmStyle {
  switch (firm) {
    case 'FTMO': return { bg: 'var(--blue-bg)',   color: 'var(--blue)',   border: 'var(--blue-border)'   }
    case 'TFT':  return { bg: 'var(--purple-bg)', color: 'var(--purple)', border: 'var(--purple-border)' }
    case 'Apex': return { bg: 'var(--amber-bg)',  color: 'var(--amber)',  border: 'var(--amber-border)'  }
    case 'E8':   return { bg: 'var(--green-bg)',  color: 'var(--green)',  border: 'var(--green-border)'  }
  }
}

// ── Section label (shared with ProfilePage) ───────────────────────────────────

export function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

export function ColumnDivider() {
  return <div style={{ height: '0.5px', background: 'var(--border-soft)', margin: '12px 0' }} />
}

// ── Active challenge card ─────────────────────────────────────────────────────

export function ActiveChallengeCard({ userId }: { userId: string }) {
  const challenge = DEMO_CHALLENGES[userId]

  if (!challenge) {
    return (
      <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0, lineHeight: 1.6 }}>
        No active challenge — start one in Prop Firm hub
      </p>
    )
  }

  const { firm, phase, currentProfit, targetProfit, daysLeft } = challenge
  const progress = Math.min((currentProfit / targetProfit) * 100, 100)
  const fs = firmStyle(firm)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: 6, padding: 10, marginBottom: 12,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 600,
          padding: '2px 7px', borderRadius: 3,
          background: fs.bg, color: fs.color, border: `0.5px solid ${fs.border}`,
        }}>
          {firm}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 500,
          background: 'var(--green-bg)', color: 'var(--green)',
          padding: '2px 7px', borderRadius: 10,
        }}>
          {phase}
        </span>
      </div>

      {/* Progress label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Profit target</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)' }}>
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: 'var(--green)', borderRadius: 2,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Meta */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
        ${currentProfit.toLocaleString()} / ${targetProfit.toLocaleString()} · {daysLeft} days left
      </div>
    </div>
  )
}

// ── Favourite tickers card ────────────────────────────────────────────────────

export function FavTickersCard() {
  return (
    <div>
      {FAV_TICKERS.map(({ t, p, c }, i) => (
        <div
          key={t}
          style={{
            display: 'flex', alignItems: 'center',
            padding: '5px 0',
            borderBottom: i < FAV_TICKERS.length - 1 ? '0.5px solid var(--border-soft)' : 'none',
            cursor: 'pointer',
          }}
        >
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: 'var(--text)', width: 44,
          }}>
            {t}
          </span>
          <span style={{
            fontSize: 11, color: 'var(--text-3)', flex: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            ${p.toFixed(2)}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: c >= 0 ? 'var(--green)' : 'var(--red)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {c >= 0 ? '+' : ''}{c.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}
