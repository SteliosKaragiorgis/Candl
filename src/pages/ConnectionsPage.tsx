import { useState } from 'react';
import { useMobile } from '../hooks/useMobile';
import { useMT5Accounts, connectMT5Account } from '../hooks/useMT5Accounts';
import type { MT5Account } from '../types/mt5account';

// ── Known servers grouped by firm ────────────────────────────────────────────

const KNOWN_SERVERS = [
  { group: 'FTMO',       servers: ['FTMO-Demo', 'FTMO-Demo2', 'FTMO-Server', 'FTMO-Server2'] },
  { group: 'TFT',        servers: ['TheFundedTrader-Live', 'TheFundedTrader-Demo'] },
  { group: 'Apex',       servers: ['ApexFuturesUSA', 'Apex-Live'] },
  { group: 'E8',         servers: ['E8FundingFX-Live', 'E8FundingFX-Demo'] },
  { group: 'FundedNext', servers: ['FundedNext-Live', 'FundedNext-Demo'] },
  { group: 'Other',      servers: ['Other (type below)'] },
];

const STATUS_CFG = {
  connected:  { color: '#22c55e', bg: '#0d1f12', border: '#1a3a22', label: 'Connected' },
  connecting: { color: '#1d9bf0',  bg: '#0d1a27',  border: '#1a3a5c',  label: 'Connecting…' },
  syncing:    { color: '#1d9bf0',  bg: '#0d1a27',  border: '#1a3a5c',  label: 'Syncing…' },
  error:      { color: '#ef4444',   bg: '#1f0d0d',   border: '#3a1a1a',   label: 'Error' },
};

// ── Primitives ────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 14,
      padding: '20px 24px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Connect modal ─────────────────────────────────────────────────────────────

function ConnectModal({ onClose, onConnected }: {
  onClose: () => void;
  onConnected: (account: MT5Account) => void;
}) {
  const [login,        setLogin]        = useState('');
  const [password,     setPassword]     = useState('');
  const [server,       setServer]       = useState('');
  const [customServer, setCustomServer] = useState('');
  const [balance,      setBalance]      = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const effectiveServer = server === 'Other (type below)' ? customServer.trim() : server;
  const canSubmit = login && password && effectiveServer && !loading;

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)',
    border: '0.5px solid var(--border)', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: 'var(--text)',
    fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const account = await connectMT5Account(login, password, effectiveServer, balance ? parseFloat(balance) : undefined);
      onConnected(account);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: '#0d1a27', border: '0.5px solid #1a3a5c',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Connect MT5 account</div>
              <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>Use your MetaTrader 5 login credentials</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4, marginTop: -4 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Login ID */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Login ID</label>
            <input
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="e.g. 1234567"
              inputMode="numeric"
              autoComplete="off"
              style={fieldStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your MT5 investor or master password"
                autoComplete="new-password"
                style={{ ...fieldStyle, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 2,
                }}
              >
                {showPass ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5, lineHeight: 1.4 }}>
              Transmitted over HTTPS to the MT5 server. Never stored by Candl.
            </div>
          </div>

          {/* Server */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Broker server</label>
            <div style={{ position: 'relative' }}>
              <select
                value={server}
                onChange={e => setServer(e.target.value)}
                style={{ ...fieldStyle, cursor: 'pointer', paddingRight: 32, appearance: 'none' as const }}
              >
                <option value="" disabled>Select your prop firm server…</option>
                {KNOWN_SERVERS.map(({ group, servers }) => (
                  <optgroup key={group} label={group}>
                    {servers.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                ))}
              </select>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            {server === 'Other (type below)' && (
              <input
                value={customServer}
                onChange={e => setCustomServer(e.target.value)}
                placeholder="e.g. MyBroker-Server (find it in MT5 File → Open Account)"
                autoComplete="off"
                style={{ ...fieldStyle, marginTop: 8 }}
              />
            )}
          </div>

          {/* Account balance */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
              Account balance <span style={{ color: 'var(--text-4)' }}>(optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: 'var(--text-4)', pointerEvents: 'none',
              }}>$</span>
              <input
                value={balance}
                onChange={e => setBalance(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 100000"
                inputMode="decimal"
                style={{ ...fieldStyle, paddingLeft: 24 }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5 }}>
              Your current MT5 account balance. Shown on your challenge card.
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontSize: 12, color: '#ef4444',
              background: '#1f0d0d', border: '0.5px solid #3a1a1a',
              borderRadius: 8, padding: '9px 12px', marginBottom: 16, lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 9,
              background: loading ? '#1a1a1a' : '#0d1a27',
              color: loading ? '#505050' : '#1d9bf0',
              border: '0.5px solid #1a3a5c',
              fontSize: 13, fontWeight: 500, cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: 'spin 0.8s linear infinite' }}>
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

// ── Connected account card ────────────────────────────────────────────────────

function AccountCard({ account, onRemove }: { account: MT5Account; onRemove: (id: string) => void }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const cfg = STATUS_CFG[account.status];

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
      borderRadius: 11, padding: '14px 18px',
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

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            {account.firm} · #{account.login}
          </span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20,
            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
            {cfg.label}
          </span>
          {account.accountType === 'demo' && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 20,
              background: 'var(--surface2)', border: '0.5px solid var(--border)', color: 'var(--text-4)',
            }}>
              Demo
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-4)', display: 'flex', gap: 16, flexWrap: 'wrap', fontVariantNumeric: 'tabular-nums' }}>
          <span>{account.server}</span>
          <span>Balance: <span style={{ color: 'var(--text-3)' }}>${account.balance.toLocaleString()}</span></span>
          <span>Equity: <span style={{ color: 'var(--text-3)' }}>${account.equity.toLocaleString()}</span></span>
          <span>Synced: {formatSync(account.lastSync)}</span>
        </div>
        {account.status === 'error' && account.errorMessage && (
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{account.errorMessage}</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {!confirmRemove ? (
          <button
            onClick={() => setConfirmRemove(true)}
            style={{
              background: 'none', border: '0.5px solid var(--border)',
              borderRadius: 7, padding: '5px 13px', fontSize: 12,
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
                borderRadius: 7, padding: '5px 13px', fontSize: 12,
                color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Yes</button>
            <button
              onClick={() => setConfirmRemove(false)}
              style={{
                background: 'none', border: '0.5px solid var(--border)',
                borderRadius: 7, padding: '5px 13px', fontSize: 12,
                color: 'var(--text-4)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── MT5 section ───────────────────────────────────────────────────────────────

function MT5Section() {
  const { accounts, addAccount, removeAccount } = useMT5Accounts();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Card>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: accounts.length > 0 ? 16 : 0 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: '#0d1a27', border: '0.5px solid #1a3a5c',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>MetaTrader 5</span>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: '#0d1a27', color: '#1d9bf0', border: '0.5px solid #1a3a5c',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Connect account
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, margin: 0 }}>
            Enter your MT5 login ID, password and server. Trades sync automatically — no EA or plugin needed.
          </p>
        </div>
      </div>

      {/* Account list */}
      {accounts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accounts.map(a => (
            <AccountCard key={a.id} account={a} onRemove={removeAccount} />
          ))}
        </div>
      ) : (
        <div style={{
          border: '1px dashed var(--border)', borderRadius: 10,
          padding: '28px 20px', textAlign: 'center', marginTop: 16,
        }}>
          <div style={{ marginBottom: 8 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto', display: 'block' }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>No accounts connected yet</div>
          <div style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 14 }}>
            Connect your FTMO, TFT, Apex, E8 or any MT5 account
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#0d1a27', color: '#1d9bf0', border: '0.5px solid #1a3a5c',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Connect your first account
          </button>
        </div>
      )}

      {modalOpen && (
        <ConnectModal
          onClose={() => setModalOpen(false)}
          onConnected={addAccount}
        />
      )}
    </Card>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>How it works</div>
      <div style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 16, lineHeight: 1.5 }}>
        No EA, no plugins, no setup steps.
      </div>
      {[
        { n: '1', text: 'Enter your MT5 login ID, password, and server name — the same credentials you use in MetaTrader 5' },
        { n: '2', text: 'Candl. connects to the broker server, verifies your credentials, and fetches your account info and trade history' },
        { n: '3', text: 'Closed trades appear in your feed automatically. Challenge rules (daily loss, drawdown) update in real time' },
        { n: '4', text: 'Your password is transmitted over HTTPS directly to the MT5 server. It is never stored on Candl. servers' },
      ].map(({ n, text }, i, arr) => (
        <div key={n} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '10px 0', borderBottom: i < arr.length - 1 ? '0.5px solid var(--border-emphasis)' : 'none',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            background: '#1a1a1a', border: '0.5px solid #2a2a2a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#555555',
          }}>
            {n}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{text}</span>
        </div>
      ))}
    </Card>
  );
}

// ── Coming soon ───────────────────────────────────────────────────────────────

const UPCOMING = [
  { name: 'cTrader',            desc: 'Connect your cTrader account to auto-share trades',             color: '#f59e0b', bg: '#1f1400', border: '#3a2800', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg> },
  { name: 'TradingView',        desc: 'Import alerts and share ideas directly from TradingView',        color: '#1d9bf0',  bg: '#0d1a27',  border: '#1a3a5c',  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { name: 'Interactive Brokers', desc: 'Sync your IBKR portfolio and trade history',                   color: '#ef4444',   bg: '#1f0d0d',   border: '#3a1a1a',   icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
  { name: 'Binance',            desc: 'Connect your Binance account to track and share crypto trades', color: '#f59e0b', bg: '#1f1400', border: '#3a2800', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 19 7 19 17 12 22 5 17 5 7 12 2"/></svg> },
  { name: 'Robinhood',          desc: 'Sync positions and share trades from your Robinhood account',   color: '#22c55e', bg: '#0d1f12', border: '#1a3a22', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  { name: 'eToro',              desc: 'Bring your eToro copy-trading stats to your Candl. profile',    color: '#22c55e', bg: '#0d1f12', border: '#1a3a22', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
];

function UpcomingGrid() {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Coming soon
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {UPCOMING.map(({ name, desc, bg, border, icon }) => (
          <div key={name} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 12, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.72,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface2)', border: '0.5px solid var(--border)', padding: '1px 6px', borderRadius: 4 }}>
                    Soon
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
            <button disabled style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: 'transparent', border: '0.5px solid #1e1e1e', fontSize: 11, fontWeight: 600, color: '#444444', cursor: 'not-allowed' }}>
              Notify me
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const isMobile = useMobile();

  return (
    <div style={{ padding: isMobile ? '0 0 40px' : '0 0 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.4px' }}>
          Connections
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          Link your broker accounts so Candl. can automatically detect your trades and let you share them with one click.
        </p>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Available
      </div>

      <div style={{ marginBottom: 16 }}>
        <MT5Section />
      </div>

      <div style={{ marginBottom: 28 }}>
        <HowItWorks />
      </div>

      <UpcomingGrid />
    </div>
  );
}
