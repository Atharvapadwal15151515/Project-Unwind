import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import api from "../../services/api";
import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  Bell,
  BookHeart,
  Brain,
  ChevronRight,
  CircleUserRound,
  Flame,
  HeartPulse,
  House,
  LockKeyhole,
  Menu,
  MessageCircle,
  MessagesSquare,
  NotebookPen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
  Wind,
  X
} from "lucide-react";

import {
  useNotifications
} from "../../context/NotificationContext";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

const pageTitles = {
  "/dashboard": {
    title: "Your wellness space",
    subtitle:
      "Take today one gentle moment at a time."
  },

  "/dashboard/notifications": {
    title: "Notifications",
    subtitle:
      "Stay updated without feeling overwhelmed."
  },

  "/dashboard/ai-companion": {
    title: "AI Companion",
    subtitle:
      "A calm space for supportive conversation."
  },

  "/dashboard/trackers": {
    title: "Daily trackers",
    subtitle:
      "Notice your daily wellness patterns gently."
  },

  "/dashboard/journal": {
    title: "Journal",
    subtitle:
      "Give your thoughts somewhere private to rest."
  },

  "/dashboard/dass": {
    title: "DASS-21 Assessment",
    subtitle:
      "Reflect on stress, anxiety and depression symptoms."
  },

  "/dashboard/community": {
    title: "Community",
    subtitle:
      "Connect with people through kindness."
  },

  "/dashboard/community-chat": {
    title: "Community chat",
    subtitle:
      "Join live conversations at your own pace."
  },

  "/dashboard/private-rooms": {
    title: "Private rooms",
    subtitle:
      "Connect in smaller and more focused spaces."
  },

  "/dashboard/messages": {
    title: "Direct messages",
    subtitle:
      "Continue private community conversations."
  },

  "/dashboard/toolkit": {
    title: "Wellness toolkit",
    subtitle:
      "Simple tools for calmer moments."
  },

  "/dashboard/toolkit/grounding": {
    title: "Grounding",
    subtitle:
      "Reconnect gently with the present moment."
  },

  "/dashboard/toolkit/emotional-checkin": {
    title: "Emotional check-in",
    subtitle:
      "Pause and notice what you are feeling."
  },

  "/dashboard/toolkit/thought-dump": {
    title: "Thought dump",
    subtitle:
      "Give crowded thoughts somewhere to go."
  },

  "/dashboard/toolkit/focus": {
    title: "Focus",
    subtitle:
      "Create a calmer space for concentration."
  },

  "/dashboard/toolkit/sounds": {
    title: "Calm sounds",
    subtitle:
      "Use calming audio to settle your mind."
  },

  "/dashboard/toolkit/gratitude": {
    title: "Gratitude",
    subtitle:
      "Notice a few good things from your day."
  },

  "/dashboard/toolkit/activity": {
    title: "Wellness activity",
    subtitle:
      "Look back at your wellness activity."
  },

  "/dashboard/toolkit/saved": {
    title: "Saved tools",
    subtitle:
      "Return to wellness tools you saved."
  },

  "/dashboard/toolkit/recent": {
    title: "Recent tools",
    subtitle:
      "Continue with tools you recently used."
  },

  "/dashboard/toolkit/movement": {
    title: "Movement break",
    subtitle:
      "Take a small break and move your body."
  },

  "/dashboard/toolkit/body-scan": {
    title: "Body scan",
    subtitle:
      "Notice sensations throughout your body."
  },

  "/dashboard/profile": {
    title: "Your profile",
    subtitle:
      "Manage how you appear across UNWIND."
  },

  "/dashboard/settings": {
    title: "Account settings",
    subtitle:
      "Manage your account, privacy and security."
  },

  "/dashboard/settings/security": {
    title: "Security",
    subtitle:
      "Manage your account security."
  },

  "/dashboard/reports": {
    title: "Safety and reports",
    subtitle:
      "Access community safety and reporting tools."
  }
};

const SEARCH_ITEMS = [
  {
    title: "Dashboard",
    description:
      "Your UNWIND wellness overview",
    path: "/dashboard",
    icon: House,
    keywords: [
      "home",
      "dashboard",
      "overview",
      "wellness",
      "home page"
    ]
  },

  {
    title: "AI Companion",
    description:
      "Talk with your supportive AI companion",
    path: "/dashboard/ai-companion",
    icon: Brain,
    keywords: [
      "ai",
      "companion",
      "chatbot",
      "assistant",
      "chat",
      "mental health"
    ]
  },

  {
    title: "Daily Trackers",
    description:
      "Track mood, sleep, water, energy and habits",
    path: "/dashboard/trackers",
    icon: HeartPulse,
    keywords: [
      "tracker",
      "trackers",
      "mood",
      "sleep",
      "water",
      "energy",
      "habit",
      "habits",
      "wellness score"
    ]
  },

  {
    title: "Journal",
    description:
      "Write and revisit your private journal",
    path: "/dashboard/journal",
    icon: NotebookPen,
    keywords: [
      "journal",
      "diary",
      "entry",
      "entries",
      "write",
      "voice journal",
      "photo journal",
      "video journal",
      "draft"
    ]
  },

  {
    title: "DASS-21 Assessment",
    description:
      "Stress, anxiety and depression assessment",
    path: "/dashboard/dass",
    icon: BookHeart,
    keywords: [
      "dass",
      "dass 21",
      "assessment",
      "stress",
      "anxiety",
      "depression",
      "test"
    ]
  },

  {
    title: "Community Feed",
    description:
      "Read and share community posts",
    path: "/dashboard/community",
    icon: Users,
    keywords: [
      "community",
      "feed",
      "post",
      "posts",
      "comments",
      "people",
      "social"
    ]
  },

  {
    title: "Community Chat",
    description:
      "Join the live community chat wall",
    path: "/dashboard/community-chat",
    icon: MessagesSquare,
    keywords: [
      "community chat",
      "chat wall",
      "community wall",
      "wall",
      "live chat",
      "messages"
    ]
  },

  {
    title: "Private Rooms",
    description:
      "Smaller private community conversations",
    path: "/dashboard/private-rooms",
    icon: LockKeyhole,
    keywords: [
      "private",
      "private room",
      "private rooms",
      "room",
      "rooms",
      "group chat"
    ]
  },

  {
    title: "Direct Messages",
    description:
      "Open your private one-to-one conversations",
    path: "/dashboard/messages",
    icon: MessageCircle,
    keywords: [
      "direct message",
      "direct messages",
      "dm",
      "dms",
      "message",
      "messages",
      "private message"
    ]
  },

  {
    title: "Wellness Toolkit",
    description:
      "Explore UNWIND wellness activities",
    path: "/dashboard/toolkit",
    icon: Sparkles,
    keywords: [
      "toolkit",
      "wellness toolkit",
      "tools",
      "wellness tools",
      "activity",
      "activities"
    ]
  },

  {
    title: "Grounding",
    description:
      "Use grounding exercises to return to the present",
    path: "/dashboard/toolkit/grounding",
    icon: Waves,
    keywords: [
      "ground",
      "grounding",
      "5 4 3 2 1",
      "present",
      "calm"
    ]
  },

  {
    title: "Emotional Check-in",
    description:
      "Notice and reflect on your current emotion",
    path:
      "/dashboard/toolkit/emotional-checkin",
    icon: HeartPulse,
    keywords: [
      "emotion",
      "emotional",
      "check in",
      "check-in",
      "feeling",
      "feelings",
      "intensity"
    ]
  },

  {
    title: "Thought Dump",
    description:
      "Unload thoughts that are occupying your mind",
    path: "/dashboard/toolkit/thought-dump",
    icon: NotebookPen,
    keywords: [
      "thought",
      "thoughts",
      "thought dump",
      "brain dump",
      "overthinking",
      "worry"
    ]
  },

  {
    title: "Focus",
    description:
      "Use a focused wellness session",
    path: "/dashboard/toolkit/focus",
    icon: Brain,
    keywords: [
      "focus",
      "concentrate",
      "concentration",
      "study",
      "work"
    ]
  },

  {
    title: "Calm Sounds",
    description:
      "Relax with calming audio",
    path: "/dashboard/toolkit/sounds",
    icon: Waves,
    keywords: [
      "sound",
      "sounds",
      "music",
      "calm sounds",
      "audio",
      "relax"
    ]
  },

  {
    title: "Gratitude",
    description:
      "Practice a short gratitude exercise",
    path: "/dashboard/toolkit/gratitude",
    icon: BookHeart,
    keywords: [
      "gratitude",
      "grateful",
      "thankful",
      "positive"
    ]
  },

  {
    title: "Wellness Activity",
    description:
      "Review your completed wellness activities",
    path: "/dashboard/toolkit/activity",
    icon: HeartPulse,
    keywords: [
      "history",
      "activity",
      "wellness history",
      "completed",
      "progress"
    ]
  },

  {
    title: "Saved Tools",
    description:
      "View the wellness tools you have saved",
    path: "/dashboard/toolkit/saved",
    icon: BookHeart,
    keywords: [
      "saved",
      "favorite",
      "favorites",
      "bookmarks",
      "saved tools"
    ]
  },

  {
    title: "Recent Tools",
    description:
      "Continue recently used wellness tools",
    path: "/dashboard/toolkit/recent",
    icon: Sparkles,
    keywords: [
      "recent",
      "recent tools",
      "last used",
      "history"
    ]
  },

  {
    title: "Movement Break",
    description:
      "Take a short guided movement break",
    path: "/dashboard/toolkit/movement",
    icon: HeartPulse,
    keywords: [
      "movement",
      "move",
      "exercise",
      "stretch",
      "break"
    ]
  },

  {
    title: "Body Scan",
    description:
      "Practice a gentle body-awareness exercise",
    path: "/dashboard/toolkit/body-scan",
    icon: Waves,
    keywords: [
      "body scan",
      "body",
      "mindfulness",
      "relaxation",
      "scan"
    ]
  },

  {
    title: "Breathing Exercises",
    description:
      "Explore guided breathing exercises",
    path: "/dashboard/toolkit",
    icon: Wind,
    keywords: [
      "breathing",
      "breath",
      "breathe",
      "breathing exercise",
      "breathing exercises"
    ]
  },

  {
    title: "Safety and Reports",
    description:
      "Manage community safety and submitted reports",
    path: "/dashboard/reports",
    icon: ShieldCheck,
    keywords: [
      "safety",
      "report",
      "reports",
      "reported",
      "report user",
      "report post",
      "abuse",
      "harassment"
    ]
  },

  {
    title: "Profile",
    description:
      "Manage your UNWIND profile and username",
    path: "/dashboard/profile",
    icon: CircleUserRound,
    keywords: [
      "profile",
      "username",
      "name",
      "photo",
      "avatar",
      "account profile"
    ]
  },

  {
    title: "Account Settings",
    description:
      "Manage your account and preferences",
    path: "/dashboard/settings",
    icon: Settings,
    keywords: [
      "settings",
      "setting",
      "account",
      "preferences",
      "password",
      "email"
    ]
  },

  {
    title: "Account Security",
    description:
      "Manage security-related account options",
    path: "/dashboard/settings/security",
    icon: ShieldCheck,
    keywords: [
      "security",
      "password",
      "secure",
      "account security"
    ]
  },

  {
    title: "Notifications",
    description:
      "View your UNWIND notifications",
    path: "/dashboard/notifications",
    icon: Bell,
    keywords: [
      "notification",
      "notifications",
      "alerts",
      "updates"
    ]
  }
];

function getCurrentDate() {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long"
    }
  ).format(new Date());
}

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function getSearchScore(item, query) {
  const normalizedQuery =
    normalizeText(query);

  const title =
    normalizeText(item.title);

  const description =
    normalizeText(item.description);

  const keywords =
    item.keywords.map(normalizeText);

  if (!normalizedQuery) {
    return 0;
  }

  if (title === normalizedQuery) {
    return 100;
  }

  if (
    keywords.some(
      (keyword) =>
        keyword === normalizedQuery
    )
  ) {
    return 90;
  }

  if (
    title.startsWith(
      normalizedQuery
    )
  ) {
    return 80;
  }

  if (
    keywords.some(
      (keyword) =>
        keyword.startsWith(
          normalizedQuery
        )
    )
  ) {
    return 70;
  }

  if (
    title.includes(
      normalizedQuery
    )
  ) {
    return 60;
  }

  if (
    keywords.some(
      (keyword) =>
        keyword.includes(
          normalizedQuery
        )
    )
  ) {
    return 50;
  }

  if (
    description.includes(
      normalizedQuery
    )
  ) {
    return 40;
  }

  const queryWords =
    normalizedQuery
      .split(" ")
      .filter(Boolean);

  const searchableText = [
    title,
    description,
    ...keywords
  ].join(" ");

  const matchedWords =
    queryWords.filter((word) =>
      searchableText.includes(word)
    );

  if (
    queryWords.length > 0 &&
    matchedWords.length ===
      queryWords.length
  ) {
    return 30;
  }

  return 0;
}

function DashboardTopbar({
  onOpenSidebar
}) {
  const {
  unreadCount
} = useNotifications();
const [
  currentStreak,
  setCurrentStreak
] = useState(0);

  const [
    searchOpen,
    setSearchOpen
  ] = useState(false);

  const [
    searchValue,
    setSearchValue
  ] = useState("");

  const [
    activeResultIndex,
    setActiveResultIndex
  ] = useState(0);

  const searchContainerRef =
    useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const pageInformation =
    pageTitles[location.pathname] ||
    pageTitles["/dashboard"];

  const searchResults =
    useMemo(() => {
      const query =
        searchValue.trim();

      if (!query) {
        return [];
      }

      return SEARCH_ITEMS
        .map((item) => ({
          ...item,
          score:
            getSearchScore(
              item,
              query
            )
        }))
        .filter(
          (item) =>
            item.score > 0
        )
        .sort(
          (first, second) =>
            second.score -
            first.score
        )
        .slice(0, 7);
    }, [searchValue]);
useEffect(() => {
  let active = true;

  const loadStreak =
    async () => {
      try {
        const response =
          await api.get(
            "/dashboard/stats"
          );

        if (!active) {
          return;
        }

        const streak =
          Number(
            response.data
              ?.data
              ?.currentStreak
          ) || 0;

        setCurrentStreak(
          streak
        );
      } catch (error) {
        console.error(
          "Failed to load dashboard streak:",
          error
        );

        if (active) {
          setCurrentStreak(0);
        }
      }
    };

  loadStreak();

  return () => {
    active = false;
  };
}, []);
  useEffect(() => {
    setSearchOpen(false);
    setSearchValue("");
    setActiveResultIndex(0);
  }, [location.pathname]);

  useEffect(() => {
    setActiveResultIndex(0);
  }, [searchValue]);

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        searchContainerRef
          .current &&
        !searchContainerRef
          .current.contains(
            event.target
          )
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (
      event
    ) => {
      const target =
        event.target;

      const isTyping =
        target instanceof
          HTMLInputElement ||
        target instanceof
          HTMLTextAreaElement ||
        target?.isContentEditable;

      if (
        event.key === "/" &&
        !isTyping
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (
        event.key === "Escape" &&
        searchOpen
      ) {
        setSearchOpen(false);
        setSearchValue("");
      }
    };

    window.addEventListener(
      "keydown",
      handleGlobalKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleGlobalKeyDown
      );
    };
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchValue("");
    setActiveResultIndex(0);
  };

  const navigateToResult = (
    item
  ) => {
    if (!item?.path) {
      return;
    }

    navigate(item.path);
    closeSearch();
  };

  const handleSearchSubmit = (
    event
  ) => {
    event.preventDefault();

    if (
      searchResults.length === 0
    ) {
      return;
    }

    navigateToResult(
      searchResults[
        activeResultIndex
      ] || searchResults[0]
    );
  };

  const handleSearchKeyDown = (
    event
  ) => {
    if (
      searchResults.length === 0
    ) {
      return;
    }

    if (
      event.key ===
      "ArrowDown"
    ) {
      event.preventDefault();

      setActiveResultIndex(
        (currentIndex) =>
          currentIndex >=
          searchResults.length -
            1
            ? 0
            : currentIndex + 1
      );
    }

    if (
      event.key === "ArrowUp"
    ) {
      event.preventDefault();

      setActiveResultIndex(
        (currentIndex) =>
          currentIndex <= 0
            ? searchResults.length -
              1
            : currentIndex - 1
      );
    }
  };

  const handleNotificationClick = () => {
    navigate(
      "/dashboard/notifications"
    );
  };

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <button
          type="button"
          className="dashboard-icon-button dashboard-topbar__mobile-menu"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          aria-controls="dashboard-sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="dashboard-topbar__page-heading">
          <h1>
            {pageInformation.title}
          </h1>

          <p>
            {pageInformation.subtitle}
          </p>
        </div>
      </div>

      <div className="dashboard-topbar__right">
        <div
          className="dashboard-search-wrapper"
          ref={searchContainerRef}
        >
          <motion.form
            className={`dashboard-search ${
              searchOpen
                ? "dashboard-search--open"
                : ""
            }`}
            animate={{
              width: searchOpen
                ? 310
                : 44
            }}
            transition={{
              duration: 0.25
            }}
            onSubmit={
              handleSearchSubmit
            }
          >
            <button
              type="button"
              className="dashboard-search__trigger"
              onClick={() => {
                if (searchOpen) {
                  closeSearch();
                } else {
                  setSearchOpen(true);
                }
              }}
              aria-label={
                searchOpen
                  ? "Close search"
                  : "Search UNWIND"
              }
            >
              {searchOpen ? (
                <X size={18} />
              ) : (
                <Search size={18} />
              )}
            </button>

            {searchOpen && (
              <motion.input
                initial={{
                  opacity: 0
                }}
                animate={{
                  opacity: 1
                }}
                transition={{
                  duration: 0.15
                }}
                type="search"
                value={
                  searchValue
                }
                onChange={(
                  event
                ) =>
                  setSearchValue(
                    event.target
                      .value
                  )
                }
                onKeyDown={
                  handleSearchKeyDown
                }
                placeholder="Search UNWIND..."
                aria-label="Search UNWIND"
                autoComplete="off"
                autoFocus
              />
            )}

            {searchOpen &&
              searchValue && (
                <button
                  type="button"
                  className="dashboard-search__clear"
                  onClick={() =>
                    setSearchValue(
                      ""
                    )
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
          </motion.form>

          <AnimatePresence>
            {searchOpen &&
              searchValue.trim() && (
                <motion.div
                  className="dashboard-search-results"
                  initial={{
                    opacity: 0,
                    y: -6,
                    scale: 0.98
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                    scale: 0.98
                  }}
                  transition={{
                    duration: 0.16
                  }}
                >
                  {searchResults.length >
                  0 ? (
                    <>
                      <div className="dashboard-search-results__heading">
                        <span>
                          Search results
                        </span>

                        <span>
                          {
                            searchResults.length
                          }{" "}
                          found
                        </span>
                      </div>

                      <div className="dashboard-search-results__list">
                        {searchResults.map(
                          (
                            item,
                            index
                          ) => {
                            const Icon =
                              item.icon;

                            const isActive =
                              index ===
                              activeResultIndex;

                            return (
                              <button
                                key={
                                  item.path +
                                  item.title
                                }
                                type="button"
                                className={`dashboard-search-result ${
                                  isActive
                                    ? "is-active"
                                    : ""
                                }`}
                                onMouseEnter={() =>
                                  setActiveResultIndex(
                                    index
                                  )
                                }
                                onClick={() =>
                                  navigateToResult(
                                    item
                                  )
                                }
                              >
                                <span className="dashboard-search-result__icon">
                                  <Icon
                                    size={
                                      17
                                    }
                                  />
                                </span>

                                <span className="dashboard-search-result__content">
                                  <strong>
                                    {
                                      item.title
                                    }
                                  </strong>

                                  <small>
                                    {
                                      item.description
                                    }
                                  </small>
                                </span>

                                <ChevronRight
                                  className="dashboard-search-result__arrow"
                                  size={
                                    16
                                  }
                                />
                              </button>
                            );
                          }
                        )}
                      </div>

                      <div className="dashboard-search-results__footer">
                        <span>
                          ↑ ↓ Navigate
                        </span>

                        <span>
                          Enter Open
                        </span>

                        <span>
                          Esc Close
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="dashboard-search-empty">
                      <span className="dashboard-search-empty__icon">
                        <Search
                          size={20}
                        />
                      </span>

                      <div>
                        <strong>
                          No results
                          found
                        </strong>

                        <p>
                          Try searching
                          for journal,
                          messages,
                          reports or
                          toolkit.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
          </AnimatePresence>
        </div>

        <div className="dashboard-topbar__date">
          <Sparkles size={15} />

          <span>
            {getCurrentDate()}
          </span>
        </div>

       <div className="dashboard-topbar__streak">
  <Flame size={17} />

  <span>
    {currentStreak}{" "}
    {currentStreak === 1
      ? "day"
      : "days"}{" "}
    streak
  </span>
</div>

        <ThemeToggle />

        <motion.button
  type="button"
  className="dashboard-icon-button dashboard-notification-button"
  whileHover={{
    scale: 1.06
  }}
  whileTap={{
    scale: 0.92
  }}
  onClick={
    handleNotificationClick
  }
  aria-label={
    unreadCount > 0
      ? `View notifications, ${unreadCount} unread`
      : "View notifications"
  }
>
  <Bell size={19} />

  {unreadCount > 0 && (
    <span
      className="dashboard-notification-button__badge"
      aria-hidden="true"
    >
      {unreadCount > 99
        ? "99+"
        : unreadCount}
    </span>
  )}
</motion.button>

        <UserMenu />
      </div>
    </header>
  );
}

export default DashboardTopbar;