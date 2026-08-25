import pool from "../config/database.js";

export async function createAuthToken({
  userId,
  tokenHash,
  tokenType,
  deliveryMethod,
  expiresAt
}) {
  const query = `
    INSERT INTO auth_tokens (
      user_id,
      token_hash,
      token_type,
      delivery_method,
      expires_at
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    userId,
    tokenHash,
    tokenType,
    deliveryMethod,
    expiresAt
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function findAuthToken({
  userId,
  tokenHash,
  tokenType,
  deliveryMethod
}) {
  const query = `
    SELECT *
    FROM auth_tokens
    WHERE user_id = $1
      AND token_hash = $2
      AND token_type = $3
      AND delivery_method = $4
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    tokenHash,
    tokenType,
    deliveryMethod
  ]);

  return rows[0] || null;
}

export async function incrementAttemptCount(tokenId) {
  const query = `
    UPDATE auth_tokens
    SET attempt_count = attempt_count + 1
    WHERE token_id = $1
    RETURNING attempt_count
  `;

  const { rows } = await pool.query(query, [tokenId]);
  return rows[0];
}

export async function markTokenAsUsed(tokenId) {
  const query = `
    UPDATE auth_tokens
    SET used_at = NOW()
    WHERE token_id = $1
    RETURNING *
  `;

  const { rows } = await pool.query(query, [tokenId]);
  return rows[0];
}

export async function deleteExpiredTokens() {
  const query = `
    DELETE FROM auth_tokens
    WHERE expires_at < NOW()
  `;

  await pool.query(query);
}

export async function deleteUserTokens(
  userId,
  tokenType,
  deliveryMethod = null
) {
  const query = `
    DELETE FROM auth_tokens
    WHERE user_id = $1
      AND token_type = $2
      AND ($3::VARCHAR IS NULL OR delivery_method = $3)
  `;

  await pool.query(query, [
    userId,
    tokenType,
    deliveryMethod
  ]);
}

export async function findLatestActiveToken({
  userId,
  tokenType,
  deliveryMethod
}) {
  const query = `
    SELECT *
    FROM auth_tokens
    WHERE user_id = $1
      AND token_type = $2
      AND delivery_method = $3
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [
    userId,
    tokenType,
    deliveryMethod
  ]);

  return rows[0] || null;
}