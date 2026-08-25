import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  createCustomPromptController,
  getPromptController,
  getSystemPromptsController,
  getCustomPromptsController,
  getPromptsController,
  updateCustomPromptController,
  updateCustomPromptStatusController,
  removeCustomPromptController,
  getRandomPromptController,
  getDailyPromptController,
  recordPromptShownController,
  markPromptUsedController,
  markLatestPromptUsedController,
  getPromptHistoryController,
  removePromptHistoryController,
  getPromptStatisticsController,
  getPromptCategoriesController
} from "../../controllers/journal/journalPrompt.controller.js";
import requireJournalUnlock from "../../middleware/journal/requireJournalUnlock.js";
import {
  createCustomPromptRequestSchema,
  getPromptRequestSchema,
  getSystemPromptsRequestSchema,
  getCustomPromptsRequestSchema,
  getPromptsRequestSchema,
  updateCustomPromptRequestSchema,
  updateCustomPromptStatusRequestSchema,
  deleteCustomPromptRequestSchema,
  getRandomPromptRequestSchema,
  getDailyPromptRequestSchema,
  recordPromptShownRequestSchema,
  markPromptUsedRequestSchema,
  markLatestPromptUsedRequestSchema,
  getPromptHistoryRequestSchema,
  deletePromptHistoryRequestSchema,
  getPromptStatisticsRequestSchema,
  getPromptCategoriesRequestSchema
} from "../../validators/journal/journalPrompt.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Prompt Categories
|--------------------------------------------------------------------------
*/

router.get(
  "/categories",
  authenticate,
  requireJournalUnlock,
  validate(
    getPromptCategoriesRequestSchema
  ),
  getPromptCategoriesController
);

/*
|--------------------------------------------------------------------------
| Prompt Statistics
|--------------------------------------------------------------------------
*/

router.get(
  "/statistics",
  authenticate,
  requireJournalUnlock,
  validate(
    getPromptStatisticsRequestSchema
  ),
  getPromptStatisticsController
);

/*
|--------------------------------------------------------------------------
| Prompt History
|--------------------------------------------------------------------------
*/

router.get(
  "/history",
  authenticate,
  requireJournalUnlock,
  validate(
    getPromptHistoryRequestSchema
  ),
  getPromptHistoryController
);

router.delete(
  "/history/:promptHistoryId",
  authenticate,
  requireJournalUnlock,
  validate(
    deletePromptHistoryRequestSchema
  ),
  removePromptHistoryController
);

router.patch(
  "/history/:promptHistoryId/use",
  authenticate,
  requireJournalUnlock,
  validate(
    markPromptUsedRequestSchema
  ),
  markPromptUsedController
);

/*
|--------------------------------------------------------------------------
| Daily / Random
|--------------------------------------------------------------------------
*/

router.get(
  "/daily",
  authenticate,
  requireJournalUnlock,
  validate(
    getDailyPromptRequestSchema
  ),
  getDailyPromptController
);

router.get(
  "/random",
  authenticate,
  requireJournalUnlock,
  validate(
    getRandomPromptRequestSchema
  ),
  getRandomPromptController
);

/*
|--------------------------------------------------------------------------
| Prompt Collections
|--------------------------------------------------------------------------
*/

router.get(
  "/system",
  authenticate,
  requireJournalUnlock,
  validate(
    getSystemPromptsRequestSchema
  ),
  getSystemPromptsController
);

router.get(
  "/custom",
  authenticate,
  requireJournalUnlock,
  validate(
    getCustomPromptsRequestSchema
  ),
  getCustomPromptsController
);

router.get(
  "/",
  authenticate,
  requireJournalUnlock,
  validate(
    getPromptsRequestSchema
  ),
  getPromptsController
);

router.post(
  "/",
  authenticate,
  requireJournalUnlock,
  validate(
    createCustomPromptRequestSchema
  ),
  createCustomPromptController
);

/*
|--------------------------------------------------------------------------
| Prompt Actions
|--------------------------------------------------------------------------
*/

router.post(
  "/:promptId/shown",
  authenticate,
  requireJournalUnlock,
  validate(
    recordPromptShownRequestSchema
  ),
  recordPromptShownController
);

router.patch(
  "/:promptId/use-latest",
  authenticate,
  requireJournalUnlock,
  validate(
    markLatestPromptUsedRequestSchema
  ),
  markLatestPromptUsedController
);

router.patch(
  "/:promptId/status",
  authenticate,
  requireJournalUnlock,
  validate(
    updateCustomPromptStatusRequestSchema
  ),
  updateCustomPromptStatusController
);

/*
|--------------------------------------------------------------------------
| Prompt CRUD
|--------------------------------------------------------------------------
*/

router.get(
  "/:promptId",
  authenticate,
  requireJournalUnlock,
  validate(
    getPromptRequestSchema
  ),
  getPromptController
);

router.patch(
  "/:promptId",
  authenticate,
  requireJournalUnlock,
  validate(
    updateCustomPromptRequestSchema
  ),
  updateCustomPromptController
);

router.delete(
  "/:promptId",
  authenticate,
  requireJournalUnlock,
  validate(
    deleteCustomPromptRequestSchema
  ),
  removeCustomPromptController
);

export default router;