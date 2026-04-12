import { useState } from 'react';
import { useMobile } from '../hooks/useMobile';
import { useMT5Accounts, connectMT5Account, syncMT5Account } from '../hooks/useMT5Accounts';
import type { MT5Account } from '../types/mt5account';

// ── Known servers grouped by firm ─────────────────────────────────────────────

const KNOWN_SERVERS = [
  { group: 'FTMO',           servers: ['FTMO-Demo', 'FTMO-Demo2', 'FTMO-Server', 'FTMO-Server2'] },
  { group: 'The Funded Trader', servers: ['TheFundedTrader-Live', 'TheFundedTrader-Demo'] },
  { group: 'Apex',           servers: ['ApexFuturesUSA', 'Apex-Live'] },
  { group: 'E8 Funding',     servers: ['E8FundingFX-Live', 'E8FundingFX-Demo'] },
  { group: 'FundedNext',     servers: ['FundedNext-Live', 'FundedNext-Demo'] },
  { group: 'MyFundedFX',     servers: ['MyFundedFX-Demo', 'MyFundedFX-Live'] },
  { group: 'True Forex Funds', servers: ['TrueForexFunds-Live', 'TrueForexFunds-Demo'] },
  { group: 'IC Markets',     servers: ['ICMarketsSC-Demo', 'ICMarketsSC-Live', 'ICMarketsSC-Live2', 'ICMarketsSC-Live3'] },
  { group: 'Pepperstone',    servers: ['Pepperstone-Demo', 'Pepperstone-Live', 'Pepperstone-Live01'] },
  { group: 'XM',             servers: ['XMGlobal-Demo 3', 'XMGlobal-Real 3', 'XMGlobal-Real 15'] },
  { group: 'Exness',         servers: ['Exness-Trial', 'Exness-Real'] },
  { group: 'FxPro',          servers: ['FxPro-MT5', 'FxPro-MT5 Demo'] },
  { group: 'Tickmill',       servers: ['Tickmill-Demo', 'Tickmill-Live'] },
  { group: 'Vantage',        servers: ['Vantage-Demo', 'Vantage-Live'] },
  { group: 'MetaQuotes',     servers: ['MetaQuotes-Demo'] },
  { group: 'Other',          servers: ['Other (type below)'] },
];

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
    width: '100%',
    background: 'var(--bg-surface)',
    border: '0.5px solid var(--border)',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 13,
    color: 'var(--text-1)',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
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
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: 16,
        padding: 28,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: '#1a1a2e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img src="/mt5-logo.png" alt="MT5" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Connect MT5 account</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Use your MetaTrader 5 login credentials</div>
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
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.4 }}>
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
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }}
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
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
              Your current MT5 account balance. Shown on your challenge card.
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              fontSize: 12,
              color: 'var(--red)',
              background: 'var(--red-bg)',
              border: '0.5px solid var(--red-border)',
              borderRadius: 8,
              padding: '9px 12px',
              marginBottom: 16,
              lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 9,
              background: canSubmit ? 'var(--green)' : 'var(--bg-surface)',
              color: canSubmit ? '#000000' : 'var(--text-4)',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.15s',
            }}
          >
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: 'connections-spin 0.8s linear infinite' }}>
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

// ── Connected account row ─────────────────────────────────────────────────────

function AccountRow({ account, onRemove, onSync }: {
  account: MT5Account;
  onRemove: (id: string) => void;
  onSync: (account: MT5Account) => Promise<void>;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [syncing, setSyncing] = useState(false);

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
      background: 'var(--green-bg)',
      borderTop: '0.5px solid var(--green-border)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      {/* Green dot */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: 'var(--green)', flexShrink: 0,
      }} />

      {/* Account name */}
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>
        {account.firm} · #{account.login}
      </span>

      {/* Balance / Equity */}
      <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
        <span style={{ color: 'var(--text-4)' }}>Balance: </span>
        <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>${account.balance.toLocaleString()}</span>
        {'  '}
        <span style={{ color: 'var(--text-4)' }}>Equity: </span>
        <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>${account.equity.toLocaleString()}</span>
      </span>

      {/* Sync badge */}
      <span style={{
        fontSize: 10,
        color: 'var(--green)',
        background: 'var(--bg-card)',
        padding: '2px 7px',
        borderRadius: 4,
        border: '0.5px solid var(--green-border)',
        marginLeft: 8,
        whiteSpace: 'nowrap',
      }}>
        {formatSync(account.lastSync)}
      </span>

      {/* Sync */}
      {account.metaApiAccountId && (
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            background: 'transparent',
            border: '0.5px solid var(--border)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-3)',
            cursor: syncing ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none"
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

      {/* Remove */}
      {!confirmRemove ? (
        <button
          onClick={() => setConfirmRemove(true)}
          style={{
            background: 'transparent',
            border: '0.5px solid var(--border)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-3)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red-border)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          }}
        >
          Disconnect
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Remove?</span>
          <button
            onClick={() => onRemove(account.id)}
            style={{
              background: 'var(--red-bg)',
              border: '0.5px solid var(--red-border)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              color: 'var(--red)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >Yes</button>
          <button
            onClick={() => setConfirmRemove(false)}
            style={{
              background: 'transparent',
              border: '0.5px solid var(--border)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              color: 'var(--text-3)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── MT5 connection card ───────────────────────────────────────────────────────

function MT5Card() {
  const { accounts, addAccount, removeAccount, updateAccount } = useMT5Accounts();
  const [modalOpen, setModalOpen] = useState(false);
  const isConnected = accounts.length > 0;

  async function handleSync(account: MT5Account) {
    updateAccount(account.id, { status: 'syncing' });
    try {
      const patch = await syncMT5Account(account);
      updateAccount(account.id, { ...patch, status: 'connected' });
    } catch {
      updateAccount(account.id, { status: 'error', errorMessage: 'Sync failed.' });
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `0.5px solid ${isConnected ? 'var(--green-border)' : 'var(--border)'}`,
      borderLeft: `3px solid ${isConnected ? 'var(--green)' : 'var(--border)'}`,
      borderRadius: 10,
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      {/* Main row */}
      <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* MT5 icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: '#1a1a2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img src="/mt5-logo.png" alt="MT5" style={{ width: 34, height: 34, objectFit: 'contain' }} />
        </div>

        {/* Name + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
            MetaTrader 5
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Enter your MT5 login, password and server. Trades sync automatically — no EA needed.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isConnected ? (
            <>
              {/* Pulsing connected indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 500, color: 'var(--green)' }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--green)',
                  animation: 'connections-pulse 2s infinite',
                }} />
                Connected
              </div>

              {/* Add more accounts */}
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  background: 'transparent',
                  border: '0.5px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text-3)',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hard)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)';
                }}
              >
                + Add
              </button>

              {/* Settings icon */}
              <button
                style={{
                  width: 32, height: 32,
                  background: 'transparent',
                  border: '0.5px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                title="Settings"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: 'var(--green)',
                color: '#000000',
                fontSize: 12,
                fontWeight: 600,
                padding: '7px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Connected account rows */}
      {accounts.map(a => (
        <AccountRow key={a.id} account={a} onRemove={removeAccount} onSync={handleSync} />
      ))}

      {/* Empty state inside card */}
      {!isConnected && (
        <div style={{
          borderTop: '0.5px solid var(--border-soft)',
          padding: '20px 16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>No accounts connected yet</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Connect your FTMO, TFT, Apex, E8 or any MT5 account
          </div>
        </div>
      )}

      {modalOpen && (
        <ConnectModal
          onClose={() => setModalOpen(false)}
          onConnected={addAccount}
        />
      )}
    </div>
  );
}

// ── How it works card ─────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: '1', text: <span>Enter your <strong style={{ color: 'var(--text-1)', fontWeight: 500 }}>MT5 login ID, password, and server name</strong> — the same credentials you use in MetaTrader 5</span> },
    { n: '2', text: <span>Candl. connects to the broker server, <strong style={{ color: 'var(--text-1)', fontWeight: 500 }}>verifies your credentials</strong>, and fetches your account info and trade history</span> },
    { n: '3', text: <span>Closed trades appear in your feed <strong style={{ color: 'var(--text-1)', fontWeight: 500 }}>automatically</strong>. Challenge rules (daily loss, drawdown) update in real time</span> },
    { n: '4', text: <span>Your password is transmitted over <strong style={{ color: 'var(--text-1)', fontWeight: 500 }}>HTTPS</strong> directly to the MT5 server. It is <strong style={{ color: 'var(--text-1)', fontWeight: 500 }}>never stored</strong> on Candl. servers</span> },
  ];

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: 10,
      padding: 18,
      marginBottom: 20,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
        How MT5 connection works
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
        No EA, no plugins, no setup steps.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map(({ n, text }, i) => (
          <div key={n} style={{
            display: 'flex',
            gap: 12,
            padding: '10px 0',
            borderBottom: i < steps.length - 1 ? '0.5px solid var(--border-soft)' : 'none',
            paddingBottom: i === steps.length - 1 ? 0 : undefined,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: 'var(--green-bg)',
              border: '1px solid var(--green-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'var(--green)',
              marginTop: 1,
            }}>
              {n}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{text}</span>
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
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes connections-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes connections-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Page header */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '0.5px solid var(--border)',
        padding: '20px 24px',
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
          Connections
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
          Link your broker accounts so Candl. can automatically detect your trades.
        </div>
      </div>

      {/* Page body */}
      <div style={{
        padding: isMobile ? '16px 16px 40px' : '20px 24px 60px',
      }}>
        {/* Available section */}
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          Available
        </div>

        <MT5Card />

        <HowItWorks />
      </div>
    </>
  );
}
