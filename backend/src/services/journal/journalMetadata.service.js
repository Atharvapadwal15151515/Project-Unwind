import pool from "../../config/database.js";

import {
  getActiveJournalEmotions
} from "../../models/journal/journalEmotion.model.js";

import {
  getAvailableJournalTags,
  createCustomJournalTag,
  updateCustomJournalTag,
  deactivateCustomJournalTag
} from "../../models/journal/journalTag.model.js";

import {
  getAvailableJournalActivities,
  createCustomJournalActivity,
  updateCustomJournalActivity,
  deactivateCustomJournalActivity
} from "../../models/journal/journalActivity.model.js";

function createServiceError(
  message,
  statusCode = 400,
  code = "JOURNAL_METADATA_ERROR"
) {
  const error = new Error(message);

  error.statusCode = statusCode;

  error.data = {
    code,
    status_code: statusCode
  };

  return error;
}

function handleUniqueConstraintError(
  error,
  type
) {
  if (error?.code !== "23505") {
    throw error;
  }

  if (type === "tag") {
    throw createServiceError(
      "A journal tag with this name already exists",
      409,
      "JOURNAL_TAG_ALREADY_EXISTS"
    );
  }

  throw createServiceError(
    "A journal activity with this name already exists",
    409,
    "JOURNAL_ACTIVITY_ALREADY_EXISTS"
  );
}

// =========================================================
// COMBINED METADATA
// =========================================================

export async function getJournalMetadata(
  userId
) {
  const [
    emotions,
    tags,
    activities
  ] = await Promise.all([
    getActiveJournalEmotions(),
    getAvailableJournalTags(
      userId
    ),
    getAvailableJournalActivities(
      userId
    )
  ]);

  return {
    emotions,
    tags,
    activities
  };
}

// =========================================================
// EMOTIONS
// =========================================================

export async function getJournalEmotions() {
  return getActiveJournalEmotions();
}

// =========================================================
// TAGS
// =========================================================

export async function getJournalTags(
  userId
) {
  return getAvailableJournalTags(
    userId
  );
}

export async function createJournalTag({
  userId,
  tagName
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const tag =
      await createCustomJournalTag(
        {
          userId,
          tagName
        },
        client
      );

    await client.query("COMMIT");

    return tag;
  } catch (error) {
    await client.query("ROLLBACK");

    handleUniqueConstraintError(
      error,
      "tag"
    );
  } finally {
    client.release();
  }
}

export async function updateJournalTag({
  userId,
  tagId,
  tagName
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const tag =
      await updateCustomJournalTag(
        {
          userId,
          tagId,
          tagName
        },
        client
      );

    if (!tag) {
      throw createServiceError(
        "Journal tag was not found or cannot be updated",
        404,
        "JOURNAL_TAG_NOT_FOUND"
      );
    }

    await client.query("COMMIT");

    return tag;
  } catch (error) {
    await client.query("ROLLBACK");

    if (
      error?.statusCode
    ) {
      throw error;
    }

    handleUniqueConstraintError(
      error,
      "tag"
    );
  } finally {
    client.release();
  }
}

export async function deleteJournalTag({
  userId,
  tagId
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const tag =
      await deactivateCustomJournalTag(
        {
          userId,
          tagId
        },
        client
      );

    if (!tag) {
      throw createServiceError(
        "Journal tag was not found or cannot be deleted",
        404,
        "JOURNAL_TAG_NOT_FOUND"
      );
    }

    await client.query("COMMIT");

    return tag;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}

// =========================================================
// ACTIVITIES
// =========================================================

export async function getJournalActivities(
  userId
) {
  return getAvailableJournalActivities(
    userId
  );
}

export async function createJournalActivity({
  userId,
  activityName
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const activity =
      await createCustomJournalActivity(
        {
          userId,
          activityName
        },
        client
      );

    await client.query("COMMIT");

    return activity;
  } catch (error) {
    await client.query("ROLLBACK");

    handleUniqueConstraintError(
      error,
      "activity"
    );
  } finally {
    client.release();
  }
}

export async function updateJournalActivity({
  userId,
  activityId,
  activityName
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const activity =
      await updateCustomJournalActivity(
        {
          userId,
          activityId,
          activityName
        },
        client
      );

    if (!activity) {
      throw createServiceError(
        "Journal activity was not found or cannot be updated",
        404,
        "JOURNAL_ACTIVITY_NOT_FOUND"
      );
    }

    await client.query("COMMIT");

    return activity;
  } catch (error) {
    await client.query("ROLLBACK");

    if (
      error?.statusCode
    ) {
      throw error;
    }

    handleUniqueConstraintError(
      error,
      "activity"
    );
  } finally {
    client.release();
  }
}

export async function deleteJournalActivity({
  userId,
  activityId
}) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const activity =
      await deactivateCustomJournalActivity(
        {
          userId,
          activityId
        },
        client
      );

    if (!activity) {
      throw createServiceError(
        "Journal activity was not found or cannot be deleted",
        404,
        "JOURNAL_ACTIVITY_NOT_FOUND"
      );
    }

    await client.query("COMMIT");

    return activity;
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}