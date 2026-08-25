import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  createTrackerReminderController,
  getTrackerReminderByIdController,
  getTrackerRemindersController,
  permanentlyDeleteTrackerReminderController,
  restoreTrackerReminderController,
  softDeleteTrackerReminderController,
  updateTrackerReminderController
} from "../../controllers/trackers/trackerReminder.controller.js";

import {
  createTrackerReminderSchema,
  getTrackerRemindersSchema,
  permanentlyDeleteTrackerReminderSchema,
  restoreTrackerReminderSchema,
  softDeleteTrackerReminderSchema,
  trackerReminderIdParamSchema,
  updateTrackerReminderSchema
} from "../../validators/trackers/trackerReminder.validator.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  validate(createTrackerReminderSchema),
  createTrackerReminderController
);

router.get(
  "/",
  validate(getTrackerRemindersSchema),
  getTrackerRemindersController
);

router.get(
  "/:trackerReminderId",
  validate(trackerReminderIdParamSchema),
  getTrackerReminderByIdController
);

router.patch(
  "/:trackerReminderId",
  validate(updateTrackerReminderSchema),
  updateTrackerReminderController
);

router.delete(
  "/:trackerReminderId",
  validate(
    softDeleteTrackerReminderSchema
  ),
  softDeleteTrackerReminderController
);

router.patch(
  "/:trackerReminderId/restore",
  validate(
    restoreTrackerReminderSchema
  ),
  restoreTrackerReminderController
);

router.delete(
  "/:trackerReminderId/permanent",
  validate(
    permanentlyDeleteTrackerReminderSchema
  ),
  permanentlyDeleteTrackerReminderController
);

export default router;
