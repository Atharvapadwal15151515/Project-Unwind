import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";

import {
  journalOwnership,
  activeJournalOwnership,
  deletedJournalOwnership
} from "../../middleware/journalOwnership.js";

import {
  createJournalEntryController,
  getJournalEntriesController,
  getDraftJournalEntriesController,
  getFavouriteJournalEntriesController,
  getArchivedJournalEntriesController,
  getDeletedJournalEntriesController,
  getJournalCalendarController,
  getJournalEntryController,
  updateJournalEntryController,
  autoSaveJournalEntryController,
  completeJournalEntryController,
  toggleJournalEntryFavouriteController,
  archiveJournalEntryController,
  restoreJournalEntryController,
  softDeleteJournalEntryController,
  permanentlyDeleteJournalEntryController
} from "../../controllers/journal/journalEntry.controller.js";
import requireJournalUnlock from "../../middleware/journal/requireJournalUnlock.js";
import {
  createJournalEntrySchema,
  getJournalEntriesSchema,
  getJournalCalendarSchema,
  journalEntryIdParamSchema,
  updateJournalEntrySchema,
  autoSaveJournalEntrySchema,
  completeJournalEntrySchema,
  favouriteJournalEntrySchema,
  archiveJournalEntrySchema,
  restoreJournalEntrySchema,
  softDeleteJournalEntrySchema,
  permanentlyDeleteJournalEntrySchema
} from "../../validators/journal/journalEntry.validator.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Collection Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authenticate,
  requireJournalUnlock,
  validate(createJournalEntrySchema),
  createJournalEntryController
);

router.get(
  "/",
  authenticate,
  requireJournalUnlock,
  validate(getJournalEntriesSchema),
  getJournalEntriesController
);

router.get(
  "/drafts",
  authenticate,
  requireJournalUnlock,
  validate(getJournalEntriesSchema),
  getDraftJournalEntriesController
);

router.get(
  "/favourites",
  authenticate,
  requireJournalUnlock,
  validate(getJournalEntriesSchema),
  getFavouriteJournalEntriesController
);

router.get(
  "/archived",
  authenticate,
  requireJournalUnlock,
  validate(getJournalEntriesSchema),
  getArchivedJournalEntriesController
);

router.get(
  "/deleted",
  authenticate,
  requireJournalUnlock,
  validate(getJournalEntriesSchema),
  getDeletedJournalEntriesController
);

router.get(
  "/calendar",
  authenticate,
  requireJournalUnlock,
  validate(getJournalCalendarSchema),
  getJournalCalendarController
);

/*
|--------------------------------------------------------------------------
| Single Entry Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/:entryId",
  authenticate,
  requireJournalUnlock,
  validate(journalEntryIdParamSchema),
  journalOwnership,
  getJournalEntryController
);

router.patch(
  "/:entryId",
  authenticate,
  requireJournalUnlock,
  validate(updateJournalEntrySchema),
  activeJournalOwnership,
  updateJournalEntryController
);

router.patch(
  "/:entryId/auto-save",
  authenticate,
  requireJournalUnlock,
  validate(autoSaveJournalEntrySchema),
  activeJournalOwnership,
  autoSaveJournalEntryController
);

router.patch(
  "/:entryId/complete",
  authenticate,
  requireJournalUnlock,
  validate(completeJournalEntrySchema),
  activeJournalOwnership,
  completeJournalEntryController
);

router.patch(
  "/:entryId/favourite",
  authenticate,
  requireJournalUnlock,
  validate(favouriteJournalEntrySchema),
  activeJournalOwnership,
  toggleJournalEntryFavouriteController
);

router.patch(
  "/:entryId/archive",
  authenticate,
  requireJournalUnlock,
  validate(archiveJournalEntrySchema),
  activeJournalOwnership,
  archiveJournalEntryController
);

router.patch(
  "/:entryId/restore",
  authenticate,
  requireJournalUnlock,
  validate(restoreJournalEntrySchema),
  journalOwnership,
  restoreJournalEntryController
);

router.delete(
  "/:entryId",
  authenticate,
  requireJournalUnlock,
  validate(softDeleteJournalEntrySchema),
  activeJournalOwnership,
  softDeleteJournalEntryController
);

router.delete(
  "/:entryId/permanent",
  authenticate,
  requireJournalUnlock,
  validate(
    permanentlyDeleteJournalEntrySchema
  ),
  deletedJournalOwnership,
  permanentlyDeleteJournalEntryController
);

export default router;