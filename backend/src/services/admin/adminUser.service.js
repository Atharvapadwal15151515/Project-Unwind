import pool
  from "../../config/database.js";


export async function getAdminUsers({
  search,
  status,
  role,
  limit = 50,
  offset = 0
}) {
  const conditions = [];
  const values = [];

  let index = 1;

  if (search) {
    conditions.push(`
      (
        u.username ILIKE $${index}
        OR u.email ILIKE $${index}
      )
    `);

    values.push(`%${search}%`);
    index++;
  }

  if (status) {
    conditions.push(
      `u.account_status = $${index}`
    );

    values.push(status);
    index++;
  }

  if (role) {
    conditions.push(
      `u.role = $${index}`
    );

    values.push(role);
    index++;
  }

  const whereClause =
    conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  values.push(limit);
  const limitIndex = index;
  index++;

  values.push(offset);
  const offsetIndex = index;

  const result =
    await pool.query(
      `
        SELECT
          u.user_id,
          u.email,
          u.username,
          u.role,
          u.account_status,
          u.email_verified,
          u.last_login_at,
          u.created_at,
          u.updated_at,

          (
            SELECT COUNT(*)::int
            FROM reports r
            WHERE
              r.reported_user_id =
                u.user_id
          )
            AS reports_received,

          (
            SELECT COUNT(*)::int
            FROM user_warnings uw
            WHERE
              uw.user_id =
                u.user_id
          )
            AS warning_count,

          (
            SELECT COUNT(*)::int
            FROM user_restrictions ur
            WHERE
              ur.user_id =
                u.user_id
              AND ur.is_active = TRUE
              AND (
                ur.expires_at IS NULL
                OR ur.expires_at > NOW()
              )
          )
            AS active_restrictions

        FROM users u

        ${whereClause}

        ORDER BY
          u.created_at DESC

        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      values
    );

  return result.rows;
}


export async function getAdminUserById(
  userId
) {
  const userResult =
    await pool.query(
      `
        SELECT
          user_id,
          email,
          username,
          role,
          account_status,
          email_verified,
          two_factor_enabled,
          last_login_at,
          created_at,
          updated_at
        FROM users
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId]
    );

  if (!userResult.rows.length) {
    return null;
  }

  const [
    reportsResult,
    warningsResult,
    restrictionsResult,
    actionsResult
  ] = await Promise.all([

    pool.query(
      `
        SELECT
          report_id,
          target_type,
          target_id,
          reason,
          report_status,
          priority,
          action_taken,
          created_at,
          resolved_at
        FROM reports
        WHERE reported_user_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `,
      [userId]
    ),

    pool.query(
      `
        SELECT
          warning_id,
          reason,
          severity,
          acknowledged_at,
          created_at
        FROM user_warnings
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `,
      [userId]
    ),

    pool.query(
      `
        SELECT
          restriction_id,
          restriction_type,
          reason,
          starts_at,
          expires_at,
          is_active,
          created_at
        FROM user_restrictions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `,
      [userId]
    ),

    pool.query(
      `
        SELECT
          action_id,
          action_type,
          reason,
          duration_minutes,
          expires_at,
          created_at
        FROM moderation_actions
        WHERE target_user_id = $1
        ORDER BY created_at DESC
        LIMIT 30
      `,
      [userId]
    )
  ]);

  return {
    user:
      userResult.rows[0],

    reports:
      reportsResult.rows,

    warnings:
      warningsResult.rows,

    restrictions:
      restrictionsResult.rows,

    moderationActions:
      actionsResult.rows
  };
}