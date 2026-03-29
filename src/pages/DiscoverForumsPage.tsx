import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '../hooks/useMobile';

// ── Data ───────────────────────────────────────────────────────────────────

const JOINED_IDS = new Set(['options-flow', 'macro-desk', 'alpha-signals']);

interface ForumThread { id: string; title: string; author: string; replies: number; timeAgo: string; tag: string; tagColor: string; }
type GroupType = 'investment' | 'trading' | 'topic';

const GROUP_TYPE_CFG: Record<GroupType, { label: string; color: string; bg: string }> = {
  investment: { label: 'Investment', color: '#185FA5', bg: '#E6F1FB' },
  trading:    { label: 'Trading',    color: '#1D9E75', bg: '#E1F5EE' },
  topic:      { label: 'Topic',      color: '#7c3aed', bg: '#F3EAFE' },
};

interface Forum {
  id: string; name: string; description: string;
  iconBg: string; iconLabel: string;
  type: 'open' | 'closed' | 'paid';
  price?: number;
  memberCount: string; onlineCount: number;
  groupType: GroupType;
  creator: { initials: string; name: string; gradient: [string, string] };
  threads: ForumThread[];
}

const ALL_FORUMS: Forum[] = [
  {
    id: 'options-flow', name: 'Options Flow Traders',
    description: 'Unusual options activity, flow analysis, and dark pool prints discussed daily.',
    iconBg: '#0047FF', iconLabel: '⚡', type: 'open', groupType: 'trading',
    memberCount: '4.2k', onlineCount: 38,
    creator: { initials: 'JK', name: 'jake_kap', gradient: ['#0047FF', '#00c6ff'] },
    threads: [
      { id: 't1', title: 'Massive call sweep on NVDA — 5,000 contracts at $950', author: 'jake_kap', replies: 84, timeAgo: '2h ago', tag: 'Bullish', tagColor: '#16a34a' },
      { id: 't2', title: 'SPY unusual put activity — 50k contracts 3 weeks out', author: 'flow_watcher', replies: 42, timeAgo: '4h ago', tag: 'Bearish', tagColor: '#dc2626' },
      { id: 't3', title: 'TSLA dark pool prints hitting $280 — accumulation or hedge?', author: 'dp_scanner', replies: 31, timeAgo: '6h ago', tag: 'Neutral', tagColor: '#ca8a04' },
      { id: 't4', title: 'AMD earnings play — IV crush setup this week', author: 'iv_trader', replies: 27, timeAgo: '9h ago', tag: 'Bullish', tagColor: '#16a34a' },
    ],
  },
  {
    id: 'macro-desk', name: 'Macro Desk',
    description: 'Serious macro analysis only. Rates, FX, commodities. Curated membership.',
    iconBg: '#7c3aed', iconLabel: '📊', type: 'closed', groupType: 'topic',
    memberCount: '890', onlineCount: 12,
    creator: { initials: 'SR', name: 'sara_risk', gradient: ['#dc2626', '#f97316'] },
    threads: [
      { id: 't5', title: 'Fed holding rates longer — how are you repositioning?', author: 'sara_risk', replies: 67, timeAgo: '3h ago', tag: 'Macro', tagColor: '#7c3aed' },
      { id: 't6', title: 'DXY breakout above 105 — implications for EM & commodities', author: 'fx_macro', replies: 39, timeAgo: '7h ago', tag: 'FX', tagColor: '#0047FF' },
      { id: 't7', title: 'Oil supply cut surprise — WTI path to $95?', author: 'oil_desk', replies: 22, timeAgo: '1d ago', tag: 'Energy', tagColor: '#ca8a04' },
    ],
  },
  {
    id: 'alpha-signals', name: 'Alpha Signals',
    description: 'Daily trade setups with full thesis, entry zones, and live position updates.',
    iconBg: '#ca8a04', iconLabel: '★', type: 'paid', price: 19, groupType: 'trading',
    memberCount: '320', onlineCount: 21,
    creator: { initials: 'AL', name: 'alex_lev', gradient: ['#16a34a', '#06b6d4'] },
    threads: [],
  },
  {
    id: 'quant-edge', name: 'Quant Edge',
    description: 'Systematic strategies, backtests, and quantitative research for traders.',
    iconBg: '#0891b2', iconLabel: '∑', type: 'open', groupType: 'trading',
    memberCount: '1.1k', onlineCount: 9,
    creator: { initials: 'QE', name: 'quant_ed', gradient: ['#0891b2', '#0047FF'] },
    threads: [
      { id: 't8', title: 'Mean reversion on SPX intraday — backtest results', author: 'quant_ed', replies: 45, timeAgo: '5h ago', tag: 'Strategy', tagColor: '#0891b2' },
      { id: 't9', title: 'Momentum factor performance in 2026 — what changed?', author: 'factor_mod', replies: 18, timeAgo: '12h ago', tag: 'Research', tagColor: '#7c3aed' },
      { id: 't10', title: 'Python backtester for options selling — code share', author: 'algo_pete', replies: 34, timeAgo: '1d ago', tag: 'Code', tagColor: '#0047FF' },
    ],
  },
  {
    id: 'crypto-on-chain', name: 'Crypto On-Chain',
    description: 'On-chain metrics, whale movements, and DeFi analytics discussed in real time.',
    iconBg: '#f97316', iconLabel: '₿', type: 'open', groupType: 'trading',
    memberCount: '2.7k', onlineCount: 44,
    creator: { initials: 'MC', name: 'mike_chain', gradient: ['#f97316', '#7c3aed'] },
    threads: [
      { id: 't11', title: 'BTC whale wallets accumulating again — last time this happened…', author: 'mike_chain', replies: 92, timeAgo: '1h ago', tag: 'BTC', tagColor: '#f97316' },
      { id: 't12', title: 'ETH staking outflows — rotation or distribution?', author: 'eth_watch', replies: 56, timeAgo: '3h ago', tag: 'ETH', tagColor: '#7c3aed' },
      { id: 't13', title: 'DeFi TVL back above $80B — which protocols leading?', author: 'defi_data', replies: 29, timeAgo: '8h ago', tag: 'DeFi', tagColor: '#16a34a' },
    ],
  },
  {
    id: 'earnings-edge', name: 'Earnings Edge',
    description: 'Pre-earnings positioning, IV crush plays, and post-earnings analysis.',
    iconBg: '#16a34a', iconLabel: '📈', type: 'paid', price: 29, groupType: 'investment',
    memberCount: '540', onlineCount: 17,
    creator: { initials: 'EE', name: 'earn_edge', gradient: ['#16a34a', '#ca8a04'] },
    threads: [],
  },
];

const HOW_IT_WORKS = [
  { type: 'open' as const, label: 'Open group', color: '#16a34a', steps: ['Find group in Discover or search', 'Tap "+ Join" — instant access', 'Post, reply, vote immediately'] },
  { type: 'closed' as const, label: 'Closed group', color: '#0047FF', steps: ['Find group, tap "Request Access"', 'Admin reviews and approves/declines', 'Notified when approved — then can post'] },
  { type: 'paid' as const, label: 'Paid group', color: '#ca8a04', steps: ['Find group, see price & preview', 'Subscribe via Stripe — monthly billing', 'Full access while subscribed; lose access if cancelled'] },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function Avatar({ initials, gradient, size = 26 }: { initials: string; gradient: [string, string]; size?: number }) {
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

function StatusBadge({ type, price }: { type: 'open' | 'closed' | 'paid'; price?: number }) {
  const styles: Record<string, React.CSSProperties> = {
    open:   { background: 'rgba(22,163,74,0.15)',  color: '#16a34a', border: '1px solid rgba(22,163,74,0.3)' },
    closed: { background: 'rgba(100,100,120,0.15)', color: 'var(--text-2)', border: '1px solid var(--border)' },
    paid:   { background: 'rgba(202,138,4,0.15)',  color: '#ca8a04', border: '1px solid rgba(202,138,4,0.3)' },
  };
  const labels = { open: 'Open', closed: 'Closed', paid: `Paid · $${price}/mo` };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, ...styles[type] }}>
      {labels[type]}
    </span>
  );
}

// ── Forum Preview Panel ────────────────────────────────────────────────────

function ForumPreview({ forum, onClose, onJoin }: {
  forum: Forum;
  onClose: () => void;
  onJoin: (f: Forum) => void;
}) {
  const isJoined = JOINED_IDS.has(forum.id);
  const isPaid = forum.type === 'paid';

  const lockIcon = (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
      />

      {/* Panel */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 420, maxWidth: '100vw', height: '100vh',
        background: 'var(--surface)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: `${forum.iconBg}22`, border: `1px solid ${forum.iconBg}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            {forum.iconLabel}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{forum.name}</span>
              <StatusBadge type={forum.type} price={forum.price} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {forum.memberCount} members · {forum.onlineCount} online
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Description */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
          {forum.description}
        </div>

        {/* Creator */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar initials={forum.creator.initials} gradient={forum.creator.gradient} size={28} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Created by</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>@{forum.creator.name}</div>
          </div>
        </div>

        {/* Content area */}
        {isPaid && !isJoined ? (
          /* Paid paywall */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', gap: 16 }}>
            {/* Blurred threads teaser */}
            <div style={{ width: '100%', marginBottom: 8, filter: 'blur(6px)', opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ height: 13, width: '80%', background: 'var(--border)', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 11, width: '40%', background: 'var(--border)', borderRadius: 4 }} />
                </div>
              ))}
            </div>
            <div style={{ color: 'var(--text-3)', marginBottom: 4 }}>{lockIcon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Paid members only</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Subscribe to get full access to all threads, signals, and member discussions.
            </div>
            <button
              onClick={() => onJoin(forum)}
              style={{
                width: '100%', padding: '12px', borderRadius: 10,
                background: 'rgba(202,138,4,0.15)', color: '#ca8a04',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                border: '1px solid rgba(202,138,4,0.3)',
              }}
            >
              Subscribe · ${forum.price}/mo
            </button>
          </div>
        ) : (
          /* Open/closed: show threads */
          <div style={{ flex: 1 }}>
            <div style={{ padding: '12px 20px 6px', fontSize: 9, fontWeight: 700, letterSpacing: '1px', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Recent threads
            </div>
            {forum.threads.map((thread, i) => (
              <div key={thread.id} style={{
                padding: '12px 20px',
                borderBottom: i < forum.threads.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: isJoined ? 'pointer' : 'default',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 4, flexShrink: 0, marginTop: 1,
                    background: `${thread.tagColor}18`, color: thread.tagColor,
                  }}>
                    {thread.tag}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                    {thread.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-3)' }}>
                  <span>{thread.author}</span>
                  <span>·</span>
                  <span>{thread.replies} replies</span>
                  <span>·</span>
                  <span>{thread.timeAgo}</span>
                </div>
              </div>
            ))}

            {!isJoined && (
              <div style={{ padding: '14px 20px', background: 'var(--surface-2, var(--bg))', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
                  {forum.type === 'closed'
                    ? 'Request access to post and reply in this group.'
                    : 'Join to post, reply, and vote in this group.'}
                </div>
                <button
                  onClick={() => onJoin(forum)}
                  style={{
                    padding: '10px 28px', borderRadius: 8, border: 'none',
                    background: '#0047FF', color: '#fff',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {forum.type === 'closed' ? 'Request Access' : '+ Join group'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Forum Card ─────────────────────────────────────────────────────────────

function ForumCard({ forum, onPreview }: { forum: Forum; onPreview: (f: Forum) => void }) {
  const navigate = useNavigate();
  const isJoined = JOINED_IDS.has(forum.id);
  const [joined, setJoined] = useState(isJoined);
  const [requested, setRequested] = useState(false);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (joined) { navigate('/forum'); return; }
    if (forum.type === 'open') { setJoined(true); navigate('/forum'); }
    else if (forum.type === 'closed') setRequested(true);
    else navigate('/forum');
  };

  const actionLabel = () => {
    if (joined) return '✓ Joined';
    if (forum.type === 'open') return '+ Join';
    if (forum.type === 'closed') return requested ? 'Requested' : 'Request Access';
    return `Subscribe $${forum.price}/mo`;
  };

  const actionStyle = (): React.CSSProperties => {
    if (joined || requested) return { background: 'transparent', color: 'var(--text-3)', border: '1px solid var(--border)', cursor: joined ? 'pointer' : 'default' };
    if (forum.type === 'open') return { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer' };
    if (forum.type === 'closed') return { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer' };
    return { background: 'rgba(202,138,4,0.12)', color: '#ca8a04', border: '1px solid rgba(202,138,4,0.3)', cursor: 'pointer' };
  };

  return (
    <div
      onClick={() => onPreview(forum)}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column',
        cursor: 'pointer', transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-3)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Icon + badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: `${forum.iconBg}22`, border: `1px solid ${forum.iconBg}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {forum.iconLabel}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <StatusBadge type={forum.type} price={forum.price} />
          {(() => {
            const gt = GROUP_TYPE_CFG[forum.groupType];
            return (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: gt.bg, color: gt.color }}>
                {gt.label}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Name + description */}
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{forum.name}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 16, flex: 1 }}>{forum.description}</div>

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{forum.memberCount}</strong> members
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{forum.onlineCount}</strong> online
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

      {/* Creator + action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar initials={forum.creator.initials} gradient={forum.creator.gradient} size={26} />
        <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, flex: 1 }}>{forum.creator.name}</span>
        <button onClick={handleAction} style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 8, transition: 'opacity 0.15s', ...actionStyle() }}>
          {actionLabel()}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function DiscoverForumsPage() {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [previewForum, setPreviewForum] = useState<Forum | null>(null);
  const [typeFilter, setTypeFilter] = useState<GroupType | 'all'>('all');

  const handleJoin = (forum: Forum) => {
    setPreviewForum(null);
    // For joined forums, navigate into the forum
    if (JOINED_IDS.has(forum.id)) {
      navigate(`/forum?f=${forum.id}`);
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: isMobile ? '16px 12px 80px' : '28px 32px 40px' }}>

      {/* Back link */}
      <button
        onClick={() => navigate('/forum')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-3)', padding: 0 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to Groups
      </button>

      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 14 }}>
        Discover Groups
      </div>

      {/* Type filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {([['all', 'All'], ['investment', 'Investment'], ['trading', 'Trading'], ['topic', 'Topic']] as const).map(([val, label]) => {
          const active = typeFilter === val;
          const gt = val !== 'all' ? GROUP_TYPE_CFG[val] : null;
          return (
            <button
              key={val}
              onClick={() => setTypeFilter(val)}
              style={{
                fontSize: 12, fontWeight: 600, padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${active ? (gt?.color ?? 'var(--text)') : 'var(--border)'}`,
                background: active ? (gt?.bg ?? 'var(--surface-2)') : 'transparent',
                color: active ? (gt?.color ?? 'var(--text)') : 'var(--text-2)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Group grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
        {ALL_FORUMS.filter(f => typeFilter === 'all' || f.groupType === typeFilter).map(forum => (
          <ForumCard key={forum.id} forum={forum} onPreview={setPreviewForum} />
        ))}
      </div>

      {/* How joining works */}
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 24 }}>
        How Joining Works
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 24 : 0 }}>
        {HOW_IT_WORKS.map((col, i) => (
          <div key={col.type} style={{ padding: isMobile ? 0 : '0 32px', borderLeft: !isMobile && i > 0 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.label}</span>
            </div>
            {col.steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: col.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800, marginTop: 1 }}>
                  {idx + 1}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Preview panel */}
      {previewForum && (
        <ForumPreview
          forum={previewForum}
          onClose={() => setPreviewForum(null)}
          onJoin={handleJoin}
        />
      )}
    </div>
  );
}
