import React from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Home from "./pages/Home.jsx";
import Tool from "./pages/Tool.jsx";
import Guides from "./pages/Guides.jsx";
import Guide from "./pages/Guide.jsx";
import Auth from "./pages/Auth.jsx";
import Account from "./pages/Account.jsx";
import Admin from "./pages/Admin.jsx";

function Nav() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  return (
    <header className="shell">
      <div className="nav">
        <Link to="/" className="brand">
          <span className="mark">F</span>
          Folio
        </Link>
        <nav className="nav-links">
          <Link to="/#tools">Tools</Link>
          <Link to="/guides">Guides</Link>
          {user ? (
            <>
              <Link to="/account">Account</Link>
              {(user.role === "super_admin" || user.is_admin) && <Link to="/admin">Admin</Link>}
              <button className="ghost" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <Link to={`/login?next=${encodeURIComponent(loc.pathname)}`} className="btn outline">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="shell footer">
      <span>Folio processes files locally on this workspace. Optional accounts keep history.</span>
      <span>Free plan · 40 jobs / day</span>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools/:slug" element={<Tool />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/guides/:id" element={<Guide />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}
