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
      gap: '6px',
      marginBottom: '12px',
    }}>
      {stats.map(({ label, value }) => (
        <div key={label} className="stat-tile">
          <div style={{
            fontSize: 10, color: 'var(--text-3)', fontWeight: 500,
            marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {label}
          </div>
          <div style={{
            fontSize: 12, fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text)',
          }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
