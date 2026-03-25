import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Topbar from './Topbar';
import IconRail from './IconRail';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import NotifPanel from './NotifPanel';
import MobileTopbar from './MobileTopbar';
import BottomNav from './BottomNav';
import ComposerModal from '../feed/ComposerModal';

export default function AppShell() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobilePage, setMobilePage] = useState('feed');
  const [composerOpen, setComposerOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        <MobileTopbar
          onNotifClick={() => setNotifOpen(o => !o)}
          notifHasUnread={true}
        />

        <div
          className="scrollbar-hide"
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: 80,
          }}
        >
          <Outlet />
        </div>

        <BottomNav
          currentPage={mobilePage}
          onNavigate={(page) => {
            setMobilePage(page);
            if (page === 'feed') navigate('/');
            if (page === 'explore') navigate('/explore');
            if (page === 'profile') navigate('/profile/u0');
          }}
          onPostClick={() => setComposerOpen(true)}
        />

        {notifOpen && (
          <div ref={notifRef}>
            <NotifPanel />
          </div>
        )}

        <ComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />
      </div>
    );
  }

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
