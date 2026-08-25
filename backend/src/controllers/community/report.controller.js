import {
  submitReport,
  getMyReport,
  getReportForModeration,
  listMyReports,
  listReportsForModeration,
  listReportsAgainstUser,
  listReportsForTarget,
  beginReportReview,
  resolveReportedContent,
  rejectReportedContent,
  changeReportModerationNotes,
  changeReportStatus,
  getReportedUserStatistics,
  getTargetReportCount,
  permanentlyDeleteReport,
} from "../../services/community/report.service.js";

/**
 * Submit a new report.
 *
 * POST /api/reports
 */
export async function createReportController(req, res, next) {
  try {
    const reporterUserId = req.user.user_id;

    const {
      reportedUserId = null,
      targetType,
      targetId,
      reason,
      description = null,
    } = req.body;

    const report = await submitReport({
      reporterUserId,
      reportedUserId,
      targetType,
      targetId,
      reason,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return one report belonging to the authenticated reporter.
 *
 * GET /api/reports/my/:reportId
 */
export async function getMyReportController(req, res, next) {
  try {
    const reporterUserId = req.user.user_id;
    const { reportId } = req.params;

    const report = await getMyReport({
      reportId,
      reporterUserId,
    });

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return all reports submitted by the authenticated user.
 *
 * GET /api/reports/my
 */
export async function listMyReportsController(req, res, next) {
  try {
    const reporterUserId = req.user.user_id;
    const { status, limit, offset } = req.query;

    const reports = await listMyReports({
      reporterUserId,
      status,
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return one report for moderation.
 *
 * GET /api/admin/reports/:reportId
 */
export async function getReportForModerationController(
  req,
  res,
  next
) {
  try {
    const { reportId } = req.params;

    const report = await getReportForModeration({
      reportId,
    });

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return reports for moderators.
 *
 * GET /api/admin/reports
 */
export async function listReportsForModerationController(
  req,
  res,
  next
) {
  try {
    const {
      status,
      targetType,
      reason,
      reportedUserId,
      limit,
      offset,
    } = req.query;

    const reports = await listReportsForModeration({
      status,
      targetType,
      reason,
      reportedUserId,
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return reports made against one user.
 *
 * GET /api/admin/reports/users/:reportedUserId
 */
export async function listReportsAgainstUserController(
  req,
  res,
  next
) {
  try {
    const { reportedUserId } = req.params;
    const { status, limit, offset } = req.query;

    const reports = await listReportsAgainstUser({
      reportedUserId,
      status,
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return reports for one target.
 *
 * GET /api/admin/reports/targets/:targetType/:targetId
 */
export async function listReportsForTargetController(
  req,
  res,
  next
) {
  try {
    const { targetType, targetId } = req.params;
    const { status, limit, offset } = req.query;

    const reports = await listReportsForTarget({
      targetType,
      targetId,
      status,
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Begin reviewing a report.
 *
 * PATCH /api/admin/reports/:reportId/review
 */
export async function beginReportReviewController(
  req,
  res,
  next
) {
  try {
    const reviewerUserId = req.user.user_id;
    const { reportId } = req.params;

    const report = await beginReportReview({
      reportId,
      reviewerUserId,
    });

    return res.status(200).json({
      success: true,
      message: "Report marked as under review.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resolve a report and record the moderation action.
 *
 * PATCH /api/admin/reports/:reportId/resolve
 */
export async function resolveReportController(req, res, next) {
  try {
    const reviewerUserId = req.user.user_id;
    const { reportId } = req.params;

    const {
      actionTaken,
      moderationNotes = null,
    } = req.body;

    const report = await resolveReportedContent({
      reportId,
      reviewerUserId,
      actionTaken,
      moderationNotes,
    });

    return res.status(200).json({
      success: true,
      message: "Report resolved.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject a report.
 *
 * PATCH /api/admin/reports/:reportId/reject
 */
export async function rejectReportController(req, res, next) {
  try {
    const reviewerUserId = req.user.user_id;
    const { reportId } = req.params;

    const {
      moderationNotes = null,
      actionTaken = "no_action",
    } = req.body;

    const report = await rejectReportedContent({
      reportId,
      reviewerUserId,
      moderationNotes,
      actionTaken,
    });

    return res.status(200).json({
      success: true,
      message: "Report rejected.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update moderation notes.
 *
 * PATCH /api/admin/reports/:reportId/notes
 */
export async function updateReportNotesController(
  req,
  res,
  next
) {
  try {
    const reviewerUserId = req.user.user_id;
    const { reportId } = req.params;
    const { moderationNotes } = req.body;

    const report = await changeReportModerationNotes({
      reportId,
      reviewerUserId,
      moderationNotes,
    });

    return res.status(200).json({
      success: true,
      message: "Moderation notes updated.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change report status.
 *
 * PATCH /api/admin/reports/:reportId/status
 */
export async function updateReportStatusController(
  req,
  res,
  next
) {
  try {
    const reviewerUserId = req.user.user_id;
    const { reportId } = req.params;
    const { reportStatus } = req.body;

    const report = await changeReportStatus({
      reportId,
      reviewerUserId,
      reportStatus,
    });

    return res.status(200).json({
      success: true,
      message: "Report status updated.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return moderation statistics for a reported user.
 *
 * GET /api/admin/reports/users/:reportedUserId/statistics
 */
export async function getReportedUserStatisticsController(
  req,
  res,
  next
) {
  try {
    const { reportedUserId } = req.params;

    const statistics = await getReportedUserStatistics({
      reportedUserId,
    });

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return the number of reports for one target.
 *
 * GET /api/admin/reports/targets/:targetType/:targetId/count
 */
export async function getTargetReportCountController(
  req,
  res,
  next
) {
  try {
    const { targetType, targetId } = req.params;
    const { activeOnly } = req.query;

    const count = await getTargetReportCount({
      targetType,
      targetId,
      activeOnly:
        activeOnly === true ||
        activeOnly === "true",
    });

    return res.status(200).json({
      success: true,
      data: {
        targetType,
        targetId,
        reportCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Permanently delete a report.
 *
 * DELETE /api/admin/reports/:reportId
 */
export async function permanentlyDeleteReportController(
  req,
  res,
  next
) {
  try {
    const { reportId } = req.params;

    const report = await permanentlyDeleteReport({
      reportId,
    });

    return res.status(200).json({
      success: true,
      message: "Report permanently deleted.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
}