import { useState, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import IconRail from './IconRail';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import NotifPanel from './NotifPanel';

export default function AppShell() {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'var(--rail-w) var(--sidebar-w) 1fr var(--right-w)',
      gridTemplateRows: 'var(--topbar-h) 1fr',
      gridTemplateAreas: `
        "topbar topbar topbar topbar"
        "rail   sidebar feed  right"
      `,
      height: '100vh',
      overflow: 'hidden',
    }}>
      <Topbar onNotifClick={() => setNotifOpen(o => !o)} notifOpen={notifOpen} />
      <IconRail />
      <Sidebar />

      {/* Feed area */}
      <div style={{
        gridArea: 'feed',
        overflowY: 'auto',
        background: 'var(--bg)',
        padding: '20px 24px',
      }} className="scrollbar-hide">
        <Outlet />
      </div>

      <RightPanel />

      {/* Notif panel overlay */}
      {notifOpen && (
        <div ref={notifRef}>
          <NotifPanel />
        </div>
      )}
    </div>
  );
}
