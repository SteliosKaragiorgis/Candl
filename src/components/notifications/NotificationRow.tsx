import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Notification, NotificationType } from '../../types/notification'

/* ── SVG icons by type ── */

function TrendingUpIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
}
function HeartFilledIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
}
function MessageFilledIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function ShareIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
}
function UserPlusIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
}
function ShieldIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}
function DnaIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
}
function FileTextIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}
function InfoIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
}
function CheckIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function XIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

const TYPE_BADGE: Record<NotificationType, { bg: string; icon: React.ReactNode }> = {
  TRADE_DETECTED:  { bg: '#22c55e', icon: <TrendingUpIcon /> },
  TRADE_LIKED:     { bg: '#ef4444', icon: <HeartFilledIcon /> },
  TRADE_COMMENTED: { bg: '#666',    icon: <MessageFilledIcon /> },
  TRADE_SHARED:    { bg: '#666',    icon: <ShareIcon /> },
  NEW_FOLLOWER:    { bg: '#1d9bf0', icon: <UserPlusIcon /> },
  PROP_MILESTONE:  { bg: '#8b5cf6', icon: <ShieldIcon /> },
  DNA_UPDATED:     { bg: '#22c55e', icon: <DnaIcon /> },
  WEEKLY_RECAP:    { bg: '#1d9bf0', icon: <FileTextIcon /> },
  SYSTEM:          { bg: '#666',    icon: <InfoIcon /> },
}

function avatarColors(n: Notification): { bg: string; color: string } {
  switch (n.type) {
    case 'TRADE_DETECTED':
    case 'TRADE_LIKED':
    case 'TRADE_COMMENTED':
    case 'TRADE_SHARED':
    case 'DNA_UPDATED':
      return { bg: 'var(--green-bg)', color: 'var(--green)' }
    case 'WEEKLY_RECAP':
      return { bg: 'var(--blue-bg)', color: 'var(--blue)' }
    default:
      return { bg: 'var(--surface)', color: 'var(--text-3)' }
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? '+' : ''
  return `${sign}$${Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/* ── Main row component ── */

interface Props {
  notification: Notification
  onAction: () => void
}

export default function NotificationRow({ notification: n, onAction }: Props) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const badge = TYPE_BADGE[n.type]
  const avatar = avatarColors(n)
  const isAI = n.type === 'DNA_UPDATED' || n.type === 'WEEKLY_RECAP'
  const isSystem = n.type === 'SYSTEM'

  /* ── Text ── */
  function renderText() {
    const actor = n.actor?.displayName
    const bold = (t: string) => <span style={{ fontWeight: 500 }}>{t}</span>
    const blue = (t: string) => <span style={{ color: 'var(--blue)', fontWeight: 500 }}>{t}</span>

    switch (n.type) {
      case 'TRADE_DETECTED':
        return <>New trade detected via {blue('MT5')} — waiting for your story</>
      case 'TRADE_LIKED':
        if ((n.actorCount ?? 1) === 1) return <>{bold(actor!)} liked your trade post</>
        if (n.actorCount === 2) return <>{bold(actor!)} and 1 other liked your trade post</>
        return <>{bold(actor!)} and {(n.actorCount ?? 1) - 1} others liked your trade post</>
      case 'TRADE_COMMENTED':
        return <>{bold(actor!)} commented on your {blue(n.trade?.symbol ?? '')} trade</>
      case 'TRADE_SHARED':
        return <>{bold(actor!)} shared your trade on Twitter/X</>
      case 'NEW_FOLLOWER':
        return <>{bold(actor!)} started following you</>
      case 'PROP_MILESTONE':
        return <>{bold(actor!)} just {n.propMilestone?.result === 'PASSED' ? 'passed' : 'failed'} a prop firm challenge</>
      case 'DNA_UPDATED':
        return <>Your {bold('Trade DNA')} has been updated — {n.dnaHighlights?.totalTrades} verified trades analysed</>
      case 'WEEKLY_RECAP':
        return <>Your {bold('weekly recap')} is ready — {n.recapStats?.weekOf}</>
      case 'SYSTEM':
        return <>Welcome to {bold('Candl.')} — start sharing your trades and connect with other traders</>
    }
  }

  /* ── Preview blocks ── */
  function renderPreview() {
    switch (n.type) {
      case 'TRADE_DETECTED': {
        const t = n.trade!
        const pnlColor = t.pnl >= 0 ? 'var(--green)' : 'var(--red)'
        return (
          <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 6, overflow: 'hidden', display: 'flex', marginTop: 6 }}>
            <div style={{ padding: '8px 12px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t.symbol}</span>
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                  background: t.direction === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)',
                  color: t.direction === 'LONG' ? 'var(--green)' : 'var(--red)',
                  border: `0.5px solid ${t.direction === 'LONG' ? 'var(--green-border)' : 'var(--red-border)'}`,
                }}>{t.direction}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.entry.toFixed(t.entry < 100 ? 4 : 2)} · just now</div>
            </div>
            <div style={{ padding: '8px 12px', textAlign: 'right', borderLeft: '0.5px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: pnlColor }}>{formatPnl(t.pnl)}</div>
              <div style={{ fontSize: 10, color: pnlColor }}>{t.rMultiple >= 0 ? '+' : ''}{t.rMultiple}R</div>
            </div>
          </div>
        )
      }

      case 'TRADE_LIKED':
      case 'TRADE_SHARED': {
        const t = n.trade!
        const positive = t.pnl >= 0
        return (
          <div style={{
            background: positive ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `0.5px solid ${positive ? 'var(--green-border)' : 'var(--red-border)'}`,
            borderLeft: `2px solid ${positive ? 'var(--green-border)' : 'var(--red-border)'}`,
            borderRadius: 6, padding: '8px 12px', marginTop: 6,
            fontSize: 12, color: 'var(--text-2)',
          }}>
            {t.symbol} {t.direction} · {formatPnl(t.pnl)} · {t.rMultiple >= 0 ? '+' : ''}{t.rMultiple}R
          </div>
        )
      }

      case 'TRADE_COMMENTED':
        if (!n.commentText) return null
        return (
          <div style={{
            background: 'var(--surface)', borderLeft: '2px solid var(--border)',
            borderRadius: '0 6px 6px 0', padding: '8px 12px', marginTop: 6,
            fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {n.commentText}
          </div>
        )

      case 'PROP_MILESTONE': {
        const m = n.propMilestone!
        const passed = m.result === 'PASSED'
        return (
          <div style={{
            background: passed ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `0.5px solid ${passed ? 'var(--green-border)' : 'var(--red-border)'}`,
            borderRadius: 6, padding: '8px 12px', marginTop: 6,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: passed ? 'var(--green)' : 'var(--red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {passed ? <CheckIcon /> : <XIcon />}
            </div>
            <span style={{ fontSize: 12, color: passed ? 'var(--green)' : 'var(--red)' }}>
              {m.firm} — {m.phase} {passed ? 'passed' : 'failed'} · {m.daysUsed} days · {m.winRate}% WR
            </span>
          </div>
        )
      }

      case 'DNA_UPDATED': {
        const d = n.dnaHighlights!
        return (
          <div style={{
            background: 'var(--green-bg)', border: '0.5px solid var(--green-border)',
            borderLeft: '2px solid var(--green)', borderRadius: '0 6px 6px 0',
            padding: '8px 12px', marginTop: 6, fontSize: 12, color: 'var(--text-2)',
          }}>
            Best session: <span style={{ color: 'var(--green)', fontWeight: 500 }}>{d.topSession} {d.topSessionWR}%</span> · Best setup: <span style={{ color: 'var(--green)', fontWeight: 500 }}>{d.topSetup} {d.topSetupWR}%</span> · {d.newPatternCount} new pattern{d.newPatternCount !== 1 ? 's' : ''} flagged
          </div>
        )
      }

      case 'WEEKLY_RECAP': {
        const r = n.recapStats!
        return (
          <div style={{
            background: 'var(--blue-bg)', border: '0.5px solid var(--blue-border)',
            borderLeft: '2px solid var(--blue)', borderRadius: '0 6px 6px 0',
            padding: '8px 12px', marginTop: 6, fontSize: 12, color: 'var(--text-2)',
          }}>
            <span style={{ color: r.totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatPnl(r.totalPnl)}</span> · {r.winRate}% WR · {r.tradeCount} trades
          </div>
        )
      }

      default:
        return null
    }
  }

  /* ── Meta row ── */
  function renderMeta() {
    const time = relativeTime(n.createdAt)
    let badge: React.ReactNode = null

    if (n.type === 'TRADE_DETECTED') {
      badge = (
        <span style={{
          fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
          background: 'var(--green-bg)', color: 'var(--green)', border: '0.5px solid var(--green-border)',
        }}>MT5 verified</span>
      )
    } else if (isAI) {
      badge = (
        <span style={{
          fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
          background: 'var(--green-bg)', color: 'var(--green)', border: '0.5px solid var(--green-border)',
        }}>AI</span>
      )
    } else if (n.type === 'PROP_MILESTONE') {
      badge = (
        <span style={{
          fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
          background: 'var(--purple-bg)', color: 'var(--purple)', border: '0.5px solid var(--purple-border)',
        }}>{n.propMilestone?.firm}</span>
      )
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: 'var(--text-4)' }}>
        {time}
        {badge && <>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-emphasis)', display: 'inline-block' }} />
          {badge}
        </>}
      </div>
    )
  }

  /* ── Right-side actions ── */
  function renderAction() {
    switch (n.type) {
      case 'TRADE_DETECTED':
        return (
          <button
            onClick={e => { e.stopPropagation(); navigate('/'); }}
            style={{
              background: 'var(--green)', color: '#000', fontSize: 11, fontWeight: 500,
              padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif',
            }}
          >Add story</button>
        )
      case 'NEW_FOLLOWER': {
        const following = n.actor?.isFollowing
        return (
          <button
            onClick={e => { e.stopPropagation(); }}
            style={{
              fontSize: 11, padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              border: `0.5px solid ${following ? 'var(--green-border)' : 'var(--border-emphasis)'}`,
              color: following ? 'var(--green)' : 'var(--text-2)',
              background: following ? 'var(--green-bg)' : 'transparent',
            }}
          >{following ? 'Following ✓' : 'Follow back'}</button>
        )
      }
      case 'DNA_UPDATED':
        return (
          <button
            onClick={e => { e.stopPropagation(); navigate('/profile/me'); }}
            style={{
              fontSize: 11, padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              border: '0.5px solid var(--green-border)', color: 'var(--green)',
              background: 'transparent',
            }}
          >View DNA</button>
        )
      case 'WEEKLY_RECAP':
        return (
          <button
            onClick={e => { e.stopPropagation(); }}
            style={{
              fontSize: 11, padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              border: '0.5px solid var(--blue-border)', color: 'var(--blue)',
              background: 'transparent',
            }}
          >Read recap</button>
        )
      default:
        return null
    }
  }

  return (
    <div
      onClick={onAction}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 20px', background: hovered ? 'var(--surface)' : 'var(--surface)',
        borderBottom: '0.5px solid var(--border)', cursor: 'pointer',
        position: 'relative',
        ...(hovered ? { background: 'var(--surface2)' } : {}),
      }}
    >
      {/* Unread dot */}
      {!n.isRead && (
        <div style={{
          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
          width: 5, height: 5, borderRadius: '50%', background: 'var(--green)',
        }} />
      )}

      {/* Avatar stack */}
      <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: avatar.bg, color: avatar.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, border: '0.5px solid var(--border)',
        }}>
          {isAI || isSystem ? (isAI ? 'AI' : '★') : (n.actor?.avatarInitials ?? '?')}
        </div>
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 20, height: 20, borderRadius: '50%',
          background: badge.bg, border: '2px solid var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {badge.icon}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55, marginBottom: 4 }}>
          {renderText()}
        </div>
        {renderPreview()}
        {renderMeta()}
      </div>

      {/* Right side */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap' }}>
          {relativeTime(n.createdAt)}
        </span>
        {renderAction()}
      </div>
    </div>
  )
}
