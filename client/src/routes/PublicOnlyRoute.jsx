import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function PublicOnlyRoute({ children }) {
  const {
    isAuthenticated,
    initializing
  } = useAuth();

  if (initializing) {
    return (
      <main className="auth-loading-page">
        <div className="auth-loading-spinner" />

        <p>Loading UNWIND…</p>
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicOnlyRoute;