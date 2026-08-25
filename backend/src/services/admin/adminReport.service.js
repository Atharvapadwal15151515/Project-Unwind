import pool
  from "../../config/database.js";

import {
  sendAdminUserNotification
} from "./adminNotification.service.js";

export async function getAdminReports({
  status,
  priority,
  targetType,
  limit = 50,
  offset = 0
}) {
  const conditions = [];
  const values = [];

  let index = 1;

  if (status) {
    conditions.push(
      `r.report_status = $${index}`
    );

    values.push(status);
    index++;
  }

  if (priority) {
    conditions.push(
      `r.priority = $${index}`
    );

    values.push(priority);
    index++;
  }

  if (targetType) {
    conditions.push(
      `r.target_type = $${index}`
    );

    values.push(targetType);
    index++;
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  values.push(limit);
  const limitIndex = index;
  index++;

  values.push(offset);
  const offsetIndex = index;

  const result = await pool.query(
    `
      SELECT
        r.report_id,
        r.reporter_user_id,
        r.reported_user_id,

        r.target_type,
        r.target_id,

        r.reason,
        r.description,

        r.report_status,
        r.priority,

        r.moderation_notes,
        r.action_taken,

        r.reviewed_by,
        r.reviewed_at,
        r.resolved_at,

        r.created_at,
        r.updated_at,

        reporter.username
          AS reporter_username,

        reported.username
          AS reported_username,

        reviewer.username
          AS reviewer_username

      FROM reports r

      LEFT JOIN users reporter
        ON reporter.user_id =
           r.reporter_user_id

      LEFT JOIN users reported
        ON reported.user_id =
           r.reported_user_id

      LEFT JOIN users reviewer
        ON reviewer.user_id =
           r.reviewed_by

      ${whereClause}

      ORDER BY
        CASE r.priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,

        r.created_at DESC

      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `,
    values
  );

  return result.rows;
}

async function getReportedTarget({
  targetType,
  targetId
}) {
  if (!targetType || !targetId) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Community Post
  |--------------------------------------------------------------------------
  */

 if (targetType === "post") {
  const result =
    await pool.query(
      `
        SELECT
          cp.post_id
            AS target_id,

          cp.author_user_id,

          cp.author_visible_name,

          cp.caption
            AS content,

          cp.post_type,

          cp.created_at,

          cp.is_deleted,

          COALESCE(
            json_agg(
              json_build_object(
                'media_id',
                  pm.media_id,

                'media_type',
                  pm.media_type,

                'media_url',
                  pm.media_url,

                'thumbnail_url',
                  pm.thumbnail_url,

                'width',
                  pm.width,

                'height',
                  pm.height,

                'duration_seconds',
                  pm.duration_seconds,

                'display_order',
                  pm.display_order
              )
              ORDER BY
                pm.display_order
            )
            FILTER (
              WHERE pm.media_id
              IS NOT NULL
            ),
            '[]'::json
          ) AS media

        FROM community_posts cp

        LEFT JOIN post_media pm
          ON pm.post_id =
            cp.post_id

        WHERE cp.post_id = $1

        GROUP BY
          cp.post_id

        LIMIT 1
      `,
      [targetId]
    );

  return result.rows[0] || null;
}


  /*
  |--------------------------------------------------------------------------
  | Post Comment
  |--------------------------------------------------------------------------
  */

  if (targetType === "comment") {
    const result =
      await pool.query(
        `
          SELECT
            pc.comment_id
              AS target_id,

            pc.author_user_id,

            pc.author_visible_name,

            pc.comment_text
              AS content,

            pc.created_at,

            pc.is_deleted

          FROM post_comments pc

          WHERE pc.comment_id = $1

          LIMIT 1
        `,
        [targetId]
      );

    return result.rows[0] || null;
  }


  /*
  |--------------------------------------------------------------------------
  | Public Chat Message
  |--------------------------------------------------------------------------
  */

  if (targetType === "chat_message") {
    const result =
      await pool.query(
        `
          SELECT
            cm.chat_message_id
              AS target_id,

            cm.sender_user_id
              AS author_user_id,

            cm.sender_visible_name
              AS author_visible_name,

            cm.message_text
              AS content,

            cm.message_type,

            cm.created_at,

            cm.is_deleted

          FROM chat_messages cm

          WHERE cm.chat_message_id = $1

          LIMIT 1
        `,
        [targetId]
      );

    return result.rows[0] || null;
  }


  /*
  |--------------------------------------------------------------------------
  | User
  |--------------------------------------------------------------------------
  */

  if (targetType === "user") {
    const result =
      await pool.query(
        `
          SELECT
            u.user_id
              AS target_id,

            u.user_id
              AS author_user_id,

            u.username
              AS author_visible_name,

            u.username,

            u.email,

            u.role,

            u.account_status,

            u.email_verified,

            u.created_at

          FROM users u

          WHERE u.user_id = $1

          LIMIT 1
        `,
        [targetId]
      );

    return result.rows[0] || null;
  }


  return null;
}

export async function getAdminReportById(
  reportId
) {
  const result =
    await pool.query(
      `
        SELECT
          r.*,

          reporter.username
            AS reporter_username,

          reporter.email
            AS reporter_email,

          reported.username
            AS reported_username,

          reported.email
            AS reported_email,

          reported.account_status
            AS reported_account_status,

          reviewer.username
            AS reviewer_username

        FROM reports r

        LEFT JOIN users reporter
          ON reporter.user_id =
             r.reporter_user_id

        LEFT JOIN users reported
          ON reported.user_id =
             r.reported_user_id

        LEFT JOIN users reviewer
          ON reviewer.user_id =
             r.reviewed_by

        WHERE r.report_id = $1

        LIMIT 1
      `,
      [reportId]
    );


  const report =
    result.rows[0];

  if (!report) {
    return null;
  }


  /*
  |--------------------------------------------------------------------------
  | Load Actual Reported Content
  |--------------------------------------------------------------------------
  */

  const reportedTarget =
    await getReportedTarget({
      targetType:
        report.target_type,

      targetId:
        report.target_id
    });


  return {
    ...report,

    reported_target:
      reportedTarget
  };
}


export async function markReportUnderReview({
  reportId,
  adminId,
  moderationNotes
}) {
  const result = await pool.query(
    `
      UPDATE reports

      SET
        report_status = 'under_review',

        reviewed_by = $2,

        reviewed_at =
          COALESCE(
            reviewed_at,
            NOW()
          ),

        moderation_notes =
          COALESCE(
            $3,
            moderation_notes
          ),

        updated_at = NOW()

      WHERE report_id = $1

      RETURNING *
    `,
    [
      reportId,
      adminId,
      moderationNotes || null
    ]
  );

  return result.rows[0] || null;
}


export async function resolveReport({
  reportId,
  adminId,
  actionTaken,
  moderationNotes
}) {
  /*
  |--------------------------------------------------------------------------
  | Get Report Before Resolution
  |--------------------------------------------------------------------------
  |
  | We need both users so that the final moderation outcome can be
  | communicated transparently after the report is resolved.
  |
  */

  const existingReport =
    await getAdminReportById(
      reportId
    );

  if (!existingReport) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Prevent Re-resolution
  |--------------------------------------------------------------------------
  */

  if (
    existingReport.report_status ===
    "resolved"
  ) {
    const error =
      new Error(
        "REPORT_ALREADY_RESOLVED"
      );

    error.statusCode = 409;

    throw error;
  }

  const result =
    await pool.query(
      `
        UPDATE reports

        SET
          report_status = 'resolved',

          reviewed_by = $2,

          reviewed_at =
            COALESCE(
              reviewed_at,
              NOW()
            ),

          resolved_at = NOW(),

          action_taken = $3,

          moderation_notes = $4,

          updated_at = NOW()

        WHERE report_id = $1
          AND report_status <> 'resolved'

        RETURNING *
      `,
      [
        reportId,
        adminId,
        actionTaken,
        moderationNotes || null
      ]
    );

  const resolvedReport =
    result.rows[0];

  if (!resolvedReport) {
    return null;
  }


  /*
  |--------------------------------------------------------------------------
  | Human-readable Action
  |--------------------------------------------------------------------------
  */

  const actionLabels = {
    no_action:
      "No moderation action was required",

    warning:
      "A warning was issued",

    content_removed:
      "The reported content was removed",

    restriction:
      "Account restrictions were applied",

    temporary_suspension:
      "The account was temporarily suspended",

    permanent_ban:
      "The account was banned"
  };

  const actionLabel =
    actionLabels[actionTaken] ||
    "Appropriate moderation action was taken";


  /*
  |--------------------------------------------------------------------------
  | Notify Reporter
  |--------------------------------------------------------------------------
  */

  if (
    existingReport.reporter_user_id
  ) {
    try {
      await sendAdminUserNotification({
        adminId,

        userId:
          existingReport
            .reporter_user_id,

        title:
          "Report Reviewed",

        message:
          `Your report has been reviewed. ${actionLabel}. Thank you for helping keep the Unwind community safe.`,

        priority:
          "normal",

        iconName:
          "shield-check",

        actionUrl:
          "/notifications",

        referenceType:
          "report",

        referenceId:
          reportId,

        metadata: {
          reportId,
          actionTaken,
          targetType:
            existingReport
              .target_type
        }
      });

    } catch (notificationError) {
      console.error(
        "Failed to notify report submitter:",
        notificationError
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Notify Reported User
  |--------------------------------------------------------------------------
  */

  if (
    existingReport.reported_user_id
  ) {
    try {
      const reportedUserMessage =
        actionTaken === "no_action"
          ? "A report involving your account or content was reviewed. No moderation action was required."
          : `A report involving your account or content was reviewed. ${actionLabel}.`;

      await sendAdminUserNotification({
        adminId,

        userId:
          existingReport
            .reported_user_id,

        title:
          "Moderation Review Completed",

        message:
          reportedUserMessage,

        priority:
          actionTaken === "no_action"
            ? "normal"
            : "high",

        iconName:
          "shield",

        actionUrl:
          "/notifications",

        referenceType:
          "report",

        referenceId:
          reportId,

        metadata: {
          reportId,
          actionTaken,
          targetType:
            existingReport
              .target_type
        }
      });

    } catch (notificationError) {
      console.error(
        "Failed to notify reported user:",
        notificationError
      );
    }
  }


  return resolvedReport;
}