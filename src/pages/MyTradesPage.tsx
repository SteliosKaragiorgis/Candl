import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyTrades } from '../hooks/useMyTrades';
import { useMT5Accounts } from '../hooks/useMT5Accounts';
import TradeStatsBar from '../components/trades/TradeStatsBar';
import EquityCurve from '../components/trades/EquityCurve';
import TradeFilterBar, { type FilterKey, type SortKey } from '../components/trades/TradeFilterBar';
import TradeTable from '../components/trades/TradeTable';
import ShareModal from '../components/share/ShareModal';
import type { Trade } from '../types/trade';

// ─── CSV Import Modal ─────────────────────────────────────────────────────────

function CSVImportModal({ onClose, onImport }: { onClose: () => void; onImport: (file: File) => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [tradeCount, setTradeCount] = useState(0);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function parsePreview(text: string) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) { setError('File appears empty or invalid.'); return 0; }
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    setHeaders(hdrs);
    setPreview(lines.slice(1, 6).map(l => l.split(',').map(v => v.trim().replace(/^"|"$/g, ''))));
    return lines.length - 1;
  }

  async function handleFileSelect(f: File) {
    setError('');
    setFile(f);
    const text = await f.text();
    const count = parsePreview(text);
    setTradeCount(count);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      await onImport(file);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
      setImporting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: 10,
          width: 480,
          maxWidth: '90vw',
          maxHeight: '85dvh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky', top: 0, background: 'var(--bg-card)',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Import trades from CSV</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              Works with MT4, MT5, Tradezella, TraderSync, cTrader, and most brokers
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', fontSize: 20, lineHeight: 1,
            }}
          >×</button>
        </div>

        <div style={{ padding: '16px 18px' }}>
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFileSelect(f);
            }}
            style={{
              border: `1.5px dashed ${dragOver ? 'var(--green-border)' : 'var(--border-hard)'}`,
              background: dragOver ? 'var(--green-bg)' : 'var(--bg-surface)',
              borderRadius: 8,
              padding: 32,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round" style={{ display: 'block', margin: '0 auto 10px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {file ? file.name : 'Drop CSV file here or click to browse'}
            </div>
            {tradeCount > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                {tradeCount} rows found
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />

          {/* Preview table */}
          {preview.length > 0 && (
            <div style={{ marginTop: 14, overflowX: 'auto' }}>
              <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Preview (first 5 rows)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {headers.slice(0, 8).map(h => (
                      <th key={h} style={{ padding: '4px 8px', background: 'var(--bg-surface)', color: 'var(--text-3)', fontWeight: 500, textAlign: 'left', border: '0.5px solid var(--border)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {row.slice(0, 8).map((cell, j) => (
                        <td key={j} style={{ padding: '4px 8px', color: 'var(--text-2)', border: '0.5px solid var(--border)' }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 10 }}>{error}</div>
          )}

          {file && (
            <button
              onClick={handleImport}
              disabled={importing}
              style={{
                width: '100%',
                marginTop: 14,
                background: 'var(--green)',
                color: '#000',
                border: 'none',
                borderRadius: 6,
                padding: '9px',
                fontSize: 13,
                fontWeight: 600,
                cursor: importing ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                opacity: importing ? 0.7 : 1,
              }}
            >
              {importing ? 'Importing…' : `Import ${tradeCount} trades`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Trade Modal ─────────────────────────────────────────────────────────

function AddTradeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Partial<Trade>) => void }) {
  const [form, setForm] = useState({
    symbol: '', direction: 'LONG' as 'LONG' | 'SHORT',
    entry: '', exit: '', stopLoss: '', takeProfit: '',
    pnl: '', rMultiple: '', lotSize: '',
    openedAt: '', closedAt: '',
    instrument: 'FX' as Trade['instrument'],
  });

  function handleSubmit() {
    if (!form.symbol || !form.entry || !form.exit) return;
    const openMs = form.openedAt ? new Date(form.openedAt).getTime() : 0;
    const closeMs = form.closedAt ? new Date(form.closedAt).getTime() : 0;
    const durationMs = closeMs > openMs ? closeMs - openMs : 0;
    const h = Math.floor(durationMs / 3600000);
    const m = Math.floor((durationMs % 3600000) / 60000);

    onAdd({
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      entry: parseFloat(form.entry),
      exit: parseFloat(form.exit),
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : undefined,
      pnl: parseFloat(form.pnl) || 0,
      rMultiple: parseFloat(form.rMultiple) || 0,
      lotSize: form.lotSize ? parseFloat(form.lotSize) : undefined,
      duration: `${h}h ${String(m).padStart(2,'0')}m`,
      durationMs,
      openedAt: form.openedAt ? new Date(form.openedAt).toISOString() : new Date().toISOString(),
      closedAt: form.closedAt ? new Date(form.closedAt).toISOString() : new Date().toISOString(),
      instrument: form.instrument,
    });
    onClose();
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '0.5px solid var(--border)',
    borderRadius: 5,
    padding: '7px 10px',
    fontSize: 12,
    color: 'var(--text)',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--text-3)',
    display: 'block',
    marginBottom: 4,
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: 10,
          width: 440,
          maxWidth: '90vw',
          maxHeight: '85dvh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Add trade manually</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 20 }}>×</button>
        </div>

        <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Symbol</label>
            <input value={form.symbol} onChange={e => setForm(p => ({ ...p, symbol: e.target.value }))} placeholder="EURUSD" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Direction</label>
            <select value={form.direction} onChange={e => setForm(p => ({ ...p, direction: e.target.value as 'LONG' | 'SHORT' }))} style={fieldStyle}>
              <option value="LONG">Long</option>
              <option value="SHORT">Short</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Instrument</label>
            <select value={form.instrument} onChange={e => setForm(p => ({ ...p, instrument: e.target.value as Trade['instrument'] }))} style={fieldStyle}>
              <option value="FX">FX</option>
              <option value="STOCKS">Stocks</option>
              <option value="INDICES">Indices</option>
              <option value="CRYPTO">Crypto</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Entry price</label>
            <input type="number" value={form.entry} onChange={e => setForm(p => ({ ...p, entry: e.target.value }))} placeholder="1.08620" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Exit price</label>
            <input type="number" value={form.exit} onChange={e => setForm(p => ({ ...p, exit: e.target.value }))} placeholder="1.09100" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Stop loss</label>
            <input type="number" value={form.stopLoss} onChange={e => setForm(p => ({ ...p, stopLoss: e.target.value }))} placeholder="Optional" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Take profit</label>
            <input type="number" value={form.takeProfit} onChange={e => setForm(p => ({ ...p, takeProfit: e.target.value }))} placeholder="Optional" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>P&L ($)</label>
            <input type="number" value={form.pnl} onChange={e => setForm(p => ({ ...p, pnl: e.target.value }))} placeholder="480.00" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>R multiple</label>
            <input type="number" step="0.1" value={form.rMultiple} onChange={e => setForm(p => ({ ...p, rMultiple: e.target.value }))} placeholder="3.2" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Lot size</label>
            <input type="number" step="0.01" value={form.lotSize} onChange={e => setForm(p => ({ ...p, lotSize: e.target.value }))} placeholder="0.10" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Opened at</label>
            <input type="datetime-local" value={form.openedAt} onChange={e => setForm(p => ({ ...p, openedAt: e.target.value }))} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Closed at</label>
            <input type="datetime-local" value={form.closedAt} onChange={e => setForm(p => ({ ...p, closedAt: e.target.value }))} style={fieldStyle} />
          </div>

          <button
            onClick={handleSubmit}
            style={{
              gridColumn: '1/-1',
              background: 'var(--green)',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              padding: '9px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              marginTop: 4,
            }}
          >
            Add trade
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter & Sort helpers ────────────────────────────────────────────────────

function applyFilter(trades: Trade[], filter: FilterKey): Trade[] {
  switch (filter) {
    case 'long':        return trades.filter(t => t.direction === 'LONG');
    case 'short':       return trades.filter(t => t.direction === 'SHORT');
    case 'fx':          return trades.filter(t => t.instrument === 'FX');
    case 'stocks':      return trades.filter(t => t.instrument === 'STOCKS');
    case 'indices':     return trades.filter(t => t.instrument === 'INDICES');
    case 'crypto':      return trades.filter(t => t.instrument === 'CRYPTO');
    case 'winners':     return trades.filter(t => t.pnl > 0);
    case 'losers':      return trades.filter(t => t.pnl <= 0);
    case 'published':   return trades.filter(t => t.isPublished);
    case 'unpublished': return trades.filter(t => !t.isPublished);
    default:            return trades;
  }
}

function applySort(trades: Trade[], sort: SortKey): Trade[] {
  const copy = [...trades];
  switch (sort) {
    case 'pnl_desc':   return copy.sort((a, b) => b.pnl - a.pnl);
    case 'pnl_asc':    return copy.sort((a, b) => a.pnl - b.pnl);
    case 'r_multiple': return copy.sort((a, b) => b.rMultiple - a.rMultiple);
    case 'duration':   return copy.sort((a, b) => b.durationMs - a.durationMs);
    default:           return copy.sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyTradesPage() {
  const navigate = useNavigate();
  const { accounts } = useMT5Accounts();
  const {
    trades, loading, syncStatus, syncError, lastSyncedAt,
    syncNow, importCsv, addTrade, updateTrade, deleteTrade, shareTrade,
  } = useMyTrades();

  const [activeFilter,    setActiveFilter]    = useState<FilterKey>('all');
  const [activeSort,      setActiveSort]      = useState<SortKey>('latest');
  const [csvModal,        setCsvModal]        = useState(false);
  const [addModal,        setAddModal]        = useState(false);
  const [shareModalTrade, setShareModalTrade] = useState<Trade | null>(null);

  const connectedAccounts = accounts.filter(a => a.status === 'connected' && a.metaApiAccountId);
  const hasAccounts = connectedAccounts.length > 0;

  const filteredTrades = useMemo(
    () => applySort(applyFilter(trades, activeFilter), activeSort),
    [trades, activeFilter, activeSort],
  );

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekCount = trades.filter(t => new Date(t.closedAt) >= weekAgo).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Layer 1 — Page header */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '0.5px solid var(--border)',
        padding: '16px 20px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>My trades</div>
          <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            {syncStatus === 'syncing' ? (
              <>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--green)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                Syncing trades from MT5…
              </>
            ) : (
              <>Private journal · {trades.length} trades · updated {lastSyncedAt}</>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {hasAccounts && (
            <GhostButton
              icon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={syncStatus === 'syncing' ? { animation: 'spin 1s linear infinite' } : undefined}>
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              }
              label={syncStatus === 'syncing' ? 'Syncing…' : 'Sync now'}
              onClick={syncNow}
            />
          )}
          <GhostButton
            icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
            label="Import CSV"
            onClick={() => setCsvModal(true)}
          />
          <GhostButton
            label="Weekly recap ✦"
            onClick={() => { /* TODO */ }}
          />
          <button
            onClick={() => setAddModal(true)}
            style={{
              background: 'var(--green)', color: '#000', border: 'none', borderRadius: 6,
              padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            + Add trade
          </button>
        </div>
      </div>

      {/* Sync error banner */}
      {syncError && (
        <div style={{
          background: 'var(--red-bg)', borderBottom: '0.5px solid var(--red-border)',
          padding: '8px 20px', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: 12, color: 'var(--red)', flex: 1 }}>Sync error: {syncError}</span>
          <button onClick={syncNow} style={{ fontSize: 11, color: 'var(--red)', background: 'transparent', border: '0.5px solid var(--red-border)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Retry</button>
        </div>
      )}

      {/* No accounts connected — prompt */}
      {!hasAccounts && trades.length === 0 && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: '40px 20px',
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}>No trades yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-4)', textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
            Connect an MT5 account in Settings to automatically sync your closed trades, or import a CSV export from your broker.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => navigate('/settings')}
              style={{
                background: 'var(--green)', color: '#000', border: 'none', borderRadius: 6,
                padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Connect MT5
            </button>
            <button
              onClick={() => setCsvModal(true)}
              style={{
                background: 'transparent', color: 'var(--text-2)',
                border: '0.5px solid var(--border-hard)', borderRadius: 6,
                padding: '8px 18px', fontSize: 13, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Import CSV
            </button>
          </div>
        </div>
      )}

      {/* Main content — only shown when there's something to display */}
      {(trades.length > 0 || hasAccounts) && (
        <>
          {/* Layer 2 — Stats bar */}
          <TradeStatsBar trades={trades} thisWeekCount={thisWeekCount} />

          {/* Layer 3 — Equity curve */}
          <EquityCurve trades={trades} />

          {/* Layer 4 — Filter bar */}
          <TradeFilterBar
            activeFilter={activeFilter}
            activeSort={activeSort}
            onFilter={setActiveFilter}
            onSort={setActiveSort}
            onImport={() => setCsvModal(true)}
          />

          {/* Layer 5 — Trade table */}
          {syncStatus === 'syncing' && trades.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', fontSize: 13, gap: 8 }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--green)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              Fetching trade history from MT5…
            </div>
          ) : (
            <TradeTable
              trades={filteredTrades}
              onShareTrade={t => setShareModalTrade(t)}
              onUpdateTrade={updateTrade}
              onDeleteTrade={deleteTrade}
              onViewPost={postId => navigate(`/post/${postId}`)}
            />
          )}
        </>
      )}

      {/* Modals */}
      {csvModal && (
        <CSVImportModal onClose={() => setCsvModal(false)} onImport={importCsv} />
      )}
      {addModal && (
        <AddTradeModal onClose={() => setAddModal(false)} onAdd={addTrade} />
      )}
      {shareModalTrade && (
        <ShareModal
          trade={shareModalTrade}
          user={{
            displayName:    'You',
            handle:         'me',
            avatarInitials: 'ME',
            isMT5Connected: connectedAccounts.length > 0,
            winRate:        Math.round((trades.filter(t => t.pnl >= 0).length / Math.max(trades.length, 1)) * 100),
            totalTrades:    trades.length,
            avgRR:          trades.length > 0
              ? parseFloat((trades.reduce((s, t) => s + t.rMultiple, 0) / trades.length).toFixed(2))
              : 0,
          }}
          onClose={() => setShareModalTrade(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function GhostButton({ icon, label, onClick }: { icon?: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        border: '0.5px solid var(--border-hard)',
        borderRadius: 6,
        padding: '7px 14px',
        fontSize: 12,
        color: 'var(--text-2)',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
