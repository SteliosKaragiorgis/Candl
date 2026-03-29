import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { MarketDataProvider } from './context/MarketDataContext';
import { TickerDataProvider } from './context/TickerDataContext';
import { WatchlistProvider } from './context/WatchlistContext';
import AppShell from './components/layout/AppShell';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import PostDetailPage from './pages/PostDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import NewsPage from './pages/NewsPage';
import NewsArticlePage from './pages/NewsArticlePage';
import SettingsPage from './pages/SettingsPage';
import ForumPage from './pages/ForumPage';
import ForumThreadPage from './pages/ForumThreadPage';
import ForumNewPostPage from './pages/ForumNewPostPage';
import SignalNewPage from './pages/SignalNewPage';
import DiscoverForumsPage from './pages/DiscoverForumsPage';
import SignInPage from './pages/SignInPage';
import WatchlistPage from './pages/WatchlistPage';
import TickerPage from './pages/TickerPage';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
    <ThemeProvider>
    <MarketDataProvider>
    <WatchlistProvider>
    <TickerDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/" element={<AppShell />}>
            <Route index element={<FeedPage />} />
            <Route path="post/:postId" element={<PostDetailPage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="news/article" element={<NewsArticlePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="forum/new" element={<ForumNewPostPage />} />
            <Route path="forum/signal/new" element={<SignalNewPage />} />
            <Route path="forum/discover" element={<DiscoverForumsPage />} />
            <Route path="forum/thread/:threadId" element={<ForumThreadPage />} />
            <Route path="forum" element={<ForumPage />} />
            <Route path="watchlist" element={<WatchlistPage />} />
            <Route path="ticker/:symbol" element={<TickerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TickerDataProvider>
    </WatchlistProvider>
    </MarketDataProvider>
    </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
