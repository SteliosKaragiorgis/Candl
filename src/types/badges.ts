export type BadgeSource = 'MT5' | 'PROP_FIRM' | 'MANUAL'

export type BadgeCategory =
  | 'SESSION'        // London session, New York, Asia
  | 'INSTRUMENT'     // FX, Stocks, Indices, Crypto
  | 'STYLE'          // Swing trader, Day trader, Scalper
  | 'SETUP'          // Breakout, Trend follow, Reversal
  | 'PROP_FIRM'      // FTMO funded, TFT funded etc
  | 'METHODOLOGY'    // Price action, ICT, Wyckoff etc
  | 'MARKETS'        // Self-declared markets

export type BadgeColour = 'green' | 'blue' | 'amber' | 'gray' | 'purple'

export interface Badge {
  id: string
  label: string
  category: BadgeCategory
  source: BadgeSource
  colour: BadgeColour
  verified: boolean       // true = backed by data, false = self-declared
  value?: number          // e.g. win rate % for this badge
  sublabel?: string       // e.g. "74% WR"
}
