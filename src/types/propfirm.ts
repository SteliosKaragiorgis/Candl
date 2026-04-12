export type PropFirm = 'FTMO' | 'TFT' | 'MFF' | 'TFF' | 'Apex' | 'E8' | 'FundedNext' | 'Other';

export type ChallengePhase = 1 | 2 | 3;

export type ChallengeStatus = 'active' | 'near_limit' | 'passed' | 'failed';

export type RuleStatus = 'safe' | 'warning' | 'breached';

export type RuleType =
  | 'profit_target'
  | 'daily_loss'
  | 'total_drawdown'
  | 'min_trading_days'
  | 'news_trading'
  | 'weekend_holding';

export type Rule = {
  name: string;
  type: RuleType;
  limit: number;
  used: number;
  status: RuleStatus;
};

export type TradingDay = {
  date: string;   // YYYY-MM-DD
  result: 'win' | 'loss' | 'breakeven' | 'no_trade';
  pnl: number;
};

// ─── Trade store ──────────────────────────────────────────────────────────────

export type TradeEntry = {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  pnl: number;
  date: string; // YYYY-MM-DD
  lotSize?: number;
  setupType?: string;
  notes?: string;
};

// ─── Community types ─────────────────────────────────────────────────────────

export type PostType = 'milestone' | 'progress' | 'failure';

export type CommunityPostUser = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  avatarColor: string;
};

export type CommunityPost = {
  id: string;
  type: PostType;
  user: CommunityPostUser;
  firm: PropFirm;
  accountSize: number;
  phase: ChallengePhase;
  dayNumber: number;
  narrative: string;
  lesson?: string;
  improvement?: string;
  stats: {
    pnl: number;
    pnlPercent: number;
    winRate: number;
    avgRR: number;
    daysUsed: number;
  };
  rules?: Rule[];
  likes: number;
  comments: number;
  createdAt: string;
  isVerified: boolean;
};

export type Tip = {
  id: string;
  category: 'risk' | 'psychology' | 'news' | 'entry' | 'compliance';
  text: string;
  author: string;
  authorFirm: PropFirm;
  authorResult: string;
  likes: number;
  isVerified: boolean;
};

export type FirmStats = {
  firm: PropFirm;
  accountSize: number;
  passRate: number;
  attempts: number;
  avgDays: number;
  avgPnlOnPass: number;
  topMistake: string;
  topSetup: string;
};

export type LeaderboardTrader = {
  id: string;
  name: string;
  handle: string;
  avatarColor: string;
  firm: PropFirm;
  accountSize: number;
  phase: ChallengePhase;
  pnlPercent: number;
  winRate: number;
  avgRR: number;
  days: number;
  status: 'passed' | 'active' | 'failed';
  rulesClean: number; // 0–1
};

export type Challenge = {
  id: string;
  firm: PropFirm;
  account_size: number;
  phase: ChallengePhase;
  status: ChallengeStatus;
  start_date: string;   // YYYY-MM-DD
  end_date: string;     // YYYY-MM-DD
  days_remaining: number;
  starting_balance: number;
  current_balance: number;
  total_pnl: number;
  rules: Rule[];
  trading_days: TradingDay[];
  trade_ids: string[];  // Trade IDs applied to this challenge
  mt5_account?: string;
  created_at: string;
  // Optional fields — new additions; kept optional for backward compat with
  // existing localStorage data that predates these fields.
  trades?: TradeEntry[];
  peak_balance?: number;
  auto_apply_trades?: boolean;
};
