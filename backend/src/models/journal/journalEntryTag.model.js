import pool from "../../config/database.js";

function getDatabase(client) {
  return client || pool;
}

/*
  Attach one tag to a journal entry.
*/
export async function addTagToJournalEntry(
  entryId,
  tagId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    INSERT INTO journal_entry_tags (
      entry_id,
      tag_id
    )
    VALUES ($1, $2)
    ON CONFLICT (
      entry_id,
      tag_id
    )
    DO NOTHING
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [entryId, tagId]
  );

  return rows[0] || null;
}

/*
  Replace every tag relationship for an entry.
  This should normally run inside a transaction.
*/
export async function replaceJournalEntryTags(
  entryId,
  tagIds = [],
  client = null
) {
  const db = getDatabase(client);

  await db.query(
    `
      DELETE FROM journal_entry_tags
      WHERE entry_id = $1;
    `,
    [entryId]
  );

  const uniqueTagIds = [
    ...new Set(tagIds)
  ];

  if (uniqueTagIds.length === 0) {
    return [];
  }

  const query = `
    INSERT INTO journal_entry_tags (
      entry_id,
      tag_id
    )
    SELECT
      $1,
      tag_id
    FROM UNNEST($2::UUID[])
      AS tag_id
    ON CONFLICT (
      entry_id,
      tag_id
    )
    DO NOTHING
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      entryId,
      uniqueTagIds
    ]
  );

  return rows;
}

/*
  Remove all tags from an entry.
*/
export async function removeAllJournalEntryTags(
  entryId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_entry_tags
    WHERE entry_id = $1
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [entryId]
  );

  return rows;
}

/*
  Return complete tag details attached to an entry.
*/
export async function getJournalEntryTags(
  entryId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      t.tag_id,
      t.user_id,
      t.tag_name,
      t.normalized_name,
      t.is_system,
      t.is_active,
      jet.created_at AS attached_at
    FROM journal_entry_tags jet
    INNER JOIN journal_tags t
      ON t.tag_id = jet.tag_id
    WHERE jet.entry_id = $1
    ORDER BY
      t.is_system DESC,
      t.tag_name ASC;
  `;

  const { rows } = await db.query(
    query,
    [entryId]
  );

  return rows;
}

/*
  Return active tags that the user is allowed to use.

  A usable tag must either:
  - be a system tag, or
  - belong to the authenticated user.
*/
export async function getAccessibleTagsByIds(
  userId,
  tagIds = [],
  client = null
) {
  const db = getDatabase(client);

  const uniqueTagIds = [
    ...new Set(tagIds)
  ];

  if (uniqueTagIds.length === 0) {
    return [];
  }

  const query = `
    SELECT *
    FROM journal_tags
    WHERE tag_id = ANY($1::UUID[])
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $2
      )
    ORDER BY
      is_system DESC,
      tag_name ASC;
  `;

  const { rows } = await db.query(
    query,
    [
      uniqueTagIds,
      userId
    ]
  );

  return rows;
}

/*
  Return all system tags and user-created tags
  available to the authenticated user.
*/
export async function getAvailableJournalTags(
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_tags
    WHERE is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $1
      )
    ORDER BY
      is_system DESC,
      tag_name ASC;
  `;

  const { rows } = await db.query(
    query,
    [userId]
  );

  return rows;
}