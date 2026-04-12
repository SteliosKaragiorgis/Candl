import type { TradeDna } from '../types/tradeDna'

export interface DnaFeedPost {
  id: string
  postType: 'dna_update'
  author: string
  authorHandle: string
  body: string
  createdAt: string
  dnaSnapshot: TradeDna
}

export function generateDnaPost(dna: TradeDna, userName: string): DnaFeedPost {
  const topSession    = dna.sessions[0]
  const topSetup      = dna.setups[0]
  const weaknessCount = dna.patterns.filter(p => p.type === 'weakness').length

  let body = `${userName}'s trading DNA updated — ${dna.tradeCount} verified trades analysed. `

  if (topSession) {
    body += `Best session: ${topSession.session} (${topSession.winRate}% WR). `
  }
  if (topSetup) {
    body += `Best setup: ${topSetup.setup} (${topSetup.winRate}% WR). `
  }
  if (weaknessCount > 0) {
    body += `AI flagged ${weaknessCount} recurring pattern${weaknessCount > 1 ? 's' : ''} — see full DNA on profile.`
  }

  return {
    id:           `dna_${dna.userId}_${Date.now()}`,
    postType:     'dna_update',
    author:       'Candl. AI',
    authorHandle: '@candl',
    body:         body.trim(),
    createdAt:    new Date().toISOString(),
    dnaSnapshot:  dna,
  }
}
