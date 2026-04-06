export const colors = {
  bgPrimary:    '#0a0a0a',
  bgSecondary:  '#0f0f0f',
  bgTertiary:   '#080808',
  border:       '#1a1a1a',
  borderSubtle: '#141414',
  borderEmphasis: '#2a2a2a',
  textPrimary:  '#e4e4e4',
  textSecondary:'#a0a0a0',
  textMuted:    '#555555',
  textHint:     '#333333',
  green:        '#22c55e',
  greenBg:      '#0d1f12',
  greenBorder:  '#1a3a22',
  amber:        '#f59e0b',
  amberBg:      '#1f1200',
  amberBorder:  'rgba(245,158,11,0.2)',
  blue:         '#3b82f6',
  blueBg:       '#0d1627',
  blueBorder:   '#1a3a5c',
  red:          '#ef4444',
  redBg:        '#1f0d0d',
  redBorder:    'rgba(239,68,68,0.2)',
} as const;

export const typography = {
  fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
  sizes: {
    micro:       10,
    meta:        11,
    bodySmall:   12,
    body:        13,
    bodyLarge:   14,
    headingSmall:16,
    heading:     20,
  },
  weights: {
    regular: 400,
    medium:  500,
  },
} as const;

export const radii = {
  badge:  3,
  button: 4,
  input:  4,
  card:   8,
} as const;

export const borders = {
  default:   `0.5px solid ${colors.border}`,
  subtle:    `0.5px solid ${colors.borderSubtle}`,
  emphasis:  `0.5px solid ${colors.borderEmphasis}`,
  green:     `0.5px solid ${colors.greenBorder}`,
  blue:      `0.5px solid ${colors.blueBorder}`,
  red:       `0.5px solid ${colors.redBorder}`,
} as const;
