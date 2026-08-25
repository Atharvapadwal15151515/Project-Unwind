import pool from "../../config/database.js";

/**
 * Remove duplicate UUIDs without changing their order.
 */
function uniqueIds(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return [...new Set(ids)];
}

// =========================================================
// EMOTIONS
// =========================================================

export async function getJournalEntryEmotions(
  entryId,
  db = pool
) {
  const query = `
    SELECT
      emotion.emotion_id,
      emotion.emotion_name,
      emotion.emotion_key,
      emotion.emotion_category,
      emotion.display_order,
      relation.created_at AS selected_at
    FROM journal_entry_emotions AS relation
    INNER JOIN journal_emotions AS emotion
      ON emotion.emotion_id =
        relation.emotion_id
    WHERE relation.entry_id = $1::uuid
    ORDER BY
      emotion.display_order ASC,
      emotion.emotion_name ASC
  `;

  const { rows } = await db.query(
    query,
    [entryId]
  );

  return rows;
}

export async function replaceJournalEntryEmotions(
  entryId,
  emotionIds,
  db = pool
) {
  const ids = uniqueIds(emotionIds);

  await db.query(
    `
      DELETE FROM journal_entry_emotions
      WHERE entry_id = $1::uuid
    `,
    [entryId]
  );

  if (ids.length === 0) {
    return [];
  }

  const query = `
    INSERT INTO journal_entry_emotions (
      entry_id,
      emotion_id
    )
    SELECT
      $1::uuid,
      emotion_id
    FROM journal_emotions
    WHERE emotion_id = ANY($2::uuid[])
      AND is_active = TRUE
    ON CONFLICT (
      entry_id,
      emotion_id
    )
    DO NOTHING
    RETURNING
      entry_id,
      emotion_id,
      created_at
  `;

  await db.query(
    query,
    [entryId, ids]
  );

  return getJournalEntryEmotions(
    entryId,
    db
  );
}

// =========================================================
// TAGS
// =========================================================

export async function getJournalEntryTags(
  entryId,
  db = pool
) {
  const query = `
    SELECT
      tag.tag_id,
      tag.user_id,
      tag.tag_name,
      tag.normalized_name,
      tag.is_system,
      tag.is_active,
      relation.created_at AS selected_at
    FROM journal_entry_tags AS relation
    INNER JOIN journal_tags AS tag
      ON tag.tag_id = relation.tag_id
    WHERE relation.entry_id = $1::uuid
    ORDER BY
      tag.is_system DESC,
      tag.tag_name ASC
  `;

  const { rows } = await db.query(
    query,
    [entryId]
  );

  return rows;
}

export async function replaceJournalEntryTags(
  entryId,
  userId,
  tagIds,
  db = pool
) {
  const ids = uniqueIds(tagIds);

  await db.query(
    `
      DELETE FROM journal_entry_tags
      WHERE entry_id = $1::uuid
    `,
    [entryId]
  );

  if (ids.length === 0) {
    return [];
  }

  const query = `
    INSERT INTO journal_entry_tags (
      entry_id,
      tag_id
    )
    SELECT
      $1::uuid,
      tag_id
    FROM journal_tags
    WHERE tag_id = ANY($2::uuid[])
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $3::uuid
      )
    ON CONFLICT (
      entry_id,
      tag_id
    )
    DO NOTHING
    RETURNING
      entry_id,
      tag_id,
      created_at
  `;

  await db.query(
    query,
    [entryId, ids, userId]
  );

  return getJournalEntryTags(
    entryId,
    db
  );
}

// =========================================================
// ACTIVITIES
// =========================================================

export async function getJournalEntryActivities(
  entryId,
  db = pool
) {
  const query = `
    SELECT
      activity.activity_id,
      activity.user_id,
      activity.activity_name,
      activity.normalized_name,
      activity.is_system,
      activity.is_active,
      relation.created_at AS selected_at
    FROM journal_entry_activities AS relation
    INNER JOIN journal_activities AS activity
      ON activity.activity_id =
        relation.activity_id
    WHERE relation.entry_id = $1::uuid
    ORDER BY
      activity.is_system DESC,
      activity.activity_name ASC
  `;

  const { rows } = await db.query(
    query,
    [entryId]
  );

  return rows;
}

export async function replaceJournalEntryActivities(
  entryId,
  userId,
  activityIds,
  db = pool
) {
  const ids = uniqueIds(
    activityIds
  );

  await db.query(
    `
      DELETE FROM journal_entry_activities
      WHERE entry_id = $1::uuid
    `,
    [entryId]
  );

  if (ids.length === 0) {
    return [];
  }

  const query = `
    INSERT INTO journal_entry_activities (
      entry_id,
      activity_id
    )
    SELECT
      $1::uuid,
      activity_id
    FROM journal_activities
    WHERE activity_id = ANY($2::uuid[])
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $3::uuid
      )
    ON CONFLICT (
      entry_id,
      activity_id
    )
    DO NOTHING
    RETURNING
      entry_id,
      activity_id,
      created_at
  `;

  await db.query(
    query,
    [
      entryId,
      ids,
      userId
    ]
  );

  return getJournalEntryActivities(
    entryId,
    db
  );
}

// =========================================================
// ALL RELATIONSHIPS
// =========================================================

export async function getJournalEntryRelations(
  entryId,
  db = pool
) {
  /*
    db can be a transaction-scoped PostgreSQL client,
    so queries must run sequentially.
  */
  const emotions =
    await getJournalEntryEmotions(
      entryId,
      db
    );

  const tags =
    await getJournalEntryTags(
      entryId,
      db
    );

  const activities =
    await getJournalEntryActivities(
      entryId,
      db
    );

  return {
    emotions,
    tags,
    activities
  };
}

/**
 * Replace only the arrays explicitly supplied.
 *
 * undefined means "leave unchanged".
 * [] means "remove all".
 */
export async function replaceJournalEntryRelations(
  {
    entryId,
    userId,
    emotionIds,
    tagIds,
    activityIds
  },
  db = pool
) {
  if (emotionIds !== undefined) {
    await replaceJournalEntryEmotions(
      entryId,
      emotionIds,
      db
    );
  }

  if (tagIds !== undefined) {
    await replaceJournalEntryTags(
      entryId,
      userId,
      tagIds,
      db
    );
  }

  if (activityIds !== undefined) {
    await replaceJournalEntryActivities(
      entryId,
      userId,
      activityIds,
      db
    );
  }

  return getJournalEntryRelations(
    entryId,
    db
  );
}