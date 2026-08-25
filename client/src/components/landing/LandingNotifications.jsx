import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  Bell,
  Bot,
  CheckCheck,
  Info,
  Leaf,
  Megaphone,
  Smile,
  Sparkles,
  Wrench,
  X
} from "lucide-react";

import "./LandingNotifications.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const DISMISSED_STORAGE_KEY =
  "unwind_landing_dismissed_notifications";

function getNotificationIcon(iconName) {
  switch (iconName) {
    case "wrench":
      return <Wrench size={18} />;

    case "sparkles":
      return <Sparkles size={18} />;

    case "bot":
      return <Bot size={18} />;

    case "leaf":
      return <Leaf size={18} />;

    case "smile":
      return <Smile size={18} />;

    case "megaphone":
      return <Megaphone size={18} />;

    default:
      return <Info size={18} />;
  }
}

function formatNotificationDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date =
    new Date(dateValue);

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short"
    }
  ).format(date);
}

function getDismissedNotifications() {
  try {
    const stored =
      localStorage.getItem(
        DISMISSED_STORAGE_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveDismissedNotifications(ids) {
  try {
    localStorage.setItem(
      DISMISSED_STORAGE_KEY,
      JSON.stringify(ids)
    );
  } catch (error) {
    console.error(
      "Failed to save dismissed notifications:",
      error
    );
  }
}

function LandingNotifications() {
  const [
    isOpen,
    setIsOpen
  ] = useState(false);

  const [
    notifications,
    setNotifications
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  const containerRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Load Public Notifications
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let active = true;

    const loadNotifications =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `${API_URL}/notifications/public`
            );

          const result =
            await response.json();

          if (!response.ok) {
            throw new Error(
              result.message ||
                "Failed to load notifications"
            );
          }

          if (!active) {
            return;
          }

          const publicNotifications =
            result.data
              ?.notifications || [];

          const dismissedIds =
            getDismissedNotifications();

          const visibleNotifications =
            publicNotifications.filter(
              notification =>
                !dismissedIds.includes(
                  notification.notification_id
                )
            );

          setNotifications(
            visibleNotifications
          );
        } catch (err) {
          if (!active) {
            return;
          }

          console.error(
            "Landing notifications error:",
            err
          );

          setError(
            "Unable to load updates right now."
          );
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Dismiss One Notification
  |--------------------------------------------------------------------------
  */

  const handleDismiss =
    (
      event,
      notificationId
    ) => {
      event.preventDefault();
      event.stopPropagation();

      const dismissedIds =
        getDismissedNotifications();

      if (
        !dismissedIds.includes(
          notificationId
        )
      ) {
        saveDismissedNotifications([
          ...dismissedIds,
          notificationId
        ]);
      }

      setNotifications(
        current =>
          current.filter(
            notification =>
              notification.notification_id !==
              notificationId
          )
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Dismiss All Notifications
  |--------------------------------------------------------------------------
  */

  const handleDismissAll =
    () => {
      const dismissedIds =
        getDismissedNotifications();

      const currentIds =
        notifications.map(
          notification =>
            notification.notification_id
        );

      const combinedIds = [
        ...new Set([
          ...dismissedIds,
          ...currentIds
        ])
      ];

      saveDismissedNotifications(
        combinedIds
      );

      setNotifications([]);
    };

  /*
  |--------------------------------------------------------------------------
  | Close On Outside Click
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleOutsideClick =
      event => {
        if (
          containerRef.current &&
          !containerRef.current.contains(
            event.target
          )
        ) {
          setIsOpen(false);
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

  /*
  |--------------------------------------------------------------------------
  | Close On Escape
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleKeyDown =
      event => {
        if (
          event.key ===
          "Escape"
        ) {
          setIsOpen(false);
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  const notificationCount =
    notifications.length;

  return (
    <div
      className="landing-notifications"
      ref={containerRef}
    >
      <button
        type="button"
        className="landing-notifications__trigger"
        onClick={() =>
          setIsOpen(
            current => !current
          )
        }
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell size={19} />

        {notificationCount > 0 && (
          <span className="landing-notifications__badge">
            {notificationCount > 9
              ? "9+"
              : notificationCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="landing-notifications__panel"
            initial={{
              opacity: 0,
              y: -10,
              scale: 0.97
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}
            exit={{
              opacity: 0,
              y: -8,
              scale: 0.97
            }}
            transition={{
              duration: 0.2,
              ease: [
                0.22,
                1,
                0.36,
                1
              ]
            }}
          >
            <div className="landing-notifications__header">
              <div className="landing-notifications__heading">
                <span className="landing-notifications__heading-icon">
                  <Sparkles size={16} />
                </span>

                <div>
                  <strong>
                    What's new
                  </strong>

                  <small>
                    Updates from UNWIND
                  </small>
                </div>
              </div>

              <div className="landing-notifications__header-actions">
                {!loading &&
                  !error &&
                  notificationCount > 0 && (
                    <button
                      type="button"
                      className="landing-notifications__clear"
                      onClick={
                        handleDismissAll
                      }
                      title="Dismiss all"
                    >
                      <CheckCheck
                        size={16}
                      />

                      <span>
                        Clear all
                      </span>
                    </button>
                  )}

                <button
                  type="button"
                  className="landing-notifications__close"
                  onClick={() =>
                    setIsOpen(false)
                  }
                  aria-label="Close notifications"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="landing-notifications__content">
              {loading && (
                <div className="landing-notifications__state">
                  <span className="landing-notifications__loader" />

                  <strong>
                    Loading updates
                  </strong>

                  <small>
                    Checking what's new...
                  </small>
                </div>
              )}

              {!loading &&
                error && (
                  <div className="landing-notifications__state">
                    <Info size={22} />

                    <strong>
                      Couldn't load updates
                    </strong>

                    <small>
                      {error}
                    </small>
                  </div>
                )}

              {!loading &&
                !error &&
                notificationCount ===
                  0 && (
                  <div className="landing-notifications__state">
                    <CheckCheck
                      size={24}
                    />

                    <strong>
                      You're all caught up
                    </strong>

                    <small>
                      No new announcements right now.
                    </small>
                  </div>
                )}

              {!loading &&
                !error &&
                notifications.map(
                  notification => (
                    <div
                      key={
                        notification.notification_id
                      }
                      className={`landing-notification landing-notification--${
                        notification.priority ||
                        "normal"
                      }`}
                    >
                      <span className="landing-notification__icon">
                        {getNotificationIcon(
                          notification.icon_name
                        )}
                      </span>

                      <div className="landing-notification__body">
                        <div className="landing-notification__top">
                          <strong>
                            {
                              notification.title
                            }
                          </strong>

                          <div className="landing-notification__top-actions">
                            <span className="landing-notification__date">
                              {formatNotificationDate(
                                notification.created_at
                              )}
                            </span>

                            <button
                              type="button"
                              className="landing-notification__dismiss"
                              onClick={
                                event =>
                                  handleDismiss(
                                    event,
                                    notification.notification_id
                                  )
                              }
                              aria-label={`Dismiss ${notification.title}`}
                              title="Dismiss"
                            >
                              <X
                                size={
                                  14
                                }
                              />
                            </button>
                          </div>
                        </div>

                        <p>
                          {
                            notification.message
                          }
                        </p>

                        <div className="landing-notification__bottom">
                          <div className="landing-notification__meta">
                            <span>
                              {
                                notification.notification_type
                              }
                            </span>

                            {notification.priority ===
                              "urgent" && (
                              <span className="landing-notification__priority">
                                Urgent
                              </span>
                            )}

                            {notification.priority ===
                              "high" && (
                              <span className="landing-notification__priority">
                                Important
                              </span>
                            )}
                          </div>

                          {notification.action_url && (
                            <a
                              href={
                                notification.action_url
                              }
                              className="landing-notification__action"
                              onClick={() =>
                                setIsOpen(
                                  false
                                )
                              }
                            >
                              View
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>

            {!loading &&
              !error &&
              notificationCount > 0 && (
                <div className="landing-notifications__footer">
                  <span>
                    {notificationCount}{" "}
                    update
                    {notificationCount !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingNotifications;