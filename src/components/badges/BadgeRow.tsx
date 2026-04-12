import type { Badge as BadgeType, BadgeCategory } from '../../types/badges'
import Badge from './Badge'

// ── Category ordering for 'profile' context ───────────────────────────────────

const PROFILE_ORDER: BadgeCategory[] = [
  'STYLE',
  'SESSION',
  'INSTRUMENT',
  'SETUP',
  'PROP_FIRM',
  'METHODOLOGY',
  'MARKETS',
]

function sortForProfile(badges: BadgeType[]): BadgeType[] {
  return [...badges].sort((a, b) => {
    const ai = PROFILE_ORDER.indexOf(a.category)
    const bi = PROFILE_ORDER.indexOf(b.category)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

// ── Context filtering ─────────────────────────────────────────────────────────

type Context = 'profile' | 'post' | 'dna' | 'leaderboard'

function filterByContext(badges: BadgeType[], context: Context): BadgeType[] {
  switch (context) {
    case 'profile':
      return sortForProfile(badges)

    case 'post':
      // Only prop firm funded badges (source === PROP_FIRM)
      return badges.filter(b => b.source === 'PROP_FIRM')

    case 'dna':
      // Only auto-calculated badges
      return badges.filter(b =>
        b.category === 'SESSION' ||
        b.category === 'INSTRUMENT' ||
        b.category === 'SETUP' ||
        b.category === 'STYLE',
      )

    case 'leaderboard':
      // Caller pre-filters; just render as-is
      return badges

    default:
      return badges
  }
}

// ── BadgeRow ──────────────────────────────────────────────────────────────────

interface Props {
  badges:    BadgeType[]
  context:   Context
  maxCount?: number
}

export default function BadgeRow({ badges, context, maxCount }: Props) {
  const filtered = filterByContext(badges, context)
  if (filtered.length === 0) return null

  const size = context === 'leaderboard' ? 'sm' : 'md'
  const shown  = maxCount ? filtered.slice(0, maxCount) : filtered
  const hidden = maxCount ? Math.max(0, filtered.length - maxCount) : 0

  return (
    <div
      style={{
        display:   'flex',
        alignItems: 'center',
        flexWrap:  'wrap',
        gap:       5,
      }}
    >
      {shown.map(badge => (
        <Badge key={badge.id} badge={badge} size={size} />
      ))}

      {hidden > 0 && (
        <span
          style={{
            fontSize: 11,
            color:    'var(--text-4)',
          }}
        >
          +{hidden} more
        </span>
      )}
    </div>
  )
}
