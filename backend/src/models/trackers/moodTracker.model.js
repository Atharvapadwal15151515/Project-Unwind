import pool from "../../config/database.js";

export async function createMoodEntry(
  userId,
  moodData,
  client = pool
) {
  const {
    moodLabel,
    moodScore,
    intensity,
    stressScore,
    energyScore,
    triggerCategory,
    triggerNote,
    note,
    loggedAt
  } = moodData;

  const query = `
    INSERT INTO mood_entries (
      user_id,
      mood_label,
      mood_score,
      intensity,
      stress_score,
      energy_score,
      trigger_category,
      trigger_note,
      note,
      logged_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      COALESCE($10, NOW())
    )
    RETURNING *
  `;

  const values = [
    userId,
    moodLabel,
    moodScore,
    intensity ?? null,
    stressScore ?? null,
    energyScore ?? null,
    triggerCategory ?? null,
    triggerNote ?? null,
    note ?? null,
    loggedAt ?? null
  ];

  const { rows } = await client.query(query, values);
  return rows[0];
}

export async function addMoodEntryEmotion(
  moodEntryId,
  emotionId,
  client = pool
) {
  const query = `
    INSERT INTO mood_entry_emotions (
      mood_entry_id,
      emotion_id
    )
    VALUES ($1, $2)
    ON CONFLICT (
      mood_entry_id,
      emotion_id
    )
    DO NOTHING
    RETURNING *
  `;

  const { rows } = await client.query(query, [
    moodEntryId,
    emotionId
  ]);

  return rows[0] ?? null;
}

export async function addMoodEntryActivity(
  moodEntryId,
  activityId,
  client = pool
) {
  const query = `
    INSERT INTO mood_entry_activities (
      mood_entry_id,
      activity_id
    )
    VALUES ($1, $2)
    ON CONFLICT (
      mood_entry_id,
      activity_id
    )
    DO NOTHING
    RETURNING *
  `;

  const { rows } = await client.query(query, [
    moodEntryId,
    activityId
  ]);

  return rows[0] ?? null;
}

export async function deleteMoodEntryRelations(
  moodEntryId,
  client = pool
) {
  await client.query(
    `
      DELETE FROM mood_entry_emotions
      WHERE mood_entry_id = $1
    `,
    [moodEntryId]
  );

  await client.query(
    `
      DELETE FROM mood_entry_activities
      WHERE mood_entry_id = $1
    `,
    [moodEntryId]
  );
}

export async function findMoodEntryById(
  userId,
  moodEntryId,
  includeDeleted = false
) {
  const query = `
    SELECT
      me.*,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'emotion_id', te.emotion_id,
              'emotion_name', te.emotion_name,
              'emotion_key', te.emotion_key,
              'is_system', te.is_system
            )
            ORDER BY te.display_order, te.emotion_name
          )
          FROM mood_entry_emotions mee
          JOIN tracker_emotions te
            ON te.emotion_id = mee.emotion_id
          WHERE mee.mood_entry_id = me.mood_entry_id
        ),
        '[]'::JSON
      ) AS emotions,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'activity_id', ta.activity_id,
              'activity_name', ta.activity_name,
              'activity_key', ta.activity_key,
              'category', ta.category,
              'is_system', ta.is_system
            )
            ORDER BY ta.display_order, ta.activity_name
          )
          FROM mood_entry_activities mea
          JOIN tracker_activities ta
            ON ta.activity_id = mea.activity_id
          WHERE mea.mood_entry_id = me.mood_entry_id
        ),
        '[]'::JSON
      ) AS activities
    FROM mood_entries me
    WHERE me.user_id = $1
      AND me.mood_entry_id = $2
      AND (
        $3::BOOLEAN = TRUE
        OR me.deleted_at IS NULL
      )
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    moodEntryId,
    includeDeleted
  ]);

  return rows[0] ?? null;
}

export async function findMoodEntriesByUserId(
  userId,
  filters = {}
) {
  const {
    startDate,
    endDate,
    moodLabel,
    moodScore,
    emotionId,
    activityId,
    page = 1,
    limit = 20,
    sortOrder = "desc"
  } = filters;

  const offset = (page - 1) * limit;
  const direction =
    String(sortOrder).toLowerCase() === "asc"
      ? "ASC"
      : "DESC";

  const query = `
    SELECT
      me.*,
      COUNT(*) OVER()::INTEGER AS total_items
    FROM mood_entries me
    WHERE me.user_id = $1
      AND me.deleted_at IS NULL
      AND (
        $2::TIMESTAMPTZ IS NULL
        OR me.logged_at >= $2
      )
      AND (
        $3::TIMESTAMPTZ IS NULL
        OR me.logged_at <= $3
      )
      AND (
        $4::VARCHAR IS NULL
        OR me.mood_label = $4
      )
      AND (
        $5::SMALLINT IS NULL
        OR me.mood_score = $5
      )
      AND (
        $6::UUID IS NULL
        OR EXISTS (
          SELECT 1
          FROM mood_entry_emotions mee
          WHERE mee.mood_entry_id = me.mood_entry_id
            AND mee.emotion_id = $6
        )
      )
      AND (
        $7::UUID IS NULL
        OR EXISTS (
          SELECT 1
          FROM mood_entry_activities mea
          WHERE mea.mood_entry_id = me.mood_entry_id
            AND mea.activity_id = $7
        )
      )
    ORDER BY me.logged_at ${direction}
    LIMIT $8
    OFFSET $9
  `;

  const values = [
    userId,
    startDate ?? null,
    endDate ?? null,
    moodLabel ?? null,
    moodScore ?? null,
    emotionId ?? null,
    activityId ?? null,
    limit,
    offset
  ];

  const { rows } = await pool.query(query, values);
  return rows;
}

export async function updateMoodEntryById(
  userId,
  moodEntryId,
  moodData,
  client = pool
) {
  const {
    moodLabel,
    moodScore,
    intensity,
    stressScore,
    energyScore,
    triggerCategory,
    triggerNote,
    note,
    loggedAt
  } = moodData;

  const query = `
    UPDATE mood_entries
    SET
      mood_label = COALESCE($3, mood_label),
      mood_score = COALESCE($4, mood_score),
      intensity = COALESCE($5, intensity),
      stress_score = COALESCE($6, stress_score),
      energy_score = COALESCE($7, energy_score),
      trigger_category = COALESCE(
        $8,
        trigger_category
      ),
      trigger_note = COALESCE(
        $9,
        trigger_note
      ),
      note = COALESCE($10, note),
      logged_at = COALESCE($11, logged_at)
    WHERE user_id = $1
      AND mood_entry_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const values = [
    userId,
    moodEntryId,
    moodLabel ?? null,
    moodScore ?? null,
    intensity ?? null,
    stressScore ?? null,
    energyScore ?? null,
    triggerCategory ?? null,
    triggerNote ?? null,
    note ?? null,
    loggedAt ?? null
  ];

  const { rows } = await client.query(query, values);
  return rows[0] ?? null;
}

export async function softDeleteMoodEntryById(
  userId,
  moodEntryId
) {
  const query = `
    UPDATE mood_entries
    SET deleted_at = NOW()
    WHERE user_id = $1
      AND mood_entry_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    moodEntryId
  ]);

  return rows[0] ?? null;
}

export async function restoreMoodEntryById(
  userId,
  moodEntryId
) {
  const query = `
    UPDATE mood_entries
    SET deleted_at = NULL
    WHERE user_id = $1
      AND mood_entry_id = $2
      AND deleted_at IS NOT NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    moodEntryId
  ]);

  return rows[0] ?? null;
}

export async function permanentlyDeleteMoodEntryById(
  userId,
  moodEntryId
) {
  const query = `
    DELETE FROM mood_entries
    WHERE user_id = $1
      AND mood_entry_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    moodEntryId
  ]);

  return rows[0] ?? null;
}
