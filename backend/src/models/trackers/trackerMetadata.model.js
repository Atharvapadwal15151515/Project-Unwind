import pool from "../../config/database.js";

export async function findAvailableTrackerEmotions(userId) {
  const query = `
    SELECT *
    FROM tracker_emotions
    WHERE deleted_at IS NULL
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $1
      )
    ORDER BY
      is_system DESC,
      display_order ASC,
      emotion_name ASC
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
}

export async function findTrackerEmotionById(
  userId,
  emotionId
) {
  const query = `
    SELECT *
    FROM tracker_emotions
    WHERE emotion_id = $2
      AND deleted_at IS NULL
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $1
      )
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    emotionId
  ]);

  return rows[0] ?? null;
}

export async function findAvailableTrackerActivities(
  userId
) {
  const query = `
    SELECT *
    FROM tracker_activities
    WHERE deleted_at IS NULL
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $1
      )
    ORDER BY
      is_system DESC,
      display_order ASC,
      activity_name ASC
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
}

export async function findTrackerActivityById(
  userId,
  activityId
) {
  const query = `
    SELECT *
    FROM tracker_activities
    WHERE activity_id = $2
      AND deleted_at IS NULL
      AND is_active = TRUE
      AND (
        is_system = TRUE
        OR user_id = $1
      )
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    activityId
  ]);

  return rows[0] ?? null;
}

export async function findActiveSleepFactors() {
  const query = `
    SELECT *
    FROM sleep_factors
    WHERE is_active = TRUE
    ORDER BY
      display_order ASC,
      factor_name ASC
  `;

  const { rows } = await pool.query(query);
  return rows;
}

export async function findSleepFactorById(
  sleepFactorId
) {
  const query = `
    SELECT *
    FROM sleep_factors
    WHERE sleep_factor_id = $1
      AND is_active = TRUE
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    sleepFactorId
  ]);

  return rows[0] ?? null;
}
