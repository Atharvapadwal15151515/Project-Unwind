import pool from "../../config/database.js";

export async function createHabit(
  userId,
  habitData
) {
  const {
    habitName,
    description,
    category,
    trackingType,
    targetValue,
    targetUnit,
    frequencyType,
    targetDays,
    targetCountPerPeriod,
    startDate,
    endDate,
    reminderEnabled,
    reminderTime
  } = habitData;

  const query = `
    INSERT INTO habits (
      user_id,
      habit_name,
      description,
      category,
      tracking_type,
      target_value,
      target_unit,
      frequency_type,
      target_days,
      target_count_per_period,
      start_date,
      end_date,
      reminder_enabled,
      reminder_time
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      COALESCE($11, CURRENT_DATE),
      $12, $13, $14
    )
    RETURNING *
  `;

  const values = [
    userId,
    habitName,
    description ?? null,
    category ?? "custom",
    trackingType,
    targetValue ?? 1,
    targetUnit ?? "times",
    frequencyType ?? "daily",
    targetDays ?? [],
    targetCountPerPeriod ?? null,
    startDate ?? null,
    endDate ?? null,
    reminderEnabled ?? false,
    reminderTime ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function findHabitById(
  userId,
  habitId,
  includeDeleted = false
) {
  const query = `
    SELECT *
    FROM habits
    WHERE user_id = $1
      AND habit_id = $2
      AND (
        $3::BOOLEAN = TRUE
        OR deleted_at IS NULL
      )
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    habitId,
    includeDeleted
  ]);

  return rows[0] ?? null;
}

export async function findHabitsByUserId(
  userId,
  filters = {}
) {
  const {
    category,
    trackingType,
    frequencyType,
    isActive,
    search,
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
      h.*,
      COUNT(*) OVER()::INTEGER AS total_items
    FROM habits h
    WHERE h.user_id = $1
      AND h.deleted_at IS NULL
      AND (
        $2::VARCHAR IS NULL
        OR h.category = $2
      )
      AND (
        $3::VARCHAR IS NULL
        OR h.tracking_type = $3
      )
      AND (
        $4::VARCHAR IS NULL
        OR h.frequency_type = $4
      )
      AND (
        $5::BOOLEAN IS NULL
        OR h.is_active = $5
      )
      AND (
        $6::VARCHAR IS NULL
        OR h.habit_name ILIKE '%' || $6 || '%'
        OR h.description ILIKE '%' || $6 || '%'
      )
    ORDER BY h.created_at ${direction}
    LIMIT $7
    OFFSET $8
  `;

  const values = [
    userId,
    category ?? null,
    trackingType ?? null,
    frequencyType ?? null,
    isActive ?? null,
    search?.trim() || null,
    limit,
    offset
  ];

  const { rows } = await pool.query(query, values);
  return rows;
}

export async function findActiveHabitsForDate(
  userId,
  logDate
) {
  const query = `
    SELECT
      h.*,
      hl.habit_log_id,
      hl.status AS log_status,
      hl.value AS log_value,
      hl.note AS log_note,
      hl.completed_at
    FROM habits h
    LEFT JOIN habit_logs hl
      ON hl.habit_id = h.habit_id
      AND hl.log_date = $2
      AND hl.deleted_at IS NULL
    WHERE h.user_id = $1
      AND h.deleted_at IS NULL
      AND h.is_active = TRUE
      AND h.start_date <= $2
      AND (
        h.end_date IS NULL
        OR h.end_date >= $2
      )
      AND (
        h.frequency_type = 'daily'
        OR (
          h.frequency_type = 'custom'
          AND EXTRACT(
            DOW FROM $2::DATE
          )::SMALLINT = ANY(h.target_days)
        )
        OR h.frequency_type = 'weekly'
      )
    ORDER BY h.created_at ASC
  `;

  const { rows } = await pool.query(query, [
    userId,
    logDate
  ]);

  return rows;
}

export async function updateHabitById(
  userId,
  habitId,
  habitData
) {
  const {
    habitName,
    description,
    category,
    trackingType,
    targetValue,
    targetUnit,
    frequencyType,
    targetDays,
    targetCountPerPeriod,
    startDate,
    endDate,
    reminderEnabled,
    reminderTime,
    isActive
  } = habitData;

  const query = `
    UPDATE habits
    SET
      habit_name = COALESCE($3, habit_name),
      description = COALESCE(
        $4,
        description
      ),
      category = COALESCE($5, category),
      tracking_type = COALESCE(
        $6,
        tracking_type
      ),
      target_value = COALESCE(
        $7,
        target_value
      ),
      target_unit = COALESCE(
        $8,
        target_unit
      ),
      frequency_type = COALESCE(
        $9,
        frequency_type
      ),
      target_days = COALESCE(
        $10,
        target_days
      ),
      target_count_per_period = COALESCE(
        $11,
        target_count_per_period
      ),
      start_date = COALESCE(
        $12,
        start_date
      ),
      end_date = COALESCE(
        $13,
        end_date
      ),
      reminder_enabled = COALESCE(
        $14,
        reminder_enabled
      ),
      reminder_time = COALESCE(
        $15,
        reminder_time
      ),
      is_active = COALESCE(
        $16,
        is_active
      )
    WHERE user_id = $1
      AND habit_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const values = [
    userId,
    habitId,
    habitName ?? null,
    description ?? null,
    category ?? null,
    trackingType ?? null,
    targetValue ?? null,
    targetUnit ?? null,
    frequencyType ?? null,
    targetDays ?? null,
    targetCountPerPeriod ?? null,
    startDate ?? null,
    endDate ?? null,
    reminderEnabled ?? null,
    reminderTime ?? null,
    isActive ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] ?? null;
}

export async function pauseHabitById(
  userId,
  habitId
) {
  const query = `
    UPDATE habits
    SET
      is_active = FALSE,
      paused_at = NOW()
    WHERE user_id = $1
      AND habit_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    habitId
  ]);

  return rows[0] ?? null;
}

export async function resumeHabitById(
  userId,
  habitId
) {
  const query = `
    UPDATE habits
    SET
      is_active = TRUE,
      paused_at = NULL
    WHERE user_id = $1
      AND habit_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    habitId
  ]);

  return rows[0] ?? null;
}

export async function softDeleteHabitById(
  userId,
  habitId
) {
  const query = `
    UPDATE habits
    SET
      deleted_at = NOW(),
      is_active = FALSE
    WHERE user_id = $1
      AND habit_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    habitId
  ]);

  return rows[0] ?? null;
}

export async function restoreHabitById(
  userId,
  habitId
) {
  const query = `
    UPDATE habits
    SET deleted_at = NULL
    WHERE user_id = $1
      AND habit_id = $2
      AND deleted_at IS NOT NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    habitId
  ]);

  return rows[0] ?? null;
}

export async function permanentlyDeleteHabitById(
  userId,
  habitId
) {
  const query = `
    DELETE FROM habits
    WHERE user_id = $1
      AND habit_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    habitId
  ]);

  return rows[0] ?? null;
}
