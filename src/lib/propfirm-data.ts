import type {
  CommunityPost,
  Tip,
  FirmStats,
  LeaderboardTrader,
} from '../types/propfirm';

// ─── Community posts ──────────────────────────────────────────────────────────

export const COMMUNITY_POSTS: CommunityPost[] = [
  // Milestone: passed Phase 1
  {
    id: 'cp1',
    type: 'milestone',
    user: { id: 'u1', name: 'Alex Kim', handle: 'swingkingAK', avatar: 'AK', avatarColor: '#1a3a5c' },
    firm: 'FTMO',
    accountSize: 100000,
    phase: 1,
    dayNumber: 22,
    narrative:
      'Took my time on this one. No revenge trading, no chasing. Stuck to London session breakouts exclusively and let the trades come to me. The discipline required is unlike regular trading — knowing you have to protect the account at all costs changes your psychology completely.',
    lesson: 'Consistency beats conviction in prop challenges. I left plenty on the table but never touched the daily loss limit once.',
    stats: { pnl: 10820, pnlPercent: 10.82, winRate: 72, avgRR: 2.1, daysUsed: 22 },
    likes: 84,
    comments: 31,
    createdAt: '2026-04-09T09:00:00.000Z',
    isVerified: true,
  },
  // Milestone: passed Phase 2 → Funded
  {
    id: 'cp2',
    type: 'milestone',
    user: { id: 'u5', name: 'Kay L.', handle: 'kayltrader', avatar: 'KL', avatarColor: '#1a3a22' },
    firm: 'E8',
    accountSize: 100000,
    phase: 2,
    dayNumber: 16,
    narrative:
      'Phase 2 was actually easier than Phase 1 for me because my process was locked in. Same 3 setups, same session, same risk. Got funded after 16 days with the target hit at 5.4%. Never felt rushed.',
    lesson: 'Once your system is tested in Phase 1, Phase 2 is just execution. Don\'t change a thing.',
    stats: { pnl: 5400, pnlPercent: 5.4, winRate: 69, avgRR: 1.9, daysUsed: 16 },
    likes: 112,
    comments: 44,
    createdAt: '2026-04-11T08:00:00.000Z',
    isVerified: true,
  },
  // Progress: FTMO Phase 1 day 8
  {
    id: 'cp3',
    type: 'progress',
    user: { id: 'u2', name: 'Sara R.', handle: 'macro_sara', avatar: 'SR', avatarColor: '#2d1a5c' },
    firm: 'FTMO',
    accountSize: 50000,
    phase: 1,
    dayNumber: 8,
    narrative:
      'Solid week. Two losing days but both were small — well within daily limit. Sticking to EURUSD only. The focus is paying off.',
    lesson: 'Narrowing my pairs from 4 down to 1 cut my bad trades by half.',
    stats: { pnl: 1820, pnlPercent: 3.64, winRate: 65, avgRR: 1.7, daysUsed: 8 },
    rules: [
      { name: 'Profit target', type: 'profit_target', limit: 5000, used: 1820, status: 'safe' },
      { name: 'Daily loss', type: 'daily_loss', limit: 500, used: 180, status: 'safe' },
      { name: 'Total drawdown', type: 'total_drawdown', limit: 2500, used: 410, status: 'safe' },
      { name: 'Min trading days', type: 'min_trading_days', limit: 4, used: 8, status: 'safe' },
    ],
    likes: 37,
    comments: 14,
    createdAt: '2026-04-12T07:00:00.000Z',
    isVerified: false,
  },
  // Progress: Apex Phase 1 day 14, near warning
  {
    id: 'cp4',
    type: 'progress',
    user: { id: 'u6', name: 'Chris M.', handle: 'chrism_fx', avatar: 'CM', avatarColor: '#3a2200' },
    firm: 'Apex',
    accountSize: 50000,
    phase: 1,
    dayNumber: 14,
    narrative:
      'Rough day yesterday — hit 70% of daily loss in one bad trade. Went flat for the rest of the session. Back on track today with a small win to recover some confidence.',
    lesson: 'After a bad trade, close the platform. Coming back the same day to \'make it back\' has never worked for me.',
    stats: { pnl: 1240, pnlPercent: 2.48, winRate: 54, avgRR: 1.4, daysUsed: 14 },
    rules: [
      { name: 'Profit target', type: 'profit_target', limit: 3000, used: 1240, status: 'safe' },
      { name: 'Daily loss', type: 'daily_loss', limit: 1000, used: 0, status: 'safe' },
      { name: 'Total drawdown', type: 'total_drawdown', limit: 2000, used: 890, status: 'warning' },
      { name: 'Min trading days', type: 'min_trading_days', limit: 5, used: 14, status: 'safe' },
    ],
    likes: 22,
    comments: 9,
    createdAt: '2026-04-12T00:00:00.000Z',
    isVerified: false,
  },
  // Progress: TFT Phase 2 day 5
  {
    id: 'cp5',
    type: 'progress',
    user: { id: 'u4', name: 'Jamie T.', handle: 'longonlyjt', avatar: 'JT', avatarColor: '#2d1a5c' },
    firm: 'TFT',
    accountSize: 100000,
    phase: 2,
    dayNumber: 5,
    narrative:
      'Day 5 of Phase 2. Up 2.1% already. Keeping risk light — 0.3% per trade. If I keep this up I should hit target around day 12.',
    lesson: 'Lower risk than you think you need. Phase 2 is about not messing up Phase 1\'s work.',
    stats: { pnl: 2100, pnlPercent: 2.1, winRate: 70, avgRR: 2.0, daysUsed: 5 },
    rules: [
      { name: 'Profit target', type: 'profit_target', limit: 5000, used: 2100, status: 'safe' },
      { name: 'Daily loss', type: 'daily_loss', limit: 500, used: 90, status: 'safe' },
      { name: 'Total drawdown', type: 'total_drawdown', limit: 4000, used: 320, status: 'safe' },
      { name: 'Min trading days', type: 'min_trading_days', limit: 5, used: 5, status: 'safe' },
    ],
    likes: 29,
    comments: 7,
    createdAt: '2026-04-10T12:00:00.000Z',
    isVerified: true,
  },
  // Failure post 1
  {
    id: 'cp6',
    type: 'failure',
    user: { id: 'u3', name: 'Mike W.', handle: 'optionsmike', avatar: 'MW', avatarColor: '#1a3a22' },
    firm: 'FTMO',
    accountSize: 100000,
    phase: 1,
    dayNumber: 11,
    narrative:
      'Breached daily loss on day 11 after NFP. I knew there was news at 1:30 PM and I had a trade on from the morning session. Didn\'t close it. The spread spike took out my stop and then some, hitting 4.2% drawdown in 3 minutes. Account flagged, challenge failed.',
    improvement: 'No exceptions to the news rule. I\'ve said it to others — I should have listened. From now on, all positions are closed 30 minutes before any red news event, regardless of how good the trade looks.',
    stats: { pnl: -4250, pnlPercent: -4.25, winRate: 61, avgRR: 1.8, daysUsed: 11 },
    likes: 147,
    comments: 63,
    createdAt: '2026-04-11T14:00:00.000Z',
    isVerified: false,
  },
  // Failure post 2
  {
    id: 'cp7',
    type: 'failure',
    user: { id: 'u7', name: 'Ryan C.', handle: 'ryanc_trades', avatar: 'RC', avatarColor: '#1f0d0d' },
    firm: 'Apex',
    accountSize: 50000,
    phase: 1,
    dayNumber: 6,
    narrative:
      'Lost my third challenge in a row, all with the same mistake — revenge trading after the first bad day. Day 5 I was down 1.8%, still under daily limit, but I came back after lunch and doubled my risk trying to recover. Finished the day at -3.8%. Challenge over.',
    improvement: 'After any losing session, no more trading until the next calendar day. This is a rule I\'m enforcing in my prop challenge plan going forward. The pattern is clear in my journal.',
    stats: { pnl: -1900, pnlPercent: -3.8, winRate: 43, avgRR: 1.1, daysUsed: 6 },
    likes: 98,
    comments: 41,
    createdAt: '2026-04-09T10:00:00.000Z',
    isVerified: false,
  },
  // Funded announcement
  {
    id: 'cp8',
    type: 'milestone',
    user: { id: 'u8', name: 'Priya V.', handle: 'priyav_fx', avatar: 'PV', avatarColor: '#2d2d5c' },
    firm: 'FundedNext',
    accountSize: 100000,
    phase: 3,
    dayNumber: 19,
    narrative:
      'Just got the funded account confirmation. 38 days from starting Phase 1 to funded. This is what I\'ve been working toward for 14 months. The process worked — journal every trade, stick to the plan, protect the account first. No shortcuts.',
    lesson: 'The prop challenge doesn\'t test your trading — it tests your discipline. Those are different things.',
    stats: { pnl: 15200, pnlPercent: 8.2, winRate: 74, avgRR: 2.3, daysUsed: 19 },
    likes: 231,
    comments: 87,
    createdAt: '2026-04-12T06:00:00.000Z',
    isVerified: true,
  },
];

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export type LeaderboardTraderWithDate = LeaderboardTrader & { joinedDate: string };

export const LEADERBOARD_TRADERS: LeaderboardTraderWithDate[] = [
  { id: 'lt1', name: 'Alex Kim', handle: 'swingkingAK', avatarColor: '#1a3a5c', firm: 'FTMO', accountSize: 100000, phase: 1, pnlPercent: 10.82, winRate: 72, avgRR: 2.1, days: 22, status: 'passed', rulesClean: 1.0, joinedDate: '2026-04-09T09:00:00.000Z' },
  { id: 'lt2', name: 'Kay L.', handle: 'kayltrader', avatarColor: '#1a3a22', firm: 'E8', accountSize: 100000, phase: 2, pnlPercent: 5.4, winRate: 69, avgRR: 1.9, days: 16, status: 'passed', rulesClean: 1.0, joinedDate: '2026-04-11T08:00:00.000Z' },
  { id: 'lt3', name: 'Priya V.', handle: 'priyav_fx', avatarColor: '#2d2d5c', firm: 'FundedNext', accountSize: 100000, phase: 3, pnlPercent: 8.2, winRate: 74, avgRR: 2.3, days: 19, status: 'passed', rulesClean: 1.0, joinedDate: '2026-04-12T06:00:00.000Z' },
  { id: 'lt4', name: 'Sara R.', handle: 'macro_sara', avatarColor: '#2d1a5c', firm: 'FTMO', accountSize: 50000, phase: 1, pnlPercent: 3.64, winRate: 65, avgRR: 1.7, days: 8, status: 'active', rulesClean: 0.95, joinedDate: '2026-04-12T07:00:00.000Z' },
  { id: 'lt5', name: 'Jamie T.', handle: 'longonlyjt', avatarColor: '#2d1a5c', firm: 'TFT', accountSize: 100000, phase: 2, pnlPercent: 2.1, winRate: 70, avgRR: 2.0, days: 5, status: 'active', rulesClean: 1.0, joinedDate: '2026-04-10T12:00:00.000Z' },
  { id: 'lt6', name: 'Chris M.', handle: 'chrism_fx', avatarColor: '#3a2200', firm: 'Apex', accountSize: 50000, phase: 1, pnlPercent: 2.48, winRate: 54, avgRR: 1.4, days: 14, status: 'active', rulesClean: 0.8, joinedDate: '2026-03-29T08:00:00.000Z' },
  { id: 'lt7', name: 'Mike W.', handle: 'optionsmike', avatarColor: '#1a3a22', firm: 'FTMO', accountSize: 100000, phase: 1, pnlPercent: -4.25, winRate: 61, avgRR: 1.8, days: 11, status: 'failed', rulesClean: 0.6, joinedDate: '2026-04-11T14:00:00.000Z' },
  { id: 'lt8', name: 'Ryan C.', handle: 'ryanc_trades', avatarColor: '#1f0d0d', firm: 'Apex', accountSize: 50000, phase: 1, pnlPercent: -3.8, winRate: 43, avgRR: 1.1, days: 6, status: 'failed', rulesClean: 0.4, joinedDate: '2026-03-10T10:00:00.000Z' },
];

// ─── Firm stats ───────────────────────────────────────────────────────────────

export const FIRM_STATS: FirmStats[] = [
  { firm: 'FTMO', accountSize: 100000, passRate: 34, attempts: 847, avgDays: 22, avgPnlOnPass: 10.4, topMistake: 'Breach daily loss after news', topSetup: 'London session breakout' },
  { firm: 'FTMO', accountSize: 50000, passRate: 38, attempts: 612, avgDays: 19, avgPnlOnPass: 10.8, topMistake: 'Overtrading after drawdown', topSetup: '4H trend continuation' },
  { firm: 'TFT', accountSize: 100000, passRate: 41, attempts: 394, avgDays: 18, avgPnlOnPass: 9.2, topMistake: 'Holding over weekend', topSetup: 'New York open momentum' },
  { firm: 'TFT', accountSize: 50000, passRate: 44, attempts: 287, avgDays: 16, avgPnlOnPass: 9.7, topMistake: 'Averaging into losing trades', topSetup: 'EURUSD FVG entries' },
  { firm: 'Apex', accountSize: 50000, passRate: 28, attempts: 521, avgDays: 21, avgPnlOnPass: 7.8, topMistake: 'Revenge trading after daily loss', topSetup: 'Futures open range breakout' },
  { firm: 'E8', accountSize: 100000, passRate: 31, attempts: 203, avgDays: 20, avgPnlOnPass: 8.6, topMistake: 'News trading violation', topSetup: 'H1 structure + M15 entry' },
];

// ─── Tips ─────────────────────────────────────────────────────────────────────

export const TIPS: Tip[] = [
  { id: 't1', category: 'risk', text: 'Never risk more than 0.5% per trade in Phase 1. The challenge is about consistency, not catching a big winner.', author: 'Alex K.', authorFirm: 'FTMO', authorResult: '$100k passed', likes: 214, isVerified: true },
  { id: 't2', category: 'psychology', text: 'After hitting daily target, close the platform. The hardest part of a challenge is knowing when to stop.', author: 'Jamie T.', authorFirm: 'Apex', authorResult: '$50k passed', likes: 187, isVerified: true },
  { id: 't3', category: 'news', text: 'Close everything 30 min before high-impact news. One spread spike can blow your daily limit in seconds.', author: 'Sara R.', authorFirm: 'FTMO', authorResult: '$50k Phase 2', likes: 163, isVerified: false },
  { id: 't4', category: 'compliance', text: 'Set a phone alarm for 30 min before every red news event. Non-negotiable rule.', author: 'Mike K.', authorFirm: 'TFT', authorResult: '$100k passed', likes: 142, isVerified: true },
  { id: 't5', category: 'entry', text: 'Only trade your A+ setups. Every B-grade trade in a challenge is a risk you don\'t need to take.', author: 'Kay L.', authorFirm: 'E8', authorResult: '$100k passed', likes: 131, isVerified: true },
  { id: 't6', category: 'psychology', text: 'Treat the challenge like you\'re already funded. The moment you try to catch up, you blow it.', author: 'Alex K.', authorFirm: 'FTMO', authorResult: '$100k passed', likes: 119, isVerified: true },
  { id: 't7', category: 'risk', text: 'Calculate your max daily loss in pips before the session. Know exactly when you\'ll stop before you start.', author: 'Chris M.', authorFirm: 'Apex', authorResult: '$100k passed', likes: 98, isVerified: true },
  { id: 't8', category: 'compliance', text: 'Screenshot your account at session start and end every day. Proof of compliance in case of disputes.', author: 'Sara R.', authorFirm: 'FTMO', authorResult: '$50k Phase 2', likes: 76, isVerified: false },
];

// ─── Firm display info (#18 supplement) ──────────────────────────────────────

export const FIRM_DISPLAY_INFO: Record<string, {
  fullName: string;
  website: string;
  description: string;
  color: string;
}> = {
  FTMO: {
    fullName: 'FTMO',
    website: 'https://ftmo.com',
    description: 'Prague-based prop firm offering two-phase challenges with up to $200k funding. Known for strict rules and reliable payouts.',
    color: '#1a56db',
  },
  TFT: {
    fullName: 'The Funded Trader',
    website: 'https://thefundedtrader.com',
    description: 'US-based prop firm with multiple challenge tracks including Standard, Rapid, and Royal. Flexible scaling plan up to $1.5M.',
    color: '#7c3aed',
  },
  Apex: {
    fullName: 'Apex Trader Funding',
    website: 'https://apextraderfunding.com',
    description: 'Futures-focused prop firm with one-phase evaluations. Popular for its straightforward rules and frequent promotions.',
    color: '#d97706',
  },
  E8: {
    fullName: 'E8 Funding',
    website: 'https://e8funding.com',
    description: 'Two-phase prop firm with an 8% profit target and a strong emphasis on risk management and trader education.',
    color: '#059669',
  },
  FundedNext: {
    fullName: 'FundedNext',
    website: 'https://fundednext.com',
    description: 'Dubai-based prop firm offering Stellar and Express challenges. Unique profit-share model starting from evaluation phase.',
    color: '#0ea5e9',
  },
  MFF: {
    fullName: 'MyForexFunds',
    website: 'https://myforexfunds.com',
    description: 'Canadian prop firm formerly one of the largest in the industry. Offered Rapid, Accelerated, and Experienced programs.',
    color: '#e11d48',
  },
  TFF: {
    fullName: 'True Forex Funds',
    website: 'https://trueforexfunds.com',
    description: 'European prop firm offering one and two-phase challenges with competitive profit splits and a scaling plan.',
    color: '#f59e0b',
  },
};

// ─── Demo comments (seed data for #19) ───────────────────────────────────────

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userHandle: string;
  text: string;
  createdAt: string;
  likes: number;
};

export const DEMO_COMMENTS: Comment[] = [
  {
    id: 'dc1',
    postId: 'cp1',
    userId: 'u5',
    userName: 'Kay L.',
    userHandle: 'kayltrader',
    text: 'London breakouts are so consistent on FTMO. What pairs were you trading?',
    createdAt: '2026-04-09T10:30:00.000Z',
    likes: 12,
  },
  {
    id: 'dc2',
    postId: 'cp1',
    userId: 'u2',
    userName: 'Sara R.',
    userHandle: 'macro_sara',
    text: 'That psychology point about protecting the account changing everything is real. Congrats on the pass.',
    createdAt: '2026-04-09T11:15:00.000Z',
    likes: 8,
  },
  {
    id: 'dc3',
    postId: 'cp2',
    userId: 'u1',
    userName: 'Alex Kim',
    userHandle: 'swingkingAK',
    text: 'Phase 2 being easier once the process is locked in is exactly my experience too. Well done.',
    createdAt: '2026-04-11T09:00:00.000Z',
    likes: 15,
  },
];
