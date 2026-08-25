import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  validate
} from "../../middleware/validate.js";

import {
  getJournalMetadataController,
  getJournalEmotionsController,
  getJournalTagsController,
  createJournalTagController,
  updateJournalTagController,
  deleteJournalTagController,
  getJournalActivitiesController,
  createJournalActivityController,
  updateJournalActivityController,
  deleteJournalActivityController
} from "../../controllers/journal/journalMetadata.controller.js";

import {
  createJournalTagSchema,
  updateJournalTagSchema,
  deleteJournalTagSchema,
  createJournalActivitySchema,
  updateJournalActivitySchema,
  deleteJournalActivitySchema
} from "../../validators/journal/journalMetadata.validator.js";

const router = express.Router();

router.use(authenticate);

// =========================================================
// COMBINED METADATA
// =========================================================

router.get(
  "/",
  getJournalMetadataController
);

// =========================================================
// EMOTIONS
// =========================================================

router.get(
  "/emotions",
  getJournalEmotionsController
);

// =========================================================
// TAGS
// =========================================================

router.get(
  "/tags",
  getJournalTagsController
);

router.post(
  "/tags",
  validate(
    createJournalTagSchema
  ),
  createJournalTagController
);

router.patch(
  "/tags/:tagId",
  validate(
    updateJournalTagSchema
  ),
  updateJournalTagController
);

router.delete(
  "/tags/:tagId",
  validate(
    deleteJournalTagSchema
  ),
  deleteJournalTagController
);

// =========================================================
// ACTIVITIES
// =========================================================

router.get(
  "/activities",
  getJournalActivitiesController
);

router.post(
  "/activities",
  validate(
    createJournalActivitySchema
  ),
  createJournalActivityController
);

router.patch(
  "/activities/:activityId",
  validate(
    updateJournalActivitySchema
  ),
  updateJournalActivityController
);

router.delete(
  "/activities/:activityId",
  validate(
    deleteJournalActivitySchema
  ),
  deleteJournalActivityController
);

export default router;