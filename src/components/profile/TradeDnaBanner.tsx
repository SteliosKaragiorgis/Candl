import type { TradeDna } from '../../types/tradeDna'
import type { Badge } from '../../types/badges'
import BadgeRow from '../badges/BadgeRow'

interface Props {
  dna:        TradeDna | null
  loading:    boolean
  onExpand:   () => void
  autoBadges?: Badge[]
}

// ── Pulse keyframes (injected once) ──────────────────────────────────────────
const PULSE_CSS = `
  @keyframes bannerPulse {
    0%,100% { opacity: 0.25 }
    50%      { opacity: 0.65 }
  }
`

function SkeletonBar({ w, delay = 0 }: { w: number; delay?: number }) {
  return (
    <div style={{
      height: 9, borderRadius: 3,
      background: 'var(--green)',
      width: w, opacity: 0.3,
      animation: `bannerPulse 1.5s ease-in-out ${delay}s infinite`,
    }} />
  )
}

// ── DNA radial icon ───────────────────────────────────────────────────────────
function DnaIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="var(--green)" strokeWidth="2" strokeLinecap="round">
      <path d="M2 15C8.67 15 15.33 9 22 9" />
      <path d="M2 9c6.67 0 13.33 6 20 6" />
      <line x1="12" y1="3" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21" />
    </svg>
  )
}

// ── Middle stat item ──────────────────────────────────────────────────────────
function StatItem({
  value, label, last = false, accent = false,
}: {
  value: string
  label: string
  last?: boolean
  accent?: boolean
}) {
  return (
    <div style={{
      padding: last ? '0 0 0 14px' : '0 14px',
      borderRight: last ? 'none' : '0.5px solid var(--green-border)',
      textAlign: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600,
        color: accent ? 'var(--red)' : 'var(--green)',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10, marginTop: 1,
        color: accent ? 'var(--red)' : 'var(--green)',
        opacity: accent ? 1 : 0.65,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
    </div>
  )
}

// ── Banner ────────────────────────────────────────────────────────────────────
export default function TradeDnaBanner({ dna, loading, onExpand, autoBadges = [] }: Props) {
  // Hidden when no data and not loading
  if (!loading && !dna) return null

  const containerStyle: React.CSSProperties = {
    background: 'var(--green-bg)',
    borderBottom: '0.5px solid var(--green-border)',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    gap: 12,
    overflowX: 'auto',
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={containerStyle}>
        <style>{PULSE_CSS}</style>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <DnaIcon />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SkeletonBar w={90} />
            <SkeletonBar w={120} delay={0.15} />
          </div>
        </div>

        {/* Middle skeleton bars */}
        <div style={{ display: 'flex', gap: 0, flex: 1, justifyContent: 'center' }}>
          {[70, 80, 65, 55, 75].map((w, i) => (
            <div key={i} style={{
              padding: '0 14px',
              borderRight: i < 4 ? '0.5px solid var(--green-border)' : 'none',
              display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
            }}>
              <SkeletonBar w={w} delay={i * 0.1} />
              <SkeletonBar w={w - 15} delay={i * 0.1 + 0.05} />
            </div>
          ))}
        </div>

        {/* Right */}
        <SkeletonBar w={68} delay={0.5} />
      </div>
    )
  }

  // ── Data state ──────────────────────────────────────────────────────────────
  const topSession    = dna!.sessions[0]
  const topSetup      = dna!.setups[0]
  const topInstrument = dna!.instruments[0]
  const weakness      = dna!.patterns.find(p => p.type === 'weakness')

  // Build middle items
  const items: Array<{ value: string; label: string; accent?: boolean }> = []

  if (topSession) {
    items.push({
      value: topSession.session,
      label: `Best session · ${topSession.winRate}% WR`,
    })
  }
  if (topSetup) {
    items.push({
      value: topSetup.setup,
      label: `Best setup · ${topSetup.winRate}% WR`,
    })
  }
  if (topInstrument) {
    items.push({
      value: topInstrument.instrument,
      label: `Best instrument · ${topInstrument.winRate}% WR`,
    })
  }

  items.push({
    value: `${dna!.avgRiskPercent.toFixed(1)}%`,
    label: 'Avg risk/trade',
  })

  if (weakness) {
    items.push({
      value: weakness.label,
      label: `Pattern · ${weakness.frequency ?? ''}`,
      accent: true,
    })
  }

  return (
    <div style={containerStyle} className="scrollbar-hide">
      <style>{PULSE_CSS}</style>

      {/* Left — icon + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--bg-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <DnaIcon />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>
            Trading DNA
          </div>
          <div style={{
            fontSize: 11, color: 'var(--green)', opacity: 0.65,
            marginTop: 1, whiteSpace: 'nowrap',
          }}>
            {dna!.tradeCount} verified trades · AI analysed
          </div>
        </div>
      </div>

      {/* Middle — stat items */}
      <div style={{ display: 'flex', gap: 0, flex: 1, overflowX: 'auto' }} className="scrollbar-hide">
        {items.map((item, i) => (
          <StatItem
            key={i}
            value={item.value}
            label={item.label}
            last={i === items.length - 1}
            accent={item.accent}
          />
        ))}
      </div>

      {/* Auto badges */}
      {autoBadges.length > 0 && (
        <BadgeRow badges={autoBadges} context="dna" />
      )}

      {/* Right — expand button */}
      <button
        onClick={onExpand}
        style={{
          fontSize: 11, color: 'var(--green)',
          border: '0.5px solid var(--green-border)',
          padding: '4px 10px', borderRadius: 5,
          background: 'transparent',
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap', flexShrink: 0,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        Full DNA ↗
      </button>
    </div>
  )
}
