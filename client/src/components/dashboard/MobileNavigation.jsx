import {
  AnimatePresence,
  motion
} from "framer-motion";
import {
  Bot,
  BookHeart,
  HeartPulse,
  Home,
  LogOut,
  MessageCircleMore,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import {
  NavLink,
  useNavigate
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const mobilePrimaryNavigation = [
  {
    label: "Home",
    path: "/dashboard",
    icon: Home,
    end: true
  },
  {
    label: "Mood",
    path: "/dashboard/mood",
    icon: HeartPulse
  },
  {
    label: "Companion",
    path: "/dashboard/companion",
    icon: Bot
  },
  {
    label: "Community",
    path: "/dashboard/community",
    icon: UsersRound
  },
  {
    label: "Profile",
    path: "/dashboard/profile",
    icon: UserRound
  }
];

const drawerNavigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: Home,
    end: true
  },
  {
    label: "AI Companion",
    path: "/dashboard/companion",
    icon: Bot
  },
  {
    label: "Mood tracker",
    path: "/dashboard/mood",
    icon: HeartPulse
  },
  {
    label: "Journal",
    path: "/dashboard/journal",
    icon: BookHeart
  },
  {
    label: "Community",
    path: "/dashboard/community",
    icon: UsersRound
  },
  {
    label: "Chat rooms",
    path: "/dashboard/chat",
    icon: MessageCircleMore
  },
  {
    label: "Profile",
    path: "/dashboard/profile",
    icon: UserRound
  },
  {
    label: "Settings",
    path: "/dashboard/settings",
    icon: Settings
  }
];

function MobileNavigation({
  drawerOpen,
  onCloseDrawer
}) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    onCloseDrawer();

    navigate("/login", {
      replace: true
    });
  };

  return (
    <>
      <nav className="dashboard-mobile-bottom-nav">
        {mobilePrimaryNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                [
                  "dashboard-mobile-bottom-nav__link",
                  isActive
                    ? "dashboard-mobile-bottom-nav__link--active"
                    : ""
                ].join(" ")
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              type="button"
              className="dashboard-mobile-drawer__backdrop"
              onClick={onCloseDrawer}
              aria-label="Close navigation"
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              exit={{
                opacity: 0
              }}
            />

            <motion.aside
              className="dashboard-mobile-drawer"
              initial={{
                x: "-100%"
              }}
              animate={{
                x: 0
              }}
              exit={{
                x: "-100%"
              }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 280
              }}
            >
              <div className="dashboard-mobile-drawer__header">
                <div className="dashboard-mobile-drawer__brand">
                  <span>
                    <Sparkles size={18} />
                  </span>

                  <strong>UNWIND</strong>
                </div>

                <button
                  type="button"
                  onClick={onCloseDrawer}
                  aria-label="Close navigation"
                >
                  <X size={21} />
                </button>
              </div>

              <nav className="dashboard-mobile-drawer__links">
                {drawerNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={onCloseDrawer}
                      className={({ isActive }) =>
                        [
                          "dashboard-mobile-drawer__link",
                          isActive
                            ? "dashboard-mobile-drawer__link--active"
                            : ""
                        ].join(" ")
                      }
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <button
                type="button"
                className="dashboard-mobile-drawer__logout"
                onClick={handleLogout}
              >
                <LogOut size={19} />
                Sign out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileNavigation;