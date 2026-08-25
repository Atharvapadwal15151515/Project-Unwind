import pool from "../../config/database.js";

export async function createTrackerReminder(
  userId,
  reminderData
) {
  const {
    trackerType,
    reminderName,
    reminderTime,
    frequencyType,
    reminderDays,
    isEnabled
  } = reminderData;

  const query = `
    INSERT INTO tracker_reminders (
      user_id,
      tracker_type,
      reminder_name,
      reminder_time,
      frequency_type,
      reminder_days,
      is_enabled
    )
    VALUES (
      $1, $2, $3, $4,
      $5, $6, $7
    )
    RETURNING *
  `;

  const values = [
    userId,
    trackerType,
    reminderName ?? null,
    reminderTime,
    frequencyType ?? "daily",
    reminderDays ?? [],
    isEnabled ?? true
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function findTrackerReminderById(
  userId,
  trackerReminderId,
  includeDeleted = false
) {
  const query = `
    SELECT *
    FROM tracker_reminders
    WHERE user_id = $1
      AND tracker_reminder_id = $2
      AND (
        $3::BOOLEAN = TRUE
        OR deleted_at IS NULL
      )
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    trackerReminderId,
    includeDeleted
  ]);

  return rows[0] ?? null;
}

export async function findTrackerRemindersByUserId(
  userId,
  trackerType = null
) {
  const query = `
    SELECT *
    FROM tracker_reminders
    WHERE user_id = $1
      AND deleted_at IS NULL
      AND (
        $2::VARCHAR IS NULL
        OR tracker_type = $2
      )
    ORDER BY
      tracker_type ASC,
      reminder_time ASC
  `;

  const { rows } = await pool.query(query, [
    userId,
    trackerType
  ]);

  return rows;
}

export async function updateTrackerReminderById(
  userId,
  trackerReminderId,
  reminderData
) {
  const {
    trackerType,
    reminderName,
    reminderTime,
    frequencyType,
    reminderDays,
    isEnabled
  } = reminderData;

  const query = `
    UPDATE tracker_reminders
    SET
      tracker_type = COALESCE(
        $3,
        tracker_type
      ),
      reminder_name = COALESCE(
        $4,
        reminder_name
      ),
      reminder_time = COALESCE(
        $5,
        reminder_time
      ),
      frequency_type = COALESCE(
        $6,
        frequency_type
      ),
      reminder_days = COALESCE(
        $7,
        reminder_days
      ),
      is_enabled = COALESCE(
        $8,
        is_enabled
      )
    WHERE user_id = $1
      AND tracker_reminder_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const values = [
    userId,
    trackerReminderId,
    trackerType ?? null,
    reminderName ?? null,
    reminderTime ?? null,
    frequencyType ?? null,
    reminderDays ?? null,
    isEnabled ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] ?? null;
}

export async function softDeleteTrackerReminderById(
  userId,
  trackerReminderId
) {
  const query = `
    UPDATE tracker_reminders
    SET
      deleted_at = NOW(),
      is_enabled = FALSE
    WHERE user_id = $1
      AND tracker_reminder_id = $2
      AND deleted_at IS NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    trackerReminderId
  ]);

  return rows[0] ?? null;
}

export async function restoreTrackerReminderById(
  userId,
  trackerReminderId
) {
  const query = `
    UPDATE tracker_reminders
    SET deleted_at = NULL
    WHERE user_id = $1
      AND tracker_reminder_id = $2
      AND deleted_at IS NOT NULL
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    trackerReminderId
  ]);

  return rows[0] ?? null;
}

export async function permanentlyDeleteTrackerReminderById(
  userId,
  trackerReminderId
) {
  const query = `
    DELETE FROM tracker_reminders
    WHERE user_id = $1
      AND tracker_reminder_id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    userId,
    trackerReminderId
  ]);

  return rows[0] ?? null;
}
