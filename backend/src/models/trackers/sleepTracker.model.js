import pool from "../../config/database.js";

export async function createSleepEntry(
  userId,
  sleepData,
  client = pool
) {
  const {
    sleepDate,
    bedtime,
    sleepStartTime,
    wakeTime,
    gotOutOfBedTime,
    sleepDurationMinutes,
    sleepQuality,
    wakeMood,
    interruptionsCount,
    interruptionMinutes,
    napMinutes,
    note
  } = sleepData;

  const query = `
    INSERT INTO sleep_entries (
      user_id,
      sleep_date,
      bedtime,
      sleep_start_time,
      wake_time,
      got_out_of_bed_time,
      sleep_duration_minutes,
      sleep_quality,
      wake_mood,
      interruptions_count,
      interruption_minutes,
      nap_minutes,
      note
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13
    )
    RETURNING *
  `;

  const values = [
    userId,
    sleepDate,
    bedtime,
    sleepStartTime,
    wakeTime,
    gotOutOfBedTime ?? null,
    sleepDurationMinutes,
    sleepQuality,
    wakeMood ?? null,
    interruptionsCount ?? 0,
    interruptionMinutes ?? 0,
    napMinutes ?? 0,
    note ?? null
  ];

  const { rows } = await client.query(query, values);
  return rows[0];
}

export async function addSleepEntryFactor(
  sleepEntryId,
  factorData,
  client = pool
) {
  const {
    sleepFactorId,
    factorValue,
    note
  } = factorData;

  const query = `
    INSERT INTO sleep_entry_factors (
      sleep_entry_id,
      sleep_factor_id,
      factor_value,
      note
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (
      sleep_entry_id,
      sleep_factor_id
    )
    DO UPDATE SET
      factor_value = EXCLUDED.factor_value,
      note = EXCLUDED.note
    RETURNING *
  `;

  const values = [
    sleepEntryId,
    sleepFactorId,
    factorValue ?? null,
    note ?? null
  ];

  const { rows } = await client.query(query, values);
  return rows[0];
}

export async function deleteSleepEntryFactors(
  sleepEntryId,
  client = pool
) {
  await client.query(
    `
      DELETE FROM sleep_entry_factors
      WHERE sleep_entry_id = $1
    `,
    [sleepEntryId]
  );
}

export async function findSleepEntryById(
  userId,
  sleepEntryId,
  includeDeleted = false
) {
  const query = `
    SELECT
      se.*,
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'sleep_factor_id',
              sf.sleep_factor_id,
              'factor_name',
              sf.factor_name,
              'factor_key',
              sf.factor_key,
              'category',
              sf.category,
              'factor_value',
              sef.factor_value,
              'note',
              sef.note
            )
            ORDER BY sf.display_order, sf.factor_name
          )
          FROM sleep_entry_factors sef
          JOIN sleep_factors sf
            ON sf.sleep_factor_id =
              sef.sleep_factor_id
          WHERE sef.sleep_entry_id =
            se.sleep_entry_id
        ),
        '[]'::JSON
      ) AS factors
    FROM sleep_entries se
    WHERE se.user_id = $1
      AND se.sleep_entry_id = $2
      AND (
        $3::BOOLEAN = TRUE
        OR se.deleted_at IS NULL
      )
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    sleepEntryId,
    includeDeleted
  ]);

  return rows[0] ?? null;
}

export async function findSleepEntryByDate(
  userId,
  sleepDate
) {
  const query = `
    SELECT *
    FROM sleep_entries
    WHERE user_id = $1
      AND sleep_date = $2
      AND deleted_at IS NULL
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    sleepDate
  ]);

  return rows[0] ?? null;
}

export async function findSleepEntriesByUserId(
  userId,
  filters = {}
) {
  const {
    startDate,
    endDate,
    minQuality,
    maxQuality,
    minDurationMinutes,
    maxDurationMinutes,
    factorId,
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
      se.*,
      COUNT(*) OVER()::INTEGER AS total_items
    FROM sleep_entries se
    WHERE se.user_id = $1
      AND se.deleted_at IS NULL
      AND (
        $2::DATE IS NULL
        OR se.sleep_date >= $2
      )
      AND (
        $3::DATE IS NULL
        OR se.sleep_date <= $3
      )
      AND (
        $4::SMALLINT IS NULL
        OR se.sleep_quality >= $4
      )
      AND (
        $5::SMALLINT IS NULL
        OR se.sleep_quality <= $5
      )
      AND (
        $6::INTEGER IS NULL
        OR se.sleep_duration_minutes >= $6
      )
      AND (
        $7::INTEGER IS NULL
        OR se.sleep_duration_minutes <= $7
      )
      AND (
        $8::UUID IS NULL
        OR EXISTS (
          SELECT 1
          FROM sleep_entry_factors sef
          WHERE sef.sleep_entry_id =
            se.sleep_entry_id
            AND sef.sleep_factor_id = $8
        )
      )
    ORDER BY se.sleep_date ${direction}
    LIMIT $9
    OFFSET $10
  `;

  const values = [
    userId,
    startDate ?? null,
    endDate ?? null,
    minQuality ?? null,
    maxQuality ?? null,
    minDurationMinutes ?? null,
    maxDurationMinutes ?? null,
    factorId ?? null,
    limit,
    offset
  ];

  const { rows } = await pool.query(query, values);
  return rows;
}

export async function updateSleepEntryById(
  userId,
  sleepEntryId,
  sleepData,
  client = pool
) {
  const {
    sleepDate,
    bedtime,
    sleepStartTime,
    wakeTime,
    gotOutOfBedTime,
    sleepDurationMinutes,
    sleepQuality,
    wakeMood,
    interruptionsCount,
    interruptionMinutes,
    napMinutes,
    note
  } = sleepData;

  const query = `
    UPDATE sleep_entries
    SET
      sleep_date = COALESCE($3, sleep_date),
      bedtime = COALESCE($4, bedtime),
      sleep_start_time = COALESCE(
        $5,
        sleep_start_time
      ),
      wake_time = COALESCE($6, wake_time),
      got_out_of_bed_time = COALESCE(
        $7,
        got_out_of_bed_time
      ),
      sleep_duration_minutes = COALESCE(
        $8,
        sleep_duration_minutes
      ),
      sleep_quality = COALESCE(
        $9,
        sleep_quality
      ),
      wake_mood = COALESCE(
        $10,
        wake_mood
      ),
      interruptions_count = COALESCE(
        $11,
        interruptions_count
      ),
      interruption_minutes = COALESCE(
        $12,
        interruption_minutes
      ),
      nap_minutes = COALESCE(
        $13,
        nap_minutes
      ),
      note = COALESCE($14, note)
    WHERE user_id = $1
      AND sleep_entry_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const values = [
    userId,
    sleepEntryId,
    sleepDate ?? null,
    bedtime ?? null,
    sleepStartTime ?? null,
    wakeTime ?? null,
    gotOutOfBedTime ?? null,
    sleepDurationMinutes ?? null,
    sleepQuality ?? null,
    wakeMood ?? null,
    interruptionsCount ?? null,
    interruptionMinutes ?? null,
    napMinutes ?? null,
    note ?? null
  ];

  const { rows } = await client.query(query, values);
  return rows[0] ?? null;
}

export async function softDeleteSleepEntryById(
  userId,
  sleepEntryId
) {
  const query = `
    UPDATE sleep_entries
    SET deleted_at = NOW()
    WHERE user_id = $1
      AND sleep_entry_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    sleepEntryId
  ]);

  return rows[0] ?? null;
}

export async function restoreSleepEntryById(
  userId,
  sleepEntryId
) {
  const query = `
    UPDATE sleep_entries
    SET deleted_at = NULL
    WHERE user_id = $1
      AND sleep_entry_id = $2
      AND deleted_at IS NOT NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    sleepEntryId
  ]);

  return rows[0] ?? null;
}

export async function permanentlyDeleteSleepEntryById(
  userId,
  sleepEntryId
) {
  const query = `
    DELETE FROM sleep_entries
    WHERE user_id = $1
      AND sleep_entry_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    sleepEntryId
  ]);

  return rows[0] ?? null;
}
