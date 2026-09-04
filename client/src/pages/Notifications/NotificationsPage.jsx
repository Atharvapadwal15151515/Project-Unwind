import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  useConfirm
} from "../../context/ConfirmDialogContext";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleAlert,
  EyeOff,
  Filter,
  Heart,
  HeartPulse,
  Megaphone,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";

import {
  deleteAllNotifications,
  deleteNotification,
  dismissNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  restoreNotification
} from "../../services/notificationService";

import {
  getApiErrorMessage
} from "../../services/api";

import {
  useNotifications
} from "../../context/NotificationContext";

import AppSkeleton
  from "../../components/common/AppStates/AppSkeleton";

import AppEmptyState
  from "../../components/common/AppStates/AppEmptyState";

import AppErrorState
  from "../../components/common/AppStates/AppErrorState";

import ButtonLoader
  from "../../components/common/AppStates/ButtonLoader";

import {
  getErrorType
} from "../../utils/getErrorType";

import "./NotificationsPage.css";

const PAGE_SIZE =
  15;

const TABS = [
  {
    id: "all",
    label: "All"
  },
  {
    id: "unread",
    label: "Unread"
  },
  {
    id: "dismissed",
    label: "Dismissed"
  }
];

const TYPE_OPTIONS = [
  [
    "",
    "All types"
  ],
  [
    "system",
    "System"
  ],
  [
    "announcement",
    "Announcements"
  ],
  [
    "community",
    "Community"
  ],
  [
    "journal",
    "Journal"
  ],
  [
    "tracker",
    "Trackers"
  ],
  [
    "water",
    "Water"
  ],
  [
    "sleep",
    "Sleep"
  ],
  [
    "habit",
    "Habits"
  ],
  [
    "mood",
    "Mood"
  ],
  [
    "energy",
    "Energy"
  ],
  [
    "toolkit",
    "Toolkit"
  ],
  [
    "chatbot",
    "AI Companion"
  ],
  [
    "security",
    "Security"
  ]
];

const PRIORITY_OPTIONS = [
  [
    "",
    "All priorities"
  ],
  [
    "low",
    "Low"
  ],
  [
    "normal",
    "Normal"
  ],
  [
    "high",
    "High"
  ],
  [
    "urgent",
    "Urgent"
  ]
];

function getNotificationIcon(
  type
) {
  switch (type) {
    case "community":
      return MessageCircle;

    case "security":
      return ShieldCheck;

    case "announcement":
      return Megaphone;

    case "mood":
    case "energy":
    case "tracker":
    case "water":
    case "sleep":
    case "habit":
      return HeartPulse;

    case "journal":
      return Heart;

    case "toolkit":
    case "chatbot":
      return Sparkles;

    case "system":
    default:
      return Bell;
  }
}

function formatRelativeTime(
  value
) {
  if (!value) {
    return "Just now";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Just now";
  }

  const diffMs =
    Date.now() -
    date.getTime();

  const minute =
    60 * 1000;

  const hour =
    60 * minute;

  const day =
    24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }

  if (diffMs < hour) {
    return `${Math.floor(
      diffMs / minute
    )}m ago`;
  }

  if (diffMs < day) {
    return `${Math.floor(
      diffMs / hour
    )}h ago`;
  }

  if (
    diffMs <
    7 * day
  ) {
    return `${Math.floor(
      diffMs / day
    )}d ago`;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "numeric",

      month: "short",

      year:
        date.getFullYear() !==
        new Date().getFullYear()
          ? "numeric"
          : undefined
    }
  ).format(date);
}

function notificationTypeLabel(
  type
) {
  const match =
    TYPE_OPTIONS.find(
      ([value]) =>
        value === type
    );

  return (
    match?.[1] ||
    "Notification"
  );
}
function FilterDropdown({
  value,
  onChange,
  options,
  icon: Icon,
  label
}) {
  const [open, setOpen] =
    useState(false);

  const selectedOption =
    options.find(
      ([optionValue]) =>
        optionValue === value
    ) || options[0];

  return (
    <div className="notifications-filter-dropdown">
      <button
        type="button"
        className={[
          "notifications-filter-dropdown__trigger",
          value
            ? "is-filtered"
            : ""
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() =>
          setOpen(
            current => !current
          )
        }
        aria-expanded={open}
      >
        <Icon size={16} />

        <span>
          {selectedOption[1]}
        </span>

        <ChevronDown
          size={15}
          className={
            open
              ? "is-open"
              : ""
          }
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="notifications-filter-dropdown__backdrop"
            onClick={() =>
              setOpen(false)
            }
            aria-label={`Close ${label}`}
          />

          <div className="notifications-filter-dropdown__menu">
            <span className="notifications-filter-dropdown__title">
              {label}
            </span>

            {options.map(
              ([
                optionValue,
                optionLabel
              ]) => (
                <button
                  type="button"
                  key={
                    optionValue ||
                    "all"
                  }
                  className={
                    optionValue ===
                    value
                      ? "is-selected"
                      : ""
                  }
                  onClick={() => {
                    onChange(
                      optionValue
                    );

                    setOpen(
                      false
                    );
                  }}
                >
                  <span>
                    {optionLabel}
                  </span>

                  {optionValue ===
                    value && (
                    <Check
                      size={15}
                    />
                  )}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationsPage() {
  const navigate =
    useNavigate();
const confirm =
  useConfirm();
  const {
    unreadCount,
    setUnreadCount,
    refreshUnreadCount
  } = useNotifications();

  const [
    notifications,
    setNotifications
  ] = useState([]);

  const [
    pagination,
    setPagination
  ] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0
  });

  const [
    activeTab,
    setActiveTab
  ] = useState("all");

  const [
    page,
    setPage
  ] = useState(1);

  const [
    searchInput,
    setSearchInput
  ] = useState("");

  const [
    search,
    setSearch
  ] = useState("");

  const [
    notificationType,
    setNotificationType
  ] = useState("");

  const [
    priority,
    setPriority
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    refreshing,
    setRefreshing
  ] = useState(false);

  const [
    actionId,
    setActionId
  ] = useState(null);

  const [
  loadError,
  setLoadError
] = useState(null);

  const hasFilters =
    Boolean(
      search ||
      notificationType ||
      priority
    );

  /*
  |--------------------------------------------------------------------------
  | Load Notifications
  |--------------------------------------------------------------------------
  */

  const loadNotifications =
    useCallback(
      async ({
        silent = false
      } = {}) => {
        if (!silent) {
          setLoading(true);
        }

      setError("");
setLoadError(null);

try {
          const result =
            await getNotifications({
              page,

              limit:
                PAGE_SIZE,

              notificationType,

              priority,

              unreadOnly:
                activeTab ===
                "unread",

              dismissedOnly:
                activeTab ===
                "dismissed",

              search
            });

          setNotifications(
            result.notifications
          );

          setPagination(
            result.pagination
          );
        } catch (
  requestError
) {
  setLoadError(
    requestError
  );
} finally {
          setLoading(false);

          setRefreshing(
            false
          );
        }
      },
      [
        page,
        notificationType,
        priority,
        activeTab,
        search
      ]
    );

  useEffect(
    () => {
      loadNotifications();
    },
    [
      loadNotifications
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Search debounce
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            setPage(1);

            setSearch(
              searchInput.trim()
            );
          },
          350
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      searchInput
    ]
  );

  useEffect(
    () => {
      setPage(1);
    },
    [
      activeTab,
      notificationType,
      priority
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Summary
  |--------------------------------------------------------------------------
  */

  const summaryText =
    useMemo(
      () => {
        if (
          activeTab ===
          "dismissed"
        ) {
          return `${pagination.total} dismissed`;
        }

        if (
          unreadCount ===
          0
        ) {
          return "You are all caught up";
        }

        return `${unreadCount} unread`;
      },
      [
        activeTab,
        pagination.total,
        unreadCount
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Notify Global UI
  |--------------------------------------------------------------------------
  */

  const broadcastChange =
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "unwind:notifications-changed"
        )
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  const refreshEverything =
    async () => {
      setRefreshing(
        true
      );

      await Promise.all([
        loadNotifications({
          silent: true
        }),

        refreshUnreadCount()
      ]);
    };

  /*
  |--------------------------------------------------------------------------
  | Tabs
  |--------------------------------------------------------------------------
  */

  const handleTabChange =
    (tabId) => {
      setActiveTab(
        tabId
      );

      setPage(1);
    };

  /*
  |--------------------------------------------------------------------------
  | Mark all read
  |--------------------------------------------------------------------------
  */

  const handleMarkAllRead =
    async () => {
      if (
        unreadCount === 0
      ) {
        return;
      }

      setActionId(
        "read-all"
      );

      setError("");

      try {
        await markAllNotificationsAsRead();

        setUnreadCount(0);

        broadcastChange();

        await loadNotifications({
          silent: true
        });
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            "Could not mark notifications as read."
          )
        );
      } finally {
        setActionId(null);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Mark one read
  |--------------------------------------------------------------------------
  */

  const handleMarkRead =
    async (
      notification
    ) => {
      if (
        notification.isRead ||
        notification.isDismissed
      ) {
        return;
      }

      setActionId(
        `read-${notification.notificationId}`
      );

      try {
        await markNotificationAsRead(
          notification.notificationId
        );

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.notificationId ===
                notification.notificationId
                  ? {
                      ...item,

                      isRead:
                        true,

                      readAt:
                        new Date()
                          .toISOString()
                    }
                  : item
            )
        );

        setUnreadCount(
          (current) =>
            Math.max(
              0,
              current - 1
            )
        );

        broadcastChange();
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            "Could not mark this notification as read."
          )
        );
      } finally {
        setActionId(null);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Dismiss
  |--------------------------------------------------------------------------
  */

  const handleDismiss =
    async (
      notification
    ) => {
      setActionId(
        `dismiss-${notification.notificationId}`
      );

      try {
        await dismissNotification(
          notification.notificationId
        );

        if (
          !notification.isRead
        ) {
          setUnreadCount(
            (current) =>
              Math.max(
                0,
                current - 1
              )
          );
        }

        broadcastChange();

        await loadNotifications({
          silent: true
        });
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            "Could not dismiss this notification."
          )
        );
      } finally {
        setActionId(null);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Restore
  |--------------------------------------------------------------------------
  */

  const handleRestore =
    async (
      notification
    ) => {
      setActionId(
        `restore-${notification.notificationId}`
      );

      try {
        await restoreNotification(
          notification.notificationId
        );

        broadcastChange();

        await Promise.all([
          loadNotifications({
            silent: true
          }),

          refreshUnreadCount()
        ]);
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            "Could not restore this notification."
          )
        );
      } finally {
        setActionId(null);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    async (
      notification
    ) => {
      const confirmed =
  await confirm({
    title:
      "Delete notification?",
    message:
      "This notification will be removed from your history.",
    confirmText:
      "Delete",
    tone:
      "danger"
  });

      if (!confirmed) {
        return;
      }

      setActionId(
        `delete-${notification.notificationId}`
      );

      try {
        await deleteNotification(
          notification.notificationId
        );

        broadcastChange();

        await Promise.all([
          loadNotifications({
            silent: true
          }),

          refreshUnreadCount()
        ]);
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            "Could not delete this notification."
          )
        );
      } finally {
        setActionId(null);
      }
    };

    /*
|--------------------------------------------------------------------------
| Delete All
|--------------------------------------------------------------------------
*/

const handleDeleteAll =
  async () => {
    const confirmed =
  await confirm({
    title:
      "Delete notification?",
    message:
      "This notification will be removed from your history.",
    confirmText:
      "Delete",
    tone:
      "danger"
  });

    if (!confirmed) {
      return;
    }

    setActionId(
      "delete-all"
    );

    setError("");

    try {
      await deleteAllNotifications();

      setUnreadCount(0);

      broadcastChange();

      setPage(1);

      await Promise.all([
        loadNotifications({
          silent: true
        }),

        refreshUnreadCount()
      ]);
    } catch (
      requestError
    ) {
      setError(
        getApiErrorMessage(
          requestError,
          "Could not delete all notifications."
        )
      );
    } finally {
      setActionId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Open Notification
  |--------------------------------------------------------------------------
  */

  const openNotification =
    async (
      notification
    ) => {
      if (
        !notification.isRead
      ) {
        await handleMarkRead(
          notification
        );
      }

      const actionUrl =
        notification.actionUrl;

      if (!actionUrl) {
        return;
      }

      if (
        actionUrl.startsWith(
          "/"
        )
      ) {
        navigate(
          actionUrl
        );

        return;
      }

      if (
        /^https?:\/\//i.test(
          actionUrl
        )
      ) {
        window.location.assign(
          actionUrl
        );
      }
    };

  const clearFilters =
    () => {
      setSearchInput("");

      setSearch("");

      setNotificationType("");

      setPriority("");

      setPage(1);
    };

  return (
    <section className="notifications-page">
      <header className="notifications-page__hero">
        <div>
          <span className="notifications-page__eyebrow">
            <BellRing
              size={16}
            />

            Notification center
          </span>

          <h2>
            Stay informed,
            gently.
          </h2>

          <p>
            Community updates,
            reminders, security
            notices and important
            UNWIND activity will
            appear here.
          </p>
        </div>

        <div className="notifications-page__hero-summary">
          <strong>
            {summaryText}
          </strong>

          <span>
            {
              pagination.total
            }{" "}
            in this view
          </span>
        </div>
      </header>

      <div className="notifications-page__toolbar">
        <div className="notifications-page__tabs">
          {TABS.map(
            (tab) => (
              <button
                key={
                  tab.id
                }
                type="button"
                className={
                  activeTab ===
                  tab.id
                    ? "is-active"
                    : ""
                }
                onClick={() =>
                  handleTabChange(
                    tab.id
                  )
                }
              >
                {tab.label}

                {tab.id ===
                  "unread" &&
                  unreadCount >
                    0 && (
                    <span>
                      {unreadCount >
                      99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}
              </button>
            )
          )}
        </div>

        <div className="notifications-page__toolbar-actions">
          {activeTab !==
            "dismissed" && (
            <button
              type="button"
              className="notifications-page__text-button"
              onClick={
                handleMarkAllRead
              }
              disabled={
                unreadCount ===
                  0 ||
                actionId ===
                  "read-all"
              }
            >
             {actionId ===
"read-all" ? (
  <ButtonLoader
    label="Marking…"
  />
) : (
  <>
    <CheckCheck
      size={17}
    />

    Mark all read
  </>
)}
            </button>
          )}
<button
  type="button"
  className="notifications-page__text-button notifications-page__delete-all"
  onClick={handleDeleteAll}
  disabled={
    pagination.total === 0 ||
    actionId === "delete-all"
  }
>
  {actionId ===
"delete-all" ? (
  <ButtonLoader
    label="Deleting…"
  />
) : (
  <>
    <Trash2 size={17} />

    Delete all
  </>
)}
</button>
          <button
            type="button"
            className="notifications-page__icon-button"
            onClick={
              refreshEverything
            }
            disabled={
              refreshing
            }
            aria-label="Refresh notifications"
            title="Refresh notifications"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "is-spinning"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      <div className="notifications-page__filters">
        <label className="notifications-page__search">
          <Search
            size={17}
          />

          <input
            type="search"
            value={
              searchInput
            }
            onChange={(
              event
            ) =>
              setSearchInput(
                event.target
                  .value
              )
            }
            placeholder="Search notifications"
          />

          {searchInput && (
            <button
              type="button"
              onClick={() =>
                setSearchInput(
                  ""
                )
              }
              aria-label="Clear search"
            >
              <X
                size={16}
              />
            </button>
          )}
        </label>

        <FilterDropdown
  value={notificationType}
  onChange={
    setNotificationType
  }
  options={TYPE_OPTIONS}
  icon={Filter}
  label="Notification type"
/>

        <FilterDropdown
  value={priority}
  onChange={setPriority}
  options={PRIORITY_OPTIONS}
  icon={CircleAlert}
  label="Priority"
/>

        {hasFilters && (
          <button
            type="button"
            className="notifications-page__clear-filters"
            onClick={
              clearFilters
            }
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="notifications-page__error">
          <CircleAlert
            size={18}
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Dismiss error"
          >
            <X
              size={16}
            />
          </button>
        </div>
      )}

      <div className="notifications-page__content">
        {loading ? (
  <AppSkeleton
    variant="list"
    count={5}
    className="notifications-page__shared-skeleton"
  />
) : loadError ? (
  <AppErrorState
    type={
      getErrorType(
        loadError
      )
    }
    title="Notifications unavailable"
    description={
      loadError?.response?.data
        ?.message ||
      "We could not load your notifications."
    }
    onRetry={() =>
      loadNotifications()
    }
  />
) : notifications.length ===
  0 ? (
  <AppEmptyState
    icon={
      activeTab ===
      "dismissed"
        ? EyeOff
        : activeTab ===
            "unread"
          ? CheckCheck
          : Bell
    }
    title={
      hasFilters
        ? "No matching notifications"
        : activeTab ===
            "dismissed"
          ? "No dismissed notifications"
          : activeTab ===
              "unread"
            ? "You’re all caught up"
            : "No notifications yet"
    }
    description={
      hasFilters
        ? "No notifications match your current search and filters."
        : activeTab ===
            "dismissed"
          ? "Notifications you dismiss will remain available here until restored or deleted."
          : activeTab ===
              "unread"
            ? "You have read every notification. New updates will appear here."
            : "Relevant updates from Unwind will appear here."
    }
    actionLabel={
      hasFilters
        ? "Clear filters"
        : undefined
    }
    onAction={
      hasFilters
        ? clearFilters
        : undefined
    }
  />
) : (
  <div className="notifications-page__list">
            {notifications.map(
              (
                notification
              ) => {
                const Icon =
                  getNotificationIcon(
                    notification.notificationType
                  );

                const busy =
                  actionId?.includes(
                    notification.notificationId
                  );

                return (
                  <article
                    key={
                      notification.notificationId
                    }
                    className={[
                      "notification-card",

                      !notification.isRead &&
                      !notification.isDismissed
                        ? "notification-card--unread"
                        : "",

                      `notification-card--priority-${notification.priority}`
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " "
                      )}
                  >
                    <button
                      type="button"
                      className="notification-card__main"
                      onClick={() =>
                        openNotification(
                          notification
                        )
                      }
                      disabled={
                        busy
                      }
                    >
                      <span className="notification-card__icon">
                        <Icon
                          size={
                            20
                          }
                        />
                      </span>

                      <span className="notification-card__body">
                        <span className="notification-card__meta">
                          <span>
                            {notificationTypeLabel(
                              notification.notificationType
                            )}
                          </span>

                          {notification.priority !==
                            "normal" && (
                            <span
                              className={`notification-card__priority notification-card__priority--${notification.priority}`}
                            >
                              {
                                notification.priority
                              }
                            </span>
                          )}

                          <time>
                            {formatRelativeTime(
                              notification.createdAt
                            )}
                          </time>
                        </span>

                        <strong>
                          {
                            notification.title
                          }
                        </strong>

                        <p>
                          {
                            notification.message
                          }
                        </p>
                      </span>

                      {!notification.isRead &&
                        !notification.isDismissed && (
                          <span
                            className="notification-card__unread-dot"
                            aria-label="Unread"
                          />
                        )}
                    </button>

                    <div className="notification-card__actions">
                      {!notification.isDismissed &&
                        !notification.isRead && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMarkRead(
                                notification
                              )
                            }
                            disabled={
                              busy
                            }
                            title="Mark as read"
                            aria-label="Mark as read"
                          >
                            <Check
                              size={
                                17
                              }
                            />
                          </button>
                        )}

                      {notification.isDismissed ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleRestore(
                              notification
                            )
                          }
                          disabled={
                            busy
                          }
                          title="Restore notification"
                          aria-label="Restore notification"
                        >
                          <RotateCcw
                            size={
                              17
                            }
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleDismiss(
                              notification
                            )
                          }
                          disabled={
                            busy
                          }
                          title="Dismiss notification"
                          aria-label="Dismiss notification"
                        >
                          <EyeOff
                            size={
                              17
                            }
                          />
                        </button>
                      )}

                      <button
                        type="button"
                        className="is-danger"
                        onClick={() =>
                          handleDelete(
                            notification
                          )
                        }
                        disabled={
                          busy
                        }
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2
                          size={
                            17
                          }
                        />
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>

      {pagination.totalPages >
        1 && (
        <footer className="notifications-page__pagination">
          <button
            type="button"
            onClick={() =>
              setPage(
                (current) =>
                  Math.max(
                    1,
                    current -
                      1
                  )
              )
            }
            disabled={
              page <= 1
            }
          >
            <ChevronLeft
              size={17}
            />

            Previous
          </button>

          <span>
            Page{" "}
            {
              pagination.page
            }{" "}
            of{" "}
            {
              pagination.totalPages
            }
          </span>

          <button
            type="button"
            onClick={() =>
              setPage(
                (current) =>
                  Math.min(
                    pagination.totalPages,
                    current +
                      1
                  )
              )
            }
            disabled={
              page >=
              pagination.totalPages
            }
          >
            Next

            <ChevronRight
              size={17}
            />
          </button>
        </footer>
      )}
    </section>
  );
}

export default NotificationsPage;