import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { currentUser } from '../data/demo';
import { useMobile } from '../hooks/useMobile';
import { useMT5Accounts, connectMT5Account, syncMT5Account } from '../hooks/useMT5Accounts';
import type { MT5Account } from '../types/mt5account';

type Tab = 'profile' | 'notifications' | 'security' | 'billing' | 'connections';

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: on ? '#16a34a' : 'var(--border-emphasis)',
        position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 19 : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: '#e8e8e8', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg)', border: '0.5px solid var(--border)',
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
      padding: '12px 0', borderBottom: '0.5px solid var(--border-emphasis)',
      gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Card({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `0.5px solid ${danger ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
      borderRadius: 14, padding: '20px 24px', marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function CardTitle({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 700, color: danger ? '#ef4444' : 'var(--text)', marginBottom: 4 }}>
      {children}
    </div>
  );
}

function CardDesc({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 16, lineHeight: 1.5 }}>
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
      ? { background: '#16a34a', color: '#ffffff', border: 'none' }
      : variant === 'danger'
      ? { background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }
      : { background: 'var(--surface2)', color: 'var(--text)', border: '0.5px solid var(--border)' }),
  };
  return <button onClick={onClick} style={styles}>{children}</button>;
}

// ── Tab: Connections ─────────────────────────────────────────────────────────

// Known servers grouped by broker/firm for the dropdown
const KNOWN_SERVERS = [
  // ── Prop Firms ──
  { group: 'FTMO',           servers: ['FTMO-Demo', 'FTMO-Demo2', 'FTMO-Server', 'FTMO-Server2'] },
  { group: 'The Funded Trader', servers: ['TheFundedTrader-Live', 'TheFundedTrader-Demo'] },
  { group: 'Apex',           servers: ['ApexFuturesUSA', 'Apex-Live'] },
  { group: 'E8 Funding',     servers: ['E8FundingFX-Live', 'E8FundingFX-Demo'] },
  { group: 'FundedNext',     servers: ['FundedNext-Live', 'FundedNext-Demo'] },
  { group: 'MyFundedFX',     servers: ['MyFundedFX-Demo', 'MyFundedFX-Live'] },
  { group: 'True Forex Funds', servers: ['TrueForexFunds-Live', 'TrueForexFunds-Demo'] },
  // ── Retail Brokers ──
  { group: 'IC Markets',     servers: ['ICMarketsSC-Demo', 'ICMarketsSC-Live', 'ICMarketsSC-Live2', 'ICMarketsSC-Live3'] },
  { group: 'Pepperstone',    servers: ['Pepperstone-Demo', 'Pepperstone-Live', 'Pepperstone-Live01'] },
  { group: 'XM',             servers: ['XMGlobal-Demo 3', 'XMGlobal-Real 3', 'XMGlobal-Real 15'] },
  { group: 'Exness',         servers: ['Exness-Trial', 'Exness-Real'] },
  { group: 'FxPro',          servers: ['FxPro-MT5', 'FxPro-MT5 Demo'] },
  { group: 'Tickmill',       servers: ['Tickmill-Demo', 'Tickmill-Live'] },
  { group: 'Vantage',        servers: ['Vantage-Demo', 'Vantage-Live'] },
  { group: 'OANDA',          servers: ['OANDA-v20 Practice', 'OANDA-v20 Live'] },
  { group: 'MetaQuotes',     servers: ['MetaQuotes-Demo'] },
  { group: 'Other',          servers: ['Other (type below)'] },
];

const STATUS_CFG = {
  connected:  { color: '#22c55e',  bg: '#0d1f12',  border: '#1a3a22',  dot: '#22c55e',  label: 'Connected' },
  connecting: { color: '#f59e0b',   bg: 'var(--amber-bg)',   border: 'var(--amber-border)',   dot: '#f59e0b',   label: 'Connecting…' },
  syncing:    { color: '#f59e0b',   bg: 'var(--amber-bg)',   border: 'var(--amber-border)',   dot: '#f59e0b',   label: 'Syncing…' },
  error:      { color: '#ef4444',    bg: '#1f0d0d',    border: '#3a1a1a',    dot: '#ef4444',    label: 'Error' },
};

function ConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: MT5Account) => void;
}) {
  const [login,     setLogin]     = useState('');
  const [password,  setPassword]  = useState('');
  const [server,    setServer]    = useState('');
  const [customServer, setCustomServer] = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const effectiveServer = server === 'Other (type below)' ? customServer.trim() : server;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!login || !password || !effectiveServer) return;
    setLoading(true);
    setError('');
    try {
      const account = await connectMT5Account(login, password, effectiveServer);
      onConnected(account);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)',
    border: '0.5px solid var(--border)', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: 'var(--text)',
    fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
  };

  return (
    /* Backdrop */
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 14, padding: 28, width: '100%', maxWidth: 420,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Connect MT5 account</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 3 }}>
              Any MT5 account — prop firm or retail broker
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Login */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
              Login ID
            </label>
            <input
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="e.g. 1234567"
              style={fieldStyle}
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your MT5 password"
                style={{ ...fieldStyle, paddingRight: 38 }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 0,
                }}
              >
                {showPass ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
              Your password is sent directly to the MT5 server for validation and is never stored.
            </div>
          </div>

          {/* Server */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
              Broker server
            </label>
            <select
              value={server}
              onChange={e => setServer(e.target.value)}
              style={{ ...fieldStyle, cursor: 'pointer', appearance: 'none' as const }}
            >
              <option value="" disabled>Select your broker server…</option>
              {KNOWN_SERVERS.map(({ group, servers }) => (
                <optgroup key={group} label={group}>
                  {servers.map(s => <option key={s} value={s}>{s}</option>)}
                </optgroup>
              ))}
            </select>

            {server === 'Other (type below)' && (
              <input
                value={customServer}
                onChange={e => setCustomServer(e.target.value)}
                placeholder="e.g. MyBroker-Server"
                style={{ ...fieldStyle, marginTop: 8 }}
                autoComplete="off"
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontSize: 12, color: '#ef4444', background: '#1f0d0d',
              border: '0.5px solid #3a1a1a', borderRadius: 8,
              padding: '9px 12px', marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !login || !password || !effectiveServer}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 8,
              background: loading ? '#1a1a1a' : '#0d1a27',
              color: loading ? '#505050' : '#1d9bf0',
              border: '0.5px solid #1a3a5c',
              fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            )}
            {loading ? 'Connecting…' : 'Connect account'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AccountCard({
  account,
  onRemove,
  onSync,
}: {
  account: MT5Account;
  onRemove: (id: string) => void;
  onSync: (account: MT5Account) => Promise<void>;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const cfg = STATUS_CFG[account.status];

  async function handleSync() {
    setSyncing(true);
    try { await onSync(account); } finally { setSyncing(false); }
  }

  const formatSync = (iso: string | null) => {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      background: 'var(--bg)', border: '0.5px solid var(--border)',
      borderRadius: 10, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
    }}>
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
        background: '#0d1a27', border: '0.5px solid #1a3a5c',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" strokeWidth="1.8" strokeLinecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            {account.firm} · #{account.login}
          </span>
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 20,
            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }} />
            {cfg.label}
          </span>
          {account.accountType === 'demo' && (
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20,
              background: 'var(--surface2)', border: '0.5px solid var(--border)',
              color: 'var(--text-4)',
            }}>
              Demo
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span>{account.server}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            Balance: <span style={{ color: 'var(--text-3)' }}>${account.balance.toLocaleString()}</span>
          </span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            Equity: <span style={{ color: 'var(--text-3)' }}>${account.equity.toLocaleString()}</span>
          </span>
          <span>Synced: {formatSync(account.lastSync)}</span>
        </div>
        {account.status === 'error' && account.errorMessage && (
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{account.errorMessage}</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {account.metaApiAccountId && !confirmRemove && (
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Sync balance & equity"
            style={{
              background: 'none', border: '0.5px solid var(--border)',
              borderRadius: 7, padding: '5px 10px', fontSize: 12,
              color: 'var(--text-4)', cursor: syncing ? 'wait' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <svg
              width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }}
            >
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
        )}
        {!confirmRemove ? (
          <button
            onClick={() => setConfirmRemove(true)}
            style={{
              background: 'none', border: '0.5px solid var(--border)',
              borderRadius: 7, padding: '5px 12px', fontSize: 12,
              color: 'var(--text-4)', cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3a1a1a'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
          >
            Disconnect
          </button>
        ) : (
          <>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Remove?</span>
            <button
              onClick={() => onRemove(account.id)}
              style={{
                background: '#1f0d0d', border: '0.5px solid #3a1a1a',
                borderRadius: 7, padding: '5px 12px', fontSize: 12,
                color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              style={{
                background: 'none', border: '0.5px solid var(--border)',
                borderRadius: 7, padding: '5px 12px', fontSize: 12,
                color: 'var(--text-4)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ConnectionsTab() {
  const { accounts, addAccount, removeAccount, updateAccount } = useMT5Accounts();
  const [modalOpen, setModalOpen] = useState(false);

  async function handleSync(account: MT5Account) {
    updateAccount(account.id, { status: 'syncing' });
    try {
      const patch = await syncMT5Account(account);
      updateAccount(account.id, { ...patch, status: 'connected' });
    } catch {
      updateAccount(account.id, { status: 'error', errorMessage: 'Sync failed. Check your connection.' });
    }
  }

  return (
    <>
      <Card>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 12 }}>
          <div>
            <CardTitle>MetaTrader 5 accounts</CardTitle>
            <CardDesc>
              Connect any MT5 account — prop firm or retail broker. Trades sync automatically, no EA required.
            </CardDesc>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              flexShrink: 0, background: '#0d1a27', color: '#1d9bf0',
              border: '0.5px solid #1a3a5c', borderRadius: 8,
              padding: '7px 16px', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Connect account
          </button>
        </div>

        {/* Account list or empty state */}
        {accounts.length === 0 ? (
          <div style={{
            border: '1px dashed var(--border)', borderRadius: 10,
            padding: '32px 24px', textAlign: 'center', marginTop: 8,
          }}>
            <div style={{ marginBottom: 8 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto' }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>No accounts connected</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              Add your MT5 login to start syncing trades and tracking challenge progress
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {accounts.map(a => (
              <AccountCard key={a.id} account={a} onRemove={removeAccount} onSync={handleSync} />
            ))}
          </div>
        )}
      </Card>

      {/* How it works */}
      <Card>
        <CardTitle>How it works</CardTitle>
        <CardDesc>Your credentials are used only to fetch account data — never stored.</CardDesc>
        {[
          { icon: '1', text: 'Enter the login ID, password, and server name from your MT5 terminal' },
          { icon: '2', text: 'Candl. connects to the MT5 server and fetches your account info and trade history' },
          { icon: '3', text: 'Closed trades appear in your feed automatically. Challenge rules update in real time' },
          { icon: '4', text: 'Your password is transmitted over HTTPS and never stored on Candl. servers' },
        ].map(({ icon, text }) => (
          <div key={icon} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '10px 0', borderBottom: icon !== '4' ? '0.5px solid var(--border-emphasis)' : 'none',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: '#1a1a1a', border: '0.5px solid #2a2a2a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#555555',
            }}>
              {icon}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </Card>

      {modalOpen && (
        <ConnectModal
          onClose={() => setModalOpen(false)}
          onConnected={addAccount}
        />
      )}
    </>
  );
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
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG · max 2MB</span>
          </div>
        </div>

        <FieldRow label="Display name">
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </FieldRow>
        <FieldRow label="Username" hint={`tradeflow.io/@${username}`}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-4)' }}>@</span>
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
            { val: '+31%', lbl: 'YTD return', positive: true },
            { val: '68%',  lbl: 'Win rate',   positive: true },
            { val: '2.4',  lbl: 'Avg R:R',    positive: false },
          ].map(({ val, lbl, positive }) => (
            <div key={lbl} style={{
              flex: 1, background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: 10, padding: '12px 14px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: positive ? 'var(--green)' : 'var(--text)', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.5px' }}>{lbl}</div>
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
          borderRadius: 9, marginBottom: 16, fontSize: 12, color: '#22c55e',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
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
          background: 'var(--green-bg)', border: '0.5px solid var(--green-border)',
          borderRadius: 20, padding: '4px 12px', marginBottom: 14,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>Pro Plan · active</span>
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
              fontSize: 12, color: 'var(--text-3)', padding: '6px 0',
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: i < arr.length - 1 ? '0.5px solid var(--border-emphasis)' : 'none',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
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
              padding: '12px 0', borderBottom: '0.5px solid var(--border-emphasis)',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{date}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
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
  {
    id: 'connections',
    label: 'Connections',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isMobile = useMobile();

  const sectionLabel: Record<Tab, string> = {
    profile: 'Profile & account',
    notifications: 'Notifications',
    security: 'Security & privacy',
    billing: 'Billing & subscription',
    connections: 'Connections & integrations',
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
                padding: '7px 14px', borderRadius: 20, flexShrink: 0,
                background: tab === id ? (isLight ? '#f0fdf4' : '#0d1a27') : 'var(--surface)',
                color: tab === id ? '#16a34a' : 'var(--text-3)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: tab === id ? (isLight ? '0.5px solid #bbf7d0' : 'none') : '0.5px solid var(--border)',
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
          borderRight: '0.5px solid var(--border)',
          padding: '20px 0',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
            color: 'var(--text-muted)', textTransform: 'uppercase',
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
                padding: '9px 20px', border: 'none',
                borderLeft: `2px solid ${tab === id ? '#16a34a' : 'transparent'}`,
                background: tab === id ? (isLight ? '#f0fdf4' : 'rgba(22,163,74,0.06)') : 'transparent',
                color: tab === id ? '#16a34a' : 'var(--text-3)',
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
          fontSize: 10, fontWeight: 700, letterSpacing: 2,
          color: 'var(--text-muted)', textTransform: 'uppercase',
          marginBottom: 24, paddingBottom: 10,
          borderBottom: '0.5px solid var(--border)',
        }}>
          {sectionLabel[tab]}
        </div>

        {tab === 'profile'       && <ProfileTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'security'      && <SecurityTab />}
        {tab === 'billing'       && <BillingTab />}
        {tab === 'connections'   && <ConnectionsTab />}
      </div>
    </div>
  );
}
