import {
  useEffect
} from "react";

import {
  Activity,
  Bell,
  BookHeart,
  Bot,
  Brain,
  PanelLeftClose,
PanelLeftOpen,
  ClipboardCheck,
  Home,
  LockKeyhole,
  LogOut,
  MessageCircleHeart,
  MessagesSquare,
  Settings,
  ShieldAlert,
  UserRound,
  UsersRound,
  X
} from "lucide-react";

import {
  useNotifications
} from "../../context/NotificationContext";
import UnwindLogo from "../common/UnwindLogo";
import {
  NavLink,
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../../context/AuthContext";

function getUserDisplayName(user) {
  return (
    user?.display_name ||
    user?.displayName ||
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    "UNWIND Member"
  );
}

function getUserInitials(user) {
  const name =
    getUserDisplayName(user);

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part
        .charAt(0)
        .toUpperCase()
    )
    .join("");
}

function getProfileImage(user) {
  return (
    user?.profile_image_url ||
    user?.profileImageUrl ||
    null
  );
}

const navigationSections = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: Home,
        end: true
      },
      {
        label: "Notifications",
        to:
          "/dashboard/notifications",
        icon: Bell
      }
    ]
  },

  {
    title: "Wellness",
    items: [
      {
        label: "AI Companion",
        to:
          "/dashboard/ai-companion",
        icon: Bot
      },
      {
        label: "Daily Trackers",
        to: "/dashboard/trackers",
        icon: Activity
      },
      {
        label: "Journal",
        to: "/dashboard/journal",
        icon: BookHeart
      },
      {
        label:
          "DASS-21 Assessment",
        to: "/dashboard/dass",
        icon: ClipboardCheck
      },
      {
        label: "Wellness Toolkit",
        to: "/dashboard/toolkit",
        icon: Brain
      }
    ]
  },

  {
    title: "Community",
    items: [
      {
        label: "Community Feed",
        to: "/dashboard/community",
        icon: UsersRound
      },
      {
        label: "Community Chat",
        to:
          "/dashboard/community-chat",
        icon: MessagesSquare
      },
      {
        label: "Private Rooms",
        to:
          "/dashboard/private-rooms",
        icon: LockKeyhole
      },
      {
        label: "Direct Messages",
        to: "/dashboard/messages",
        icon: MessageCircleHeart
      }
    ]
  },

  {
    title: "Account",
    items: [
      {
        label: "My Profile",
        to: "/dashboard/profile",
        icon: UserRound
      },
      {
        label: "Account Settings",
        to: "/dashboard/settings",
        icon: Settings
      },
      {
        label: "Safety & Reports",
        to: "/dashboard/reports",
        icon: ShieldAlert
      }
    ]
  }
];

function DashboardSidebar({
  collapsed = false,
  mobileOpen = false,
  onToggleCollapse,
  onCloseMobile
}) {
  const {
    user,
    logout
  } = useAuth();

  const {
  unreadCount
} = useNotifications();

  const navigate =
    useNavigate();

  const profileImage =
    getProfileImage(user);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (
      event
    ) => {
      if (event.key === "Escape") {
        onCloseMobile?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    mobileOpen,
    onCloseMobile
  ]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onCloseMobile?.();

      navigate("/login", {
        replace: true
      });
    }
  };

  const handleNavigation = () => {
    onCloseMobile?.();
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="dashboard-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        id="dashboard-sidebar"
        className={[
          "dashboard-sidebar",
          collapsed
            ? "dashboard-sidebar--collapsed"
            : "",
          mobileOpen
            ? "dashboard-sidebar--mobile-open"
            : ""
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Dashboard sidebar"
      >
        <header className="dashboard-sidebar__header">
          <NavLink
  to="/"
  className="dashboard-sidebar__brand"
  onClick={handleNavigation}
>
  <UnwindLogo
    variant="symbol"
    theme="dark"
    className="dashboard-sidebar__brand-logo"
  />

  {!collapsed && (
    <span className="dashboard-sidebar__brand-copy">
      <strong>
        Unwind
      </strong>

      <small>
        Mental wellness
      </small>
    </span>
  )}
</NavLink>
          <button
            type="button"
            className="dashboard-sidebar__mobile-close"
            onClick={
              onCloseMobile
            }
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </header>

        <nav
          className="dashboard-sidebar__navigation"
          aria-label="Dashboard navigation"
        >
          {navigationSections.map(
            (section) => (
              <section
                className="dashboard-sidebar__section"
                key={
                  section.title
                }
              >
                {!collapsed && (
                  <span className="dashboard-sidebar__section-title">
                    {
                      section.title
                    }
                  </span>
                )}

                <div className="dashboard-sidebar__links">
                  {section.items.map(
                    ({
                      label,
                      to,
                      icon: Icon,
                      end
                    }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={
                          handleNavigation
                        }
                        title={
                          collapsed
                            ? label
                            : undefined
                        }
                        className={({
                          isActive
                        }) =>
                          [
                            "dashboard-sidebar__link",
                            isActive
                              ? "dashboard-sidebar__link--active"
                              : ""
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " "
                            )
                        }
                      >
                        <span className="dashboard-sidebar__link-icon">
                          <Icon
                            size={
                              18
                            }
                          />
                        </span>

                        {!collapsed && (
                          <span className="dashboard-sidebar__link-label">
                            {
                              label
                            }
                          </span>
                        )}
                        {to ===
  "/dashboard/notifications" &&
  unreadCount > 0 && (
    <span className="dashboard-sidebar__notification-count">
      {unreadCount > 99
        ? "99+"
        : unreadCount}
    </span>
  )}
                      </NavLink>
                    )
                  )}
                </div>
              </section>
            )
          )}
        </nav>

        <footer className="dashboard-sidebar__footer">
          <div className="dashboard-sidebar__wellness-card">
            <span>
              <Brain size={18} />
            </span>

            {!collapsed && (
              <div>
                <strong>
                  Take a mindful pause
                </strong>

                <p>
                  A few slow breaths
                  can help you reset.
                </p>
              </div>
            )}
          </div>

          <div className="dashboard-sidebar__account">
            <NavLink
              to="/dashboard/profile"
              className="dashboard-sidebar__user"
              onClick={
                handleNavigation
              }
              title={
                collapsed
                  ? getUserDisplayName(
                      user
                    )
                  : undefined
              }
            >
              <span className="dashboard-sidebar__avatar">
                {profileImage ? (
                  <img
                    src={
                      profileImage
                    }
                    alt={`${getUserDisplayName(
                      user
                    )} profile`}
                  />
                ) : (
                  getUserInitials(
                    user
                  )
                )}
              </span>

              {!collapsed && (
                <span className="dashboard-sidebar__user-copy">
                  <strong>
                    {getUserDisplayName(
                      user
                    )}
                  </strong>

                  <small>
                    {user?.email ||
                      "UNWIND account"}
                  </small>
                </span>
              )}
            </NavLink>

            <button
              type="button"
              className="dashboard-sidebar__logout"
              onClick={
                handleLogout
              }
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>

          <button
  type="button"
  className="dashboard-sidebar__collapse"
  onClick={onToggleCollapse}
  aria-label={
    collapsed
      ? "Expand sidebar"
      : "Collapse sidebar"
  }
  title={
    collapsed
      ? "Expand sidebar"
      : "Collapse sidebar"
  }
>
  {collapsed ? (
    <PanelLeftOpen size={19} />
  ) : (
    <PanelLeftClose size={19} />
  )}
</button>
        </footer>
      </aside>
    </>
  );
}

export default DashboardSidebar;