import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  getSleepFactorsController,
  getTrackerActivitiesController,
  getTrackerEmotionsController,
  getTrackerMetadataController
} from "../../controllers/trackers/trackerMetadata.controller.js";

import {
  getTrackerMetadataSchema
} from "../../validators/trackers/trackerMetadata.validator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(getTrackerMetadataSchema),
  getTrackerMetadataController
);

router.get(
  "/emotions",
  validate(getTrackerMetadataSchema),
  getTrackerEmotionsController
);

router.get(
  "/activities",
  validate(getTrackerMetadataSchema),
  getTrackerActivitiesController
);

router.get(
  "/sleep-factors",
  validate(getTrackerMetadataSchema),
  getSleepFactorsController
);

export default router;
