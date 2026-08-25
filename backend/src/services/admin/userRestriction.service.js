import pool from "../../config/database.js";


export async function getActiveUserRestrictions(
  userId
) {
  const result = await pool.query(
    `
      SELECT
        restriction_id,
        restriction_type,
        reason,
        starts_at,
        expires_at
      FROM user_restrictions
      WHERE
        user_id = $1
        AND is_active = TRUE
        AND starts_at <= NOW()
        AND (
          expires_at IS NULL
          OR expires_at > NOW()
        )
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
}


export async function hasActiveRestriction(
  userId,
  restrictionTypes
) {
  const types =
    Array.isArray(restrictionTypes)
      ? restrictionTypes
      : [restrictionTypes];

  const result = await pool.query(
    `
      SELECT
        restriction_id,
        restriction_type,
        reason,
        expires_at
      FROM user_restrictions
      WHERE
        user_id = $1
        AND restriction_type = ANY($2::varchar[])
        AND is_active = TRUE
        AND starts_at <= NOW()
        AND (
          expires_at IS NULL
          OR expires_at > NOW()
        )
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [
      userId,
      types
    ]
  );

  return result.rows[0] || null;
}