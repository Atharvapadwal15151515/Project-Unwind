import {
  Navigate,
  Outlet,
  useLocation
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import {
  LoaderCircle,
  ShieldAlert
} from "lucide-react";
import "./AdminRoute.css";
import {
  getAdminAccessStatus
} from "../services/admin/adminAccess.service";


function AdminRoute() {
  const location =
    useLocation();

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    allowed,
    setAllowed
  ] = useState(false);

  const [
    needsPassword,
    setNeedsPassword
  ] = useState(false);

  const [
    forbidden,
    setForbidden
  ] = useState(false);


  useEffect(() => {
    let mounted = true;

    async function checkAdminAccess() {
      try {
        setLoading(true);

        await getAdminAccessStatus();

        if (!mounted) {
          return;
        }

        setAllowed(true);
        setNeedsPassword(false);
        setForbidden(false);

      } catch (error) {
        if (!mounted) {
          return;
        }

        const status =
          error?.response?.status;

        const message =
          error?.response?.data?.message ||
          "";

        /*
        |--------------------------------------------------------------------------
        | Logged-in admin but common admin password not verified
        |--------------------------------------------------------------------------
        */

        if (
          status === 401 &&
          message
            .toLowerCase()
            .includes(
              "admin password"
            )
        ) {
          setNeedsPassword(true);
          setAllowed(false);

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | User is not an administrator
        |--------------------------------------------------------------------------
        */

        if (status === 403) {
          setForbidden(true);
          setAllowed(false);

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Missing / expired normal login
        |--------------------------------------------------------------------------
        */

        if (status === 401) {
          setAllowed(false);

          return;
        }

        setAllowed(false);

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAdminAccess();

    return () => {
      mounted = false;
    };
  }, [
    location.pathname
  ]);


  if (loading) {
    return (
      <main className="admin-route-state">
        <LoaderCircle
          size={28}
          className="admin-route-spinner"
        />

        <p>
          Verifying admin access...
        </p>
      </main>
    );
  }


  if (needsPassword) {
    return (
      <Navigate
        to="/admin/access"
        state={{
          from:
            location.pathname
        }}
        replace
      />
    );
  }


  if (forbidden) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }


  if (!allowed) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  return <Outlet />;
}


export default AdminRoute;