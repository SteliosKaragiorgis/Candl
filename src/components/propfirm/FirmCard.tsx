import React, { useState, useRef } from 'react'
import type { PropFirmConfig } from '../../config/propFirms'
import { trackAffiliateClick } from '../../utils/analytics'

interface Props {
  firm: PropFirmConfig
  stats: {
    passRate: number
    avgDays: number
    attempts: number
  }
}

export default function FirmCard({ firm, stats }: Props) {
  const [hovered, setHovered] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const fallbackRef = useRef<HTMLSpanElement>(null)

  const { passRate, avgDays, attempts } = stats

  function handleImgError() {
    if (imgRef.current) imgRef.current.style.display = 'none'
    if (fallbackRef.current) fallbackRef.current.style.display = 'inline'
  }

  function getBarColor(): string {
    if (passRate >= 35) return 'var(--green)'
    if (passRate >= 25) return 'var(--amber)'
    return 'var(--red)'
  }

  function handleCTA() {
    trackAffiliateClick(firm.id)
    window.open(firm.affiliateUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-card)',
        border: `0.5px solid ${hovered ? 'var(--border-hard)' : 'var(--border)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Top section */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--border)',
      }}>
        {/* Logo row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              ref={imgRef}
              src={firm.logoUrl}
              height={28}
              loading="lazy"
              draggable={false}
              alt={firm.name}
              onError={handleImgError}
              style={{ objectFit: 'contain', objectPosition: 'left center', maxWidth: 160 }}
            />
            <span
              ref={fallbackRef}
              style={{ display: 'none', fontSize: 16, fontWeight: 600, color: 'var(--text-1)' }}
            >
              {firm.logoFallback}
            </span>
          </div>
          {firm.popular && (
            <span style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'var(--blue-bg)',
              color: 'var(--blue)',
              border: '0.5px solid var(--blue-border)',
            }}>
              Most popular
            </span>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            <span style={{ fontWeight: 500, color: 'var(--text-1)', marginRight: 2 }}>
              {passRate > 0 ? passRate : '—'}
            </span>
            {passRate > 0 ? '% pass rate' : 'pass rate'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            <span style={{ fontWeight: 500, color: 'var(--text-1)', marginRight: 2 }}>
              {avgDays > 0 ? avgDays : '—'}
            </span>
            avg days
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            <span style={{ fontWeight: 500, color: 'var(--text-1)', marginRight: 2 }}>
              {attempts > 0 ? attempts : '—'}
            </span>
            attempts
          </span>
        </div>

        {/* Pass rate bar */}
        <div style={{
          marginTop: 8,
          height: 3,
          background: 'var(--bg-surface)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${passRate}%`,
            height: '100%',
            borderRadius: 2,
            background: getBarColor(),
          }} />
        </div>

        {/* Discount hint */}
        {firm.discountCode && (
          <div style={{
            marginTop: 6,
            display: 'flex',
            gap: 4,
            alignItems: 'center',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: 10, color: 'var(--text-4)' }}>
              Candl. community discount available
            </span>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--bg-surface)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>From</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--green)', marginLeft: 4 }}>
            ${firm.challengeFrom}
          </span>
        </div>
        <button
          onClick={handleCTA}
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '5px 14px',
            borderRadius: 5,
            border: 'none',
            cursor: 'pointer',
            color: '#ffffff',
            background: firm.color,
            fontFamily: 'inherit',
          }}
        >
          Start challenge →
        </button>
      </div>
    </div>
  )
}
