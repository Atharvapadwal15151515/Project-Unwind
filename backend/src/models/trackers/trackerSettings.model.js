import pool from "../../config/database.js";

export async function findTrackerSettingsByUserId(userId) {
  const query = `
    SELECT *
    FROM tracker_settings
    WHERE user_id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0] ?? null;
}

export async function createDefaultTrackerSettings(userId) {
  const query = `
    INSERT INTO tracker_settings (
      user_id
    )
    VALUES ($1)
    ON CONFLICT (user_id)
    DO UPDATE SET
      updated_at = tracker_settings.updated_at
    RETURNING *
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

export async function updateTrackerSettingsByUserId(
  userId,
  settingsData
) {
  const {
    timezone,
    preferredWaterUnit,
    dailyWaterGoalMl,
    moodTrackerEnabled,
    sleepTrackerEnabled,
    habitTrackerEnabled,
    energyTrackerEnabled,
    waterTrackerEnabled
  } = settingsData;

  const query = `
    UPDATE tracker_settings
    SET
      timezone = COALESCE($2, timezone),
      preferred_water_unit = COALESCE(
        $3,
        preferred_water_unit
      ),
      daily_water_goal_ml = COALESCE(
        $4,
        daily_water_goal_ml
      ),
      mood_tracker_enabled = COALESCE(
        $5,
        mood_tracker_enabled
      ),
      sleep_tracker_enabled = COALESCE(
        $6,
        sleep_tracker_enabled
      ),
      habit_tracker_enabled = COALESCE(
        $7,
        habit_tracker_enabled
      ),
      energy_tracker_enabled = COALESCE(
        $8,
        energy_tracker_enabled
      ),
      water_tracker_enabled = COALESCE(
        $9,
        water_tracker_enabled
      )
    WHERE user_id = $1
    RETURNING *
  `;

  const values = [
    userId,
    timezone ?? null,
    preferredWaterUnit ?? null,
    dailyWaterGoalMl ?? null,
    moodTrackerEnabled ?? null,
    sleepTrackerEnabled ?? null,
    habitTrackerEnabled ?? null,
    energyTrackerEnabled ?? null,
    waterTrackerEnabled ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] ?? null;
}
