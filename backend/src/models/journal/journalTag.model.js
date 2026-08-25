import pool from "../../config/database.js";

function normalizeTagName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Return system tags and the authenticated user's custom tags.
 */
export async function getAvailableJournalTags(
  userId,
  db = pool
) {
  const query = `
    SELECT
      tag_id,
      user_id,
      tag_name,
      normalized_name,
      is_system,
      is_active,
      created_at,
      updated_at
    FROM journal_tags
    WHERE is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $1::uuid
      )
    ORDER BY
      is_system DESC,
      tag_name ASC
  `;

  const { rows } = await db.query(
    query,
    [userId]
  );

  return rows;
}

/**
 * Return a single accessible tag.
 */
export async function getAccessibleJournalTagById(
  tagId,
  userId,
  db = pool
) {
  const query = `
    SELECT
      tag_id,
      user_id,
      tag_name,
      normalized_name,
      is_system,
      is_active,
      created_at,
      updated_at
    FROM journal_tags
    WHERE tag_id = $1::uuid
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $2::uuid
      )
    LIMIT 1
  `;

  const { rows } = await db.query(
    query,
    [tagId, userId]
  );

  return rows[0] || null;
}

/**
 * Return accessible tags matching supplied UUIDs.
 */
export async function getAccessibleJournalTagsByIds(
  tagIds,
  userId,
  db = pool
) {
  if (
    !Array.isArray(tagIds) ||
    tagIds.length === 0
  ) {
    return [];
  }

  const query = `
    SELECT
      tag_id,
      user_id,
      tag_name,
      normalized_name,
      is_system,
      is_active
    FROM journal_tags
    WHERE tag_id = ANY($1::uuid[])
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $2::uuid
      )
    ORDER BY
      is_system DESC,
      tag_name ASC
  `;

  const { rows } = await db.query(
    query,
    [tagIds, userId]
  );

  return rows;
}

/**
 * Check whether every supplied tag is accessible to the user.
 */
export async function validateJournalTagIds(
  tagIds,
  userId,
  db = pool
) {
  if (
    !Array.isArray(tagIds) ||
    tagIds.length === 0
  ) {
    return true;
  }

  const uniqueIds = [
    ...new Set(tagIds)
  ];

  const tags =
    await getAccessibleJournalTagsByIds(
      uniqueIds,
      userId,
      db
    );

  return tags.length === uniqueIds.length;
}

/**
 * Create a custom user-owned tag.
 *
 * If an active custom tag with the same normalized name
 * already exists, the existing tag is returned.
 *
 * If a previously disabled tag exists, it is reactivated.
 */
export async function createCustomJournalTag(
  {
    userId,
    tagName
  },
  db = pool
) {
  const normalizedName =
    normalizeTagName(tagName);

  const query = `
    INSERT INTO journal_tags (
      user_id,
      tag_name,
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
      tag_name = EXCLUDED.tag_name,
      is_active = TRUE,
      updated_at = NOW()
    RETURNING
      tag_id,
      user_id,
      tag_name,
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
      String(tagName).trim(),
      normalizedName
    ]
  );

  return rows[0];
}

/**
 * Update a custom tag owned by the user.
 * System tags cannot be updated.
 */
export async function updateCustomJournalTag(
  {
    tagId,
    userId,
    tagName
  },
  db = pool
) {
  const normalizedName =
    normalizeTagName(tagName);

  const query = `
    UPDATE journal_tags
    SET
      tag_name = $3::varchar,
      normalized_name = $4::varchar,
      updated_at = NOW()
    WHERE tag_id = $1::uuid
      AND user_id = $2::uuid
      AND is_system = FALSE
      AND is_active = TRUE
    RETURNING
      tag_id,
      user_id,
      tag_name,
      normalized_name,
      is_system,
      is_active,
      created_at,
      updated_at
  `;

  const { rows } = await db.query(
    query,
    [
      tagId,
      userId,
      String(tagName).trim(),
      normalizedName
    ]
  );

  return rows[0] || null;
}

/**
 * Soft-disable a custom user tag.
 *
 * Existing journal-entry relationships remain in the database,
 * but the tag will not appear in active selections.
 */
export async function deactivateCustomJournalTag(
  {
    tagId,
    userId
  },
  db = pool
) {
  const query = `
    UPDATE journal_tags
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE tag_id = $1::uuid
      AND user_id = $2::uuid
      AND is_system = FALSE
      AND is_active = TRUE
    RETURNING
      tag_id,
      user_id,
      tag_name,
      normalized_name,
      is_system,
      is_active,
      created_at,
      updated_at
  `;

  const { rows } = await db.query(
    query,
    [tagId, userId]
  );

  return rows[0] || null;
}