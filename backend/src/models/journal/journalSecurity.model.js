import pool from "../../config/database.js";

/*
|--------------------------------------------------------------------------
| Create Journal security settings
|--------------------------------------------------------------------------
| Creates one security row for a user.
| The unique constraint on user_id prevents duplicate rows.
*/

export async function createJournalSecuritySettings(
  userId,
  client = pool
) {
  const query = `
    INSERT INTO journal_security_settings (
      user_id
    )
    VALUES ($1)
    ON CONFLICT (user_id)
    DO NOTHING
    RETURNING
      journal_security_id,
      user_id,
      is_security_enabled,
      failed_attempts,
      locked_until,
      pin_created_at,
      pin_updated_at,
      last_unlocked_at,
      created_at,
      updated_at
  `;

  const { rows } = await client.query(
    query,
    [userId]
  );

  if (rows[0]) {
    return rows[0];
  }

  return findJournalSecurityByUserId(
    userId,
    client
  );
}

/*
|--------------------------------------------------------------------------
| Find Journal security settings by user ID
|--------------------------------------------------------------------------
*/

export async function findJournalSecurityByUserId(
  userId,
  client = pool
) {
  const query = `
    SELECT
      journal_security_id,
      user_id,
      is_security_enabled,
      pin_hash,
      failed_attempts,
      locked_until,
      pin_created_at,
      pin_updated_at,
      last_unlocked_at,
      created_at,
      updated_at
    FROM journal_security_settings
    WHERE user_id = $1
    LIMIT 1
  `;

  const { rows } = await client.query(
    query,
    [userId]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Set Journal PIN for the first time
|--------------------------------------------------------------------------
*/

export async function setJournalPinHash(
  userId,
  pinHash,
  client = pool
) {
  const query = `
    UPDATE journal_security_settings
    SET
      pin_hash = $2,
      is_security_enabled = TRUE,
      failed_attempts = 0,
      locked_until = NULL,
      pin_created_at = NOW(),
      pin_updated_at = NOW(),
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING
      journal_security_id,
      user_id,
      is_security_enabled,
      failed_attempts,
      locked_until,
      pin_created_at,
      pin_updated_at,
      last_unlocked_at,
      created_at,
      updated_at
  `;

  const { rows } = await client.query(
    query,
    [
      userId,
      pinHash
    ]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Update existing Journal PIN
|--------------------------------------------------------------------------
*/

export async function updateJournalPinHash(
  userId,
  pinHash,
  client = pool
) {
  const query = `
    UPDATE journal_security_settings
    SET
      pin_hash = $2,
      is_security_enabled = TRUE,
      failed_attempts = 0,
      locked_until = NULL,
      pin_updated_at = NOW(),
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING
      journal_security_id,
      user_id,
      is_security_enabled,
      failed_attempts,
      locked_until,
      pin_created_at,
      pin_updated_at,
      last_unlocked_at,
      created_at,
      updated_at
  `;

  const { rows } = await client.query(
    query,
    [
      userId,
      pinHash
    ]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Remove Journal PIN
|--------------------------------------------------------------------------
| Disables Journal security and clears PIN-related state.
*/

export async function removeJournalPinHash(
  userId,
  client = pool
) {
  const query = `
    UPDATE journal_security_settings
    SET
      pin_hash = NULL,
      is_security_enabled = FALSE,
      failed_attempts = 0,
      locked_until = NULL,
      pin_created_at = NULL,
      pin_updated_at = NULL,
      last_unlocked_at = NULL,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING
      journal_security_id,
      user_id,
      is_security_enabled,
      failed_attempts,
      locked_until,
      pin_created_at,
      pin_updated_at,
      last_unlocked_at,
      created_at,
      updated_at
  `;

  const { rows } = await client.query(
    query,
    [userId]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Increment failed PIN attempts
|--------------------------------------------------------------------------
*/

export async function incrementFailedPinAttempts(
  userId,
  client = pool
) {
  const query = `
    UPDATE journal_security_settings
    SET
      failed_attempts = failed_attempts + 1,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING
      failed_attempts,
      locked_until
  `;

  const { rows } = await client.query(
    query,
    [userId]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Reset failed PIN attempts
|--------------------------------------------------------------------------
*/

export async function resetFailedPinAttempts(
  userId,
  client = pool
) {
  const query = `
    UPDATE journal_security_settings
    SET
      failed_attempts = 0,
      locked_until = NULL,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING
      failed_attempts,
      locked_until
  `;

  const { rows } = await client.query(
    query,
    [userId]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Set temporary PIN lockout
|--------------------------------------------------------------------------
*/

export async function setJournalLockout(
  userId,
  lockedUntil,
  client = pool
) {
  const query = `
    UPDATE journal_security_settings
    SET
      locked_until = $2,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING
      failed_attempts,
      locked_until
  `;

  const { rows } = await client.query(
    query,
    [
      userId,
      lockedUntil
    ]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Clear temporary PIN lockout
|--------------------------------------------------------------------------
*/

export async function clearJournalLockout(
  userId,
  client = pool
) {
  const query = `
    UPDATE journal_security_settings
    SET
      failed_attempts = 0,
      locked_until = NULL,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING
      failed_attempts,
      locked_until
  `;

  const { rows } = await client.query(
    query,
    [userId]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Update last successful unlock time
|--------------------------------------------------------------------------
*/

export async function updateLastUnlockedAt(
  userId,
  client = pool
) {
  const query = `
    UPDATE journal_security_settings
    SET
      last_unlocked_at = NOW(),
      failed_attempts = 0,
      locked_until = NULL,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING
      last_unlocked_at,
      failed_attempts,
      locked_until
  `;

  const { rows } = await client.query(
    query,
    [userId]
  );

  return rows[0] || null;
}
/*
|--------------------------------------------------------------------------
| Create Journal unlock session
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Create Journal unlock session
|--------------------------------------------------------------------------
*/

export async function createJournalUnlockSession(
  userId,
  sessionIdentifierHash,
  expiresAt,
  client = pool
) {
  const query = `
    INSERT INTO journal_unlock_sessions (
      user_id,
      session_identifier_hash,
      unlock_method,
      expires_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4
    )
    RETURNING
      unlock_session_id,
      user_id,
      session_identifier_hash,
      unlock_method,
      unlocked_at,
      expires_at,
      revoked_at,
      created_at
  `;

  const { rows } = await client.query(
    query,
    [
      userId,
      sessionIdentifierHash,
      "pin",
      expiresAt
    ]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Find active Journal unlock session
|--------------------------------------------------------------------------
*/

export async function findJournalUnlockSession(
  sessionIdentifierHash,
  client = pool
) {
  const query = `
    SELECT
      unlock_session_id,
      user_id,
      session_identifier_hash,
      unlock_method,
      unlocked_at,
      expires_at,
      revoked_at,
      created_at
    FROM journal_unlock_sessions
    WHERE session_identifier_hash = $1
      AND revoked_at IS NULL
    LIMIT 1
  `;

  const { rows } = await client.query(
    query,
    [sessionIdentifierHash]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Revoke one Journal unlock session
|--------------------------------------------------------------------------
*/

export async function revokeJournalUnlockSession(
  unlockSessionId,
  userId,
  client = pool
) {
  const query = `
    UPDATE journal_unlock_sessions
    SET
      revoked_at = NOW()
    WHERE unlock_session_id = $1
      AND user_id = $2
      AND revoked_at IS NULL
    RETURNING
      unlock_session_id,
      user_id,
      revoked_at
  `;

  const { rows } = await client.query(
    query,
    [
      unlockSessionId,
      userId
    ]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| Revoke all Journal unlock sessions
|--------------------------------------------------------------------------
*/

export async function revokeAllJournalUnlockSessions(
  userId,
  client = pool
) {
  const query = `
    UPDATE journal_unlock_sessions
    SET
      revoked_at = NOW()
    WHERE user_id = $1
      AND revoked_at IS NULL
    RETURNING
      unlock_session_id,
      user_id,
      revoked_at
  `;

  const { rows } = await client.query(
    query,
    [userId]
  );

  return rows;
}

/*
|--------------------------------------------------------------------------
| Delete expired or revoked Journal unlock sessions
|--------------------------------------------------------------------------
*/

export async function deleteExpiredJournalUnlockSessions(
  client = pool
) {
  const query = `
    DELETE FROM journal_unlock_sessions
    WHERE expires_at <= NOW()
       OR revoked_at IS NOT NULL
  `;

  await client.query(query);
}