import { useState } from 'react';
import { currentUser } from '../data/demo';
import { useMobile } from '../hooks/useMobile';

type Tab = 'profile' | 'notifications' | 'security' | 'billing';

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: on ? 'var(--blue)' : 'var(--border2)',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 19 : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '7px 12px', fontSize: 13,
  color: 'var(--text)', fontFamily: 'Inter, sans-serif',
  width: 220, outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', appearance: 'none' as const,
};

function FieldRow({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--border2)',
      gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Card({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${danger ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
      borderRadius: 14, padding: '20px 24px', marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function CardTitle({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 700, color: danger ? 'var(--red)' : 'var(--text)', marginBottom: 4 }}>
      {children}
    </div>
  );
}

function CardDesc({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 16, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = 'default' }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger';
}) {
  const styles: React.CSSProperties = {
    padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    fontFamily: 'Inter, sans-serif', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
    ...(variant === 'primary'
      ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)' }
      : variant === 'danger'
      ? { background: 'transparent', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.4)' }
      : { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }),
  };
  return <button onClick={onClick} style={styles}>{children}</button>;
}

// ── Tab: Profile ─────────────────────────────────────────────────────────────

function ProfileTab() {
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [focus, setFocus] = useState('Equities & options');
  const [showStats, setShowStats] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  return (
    <>
      <Card>
        <CardTitle>Identity</CardTitle>
        <CardDesc>How you appear to other traders on the platform</CardDesc>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${currentUser.avatarGradient[0]}, ${currentUser.avatarGradient[1]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16, fontWeight: 700,
          }}>
            {currentUser.initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Btn>Change photo</Btn>
            <span style={{ fontSize: 11, color: 'var(--text4)' }}>JPG, PNG · max 2MB</span>
          </div>
        </div>

        <FieldRow label="Display name">
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </FieldRow>
        <FieldRow label="Username" hint={`tradeflow.io/@${username}`}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text4)' }}>@</span>
            <input value={username} onChange={e => setUsername(e.target.value)} style={{ ...inputStyle, paddingLeft: 24 }} />
          </div>
        </FieldRow>
        <FieldRow label="Bio">
          <input value={bio} onChange={e => setBio(e.target.value)} placeholder="Macro + options trader" style={inputStyle} />
        </FieldRow>
        <FieldRow label="Markets focus">
          <select value={focus} onChange={e => setFocus(e.target.value)} style={selectStyle}>
            {['Equities & options', 'Forex', 'Crypto', 'Futures', 'Macro'].map(v => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </FieldRow>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Btn variant="primary">Save changes</Btn>
        </div>
      </Card>

      <Card>
        <CardTitle>Performance stats</CardTitle>
        <CardDesc>Displayed on your public profile</CardDesc>

        {/* Stat boxes */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[
            { val: '+31%', lbl: 'YTD return' },
            { val: '68%',  lbl: 'Win rate' },
            { val: '2.4',  lbl: 'Avg R:R' },
          ].map(({ val, lbl }) => (
            <div key={lbl} style={{
              flex: 1, background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
              borderRadius: 10, padding: '12px 14px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: 'var(--blue)', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 4, letterSpacing: '0.5px' }}>{lbl}</div>
            </div>
          ))}
        </div>

        <FieldRow label="Show stats publicly" hint="Other traders can see your performance">
          <Toggle on={showStats} onChange={() => setShowStats(o => !o)} />
        </FieldRow>
        <FieldRow label="Show trade history" hint="Past posts visible on your profile">
          <Toggle on={showHistory} onChange={() => setShowHistory(o => !o)} />
        </FieldRow>
      </Card>
    </>
  );
}

// ── Tab: Notifications ────────────────────────────────────────────────────────

function NotificationsTab() {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [followers, setFollowers] = useState(true);
  const [likes, setLikes] = useState(false);
  const [comments, setComments] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [priceMoves, setPriceMoves] = useState(true);
  const [breakingNews, setBreakingNews] = useState(true);
  const [earnings, setEarnings] = useState(false);

  return (
    <>
      <Card>
        <CardTitle>Delivery channels</CardTitle>
        <CardDesc>How you receive alerts</CardDesc>
        <FieldRow label="Push notifications">
          <Toggle on={push} onChange={() => setPush(o => !o)} />
        </FieldRow>
        <FieldRow label="Email digest" hint="Daily summary at market open">
          <Toggle on={email} onChange={() => setEmail(o => !o)} />
        </FieldRow>
      </Card>

      <Card>
        <CardTitle>Social activity</CardTitle>
        <CardDesc>Alerts from other traders</CardDesc>
        <FieldRow label="New followers">
          <Toggle on={followers} onChange={() => setFollowers(o => !o)} />
        </FieldRow>
        <FieldRow label="Likes on your posts">
          <Toggle on={likes} onChange={() => setLikes(o => !o)} />
        </FieldRow>
        <FieldRow label="Comments & replies">
          <Toggle on={comments} onChange={() => setComments(o => !o)} />
        </FieldRow>
        <FieldRow label="Mentions">
          <Toggle on={mentions} onChange={() => setMentions(o => !o)} />
        </FieldRow>
      </Card>

      <Card>
        <CardTitle>Market alerts</CardTitle>
        <CardDesc>Price and news events for your watchlist</CardDesc>
        <FieldRow label="Watchlist price moves" hint="Alert when a stock moves ±3%">
          <Toggle on={priceMoves} onChange={() => setPriceMoves(o => !o)} />
        </FieldRow>
        <FieldRow label="Breaking market news">
          <Toggle on={breakingNews} onChange={() => setBreakingNews(o => !o)} />
        </FieldRow>
        <FieldRow label="Earnings reminders" hint="1 day before held positions">
          <Toggle on={earnings} onChange={() => setEarnings(o => !o)} />
        </FieldRow>
      </Card>
    </>
  );
}

// ── Tab: Security ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const [twofa, setTwofa] = useState(true);
  const [email, setEmail] = useState('jamie@example.com');
  const [publicProfile, setPublicProfile] = useState(true);
  const [searchable, setSearchable] = useState(true);
  const [dms, setDms] = useState('Following only');

  return (
    <>
      <Card>
        {/* Security status banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 9, marginBottom: 16, fontSize: 12, color: 'var(--green)',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
          Account security is strong · 2FA enabled
        </div>

        <CardTitle>Authentication</CardTitle>
        <CardDesc>Protect access to your account</CardDesc>
        <FieldRow label="Two-factor authentication" hint="Authenticator app (TOTP)">
          <Toggle on={twofa} onChange={() => setTwofa(o => !o)} />
        </FieldRow>
        <FieldRow label="Email">
          <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        </FieldRow>
        <FieldRow label="Password">
          <Btn>Change password</Btn>
        </FieldRow>
        <FieldRow label="Active sessions" hint="3 devices signed in">
          <Btn>Manage sessions</Btn>
        </FieldRow>
      </Card>

      <Card>
        <CardTitle>Privacy</CardTitle>
        <CardDesc>Control how others interact with you</CardDesc>
        <FieldRow label="Public profile" hint="Visible to non-followers">
          <Toggle on={publicProfile} onChange={() => setPublicProfile(o => !o)} />
        </FieldRow>
        <FieldRow label="Allow direct messages">
          <select value={dms} onChange={e => setDms(e.target.value)} style={{ ...selectStyle, width: 160 }}>
            {['Following only', 'Everyone', 'Nobody'].map(v => <option key={v}>{v}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="Appear in search results">
          <Toggle on={searchable} onChange={() => setSearchable(o => !o)} />
        </FieldRow>
      </Card>

      <Card danger>
        <CardTitle danger>Danger zone</CardTitle>
        <CardDesc>Irreversible account actions</CardDesc>
        <FieldRow label="Deactivate account" hint="Hides your profile temporarily">
          <Btn variant="danger">Deactivate</Btn>
        </FieldRow>
        <FieldRow label="Delete account" hint="Permanently removes all data">
          <Btn variant="danger">Delete account</Btn>
        </FieldRow>
      </Card>
    </>
  );
}

// ── Tab: Billing ──────────────────────────────────────────────────────────────

function BillingTab() {
  return (
    <>
      <Card>
        {/* Plan badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
          borderRadius: 20, padding: '4px 12px', marginBottom: 14,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>Pro Plan · active</span>
        </div>

        <CardTitle>Current plan</CardTitle>
        <CardDesc>Billed monthly · renews Apr 26, 2026</CardDesc>

        <ul style={{ listStyle: 'none', marginBottom: 16 }}>
          {[
            'Unlimited trade posts',
            'Advanced charting tools',
            'Full analytics & win rate tracking',
            'Priority feed placement',
            'Custom watchlist alerts',
          ].map((f, i, arr) => (
            <li key={f} style={{
              fontSize: 12, color: 'var(--text3)', padding: '6px 0',
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: i < arr.length - 1 ? '1px solid var(--border2)' : 'none',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              {f}
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn variant="primary">Upgrade to Institutional</Btn>
          <Btn>View all plans</Btn>
        </div>
      </Card>

      <Card>
        <CardTitle>Payment method</CardTitle>
        <CardDesc>Used for all subscription charges</CardDesc>
        <FieldRow
          label="VISA ending ···· 4242"
          hint="Expires 08/27"
        >
          <Btn>Update card</Btn>
        </FieldRow>
      </Card>

      <Card>
        <CardTitle>Billing history</CardTitle>
        <CardDesc>Last 3 charges</CardDesc>
        {[
          { date: 'Mar 26, 2026', desc: 'Candl. Pro', amount: '$19.00' },
          { date: 'Feb 26, 2026', desc: 'Candl. Pro', amount: '$19.00' },
          { date: 'Jan 26, 2026', desc: 'Candl. Pro', amount: '$19.00' },
        ].map(({ date, desc, amount }) => (
          <div
            key={date}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0', borderBottom: '1px solid var(--border2)',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{date}</div>
              <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>{desc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {amount}
              </span>
              <Btn>Receipt</Btn>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

// ── Settings sidebar nav ──────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 17H20L18.6 15.6A1.4 1.4 0 0118 14.6V11C18 8.5 16.3 6.4 14 5.7V5a2 2 0 10-4 0v.7C7.7 6.4 6 8.5 6 11v3.6a1.4 1.4 0 01-.6 1L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  },
  {
    id: 'security',
    label: 'Security',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const isMobile = useMobile();

  const sectionLabel: Record<Tab, string> = {
    profile: 'Profile & account',
    notifications: 'Notifications',
    security: 'Security & privacy',
    billing: 'Billing & subscription',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100%',
      padding: isMobile ? '0 0 100px' : 0,
    }}>

      {/* Sidebar nav */}
      {isMobile ? (
        // Mobile: horizontal scrollable pill tabs
        <div style={{
          display: 'flex', gap: 6, padding: '14px 16px 0',
          overflowX: 'auto', flexShrink: 0,
        }} className="scrollbar-hide">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 20, border: 'none', flexShrink: 0,
                background: tab === id ? 'var(--blue)' : 'var(--surface)',
                color: tab === id ? '#fff' : 'var(--text3)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: tab === id ? 'none' : '1px solid var(--border)',
              } as React.CSSProperties}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      ) : (
        // Desktop: left sidebar
        <div style={{
          width: 200, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          padding: '20px 0',
        }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '1.5px',
            color: 'var(--text4)', textTransform: 'uppercase',
            padding: '4px 20px 10px',
          }}>
            Settings
          </div>
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 20px', background: 'none', border: 'none',
                borderLeft: `2px solid ${tab === id ? 'var(--blue)' : 'transparent'}`,
                background: tab === id ? 'rgba(0,71,255,0.05)' : 'transparent',
                color: tab === id ? 'var(--blue)' : 'var(--text3)',
                fontSize: 13, cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
              } as React.CSSProperties}
              onMouseEnter={e => { if (tab !== id) (e.currentTarget.style.background = 'var(--surface2)'); }}
              onMouseLeave={e => { if (tab !== id) (e.currentTarget.style.background = 'transparent'); }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1, padding: isMobile ? '20px 16px' : '32px 40px',
        overflowY: 'auto', minWidth: 0,
      }}>
        {/* Section title */}
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 2,
          color: 'var(--text4)', textTransform: 'uppercase',
          marginBottom: 24, paddingBottom: 10,
          borderBottom: '1px solid var(--border)',
        }}>
          {sectionLabel[tab]}
        </div>

        {tab === 'profile'       && <ProfileTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'security'      && <SecurityTab />}
        {tab === 'billing'       && <BillingTab />}
      </div>
    </div>
  );
}
