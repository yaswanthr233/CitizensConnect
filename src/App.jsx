import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import Dashboard from "./Dashboard";
import CitizenDashboard from "./Pages/CitizenDashboard";
import PoliticianDashboard from "./Pages/PoliticianDashboard";
import AdminDashboard from "./Pages/AdminDashboard";
import ModeratorDashboard from "./Pages/ModeratorDashboard";

import PortalSelector from "./Pages/Auth/PortalSelector";
import CitizenAuth from "./Pages/Auth/CitizenAuth";
import PoliticianAuth from "./Pages/Auth/PoliticianAuth";
import AdminLogin from "./Pages/Auth/AdminLogin";

import Representatives from "./Representatives";
import Updates from "./Updates";
import Issues from "./Issues";
import NewsPage from "./pages/NewsPage";
import NewsTicker from "./components/NewsTicker";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

import "./App.css";

import { FaUserCircle, FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  if (!user) {
    return <Navigate to="/portal" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    switch (user.role) {
      case 'CITIZEN': return <Navigate to="/citizen-dashboard" replace />;
      case 'POLITICIAN': return <Navigate to="/politician-dashboard" replace />;
      case 'ADMIN': return <Navigate to="/admin-dashboard" replace />;
      case 'MODERATOR': return <Navigate to="/moderator-dashboard" replace />;
      default: return <Navigate to="/dashboard" replace />;
    }
  }

  return <Dashboard />; 
};

const AppContent = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  function toggleMenu() {
    setMenuOpen((v) => !v);
  }

  function handleLogout() {
    logout();
    setShowProfileModal(false);
  }

  return (
    <BrowserRouter>
      <div className="app-root">
        <header className="site-header">
          <div className="header-inner">
            <div className="logo">
              <Link to="/" onClick={() => setMenuOpen(false)} aria-label="CitizenConnect home">
                <span className="logo-mark">🟣</span>
                <span className="logo-text">CitizensConnect</span>
              </Link>
            </div>

            <nav className={`main-nav ${menuOpen ? "open" : ""}`} aria-label="Main navigation">
              <ul>
                <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
                <li><Link to="/issues" onClick={() => setMenuOpen(false)}>Issues</Link></li>
                <li><Link to="/representatives" onClick={() => setMenuOpen(false)}>Representatives</Link></li>
                <li><Link to="/updates" onClick={() => setMenuOpen(false)}>Updates</Link></li>
              </ul>
            </nav>

            <div className="header-actions">
              {!user ? (
                <Link to="/portal" className="signup-btn" onClick={() => setMenuOpen(false)}>
                  Access Portals
                </Link>
              ) : (
                <div className="user-menu">
                  <span className="user-role">{user.role}</span>
                  <button className="icon-btn" onClick={() => setShowProfileModal(true)} aria-label="Open profile">
                    <FaUserCircle size={26} />
                  </button>
                </div>
              )}

              <button className="mobile-toggle" onClick={toggleMenu} aria-label="Toggle menu">
                {menuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>
        </header>

        <main className="site-main">
          <Routes>
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portal" element={<PortalSelector />} />

            {/* Authentication Routes */}
            <Route path="/citizen-login" element={<CitizenAuth />} />
            <Route path="/citizen-register" element={<CitizenAuth />} />
            <Route path="/politician-login" element={<PoliticianAuth />} />
            <Route path="/politician-register" element={<PoliticianAuth />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Protected Role Routes */}
            <Route path="/citizen-dashboard" element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenDashboard />
              </ProtectedRoute>
            } />
            <Route path="/politician-dashboard" element={
              <ProtectedRoute allowedRoles={['POLITICIAN']}>
                <PoliticianDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/moderator-dashboard" element={
              <ProtectedRoute allowedRoles={['MODERATOR']}>
                <ModeratorDashboard />
              </ProtectedRoute>
            } />

            <Route path="/issues" element={<Issues />} />
            <Route path="/representatives" element={<Representatives />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/news/:id" element={<NewsPage />} />
          </Routes>
        </main>

        {showProfileModal && user && (
          <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowProfileModal(false)}>
            <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
              <ProfileView user={user} onClose={() => setShowProfileModal(false)} onLogout={handleLogout} />
            </div>
          </div>
        )}

        <NewsTicker />
      </div>
    </BrowserRouter>
  );
};

function ProfileView({ user, onClose, onLogout }) {
  return (
    <div className="profile-view">
      <h3 className="modal-title">Profile</h3>
      <div className="profile-info">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Role:</strong> {user.role}</p>
        {user.aadhaar && <p><strong>Aadhaar:</strong> ****{user.aadhaar.slice(-4)}</p>}
      </div>
      <div className="profile-actions">
        <button className="btn-ghost" onClick={onLogout}>
          <FaSignOutAlt style={{ marginRight: 8 }} />
          Logout
        </button>
        <button className="btn-primary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
