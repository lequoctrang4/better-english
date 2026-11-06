import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { WordsProvider } from './lib/words';
import { SocialProvider } from './lib/social';
import { isConfigured } from './lib/firebase';
import { Spinner, ToastProvider } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Words from './pages/Words';
import Practice from './pages/Practice';
import Friends from './pages/Friends';
import FriendProfile from './pages/FriendProfile';
import Setup from './pages/Setup';

const Play = lazy(() => import('./pages/Play'));
// Bộ từ vựng kèm dữ liệu thư viện (~36KB) — tải khi mở trang
const Sets = lazy(() => import('./pages/Sets'));
const SetDetail = lazy(() => import('./pages/SetDetail'));
const LibrarySet = lazy(() => import('./pages/LibrarySet'));
const lazyEl = (C) => <Suspense fallback={<Spinner />}><C /></Suspense>;

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Login />;
  return (
    <WordsProvider>
      <SocialProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="words" element={<Words />} />
            <Route path="sets" element={lazyEl(Sets)} />
            <Route path="sets/t/:tag" element={lazyEl(SetDetail)} />
            <Route path="sets/lib/:id" element={lazyEl(LibrarySet)} />
            <Route path="practice" element={<Practice />} />
            <Route path="practice/:game" element={<Suspense fallback={<Spinner />}><Play /></Suspense>} />
            <Route path="friends" element={<Friends />} />
            <Route path="friends/:uid" element={<FriendProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SocialProvider>
    </WordsProvider>
  );
}

export default function App() {
  if (!isConfigured) return <Setup />;
  return (
    <ToastProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ToastProvider>
  );
}
