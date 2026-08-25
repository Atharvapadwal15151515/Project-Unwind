import pool from "../config/database.js";

export async function createSession({
  userId,
  refreshTokenHash,
  deviceName = null,
  browser = null,
  operatingSystem = null,
  ipAddress = null,
  userAgent = null,
  expiresAt,
  rememberMe = false
}) {
  const query = `
    INSERT INTO user_sessions (
      user_id,
      refresh_token_hash,
      device_name,
      browser,
      operating_system,
      ip_address,
      user_agent,
      expires_at,
      remember_me
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;

  const values = [
    userId,
    refreshTokenHash,
    deviceName,
    browser,
    operatingSystem,
    ipAddress,
    userAgent,
    expiresAt,
    rememberMe
  ];

  const { rows } = await pool.query(
    query,
    values
  );

  return rows[0];
}

export async function findSessionByRefreshTokenHash(refreshTokenHash) {
  const query = `
    SELECT *
    FROM user_sessions
    WHERE refresh_token_hash = $1
      AND revoked_at IS NULL
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [refreshTokenHash]);
  return rows[0] || null;
}

export async function updateSessionActivity(sessionId) {
  const query = `
    UPDATE user_sessions
    SET last_used_at = NOW()
    WHERE session_id = $1
    RETURNING *
  `;

  const { rows } = await pool.query(query, [sessionId]);
  return rows[0] || null;
}

export async function revokeSession(sessionId) {
  const query = `
    UPDATE user_sessions
    SET revoked_at = NOW()
    WHERE session_id = $1
    RETURNING *
  `;

  const { rows } = await pool.query(query, [sessionId]);
  return rows[0] || null;
}

export async function revokeAllUserSessions(userId) {
  const query = `
    UPDATE user_sessions
    SET revoked_at = NOW()
    WHERE user_id = $1
      AND revoked_at IS NULL
  `;

  await pool.query(query, [userId]);
}

export async function deleteExpiredSessions() {
  const query = `
    DELETE FROM user_sessions
    WHERE expires_at < NOW()
  `;

  await pool.query(query);
}