import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getUnreadNotificationCount
} from "../services/notificationService";

import {
  connectSocket,
  onSocketEvent
} from "../services/socketService";

const NotificationContext =
  createContext(null);

export function NotificationProvider({
  children
}) {
  const [
    unreadCount,
    setUnreadCount
  ] = useState(0);

  const [
    loadingUnreadCount,
    setLoadingUnreadCount
  ] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Load Unread Count
  |--------------------------------------------------------------------------
  */

  const refreshUnreadCount =
    useCallback(
      async () => {
        try {
          const count =
            await getUnreadNotificationCount();

          setUnreadCount(
            count
          );

          return count;
        } catch {
          return null;
        } finally {
          setLoadingUnreadCount(
            false
          );
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      refreshUnreadCount();
    },
    [
      refreshUnreadCount
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Browser Refresh Events
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const handleFocus =
        () => {
          refreshUnreadCount();
        };

      const handleNotificationsChanged =
        () => {
          refreshUnreadCount();
        };

      window.addEventListener(
        "focus",
        handleFocus
      );

      window.addEventListener(
        "unwind:notifications-changed",
        handleNotificationsChanged
      );

      return () => {
        window.removeEventListener(
          "focus",
          handleFocus
        );

        window.removeEventListener(
          "unwind:notifications-changed",
          handleNotificationsChanged
        );
      };
    },
    [
      refreshUnreadCount
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Realtime Socket Notifications
  |--------------------------------------------------------------------------
  |
  | The rest of UNWIND already uses the shared socketService.
  |
  | We reuse that connection rather than opening another Socket.IO client.
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      connectSocket();

      const unsubscribe =
        onSocketEvent(
          "notification:new",
          () => {
            /*
             * Update badge count.
             */

            refreshUnreadCount();

            /*
             * NotificationsPage already listens for
             * this application-level event.
             *
             * Therefore, when the Notifications page
             * is currently open it refreshes immediately.
             */

            window.dispatchEvent(
              new CustomEvent(
                "unwind:notifications-changed"
              )
            );
          }
        );

      return unsubscribe;
    },
    [
      refreshUnreadCount
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Context
  |--------------------------------------------------------------------------
  */

  const value =
    useMemo(
      () => ({
        unreadCount,

        loadingUnreadCount,

        setUnreadCount,

        refreshUnreadCount
      }),
      [
        unreadCount,
        loadingUnreadCount,
        refreshUnreadCount
      ]
    );

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context =
    useContext(
      NotificationContext
    );

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
}