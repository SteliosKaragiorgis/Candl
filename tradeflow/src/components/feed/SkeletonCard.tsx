export default function SkeletonCard() {
  const line = (w: string, h = '12px', mb = '8px') => (
    <div className="shimmer" style={{
      width: w, height: h, borderRadius: '4px', marginBottom: mb,
    }} />
  );

  return (
    <div className="trade-card">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <div className="shimmer" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          {line('40%', '12px', '6px')}
          {line('25%', '10px')}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {['60px','60px','60px','50px'].map((w, i) => (
          <div key={i} className="shimmer" style={{ width: w, height: '36px', borderRadius: '5px' }} />
        ))}
      </div>
      {line('100%', '13px', '6px')}
      {line('90%', '13px', '6px')}
      {line('75%', '13px')}
    </div>
  );
}
