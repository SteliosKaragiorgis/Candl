import type {
  User, Post, WatchlistItem, LeaderboardEntry, TrendingTicker, Notification as LegacyNotification
} from '../types';

export const APP_NAME = 'Candl.';
export const APP_TAGLINE = 'Chart · Trade · Connect';

export interface EconomicEvent {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  date: Date;
  time: string;
  timezone: string;
  category: 'fomc' | 'cpi' | 'nfp' | 'gdp' | 'earnings' | 'pce';
  importance: 'High' | 'Med' | 'Low';
}

export interface NewsItem {
  id: string;
  source: string;
  sourceColor: string;
  headline: string;
  time: string;
  category: string;
  ticker: string;
  priceBefore: number;
  priceAfter: number;
  changePct: string;
  up: boolean;
  timeAgo: string;
  sparkline: string;
  relatedPostId: string;
}

export const ECONOMIC_EVENTS: EconomicEvent[] = [
  { id: 'fomc-mar-2026', name: 'FOMC Interest Rate Decision', shortName: 'FOMC', icon: '🏦', date: new Date('2026-03-19T19:00:00Z'), time: '14:00 EST', timezone: 'EST', category: 'fomc',     importance: 'High' },
  { id: 'cpi-mar-2026',  name: 'CPI Inflation Report',        shortName: 'CPI',  icon: '📊', date: new Date('2026-03-22T12:30:00Z'), time: '08:30 EST', timezone: 'EST', category: 'cpi',      importance: 'High' },
  { id: 'nfp-apr-2026',  name: 'NFP Jobs Report',             shortName: 'NFP',  icon: '💼', date: new Date('2026-04-03T12:30:00Z'), time: '08:30 EST', timezone: 'EST', category: 'nfp',      importance: 'High' },
  { id: 'gdp-mar-2026',  name: 'GDP Growth Release',          shortName: 'GDP',  icon: '📈', date: new Date('2026-04-29T12:30:00Z'), time: '08:30 EST', timezone: 'EST', category: 'gdp',      importance: 'Med'  },
  { id: 'nvda-earnings', name: 'NVDA Earnings',               shortName: 'NVDA', icon: '💡', date: new Date('2026-05-21T20:00:00Z'), time: 'After Close', timezone: 'EST', category: 'earnings', importance: 'High' },
];

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'news1',
    source: 'REUTERS',
    sourceColor: '#16a34a',
    headline: 'Jensen Huang confirms Blackwell GPU demand "staggering" — hyperscaler orders up 3× heading into Q2',
    time: 'Today, 09:14 EST',
    category: 'Earnings pre-announcement',
    ticker: 'NVDA',
    priceBefore: 854.20,
    priceAfter: 882.60,
    changePct: '+3.17%',
    up: true,
    timeAgo: '38 min',
    sparkline: '0,22 20,22 40,22 60,21 75,18 82,12 90,6 105,4 120,3',
    relatedPostId: 'p1',
  },
  {
    id: 'news2',
    source: 'NHTSA',
    sourceColor: '#dc2626',
    headline: 'Tesla faces NHTSA probe into FSD software — recall of 280k vehicles under review',
    time: 'Today, 08:52 EST',
    category: 'Regulatory filing',
    ticker: 'TSLA',
    priceBefore: 179.40,
    priceAfter: 172.00,
    changePct: '-4.16%',
    up: false,
    timeAgo: '55 min',
    sparkline: '0,10 20,10 40,10 60,11 75,14 82,20 90,26 105,29 120,30',
    relatedPostId: 'p2',
  },
];

// ── Users ──────────────────────────────────────────────────────────────────────

export const alexKim: User = {
  id: 'u1', name: 'Alex Kim', username: 'swingkingAK', initials: 'AK',
  avatarGradient: ['#3b82f6', '#4f46e5'], verified: true,
  bio: 'Swing trader. 8 years in the market. Tech & semis focus.',
  followersCount: 12400, followingCount: 344,
  tradesCount: 218, investmentsCount: 12,
  coverColor: '#1e3a5f',
  mostActive: 'Swing trades · Tech',
};

export const saraR: User = {
  id: 'u2', name: 'Sara R.', username: 'macro_sara', initials: 'SR',
  avatarGradient: ['#8b5cf6', '#7c3aed'], verified: true,
  bio: 'Macro-driven equity trader. Long-term perspective.',
  followersCount: 8310, followingCount: 201,
  tradesCount: 134, investmentsCount: 8,
  coverColor: '#2d1b4e',
  mostActive: 'Macro commentary · FX',
};

export const mikeW: User = {
  id: 'u3', name: 'Mike W.', username: 'optionsmike', initials: 'MW',
  avatarGradient: ['#10b981', '#0d9488'], verified: false,
  bio: 'Options flow reader. Gamma exposure is everything.',
  followersCount: 21000, followingCount: 489,
  tradesCount: 307, investmentsCount: 3,
  coverColor: '#0f2b22',
  mostActive: 'Options flow · Vol',
};

export const jamieT: User = {
  id: 'u4', name: 'Jamie T.', username: 'longonlyjt', initials: 'JT',
  avatarGradient: ['#f97316', '#d97706'], verified: false,
  bio: 'Long only. Fundamental value investor with a growth lens.',
  followersCount: 3140, followingCount: 612,
  tradesCount: 89, investmentsCount: 45,
  coverColor: '#2d1b00',
  mostActive: 'Long-term investing',
};

export const kayL: User = {
  id: 'u5', name: 'Kay L.', username: 'kayltrading', initials: 'KL',
  avatarGradient: ['#06b6d4', '#0284c7'], verified: false,
  bio: 'Quantitative strategies + momentum signals.',
  followersCount: 2210, followingCount: 330,
  tradesCount: 155, investmentsCount: 6,
  coverColor: '#0a2540',
  mostActive: 'Quant signals · Momentum',
};

export const currentUser: User = {
  id: 'u0', name: 'Jamie D.', username: 'jamied', initials: 'JD',
  avatarGradient: ['#f43f5e', '#ec4899'], verified: false,
  bio: 'Learning the markets one trade at a time.',
  followersCount: 142, followingCount: 48,
  tradesCount: 31, investmentsCount: 4,
  coverColor: '#2d0f1f',
  mostActive: 'Learning · Equities',
};

export const ryanC: User = {
  id: 'u7', name: 'Ryan C.', username: 'ryanc_trades', initials: 'RC',
  avatarGradient: ['#0ea5e9', '#06b6d4'], verified: false,
  bio: 'Day trader. Scalping tech & momentum plays.',
  followersCount: 890, followingCount: 213,
  tradesCount: 67, investmentsCount: 2,
  coverColor: '#082f49',
  mostActive: 'Day trading · Tech',
  hasSentFollowRequest: true,
};

export const privateUser: User = {
  id: 'u6', name: 'D. Morgan', username: 'dmorgan_fx', initials: 'DM',
  avatarGradient: ['#1e293b', '#334155'], verified: true,
  bio: 'Institutional FX & macro. Private account.',
  followersCount: 5840, followingCount: 61,
  tradesCount: 0, investmentsCount: 0,
  coverColor: '#0f172a',
  mostActive: 'FX · Macro · Options',
  isPrivate: true,
};

export const DEMO_USERS = { alexKim, saraR, mikeW, jamieT, kayL, currentUser, privateUser, ryanC };
export const SUGGESTED_USERS: User[] = [alexKim, saraR, kayL];

// ── Posts ──────────────────────────────────────────────────────────────────────

export const DEMO_POSTS: Post[] = [
  {
    id: 'p1', postType: 'trade',
    user: alexKim, createdAt: '12m ago',
    body: 'Blackwell ramp accelerating into Q2. Every hyperscaler guided up last cycle. AI capex isn\'t slowing — it\'s inflecting. This pre-earnings dip was a gift.',
    ticker: 'NVDA', tvSymbol: 'NASDAQ:NVDA',
    direction: 'BUY', strategy: 'Momentum', timeframe: 'Daily',
    entry: 882.60, target: 940, stop: 860, rrRatio: '3.1×',
    isOpen: false,
    whyNow: 'Pre-earnings RSI reset off 50-day — textbook momentum entry',
    risk: 'Guidance miss could break the $860 support level',
    invalidation: 'Daily close below $860 on above-average volume',
    hashtags: ['#AI', '#Semiconductors', '#Earnings'],
    likes: 284, comments: 47, shares: 91,
  },
  {
    id: 'p2', postType: 'commentary',
    user: saraR, createdAt: '38m ago',
    ticker: 'TSLA',
    body: 'NHTSA probe isn\'t new risk — it\'s the market re-pricing it. FSD was priced as solved. Watching $168 as real support. Below that and the robotaxi story unravels near-term.',
    newsEvent: 'Tesla NHTSA FSD Probe',
    newsDate: 'Today, 08:52 EST',
    hashtags: ['#TSLA', '#Regulatory', '#FSD'],
    likes: 512, comments: 139, shares: 204,
  },
  {
    id: 'p3', postType: 'investment',
    user: mikeW, createdAt: '1h ago',
    body: 'Fed rate cut cycle just beginning. Equities historically return 18%+ in the 12 months following the first cut. Adding SPY here as a core position — this is a multi-year macro tailwind, not a trade.',
    ticker: 'SPY',
    conviction: 'High', horizon: '2–3 years', addedAt: '$512.50',
    sector: 'Broad Market', isOpen: true,
    catalyst: 'Fed rate cut cycle beginning, historically bullish for equities',
    valuation: 'S&P at 21× forward earnings — fair given falling rates environment',
    risk: 'Recession materialises faster than expected, earnings disappoint',
    hashtags: ['#MacroInvesting', '#Equities', '#RateCuts'],
    likes: 312, comments: 64, shares: 88,
  },
  {
    id: 'p4', postType: 'investment',
    user: jamieT, createdAt: '2h ago',
    body: 'Threads monetisation barely started. Reality Labs losses narrowing. Ad revenue accelerating. This is the most undervalued mega-cap on a forward PE basis — adding on any weakness.',
    ticker: 'META',
    conviction: 'High', horizon: '12–18 months', addedAt: '$485.00',
    sector: 'Technology', isOpen: false,
    catalyst: 'Threads monetisation + Reels ad load still ramping',
    valuation: '22× forward earnings for a 20%+ EPS grower — discount to peers',
    risk: 'Regulatory pressure on data privacy across EU and US',
    hashtags: ['#Advertising', '#SocialMedia', '#Growth'],
    likes: 203, comments: 71, shares: 55,
  },
  {
    id: 'p5', postType: 'commentary',
    user: kayL, createdAt: '3h ago',
    body: 'CPI came in hotter than expected for the third consecutive month. The market is now pricing out 2 of the 3 anticipated cuts for 2025. Watch the 10Y yield — if it breaks 4.6%, duration risk gets repriced hard. Defensives and energy look interesting here.',
    newsEvent: 'CPI Jan 2025: +0.5% MoM vs +0.3% est',
    newsDate: 'Jan 15, 2025',
    hashtags: ['#CPI', '#Macro', '#Rates', '#FedWatch'],
    likes: 441, comments: 93, shares: 127,
  },
  {
    id: 'p6', postType: 'trade',
    user: mikeW, createdAt: '4h ago',
    body: 'Short the squeeze. GEX has flipped negative across the board. Calls get cheaper as IV craters post-event. This is a defined risk options play — not a directional bet on the stock.',
    ticker: 'AMD', tvSymbol: 'NASDAQ:AMD',
    direction: 'SHORT', strategy: 'Options', timeframe: '1H',
    entry: 162.50, target: 148, stop: 168, rrRatio: '2.4×',
    isOpen: true,
    whyNow: 'GEX flip negative, IV crushed post-earnings, range compression',
    risk: 'Unexpected M&A announcement or positive revision to guidance',
    invalidation: 'Close above $168 with expanding volume',
    hashtags: ['#Options', '#GEX', '#AMD'],
    likes: 178, comments: 29, shares: 41,
  },
  {
    id: 'p7', postType: 'social',
    user: saraR, createdAt: '1h ago',
    body: '$5 trillion wiped out.\n\nEverything is going exactly as planned.\n\nStay tuned.',
    ticker: undefined,
    sentiment: 'Bearish',
    images: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    ],
    hashtags: ['#Markets', '#Selloff', '#Macro'],
    likes: 5400, comments: 365, shares: 490,
  },
  {
    id: 'p8', postType: 'social',
    user: alexKim, createdAt: '30m ago',
    body: 'Reminder: market structure is still intact on the weekly. This is noise, not a trend reversal — yet.\n\nWatch the 200-week MA. That\'s the real line in the sand.',
    ticker: 'SPY',
    sentiment: 'Neutral',
    hashtags: ['#SPY', '#MarketStructure', '#Technicals'],
    likes: 1240, comments: 88, shares: 211,
  },
];

// ── Watchlist ──────────────────────────────────────────────────────────────────

export const DEMO_WATCHLIST: WatchlistItem[] = [
  { ticker: 'NVDA', price: 882.60, change:  4.18, changePct:  3.17, sparkline: '0,28 8,22 16,26 24,18 32,10 40,14 48,8 56,4 64,2' },
  { ticker: 'TSLA', price: 172.00, change: -8.42, changePct: -4.16, sparkline: '0,4 8,8 16,6 24,12 32,18 40,16 48,22 56,26 64,30' },
  { ticker: 'SPY',  price: 512.50, change: -2.11, changePct: -0.40, sparkline: '0,12 8,10 16,14 24,12 32,16 40,14 48,18 56,16 64,20' },
  { ticker: 'AAPL', price: 211.45, change:  1.23, changePct:  0.59, sparkline: '0,20 8,18 16,16 24,14 32,12 40,10 48,8 56,6 64,4' },
  { ticker: 'META', price: 485.00, change: 12.60, changePct:  2.22, sparkline: '0,28 8,24 16,20 24,16 32,12 40,8 48,6 56,4 64,2' },
];

// ── Leaderboard — sorted by followers desc ────────────────────────────────────

export const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: alexKim, followersCount: alexKim.followersCount },
  { rank: 2, user: mikeW,   followersCount: mikeW.followersCount },
  { rank: 3, user: saraR,   followersCount: saraR.followersCount },
  { rank: 4, user: jamieT,  followersCount: jamieT.followersCount },
];

// ── Trending ───────────────────────────────────────────────────────────────────

export const DEMO_TRENDING: TrendingTicker[] = [
  { ticker: 'NVDA', change: '+3.17%', changeNum:  3.17, up: true,  posts: '1,420 posts' },
  { ticker: 'SPY',  change: '-0.40%', changeNum: -0.40, up: false, posts: '980 posts'   },
  { ticker: 'TSLA', change: '-4.16%', changeNum: -4.16, up: false, posts: '874 posts'   },
  { ticker: 'META', change: '+2.22%', changeNum:  2.22, up: true,  posts: '611 posts'   },
  { ticker: 'AAPL', change: '+0.59%', changeNum:  0.59, up: true,  posts: '503 posts'   },
  { ticker: 'AMD',  change: '+1.88%', changeNum:  1.88, up: true,  posts: '389 posts'   },
];

// ── Notifications ──────────────────────────────────────────────────────────────

export const DEMO_NOTIFICATIONS: LegacyNotification[] = [
  { id: 'n1', type: 'like',    user: alexKim, content: 'liked your NVDA trade',             time: '2m ago',  read: false },
  { id: 'n2', type: 'follow',  user: saraR,   content: 'started following you',             time: '15m ago', read: false },
  { id: 'n3', type: 'comment', user: mikeW,   content: 'commented on your SPY post',        time: '1h ago',  read: false },
  { id: 'n4', type: 'mention', user: kayL,    content: 'mentioned you in a commentary',     time: '2h ago',  read: true },
  { id: 'n5', type: 'like',    user: jamieT,  content: 'liked your TSLA trade',             time: '3h ago',  read: true },
];

// ── Comments ───────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  userId: string;
  user: {
    name: string;
    handle: string;
    initials: string;
    avatarGradient: string;
    verified: boolean;
  };
  body: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  replies?: Comment[];
}

export const COMMENTS: Record<string, Comment[]> = {
  'p1': [
    {
      id: 'c1', userId: 'u2',
      user: { name: 'Sara R.', handle: '@macro_sara', initials: 'SR', avatarGradient: 'linear-gradient(135deg,#b45309,#f59e0b)', verified: true },
      body: 'Agree on the setup. Watching $870 as the key level — if that holds post-earnings the move to $940 looks very clean.',
      createdAt: '8m ago', likes: 24, liked: false,
      replies: [
        {
          id: 'c1r1', userId: 'u1',
          user: { name: 'Alex Kim', handle: '@swingkingAK', initials: 'AK', avatarGradient: 'linear-gradient(135deg,#1d4ed8,#60a5fa)', verified: true },
          body: 'Exactly — $870 is the line in the sand for me too. Below that and the thesis is off.',
          createdAt: '6m ago', likes: 11, liked: false,
        },
      ],
    },
    {
      id: 'c2', userId: 'u3',
      user: { name: 'Mike W.', handle: '@optionsmike', initials: 'MW', avatarGradient: 'linear-gradient(135deg,#5b21b6,#7c3aed)', verified: false },
      body: 'Implied vol is elevated going into earnings — worth considering a spread instead of outright long to reduce the theta burn.',
      createdAt: '15m ago', likes: 18, liked: false,
    },
    {
      id: 'c3', userId: 'u4',
      user: { name: 'Jamie T.', handle: '@longonlyjt', initials: 'JT', avatarGradient: 'linear-gradient(135deg,#065f46,#059669)', verified: false },
      body: 'Great R:R on this. The AI capex narrative is strong — every major cloud player is guiding up. Hard to bet against NVDA here.',
      createdAt: '22m ago', likes: 31, liked: false,
    },
  ],
  'p2': [
    {
      id: 'c4', userId: 'u1',
      user: { name: 'Alex Kim', handle: '@swingkingAK', initials: 'AK', avatarGradient: 'linear-gradient(135deg,#1d4ed8,#60a5fa)', verified: true },
      body: 'The "uncertainty has increased" language was the tell. Powell is laying the groundwork for June.',
      createdAt: '45m ago', likes: 87, liked: false,
    },
  ],
  'p3': [
    {
      id: 'c5', userId: 'u4',
      user: { name: 'Jamie T.', handle: '@longonlyjt', initials: 'JT', avatarGradient: 'linear-gradient(135deg,#065f46,#059669)', verified: false },
      body: 'The rate cut cycle thesis is compelling but I\'d watch credit spreads closely — they\'re the canary in the coal mine.',
      createdAt: '30m ago', likes: 44, liked: false,
    },
  ],
};

export interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'reply' | 'mention'
  read: boolean
  createdAt: string
  actor: {
    name: string
    handle: string
    initials: string
    avatarGradient: string
    verified: boolean
  }
  post?: {
    id: string
    ticker?: string
    preview: string
  }
  commentPreview?: string
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'like',
    read: false,
    createdAt: '2m ago',
    actor: { name: 'Sara R.', handle: '@macro_sara', initials: 'SR', avatarGradient: 'linear-gradient(135deg,#b45309,#f59e0b)', verified: true },
    post: { id: 'post-1', ticker: 'NVDA', preview: "AI capex cycle isn't slowing — best risk/reward in months" }
  },
  {
    id: 'n2',
    type: 'comment',
    read: false,
    createdAt: '8m ago',
    actor: { name: 'Mike W.', handle: '@optionsmike', initials: 'MW', avatarGradient: 'linear-gradient(135deg,#5b21b6,#7c3aed)', verified: false },
    post: { id: 'post-1', ticker: 'NVDA', preview: "AI capex cycle isn't slowing — best risk/reward in months" },
    commentPreview: 'Implied vol is elevated — worth considering a spread instead'
  },
  {
    id: 'n3',
    type: 'follow',
    read: false,
    createdAt: '15m ago',
    actor: { name: 'Jamie T.', handle: '@longonlyjt', initials: 'JT', avatarGradient: 'linear-gradient(135deg,#065f46,#059669)', verified: false }
  },
  {
    id: 'n4',
    type: 'reply',
    read: false,
    createdAt: '34m ago',
    actor: { name: 'Alex Kim', handle: '@swingkingAK', initials: 'AK', avatarGradient: 'linear-gradient(135deg,#1d4ed8,#60a5fa)', verified: true },
    post: { id: 'post-1', ticker: 'NVDA', preview: "AI capex cycle isn't slowing" },
    commentPreview: 'Exactly — $870 is the line in the sand for me too'
  },
  {
    id: 'n5',
    type: 'mention',
    read: true,
    createdAt: '1h ago',
    actor: { name: 'Sara R.', handle: '@macro_sara', initials: 'SR', avatarGradient: 'linear-gradient(135deg,#b45309,#f59e0b)', verified: true },
    post: { id: 'post-2', preview: 'Fed held — June cut incoming if jobs soften' },
    commentPreview: 'Agree with @jamied on this — the language shift is key'
  },
  {
    id: 'n6',
    type: 'like',
    read: true,
    createdAt: '2h ago',
    actor: { name: 'Kay L.', handle: '@kayltrading', initials: 'KL', avatarGradient: 'linear-gradient(135deg,#0e7490,#22d3ee)', verified: false },
    post: { id: 'post-1', ticker: 'NVDA', preview: "AI capex cycle isn't slowing" }
  },
  {
    id: 'n7',
    type: 'follow',
    read: true,
    createdAt: '3h ago',
    actor: { name: 'Mike W.', handle: '@optionsmike', initials: 'MW', avatarGradient: 'linear-gradient(135deg,#5b21b6,#7c3aed)', verified: false }
  },
  {
    id: 'n8',
    type: 'like',
    read: true,
    createdAt: '5h ago',
    actor: { name: 'Jamie T.', handle: '@longonlyjt', initials: 'JT', avatarGradient: 'linear-gradient(135deg,#065f46,#059669)', verified: false },
    post: { id: 'post-1', ticker: 'NVDA', preview: "AI capex cycle isn't slowing" }
  }
]

// ─── News ────────────────────────────────────────────────────────────────────

export interface NewsArticle {
  id: string
  source: string
  sourceColor: string        // bg color for source badge
  category: string
  categoryType: 'earnings' | 'macro' | 'regulatory' | 'analyst' | 'bullish' | 'bearish' | 'ma' | 'crypto' | 'commodity'
  headline: string
  body: string
  publishedAt: string        // "Today, 09:14 EST · 2h ago"
  tickers: { symbol: string; change: number }[]
  image?: string             // thumbnail URL from news source
  featured?: boolean         // hero article
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'na1',
    source: 'REUTERS',
    sourceColor: '#e05c1a',
    category: 'Earnings · Pre-announcement',
    categoryType: 'earnings',
    headline: "Jensen Huang confirms Blackwell GPU demand is 'staggering' — hyperscaler orders up 3× year-over-year heading into Q2",
    body: "Nvidia CEO Jensen Huang made surprise comments at the GTC developer conference reaffirming that demand for the Blackwell architecture has exceeded all internal projections. Every major hyperscaler — Microsoft, Google, Amazon, and Meta — guided capex upward last earnings cycle, and Huang indicated order volumes reflect continued acceleration rather than any sign of plateau.",
    publishedAt: 'Today, 09:14 EST · 2h ago',
    tickers: [
      { symbol: 'NVDA', change: 3.17 },
      { symbol: 'AMD',  change: 1.88 },
      { symbol: 'MSFT', change: -0.31 },
      { symbol: 'META', change: 2.22 },
    ],
    featured: true,
  },
  {
    id: 'na2',
    source: 'NHTSA',
    sourceColor: '#dc2626',
    category: 'Regulatory',
    categoryType: 'regulatory',
    headline: 'Tesla faces NHTSA probe into FSD software — potential recall of 280,000 vehicles',
    body: 'Federal regulators opened a preliminary investigation following 23 reported incidents. A formal recall notice could follow within 60 days.',
    publishedAt: '08:31 EST',
    tickers: [
      { symbol: 'TSLA', change: -4.16 },
    ],
  },
  {
    id: 'na3',
    source: 'WSJ',
    sourceColor: '#1d4ed8',
    category: 'Ad Tech',
    categoryType: 'bullish',
    headline: "Meta's AI ad targeting lifts click-through rates 34% — budgets shifting away from Google",
    body: 'New survey data from 400 advertisers shows Meta\'s Advantage+ platform now outperforms Google Display in conversion efficiency for the first time.',
    publishedAt: '08:31 EST',
    tickers: [
      { symbol: 'META',  change: 2.22 },
      { symbol: 'GOOGL', change: -1.05 },
    ],
  },
  {
    id: 'na4',
    source: 'FED',
    sourceColor: '#0e7490',
    category: 'Macro',
    categoryType: 'macro',
    headline: 'Fed minutes signal rates on hold through H1 — no cuts expected before September 2026',
    body: '',
    publishedAt: '08:30 EST',
    tickers: [
      { symbol: 'SPY', change: -0.48 },
      { symbol: 'TLT', change: 0.92 },
    ],
  },
  {
    id: 'na5',
    source: 'BLOOMBERG',
    sourceColor: '#374151',
    category: 'Analyst',
    categoryType: 'analyst',
    headline: 'Goldman Sachs raises AAPL target to $240 — services revenue seen accelerating through fiscal year 2026',
    body: '',
    publishedAt: '07:58 EST',
    tickers: [
      { symbol: 'AAPL', change: 0.59 },
    ],
  },
  {
    id: 'na6',
    source: 'CNBC',
    sourceColor: '#b45309',
    category: 'Earnings',
    categoryType: 'earnings',
    headline: 'AMD MI300X shipments ahead of schedule — data center GPU segment to exceed $8B in 2026 guidance',
    body: '',
    publishedAt: '07:22 EST',
    tickers: [
      { symbol: 'AMD', change: 1.88 },
    ],
  },
  {
    id: 'na7',
    source: 'FT',
    sourceColor: '#9d174d',
    category: 'Macro',
    categoryType: 'regulatory',
    headline: 'EU proposes new digital market levies on US tech giants — potential €4B annual impact across sector',
    body: '',
    publishedAt: '06:47 EST',
    tickers: [
      { symbol: 'MSFT',  change: -0.31 },
      { symbol: 'GOOGL', change: -1.05 },
      { symbol: 'META',  change: 2.22 },
    ],
  },
]

export const TOP_MOVERS = [
  { ticker: 'NVDA', name: 'Nvidia',  stories: 6, price: 882.60, change: 3.17,  up: true,  spark: '0,20 10,18 20,14 30,10 40,6 50,2' },
  { ticker: 'TSLA', name: 'Tesla',   stories: 4, price: 172.00, change: -4.16, up: false, spark: '0,2  10,6  20,10 30,16 40,22 50,28' },
  { ticker: 'META', name: 'Meta',    stories: 3, price: 485.00, change: 2.22,  up: true,  spark: '0,22 10,18 20,14 30,10 40,6 50,2' },
  { ticker: 'AMD',  name: 'AMD',     stories: 2, price: 162.50, change: 1.88,  up: true,  spark: '0,20 10,16 20,12 30,8 40,5 50,2' },
]

export const SECTOR_HEAT = [
  { name: 'Tech',     change: 1.84,  up: true  },
  { name: 'AI/Semi',  change: 2.53,  up: true  },
  { name: 'EV',       change: -3.12, up: false },
  { name: 'Bonds',    change: -0.22, up: false },
  { name: 'Ad Tech',  change: 1.67,  up: true  },
  { name: 'Energy',   change: 0.08,  up: true  },
]

export const ECONOMIC_CALENDAR = [
  { event: 'NFP Jobs Report',  date: 'Fri Apr 3 · 08:30',  prev: '151k', est: '',      impact: 'high' as const },
  { event: 'CPI Inflation',    date: 'Wed Apr 9 · 08:30',  prev: '3.1%', est: '',      impact: 'high' as const },
  { event: 'GDP Report',       date: 'Thu Apr 24 · 08:30', prev: '2.8%', est: '',      impact: 'med'  as const },
  { event: 'NVDA Earnings',    date: 'Thu May 22 · after close', prev: '', est: '$0.88', impact: 'high' as const },
]
