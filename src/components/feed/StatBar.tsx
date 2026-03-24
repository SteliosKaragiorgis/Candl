import { currentUser } from '../../data/demo';

const stats = [
  { label: 'Following',       value: String(currentUser.followingCount) + ' traders' },
  { label: 'Open Positions',  value: '4 positions' },
  { label: 'Activity',        value: '218 posts today' },
];

export default function StatBar() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      marginBottom: '14px',
    }}>
      {stats.map(({ label, value }) => (
        <div key={label} className="stat-tile">
          <div style={{
            fontSize: '10px', color: 'var(--text3)', fontWeight: 500,
            marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '13px', fontWeight: 700,
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--text)',
          }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
