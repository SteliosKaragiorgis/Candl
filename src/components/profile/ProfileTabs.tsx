export type Tab = 'posts' | 'commentary' | 'investments';

const TABS: { id: Tab; label: string }[] = [
  { id: 'posts',       label: 'All posts' },
  { id: 'commentary',  label: 'Commentary' },
  { id: 'investments', label: 'Investments' },
];

export default function ProfileTabs({
  active, onChange, children,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: 16,
      }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1, padding: '12px 0',
              background: 'none', border: 'none', outline: 'none',
              fontSize: 13, fontWeight: active === id ? 700 : 500,
              color: active === id ? 'var(--text)' : 'var(--text4)',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              borderBottom: active === id ? '2px solid var(--text)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {children}
    </>
  );
}
