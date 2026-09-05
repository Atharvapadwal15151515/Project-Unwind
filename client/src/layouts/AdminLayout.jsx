import {
  NavLink,
  Outlet,
  useNavigate
} from "react-router-dom";

import {
  LayoutDashboard,
  BarChart3,
  Users,
  Flag,
  Vote,
  Star,
  ScrollText,
  LogOut,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";
import UnwindLogo from "../components/common/UnwindLogo";
import AppLoader
  from "../components/common/AppStates/AppLoader";
import {
  Suspense,
  useState
} from "react";

import {
  revokeAdminAccess
} from "../services/admin/adminAccess.service";

import "./AdminLayout.css";


const NAV_ITEMS = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true
  },
  {
    to: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users
  },
  {
    to: "/admin/reports",
    label: "Reports",
    icon: Flag
  },
  {
  to: "/admin/decisions",
  label: "Decision Center",
  icon: Vote
},
  {
    to: "/admin/testimonials",
    label: "Testimonials",
    icon: Star
  },
  {
    to: "/admin/audit-logs",
    label: "Audit Logs",
    icon: ScrollText
  }
];


function AdminLayout() {
  const navigate =
    useNavigate();

  const [
    mobileOpen,
    setMobileOpen
  ] = useState(false);

  const [
    exiting,
    setExiting
  ] = useState(false);


  async function handleExitAdmin() {
    try {
      setExiting(true);

      await revokeAdminAccess();

    } catch (error) {
      console.error(
        "Unable to revoke admin access:",
        error
      );

    } finally {
      setExiting(false);

      navigate(
        "/dashboard",
        {
          replace: true
        }
      );
    }
  }


  function closeMobileNav() {
    setMobileOpen(false);
  }


  return (
    <div className="admin-layout">

      <aside
        className={
          mobileOpen
            ? "admin-layout-sidebar admin-layout-sidebar-open"
            : "admin-layout-sidebar"
        }
      >

        <div className="admin-layout-brand">

       <UnwindLogo
  variant="symbol"
  theme="dark"
  className="admin-layout-brand-logo"
/>

<div className="admin-layout-brand-copy">
  <strong>
    Unwind
  </strong>

  <span>
    Admin Panel
  </span>
</div>

          <button
            type="button"
            className="admin-layout-mobile-close"
            onClick={
              closeMobileNav
            }
            aria-label="Close admin navigation"
          >
            <X size={20} />
          </button>

        </div>


        <nav className="admin-layout-nav">

          <span className="admin-layout-nav-label">
            Administration
          </span>


          {NAV_ITEMS.map(
            ({
              to,
              label,
              icon: Icon,
              end
            }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={
                  closeMobileNav
                }
                className={({
                  isActive
                }) =>
                  isActive
                    ? "admin-layout-nav-item admin-layout-nav-item-active"
                    : "admin-layout-nav-item"
                }
              >
                <Icon size={18} />

                <span>
                  {label}
                </span>
              </NavLink>
            )
          )}

        </nav>


        <div className="admin-layout-sidebar-footer">

          <div className="admin-layout-security-note">
            <ShieldCheck
              size={16}
            />

            <span>
              Admin session active
            </span>
          </div>


          <button
            type="button"
            className="admin-layout-exit"
            onClick={
              handleExitAdmin
            }
            disabled={exiting}
          >
            <LogOut size={17} />

            {exiting
              ? "Exiting..."
              : "Exit Admin"}
          </button>

        </div>

      </aside>


      {mobileOpen && (
        <button
          type="button"
          className="admin-layout-overlay"
          onClick={
            closeMobileNav
          }
          aria-label="Close navigation"
        />
      )}


      <section className="admin-layout-content">

        <header className="admin-layout-mobile-header">

          <button
            type="button"
            className="admin-layout-menu"
            onClick={() =>
              setMobileOpen(true)
            }
            aria-label="Open admin navigation"
          >
            <Menu size={21} />
          </button>


         <div className="admin-layout-mobile-brand">
  <UnwindLogo
    variant="symbol"
    theme="dark"
    className="admin-layout-mobile-logo"
  />

  <span>
    Unwind Admin
  </span>
</div>

        </header>


        <div className="admin-layout-page">
  <Suspense
    fallback={
      <AppLoader
        message="Loading admin workspace…"
        size="medium"
      />
    }
  >
    <Outlet />
  </Suspense>
</div>
      </section>

    </div>
  );
}


export default AdminLayout;
