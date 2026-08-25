import pool
  from "../../config/database.js";


export async function restoreExpiredSuspensionForUser(
  userId
) {
  const result =
    await pool.query(
      `
        SELECT
          action_id,
          expires_at
        FROM moderation_actions
        WHERE
          target_user_id = $1
          AND action_type =
            'temporary_suspension'
          AND expires_at IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId]
    );

  if (result.rows.length === 0) {
    return false;
  }

  const suspension =
    result.rows[0];

  const hasExpired =
    new Date(
      suspension.expires_at
    ) <= new Date();

  if (!hasExpired) {
    return false;
  }

  const updateResult =
    await pool.query(
      `
        UPDATE users
        SET
          account_status = 'active',
          updated_at = NOW()
        WHERE
          user_id = $1
          AND account_status = 'suspended'
        RETURNING user_id
      `,
      [userId]
    );

  return (
    updateResult.rows.length > 0
  );
}