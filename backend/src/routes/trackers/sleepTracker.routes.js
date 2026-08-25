import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  createSleepController,
  getSleepEntriesController,
  getSleepEntryByDateController,
  getSleepEntryByIdController,
  permanentlyDeleteSleepController,
  restoreSleepController,
  softDeleteSleepController,
  updateSleepController
} from "../../controllers/trackers/sleepTracker.controller.js";

import {
  createSleepEntrySchema,
  getSleepEntriesSchema,
  permanentlyDeleteSleepEntrySchema,
  restoreSleepEntrySchema,
  sleepDateParamSchema,
  sleepEntryIdParamSchema,
  softDeleteSleepEntrySchema,
  updateSleepEntrySchema
} from "../../validators/trackers/sleepTracker.validator.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  validate(createSleepEntrySchema),
  createSleepController
);

router.get(
  "/",
  validate(getSleepEntriesSchema),
  getSleepEntriesController
);

router.get(
  "/date/:sleepDate",
  validate(sleepDateParamSchema),
  getSleepEntryByDateController
);

router.get(
  "/:sleepEntryId",
  validate(sleepEntryIdParamSchema),
  getSleepEntryByIdController
);

router.patch(
  "/:sleepEntryId",
  validate(updateSleepEntrySchema),
  updateSleepController
);

router.delete(
  "/:sleepEntryId",
  validate(softDeleteSleepEntrySchema),
  softDeleteSleepController
);

router.patch(
  "/:sleepEntryId/restore",
  validate(restoreSleepEntrySchema),
  restoreSleepController
);

router.delete(
  "/:sleepEntryId/permanent",
  validate(
    permanentlyDeleteSleepEntrySchema
  ),
  permanentlyDeleteSleepController
);

export default router;
