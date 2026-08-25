import pool from "../../config/database.js";

function getDatabase(client) {
  return client || pool;
}

/*
  Attach one activity to a journal entry.
*/
export async function addActivityToJournalEntry(
  entryId,
  activityId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    INSERT INTO journal_entry_activities (
      entry_id,
      activity_id
    )
    VALUES ($1, $2)
    ON CONFLICT (
      entry_id,
      activity_id
    )
    DO NOTHING
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [entryId, activityId]
  );

  return rows[0] || null;
}

/*
  Replace all activities attached to an entry.
  This should normally run inside a transaction.
*/
export async function replaceJournalEntryActivities(
  entryId,
  activityIds = [],
  client = null
) {
  const db = getDatabase(client);

  await db.query(
    `
      DELETE FROM journal_entry_activities
      WHERE entry_id = $1;
    `,
    [entryId]
  );

  const uniqueActivityIds = [
    ...new Set(activityIds)
  ];

  if (
    uniqueActivityIds.length === 0
  ) {
    return [];
  }

  const query = `
    INSERT INTO journal_entry_activities (
      entry_id,
      activity_id
    )
    SELECT
      $1,
      activity_id
    FROM UNNEST($2::UUID[])
      AS activity_id
    ON CONFLICT (
      entry_id,
      activity_id
    )
    DO NOTHING
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      entryId,
      uniqueActivityIds
    ]
  );

  return rows;
}

/*
  Remove all activities from an entry.
*/
export async function removeAllJournalEntryActivities(
  entryId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_entry_activities
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
  Return complete activity details attached
  to one journal entry.
*/
export async function getJournalEntryActivities(
  entryId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      a.activity_id,
      a.user_id,
      a.activity_name,
      a.normalized_name,
      a.is_system,
      a.is_active,
      jea.created_at AS attached_at
    FROM journal_entry_activities jea
    INNER JOIN journal_activities a
      ON a.activity_id =
        jea.activity_id
    WHERE jea.entry_id = $1
    ORDER BY
      a.is_system DESC,
      a.activity_name ASC;
  `;

  const { rows } = await db.query(
    query,
    [entryId]
  );

  return rows;
}

/*
  Return active activities the authenticated
  user is allowed to attach.

  A usable activity must either:
  - be a system activity, or
  - belong to the authenticated user.
*/
export async function getAccessibleActivitiesByIds(
  userId,
  activityIds = [],
  client = null
) {
  const db = getDatabase(client);

  const uniqueActivityIds = [
    ...new Set(activityIds)
  ];

  if (
    uniqueActivityIds.length === 0
  ) {
    return [];
  }

  const query = `
    SELECT *
    FROM journal_activities
    WHERE activity_id =
      ANY($1::UUID[])
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $2
      )
    ORDER BY
      is_system DESC,
      activity_name ASC;
  `;

  const { rows } = await db.query(
    query,
    [
      uniqueActivityIds,
      userId
    ]
  );

  return rows;
}

/*
  Return all system and user-created activities
  available to the authenticated user.
*/
export async function getAvailableJournalActivities(
  userId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_activities
    WHERE is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $1
      )
    ORDER BY
      is_system DESC,
      activity_name ASC;
  `;

  const { rows } = await db.query(
    query,
    [userId]
  );

  return rows;
}