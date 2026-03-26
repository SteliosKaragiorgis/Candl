import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/layout/AppShell';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import PostDetailPage from './pages/PostDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import NewsPage from './pages/NewsPage';
import SettingsPage from './pages/SettingsPage';
import SignInPage from './pages/SignInPage';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/" element={<AppShell />}>
            <Route index element={<FeedPage />} />
            <Route path="post/:postId" element={<PostDetailPage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
