import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMobile } from '../hooks/useMobile';
import { useTheme } from '../context/ThemeContext';
import { createChart, ColorType, LineStyle, CandlestickSeries, AreaSeries } from 'lightweight-charts';

// ── Types ──────────────────────────────────────────────────────────────────

type ForumTab = 'hot' | 'latest' | 'top';
type HubTab = 'track' | 'pnl' | 'alerts' | 'conf' | 'size' | 'review';
type SigFilter = 'all' | 'open' | 'closed' | 'watchlist';

interface Thread {
  id: string;
  score: number;
  tags: { label: string; type: 'sentiment' | 'topic' }[];
  category: string;
  title: string;
  preview: string;
  author: { initials: string; name: string; gradient: [string, string] };
  timeAgo: string;
  replies: number;
  views: number;
}

type GroupType = 'investment' | 'trading' | 'topic';

interface Forum {
  id: string;
  name: string;
  color: string;
  type: 'open' | 'closed' | 'paid';
  price?: number;
  memberCount: string;
  onlineCount: number;
  categories: { id: string; label: string }[];
  threads: Thread[];
  isSignalForum?: boolean;
  isInvestmentForum?: boolean;
  groupType: GroupType;
}

const GROUP_TYPE_CFG: Record<GroupType, { label: string; color: string; bg: string }> = {
  investment: { label: 'Investment', color: '#185FA5', bg: '#E6F1FB' },
  trading:    { label: 'Trading',    color: '#1D9E75', bg: '#E1F5EE' },
  topic:      { label: 'Topic',      color: '#7c3aed', bg: '#F3EAFE' },
};

interface SignalData {
  id: string;
  ticker: string;
  direction: 'Long' | 'Short';
  assetType: string;
  orderType: 'Market' | 'Limit' | 'Stop limit' | 'Zone';
  timeframe: string;
  status: 'open' | 't1-hit' | 'watching' | 'stopped';
  entry: number | [number, number];
  targets: number[];
  stop: number;
  currentPrice: number;
  pnlR?: string;
  thesis: string;
  author: { initials: string; name: string; gradient: [string, string] };
  rr: string;
  confidence: number;
  comments: number;
  views: number;
  postedAt: string;
  updateBanner?: string;
  takenShares?: number;
}

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  'open':     { color: '#1D9E75', bg: 'rgba(29,158,117,0.07)',  label: 'Open'     },
  't1-hit':   { color: '#185FA5', bg: 'rgba(24,95,165,0.07)',   label: 'T1 hit'   },
  'watching': { color: '#BA7517', bg: 'rgba(186,117,23,0.07)',  label: 'Watching' },
  'stopped':  { color: '#E24B4A', bg: 'rgba(226,75,74,0.07)',   label: 'Stopped'  },
};

// ── Data ───────────────────────────────────────────────────────────────────

export const MY_FORUMS: Forum[] = [
  {
    id: 'long-term-value',
    name: 'Long-Term Value',
    color: '#185FA5',
    type: 'closed',
    groupType: 'investment',
    isInvestmentForum: true,
    memberCount: '1.8k',
    onlineCount: 12,
    categories: [
      { id: 'all', label: 'All' },
      { id: 'stocks', label: 'Stocks' },
      { id: 'etfs', label: 'ETFs' },
      { id: 'macro', label: 'Macro' },
    ],
    threads: [
      {
        id: 'ltv1', score: 134,
        tags: [{ label: 'Bullish', type: 'sentiment' }, { label: 'BRK.B', type: 'topic' }],
        category: 'stocks',
        title: 'Berkshire Q1 — cash pile at record, what does Buffett see that we don\'t?',
        preview: 'BRK.B sitting on $189B cash. Insurance float growing. Either the market is overvalued or Buffett is waiting for a major acquisition. History says be patient.',
        author: { initials: 'RV', name: 'ryan_v', gradient: ['#185FA5', '#0891b2'] },
        timeAgo: '3h ago', replies: 27, views: 640,
      },
      {
        id: 'ltv2', score: 89,
        tags: [{ label: 'Neutral', type: 'sentiment' }, { label: 'VTI', type: 'topic' }],
        category: 'etfs',
        title: 'DCA into VTI vs lump sum — the math after 2024\'s run',
        preview: 'Running the numbers on DCA vs lump sum given current valuations. Shiller CAPE at 34. Historical DCA edge disappears above 30 CAPE. Thoughts?',
        author: { initials: 'PW', name: 'pete_w', gradient: ['#16a34a', '#0891b2'] },
        timeAgo: '6h ago', replies: 14, views: 390,
      },
    ],
  },
  {
    id: 'options-flow',
    name: 'Options Flow Traders',
    color: '#0047FF',
    type: 'open',
    groupType: 'trading',
    memberCount: '4.2k',
    onlineCount: 38,
    categories: [
      { id: 'all', label: 'All' },
      { id: 'unusual-flow', label: 'Unusual Flow' },
      { id: 'dark-pool', label: 'Dark Pool' },
      { id: 'earnings', label: 'Earnings Plays' },
    ],
    threads: [
      {
        id: 'of1', score: 247,
        tags: [{ label: 'Bullish', type: 'sentiment' }, { label: 'NVDA', type: 'topic' }],
        category: 'unusual-flow',
        title: 'Massive call sweep on NVDA — 5,000 contracts at $950',
        preview: "Unusual options activity alert: 5,000 calls at $950 strike expiring next Friday. Premium paid $4.2M. Someone is positioning aggressively for a move above $960 by end of week. Open interest jumped 340%.",
        author: { initials: 'JK', name: 'jake_kap', gradient: ['#0047FF', '#00c6ff'] },
        timeAgo: '2h ago', replies: 84, views: 2400,
      },
      {
        id: 'of2', score: 198,
        tags: [{ label: 'Bearish', type: 'sentiment' }, { label: 'SPY', type: 'topic' }],
        category: 'unusual-flow',
        title: 'SPY put wall at 510 — market pricing in a correction?',
        preview: "Massive put open interest building at 510 strike on SPY. Dark pool prints suggest institutional hedging. If SPY can't hold 515 by Friday close, this could trigger a cascade to 505.",
        author: { initials: 'SR', name: 'sara_risk', gradient: ['#dc2626', '#f97316'] },
        timeAgo: '4h ago', replies: 61, views: 1800,
      },
      {
        id: 'of3', score: 88,
        tags: [{ label: 'Bullish', type: 'sentiment' }, { label: 'TSLA', type: 'topic' }],
        category: 'dark-pool',
        title: 'Dark pool — 2M shares TSLA at $168, above market',
        preview: "Dark pool print: 2 million shares of TSLA at $168.40, about 0.8% above current market. Premium prints like this often precede significant upward moves. Worth watching closely.",
        author: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
        timeAgo: '6h ago', replies: 29, views: 870,
      },
    ],
  },
  {
    id: 'macro-desk',
    name: 'Macro Desk',
    color: '#7c3aed',
    type: 'closed',
    groupType: 'topic',
    memberCount: '890',
    onlineCount: 12,
    categories: [
      { id: 'all', label: 'All' },
      { id: 'fed-watch', label: 'Fed Watch' },
      { id: 'global', label: 'Global Macro' },
      { id: 'commodities', label: 'Commodities' },
    ],
    threads: [
      {
        id: 'md1', score: 312,
        tags: [{ label: 'Bearish', type: 'sentiment' }, { label: 'Rates', type: 'topic' }],
        category: 'fed-watch',
        title: 'Fed holding longer — repricing growth at a higher discount rate',
        preview: "The 2-year yield just crossed 5.1% again. If you're long growth/tech, your DCF assumptions need a refresh. Here's how I'm adjusting duration exposure in a higher-for-longer regime.",
        author: { initials: 'SR', name: 'sara_risk', gradient: ['#dc2626', '#f97316'] },
        timeAgo: '1h ago', replies: 47, views: 1100,
      },
      {
        id: 'md2', score: 201,
        tags: [{ label: 'Bullish', type: 'sentiment' }, { label: 'DXY', type: 'topic' }],
        category: 'global',
        title: 'Dollar strength cycle — EM currencies at risk into Q2',
        preview: "DXY has now broken above 106 for the third time. Historical analogs suggest EM FX stress follows within 6–8 weeks. I'm watching USDMXN and USDBRL as early warning indicators.",
        author: { initials: 'MC', name: 'mike_chain', gradient: ['#f97316', '#7c3aed'] },
        timeAgo: '3h ago', replies: 38, views: 920,
      },
      {
        id: 'md3', score: 156,
        tags: [{ label: 'Bullish', type: 'sentiment' }, { label: 'Gold', type: 'topic' }],
        category: 'commodities',
        title: 'Gold breaking out — real rates narrative vs. safe haven bid',
        preview: "Gold at $2,340 while real rates are still positive is unusual. Either real rates are about to fall hard or the safe haven bid is pricing something the equity market isn't. My thesis here.",
        author: { initials: 'JK', name: 'jake_kap', gradient: ['#0047FF', '#00c6ff'] },
        timeAgo: '5h ago', replies: 29, views: 740,
      },
    ],
  },
  {
    id: 'alpha-signals',
    name: 'Alpha Signals',
    color: '#16a34a',
    type: 'paid',
    price: 19,
    groupType: 'trading',
    memberCount: '320',
    onlineCount: 21,
    isSignalForum: true,
    categories: [
      { id: 'all', label: 'All' },
      { id: 'signals', label: 'Signals' },
      { id: 'watchlist', label: 'Watchlist' },
      { id: 'live', label: 'Live Trades' },
    ],
    threads: [
      {
        id: 'as1', score: 189,
        tags: [{ label: 'Bullish', type: 'sentiment' }, { label: 'AAPL', type: 'topic' }],
        category: 'signals',
        title: 'AAPL long setup — breakout above 195 with tight risk',
        preview: "Setup: AAPL consolidating in a bull flag on the daily. Entry above $195.50, target $208, stop $191. Risk/reward 3.2:1. Services revenue narrative intact, AI refresh cycle underpriced.",
        author: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
        timeAgo: '30m ago', replies: 22, views: 610,
      },
      {
        id: 'as2', score: 143,
        tags: [{ label: 'Bearish', type: 'sentiment' }, { label: 'META', type: 'topic' }],
        category: 'signals',
        title: 'META short idea — Reality Labs losses still not priced in',
        preview: "META is up 180% from the lows but RL is burning $5B/quarter. If the AI capex narrative fades, this becomes the first cut. Short via puts, defined risk. Full breakdown inside.",
        author: { initials: 'TN', name: 'trader_new', gradient: ['#6b7280', '#9ca3af'] },
        timeAgo: '2h ago', replies: 18, views: 480,
      },
      {
        id: 'as3', score: 97,
        tags: [{ label: 'Bullish', type: 'sentiment' }, { label: 'BTC', type: 'topic' }],
        category: 'live',
        title: 'BTC live trade — entered long at $87,200, targeting $94k',
        preview: "Entered BTC long at $87,200 this morning. Stop at $84,800. Target $94,000. On-chain metrics support: exchange outflows at 6-month high, SOPR reset, funding neutral. Sharing live updates.",
        author: { initials: 'MC', name: 'mike_chain', gradient: ['#f97316', '#7c3aed'] },
        timeAgo: '4h ago', replies: 33, views: 890,
      },
    ],
  },
];

// ── Alpha Signals Data ───────────────────────────────────────────────────────

const ALPHA_SIGNALS: SignalData[] = [
  {
    id: 'sig1',
    ticker: 'AAPL', direction: 'Long', assetType: 'Equity',
    orderType: 'Limit', timeframe: 'Swing', status: 'open',
    entry: 195.50, targets: [208, 215], stop: 191,
    currentPrice: 198.20,
    thesis: 'AAPL consolidating in a bull flag on the daily. Services revenue narrative intact, AI refresh cycle underpriced. Tight risk above key support at $191.',
    author: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
    rr: '3.2', confidence: 82, comments: 22, views: 610, postedAt: '30m ago',
  },
  {
    id: 'sig2',
    ticker: 'SPY', direction: 'Short', assetType: 'ETF',
    orderType: 'Market', timeframe: 'Intraday', status: 't1-hit',
    entry: 515.20, targets: [511, 507.50], stop: 515.20,
    currentPrice: 512.40, pnlR: '+1.2R',
    thesis: 'SPY put wall at 510. Institutional hedging via dark pool. T1 hit at $511 — stop moved to breakeven, trailing to T2 at $507.50.',
    author: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
    rr: '2.4', confidence: 71, comments: 14, views: 890, postedAt: '5h ago',
    updateBanner: 'T1 hit at $511 — stop moved to breakeven, trailing to T2',
    takenShares: 4,
  },
  {
    id: 'sig3',
    ticker: 'META', direction: 'Short', assetType: 'Equity',
    orderType: 'Zone', timeframe: 'Swing', status: 'watching',
    entry: [480, 492], targets: [465, 452], stop: 498,
    currentPrice: 498.20,
    thesis: 'META extended after 180% run. RL burning $5B/quarter. If AI capex narrative fades, this becomes the first cut. Waiting for pullback into zone before shorting.',
    author: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
    rr: '2.8', confidence: 64, comments: 18, views: 480, postedAt: '2h ago',
  },
  {
    id: 'sig4',
    ticker: 'TSLA', direction: 'Long', assetType: 'Equity',
    orderType: 'Market', timeframe: 'Swing', status: 'stopped',
    entry: 178.50, targets: [195, 210], stop: 172,
    currentPrice: 172, pnlR: '−1R',
    thesis: 'TSLA tight base at $175 support with volume contracting. Expected broader market uptrend to carry. Stopped by macro selloff — missed Fed speaker event on calendar.',
    author: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
    rr: '2.4', confidence: 68, comments: 33, views: 890, postedAt: 'Yesterday',
  },
];

// ── Investment Signal Types & Data ───────────────────────────────────────────

interface InvestmentSignalData {
  id: string;
  ticker: string;
  sector: string;
  entryLimit: number;
  priceTarget: number;
  currentPrice: number;
  timeHorizon: string;
  conviction: 'High' | 'Medium' | 'Low';
  positionSize: string;
  thesis: string;
  catalysts: string[];
  status: 'active' | 'closed';
  author: { initials: string; name: string; gradient: [string, string] };
  postedAt: string;
  comments: number;
  views: number;
}

const INVESTMENT_SIGNALS: InvestmentSignalData[] = [
  {
    id: 'inv1',
    ticker: 'NVDA',
    sector: 'Technology',
    entryLimit: 780,
    priceTarget: 1150,
    currentPrice: 875,
    timeHorizon: '12–18 months',
    conviction: 'High',
    positionSize: '8% of portfolio',
    thesis: 'NVIDIA\'s dominance in AI accelerator hardware is structurally underpriced. Data center revenue is compounding at 220% YoY and the H100/H200 backlog extends well into 2025. The upcoming Blackwell architecture represents another generational leap — software moat via CUDA ecosystem makes switching costs prohibitive for hyperscalers. At current valuations, the market is pricing in only 2 more years of growth when the AI infrastructure buildout is just beginning.',
    catalysts: [
      'Blackwell GPU launch — 2–4× performance uplift vs. H200',
      'Sovereign AI budgets accelerating ($50B+ committed globally)',
      'Automotive & robotics TAM expansion (Drive platform)',
      'NIM microservices monetising the software layer',
    ],
    status: 'active',
    author: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
    postedAt: '2d ago',
    comments: 31,
    views: 1840,
  },
  {
    id: 'inv2',
    ticker: 'BRK.B',
    sector: 'Conglomerate',
    entryLimit: 398,
    priceTarget: 490,
    currentPrice: 412,
    timeHorizon: '18–24 months',
    conviction: 'Medium',
    positionSize: '5% of portfolio',
    thesis: 'Berkshire\'s $189B cash pile is optionality at near-zero cost. Insurance float compounding at record levels, BNSF benefiting from reshoring, and GEICO returning to profitability after the underwriting overhaul. Buffett has historically deployed record cash within 18 months of market dislocations. Trading at 1.4× book — historically attractive versus its 20-year average of 1.6×.',
    catalysts: [
      'Major acquisition target — Buffett hints at "elephant-sized" deal',
      'GEICO underwriting swing from loss to profit ($4B+ improvement)',
      'Reshoring tailwind for BNSF rail volumes',
      'Book value compounding via buybacks at current discount',
    ],
    status: 'active',
    author: { initials: 'RV', name: 'ryan_v', gradient: ['#185FA5', '#0891b2'] },
    postedAt: '4d ago',
    comments: 17,
    views: 920,
  },
];

// ── Signal Hub Data ─────────────────────────────────────────────────────────

const SIGNAL_HISTORY = [
  { ticker: 'NVDA',    market: 'Stock',     dir: 'Long',  entry: '$952.40', target: '$1,020',  stop: '$920',   result: 'Open',   resultType: 'open', pnl: '+1.8%',  pnlUp: true,  posted: '2h ago' },
  { ticker: 'EUR/USD', market: 'Forex',     dir: 'Long',  entry: '1.0842',  target: '1.0920',  stop: '1.0800', result: 'Win',    resultType: 'win',  pnl: '+1.8R',  pnlUp: true,  posted: '4h ago' },
  { ticker: 'SPY',     market: 'ETF',       dir: 'Short', entry: '$515.20', target: '$507.50', stop: '$518',   result: 'T1 hit', resultType: 'hit',  pnl: '+1.2R',  pnlUp: true,  posted: '5h ago' },
  { ticker: 'XAUUSD',  market: 'Commodity', dir: 'Long',  entry: '2,318',   target: '2,380',   stop: '2,290',  result: 'Open',   resultType: 'open', pnl: '+0.9%',  pnlUp: true,  posted: '8h ago' },
  { ticker: 'GBP/JPY', market: 'Forex',     dir: 'Short', entry: '191.40',  target: '188.00',  stop: '193.20', result: 'Win',    resultType: 'win',  pnl: '+2.1R',  pnlUp: true,  posted: '1d ago' },
  { ticker: 'ES1!',    market: 'Futures',   dir: 'Long',  entry: '5,242',   target: '5,320',   stop: '5,200',  result: 'Win',    resultType: 'win',  pnl: '+1.9R',  pnlUp: true,  posted: '1d ago' },
  { ticker: 'TSLA',    market: 'Stock',     dir: 'Long',  entry: '$178.50', target: '$195',    stop: '$172',   result: 'Stop',   resultType: 'stop', pnl: '-1R',    pnlUp: false, posted: 'Yesterday' },
  { ticker: 'WTI',     market: 'Commodity', dir: 'Short', entry: '82.40',   target: '78.50',   stop: '84.20',  result: 'Win',    resultType: 'win',  pnl: '+2.2R',  pnlUp: true,  posted: '2d ago' },
  { ticker: 'AAPL',    market: 'Stock',     dir: 'Long',  entry: '$208.10', target: '$218',    stop: '$204',   result: 'Win',    resultType: 'win',  pnl: '+2.4R',  pnlUp: true,  posted: '2d ago' },
  { ticker: 'NQ1!',    market: 'Futures',   dir: 'Short', entry: '18,240',  target: '17,900',  stop: '18,420', result: 'Stop',   resultType: 'stop', pnl: '-1R',    pnlUp: false, posted: '3d ago' },
  { ticker: 'GER40',   market: 'Index CFD', dir: 'Long',  entry: '18,150',  target: '18,600',  stop: '17,900', result: 'Win',    resultType: 'win',  pnl: '+2.0R',  pnlUp: true,  posted: '3d ago' },
  { ticker: 'AMD',     market: 'Stock',     dir: 'Short', entry: '$162.40', target: '$152',    stop: '$166',   result: 'Win',    resultType: 'win',  pnl: '+3.1R',  pnlUp: true,  posted: '4d ago' },
];

const PNL_HISTORY = [
  { ticker: 'AAPL', shares: 24, entry: '$208.10', exit: '$218.40', exitUp: true,  result: 'Win',  pnl: '+$247', pnlUp: true  },
  { ticker: 'AMD',  shares: 18, entry: '$162.40', exit: '$152.00', exitUp: true,  result: 'Win',  pnl: '+$312', pnlUp: true  },
  { ticker: 'TSLA', shares: 14, entry: '$178.50', exit: '$172.00', exitUp: false, result: 'Loss', pnl: '-$91',  pnlUp: false },
  { ticker: 'META', shares: 8,  entry: '$480.20', exit: '$498.50', exitUp: true,  result: 'Win',  pnl: '+$146', pnlUp: true  },
];

const HUB_TABS: { id: HubTab; label: string }[] = [
  { id: 'track',  label: 'Verified track record' },
  { id: 'pnl',    label: 'Personal P&L' },
  { id: 'alerts', label: 'Smart alerts' },
  { id: 'conf',   label: 'Confidence score' },
  { id: 'size',   label: 'Risk sizing' },
  { id: 'review', label: 'Post-trade review' },
];

// ── Signal Hub Helpers ──────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 36, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
        background: on ? '#1D9E75' : 'var(--surface-2)',
        border: on ? 'none' : '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: 2, transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        background: on ? '#fff' : 'var(--text-3)',
        marginLeft: on ? 'auto' : 0, transition: 'margin 0.15s',
      }} />
    </div>
  );
}

function StatBox({ val, label, color }: { val: string; label: string; color?: string }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 20, fontWeight: 500, color: color ?? 'var(--text)', lineHeight: 1.1 }}>{val}</div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

function tag(type: 'green' | 'red' | 'blue' | 'amber' | 'gray'): React.CSSProperties {
  const map = {
    green: { background: '#E1F5EE', color: '#0F6E56' },
    red:   { background: '#FCEBEB', color: '#A32D2D' },
    blue:  { background: '#E6F1FB', color: '#0C447C' },
    amber: { background: '#FAEEDA', color: '#854F0B' },
    gray:  { background: 'var(--surface-2)', color: 'var(--text-2)' },
  };
  return { fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, ...map[type] };
}

function resultTag(type: string): React.CSSProperties {
  if (type === 'open')  return tag('green');
  if (type === 'hit')   return tag('blue');
  if (type === 'stop')  return tag('red');
  if (type === 'win')   return tag('green');
  return tag('gray');
}

const SEC: React.CSSProperties  = { padding: '12px 16px', borderBottom: '1px solid var(--border)' };
const SEC0: React.CSSProperties = { padding: '12px 16px' };
const SLBL: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.8px', marginBottom: 8 };

// ── Signal Hub Component ────────────────────────────────────────────────────

function SignalHub({ mobile }: { mobile: boolean }) {
  const [tab, setTab] = useState<HubTab>('track');
  const [accountSize, setAccountSize] = useState('15000');
  const [maxRisk, setMaxRisk] = useState('1');
  const [voteState, setVoteState] = useState<'agree' | 'disagree' | null>(null);
  const [alertToggles, setAlertToggles] = useState({
    entry: true, target: true, stop: true, newSignal: true, update: false,
  });

  const acctNum = parseFloat(accountSize.replace(/[^0-9.]/g, '')) || 0;
  const riskPct = parseFloat(maxRisk) || 1;
  const riskAmt = Math.round(acctNum * riskPct / 100);
  const sharesRec = Math.max(1, Math.floor(riskAmt / 32.40));

  const agreeCount  = 148 + (voteState === 'agree'    ? 1 : 0);
  const disagreeCount = 33 + (voteState === 'disagree' ? 1 : 0);
  const total = agreeCount + disagreeCount;
  const confPct = Math.round((agreeCount / total) * 100);

  return (
    <div style={{ padding: mobile ? '12px' : '16px 20px' }}>
      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {HUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '6px 13px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${tab === t.id ? 'var(--text)' : 'var(--border)'}`,
              background: tab === t.id ? 'var(--text)' : 'transparent',
              color: tab === t.id ? 'var(--bg)' : 'var(--text-2)',
              fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>

        {/* ── VERIFIED TRACK RECORD ── */}
        {tab === 'track' && <>
          <div style={SEC}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>alex_lev · verified track record</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>142 signals · last 90 days · auto-verified by Candl</div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, ...tag('green'), flexShrink: 0, fontSize: 10, padding: '3px 9px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Candl verified
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              <StatBox val="74%"    label="Win rate"     color="#1D9E75" />
              <StatBox val="2.8"    label="Avg R:R"      color="#185FA5" />
              <StatBox val="+38.4%" label="Return (90d)" color="#1D9E75" />
              <StatBox val="106/36" label="W / L" />
            </div>
          </div>

          <div style={SEC}>
            <div style={SLBL}>FULL SIGNAL HISTORY · IMMUTABLE · CANNOT BE DELETED OR EDITED</div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 600, width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 0.75fr 1.1fr 1.1fr 1fr 0.9fr 0.8fr 0.95fr', background: 'var(--surface-2)', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.5px' }}>
                  {['Ticker','Market','Dir','Entry','Target','Stop','Result','P&L','Posted'].map(h => (
                    <div key={h} style={{ padding: '8px 10px' }}>{h}</div>
                  ))}
                </div>
                {SIGNAL_HISTORY.map((s, i) => {
                  const mktColor: Record<string, { bg: string; color: string }> = {
                    'Stock':     { bg: 'var(--surface-2)', color: 'var(--text-2)' },
                    'ETF':       { bg: 'var(--surface-2)', color: 'var(--text-2)' },
                    'Forex':     { bg: '#E6F1FB',          color: '#0C447C' },
                    'Futures':   { bg: '#F3EAFE',          color: '#6b21a8' },
                    'Commodity': { bg: '#FAEEDA',          color: '#854F0B' },
                    'Index CFD': { bg: '#FEF3C7',          color: '#92400E' },
                  };
                  const mc = mktColor[s.market] ?? mktColor['Stock'];
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 0.75fr 1.1fr 1.1fr 1fr 0.9fr 0.8fr 0.95fr', borderTop: '1px solid var(--border)', fontSize: 12 }}>
                      <div style={{ padding: '9px 10px', fontWeight: 700 }}>{s.ticker}</div>
                      <div style={{ padding: '9px 10px' }}><span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: mc.bg, color: mc.color }}>{s.market}</span></div>
                      <div style={{ padding: '9px 10px' }}><span style={tag(s.dir === 'Long' ? 'green' : 'red')}>{s.dir}</span></div>
                      <div style={{ padding: '9px 10px' }}>{s.entry}</div>
                      <div style={{ padding: '9px 10px', color: s.pnlUp ? '#1D9E75' : 'var(--text-3)' }}>{s.target}</div>
                      <div style={{ padding: '9px 10px', color: '#E24B4A' }}>{s.stop}</div>
                      <div style={{ padding: '9px 10px' }}><span style={resultTag(s.resultType)}>{s.result}</span></div>
                      <div style={{ padding: '9px 10px', fontWeight: 600, color: s.pnlUp ? '#1D9E75' : '#E24B4A' }}>{s.pnl}</div>
                      <div style={{ padding: '9px 10px', color: 'var(--text-3)', fontSize: 11 }}>{s.posted}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ ...SEC0, background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}>
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Signals are <strong style={{ color: 'var(--text)' }}>locked the moment they are posted</strong>. Entry, target and stop cannot be edited. Results are filled automatically using live price data. No signal can ever be deleted.
              </div>
            </div>
          </div>
        </>}

        {/* ── PERSONAL P&L ── */}
        {tab === 'pnl' && <>
          <div style={SEC}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Your P&L from Alpha Signals</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>Based on your account size · last 90 days</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              <StatBox val="+$2,840" label="Total profit"  color="#1D9E75" />
              <StatBox val="+18.9%" label="Your return"   color="#1D9E75" />
              <StatBox val="38"     label="Signals taken" />
              <StatBox val={`$${(parseInt(accountSize.replace(/\D/g,'')) || 15000).toLocaleString()}`} label="Account size" color="#BA7517" />
            </div>
          </div>

          <div style={SEC}>
            <div style={SLBL}>YOUR SIGNAL-BY-SIGNAL BREAKDOWN</div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 440 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '52px 58px 72px 72px 60px 80px', background: 'var(--surface-2)', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.5px' }}>
                  {['Ticker','Shares','Entry','Exit','Result','Your P&L'].map(h => (
                    <div key={h} style={{ padding: '8px 8px' }}>{h}</div>
                  ))}
                </div>
                {PNL_HISTORY.map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '52px 58px 72px 72px 60px 80px', borderTop: '1px solid var(--border)', fontSize: 12 }}>
                    <div style={{ padding: '8px 8px', fontWeight: 600 }}>{p.ticker}</div>
                    <div style={{ padding: '8px 8px' }}>{p.shares}</div>
                    <div style={{ padding: '8px 8px' }}>{p.entry}</div>
                    <div style={{ padding: '8px 8px', color: p.exitUp ? '#1D9E75' : '#E24B4A' }}>{p.exit}</div>
                    <div style={{ padding: '8px 8px' }}><span style={tag(p.result === 'Win' ? 'green' : 'red')}>{p.result}</span></div>
                    <div style={{ padding: '8px 8px', fontWeight: 600, color: p.pnlUp ? '#1D9E75' : '#E24B4A' }}>{p.pnl}</div>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '52px 58px 72px 72px 60px 80px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 12 }}>
                  <div style={{ padding: '8px 8px', color: 'var(--text-3)', fontWeight: 600, gridColumn: '1 / 6' }}>+34 more signals</div>
                  <div style={{ padding: '8px 8px', fontWeight: 600, color: '#1D9E75' }}>+$2,226</div>
                </div>
              </div>
            </div>
          </div>

          <div style={SEC0}>
            <div style={SLBL}>ACCOUNT SIZE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxWidth: 160 }}>
                <span style={{ padding: '7px 10px', background: 'var(--surface-2)', color: 'var(--text-3)', fontSize: 13, borderRight: '1px solid var(--border)' }}>$</span>
                <input
                  value={accountSize}
                  onChange={e => setAccountSize(e.target.value)}
                  placeholder="15000"
                  style={{ flex: 1, padding: '7px 10px', border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text)', fontFamily: 'inherit', minWidth: 0 }}
                />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Used to calculate your personal P&L per signal</span>
            </div>
          </div>
        </>}

        {/* ── SMART ALERTS ── */}
        {tab === 'alerts' && <>
          <div style={SEC}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Smart entry alerts</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
              Candl watches price in real time. You get notified the moment a signal's entry is hit.
            </div>

            {/* Entry hit */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>NVDA entry hit · $952.40</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Alpha Signals · alex_lev · Long swing · Target $1,080 · Stop $920</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Just now</span>
            </div>

            {/* Target hit */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>SPY Target 1 hit · $511.00</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Alpha Signals · Stop moved to breakeven · Still running to T2</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>5h ago</span>
            </div>

            {/* Stop hit */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingTop: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A32D2D" strokeWidth="1.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <path d="M12 9v4M12 17h.01"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>TSLA stop hit · closed -1R</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Alpha Signals · Post-trade review posted by alex_lev</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Yesterday</span>
            </div>
          </div>

          <div style={SEC0}>
            <div style={SLBL}>ALERT PREFERENCES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {([
                ['entry',     'Entry price hit'],
                ['target',    'Target hit'],
                ['stop',      'Stop hit'],
                ['newSignal', 'New signal posted'],
                ['update',    'Signal update posted'],
              ] as [keyof typeof alertToggles, string][]).map(([key, label]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
                  <Toggle on={alertToggles[key]} onToggle={() => setAlertToggles(p => ({ ...p, [key]: !p[key] }))} />
                </div>
              ))}
            </div>
          </div>
        </>}

        {/* ── CONFIDENCE SCORE ── */}
        {tab === 'conf' && (
          <div style={SEC0}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Community confidence score</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
              Members vote on every signal before it closes. Helps you decide how much to size.
            </div>

            {/* Signal confidence block */}
            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>NVDA Long · $952 entry</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#1D9E75' }}>{confPct}%</div>
              </div>
              <div style={{ height: 10, background: 'var(--surface)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${confPct}%`, height: '100%', background: '#1D9E75', borderRadius: 5, transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
                <span>{agreeCount} agree</span>
                <span>{disagreeCount} disagree</span>
              </div>
            </div>

            {/* Vote buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => setVoteState(v => v === 'agree' ? null : 'agree')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                  borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  border: `1px solid ${voteState === 'agree' ? '#1D9E75' : 'var(--border)'}`,
                  background: voteState === 'agree' ? '#E1F5EE' : 'transparent',
                  color: voteState === 'agree' ? '#0F6E56' : 'var(--text-2)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
                  <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
                </svg>
                I agree · {agreeCount}
              </button>
              <button
                onClick={() => setVoteState(v => v === 'disagree' ? null : 'disagree')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                  borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  border: `1px solid ${voteState === 'disagree' ? 'var(--text-2)' : 'var(--border)'}`,
                  background: 'transparent',
                  color: voteState === 'disagree' ? 'var(--text)' : 'var(--text-2)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/>
                  <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
                </svg>
                Not sure · {disagreeCount}
              </button>
            </div>

            <div style={SLBL}>HOW TO USE IT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { pct: '80%+', bg: '#E1F5EE', color: '#0F6E56', text: 'Strong consensus — consider full position size' },
                { pct: '60%',  bg: '#FAEEDA', color: '#854F0B', text: 'Mixed — consider half position or skip' },
                { pct: '<50%', bg: '#FCEBEB', color: '#A32D2D', text: 'Community doubts it — proceed with caution' },
              ].map(h => (
                <div key={h.pct} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-2)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: h.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: h.color }}>{h.pct}</span>
                  </div>
                  {h.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RISK SIZING ── */}
        {tab === 'size' && (
          <div style={SEC0}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Risk sizing calculator</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
              Set your account size and max risk once. Candl tells you exactly how many shares to buy on every signal.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Account size</div>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxWidth: 200 }}>
                  <span style={{ padding: '7px 10px', background: 'var(--surface-2)', color: 'var(--text-3)', fontSize: 13, borderRight: '1px solid var(--border)' }}>$</span>
                  <input value={accountSize} onChange={e => setAccountSize(e.target.value)} placeholder="15000"
                    style={{ flex: 1, padding: '7px 10px', border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text)', fontFamily: 'inherit', minWidth: 0 }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Max risk per trade</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxWidth: 110 }}>
                    <input value={maxRisk} onChange={e => setMaxRisk(e.target.value)} placeholder="1"
                      style={{ flex: 1, padding: '7px 10px', border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text)', fontFamily: 'inherit', minWidth: 0 }} />
                    <span style={{ padding: '7px 10px', background: 'var(--surface-2)', color: 'var(--text-3)', fontSize: 13, borderLeft: '1px solid var(--border)' }}>%</span>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>= ${riskAmt.toLocaleString()} per trade</span>
                </div>
              </div>
            </div>

            <div style={{ ...SLBL, marginBottom: 10 }}>SIGNAL CARD · BUILT-IN SIZING</div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>NVDA</span>
                <span style={tag('green')}>Long</span>
                <span style={tag('gray')}>Swing</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
                {[
                  { label: 'ENTRY',      val: '$952.40', color: 'var(--text)' },
                  { label: 'STOP',       val: '$920',    color: '#E24B4A' },
                  { label: 'RISK/SHARE', val: '$32.40',  color: 'var(--text)' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--surface)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#0F6E56', fontWeight: 600, marginBottom: 2 }}>Your position size</div>
                  <div style={{ fontSize: 11, color: '#0F6E56' }}>Risk ${riskAmt.toLocaleString()} at $32.40/share</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#0F6E56' }}>{sharesRec} shares</div>
              </div>
            </div>
          </div>
        )}

        {/* ── POST-TRADE REVIEW ── */}
        {tab === 'review' && <>
          <div style={SEC}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#BA7517', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>AL</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>TSLA Long · post-trade review</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>alex_lev · closed yesterday · -1R</div>
              </div>
              <span style={tag('red')}>-1R</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { label: 'ENTRY',    val: '$178.50', color: 'var(--text)' },
                { label: 'STOP HIT', val: '$172.00', color: '#E24B4A' },
                { label: 'HELD',     val: '18 hrs',  color: 'var(--text)' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={SEC}>
            <div style={SLBL}>POST-TRADE REVIEW</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { color: '#185FA5', title: 'What triggered the setup',  text: "TSLA had built a tight base at $175 support with volume contracting — classic coil before a spring. The broader market was also in an uptrend which I expected to carry it." },
                { color: '#E24B4A', title: 'What went wrong',           text: "A surprise macro selloff hit mid-session — unrelated to TSLA specifically. The broader SPY dropped 1.8% in 90 mins and took TSLA straight through my stop. The individual setup was fine; macro context wasn't properly accounted for." },
                { color: '#1D9E75', title: "What I'd do differently",   text: "Check the macro calendar before entering swing trades. There was a Fed speaker event that afternoon I overlooked. Would have waited a day or sized down significantly." },
              ].map(b => (
                <div key={b.title} style={{ borderLeft: `3px solid ${b.color}`, paddingLeft: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: b.color, marginBottom: 4 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{b.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...SEC0, background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Post-trade reviews are <strong style={{ color: 'var(--text)' }}>required</strong> within 24h of a signal closing. Hosts who skip reviews get a warning. Three warnings = group suspended.
            </div>
          </div>
        </>}

      </div>
    </div>
  );
}

// ── Signal Card ─────────────────────────────────────────────────────────────

function ReviewSheet({ sig, onClose }: { sig: SignalData; onClose: () => void }) {
  const entry = Array.isArray(sig.entry) ? sig.entry[0] : sig.entry;
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 1000, touchAction: 'none',
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderRadius: '16px 16px 0 0',
        zIndex: 1001,
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Title row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px 12px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              Post-trade review — {sig.ticker} {sig.direction}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              Closed · {sig.pnlR ?? '−1R'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', lineHeight: 1 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          {[
            { label: 'ENTRY',     val: `$${typeof entry === 'number' ? entry.toFixed(2) : entry}`, color: 'var(--text)' },
            { label: 'STOP HIT', val: `$${sig.stop.toFixed(2)}`,  color: '#E24B4A' },
            { label: 'RESULT',   val: sig.pnlR ?? '−1R',          color: '#E24B4A' },
            { label: 'HELD',     val: '18 hrs',                   color: 'var(--text)' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.val}</div>
            </div>
          ))}
        </div>

        {/* Review cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          {[
            {
              color: '#185FA5', bg: 'rgba(24,95,165,0.07)',
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
              title: 'What triggered the setup',
              text: "TSLA had built a tight base at $175 support with volume contracting — classic coil before a spring. The broader market was also in an uptrend which I expected to carry it.",
            },
            {
              color: '#E24B4A', bg: 'rgba(226,75,74,0.07)',
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
              title: 'What went wrong',
              text: "A surprise macro selloff hit mid-session — unrelated to TSLA specifically. The broader SPY dropped 1.8% in 90 mins and took TSLA straight through my stop. The individual setup was fine; macro context wasn't properly accounted for.",
            },
            {
              color: '#1D9E75', bg: 'rgba(29,158,117,0.07)',
              icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
              title: "What I'd do differently",
              text: "Check the macro calendar before entering swing trades. There was a Fed speaker event that afternoon I overlooked. Would have waited a day or sized down significantly.",
            },
          ].map(card => (
            <div key={card.title} style={{ background: card.bg, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${card.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                <span style={{ color: card.color }}>{card.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: card.color }}>{card.title}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{card.text}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${sig.author.gradient[0]}, ${sig.author.gradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 10, fontWeight: 700,
          }}>
            {sig.author.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{sig.author.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Posted review 3h after close</div>
          </div>
          <button style={{
            fontSize: 12, fontWeight: 600, padding: '7px 14px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 20, cursor: 'pointer', color: 'var(--text)',
            flexShrink: 0,
          }}>
            Reply to review
          </button>
        </div>
      </div>
    </>
  );
}

interface Comment {
  id: string;
  author: { initials: string; name: string; gradient: [string, string] };
  text: string;
  timeAgo: string;
  likes: number;
  liked: boolean;
}

const DEMO_COMMENTS: Record<string, Comment[]> = {
  sig1: [
    { id: 'c1', author: { initials: 'JM', name: 'jay_macro', gradient: ['#185FA5', '#7c3aed'] }, text: 'Nice setup, AAPL has been holding $191 really well all week. In at $195.60.', timeAgo: '18m ago', likes: 7, liked: false },
    { id: 'c2', author: { initials: 'SR', name: 'sara_r', gradient: ['#f97316', '#e11d48'] }, text: 'Services growth thesis makes sense. Q2 earnings in 3 weeks could be the catalyst.', timeAgo: '25m ago', likes: 3, liked: false },
  ],
  sig2: [
    { id: 'c3', author: { initials: 'TN', name: 'trader_new', gradient: ['#6b7280', '#9ca3af'] }, text: 'T1 already hit — trailing stop to BE is the right call here.', timeAgo: '3h ago', likes: 11, liked: false },
    { id: 'c4', author: { initials: 'DK', name: 'dk_quant', gradient: ['#0891b2', '#1D9E75'] }, text: 'Put wall at 510 is real. Dark pool prints confirmed it yesterday. Nice read.', timeAgo: '4h ago', likes: 8, liked: false },
    { id: 'c5', author: { initials: 'MC', name: 'mike_chain', gradient: ['#f97316', '#7c3aed'] }, text: 'Are you sizing down into T2 or holding full position?', timeAgo: '5h ago', likes: 2, liked: false },
  ],
  sig3: [
    { id: 'c6', author: { initials: 'AL', name: 'ana_l', gradient: ['#7c3aed', '#185FA5'] }, text: 'META extended is an understatement — this rally has been insane. Zone looks good.', timeAgo: '1h ago', likes: 6, liked: false },
    { id: 'c7', author: { initials: 'PW', name: 'pete_w', gradient: ['#16a34a', '#0891b2'] }, text: 'RL capex is the real risk. $5B/quarter is unsustainable if the narrative shifts.', timeAgo: '2h ago', likes: 4, liked: false },
  ],
  sig4: [
    { id: 'c8', author: { initials: 'JM', name: 'jay_macro', gradient: ['#185FA5', '#7c3aed'] }, text: 'Tough one — macro stops are always brutal. Setup was clean though.', timeAgo: '20h ago', likes: 9, liked: false },
    { id: 'c9', author: { initials: 'SR', name: 'sara_r', gradient: ['#f97316', '#e11d48'] }, text: 'The Fed event was on the calendar for 2 days. Always check macro before entering swings.', timeAgo: '22h ago', likes: 14, liked: false },
    { id: 'c10', author: { initials: 'TN', name: 'trader_new', gradient: ['#6b7280', '#9ca3af'] }, text: 'That SPY drop was insane. Anyone who held through that had nerves of steel.', timeAgo: 'Yesterday', likes: 5, liked: false },
  ],
};

type CommentsSig = Pick<SignalData, 'id' | 'ticker' | 'direction' | 'author'>;

function CommentsSheet({ sig, onClose }: { sig: CommentsSig; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>(() => DEMO_COMMENTS[sig.id] ?? []);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submitComment = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: { initials: 'ME', name: 'me', gradient: ['#185FA5', '#1D9E75'] },
      text: trimmed,
      timeAgo: 'Just now',
      likes: 0,
      liked: false,
    };
    setComments(prev => [newComment, ...prev]);
    setText('');
  };

  const toggleLike = (id: string) => {
    setComments(prev => prev.map(c =>
      c.id === id ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
    ));
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderRadius: '16px 16px 0 0',
        zIndex: 1001,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            Comments · <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>{comments.length}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)', lineHeight: 1 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Signal context chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
          background: 'var(--surface-2)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 800 }}>{sig.ticker}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
            background: sig.direction === 'Long' ? '#E1F5EE' : '#FCEBEB',
            color: sig.direction === 'Long' ? '#0F6E56' : '#A32D2D',
          }}>{sig.direction}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>by {sig.author.name}</span>
        </div>

        {/* Comment list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {comments.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No comments yet. Be the first.
            </div>
          ) : comments.map(c => (
            <div key={c.id} style={{ padding: '10px 16px', display: 'flex', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${c.author.gradient[0]}, ${c.author.gradient[1]})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 10, fontWeight: 700,
              }}>
                {c.author.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{c.author.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{c.timeAgo}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 6 }}>{c.text}</div>
                <button
                  onClick={() => toggleLike(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: c.liked ? '#E24B4A' : 'var(--text-3)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={c.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{c.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div style={{
          borderTop: '1px solid var(--border)', padding: '10px 12px',
          display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
          background: 'var(--surface)',
        }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
            placeholder="Add a comment…"
            rows={1}
            style={{
              flex: 1, resize: 'none', border: '1px solid var(--border)',
              borderRadius: 12, padding: '9px 12px', fontSize: 13,
              background: 'var(--surface-2)', color: 'var(--text)',
              outline: 'none', fontFamily: 'inherit', lineHeight: 1.4,
            }}
          />
          <button
            onClick={submitComment}
            disabled={!text.trim()}
            style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: text.trim() ? '#185FA5' : 'var(--surface-2)',
              color: text.trim() ? '#fff' : 'var(--text-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ── Signal Chart ─────────────────────────────────────────────────────────────

type TF = '1D' | '4H' | '1H' | '15m';


function SignalChart({ sig }: { sig: SignalData }) {
  const [expanded, setExpanded] = useState(false);
  const [tf, setTf] = useState<TF>('1D');
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !expanded) return;

    const isDark = theme === 'dark';
    const bg          = isDark ? '#0d1117' : '#ffffff';
    const textColor   = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
    const gridColor   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 340,
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: { borderColor },
      timeScale: { borderColor, timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // ── Generate seeded OHLC ────────────────────────────────────────
    const isZone = Array.isArray(sig.entry);
    const entryMid = isZone
      ? ((sig.entry as [number,number])[0] + (sig.entry as [number,number])[1]) / 2
      : sig.entry as number;

    const tfSecs: Record<TF, number> = { '1D': 86400, '4H': 14400, '1H': 3600, '15m': 900 };
    const intervalSec = tfSecs[tf];
    const NCANDLES = 60;
    const topTarget = sig.targets[sig.targets.length - 1] ?? sig.targets[0];
    const priceRange = Math.abs(topTarget - sig.stop);

    let s = sig.id.charCodeAt(sig.id.length - 1) * 31 + tf.length * 17 + sig.ticker.charCodeAt(0);
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };

    const isLong = sig.direction === 'Long';
    const startPrice = isLong
      ? sig.stop + (entryMid - sig.stop) * (0.15 + rand() * 0.4)
      : sig.stop - (sig.stop - entryMid) * (0.15 + rand() * 0.4);

    const drift = (sig.currentPrice - startPrice) / NCANDLES;
    const vol   = priceRange * 0.018;

    const now        = Math.floor(Date.now() / 1000);
    const alignedNow = Math.floor(now / intervalSec) * intervalSec;
    const startTime  = alignedNow - NCANDLES * intervalSec;

    let price = startPrice;
    const data = Array.from({ length: NCANDLES }, (_, i) => {
      const open  = price;
      const close = Math.max(
        sig.stop * 0.97,
        Math.min(topTarget * 1.03, open + drift + (rand() - 0.45) * vol)
      );
      const wick = vol * 0.9 * rand();
      const high = Math.max(open, close) + wick;
      const low  = Math.min(open, close) - wick * rand();
      price = close;
      const dp = entryMid > 100 ? 2 : 4;
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        time: (startTime + i * intervalSec) as any,
        open:  parseFloat(open.toFixed(dp)),
        high:  parseFloat(Math.max(open, close, high).toFixed(dp)),
        low:   parseFloat(Math.min(open, close, low).toFixed(dp)),
        close: parseFloat(close.toFixed(dp)),
      };
    });
    candles.setData(data);

    // ── Price lines ─────────────────────────────────────────────────
    candles.createPriceLine({
      price: entryMid,
      color: '#5b9bd5',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: isZone ? 'Zone' : 'Entry',
    });

    candles.createPriceLine({
      price: sig.stop,
      color: '#E24B4A',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: sig.status === 'stopped' ? 'Stop hit' : 'Stop',
    });

    sig.targets.forEach((t, i) => {
      candles.createPriceLine({
        price: t,
        color: sig.status === 'stopped' ? 'rgba(29,158,117,0.4)' : '#1D9E75',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: sig.status === 't1-hit' && i === 0 ? 'T1 ✓' : `T${i + 1}`,
      });
    });

    // ── Show ~35 recent candles ─────────────────────────────────────
    chart.timeScale().setVisibleRange({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (startTime + (NCANDLES - 35) * intervalSec) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to:   (alignedNow + intervalSec * 3) as any,
    });

    const observer = new ResizeObserver(entries => {
      if (entries[0]) chart.resize(entries[0].contentRect.width, 340);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [tf, theme, expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDark = theme === 'dark';
  const tfBg = isDark ? '#0d1117' : 'var(--surface-2)';
  const tfBorder = isDark ? 'rgba(255,255,255,0.06)' : 'var(--border)';
  const btnActive: React.CSSProperties = isDark
    ? { border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.95)' }
    : { border: '1px solid var(--text)', background: 'var(--text)', color: 'var(--bg)' };
  const btnInactive: React.CSSProperties = isDark
    ? { border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.38)' }
    : { border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)' };

  return (
    <div style={{ margin: '10px -14px 12px', border: `1px solid ${tfBorder}`, borderLeft: 'none', borderRight: 'none' }}>
      {/* Toggle row — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px', border: 'none', cursor: 'pointer',
          background: tfBg,
          borderBottom: expanded ? `1px solid ${tfBorder}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }}>
            Chart
          </span>
          <span style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.3)' }}>
            {sig.ticker} · {tf}
          </span>
        </div>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Expanded: TF switcher + chart */}
      {expanded && (
        <>
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 3,
            padding: '6px 10px',
            background: tfBg,
            borderBottom: `1px solid ${tfBorder}`,
          }}>
            {(['1D', '4H', '1H', '15m'] as TF[]).map(t => (
              <button
                key={t}
                onClick={() => setTf(t)}
                style={{ padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, ...(tf === t ? btnActive : btnInactive) }}
              >{t}</button>
            ))}
          </div>
          <div ref={containerRef} />
        </>
      )}
    </div>
  );
}

function SignalCard({ sig, mobile }: { sig: SignalData; mobile: boolean }) {
  const [takenShares, setTakenShares] = useState(sig.takenShares ?? 0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const cfg = STATUS_CFG[sig.status];

  const isZone = Array.isArray(sig.entry);
  const entryLow  = isZone ? (sig.entry as [number, number])[0] : (sig.entry as number);
  const entryHigh = isZone ? (sig.entry as [number, number])[1] : (sig.entry as number);

  const fmtP = (n: number) => {
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return n % 1 === 0 ? String(n) : n.toFixed(2);
  };
  const fmtV = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const t1 = sig.targets[0];
  let progress = 0;
  if (sig.status === 'open' || sig.status === 't1-hit') {
    progress = sig.direction === 'Long'
      ? Math.min(1, Math.max(0, (sig.currentPrice - sig.stop) / (t1 - sig.stop)))
      : Math.min(1, Math.max(0, (sig.stop - sig.currentPrice) / (sig.stop - t1)));
  }

  const entryLabel = sig.orderType === 'Market' ? 'ENTRY'
    : sig.orderType === 'Zone'       ? 'ENTRY ZONE'
    : `ENTRY (${sig.orderType.toUpperCase()})`;

  const colCount = isZone ? null
    : sig.targets.length + 1 + (sig.status === 't1-hit' ? 1 : 0); // +entry +stop +pnlSoFar

  const gridCols = colCount ? `repeat(${colCount}, 1fr)` : '2fr 1fr 1fr';

  return (
    <>
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 12,
      overflow: 'hidden',
      margin: mobile ? '0 12px 12px' : '0 16px 12px',
    }}>
      {/* Update banner */}
      {sig.updateBanner && (
        <div style={{
          background: cfg.bg,
          borderBottom: `1px solid ${cfg.color}30`,
          padding: '7px 14px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>Update ·</span>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{sig.updateBanner}</span>
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{sig.ticker}</span>
          <span style={tag(sig.direction === 'Long' ? 'green' : 'red')}>{sig.direction}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-2)' }}>{sig.assetType}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-2)' }}>{sig.timeframe}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {sig.pnlR && (
              <span style={{ fontSize: 12, fontWeight: 700, color: sig.status === 'stopped' ? '#E24B4A' : '#1D9E75' }}>{sig.pnlR}</span>
            )}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
            }}>{cfg.label}</span>
          </div>
        </div>

        {/* Levels grid */}
        {isZone ? (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 6, marginBottom: 6 }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginBottom: 3 }}>ENTRY ZONE</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>${fmtP(entryLow)}–${fmtP(entryHigh)}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginBottom: 3 }}>TARGET 1</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1D9E75' }}>${fmtP(sig.targets[0])}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: '#E24B4A', fontWeight: 600, marginBottom: 3 }}>STOP</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#E24B4A' }}>${fmtP(sig.stop)}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>
              Now ${sig.currentPrice.toFixed(2)} · {sig.direction === 'Short' ? 'above' : 'below'} zone — waiting
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 6, marginBottom: 10 }}>
              {/* Entry */}
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginBottom: 3 }}>{entryLabel}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>${fmtP(entryLow)}</div>
              </div>
              {/* Targets */}
              {sig.targets.map((t, i) => {
                const isHit = sig.status === 't1-hit' && i === 0;
                return (
                  <div key={i} style={{ background: isHit ? 'rgba(24,95,165,0.08)' : 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, marginBottom: 3, color: isHit ? '#185FA5' : 'var(--text-3)' }}>
                      TARGET {i + 1}{isHit ? ' ✓' : ''}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: sig.status === 'stopped' ? 'var(--text-3)' : isHit ? '#185FA5' : '#1D9E75',
                      textDecoration: isHit ? 'line-through' : 'none',
                    }}>
                      {sig.status === 'stopped' ? 'Not reached' : `$${fmtP(t)}`}
                    </div>
                  </div>
                );
              })}
              {/* P&L so far for t1-hit */}
              {sig.status === 't1-hit' && sig.pnlR && (
                <div style={{ background: 'rgba(24,95,165,0.06)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: '#185FA5', fontWeight: 600, marginBottom: 3 }}>P&L SO FAR</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#185FA5' }}>{sig.pnlR}</div>
                </div>
              )}
              {/* Stop */}
              <div style={{ background: sig.status === 'stopped' ? 'rgba(226,75,74,0.08)' : 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: '#E24B4A', fontWeight: 600, marginBottom: 3 }}>
                  {sig.status === 'stopped' ? 'STOP HIT' : 'STOP'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#E24B4A' }}>${fmtP(sig.stop)}</div>
              </div>
            </div>

            {/* Progress bar */}
            {(sig.status === 'open' || sig.status === 't1-hit') && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>
                  {sig.direction === 'Long'
                    ? <><span>Stop ${fmtP(sig.stop)}</span><span>T1 ${fmtP(t1)}</span></>
                    : <><span>T1 ${fmtP(t1)}</span><span>Stop ${fmtP(sig.stop)}</span></>
                  }
                </div>
                <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'visible', position: 'relative' }}>
                  <div style={{ height: '100%', width: `${progress * 100}%`, background: cfg.color, borderRadius: 3 }} />
                  <div style={{
                    position: 'absolute', top: '50%', left: `${progress * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 10, height: 10, borderRadius: '50%',
                    background: cfg.color, border: '2px solid var(--surface)',
                    pointerEvents: 'none',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 5, textAlign: 'center' }}>
                  Now ${sig.currentPrice.toFixed(2)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Chart */}
        <SignalChart sig={sig} />

        {/* Thesis */}
        <div style={{
          fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 12,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {sig.thesis}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Avatar initials={sig.author.initials} gradient={sig.author.gradient} size={22} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{sig.author.name}</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>·</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-2)' }}>R:R {sig.rr}</span>
          {/* Confidence bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 40, height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${sig.confidence}%`, height: '100%', borderRadius: 2,
                background: sig.confidence >= 70 ? '#1D9E75' : sig.confidence >= 50 ? '#BA7517' : '#E24B4A',
              }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{sig.confidence}%</span>
          </div>
          {/* Comments */}
          <button
            onClick={() => setCommentsOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ fontSize: 11 }}>{(DEMO_COMMENTS[sig.id] ?? []).length}</span>
          </button>
          {/* Views */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-3)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span style={{ fontSize: 11 }}>{fmtV(sig.views)}</span>
          </div>
          {/* Action button */}
          <div style={{ marginLeft: 'auto' }}>
            {sig.status === 'stopped' ? (
              <button
                onClick={() => setReviewOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', padding: '6px 0' }}
              >
                View review →
              </button>
            ) : sig.status === 'watching' ? (
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '6px 14px', background: '#BA7517', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer' }}>
                ⚡ Watch entry
              </button>
            ) : takenShares > 0 ? (
              <button
                onClick={() => setTakenShares(0)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '5px 13px', background: 'transparent', color: '#1D9E75', border: '1.5px solid #1D9E75', borderRadius: 20, cursor: 'pointer' }}
              >
                ✓ Taken · {takenShares} shares
              </button>
            ) : (
              <button
                onClick={() => setTakenShares(10)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, padding: '6px 14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer' }}
              >
                ⚡ Take signal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {reviewOpen && <ReviewSheet sig={sig} onClose={() => setReviewOpen(false)} />}
    {commentsOpen && <CommentsSheet sig={sig} onClose={() => setCommentsOpen(false)} />}
    </>
  );
}

// ── Signal Forum View ────────────────────────────────────────────────────────

function SignalForumView({ mobile }: { mobile: boolean }) {
  const [filter, setFilter] = useState<SigFilter>('all');

  const filtered = ALPHA_SIGNALS.filter(s => {
    if (filter === 'open')     return s.status === 'open' || s.status === 't1-hit';
    if (filter === 'closed')   return s.status === 'stopped';
    if (filter === 'watchlist') return s.status === 'watching';
    return true;
  });

  return (
    <div>
      {/* Stats bar */}
      <div style={{
        display: 'flex', overflowX: 'auto',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: mobile ? '10px 12px' : '10px 16px',
      }} className="scrollbar-hide">
        {[
          { val: '74%',     label: 'Win rate',   color: '#1D9E75' },
          { val: '2.8',     label: 'Avg R:R',    color: '#185FA5' },
          { val: '+38.4%',  label: '90d return', color: '#1D9E75' },
          { val: '142',     label: 'Signals',    color: undefined  },
          { val: '+$2,840', label: 'Your P&L',   color: '#1D9E75' },
        ].map((s, i) => (
          <div key={i} style={{
            flexShrink: 0, textAlign: 'center', padding: '0 16px',
            borderRight: i < 4 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.color ?? 'var(--text)', lineHeight: 1.1 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        padding: mobile ? '10px 12px' : '10px 16px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }} className="scrollbar-hide">
        {(['all', 'open', 'closed', 'watchlist'] as SigFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0, fontSize: 12, fontWeight: 600, padding: '5px 14px',
              border: `1px solid ${filter === f ? '#16a34a' : 'var(--border)'}`,
              borderRadius: 20, cursor: 'pointer',
              background: filter === f ? 'rgba(22,163,74,0.1)' : 'transparent',
              color: filter === f ? '#16a34a' : 'var(--text-2)',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Signal cards */}
      <div style={{ paddingTop: 12, paddingBottom: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-3)', fontSize: 13 }}>
            No signals in this category.
          </div>
        ) : filtered.map(sig => (
          <SignalCard key={sig.id} sig={sig} mobile={mobile} />
        ))}
      </div>
    </div>
  );
}

// ── Investment Chart ─────────────────────────────────────────────────────────

type ITF = '1W' | '1M' | '3M';

function InvestmentChart({ sig }: { sig: InvestmentSignalData }) {
  const [expanded, setExpanded] = useState(false);
  const [tf, setTf] = useState<ITF>('1M');
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !expanded) return;

    const isDark = theme === 'dark';
    const bg          = isDark ? '#0d1117' : '#ffffff';
    const textColor   = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
    const gridColor   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 240,
      layout: { background: { type: ColorType.Solid, color: bg }, textColor },
      grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
      rightPriceScale: { borderColor },
      timeScale: { borderColor, timeVisible: false, secondsVisible: false },
      crosshair: { mode: 1 },
    });

    const area = chart.addSeries(AreaSeries, {
      lineColor: '#185FA5',
      topColor: 'rgba(24,95,165,0.25)',
      bottomColor: 'rgba(24,95,165,0.02)',
      lineWidth: 2,
    });

    // Seeded price data
    const tfDays: Record<ITF, number> = { '1W': 7, '1M': 30, '3M': 91 };
    const days = tfDays[tf];
    let s = sig.id.charCodeAt(sig.id.length - 1) * 31 + tf.length * 17 + sig.ticker.charCodeAt(0);
    const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };

    const endPrice = sig.currentPrice;
    const startPrice = endPrice * (0.82 + rand() * 0.12);
    const drift = (endPrice - startPrice) / days;
    const vol = (sig.priceTarget - sig.entryLimit) * 0.008;

    const now = Math.floor(Date.now() / 1000);
    const DAY = 86400;
    const startTime = Math.floor((now - days * DAY) / DAY) * DAY;

    let price = startPrice;
    const data = Array.from({ length: days }, (_, i) => {
      const value = Math.max(sig.entryLimit * 0.9, price + drift + (rand() - 0.46) * vol);
      price = value;
      const dp = sig.entryLimit > 100 ? 2 : 4;
      return { time: ((startTime + i * DAY) as unknown) as number, value: parseFloat(value.toFixed(dp)) };
    });
    // Make last point exactly currentPrice
    if (data.length > 0) data[data.length - 1].value = sig.currentPrice;
    area.setData(data as Parameters<typeof area.setData>[0]);

    // Price lines
    area.createPriceLine({
      price: sig.entryLimit,
      color: '#5b9bd5',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Entry',
    });
    area.createPriceLine({
      price: sig.priceTarget,
      color: '#1D9E75',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Target',
    });

    const observer = new ResizeObserver(entries => {
      if (entries[0]) chart.resize(entries[0].contentRect.width, 240);
    });
    observer.observe(el);

    return () => { observer.disconnect(); chart.remove(); };
  }, [tf, theme, expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDark = theme === 'dark';
  const tfBg = isDark ? '#0d1117' : 'var(--surface-2)';
  const tfBorder = isDark ? 'rgba(255,255,255,0.06)' : 'var(--border)';
  const btnActive: React.CSSProperties = isDark
    ? { border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.95)' }
    : { border: '1px solid var(--text)', background: 'var(--text)', color: 'var(--bg)' };
  const btnInactive: React.CSSProperties = isDark
    ? { border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.38)' }
    : { border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)' };

  return (
    <div style={{ margin: '10px -14px 12px', border: `1px solid ${tfBorder}`, borderLeft: 'none', borderRight: 'none' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px', border: 'none', cursor: 'pointer',
          background: tfBg,
          borderBottom: expanded ? `1px solid ${tfBorder}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }}>
            Chart
          </span>
          <span style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.3)' }}>
            {sig.ticker} · {tf}
          </span>
        </div>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <>
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 3,
            padding: '6px 10px', background: tfBg, borderBottom: `1px solid ${tfBorder}`,
          }}>
            {(['1W', '1M', '3M'] as ITF[]).map(t => (
              <button
                key={t}
                onClick={() => setTf(t)}
                style={{ padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, ...(tf === t ? btnActive : btnInactive) }}
              >{t}</button>
            ))}
          </div>
          <div ref={containerRef} />
        </>
      )}
    </div>
  );
}

// ── Investment Card ───────────────────────────────────────────────────────────

function InvestmentCard({ sig, mobile }: { sig: InvestmentSignalData; mobile: boolean }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [inPortfolio, setInPortfolio] = useState(false);

  const fmtP = (n: number) => n >= 1000 ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : n.toFixed(2);
  const fmtV = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const upside = (((sig.priceTarget - sig.currentPrice) / sig.currentPrice) * 100).toFixed(1);
  const progress = Math.min(1, Math.max(0, (sig.currentPrice - sig.entryLimit) / (sig.priceTarget - sig.entryLimit)));

  const convictionColor = sig.conviction === 'High' ? '#1D9E75' : sig.conviction === 'Medium' ? '#BA7517' : '#E24B4A';
  const convictionBg   = sig.conviction === 'High' ? 'rgba(29,158,117,0.08)' : sig.conviction === 'Medium' ? 'rgba(186,117,23,0.08)' : 'rgba(226,75,74,0.08)';

  return (
    <>
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid #185FA5',
      borderRadius: 12,
      overflow: 'hidden',
      margin: mobile ? '0 12px 12px' : '0 16px 12px',
    }}>
      <div style={{ padding: '12px 14px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{sig.ticker}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#E6F1FB', color: '#0C447C' }}>Investment</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-2)' }}>{sig.sector}</span>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: 'rgba(29,158,117,0.07)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.3)' }}>Active</span>
          </div>
        </div>

        {/* 3-col price grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginBottom: 3 }}>ENTRY LIMIT</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>${fmtP(sig.entryLimit)}</div>
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: '#1D9E75', fontWeight: 600, marginBottom: 3 }}>PRICE TARGET</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1D9E75' }}>${fmtP(sig.priceTarget)}</div>
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginBottom: 3 }}>NOW</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>${fmtP(sig.currentPrice)}</div>
            <div style={{ fontSize: 9, color: '#1D9E75', fontWeight: 600, marginTop: 1 }}>+{upside}% upside</div>
          </div>
        </div>

        {/* Progress bar: Entry → Now → Target */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>
            <span>Entry ${fmtP(sig.entryLimit)}</span>
            <span>Target ${fmtP(sig.priceTarget)}</span>
          </div>
          <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'visible', position: 'relative' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: '#185FA5', borderRadius: 3 }} />
            <div style={{
              position: 'absolute', top: '50%', left: `${progress * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 10, height: 10, borderRadius: '50%',
              background: '#185FA5', border: '2px solid var(--surface)',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 5, textAlign: 'center' }}>
            Now ${fmtP(sig.currentPrice)}
          </div>
        </div>

        {/* Chart */}
        <InvestmentChart sig={sig} />

        {/* Thesis */}
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12 }}>
          {sig.thesis}
        </div>

        {/* Key Catalysts */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 7 }}>
            Key Catalysts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sig.catalysts.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#185FA5', flexShrink: 0, marginTop: 5 }} />
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Metadata row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 7, padding: '5px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginBottom: 2 }}>TIME HORIZON</div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{sig.timeHorizon}</div>
          </div>
          <div style={{ background: convictionBg, borderRadius: 7, padding: '5px 10px' }}>
            <div style={{ fontSize: 9, color: convictionColor, fontWeight: 600, marginBottom: 2 }}>CONVICTION</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: convictionColor }}>{sig.conviction}</div>
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 7, padding: '5px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, marginBottom: 2 }}>POSITION SIZE</div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{sig.positionSize}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Avatar initials={sig.author.initials} gradient={sig.author.gradient} size={22} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{sig.author.name}</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>· {sig.postedAt}</span>
          {/* Comments */}
          <button
            onClick={() => setCommentsOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ fontSize: 11 }}>{sig.comments}</span>
          </button>
          {/* Views */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-3)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span style={{ fontSize: 11 }}>{fmtV(sig.views)}</span>
          </div>
          {/* Add to portfolio button */}
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setInPortfolio(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer', border: 'none',
                background: inPortfolio ? 'transparent' : '#185FA5',
                color: inPortfolio ? '#185FA5' : '#fff',
                ...(inPortfolio ? { border: '1.5px solid #185FA5' } : {}),
              }}
            >
              {inPortfolio ? '✓ In portfolio' : '+ Add to portfolio'}
            </button>
          </div>
        </div>
      </div>
    </div>

    {commentsOpen && (
      <CommentsSheet
        sig={{ id: sig.id, ticker: sig.ticker, direction: 'Long', author: sig.author }}
        onClose={() => setCommentsOpen(false)}
      />
    )}
    </>
  );
}

// ── Investment Forum View ─────────────────────────────────────────────────────

function InvestmentForumView({ mobile }: { mobile: boolean }) {
  return (
    <div>
      {/* Stats bar */}
      <div style={{
        display: 'flex', overflowX: 'auto',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: mobile ? '10px 12px' : '10px 16px',
      }} className="scrollbar-hide">
        {[
          { val: '2',      label: 'Active ideas',   color: undefined     },
          { val: '+31.4%', label: 'Avg return',     color: '#1D9E75'     },
          { val: '18mo',   label: 'Avg hold',       color: undefined     },
          { val: '82%',    label: 'Win rate',       color: '#1D9E75'     },
          { val: 'High',   label: 'Avg conviction', color: '#185FA5'     },
        ].map((s, i) => (
          <div key={i} style={{
            flexShrink: 0, textAlign: 'center', padding: '0 16px',
            borderRight: i < 4 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.color ?? 'var(--text)', lineHeight: 1.1 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ paddingTop: 12, paddingBottom: 12 }}>
        {INVESTMENT_SIGNALS.map(sig => (
          <InvestmentCard key={sig.id} sig={sig} mobile={mobile} />
        ))}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TagBadge({ label, type }: { label: string; type: 'sentiment' | 'topic' }) {
  let bg = 'var(--surface-2)', color = 'var(--text-2)', border = '1px solid var(--border)';
  if (type === 'sentiment') {
    if (label === 'Bullish') { bg = 'rgba(22,163,74,0.12)'; color = '#16a34a'; border = '1px solid rgba(22,163,74,0.25)'; }
    if (label === 'Bearish') { bg = 'rgba(220,38,38,0.12)'; color = '#dc2626'; border = '1px solid rgba(220,38,38,0.25)'; }
    if (label === 'Hot')     { bg = 'rgba(217,119,6,0.14)';  color = '#d97706'; border = '1px solid rgba(217,119,6,0.25)'; }
  }
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: bg, color, border }}>
      {label}
    </span>
  );
}

function Avatar({ initials, gradient, size = 28 }: { initials: string; gradient: [string, string]; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.35, fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

function VoteButton({ direction, score }: { direction: 'up' | 'down'; score?: number }) {
  const [voted, setVoted] = useState(false);
  return (
    <button
      onClick={() => setVoted(v => !v)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
        color: voted && direction === 'up' ? 'var(--blue)' : 'var(--text-3)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
      }}
    >
      {direction === 'up' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
      {score !== undefined && (
        <span style={{ fontSize: 11, fontWeight: 700, color: voted ? 'var(--blue)' : 'var(--text)', lineHeight: 1 }}>{score}</span>
      )}
    </button>
  );
}

function ThreadRow({ thread, mobile = false, forumId }: { thread: Thread; mobile?: boolean; forumId: string }) {
  const navigate = useNavigate();
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const views = thread.views >= 1000 ? `${(thread.views / 1000).toFixed(1)}k` : String(thread.views);
  const score = thread.score + (vote === 'up' ? 1 : vote === 'down' ? -1 : 0);

  const castVote = (dir: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    setVote(v => v === dir ? null : dir);
  };

  return (
    <div
      className="trade-card"
      onClick={() => navigate(`/forum/thread/${thread.id}?f=${forumId}`)}
      style={{
        display: 'flex', gap: mobile ? 10 : 12,
        padding: mobile ? '14px 12px' : '14px 16px',
        marginBottom: 1, cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        borderRadius: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 28 }}>
        <button
          onClick={e => castVote('up', e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', color: vote === 'up' ? 'var(--blue)' : 'var(--text-3)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <span style={{ fontSize: 11, fontWeight: 700, color: vote === 'up' ? 'var(--blue)' : vote === 'down' ? 'var(--red)' : 'var(--text)', lineHeight: 1 }}>{score}</span>
        <button
          onClick={e => castVote('down', e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', color: vote === 'down' ? 'var(--red)' : 'var(--text-3)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {thread.tags.map(t => <TagBadge key={t.label} label={t.label} type={t.type} />)}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 5, lineHeight: 1.4 }}>
          {thread.title}
        </div>
        <div style={{
          fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {thread.preview}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar initials={thread.author.initials} gradient={thread.author.gradient} size={20} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{thread.author.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{thread.timeAgo}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span style={{ fontSize: 11 }}>{thread.replies}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-3)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span style={{ fontSize: 11 }}>{views}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ForumPage() {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ForumTab>('hot');
  const [activeCategory, setActiveCategory] = useState('all');
  const [groupPhotos, setGroupPhotos] = useState<Record<string, string>>({});
  const [bannerPhotos, setBannerPhotos] = useState<Record<string, string>>({});
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result)
        setGroupPhotos(p => ({ ...p, [activeForum]: ev.target!.result as string }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result)
        setBannerPhotos(p => ({ ...p, [activeForum]: ev.target!.result as string }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const groupInitials = (name: string) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const activeForum = searchParams.get('f') ?? MY_FORUMS[0].id;
  const setActiveForum = (id: string) => {
    setSearchParams({ f: id });
    setActiveCategory('all');
  };

  const forum = MY_FORUMS.find(f => f.id === activeForum) ?? MY_FORUMS[0];

  const filtered = forum.threads.filter(t =>
    activeCategory === 'all' || t.category === activeCategory
  );
  const sorted = [...filtered].sort((a, b) => {
    if (activeTab === 'hot') return b.score - a.score;
    if (activeTab === 'top') return b.views - a.views;
    return 0;
  });

  const typeBadge = (type: Forum['type'], price?: number) => {
    const styles: Record<string, React.CSSProperties> = {
      open:   { background: 'rgba(22,163,74,0.1)',  color: '#16a34a', border: '1px solid rgba(22,163,74,0.25)' },
      closed: { background: 'var(--surface-2)',      color: 'var(--text-3)', border: '1px solid var(--border)' },
      paid:   { background: 'rgba(202,138,4,0.1)',  color: '#ca8a04', border: '1px solid rgba(202,138,4,0.25)' },
    };
    return (
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, ...styles[type] }}>
        {type === 'paid' ? `paid · $${price}/mo` : type}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>

      {/* ── Forum selector strip ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        overflowX: 'auto', padding: isMobile ? '10px 12px' : '12px 16px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }} className="scrollbar-hide">
        {MY_FORUMS.map(f => {
          const active = activeForum === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveForum(f.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                fontSize: 12, fontWeight: 600, padding: '6px 14px',
                border: `1px solid ${active ? f.color : 'var(--border)'}`,
                borderRadius: 20, cursor: 'pointer',
                background: active ? `${f.color}18` : 'transparent',
                color: active ? f.color : 'var(--text-2)',
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: f.color, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {groupPhotos[f.id]
                  ? <img src={groupPhotos[f.id]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : null}
              </div>
              {f.name}
            </button>
          );
        })}
        <button
          onClick={() => navigate('/forum/discover')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            fontSize: 12, fontWeight: 600, padding: '6px 14px',
            border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer',
            background: 'transparent', color: 'var(--text-3)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Discover
        </button>
      </div>

      {/* ── Forum header ─────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>

        {/* Banner */}
        {(() => {
          const bannerH = isMobile ? 130 : 170;
          const avatarSz = isMobile ? 48 : 58;
          const px = isMobile ? 12 : 16;
          return (
            <>
              <div style={{ position: 'relative', height: bannerH }}>
                {/* Banner image — clipped separately so avatar can overflow */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 0 }}>
                  {bannerPhotos[forum.id]
                    ? <img src={bannerPhotos[forum.id]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{
                        width: '100%', height: '100%',
                        background: `linear-gradient(135deg, ${forum.color}55 0%, ${forum.color}22 60%, transparent 100%)`,
                        backgroundColor: 'var(--surface-2)',
                      }} />
                  }
                </div>
                {/* Banner upload button */}
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  title="Change banner"
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(0,0,0,0.35)', border: 'none',
                    color: '#fff', fontSize: 11, fontWeight: 600, backdropFilter: 'blur(4px)',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Edit cover
                </button>
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />

                {/* Group avatar — overlapping bottom of banner */}
                <div style={{ position: 'absolute', bottom: -(avatarSz / 2), left: px }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: avatarSz, height: avatarSz, borderRadius: 16,
                      background: forum.color, overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '3px solid var(--surface)', boxSizing: 'border-box',
                    }}>
                      {groupPhotos[forum.id]
                        ? <img src={groupPhotos[forum.id]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? 16 : 20 }}>
                            {groupInitials(forum.name)}
                          </span>
                      }
                    </div>
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      title="Change group photo"
                      style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 20, height: 20, borderRadius: '50%', padding: 0,
                        background: 'var(--surface)', border: '1.5px solid var(--border)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </div>
                </div>
              </div>

              {/* Info + controls row */}
              <div style={{
                paddingTop: avatarSz / 2 + 8,
                paddingBottom: 12,
                paddingLeft: px,
                paddingRight: px,
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 8,
              }}>
                <div style={{ paddingLeft: avatarSz + 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: isMobile ? 16 : 19, fontWeight: 800, color: forum.color, margin: 0 }}>
                      {forum.name}
                    </h1>
                    {typeBadge(forum.type, forum.price)}
                    {(() => {
                      const gt = GROUP_TYPE_CFG[forum.groupType];
                      return (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: gt.bg, color: gt.color }}>
                          {gt.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{forum.memberCount} members</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>·</span>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{forum.onlineCount} online</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {!forum.isSignalForum && (['hot', 'latest', 'top'] as ForumTab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      style={{
                        fontSize: 12, fontWeight: 600, padding: '5px 12px',
                        border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer',
                        background: activeTab === t ? 'var(--surface-2)' : 'transparent',
                        color: activeTab === t ? 'var(--text)' : 'var(--text-3)',
                      }}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                  <button
                    onClick={() => forum.isSignalForum
                      ? navigate(`/forum/signal/new?f=${forum.id}`)
                      : navigate(`/forum/new?f=${forum.id}`)
                    }
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 700, padding: '5px 14px',
                      background: forum.color, color: '#fff',
                      border: 'none', borderRadius: 20, cursor: 'pointer',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    {forum.isSignalForum ? (isMobile ? 'Signal' : 'New Signal') : (isMobile ? 'Post' : 'New Post')}
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── Signal Forum View or regular thread list ──────────────────── */}
      {forum.isInvestmentForum ? (
        <InvestmentForumView mobile={isMobile} />
      ) : forum.isSignalForum ? (
        <SignalForumView mobile={isMobile} />
      ) : (
        <>
          {/* ── Category chips ─────────────────────────────────────────── */}
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            padding: isMobile ? '10px 12px' : '10px 16px',
            background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          }} className="scrollbar-hide">
            {forum.categories.map(cat => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    flexShrink: 0, fontSize: 12, fontWeight: 600, padding: '5px 14px',
                    border: `1px solid ${active ? forum.color : 'var(--border)'}`,
                    borderRadius: 20, cursor: 'pointer',
                    background: active ? `${forum.color}18` : 'transparent',
                    color: active ? forum.color : 'var(--text-2)',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* ── Thread list ────────────────────────────────────────────── */}
          <div>
            {sorted.map(thread => (
              <ThreadRow key={thread.id} thread={thread} mobile={isMobile} forumId={forum.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
