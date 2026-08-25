import express from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  createNotificationController,
  getPublicNotificationsController,
  getUserNotificationsController,
  getUserNotificationByIdController,
  getUnreadNotificationCountController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  dismissNotificationController,
  restoreNotificationController,
  deleteUserNotificationController,
  deleteAllUserNotificationsController,
  updateNotificationController,
  deactivateNotificationController
} from "../../controllers/notification/notification.controller.js";

import {
  createNotificationSchema,
  updateNotificationSchema,
  listNotificationsSchema,
  notificationIdParamSchema,
  markNotificationReadSchema,
  dismissNotificationSchema,
  deleteUserNotificationSchema,
  markAllNotificationsReadSchema
} from "../../validators/notification/notification.validator.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

router.get(
  "/public",
  getPublicNotificationsController
);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

router.use(authenticate);

router.get(
  "/",
  validate(listNotificationsSchema),
  getUserNotificationsController
);

router.get(
  "/unread-count",
  getUnreadNotificationCountController
);

router.patch(
  "/read-all",
  validate(markAllNotificationsReadSchema),
  markAllNotificationsAsReadController
);

/*
|--------------------------------------------------------------------------
| Management
|--------------------------------------------------------------------------
| Add admin middleware here later.
|--------------------------------------------------------------------------
*/

router.post(
  "/manage",
  validate(createNotificationSchema),
  createNotificationController
);

router.patch(
  "/manage/:notificationId",
  validate(updateNotificationSchema),
  updateNotificationController
);

router.patch(
  "/manage/:notificationId/deactivate",
  validate(notificationIdParamSchema),
  deactivateNotificationController
);

/*
|--------------------------------------------------------------------------
| Individual Notification Actions
|--------------------------------------------------------------------------
*/

router.get(
  "/:notificationId",
  validate(notificationIdParamSchema),
  getUserNotificationByIdController
);

router.patch(
  "/:notificationId/read",
  validate(markNotificationReadSchema),
  markNotificationAsReadController
);

router.patch(
  "/:notificationId/dismiss",
  validate(dismissNotificationSchema),
  dismissNotificationController
);

router.patch(
  "/:notificationId/restore",
  validate(notificationIdParamSchema),
  restoreNotificationController
);

router.delete(
  "/all",
  deleteAllUserNotificationsController
);

router.delete(
  "/:notificationId",
  validate(deleteUserNotificationSchema),
  deleteUserNotificationController
);

export default router;