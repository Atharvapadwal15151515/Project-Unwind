import pool from "../../config/database.js";

/**
 * Create a new report.
 *
 * Supported target types can include:
 * - post
 * - comment
 * - chat_message
 * - private_room
 * - direct_message
 * - user
 */
export async function createReport({
  reporterUserId,
  targetType,
  targetId,
  reportedUserId = null,
  reason,
  description = null,
}) {
  const query = `
    INSERT INTO reports (
      reporter_user_id,
      target_type,
      target_id,
      reported_user_id,
      reason,
      description,
      report_status,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      'pending',
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  const values = [
    reporterUserId,
    targetType,
    targetId,
    reportedUserId,
    reason,
    description,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Find one report by its ID.
 */
export async function findReportById(reportId) {
  const query = `
    SELECT
      report.*,

      reporter.username AS reporter_username,
      reported_user.username AS reported_username,
      reviewer.username AS reviewer_username

    FROM reports report

    LEFT JOIN users reporter
      ON reporter.user_id = report.reporter_user_id

    LEFT JOIN users reported_user
      ON reported_user.user_id = report.reported_user_id

    LEFT JOIN users reviewer
      ON reviewer.user_id = report.reviewed_by

    WHERE report.report_id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [reportId]);
  return result.rows[0] || null;
}

/**
 * Find a report and lock it for moderation updates.
 */
export async function findReportByIdForUpdate(
  reportId,
  client = pool
) {
  const query = `
    SELECT *
    FROM reports
    WHERE report_id = $1
    FOR UPDATE
  `;

  const result = await client.query(query, [reportId]);
  return result.rows[0] || null;
}

/**
 * Check whether the same user already submitted an active report
 * against the same target.
 */
export async function findDuplicateReport({
  reporterUserId,
  targetType,
  targetId,
}) {
  const query = `
    SELECT *
    FROM reports
    WHERE reporter_user_id = $1
      AND target_type = $2
      AND target_id = $3
      AND report_status IN ('pending', 'reviewing')
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [
    reporterUserId,
    targetType,
    targetId,
  ]);

  return result.rows[0] || null;
}

/**
 * Return reports using filters and pagination.
 */
export async function findReports({
  status = null,
  targetType = null,
  reportedUserId = null,
  reporterUserId = null,
  limit = 30,
  offset = 0,
}) {
  const query = `
    SELECT
      report.*,

      reporter.username AS reporter_username,
      reported_user.username AS reported_username,
      reviewer.username AS reviewer_username

    FROM reports report

    LEFT JOIN users reporter
      ON reporter.user_id = report.reporter_user_id

    LEFT JOIN users reported_user
      ON reported_user.user_id = report.reported_user_id

    LEFT JOIN users reviewer
      ON reviewer.user_id = report.reviewed_by

    WHERE ($1::TEXT IS NULL OR report.report_status = $1)
      AND ($2::TEXT IS NULL OR report.target_type = $2)
      AND ($3::UUID IS NULL OR report.reported_user_id = $3)
      AND ($4::UUID IS NULL OR report.reporter_user_id = $4)

    ORDER BY
      CASE report.report_status
        WHEN 'pending' THEN 1
        WHEN 'reviewing' THEN 2
        WHEN 'resolved' THEN 3
        WHEN 'rejected' THEN 4
        ELSE 5
      END,
      report.created_at DESC

    LIMIT $5
    OFFSET $6
  `;

  const result = await pool.query(query, [
    status,
    targetType,
    reportedUserId,
    reporterUserId,
    limit,
    offset,
  ]);

  return result.rows;
}

/**
 * Count reports using optional filters.
 */
export async function countReports({
  status = null,
  targetType = null,
  reportedUserId = null,
  reporterUserId = null,
}) {
  const query = `
    SELECT COUNT(*)::INTEGER AS report_count
    FROM reports
    WHERE ($1::TEXT IS NULL OR report_status = $1)
      AND ($2::TEXT IS NULL OR target_type = $2)
      AND ($3::UUID IS NULL OR reported_user_id = $3)
      AND ($4::UUID IS NULL OR reporter_user_id = $4)
  `;

  const result = await pool.query(query, [
    status,
    targetType,
    reportedUserId,
    reporterUserId,
  ]);

  return result.rows[0].report_count;
}

/**
 * Return reports submitted by one user.
 */
export async function findReportsByReporter({
  reporterUserId,
  status = null,
  limit = 30,
  offset = 0,
}) {
  const query = `
    SELECT
      report.*,

      reported_user.username
        AS reported_username,

      reviewer.username
        AS reviewer_username

    FROM reports report

    LEFT JOIN users reported_user
      ON reported_user.user_id =
        report.reported_user_id

    LEFT JOIN users reviewer
      ON reviewer.user_id =
        report.reviewed_by

    WHERE report.reporter_user_id = $1
      AND (
        $2::TEXT IS NULL
        OR report.report_status = $2
      )

    ORDER BY report.created_at DESC

    LIMIT $3
    OFFSET $4
  `;

  const result = await pool.query(
    query,
    [
      reporterUserId,
      status,
      limit,
      offset,
    ]
  );

  return result.rows;
}

/**
 * Return reports against one user.
 */
export async function findReportsAgainstUser({
  reportedUserId,
  status = null,
  limit = 30,
  offset = 0,
}) {
  const query = `
    SELECT
      report.*,
      reporter.username AS reporter_username,
      reviewer.username AS reviewer_username

    FROM reports report

    LEFT JOIN users reporter
      ON reporter.user_id = report.reporter_user_id

    LEFT JOIN users reviewer
      ON reviewer.user_id = report.reviewed_by

    WHERE report.reported_user_id = $1
      AND ($2::TEXT IS NULL OR report.report_status = $2)

    ORDER BY report.created_at DESC

    LIMIT $3
    OFFSET $4
  `;

  const result = await pool.query(query, [
    reportedUserId,
    status,
    limit,
    offset,
  ]);

  return result.rows;
}

/**
 * Return reports for a specific target.
 */
export async function findReportsForTarget({
  targetType,
  targetId,
}) {
  const query = `
    SELECT
      report.*,
      reporter.username AS reporter_username,
      reviewer.username AS reviewer_username

    FROM reports report

    LEFT JOIN users reporter
      ON reporter.user_id = report.reporter_user_id

    LEFT JOIN users reviewer
      ON reviewer.user_id = report.reviewed_by

    WHERE report.target_type = $1
      AND report.target_id = $2

    ORDER BY report.created_at DESC
  `;

  const result = await pool.query(query, [
    targetType,
    targetId,
  ]);

  return result.rows;
}

/**
 * Move a report into reviewing status.
 */
export async function markReportAsReviewing({
  reportId,
  reviewedBy,
  client = pool,
}) {
  const query = `
    UPDATE reports
    SET
      report_status = 'reviewing',
      reviewed_by = $2,
      reviewed_at = NOW(),
      updated_at = NOW()

    WHERE report_id = $1
      AND report_status = 'pending'

    RETURNING *
  `;

  const result = await client.query(query, [
    reportId,
    reviewedBy,
  ]);

  return result.rows[0] || null;
}

/**
 * Resolve a report.
 */
export async function resolveReport({
  reportId,
  reviewedBy,
  moderationNotes = null,
  actionTaken = null,
  client = pool,
}) {
  const query = `
    UPDATE reports
    SET
      report_status = 'resolved',
      reviewed_by = $2,
      reviewed_at = COALESCE(reviewed_at, NOW()),
      resolved_at = NOW(),
      moderation_notes = $3,
      action_taken = $4,
      updated_at = NOW()

    WHERE report_id = $1

    RETURNING *
  `;

  const result = await client.query(query, [
    reportId,
    reviewedBy,
    moderationNotes,
    actionTaken,
  ]);

  return result.rows[0] || null;
}

/**
 * Reject a report.
 */
export async function rejectReport({
  reportId,
  reviewedBy,
  moderationNotes = null,
  client = pool,
}) {
  const query = `
    UPDATE reports
    SET
      report_status = 'rejected',
      reviewed_by = $2,
      reviewed_at = COALESCE(reviewed_at, NOW()),
      resolved_at = NOW(),
      moderation_notes = $3,
      action_taken = 'no_action',
      updated_at = NOW()

    WHERE report_id = $1

    RETURNING *
  `;

  const result = await client.query(query, [
    reportId,
    reviewedBy,
    moderationNotes,
  ]);

  return result.rows[0] || null;
}

/**
 * Update moderation notes without changing the report status.
 */
export async function updateReportModerationNotes({
  reportId,
  moderationNotes,
  reviewedBy = null,
}) {
  const query = `
    UPDATE reports
    SET
      moderation_notes = $2,
      reviewed_by = COALESCE($3, reviewed_by),
      updated_at = NOW()

    WHERE report_id = $1

    RETURNING *
  `;

  const result = await pool.query(query, [
    reportId,
    moderationNotes,
    reviewedBy,
  ]);

  return result.rows[0] || null;
}

/**
 * Change report status.
 */
export async function updateReportStatus({
  reportId,
  reportStatus,
  reviewedBy = null,
}) {
  const query = `
    UPDATE reports
    SET
      report_status = $2,
      reviewed_by = COALESCE($3, reviewed_by),

      reviewed_at = CASE
        WHEN $2 IN ('reviewing', 'resolved', 'rejected')
          THEN COALESCE(reviewed_at, NOW())
        ELSE reviewed_at
      END,

      resolved_at = CASE
        WHEN $2 IN ('resolved', 'rejected')
          THEN NOW()
        ELSE NULL
      END,

      updated_at = NOW()

    WHERE report_id = $1

    RETURNING *
  `;

  const result = await pool.query(query, [
    reportId,
    reportStatus,
    reviewedBy,
  ]);

  return result.rows[0] || null;
}

/**
 * Count unresolved reports against one user.
 */
export async function countActiveReportsAgainstUser(
  reportedUserId
) {
  const query = `
    SELECT COUNT(*)::INTEGER AS active_report_count
    FROM reports
    WHERE reported_user_id = $1
      AND report_status IN ('pending', 'reviewing')
  `;

  const result = await pool.query(query, [reportedUserId]);
  return result.rows[0].active_report_count;
}

/**
 * Count reports for a specific target.
 */
export async function countReportsForTarget({
  targetType,
  targetId,
}) {
  const query = `
    SELECT COUNT(*)::INTEGER AS report_count
    FROM reports
    WHERE target_type = $1
      AND target_id = $2
      AND report_status IN ('pending', 'reviewing', 'resolved')
  `;

  const result = await pool.query(query, [
    targetType,
    targetId,
  ]);

  return result.rows[0].report_count;
}

/**
 * Delete a report permanently.
 *
 * This should normally only be used for cleanup or test data.
 */
export async function deleteReport(
  reportId,
  client = pool
) {
  const query = `
    DELETE FROM reports
    WHERE report_id = $1
    RETURNING *
  `;

  const result = await client.query(query, [reportId]);
  return result.rows[0] || null;
}