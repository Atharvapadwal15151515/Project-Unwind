import {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  autoSaveEntry,
  completeEntry,
  toggleEntryFavourite,
  archiveEntry,
  restoreEntry,
  deleteEntry,
  permanentlyDeleteEntry,
  getDraftEntries,
  getFavouriteEntries,
  getArchivedEntries,
  getDeletedEntries,
  getCalendarEntries
} from "../../services/journal/journalEntry.service.js";

import {
  buildJournalEntryFilters,
  normalizeJournalEntryData
} from "../../utils/journal/journalEntry.utils.js";

/*
  POST /api/journal/entries

  Create a new journal entry.
*/
export async function createJournalEntryController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const entryData =
      normalizeJournalEntryData(
        req.body
      );

    const entry =
      await createEntry(
        userId,
        entryData
      );

    return res
      .status(201)
      .json({
        success: true,
        message:
          "Journal entry created successfully",
        data: {
          entry
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/journal/entries

  Return the authenticated user's journal entries.
*/
export async function getJournalEntriesController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const query =
      req.validatedQuery ||
      req.query ||
      {};

    const filters =
      buildJournalEntryFilters(
        query
      );

    const result =
      await getEntries(
        userId,
        filters
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Journal entries retrieved successfully",
        data: {
          entries:
            result.entries,

          pagination:
            result.pagination
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/journal/entries/drafts

  Return draft journal entries.
*/
export async function getDraftJournalEntriesController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const query =
      req.validatedQuery ||
      req.query ||
      {};

    const filters =
      buildJournalEntryFilters(
        query
      );

    const result =
      await getDraftEntries(
        userId,
        filters
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Draft journal entries retrieved successfully",
        data: {
          entries:
            result.entries,

          pagination:
            result.pagination
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/journal/entries/favourites

  Return favourite journal entries.
*/
export async function getFavouriteJournalEntriesController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const query =
      req.validatedQuery ||
      req.query ||
      {};

    const filters =
      buildJournalEntryFilters(
        query
      );

    const result =
      await getFavouriteEntries(
        userId,
        filters
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Favourite journal entries retrieved successfully",
        data: {
          entries:
            result.entries,

          pagination:
            result.pagination
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/journal/entries/archived

  Return archived journal entries.
*/
export async function getArchivedJournalEntriesController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const query =
      req.validatedQuery ||
      req.query ||
      {};

    const filters =
      buildJournalEntryFilters(
        query
      );

    const result =
      await getArchivedEntries(
        userId,
        filters
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Archived journal entries retrieved successfully",
        data: {
          entries:
            result.entries,

          pagination:
            result.pagination
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/journal/entries/deleted

  Return soft-deleted journal entries.
*/
export async function getDeletedJournalEntriesController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const query =
      req.validatedQuery ||
      req.query ||
      {};

    const filters =
      buildJournalEntryFilters(
        query
      );

    const result =
      await getDeletedEntries(
        userId,
        filters
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Deleted journal entries retrieved successfully",
        data: {
          entries:
            result.entries,

          pagination:
            result.pagination
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/journal/entries/calendar

  Return journal entry counts grouped by date.
*/
export async function getJournalCalendarController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const query =
      req.validatedQuery ||
      req.query ||
      {};

    const calendar =
      await getCalendarEntries(
        userId,
        {
          dateFrom:
            query.dateFrom,

          dateTo:
            query.dateTo
        }
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Journal calendar retrieved successfully",
        data: {
          calendar
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  GET /api/journal/entries/:entryId

  Return one journal entry.
*/
export async function getJournalEntryController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      entryId
    } = req.params;

    const includeDeleted =
      req.query.includeDeleted ===
      "true";

    const entry =
      await getEntry(
        userId,
        entryId,
        {
          includeDeleted
        }
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Journal entry retrieved successfully",
        data: {
          entry
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  PATCH /api/journal/entries/:entryId

  Update a journal entry.
*/
export async function updateJournalEntryController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      entryId
    } = req.params;

    const entryData =
      normalizeJournalEntryData(
        req.body
      );

    const entry =
      await updateEntry(
        userId,
        entryId,
        entryData
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Journal entry updated successfully",
        data: {
          entry
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  PATCH /api/journal/entries/:entryId/auto-save

  Auto-save a journal draft.
*/
export async function autoSaveJournalEntryController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      entryId
    } = req.params;

    const entryData =
      normalizeJournalEntryData(
        req.body
      );

    const entry =
      await autoSaveEntry(
        userId,
        entryId,
        entryData
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Journal entry auto-saved successfully",
        data: {
          entry
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  PATCH /api/journal/entries/:entryId/complete

  Mark a journal entry as completed.
*/
export async function completeJournalEntryController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      entryId
    } = req.params;

    const entry =
      await completeEntry(
        userId,
        entryId
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Journal entry completed successfully",
        data: {
          entry
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  PATCH /api/journal/entries/:entryId/favourite

  Toggle favourite status.
*/
export async function toggleJournalEntryFavouriteController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      entryId
    } = req.params;

    const entry =
      await toggleEntryFavourite(
        userId,
        entryId
      );

    const message =
      entry.is_favourite
        ? "Journal entry added to favourites"
        : "Journal entry removed from favourites";

    return res
      .status(200)
      .json({
        success: true,
        message,
        data: {
          entry
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  PATCH /api/journal/entries/:entryId/archive

  Archive a journal entry.
*/
export async function archiveJournalEntryController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      entryId
    } = req.params;

    const entry =
      await archiveEntry(
        userId,
        entryId
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Journal entry archived successfully",
        data: {
          entry
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  PATCH /api/journal/entries/:entryId/restore

  Restore an archived or deleted entry.
*/
export async function restoreJournalEntryController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      entryId
    } = req.params;

    const entry =
      await restoreEntry(
        userId,
        entryId
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Journal entry restored successfully",
        data: {
          entry
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  DELETE /api/journal/entries/:entryId

  Soft-delete a journal entry.
*/
export async function softDeleteJournalEntryController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      entryId
    } = req.params;

    const entry =
      await deleteEntry(
        userId,
        entryId
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Journal entry moved to deleted items",
        data: {
          entry
        }
      });
  } catch (error) {
    next(error);
  }
}

/*
  DELETE /api/journal/entries/:entryId/permanent

  Permanently delete a soft-deleted entry.
*/
export async function permanentlyDeleteJournalEntryController(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      entryId
    } = req.params;

    const deletedEntry =
      await permanentlyDeleteEntry(
        userId,
        entryId
      );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Journal entry permanently deleted",
        data: {
          deletedEntry
        }
      });
  } catch (error) {
    next(error);
  }
}