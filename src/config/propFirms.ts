export interface PropFirmConfig {
  id: string
  name: string
  shortName: string
  logoUrl: string
  logoFallback: string
  affiliateUrl: string
  discountCode?: string
  color: string
  challengeFrom: number
  popular?: boolean
}

export const PROP_FIRMS: PropFirmConfig[] = [
  {
    id: 'ftmo',
    name: 'FTMO',
    shortName: 'FTMO',
    logoUrl: 'https://ftmo.com/wp-content/themes/ftmo/img/logo.svg',
    logoFallback: 'FTMO',
    affiliateUrl: 'https://ftmo.com/?affiliateId=YOUR_ID',
    discountCode: 'CANDL10',
    color: '#1d4ed8',
    challengeFrom: 155,
    popular: true,
  },
  {
    id: 'tft',
    name: 'The Funded Trader',
    shortName: 'TFT',
    logoUrl: 'https://cdn.thefundedtraderprogram.com/images/logo.svg',
    logoFallback: 'The Funded Trader',
    affiliateUrl: 'https://thefundedtraderprogram.com/?ref=YOUR_ID',
    color: '#7c3aed',
    challengeFrom: 119,
  },
  {
    id: 'apex',
    name: 'Apex Trader Funding',
    shortName: 'Apex',
    logoUrl: 'https://apextraderfunding.com/wp-content/uploads/apex-logo.svg',
    logoFallback: 'Apex Trader',
    affiliateUrl: 'https://apextraderfunding.com/?ref=YOUR_ID',
    color: '#b45309',
    challengeFrom: 147,
  },
  {
    id: 'e8',
    name: 'E8 Funding',
    shortName: 'E8',
    logoUrl: 'https://e8funding.com/wp-content/themes/e8/images/logo.svg',
    logoFallback: 'E8 Funding',
    affiliateUrl: 'https://e8funding.com/?ref=YOUR_ID',
    color: '#16a34a',
    challengeFrom: 168,
  },
  {
    id: 'fundednext',
    name: 'FundedNext',
    shortName: 'FundedNext',
    logoUrl: 'https://fundednext.com/images/logo.svg',
    logoFallback: 'FundedNext',
    affiliateUrl: 'https://fundednext.com/?ref=YOUR_ID',
    color: '#0891b2',
    challengeFrom: 99,
  },
]
