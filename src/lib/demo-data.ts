// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  username: string;
  initials: string;
  avatarColor: string;
  verified: boolean;
  bio: string;
  followersCount: number;
  followingCount: number;
  returnYTD: number;
  winRate: number;
  tradesCount: number;
}

interface BasePost {
  id: string;
  user: User;
  ticker: string;
  thesis: string;
  tags: string[];
  likes: number;
  comments: number;
  shares_count: number;
  time: string;
  hasChart: boolean;
  tvSymbol: string;
}

export interface TradePost extends BasePost {
  postType: 'trade';
  direction: 'BUY' | 'SELL' | 'SHORT';
  entry: number;
  target: number;
  stop: number;
  rrRatio: string;
  strategy: 'Swing' | 'Momentum' | 'Scalp' | 'Options';
  timeframe: 'Daily' | '4H' | 'Weekly' | '1H';
  status: 'OPEN' | 'WIN' | 'LOSS';
  whyNow: string;
  risk: string;
  invalidation: string;
}

export interface InvestmentPost extends BasePost {
  postType: 'investment';
  conviction: 'High' | 'Medium' | 'Speculative';
  horizon: string;
  catalyst: string;
  valuation: string;
  sector: string;
  status: 'HOLDING' | 'SOLD' | 'WATCHING';
  addedAt: string;
  whyNow: string;
  risk: string;
}

export type Post = TradePost | InvestmentPost;

export interface WatchlistItem {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  sparkline: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  returnYTD: number;
  tradesCount: number;
  investmentsCount: number;
}

export interface TrendingTicker {
  ticker: string;
  price: number;
  changePct: number;
  postCount: number;
}

// ─── Users ────────────────────────────────────────────────────────────────────

const alexKim: User = {
  id: "u1",
  name: "Alex Kim",
  username: "swingkingAK",
  initials: "AK",
  avatarColor: "from-blue-500 to-indigo-600",
  verified: true,
  bio: "Swing trader. 8 years in the market. Tech & semis focus.",
  followersCount: 12400,
  followingCount: 344,
  returnYTD: 61.2,
  winRate: 74,
  tradesCount: 218,
};

const saraR: User = {
  id: "u2",
  name: "Sara R.",
  username: "macro_sara",
  initials: "SR",
  avatarColor: "from-violet-500 to-purple-600",
  verified: true,
  bio: "Macro-driven equity trader. Long-term perspective.",
  followersCount: 8310,
  followingCount: 201,
  returnYTD: 44.7,
  winRate: 68,
  tradesCount: 134,
};

const mikeW: User = {
  id: "u3",
  name: "Mike W.",
  username: "optionsmike",
  initials: "MW",
  avatarColor: "from-emerald-500 to-teal-600",
  verified: false,
  bio: "Options flow reader. Gamma exposure is everything.",
  followersCount: 5920,
  followingCount: 489,
  returnYTD: 38.1,
  winRate: 71,
  tradesCount: 307,
};

const jamieT: User = {
  id: "u4",
  name: "Jamie T.",
  username: "longonlyjt",
  initials: "JT",
  avatarColor: "from-orange-500 to-amber-600",
  verified: false,
  bio: "Long only. Fundamental value investor with a growth lens.",
  followersCount: 3140,
  followingCount: 612,
  returnYTD: 29.3,
  winRate: 63,
  tradesCount: 89,
};

const currentUser: User = {
  id: "u0",
  name: "Jamie D.",
  username: "jamied",
  initials: "JD",
  avatarColor: "from-rose-500 to-pink-600",
  verified: false,
  bio: "Learning the markets one trade at a time.",
  followersCount: 142,
  followingCount: 48,
  returnYTD: 12.4,
  winRate: 55,
  tradesCount: 31,
};

export const DEMO_USERS = { alexKim, saraR, mikeW, jamieT, currentUser };

// ─── Posts ────────────────────────────────────────────────────────────────────

export const DEMO_TRADES: Post[] = [
  {
    id: "t1",
    postType: "trade",
    user: alexKim,
    ticker: "NVDA",
    tvSymbol: "NASDAQ:NVDA",
    thesis:
      "Blackwell ramp accelerating into Q2. Every hyperscaler guided up last cycle. AI capex isn't slowing — it's inflecting. This pre-earnings dip is a gift. Risk/reward is the best I've seen in months.",
    tags: ["#AI", "#Semiconductors", "#Earnings"],
    likes: 284,
    comments: 47,
    shares_count: 91,
    time: "12m ago",
    hasChart: true,
    direction: "BUY",
    entry: 882.60,
    target: 940,
    stop: 860,
    rrRatio: "3.1×",
    strategy: "Momentum",
    timeframe: "Daily",
    status: "WIN",
    whyNow: "Pre-earnings RSI reset off 50-day — textbook momentum entry",
    risk: "Guidance miss could break the $860 support level",
    invalidation: "Daily close below $860 on above-average volume",
  },
  {
    id: "t2",
    postType: "trade",
    user: saraR,
    ticker: "TSLA",
    tvSymbol: "NASDAQ:TSLA",
    thesis:
      "Sentiment has gotten too bearish. Yes, deliveries missed — but margin stabilization is showing early signs and the Cybertruck ramp is underestimated. Contrarian long with defined risk.",
    tags: ["#Contrarian", "#EV", "#ValuePlay"],
    likes: 156,
    comments: 38,
    shares_count: 22,
    time: "38m ago",
    hasChart: true,
    direction: "BUY",
    entry: 172,
    target: 195,
    stop: 165,
    rrRatio: "3.3×",
    strategy: "Swing",
    timeframe: "Daily",
    status: "OPEN",
    whyNow: "Extreme bearish sentiment + insider buying signals visible",
    risk: "Deliveries continue declining, macro headwinds intensify",
    invalidation: "Weekly close below $155 negates the thesis",
  },
  {
    id: "t3",
    postType: "investment",
    user: mikeW,
    ticker: "SPY",
    tvSymbol: "AMEX:SPY",
    thesis:
      "Fed rate cut cycle just beginning. Equities historically return 18%+ in the 12 months following the first cut. Adding SPY here as a core position — this is a multi-year macro tailwind, not a trade.",
    tags: ["#MacroInvesting", "#Equities", "#RateCuts"],
    likes: 312,
    comments: 64,
    shares_count: 88,
    time: "1h ago",
    hasChart: true,
    conviction: "High",
    horizon: "2-3 years",
    catalyst: "Fed rate cut cycle beginning, historically bullish for equities",
    valuation: "S&P at 21× forward earnings — fair given falling rates environment",
    sector: "Broad Market",
    status: "HOLDING",
    addedAt: "$512.50",
    whyNow: "Rate cut cycle + earnings growth reaccelerating in 2026",
    risk: "Recession materialises faster than expected, earnings disappoint",
  },
  {
    id: "t4",
    postType: "investment",
    user: jamieT,
    ticker: "META",
    tvSymbol: "NASDAQ:META",
    thesis:
      "Threads monetisation barely started. Reality Labs losses narrowing. Ad revenue accelerating. This is the most undervalued mega-cap on a forward PE basis — adding on any weakness.",
    tags: ["#Advertising", "#SocialMedia", "#Growth"],
    likes: 203,
    comments: 71,
    shares_count: 55,
    time: "2h ago",
    hasChart: true,
    conviction: "High",
    horizon: "12-18 months",
    catalyst: "Threads monetisation + Reels ad load still ramping",
    valuation: "22× forward earnings for a 20%+ EPS grower — significant discount to peers",
    sector: "Technology",
    status: "HOLDING",
    addedAt: "$485.00",
    whyNow: "Ad revenue reaccelerating, AI-driven feed improvements showing in metrics",
    risk: "Regulatory pressure on data privacy across EU and US",
  },
];

// ─── Watchlist ────────────────────────────────────────────────────────────────

export const DEMO_WATCHLIST: WatchlistItem[] = [
  { ticker: "NVDA", price: 135.72, change: 4.18,  changePct:  3.17, sparkline: "0,28 8,22 16,26 24,18 32,10 40,14 48,8 56,4 64,2" },
  { ticker: "TSLA", price: 194.30, change: -8.42, changePct: -4.16, sparkline: "0,4 8,8 16,6 24,12 32,18 40,16 48,22 56,26 64,30" },
  { ticker: "SPY",  price: 524.38, change: -2.11, changePct: -0.40, sparkline: "0,12 8,10 16,14 24,12 32,16 40,14 48,18 56,16 64,20" },
  { ticker: "AAPL", price: 211.45, change: 1.23,  changePct:  0.59, sparkline: "0,20 8,18 16,16 24,14 32,12 40,10 48,8 56,6 64,4" },
  { ticker: "META", price: 578.90, change: 12.60, changePct:  2.22, sparkline: "0,28 8,24 16,20 24,16 32,12 40,8 48,6 56,4 64,2" },
];

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: alexKim, returnYTD: 61.2, tradesCount: 218, investmentsCount: 12 },
  { rank: 2, user: saraR,   returnYTD: 44.7, tradesCount: 134, investmentsCount:  8 },
  { rank: 3, user: mikeW,   returnYTD: 38.1, tradesCount: 307, investmentsCount:  3 },
  { rank: 4, user: jamieT,  returnYTD: 29.3, tradesCount:  89, investmentsCount: 45 },
];

// ─── Trending ─────────────────────────────────────────────────────────────────

export const DEMO_TRENDING: TrendingTicker[] = [
  { ticker: "NVDA", price: 135.72, changePct:  3.17, postCount: 1420 },
  { ticker: "SPY",  price: 524.38, changePct: -0.40, postCount:  980 },
  { ticker: "TSLA", price: 194.30, changePct: -4.16, postCount:  874 },
  { ticker: "META", price: 578.90, changePct:  2.22, postCount:  611 },
  { ticker: "AAPL", price: 211.45, changePct:  0.59, postCount:  503 },
  { ticker: "AMD",  price: 162.80, changePct:  1.88, postCount:  389 },
];

// ─── Suggested ────────────────────────────────────────────────────────────────

const kayL: User = {
  id: "u5",
  name: "Kay L.",
  username: "kayltrading",
  initials: "KL",
  avatarColor: "from-cyan-500 to-sky-600",
  verified: false,
  bio: "Quantitative strategies + momentum signals.",
  followersCount: 2210,
  followingCount: 330,
  returnYTD: 33.5,
  winRate: 67,
  tradesCount: 155,
};

export const DEMO_SUGGESTED: User[] = [alexKim, saraR, kayL];
