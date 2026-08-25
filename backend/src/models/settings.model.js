import pool from "../config/database.js";

export async function createSettings(userId) {
  const query = `
    INSERT INTO user_settings (user_id)
    VALUES ($1)
    RETURNING *
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
}

export async function findSettingsByUserId(userId) {
  const query = `
    SELECT *
    FROM user_settings
    WHERE user_id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0] || null;
}

export async function updateSettings(userId, updates) {
  const {
    themeName,
    displayMode,
    customTheme,
    notificationEnabled,
    accessibilityOptions,
    privacyOptions,
    aiConsent,
    journalLockEnabled
  } = updates;

  const query = `
    UPDATE user_settings
    SET
      theme_name = COALESCE($2, theme_name),
      display_mode = COALESCE($3, display_mode),
      custom_theme = COALESCE($4, custom_theme),
      notification_enabled = COALESCE($5, notification_enabled),
      accessibility_options = COALESCE($6, accessibility_options),
      privacy_options = COALESCE($7, privacy_options),
      ai_consent = COALESCE($8, ai_consent),
      journal_lock_enabled = COALESCE($9, journal_lock_enabled),
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *
  `;

  const values = [
    userId,
    themeName ?? null,
    displayMode ?? null,
    customTheme ?? null,
    notificationEnabled ?? null,
    accessibilityOptions ?? null,
    privacyOptions ?? null,
    aiConsent ?? null,
    journalLockEnabled ?? null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}