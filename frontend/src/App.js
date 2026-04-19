import React, { useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import EventDetailPage from './pages/EventDetailPage';
import RequestTicketsPage from './pages/RequestTicketsPage';
import AdminRoute from './components/AdminRoute';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';

function LegacyEventsListRedirect() {
  return <Navigate to={{ pathname: '/', hash: 'featured-events' }} replace />;
}

function LegacyEventDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/event/${id}`} replace />;
}

/** Scroll to top on load and whenever the route path changes (not hash-only changes on the same path). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Public site chrome; hidden on `/admin` and `/admin/login` */
function AppRoutes() {
  const { pathname } = useLocation();
  const showSiteChrome = !pathname.startsWith('/admin');

  return (
    <>
      {showSiteChrome && <Navbar />}
      <main style={showSiteChrome ? undefined : { minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/events" element={<LegacyEventsListRedirect />} />
          <Route path="/events/:id" element={<LegacyEventDetailRedirect />} />
          <Route path="/request-tickets/:eventId" element={<RequestTicketsPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={(
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            )}
          />
        </Routes>
      </main>
      {showSiteChrome && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppRoutes />
    </Router>
  );
}

export default App;
