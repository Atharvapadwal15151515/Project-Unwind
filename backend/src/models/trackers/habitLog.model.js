import pool from "../../config/database.js";

export async function createOrUpdateHabitLog(
  userId,
  habitId,
  logData
) {
  const {
    logDate,
    status,
    value,
    note,
    completedAt
  } = logData;

  const query = `
    INSERT INTO habit_logs (
      habit_id,
      user_id,
      log_date,
      status,
      value,
      note,
      completed_at
    )
    VALUES (
      $1,
      $2,
      COALESCE($3, CURRENT_DATE),
      $4,
      $5,
      $6,
      $7
    )
    ON CONFLICT (
      habit_id,
      log_date
    )
    WHERE deleted_at IS NULL
    DO UPDATE SET
      status = EXCLUDED.status,
      value = EXCLUDED.value,
      note = EXCLUDED.note,
      completed_at = EXCLUDED.completed_at
    RETURNING *
  `;

  const values = [
    habitId,
    userId,
    logDate ?? null,
    status ?? "completed",
    value ?? 1,
    note ?? null,
    completedAt ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function findHabitLogById(
  userId,
  habitId,
  habitLogId,
  includeDeleted = false
) {
  const query = `
    SELECT hl.*
    FROM habit_logs hl
    JOIN habits h
      ON h.habit_id = hl.habit_id
    WHERE hl.user_id = $1
      AND hl.habit_id = $2
      AND hl.habit_log_id = $3
      AND h.user_id = $1
      AND (
        $4::BOOLEAN = TRUE
        OR hl.deleted_at IS NULL
      )
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    habitId,
    habitLogId,
    includeDeleted
  ]);

  return rows[0] ?? null;
}

export async function findHabitLogs(
  userId,
  habitId,
  filters = {}
) {
  const {
    startDate,
    endDate,
    status,
    page = 1,
    limit = 31,
    sortOrder = "desc"
  } = filters;

  const offset = (page - 1) * limit;
  const direction =
    String(sortOrder).toLowerCase() === "asc"
      ? "ASC"
      : "DESC";

  const query = `
    SELECT
      hl.*,
      COUNT(*) OVER()::INTEGER AS total_items
    FROM habit_logs hl
    JOIN habits h
      ON h.habit_id = hl.habit_id
    WHERE hl.user_id = $1
      AND hl.habit_id = $2
      AND h.user_id = $1
      AND hl.deleted_at IS NULL
      AND (
        $3::DATE IS NULL
        OR hl.log_date >= $3
      )
      AND (
        $4::DATE IS NULL
        OR hl.log_date <= $4
      )
      AND (
        $5::VARCHAR IS NULL
        OR hl.status = $5
      )
    ORDER BY hl.log_date ${direction}
    LIMIT $6
    OFFSET $7
  `;

  const values = [
    userId,
    habitId,
    startDate ?? null,
    endDate ?? null,
    status ?? null,
    limit,
    offset
  ];

  const { rows } = await pool.query(query, values);
  return rows;
}

export async function updateHabitLogById(
  userId,
  habitId,
  habitLogId,
  logData
) {
  const {
    logDate,
    status,
    value,
    note,
    completedAt
  } = logData;

  const query = `
    UPDATE habit_logs hl
    SET
      log_date = COALESCE($4, log_date),
      status = COALESCE($5, status),
      value = COALESCE($6, value),
      note = COALESCE($7, note),
      completed_at = COALESCE(
        $8,
        completed_at
      )
    FROM habits h
    WHERE hl.habit_id = h.habit_id
      AND hl.user_id = $1
      AND hl.habit_id = $2
      AND hl.habit_log_id = $3
      AND h.user_id = $1
      AND hl.deleted_at IS NULL
    RETURNING hl.*
  `;

  const values = [
    userId,
    habitId,
    habitLogId,
    logDate ?? null,
    status ?? null,
    value ?? null,
    note ?? null,
    completedAt ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] ?? null;
}

export async function softDeleteHabitLogById(
  userId,
  habitId,
  habitLogId
) {
  const query = `
    UPDATE habit_logs hl
    SET deleted_at = NOW()
    FROM habits h
    WHERE hl.habit_id = h.habit_id
      AND hl.user_id = $1
      AND hl.habit_id = $2
      AND hl.habit_log_id = $3
      AND h.user_id = $1
      AND hl.deleted_at IS NULL
    RETURNING hl.*
  `;

  const { rows } = await pool.query(query, [
    userId,
    habitId,
    habitLogId
  ]);

  return rows[0] ?? null;
}

export async function restoreHabitLogById(
  userId,
  habitId,
  habitLogId
) {
  const query = `
    UPDATE habit_logs hl
    SET deleted_at = NULL
    FROM habits h
    WHERE hl.habit_id = h.habit_id
      AND hl.user_id = $1
      AND hl.habit_id = $2
      AND hl.habit_log_id = $3
      AND h.user_id = $1
      AND hl.deleted_at IS NOT NULL
    RETURNING hl.*
  `;

  const { rows } = await pool.query(query, [
    userId,
    habitId,
    habitLogId
  ]);

  return rows[0] ?? null;
}

export async function permanentlyDeleteHabitLogById(
  userId,
  habitId,
  habitLogId
) {
  const query = `
    DELETE FROM habit_logs hl
    USING habits h
    WHERE hl.habit_id = h.habit_id
      AND hl.user_id = $1
      AND hl.habit_id = $2
      AND hl.habit_log_id = $3
      AND h.user_id = $1
    RETURNING hl.*
  `;

  const { rows } = await pool.query(query, [
    userId,
    habitId,
    habitLogId
  ]);

  return rows[0] ?? null;
}
