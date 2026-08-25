import asyncHandler from "../../utils/asyncHandler.js";

import {
  createNotification,
  getPublicNotifications,
  getUserNotifications,
  getUserNotificationById,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  restoreNotification,
  deleteUserNotification,
deleteAllUserNotifications,
updateNotification,
  deactivateNotification
} from "../../services/notification/notification.service.js";


/*
|--------------------------------------------------------------------------
| Get Public Notifications
|--------------------------------------------------------------------------
*/

export const getPublicNotificationsController =
  asyncHandler(
    async (req, res) => {
      const notifications =
        await getPublicNotifications();

      return res.status(200).json({
        success: true,
        message:
          "Public notifications retrieved successfully",
        data: {
          notifications,
          count:
            notifications.length
        }
      });
    }
  );
/*
|--------------------------------------------------------------------------
| Create Notification
|--------------------------------------------------------------------------
*/

export const createNotificationController =
  asyncHandler(
    async (req, res) => {
      const createdByUserId =
        req.user?.user_id || null;

      const notification =
        await createNotification(
          createdByUserId,
          req.body
        );

      return res.status(201).json({
        success: true,
        message:
          "Notification created successfully",
        data: {
          notification
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get User Notifications
|--------------------------------------------------------------------------
*/

export const getUserNotificationsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const result =
  await getUserNotifications(
    userId,
    req.validatedQuery ||
      req.query
  );

      return res.status(200).json({
        success: true,
        message:
          "Notifications retrieved successfully",
        data: result
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get User Notification Details
|--------------------------------------------------------------------------
*/

export const getUserNotificationByIdController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        notificationId
      } = req.params;

      const notification =
        await getUserNotificationById(
          userId,
          notificationId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification details retrieved successfully",
        data: {
          notification
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get Unread Notification Count
|--------------------------------------------------------------------------
*/

export const getUnreadNotificationCountController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const result =
        await getUnreadNotificationCount(
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Unread notification count retrieved successfully",
        data: result
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

export const markNotificationAsReadController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        notificationId
      } = req.params;

      const userNotification =
        await markNotificationAsRead(
          userId,
          notificationId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification marked as read successfully",
        data: {
          userNotification
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
*/

export const markAllNotificationsAsReadController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const result =
        await markAllNotificationsAsRead(
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read successfully",
        data: result
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Dismiss Notification
|--------------------------------------------------------------------------
*/

export const dismissNotificationController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        notificationId
      } = req.params;

      const userNotification =
        await dismissNotification(
          userId,
          notificationId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification dismissed successfully",
        data: {
          userNotification
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Restore Notification
|--------------------------------------------------------------------------
*/

export const restoreNotificationController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        notificationId
      } = req.params;

      const userNotification =
        await restoreNotification(
          userId,
          notificationId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification restored successfully",
        data: {
          userNotification
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Delete User Notification
|--------------------------------------------------------------------------
*/

export const deleteUserNotificationController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        notificationId
      } = req.params;

      const result =
        await deleteUserNotification(
          userId,
          notificationId
        );

      return res.status(200).json({
        success: true,
        message:
          result.dismissed
            ? "Global notification dismissed successfully"
            : "Notification deleted successfully",
        data: result
      });
    }
  );

  /*
|--------------------------------------------------------------------------
| Delete All User Notifications
|--------------------------------------------------------------------------
*/

export const deleteAllUserNotificationsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const result =
        await deleteAllUserNotifications(
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notifications cleared successfully",
        data: result
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Update Main Notification
|--------------------------------------------------------------------------
*/

export const updateNotificationController =
  asyncHandler(
    async (req, res) => {
      const {
        notificationId
      } = req.params;

      const notification =
        await updateNotification(
          notificationId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification updated successfully",
        data: {
          notification
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Deactivate Main Notification
|--------------------------------------------------------------------------
*/

export const deactivateNotificationController =
  asyncHandler(
    async (req, res) => {
      const {
        notificationId
      } = req.params;

      const notification =
        await deactivateNotification(
          notificationId
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification deactivated successfully",
        data: {
          notification
        }
      });
    }
  );