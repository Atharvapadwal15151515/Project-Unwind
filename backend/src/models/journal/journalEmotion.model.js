import pool from "../../config/database.js";

/**
 * Return all active system emotions.
 */
export async function getActiveJournalEmotions(
  db = pool
) {
  const query = `
    SELECT
      emotion_id,
      emotion_name,
      emotion_key,
      emotion_category,
      display_order,
      is_system,
      is_active,
      created_at,
      updated_at
    FROM journal_emotions
    WHERE is_active = TRUE
    ORDER BY
      display_order ASC,
      emotion_name ASC
  `;

  const { rows } = await db.query(query);

  return rows;
}

/**
 * Return emotions matching the supplied UUIDs.
 */
export async function getJournalEmotionsByIds(
  emotionIds,
  db = pool
) {
  if (
    !Array.isArray(emotionIds) ||
    emotionIds.length === 0
  ) {
    return [];
  }

  const query = `
    SELECT
      emotion_id,
      emotion_name,
      emotion_key,
      emotion_category,
      display_order,
      is_system,
      is_active
    FROM journal_emotions
    WHERE emotion_id = ANY($1::uuid[])
      AND is_active = TRUE
    ORDER BY
      display_order ASC,
      emotion_name ASC
  `;

  const { rows } = await db.query(
    query,
    [emotionIds]
  );

  return rows;
}

/**
 * Count how many supplied emotion IDs are valid and active.
 */
export async function countActiveJournalEmotionsByIds(
  emotionIds,
  db = pool
) {
  if (
    !Array.isArray(emotionIds) ||
    emotionIds.length === 0
  ) {
    return 0;
  }

  const query = `
    SELECT COUNT(*)::integer AS count
    FROM journal_emotions
    WHERE emotion_id = ANY($1::uuid[])
      AND is_active = TRUE
  `;

  const { rows } = await db.query(
    query,
    [emotionIds]
  );

  return rows[0].count;
}

/**
 * Check whether every supplied emotion exists and is active.
 */
export async function validateJournalEmotionIds(
  emotionIds,
  db = pool
) {
  if (
    !Array.isArray(emotionIds) ||
    emotionIds.length === 0
  ) {
    return true;
  }

  const uniqueIds = [
    ...new Set(emotionIds)
  ];

  const count =
    await countActiveJournalEmotionsByIds(
      uniqueIds,
      db
    );

  return count === uniqueIds.length;
}