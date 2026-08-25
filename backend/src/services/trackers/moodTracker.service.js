import pool from "../../config/database.js";

import {
  addMoodEntryActivity,
  addMoodEntryEmotion,
  createMoodEntry,
  deleteMoodEntryRelations,
  findMoodEntriesByUserId,
  findMoodEntryById,
  permanentlyDeleteMoodEntryById,
  restoreMoodEntryById,
  softDeleteMoodEntryById,
  updateMoodEntryById
} from "../../models/trackers/moodTracker.model.js";

import AppError from "../../utils/AppError.js";

import {
  validateActivityIds,
  validateEmotionIds
} from "./trackerMetadata.service.js";

import {
  buildPagination,
  parseOptionalInteger,
  parsePositiveInteger,
  removeTotalItems
} from "./trackerService.utils.js";

export async function createMood(
  userId,
  moodData
) {
  const emotionIds =
    await validateEmotionIds(
      userId,
      moodData.emotionIds ?? []
    );

  const activityIds =
    await validateActivityIds(
      userId,
      moodData.activityIds ?? []
    );

  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const moodEntry =
      await createMoodEntry(
        userId,
        moodData,
        client
      );

    for (
      const emotionId of emotionIds
    ) {
      await addMoodEntryEmotion(
        moodEntry.mood_entry_id,
        emotionId,
        client
      );
    }

    for (
      const activityId of activityIds
    ) {
      await addMoodEntryActivity(
        moodEntry.mood_entry_id,
        activityId,
        client
      );
    }

    await client.query("COMMIT");

    return getMoodById(
      userId,
      moodEntry.mood_entry_id
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getMoodById(
  userId,
  moodEntryId,
  includeDeleted = false
) {
  const moodEntry =
    await findMoodEntryById(
      userId,
      moodEntryId,
      includeDeleted
    );

  if (!moodEntry) {
    throw new AppError(
      "Mood entry not found",
      404
    );
  }

  return moodEntry;
}

export async function getMoodEntries(
  userId,
  query = {}
) {
  const page =
    parsePositiveInteger(
      query.page,
      1
    );

  const limit =
    parsePositiveInteger(
      query.limit,
      20
    );

  const rows =
    await findMoodEntriesByUserId(
      userId,
      {
        startDate:
          query.startDate,
        endDate:
          query.endDate,
        moodLabel:
          query.moodLabel,
        moodScore:
          parseOptionalInteger(
            query.moodScore
          ),
        emotionId:
          query.emotionId,
        activityId:
          query.activityId,
        page,
        limit,
        sortOrder:
          query.sortOrder
      }
    );

  return {
    moodEntries:
      removeTotalItems(rows),
    pagination:
      buildPagination(
        rows,
        page,
        limit
      )
  };
}

export async function updateMood(
  userId,
  moodEntryId,
  moodData
) {
  await getMoodById(
    userId,
    moodEntryId
  );

  const hasEmotionIds =
    moodData.emotionIds !==
      undefined;

  const hasActivityIds =
    moodData.activityIds !==
      undefined;

  const emotionIds =
    hasEmotionIds
      ? await validateEmotionIds(
          userId,
          moodData.emotionIds
        )
      : [];

  const activityIds =
    hasActivityIds
      ? await validateActivityIds(
          userId,
          moodData.activityIds
        )
      : [];

  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedEntry =
      await updateMoodEntryById(
        userId,
        moodEntryId,
        moodData,
        client
      );

    if (!updatedEntry) {
      throw new AppError(
        "Mood entry not found",
        404
      );
    }

    if (
      hasEmotionIds ||
      hasActivityIds
    ) {
      await deleteMoodEntryRelations(
        moodEntryId,
        client
      );

      if (!hasEmotionIds) {
        const existing =
          await findMoodEntryById(
            userId,
            moodEntryId
          );

        for (
          const emotion of
          existing.emotions
        ) {
          await addMoodEntryEmotion(
            moodEntryId,
            emotion.emotion_id,
            client
          );
        }
      } else {
        for (
          const emotionId of
          emotionIds
        ) {
          await addMoodEntryEmotion(
            moodEntryId,
            emotionId,
            client
          );
        }
      }

      if (!hasActivityIds) {
        const existing =
          await findMoodEntryById(
            userId,
            moodEntryId
          );

        for (
          const activity of
          existing.activities
        ) {
          await addMoodEntryActivity(
            moodEntryId,
            activity.activity_id,
            client
          );
        }
      } else {
        for (
          const activityId of
          activityIds
        ) {
          await addMoodEntryActivity(
            moodEntryId,
            activityId,
            client
          );
        }
      }
    }

    await client.query("COMMIT");

    return getMoodById(
      userId,
      moodEntryId
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function softDeleteMood(
  userId,
  moodEntryId
) {
  const deletedEntry =
    await softDeleteMoodEntryById(
      userId,
      moodEntryId
    );

  if (!deletedEntry) {
    throw new AppError(
      "Mood entry not found",
      404
    );
  }

  return deletedEntry;
}

export async function restoreMood(
  userId,
  moodEntryId
) {
  const restoredEntry =
    await restoreMoodEntryById(
      userId,
      moodEntryId
    );

  if (!restoredEntry) {
    throw new AppError(
      "Deleted mood entry not found",
      404
    );
  }

  return getMoodById(
    userId,
    moodEntryId
  );
}

export async function permanentlyDeleteMood(
  userId,
  moodEntryId
) {
  const deletedEntry =
    await permanentlyDeleteMoodEntryById(
      userId,
      moodEntryId
    );

  if (!deletedEntry) {
    throw new AppError(
      "Mood entry not found",
      404
    );
  }

  return deletedEntry;
}
