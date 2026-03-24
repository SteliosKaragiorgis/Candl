import { DEMO_NOTIFICATIONS } from '../../data/demo';

export default function NotifPanel() {
  return (
    <div className="slide-in" style={{
      position: 'fixed', top: 'calc(var(--topbar-h) + 8px)', right: '16px',
      width: '320px', background: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      zIndex: 100,
    }}>
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Notifications</span>
        <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 600, cursor: 'pointer' }}>Mark all read</span>
      </div>
      <div style={{ maxHeight: '380px', overflowY: 'auto' }} className="scrollbar-hide">
        {DEMO_NOTIFICATIONS.map(n => (
          <div key={n.id} style={{
            display: 'flex', gap: '10px', padding: '10px 16px',
            borderBottom: '1px solid var(--border-2)',
            background: n.read ? 'transparent' : 'var(--blue-dim)',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${n.user.avatarGradient[0]}, ${n.user.avatarGradient[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '11px', fontWeight: 700,
            }}>
              {n.user.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600 }}>{n.user.name}</span>{' '}
                <span style={{ color: 'var(--text-2)' }}>{n.content}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{n.time}</div>
            </div>
            {!n.read && (
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'var(--blue)', flexShrink: 0, marginTop: '4px',
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
