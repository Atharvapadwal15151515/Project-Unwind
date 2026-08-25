import {
  Navigate,
  Outlet,
  useLocation
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";

import symbolDarkLogo
  from "../assets/brand/unwind-dark-full.png";
import "../styles/authLoader.css";

function ProtectedRoute() {
  const {
    isAuthenticated,
    initializing
  } = useAuth();

  const location = useLocation();
if (initializing) {
  return (
    <main className="unwind-refresh-screen">
      <div className="unwind-refresh-bg">
        <span className="unwind-glow unwind-glow--1" />
        <span className="unwind-glow unwind-glow--2" />
        <span className="unwind-glow unwind-glow--3" />
      </div>

      <div className="unwind-refresh-content">

        <div className="unwind-logo-shell">
          <div className="unwind-logo-orbit" />

          <img
            src={symbolDarkLogo}
            alt="UNWIND"
            className="unwind-refresh-logo"
          />

          <div className="unwind-logo-shine" />
        </div>

        <div className="unwind-refresh-wordmark">
          UNWIND
        </div>

        <p className="unwind-refresh-message">
          Preparing your UNWIND space…
        </p>

        <div className="unwind-refresh-dotline">
          <span />
          <span />
          <span />
        </div>

      </div>
    </main>
  );
}
  return <Outlet />;
}

export default ProtectedRoute;