import pool from "../../config/database.js";

import AppError from "../../utils/AppError.js";

import {
  createJournalEntry,
  getJournalEntryByIdAndUserId,
  getJournalEntriesByUserId,
  updateJournalEntry,
  autoSaveJournalEntry,
  completeJournalEntry,
  toggleJournalEntryFavourite,
  archiveJournalEntry,
  restoreJournalEntry,
  softDeleteJournalEntry,
  permanentlyDeleteJournalEntry,
  getJournalCalendarByUserId
} from "../../models/journal/journalEntry.model.js";

import {
  replaceJournalEntryEmotions,
  removeAllJournalEntryEmotions,
  getJournalEntryEmotions,
  getActiveEmotionsByIds
} from "../../models/journal/journalEntryEmotion.model.js";

import {
  replaceJournalEntryTags,
  removeAllJournalEntryTags,
  getJournalEntryTags,
  getAccessibleTagsByIds
} from "../../models/journal/journalEntryTag.model.js";

import {
  replaceJournalEntryActivities,
  removeAllJournalEntryActivities,
  getJournalEntryActivities,
  getAccessibleActivitiesByIds
} from "../../models/journal/journalEntryActivity.model.js";

import {
  getJournalEntryCoverAttachment
} from "../../models/journal/journalAttachment.model.js";

/*
  Convert API camelCase input into the snake_case
  column names expected by journalEntry.model.js.
*/
function mapEntryUpdates(entryData = {}) {
  const updates = {};

  if (entryData.title !== undefined) {
    updates.title =
      entryData.title;
  }

  if (entryData.content !== undefined) {
    updates.content =
      entryData.content;
  }

  if (
    entryData.entryType !== undefined
  ) {
    updates.entry_type =
      entryData.entryType;
  }

  if (
    entryData.entryStatus !== undefined
  ) {
    updates.entry_status =
      entryData.entryStatus;
  }

  if (
    entryData.moodLabel !== undefined
  ) {
    updates.mood_label =
      entryData.moodLabel;
  }

  if (
    entryData.moodScore !== undefined
  ) {
    updates.mood_score =
      entryData.moodScore;
  }

  if (
    entryData.promptId !== undefined
  ) {
    updates.prompt_id =
      entryData.promptId;
  }

  if (
    entryData.promptTextSnapshot !==
    undefined
  ) {
    updates.prompt_text_snapshot =
      entryData.promptTextSnapshot;
  }

  if (
    entryData.entryDate !== undefined
  ) {
    updates.entry_date =
      entryData.entryDate;
  }

  if (
    entryData.isFavourite !== undefined
  ) {
    updates.is_favourite =
      entryData.isFavourite;
  }

  if (
    entryData.isLocked !== undefined
  ) {
    updates.is_locked =
      entryData.isLocked;
  }

  if (
    entryData.hidePreview !== undefined
  ) {
    updates.hide_preview =
      entryData.hidePreview;
  }

  if (
    entryData.lastAutoSavedAt !==
    undefined
  ) {
    updates.last_auto_saved_at =
      entryData.lastAutoSavedAt;
  }

  return updates;
}

/*
  Return unique IDs while preserving their order.
*/
function getUniqueIds(ids = []) {
  return [
    ...new Set(ids)
  ];
}

/*
  Load an entry and ensure it belongs to the user.
*/
async function requireJournalEntry(
  userId,
  entryId,
  options = {},
  client = null
) {
  const entry =
    await getJournalEntryByIdAndUserId(
      entryId,
      userId,
      {
        includeDeleted:
          options.includeDeleted === true
      },
      client
    );

  if (!entry) {
    throw new AppError(
      "Journal entry not found",
      404
    );
  }

  return entry;
}

/*
  Load emotions, tags, activities and cover attachment
  and attach them to one journal entry response.
*/
async function attachEntryRelationships(
  entry,
  client = null
) {
  if (!entry) {
    return null;
  }

  /*
    Never run simultaneous queries using the same
    transaction-scoped PostgreSQL client.
  */
  const emotions =
    await getJournalEntryEmotions(
      entry.entry_id,
      client
    );

  const tags =
    await getJournalEntryTags(
      entry.entry_id,
      client
    );

  const activities =
    await getJournalEntryActivities(
      entry.entry_id,
      client
    );

  const coverAttachment =
    await getJournalEntryCoverAttachment(
      entry.entry_id,
      entry.user_id,
      client
    );

  return {
    ...entry,
    emotions,
    tags,
    activities,
    coverAttachment
  };
}

/*
  Validate emotion IDs before saving relationships.
*/
async function validateEmotionIds(
  emotionIds,
  client = null
) {
  const uniqueEmotionIds =
    getUniqueIds(emotionIds);

  if (
    uniqueEmotionIds.length === 0
  ) {
    return [];
  }

  const emotions =
    await getActiveEmotionsByIds(
      uniqueEmotionIds,
      client
    );

  if (
    emotions.length !==
    uniqueEmotionIds.length
  ) {
    throw new AppError(
      "One or more selected emotions are invalid or inactive",
      400
    );
  }

  return uniqueEmotionIds;
}

/*
  Validate that system tags or the user's own tags
  are being attached.
*/
async function validateTagIds(
  userId,
  tagIds,
  client = null
) {
  const uniqueTagIds =
    getUniqueIds(tagIds);

  if (uniqueTagIds.length === 0) {
    return [];
  }

  const tags =
    await getAccessibleTagsByIds(
      userId,
      uniqueTagIds,
      client
    );

  if (
    tags.length !==
    uniqueTagIds.length
  ) {
    throw new AppError(
      "One or more selected tags are invalid, inactive, or inaccessible",
      400
    );
  }

  return uniqueTagIds;
}

/*
  Validate that system activities or the user's own
  activities are being attached.
*/
async function validateActivityIds(
  userId,
  activityIds,
  client = null
) {
  const uniqueActivityIds =
    getUniqueIds(activityIds);

  if (
    uniqueActivityIds.length === 0
  ) {
    return [];
  }

  const activities =
    await getAccessibleActivitiesByIds(
      userId,
      uniqueActivityIds,
      client
    );

  if (
    activities.length !==
    uniqueActivityIds.length
  ) {
    throw new AppError(
      "One or more selected activities are invalid, inactive, or inaccessible",
      400
    );
  }

  return uniqueActivityIds;
}

/*
  Create a journal entry and attach its emotions,
  tags and activities inside one transaction.
*/
export async function createEntry(
  userId,
  entryData
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const emotionIds =
      await validateEmotionIds(
        entryData.emotionIds || [],
        client
      );

    const tagIds =
      await validateTagIds(
        userId,
        entryData.tagIds || [],
        client
      );

    const activityIds =
      await validateActivityIds(
        userId,
        entryData.activityIds || [],
        client
      );

    const entry =
      await createJournalEntry(
        userId,
        {
          title:
            entryData.title,

          content:
            entryData.content,

          entryType:
            entryData.entryType,

          entryStatus:
            entryData.entryStatus,

          moodLabel:
            entryData.moodLabel,

          moodScore:
            entryData.moodScore,

          promptId:
            entryData.promptId,

          promptTextSnapshot:
            entryData
              .promptTextSnapshot,

          entryDate:
            entryData.entryDate,

          isFavourite:
            entryData.isFavourite,

          isLocked:
            entryData.isLocked,

          hidePreview:
            entryData.hidePreview,

          lastAutoSavedAt:
            entryData
              .lastAutoSavedAt
        },
        client
      );

  await replaceJournalEntryEmotions(
  entry.entry_id,
  emotionIds,
  client
);

await replaceJournalEntryTags(
  entry.entry_id,
  tagIds,
  client
);

await replaceJournalEntryActivities(
  entry.entry_id,
  activityIds,
  client
);

    const completeEntry =
      await attachEntryRelationships(
        entry,
        client
      );

    await client.query("COMMIT");

    return completeEntry;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/*
  Return paginated journal entries belonging to
  the authenticated user.
*/
export async function getEntries(
  userId,
  filters = {}
) {
  const result =
    await getJournalEntriesByUserId(
      userId,
      filters
    );

  const entries =
    await Promise.all(
      result.entries.map(
        (entry) =>
          attachEntryRelationships(
            entry
          )
      )
    );

  return {
    entries,
    pagination:
      result.pagination
  };
}

/*
  Return one complete journal entry.
*/
export async function getEntry(
  userId,
  entryId,
  options = {}
) {
  const entry =
    await requireJournalEntry(
      userId,
      entryId,
      {
        includeDeleted:
          options.includeDeleted === true
      }
    );

  return attachEntryRelationships(
    entry
  );
}

/*
  Update the entry and optionally replace emotions,
  tags or activities.

  Relationship arrays are replaced only when their
  properties are present in the request body.
*/
export async function updateEntry(
  userId,
  entryId,
  entryData
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    await requireJournalEntry(
      userId,
      entryId,
      {
        includeDeleted: false
      },
      client
    );

    let emotionIds;

    let tagIds;

    let activityIds;

    if (
      entryData.emotionIds !==
      undefined
    ) {
      emotionIds =
        await validateEmotionIds(
          entryData.emotionIds,
          client
        );
    }

    if (
      entryData.tagIds !==
      undefined
    ) {
      tagIds =
        await validateTagIds(
          userId,
          entryData.tagIds,
          client
        );
    }

    if (
      entryData.activityIds !==
      undefined
    ) {
      activityIds =
        await validateActivityIds(
          userId,
          entryData.activityIds,
          client
        );
    }

    const updates =
      mapEntryUpdates(entryData);

    const updatedEntry =
      await updateJournalEntry(
        entryId,
        userId,
        updates,
        client
      );

    if (!updatedEntry) {
      throw new AppError(
        "Journal entry not found",
        404
      );
    }

    if (
      emotionIds !== undefined
    ) {
      await replaceJournalEntryEmotions(
        entryId,
        emotionIds,
        client
      );
    }

    if (tagIds !== undefined) {
      await replaceJournalEntryTags(
        entryId,
        tagIds,
        client
      );
    }

    if (
      activityIds !== undefined
    ) {
      await replaceJournalEntryActivities(
        entryId,
        activityIds,
        client
      );
    }

    const completeEntry =
      await attachEntryRelationships(
        updatedEntry,
        client
      );

    await client.query("COMMIT");

    return completeEntry;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/*
  Automatically save an incomplete journal entry.
*/
export async function autoSaveEntry(
  userId,
  entryId,
  entryData
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const existingEntry =
      await requireJournalEntry(
        userId,
        entryId,
        {
          includeDeleted: false
        },
        client
      );

    if (
      existingEntry.entry_status ===
      "archived"
    ) {
      throw new AppError(
        "Archived journal entries cannot be auto-saved",
        400
      );
    }

    const updates =
      mapEntryUpdates(entryData);

    const updatedEntry =
      await autoSaveJournalEntry(
        entryId,
        userId,
        updates,
        client
      );

    if (!updatedEntry) {
      throw new AppError(
        "Journal entry not found",
        404
      );
    }

    if (
      entryData.emotionIds !==
      undefined
    ) {
      const emotionIds =
        await validateEmotionIds(
          entryData.emotionIds,
          client
        );

      await replaceJournalEntryEmotions(
        entryId,
        emotionIds,
        client
      );
    }

    if (
      entryData.tagIds !==
      undefined
    ) {
      const tagIds =
        await validateTagIds(
          userId,
          entryData.tagIds,
          client
        );

      await replaceJournalEntryTags(
        entryId,
        tagIds,
        client
      );
    }

    if (
      entryData.activityIds !==
      undefined
    ) {
      const activityIds =
        await validateActivityIds(
          userId,
          entryData.activityIds,
          client
        );

      await replaceJournalEntryActivities(
        entryId,
        activityIds,
        client
      );
    }

    const completeEntry =
      await attachEntryRelationships(
        updatedEntry,
        client
      );

    await client.query("COMMIT");

    return completeEntry;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/*
  Convert a draft into a completed entry.
*/
export async function completeEntry(
  userId,
  entryId
) {
  const existingEntry =
    await requireJournalEntry(
      userId,
      entryId
    );

  if (
    existingEntry.entry_status ===
    "completed"
  ) {
    return attachEntryRelationships(
      existingEntry
    );
  }

  if (
    existingEntry.entry_status ===
    "archived"
  ) {
    throw new AppError(
      "Restore the journal entry before completing it",
      400
    );
  }

  const hasContent =
    Boolean(
      existingEntry.content?.trim()
    );

  const hasTitle =
    Boolean(
      existingEntry.title?.trim()
    );

  if (!hasContent && !hasTitle) {
    throw new AppError(
      "A journal entry must contain a title or content before it can be completed",
      400
    );
  }

  const updatedEntry =
    await completeJournalEntry(
      entryId,
      userId
    );

  if (!updatedEntry) {
    throw new AppError(
      "Journal entry not found",
      404
    );
  }

  return attachEntryRelationships(
    updatedEntry
  );
}

/*
  Toggle favourite status.
*/
export async function toggleEntryFavourite(
  userId,
  entryId
) {
  await requireJournalEntry(
    userId,
    entryId
  );

  const updatedEntry =
    await toggleJournalEntryFavourite(
      entryId,
      userId
    );

  if (!updatedEntry) {
    throw new AppError(
      "Journal entry not found",
      404
    );
  }

  return attachEntryRelationships(
    updatedEntry
  );
}

/*
  Archive an active journal entry.
*/
export async function archiveEntry(
  userId,
  entryId
) {
  const existingEntry =
    await requireJournalEntry(
      userId,
      entryId
    );

  if (
    existingEntry.entry_status ===
    "archived"
  ) {
    return attachEntryRelationships(
      existingEntry
    );
  }

  const updatedEntry =
    await archiveJournalEntry(
      entryId,
      userId
    );

  if (!updatedEntry) {
    throw new AppError(
      "Journal entry not found",
      404
    );
  }

  return attachEntryRelationships(
    updatedEntry
  );
}

/*
  Restore an archived or deleted entry.
*/
export async function restoreEntry(
  userId,
  entryId
) {
  const existingEntry =
    await requireJournalEntry(
      userId,
      entryId,
      {
        includeDeleted: true
      }
    );

  const canRestore =
    existingEntry.is_deleted ===
      true ||
    existingEntry.entry_status ===
      "archived";

  if (!canRestore) {
    throw new AppError(
      "This journal entry is not archived or deleted",
      400
    );
  }

  const updatedEntry =
    await restoreJournalEntry(
      entryId,
      userId
    );

  if (!updatedEntry) {
    throw new AppError(
      "Journal entry could not be restored",
      400
    );
  }

  return attachEntryRelationships(
    updatedEntry
  );
}

/*
  Soft-delete an entry for 30 days.
*/
export async function deleteEntry(
  userId,
  entryId
) {
  const existingEntry =
    await requireJournalEntry(
      userId,
      entryId,
      {
        includeDeleted: true
      }
    );

  if (
    existingEntry.is_deleted === true
  ) {
    return attachEntryRelationships(
      existingEntry
    );
  }

  const deletedEntry =
    await softDeleteJournalEntry(
      entryId,
      userId
    );

  if (!deletedEntry) {
    throw new AppError(
      "Journal entry not found",
      404
    );
  }

  return attachEntryRelationships(
    deletedEntry
  );
}

/*
  Permanently delete an entry and its junction-table
  relationships inside one transaction.
*/
export async function permanentlyDeleteEntry(
  userId,
  entryId
) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const existingEntry =
      await requireJournalEntry(
        userId,
        entryId,
        {
          includeDeleted: true
        },
        client
      );

    if (
      existingEntry.is_deleted !==
      true
    ) {
      throw new AppError(
        "The journal entry must be moved to deleted items before permanent deletion",
        400
      );
    }

   await removeAllJournalEntryEmotions(
  entryId,
  client
);

await removeAllJournalEntryTags(
  entryId,
  client
);

await removeAllJournalEntryActivities(
  entryId,
  client
);

    const deletedEntry =
      await permanentlyDeleteJournalEntry(
        entryId,
        userId,
        client
      );

    if (!deletedEntry) {
      throw new AppError(
        "Journal entry not found",
        404
      );
    }

    await client.query("COMMIT");

    return deletedEntry;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/*
  Return draft entries.
*/
export async function getDraftEntries(
  userId,
  filters = {}
) {
  return getEntries(
    userId,
    {
      ...filters,
      status: "draft",
      isDeleted: false
    }
  );
}

/*
  Return favourite entries.
*/
export async function getFavouriteEntries(
  userId,
  filters = {}
) {
  return getEntries(
    userId,
    {
      ...filters,
      isFavourite: true,
      isDeleted: false
    }
  );
}

/*
  Return archived entries.
*/
export async function getArchivedEntries(
  userId,
  filters = {}
) {
  return getEntries(
    userId,
    {
      ...filters,
      status: "archived",
      isDeleted: false
    }
  );
}

/*
  Return soft-deleted entries.
*/
export async function getDeletedEntries(
  userId,
  filters = {}
) {
  return getEntries(
    userId,
    {
      ...filters,
      isDeleted: true
    }
  );
}

/*
  Return calendar entry counts grouped by date.
*/
export async function getCalendarEntries(
  userId,
  filters = {}
) {
  return getJournalCalendarByUserId(
    userId,
    {
      dateFrom:
        filters.dateFrom,

      dateTo:
        filters.dateTo
    }
  );
}