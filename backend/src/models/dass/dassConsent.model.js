import pool from "../../config/database.js";

export async function getConsentByUserId(userId) {
  const query = `
    SELECT *
    FROM assessment_consents
    WHERE user_id = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0] || null;
}

export async function createConsent(
  userId,
  consentVersion = "1.0"
) {
  const query = `
    INSERT INTO assessment_consents (
      user_id,
      consent_given,
      consent_version,
      consented_at
    )
    VALUES (
      $1,
      TRUE,
      $2,
      NOW()
    )
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    userId,
    consentVersion,
  ]);

  return rows[0];
}

export async function updateConsent(
  userId,
  consentVersion = "1.0"
) {
  const query = `
    UPDATE assessment_consents
    SET
      consent_given = TRUE,
      consent_version = $2,
      consented_at = NOW(),
      revoked_at = NULL,
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    userId,
    consentVersion,
  ]);

  return rows[0];
}

export async function revokeConsent(userId) {
  const query = `
    UPDATE assessment_consents
    SET
      consent_given = FALSE,
      revoked_at = NOW(),
      updated_at = NOW()
    WHERE user_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0];
}

export async function deleteConsent(userId) {
  const query = `
    DELETE FROM assessment_consents
    WHERE user_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0] || null;
}