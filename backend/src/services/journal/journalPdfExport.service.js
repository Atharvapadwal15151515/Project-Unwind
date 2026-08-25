import {
  getJournalEntryForPdf,
  getMultipleJournalEntriesForPdf,
  getJournalEntriesForPdf,
  getJournalAttachmentsForPdf,
  getJournalTagsForPdf,
  getJournalActivitiesForPdf,
  getJournalEmotionsForPdf
} from "../../models/journal/journalPdfExport.model.js";

import {
  resolveJournalSearchSorting,
  getJournalSearchDateRange
} from "../../utils/journal/journalSearch.util.js";

import AppError from "../../utils/AppError.js";

/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

async function enrichJournalEntries(
  entries,
  includeAttachments
) {
  if (
    entries.length === 0
  ) {
    return [];
  }

  const entryIds =
    entries.map(
      ({ entry_id }) =>
        entry_id
    );

  const [
    attachments,
    tags,
    activities,
    emotions
  ] = await Promise.all([
    includeAttachments
      ? getJournalAttachmentsForPdf(
          entryIds
        )
      : [],

    getJournalTagsForPdf(
      entryIds
    ),

    getJournalActivitiesForPdf(
      entryIds
    ),

    getJournalEmotionsForPdf(
      entryIds
    )
  ]);

  return entries.map(
    (entry) => ({
      ...entry,

      attachments:
        attachments.filter(
          (attachment) =>
            attachment.entry_id ===
            entry.entry_id
        ),

      tags: tags
        .filter(
          (tag) =>
            tag.entry_id ===
            entry.entry_id
        )
        .map(
          (tag) =>
            tag.tag_name
        ),

      activities:
        activities
          .filter(
            (
              activity
            ) =>
              activity.entry_id ===
              entry.entry_id
          )
          .map(
            (
              activity
            ) =>
              activity.activity_name
          ),

      emotions:
        emotions
          .filter(
            (
              emotion
            ) =>
              emotion.entry_id ===
              entry.entry_id
          )
          .map(
            (
              emotion
            ) =>
              emotion.emotion_name
          )
    })
  );
}

/*
|--------------------------------------------------------------------------
| Export Single Entry
|--------------------------------------------------------------------------
*/

export async function exportSingleJournalEntryPdf(
  userId,
  entryId,
  {
    includeAttachments = false
  } = {}
) {
  const entry =
    await getJournalEntryForPdf(
      userId,
      entryId
    );

  if (!entry) {
    throw new AppError(
      "Journal entry not found",
      404
    );
  }

  const enrichedEntries =
    await enrichJournalEntries(
      [entry],
      includeAttachments
    );

  return {
    title:
      entry.title ||
      "Journal Entry",

    entries:
      enrichedEntries
  };
}

/*
|--------------------------------------------------------------------------
| Export Multiple Entries
|--------------------------------------------------------------------------
*/

export async function exportMultipleJournalEntriesPdf(
  userId,
  payload
) {
  const entries =
    await getMultipleJournalEntriesForPdf(
      userId,
      payload.entryIds
    );

  if (
    entries.length === 0
  ) {
    throw new AppError(
      "No Journal entries found",
      404
    );
  }

  const enrichedEntries =
    await enrichJournalEntries(
      entries,
      payload.includeAttachments
    );

  return {
    title:
      payload.documentTitle ||
      "Journal Export",

    entries:
      enrichedEntries
  };
}

/*
|--------------------------------------------------------------------------
| Export Complete Journal
|--------------------------------------------------------------------------
*/

export async function exportCompleteJournalPdf(
  userId,
  query
) {
  const {
    sortBy,
    sortOrder,

    fromDate,
    toDate,

    documentTitle,

    includeAttachments,

    ...filters
  } = query;

  const sorting =
    resolveJournalSearchSorting({
      sortBy,
      sortOrder
    });

  const dateRange =
    getJournalSearchDateRange({
      fromDate,
      toDate
    });

  const entries =
    await getJournalEntriesForPdf(
      {
        userId,

        filters: {
          ...filters,
          ...dateRange
        },

        sorting
      }
    );

  const enrichedEntries =
    await enrichJournalEntries(
      entries,
      includeAttachments
    );

  return {
    title:
      documentTitle ||
      "Complete Journal",

    entries:
      enrichedEntries
  };
}