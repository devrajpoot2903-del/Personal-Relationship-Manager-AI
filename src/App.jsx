import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import PersonProfilePage from './pages/PersonProfilePage';
import { ToastProvider } from './hooks/useToast';

/** Scrolls back to the top whenever the route changes. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

/**
 * Personal Relationship Manager
 *
 * A local-first memory book: people, their important dates, notes, photos and
 * songs. All data lives in this browser's IndexedDB — there is no backend.
 */
export default function App() {
  return (
    <ToastProvider>
      {/* HashRouter keeps deep links and refreshes working on any static host. */}
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/person/:personId" element={<PersonProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
