import pool
  from "../../config/database.js";


export async function getAdminDashboardStats() {
  const [
    usersResult,
    reportsResult,
    testimonialsResult,
    restrictionsResult,
    warningsResult,
    actionsResult
  ] = await Promise.all([

    /*
    |--------------------------------------------------------------------------
    | Users
    |--------------------------------------------------------------------------
    */

    pool.query(`
      SELECT
        COUNT(*)::int AS total_users,

        COUNT(*) FILTER (
          WHERE account_status = 'active'
        )::int AS active_users,

        COUNT(*) FILTER (
          WHERE account_status = 'suspended'
        )::int AS suspended_users,

        COUNT(*) FILTER (
          WHERE account_status = 'banned'
        )::int AS banned_users,

        COUNT(*) FILTER (
          WHERE role = 'admin'
        )::int AS admin_users
      FROM users
      WHERE account_status != 'deleted'
    `),


    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE report_status = 'pending'
        )::int AS pending_reports,

        COUNT(*) FILTER (
          WHERE report_status = 'under_review'
        )::int AS under_review_reports,

        COUNT(*) FILTER (
          WHERE priority = 'high'
          AND report_status != 'resolved'
        )::int AS high_priority_reports,

        COUNT(*) FILTER (
          WHERE priority = 'critical'
          AND report_status != 'resolved'
        )::int AS critical_reports
      FROM reports
    `),


    /*
    |--------------------------------------------------------------------------
    | Testimonials
    |--------------------------------------------------------------------------
    */

    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE status = 'pending'
        )::int AS pending_testimonials,

        COUNT(*) FILTER (
          WHERE status = 'approved'
        )::int AS approved_testimonials,

        COUNT(*) FILTER (
          WHERE status = 'rejected'
        )::int AS rejected_testimonials
      FROM testimonials
    `),


    /*
    |--------------------------------------------------------------------------
    | Active Restrictions
    |--------------------------------------------------------------------------
    */

    pool.query(`
      SELECT
        COUNT(*)::int AS active_restrictions
      FROM user_restrictions
      WHERE is_active = TRUE
      AND (
        expires_at IS NULL
        OR expires_at > NOW()
      )
    `),


    /*
    |--------------------------------------------------------------------------
    | Warnings
    |--------------------------------------------------------------------------
    */

    pool.query(`
      SELECT
        COUNT(*)::int AS total_warnings,

        COUNT(*) FILTER (
          WHERE acknowledged_at IS NULL
        )::int AS unacknowledged_warnings
      FROM user_warnings
    `),


    /*
    |--------------------------------------------------------------------------
    | Recent Moderation Actions
    |--------------------------------------------------------------------------
    */

    pool.query(`
      SELECT
        ma.action_id,
        ma.action_type,
        ma.target_user_id,
        ma.target_type,
        ma.target_id,
        ma.reason,
        ma.created_at,

        u.username AS admin_username

      FROM moderation_actions ma

      LEFT JOIN users u
        ON u.user_id = ma.admin_id

      ORDER BY ma.created_at DESC

      LIMIT 10
    `)
  ]);


  return {
    users:
      usersResult.rows[0],

    reports:
      reportsResult.rows[0],

    testimonials:
      testimonialsResult.rows[0],

    restrictions:
      restrictionsResult.rows[0],

    warnings:
      warningsResult.rows[0],

    recentActions:
      actionsResult.rows
  };
}