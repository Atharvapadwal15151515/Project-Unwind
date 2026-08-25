import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  getTrackerSettingsController,
  updateTrackerSettingsController
} from "../../controllers/trackers/trackerSettings.controller.js";

import {
  getTrackerSettingsSchema,
  updateTrackerSettingsSchema
} from "../../validators/trackers/trackerSettings.validator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(getTrackerSettingsSchema),
  getTrackerSettingsController
);

router.patch(
  "/",
  validate(updateTrackerSettingsSchema),
  updateTrackerSettingsController
);

export default router;
