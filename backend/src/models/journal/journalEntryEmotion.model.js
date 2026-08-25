import pool from "../../config/database.js";

function getDatabase(client) {
  return client || pool;
}

/*
  Attach one emotion to an entry.
*/
export async function addEmotionToJournalEntry(
  entryId,
  emotionId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    INSERT INTO journal_entry_emotions (
      entry_id,
      emotion_id
    )
    VALUES ($1, $2)
    ON CONFLICT (
      entry_id,
      emotion_id
    )
    DO NOTHING
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [entryId, emotionId]
  );

  return rows[0] || null;
}

/*
  Replace all emotions attached to an entry.
  This should normally run inside a transaction.
*/
export async function replaceJournalEntryEmotions(
  entryId,
  emotionIds = [],
  client = null
) {
  const db = getDatabase(client);

  await db.query(
    `
      DELETE FROM journal_entry_emotions
      WHERE entry_id = $1;
    `,
    [entryId]
  );

  const uniqueEmotionIds = [
    ...new Set(emotionIds)
  ];

  if (
    uniqueEmotionIds.length === 0
  ) {
    return [];
  }

  const query = `
    INSERT INTO journal_entry_emotions (
      entry_id,
      emotion_id
    )
    SELECT
      $1,
      emotion_id
    FROM UNNEST($2::UUID[])
      AS emotion_id
    ON CONFLICT (
      entry_id,
      emotion_id
    )
    DO NOTHING
    RETURNING *;
  `;

  const { rows } = await db.query(
    query,
    [
      entryId,
      uniqueEmotionIds
    ]
  );

  return rows;
}

/*
  Remove every emotion relationship for an entry.
*/
export async function removeAllJournalEntryEmotions(
  entryId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    DELETE FROM journal_entry_emotions
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
  Return complete emotion details for one entry.
*/
export async function getJournalEntryEmotions(
  entryId,
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT
      e.emotion_id,
      e.emotion_name,
      e.emotion_key,
      e.emotion_category,
      e.display_order,
      e.is_system,
      e.is_active,
      jee.created_at AS attached_at
    FROM journal_entry_emotions jee
    INNER JOIN journal_emotions e
      ON e.emotion_id =
        jee.emotion_id
    WHERE jee.entry_id = $1
    ORDER BY
      e.display_order ASC,
      e.emotion_name ASC;
  `;

  const { rows } = await db.query(
    query,
    [entryId]
  );

  return rows;
}

/*
  Return active emotions matching all supplied IDs.

  The service will compare the returned count with
  the requested count before attaching emotions.
*/
export async function getActiveEmotionsByIds(
  emotionIds = [],
  client = null
) {
  const db = getDatabase(client);

  const uniqueEmotionIds = [
    ...new Set(emotionIds)
  ];

  if (
    uniqueEmotionIds.length === 0
  ) {
    return [];
  }

  const query = `
    SELECT *
    FROM journal_emotions
    WHERE emotion_id =
      ANY($1::UUID[])
      AND is_active = TRUE
    ORDER BY
      display_order ASC,
      emotion_name ASC;
  `;

  const { rows } = await db.query(
    query,
    [uniqueEmotionIds]
  );

  return rows;
}

/*
  Return all active emotions available to users.
*/
export async function getAllActiveJournalEmotions(
  client = null
) {
  const db = getDatabase(client);

  const query = `
    SELECT *
    FROM journal_emotions
    WHERE is_active = TRUE
    ORDER BY
      display_order ASC,
      emotion_name ASC;
  `;

  const { rows } = await db.query(
    query
  );

  return rows;
}