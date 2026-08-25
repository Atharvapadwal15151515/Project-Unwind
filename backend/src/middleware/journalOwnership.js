import AppError from "../utils/AppError.js";

import {
  getJournalEntryByIdAndUserId
} from "../models/journal/journalEntry.model.js";

/*
  Verify that the requested journal entry belongs
  to the authenticated user.

  Successful ownership validation adds:

  req.journalEntry
*/
export async function journalOwnership(
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
      await getJournalEntryByIdAndUserId(
        entryId,
        userId,
        {
          includeDeleted: true
        }
      );

    if (!entry) {
      throw new AppError(
        "Journal entry not found",
        404
      );
    }

    req.journalEntry =
      entry;

    next();
  } catch (error) {
    next(error);
  }
}

/*
  Verify ownership while excluding entries that
  have already been soft-deleted.

  Successful validation adds:

  req.journalEntry
*/
export async function activeJournalOwnership(
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
      await getJournalEntryByIdAndUserId(
        entryId,
        userId,
        {
          includeDeleted: false
        }
      );

    if (!entry) {
      throw new AppError(
        "Journal entry not found",
        404
      );
    }

    req.journalEntry =
      entry;

    next();
  } catch (error) {
    next(error);
  }
}

/*
  Allow access only when the journal entry is
  currently soft-deleted.

  This middleware is intended for permanent
  deletion routes.
*/
export async function deletedJournalOwnership(
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
      await getJournalEntryByIdAndUserId(
        entryId,
        userId,
        {
          includeDeleted: true
        }
      );

    if (!entry) {
      throw new AppError(
        "Journal entry not found",
        404
      );
    }

    if (
      entry.is_deleted !== true
    ) {
      throw new AppError(
        "Journal entry must be moved to deleted items first",
        400
      );
    }

    req.journalEntry =
      entry;

    next();
  } catch (error) {
    next(error);
  }
}