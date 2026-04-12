import type { TradeDna } from '../../types/tradeDna'

// ── DNA icon ─────────────────────────────────────────────────────────────────
function DnaIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round">
      <path d="M2 15C8.67 15 15.33 9 22 9" />
      <path d="M2 9c6.67 0 13.33 6 20 6" />
      <line x1="12" y1="3" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="5"  y1="5" x2="7"  y2="7" />
      <line x1="17" y1="17" x2="19" y2="19" />
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function barColor(wr: number) {
  return wr >= 65 ? 'var(--green)' : wr >= 50 ? 'var(--amber)' : 'var(--red)'
}

function Divider() {
  return <div style={{ height: '0.5px', background: 'var(--border-soft)', margin: '8px 0' }} />
}

function SubLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em',
      color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600,
    }}>
      {children}
    </div>
  )
}

function BarRow({ label, winRate }: { label: string; winRate: number }) {
  const color = barColor(winRate)
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
      <span style={{
        fontSize: 11, color: 'var(--text-2)',
        width: 72, flexShrink: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{
        flex: 1, height: 3, background: 'var(--bg-surface)',
        borderRadius: 2, margin: '0 6px', overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(winRate, 100)}%`, height: '100%',
          background: color, borderRadius: 2,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        fontSize: 11, fontWeight: 600,
        width: 28, textAlign: 'right',
        color, fontVariantNumeric: 'tabular-nums',
      }}>
        {winRate}%
      </span>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const PULSE_STYLE = `
  @keyframes dnaPulse {
    0%,100% { opacity: 0.3 }
    50%      { opacity: 0.8 }
  }
`

function SkeletonRow({ w = '100%', delay = 0 }: { w?: string; delay?: number }) {
  return (
    <div style={{
      height: 10, borderRadius: 3,
      background: 'var(--bg-surface)',
      width: w, marginBottom: 8,
      animation: `dnaPulse 1.5s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }} />
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { dna: TradeDna | null; loading: boolean }

export default function TradeDnaCard({ dna, loading }: Props) {
  // Empty state
  if (!loading && !dna) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '0.5px dashed var(--border-hard)',
        borderRadius: 6, padding: 12, marginBottom: 12,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
          Sync 10+ trades via MT5 or CSV to generate your Trade DNA
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--green-border)',
      borderRadius: 8, overflow: 'hidden', marginBottom: 12,
    }}>
      <style>{PULSE_STYLE}</style>

      {/* Header */}
      <div style={{
        background: 'var(--green-bg)',
        borderBottom: '0.5px solid var(--green-border)',
        padding: '8px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 600, color: 'var(--green)',
        }}>
          <DnaIcon />
          Trading DNA
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600,
          background: 'var(--bg-card)', color: 'var(--green)',
          border: '0.5px solid var(--green-border)',
          padding: '2px 6px', borderRadius: 3,
        }}>
          {loading ? '— trades' : `${dna!.tradeCount} trades`} · AI
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px' }}>
        {loading ? (
          <>
            {[0, 0.1, 0.2, 0.3, 0.4, 0.55].map((delay, i) => (
              <SkeletonRow key={i} w={i % 2 === 0 ? '100%' : '75%'} delay={delay} />
            ))}
          </>
        ) : (
          <>
            {/* Sessions */}
            {dna!.sessions.length > 0 && (
              <>
                <SubLabel>Session</SubLabel>
                {dna!.sessions.slice(0, 3).map(s => (
                  <BarRow key={s.session} label={s.session} winRate={s.winRate} />
                ))}
              </>
            )}

            {dna!.sessions.length > 0 && dna!.setups.length > 0 && <Divider />}

            {/* Setups */}
            {dna!.setups.length > 0 && (
              <>
                <SubLabel>Setup</SubLabel>
                {dna!.setups.slice(0, 3).map(s => (
                  <BarRow key={s.setup} label={s.setup} winRate={s.winRate} />
                ))}
              </>
            )}

            {dna!.setups.length > 0 && dna!.instruments.length > 0 && <Divider />}

            {/* Instruments */}
            {dna!.instruments.length > 0 && (
              <>
                <SubLabel>Instrument</SubLabel>
                {dna!.instruments.slice(0, 3).map(s => (
                  <BarRow key={s.instrument} label={s.instrument} winRate={s.winRate} />
                ))}
              </>
            )}

            {/* AI Patterns */}
            {dna!.patterns.length > 0 && (
              <>
                <Divider />
                <SubLabel>AI patterns</SubLabel>
                {dna!.patterns.map((p, i) => {
                  const isWeak = p.type === 'weakness'
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', gap: 3,
                      padding: '7px 9px', marginBottom: 5,
                      borderRadius: '0 4px 4px 0',
                      borderLeft: `2px solid ${isWeak ? 'var(--red-border)' : 'var(--green-border)'}`,
                      background: isWeak ? 'var(--red-bg)' : 'var(--green-bg)',
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: isWeak ? 'var(--red)' : 'var(--green)',
                      }}>
                        {isWeak ? 'Pattern' : 'Strength'} — {p.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        {p.description}
                      </span>
                    </div>
                  )
                })}
              </>
            )}

            <Divider />

            {/* Risk stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              <div style={{ background: 'var(--bg-surface)', borderRadius: 5, padding: '7px 9px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {dna!.avgRiskPercent.toFixed(1)}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Avg risk/trade</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', borderRadius: 5, padding: '7px 9px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                  {dna!.avgRR.toFixed(1)}R
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Avg R:R</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
