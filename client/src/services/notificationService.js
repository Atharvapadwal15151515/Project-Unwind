import api from "./api";

function normalizeNotification(
  item = {}
) {
  return {
    notificationId:
      item.notification_id ||
      item.notificationId,

    userNotificationId:
      item.user_notification_id ||
      item.userNotificationId ||
      null,

    title:
      item.title ||
      "Notification",

    message:
      item.message ||
      "",

    notificationType:
      item.notification_type ||
      item.notificationType ||
      "system",

    audienceType:
      item.audience_type ||
      item.audienceType ||
      null,

    priority:
      item.priority ||
      "normal",

    iconName:
      item.icon_name ||
      item.iconName ||
      null,

    actionUrl:
      item.action_url ||
      item.actionUrl ||
      null,

    referenceType:
      item.reference_type ||
      item.referenceType ||
      null,

    referenceId:
      item.reference_id ||
      item.referenceId ||
      null,

    metadata:
      item.metadata ||
      {},

    startsAt:
      item.starts_at ||
      item.startsAt ||
      null,

    expiresAt:
      item.expires_at ||
      item.expiresAt ||
      null,

    isDelivered:
      item.is_delivered ??
      item.isDelivered ??
      true,

    deliveredAt:
      item.delivered_at ||
      item.deliveredAt ||
      null,

    isRead:
      item.is_read ??
      item.isRead ??
      false,

    readAt:
      item.read_at ||
      item.readAt ||
      null,

    isDismissed:
      item.is_dismissed ??
      item.isDismissed ??
      false,

    dismissedAt:
      item.dismissed_at ||
      item.dismissedAt ||
      null,

    createdAt:
      item.created_at ||
      item.createdAt ||
      null,

    updatedAt:
      item.updated_at ||
      item.updatedAt ||
      null
  };
}

/*
|--------------------------------------------------------------------------
| Get Notifications
|--------------------------------------------------------------------------
*/

export async function getNotifications({
  page = 1,
  limit = 20,
  notificationType,
  priority,
  unreadOnly = false,
  includeDismissed = false,
  dismissedOnly = false,
  search
} = {}) {
  const params = {
    page,
    limit
  };

  if (notificationType) {
    params.notificationType =
      notificationType;
  }

  if (priority) {
    params.priority =
      priority;
  }

  if (unreadOnly) {
    params.unreadOnly =
      "true";
  }

  if (includeDismissed) {
    params.includeDismissed =
      "true";
  }

  if (dismissedOnly) {
    params.dismissedOnly =
      "true";
  }

  if (search?.trim()) {
    params.search =
      search.trim();
  }

  const response =
    await api.get(
      "/notifications",
      {
        params
      }
    );

  const data =
    response.data?.data ||
    {};

  return {
    notifications:
      (
        data.notifications ||
        []
      ).map(
        normalizeNotification
      ),

    pagination: {
      page:
        data.pagination?.page ||
        page,

      limit:
        data.pagination?.limit ||
        limit,

      total:
        data.pagination?.total ||
        0,

      totalPages:
        data.pagination
          ?.totalPages ||
        0
    }
  };
}

/*
|--------------------------------------------------------------------------
| Single Notification
|--------------------------------------------------------------------------
*/

export async function getNotificationById(
  notificationId
) {
  const response =
    await api.get(
      `/notifications/${notificationId}`
    );

  return normalizeNotification(
    response.data?.data
      ?.notification ||
      {}
  );
}

/*
|--------------------------------------------------------------------------
| Unread Count
|--------------------------------------------------------------------------
*/

export async function getUnreadNotificationCount() {
  const response =
    await api.get(
      "/notifications/unread-count"
    );

  return Number(
    response.data?.data
      ?.unreadCount ||
      0
  );
}

/*
|--------------------------------------------------------------------------
| Read
|--------------------------------------------------------------------------
*/

export async function markNotificationAsRead(
  notificationId
) {
  const response =
    await api.patch(
      `/notifications/${notificationId}/read`,
      {}
    );

  return (
    response.data?.data ||
    {}
  );
}

/*
|--------------------------------------------------------------------------
| Read All
|--------------------------------------------------------------------------
*/

export async function markAllNotificationsAsRead() {
  const response =
    await api.patch(
      "/notifications/read-all",
      {}
    );

  return (
    response.data?.data ||
    {}
  );
}

/*
|--------------------------------------------------------------------------
| Dismiss
|--------------------------------------------------------------------------
*/

export async function dismissNotification(
  notificationId
) {
  const response =
    await api.patch(
      `/notifications/${notificationId}/dismiss`,
      {}
    );

  return (
    response.data?.data ||
    {}
  );
}

/*
|--------------------------------------------------------------------------
| Restore
|--------------------------------------------------------------------------
*/

export async function restoreNotification(
  notificationId
) {
  const response =
    await api.patch(
      `/notifications/${notificationId}/restore`,
      {}
    );

  return (
    response.data?.data ||
    {}
  );
}

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

export async function deleteNotification(
  notificationId
) {
  const response =
    await api.delete(
      `/notifications/${notificationId}`
    );

  return (
    response.data?.data ||
    {}
  );
}

/*
|--------------------------------------------------------------------------
| Delete All
|--------------------------------------------------------------------------
*/

export async function deleteAllNotifications() {
  const response =
    await api.delete(
      "/notifications/all"
    );

  return (
    response.data?.data ||
    {}
  );
}