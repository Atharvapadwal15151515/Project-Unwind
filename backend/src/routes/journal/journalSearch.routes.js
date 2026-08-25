import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  validate
} from "../../middleware/validate.js";

import {
  searchJournalEntriesController
} from "../../controllers/journal/journalSearch.controller.js";

import {
  journalSearchQuerySchema
} from "../../validators/journal/journalSearch.validator.js";

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Search Journal Entries
|--------------------------------------------------------------------------
|
| GET /api/journal/search
|
| Query Parameters:
|
| q
| status
| entryType
| moodLabel
| moodScore
| isFavourite
| isLocked
| hidePreview
| isDeleted
| hasAttachments
| tagId
| activityId
| emotionId
| promptId
| fromDate
| toDate
| sortBy
| sortOrder
| page
| limit
|
*/

router.get(
  "/",
  authenticate,
  validate(
    journalSearchQuerySchema
  ),
  searchJournalEntriesController
);

export default router;