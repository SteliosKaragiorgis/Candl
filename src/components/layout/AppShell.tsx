import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Topbar from './Topbar';

import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import NotifPanel from './NotifPanel';
import MobileTopbar from './MobileTopbar';
import BottomNav from './BottomNav';
import ComposerModal from '../feed/ComposerModal';
import { currentUser } from '../../data/demo';

export default function AppShell() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobilePage, setMobilePage] = useState('feed');
  const [composerOpen, setComposerOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') setMobilePage('feed');
    else if (location.pathname.startsWith('/news'))    setMobilePage('news');
    else if (location.pathname.startsWith('/forum'))   setMobilePage('forum');
    else if (location.pathname.startsWith('/profile')) setMobilePage('profile');
  }, [location.pathname]);

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
          onNotifClick={() => navigate('/notifications')}
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
            if (page === 'feed')      navigate('/');
            if (page === 'news')      navigate('/news');
            if (page === 'propfirm')  navigate('/prop-firm');
            if (page === 'forum')     navigate('/forum');
            if (page === 'watchlist') navigate('/watchlist');
            if (page === 'portfolio') navigate('/portfolio');
            if (page === 'profile')   navigate(`/profile/${currentUser.id}`);
            if (page === 'settings')  navigate('/settings');
          }}
          onPostClick={() => setComposerOpen(true)}
        />
        <ComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />

        {notifOpen && (
          <div ref={notifRef}>
            <NotifPanel />
          </div>
        )}

      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'var(--sidebar-w) 1fr var(--right-w)',
      gridTemplateRows: 'var(--topbar-h) 1fr',
      gridTemplateAreas: `
        "topbar topbar topbar"
        "sidebar feed  right"
      `,
      height: '100vh',
      overflow: 'hidden',
    }}>
      <Topbar onNotifClick={() => setNotifOpen(o => !o)} notifOpen={notifOpen} />
      <Sidebar />

      {/* Feed area */}
      <div style={{
        gridArea: 'feed',
        overflowY: 'auto',
        background: 'var(--x-bg)',
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
