import pool from "../../config/database.js";

function normalizeActivityName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Return system activities and the user's custom activities.
 */
export async function getAvailableJournalActivities(
  userId,
  db = pool
) {
  const query = `
    SELECT
      activity_id,
      user_id,
      activity_name,
      normalized_name,
      is_system,
      is_active,
      created_at,
      updated_at
    FROM journal_activities
    WHERE is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $1::uuid
      )
    ORDER BY
      is_system DESC,
      activity_name ASC
  `;

  const { rows } = await db.query(
    query,
    [userId]
  );

  return rows;
}

/**
 * Return a single activity accessible to the user.
 */
export async function getAccessibleJournalActivityById(
  activityId,
  userId,
  db = pool
) {
  const query = `
    SELECT
      activity_id,
      user_id,
      activity_name,
      normalized_name,
      is_system,
      is_active,
      created_at,
      updated_at
    FROM journal_activities
    WHERE activity_id = $1::uuid
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $2::uuid
      )
    LIMIT 1
  `;

  const { rows } = await db.query(
    query,
    [activityId, userId]
  );

  return rows[0] || null;
}

/**
 * Return accessible activities matching the supplied UUIDs.
 */
export async function getAccessibleJournalActivitiesByIds(
  activityIds,
  userId,
  db = pool
) {
  if (
    !Array.isArray(activityIds) ||
    activityIds.length === 0
  ) {
    return [];
  }

  const query = `
    SELECT
      activity_id,
      user_id,
      activity_name,
      normalized_name,
      is_system,
      is_active
    FROM journal_activities
    WHERE activity_id = ANY($1::uuid[])
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $2::uuid
      )
    ORDER BY
      is_system DESC,
      activity_name ASC
  `;

  const { rows } = await db.query(
    query,
    [activityIds, userId]
  );

  return rows;
}

/**
 * Confirm that all supplied activity IDs are accessible.
 */
export async function validateJournalActivityIds(
  activityIds,
  userId,
  db = pool
) {
  if (
    !Array.isArray(activityIds) ||
    activityIds.length === 0
  ) {
    return true;
  }

  const uniqueIds = [
    ...new Set(activityIds)
  ];

  const activities =
    await getAccessibleJournalActivitiesByIds(
      uniqueIds,
      userId,
      db
    );

  return (
    activities.length ===
    uniqueIds.length
  );
}

/**
 * Create or reactivate a custom activity.
 */
export async function createCustomJournalActivity(
  {
    userId,
    activityName
  },
  db = pool
) {
  const normalizedName =
    normalizeActivityName(
      activityName
    );

  const query = `
    INSERT INTO journal_activities (
      user_id,
      activity_name,
      normalized_name,
      is_system,
      is_active
    )
    VALUES (
      $1::uuid,
      $2::varchar,
      $3::varchar,
      FALSE,
      TRUE
    )
    ON CONFLICT (
      user_id,
      normalized_name
    )
    WHERE is_system = FALSE
    DO UPDATE SET
      activity_name =
        EXCLUDED.activity_name,
      is_active = TRUE,
      updated_at = NOW()
    RETURNING
      activity_id,
      user_id,
      activity_name,
      normalized_name,
      is_system,
      is_active,
      created_at,
      updated_at
  `;

  const { rows } = await db.query(
    query,
    [
      userId,
      String(activityName).trim(),
      normalizedName
    ]
  );

  return rows[0];
}

/**
 * Update a user-owned custom activity.
 */
export async function updateCustomJournalActivity(
  {
    activityId,
    userId,
    activityName
  },
  db = pool
) {
  const normalizedName =
    normalizeActivityName(
      activityName
    );

  const query = `
    UPDATE journal_activities
    SET
      activity_name = $3::varchar,
      normalized_name = $4::varchar,
      updated_at = NOW()
    WHERE activity_id = $1::uuid
      AND user_id = $2::uuid
      AND is_system = FALSE
      AND is_active = TRUE
    RETURNING
      activity_id,
      user_id,
      activity_name,
      normalized_name,
      is_system,
      is_active,
      created_at,
      updated_at
  `;

  const { rows } = await db.query(
    query,
    [
      activityId,
      userId,
      String(activityName).trim(),
      normalizedName
    ]
  );

  return rows[0] || null;
}

/**
 * Soft-disable a custom activity.
 */
export async function deactivateCustomJournalActivity(
  {
    activityId,
    userId
  },
  db = pool
) {
  const query = `
    UPDATE journal_activities
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE activity_id = $1::uuid
      AND user_id = $2::uuid
      AND is_system = FALSE
      AND is_active = TRUE
    RETURNING
      activity_id,
      user_id,
      activity_name,
      normalized_name,
      is_system,
      is_active,
      created_at,
      updated_at
  `;

  const { rows } = await db.query(
    query,
    [activityId, userId]
  );

  return rows[0] || null;
}