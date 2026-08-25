import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  createMoodController,
  getMoodEntriesController,
  getMoodEntryByIdController,
  permanentlyDeleteMoodController,
  restoreMoodController,
  softDeleteMoodController,
  updateMoodController
} from "../../controllers/trackers/moodTracker.controller.js";

import {
  createMoodEntrySchema,
  getMoodEntriesSchema,
  moodEntryIdParamSchema,
  permanentlyDeleteMoodEntrySchema,
  restoreMoodEntrySchema,
  softDeleteMoodEntrySchema,
  updateMoodEntrySchema
} from "../../validators/trackers/moodTracker.validator.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  validate(createMoodEntrySchema),
  createMoodController
);

router.get(
  "/",
  validate(getMoodEntriesSchema),
  getMoodEntriesController
);

router.get(
  "/:moodEntryId",
  validate(moodEntryIdParamSchema),
  getMoodEntryByIdController
);

router.patch(
  "/:moodEntryId",
  validate(updateMoodEntrySchema),
  updateMoodController
);

router.delete(
  "/:moodEntryId",
  validate(softDeleteMoodEntrySchema),
  softDeleteMoodController
);

router.patch(
  "/:moodEntryId/restore",
  validate(restoreMoodEntrySchema),
  restoreMoodController
);

router.delete(
  "/:moodEntryId/permanent",
  validate(
    permanentlyDeleteMoodEntrySchema
  ),
  permanentlyDeleteMoodController
);

export default router;
