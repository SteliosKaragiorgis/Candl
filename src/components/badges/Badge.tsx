import type { Badge as BadgeType } from '../../types/badges'

// ── Colour → CSS var mappings ─────────────────────────────────────────────────

const COLOUR_STYLES: Record<
  BadgeType['colour'],
  { bg: string; color: string; border: string }
> = {
  green: {
    bg:     'var(--green-bg)',
    color:  'var(--green)',
    border: 'var(--green-border)',
  },
  blue: {
    bg:     'var(--blue-bg)',
    color:  'var(--blue)',
    border: 'var(--blue-border)',
  },
  amber: {
    bg:     'var(--amber-bg)',
    color:  'var(--amber)',
    border: 'var(--amber-border)',
  },
  gray: {
    bg:     'var(--bg-surface)',
    color:  'var(--text-3)',
    border: 'var(--border-hard)',
  },
  purple: {
    bg:     '#2d1a5c',
    color:  '#a78bfa',
    border: '#4c1d95',
  },
}

interface Props {
  badge: BadgeType
  size?: 'sm' | 'md'
}

export default function Badge({ badge, size = 'md' }: Props) {
  const { bg, color, border } = COLOUR_STYLES[badge.colour]
  const isSm = size === 'sm'

  return (
    <span
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            4,
        fontSize:       isSm ? 10 : 11,
        fontWeight:     500,
        padding:        isSm ? '2px 7px' : '3px 9px',
        borderRadius:   4,
        whiteSpace:     'nowrap',
        background:     bg,
        color,
        border:         `0.5px solid ${border}`,
        flexShrink:     0,
      }}
    >
      {/* Verified dot */}
      {badge.verified && (
        <span
          style={{
            width:        4,
            height:       4,
            borderRadius: '50%',
            background:   color,
            flexShrink:   0,
            display:      'inline-block',
          }}
        />
      )}

      {/* Label */}
      <span>{badge.label}</span>

      {/* Sublabel */}
      {badge.sublabel && (
        <>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ opacity: 0.7 }}>{badge.sublabel}</span>
        </>
      )}
    </span>
  )
}
