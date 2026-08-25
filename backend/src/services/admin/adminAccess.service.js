import bcrypt from "bcrypt";
import crypto from "crypto";

import pool
  from "../../config/database.js";

export async function verifyAdminPassword(
  password
) {
  const hash =
    process.env.ADMIN_ACCESS_PASSWORD_HASH;

  if (!hash) {
    throw new Error(
      "ADMIN_ACCESS_PASSWORD_HASH is not configured"
    );
  }

  return bcrypt.compare(
    password,
    hash
  );
}


export async function createAdminAccessSession({
  adminId,
  ipAddress,
  userAgent
}) {
  const rawToken =
    crypto.randomBytes(48).toString("hex");

  const tokenHash =
    crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

  /*
  |--------------------------------------------------------------------------
  | Admin Access Expiry
  |--------------------------------------------------------------------------
  |
  | Temporary admin access for 15 minutes.
  |
  */

  const expiresAt =
  new Date(
    Date.now() +
    12 * 60 * 60 * 1000
  );

  await pool.query(
    `
      INSERT INTO admin_access_sessions (
        admin_id,
        session_token_hash,
        expires_at,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      adminId,
      tokenHash,
      expiresAt,
      ipAddress || null,
      userAgent || null
    ]
  );

  return {
    token: rawToken,
    expiresAt
  };
}

export async function revokeAdminAccessSession(
  sessionId
) {
  await pool.query(
    `
      UPDATE admin_access_sessions
      SET revoked_at = NOW()
      WHERE admin_access_session_id = $1
    `,
    [sessionId]
  );
}