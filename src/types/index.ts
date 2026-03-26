// ── Enums / Unions ────────────────────────────────────────────────────────────

export type Direction  = 'BUY' | 'SELL' | 'SHORT';
export type Conviction = 'High' | 'Medium' | 'Speculative';

// ── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  username: string;
  initials: string;
  avatarGradient: [string, string];
  verified: boolean;
  bio: string;
  followersCount: number;
  followingCount: number;
  tradesCount: number;
  investmentsCount?: number;
  coverColor?: string;
  mostActive: string;
  isPrivate?: boolean;
  hasSentFollowRequest?: boolean;
}

// ── Posts ─────────────────────────────────────────────────────────────────────

interface BasePost {
  id: string;
  user: User;
  createdAt: string;
  body: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
}

export interface TradePost extends BasePost {
  postType: 'trade';
  ticker: string;
  tvSymbol: string;
  direction: Direction;
  strategy: string;
  timeframe: string;
  entry: number;
  target: number;
  stop: number;
  rrRatio: string;
  isOpen: boolean;
  whyNow: string;
  risk: string;
  invalidation: string;
}

export interface InvestmentPost extends BasePost {
  postType: 'investment';
  ticker: string;
  conviction: Conviction;
  horizon: string;
  addedAt: string;
  sector: string;
  isOpen: boolean;
  catalyst: string;
  valuation: string;
  risk: string;
}

export interface CommentaryPost extends BasePost {
  postType: 'commentary';
  ticker?: string;
  newsEvent: string;
  newsDate: string;
}

export type Post = TradePost | InvestmentPost | CommentaryPost;

// ── Supporting data ───────────────────────────────────────────────────────────

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
  followersCount: number;
}

export interface TrendingTicker {
  ticker: string;
  change: string;
  changeNum: number;
  up: boolean;
  posts: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  user: User;
  content: string;
  time: string;
  read: boolean;
}
