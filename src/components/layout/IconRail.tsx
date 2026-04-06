import { useNavigate, useLocation } from 'react-router-dom';

const icons = [
  {
    label: 'Feed', path: '/',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: 'Profile', path: '/profile/u0',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: 'Markets', path: '/markets',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    label: 'Explore', path: '/explore',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
];

export default function IconRail() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{
      gridArea: 'rail',
      width: 56,
      background: '#111111',
      borderRight: '0.5px solid #1e1e1e',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', paddingTop: 10, gap: 4,
    }}>
      {icons.map(({ label, path, icon }) => {
        const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
        return (
          <button
            key={label}
            title={label}
            onClick={() => navigate(path)}
            style={{
              position: 'relative',
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              border: 'none', cursor: 'pointer',
              background: 'transparent',
              color: active ? '#22c55e' : '#666',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#1a1a1a';
              if (!active) e.currentTarget.style.color = '#c8c8c8';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = active ? '#22c55e' : '#666';
            }}
          >
            {icon}
            {active && (
              <div style={{
                position: 'absolute', bottom: 5,
                width: 4, height: 4, borderRadius: '50%',
                background: '#22c55e',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
