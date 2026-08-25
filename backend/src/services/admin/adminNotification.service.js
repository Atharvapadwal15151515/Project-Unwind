import {
  createNotification
} from "../notification/notification.service.js";


export async function sendAdminUserNotification({
  adminId = null,
  userId,
  title,
  message,
  priority = "normal",
  iconName = "shield",
  actionUrl = "/notifications",
  referenceType = null,
  referenceId = null,
  metadata = {}
}) {
  if (!userId) {
    return null;
  }

  return createNotification(
    adminId,
    {
      title,
      message,

      notificationType:
        "moderation",

      audienceType:
        "individual",

      priority,

      iconName,
      actionUrl,

      referenceType,
      referenceId,

      metadata: {
        source:
          "admin_moderation",

        ...metadata
      },

      userIds: [
        userId
      ]
    }
  );
}