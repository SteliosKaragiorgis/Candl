import React, { useRef } from 'react'
import { PROP_FIRMS } from '../../config/propFirms'
import { useFirmStats } from '../../hooks/usePropFirmCommunity'
import FirmCard from './FirmCard'

export default function FirmGrid() {
  const firmStats = useFirmStats()
  const gridRef = useRef<HTMLDivElement>(null)

  function scrollToGrid() {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      {/* Affiliate banner */}
      <div style={{
        background: 'var(--green-bg)',
        border: '0.5px solid var(--green-border)',
        borderRadius: 10,
        padding: '14px 16px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <div style={{
          width: 40,
          height: 40,
          background: 'var(--green)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--green)', marginBottom: 2 }}>
            Start your funded trading journey
          </div>
          <div style={{ fontSize: 12, color: 'var(--green)', opacity: 0.75 }}>
            Exclusive discounts · verified by Candl. community pass rates
          </div>
        </div>
        <button
          onClick={scrollToGrid}
          style={{
            background: 'var(--green)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            padding: '7px 16px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            marginLeft: 'auto',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          View all challenges
        </button>
      </div>

      {/* Community stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1,
        background: 'var(--border-soft)',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 12,
      }}>
        <div style={{ background: 'var(--bg-card)', padding: '12px 14px' }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
            $284K
          </div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-4)', letterSpacing: '0.05em', marginTop: 3 }}>
            Community payouts this month
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '12px 14px' }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
            847
          </div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-4)', letterSpacing: '0.05em', marginTop: 3 }}>
            Challenges started
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '12px 14px' }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
            38%
          </div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-4)', letterSpacing: '0.05em', marginTop: 3 }}>
            Avg pass rate
          </div>
        </div>
      </div>

      {/* Firm grid */}
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        {PROP_FIRMS.map(firm => {
          const match = firmStats.find(
            s => s.firm === firm.shortName || s.firm === firm.name
          )
          const stats = match
            ? { passRate: match.passRate, avgDays: match.avgDays, attempts: match.attempts }
            : { passRate: 0, avgDays: 0, attempts: 0 }
          return <FirmCard key={firm.id} firm={firm} stats={stats} />
        })}
      </div>

      {/* Disclosure */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <div style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'var(--bg-surface)',
          border: '0.5px solid var(--border-hard)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" />
            <line x1="12" y1="12" x2="12" y2="16" />
          </svg>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-4)', lineHeight: 1.6, margin: 0 }}>
          Candl. earns a commission when you start a challenge through these links — at no extra cost to you. Challenge prices and pass rates are updated weekly from Candl. community data.
        </p>
      </div>
    </div>
  )
}
