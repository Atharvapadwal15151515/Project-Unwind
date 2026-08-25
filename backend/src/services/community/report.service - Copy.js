import {
  createReport,
  findReportById,
  findReportByIdForUpdate,
  findDuplicateReport,
  findReports,
  countReports,
  findReportsByReporter,
  findReportsAgainstUser,
  findReportsForTarget,
  markReportAsReviewing,
  resolveReport,
  rejectReport,
  updateReportModerationNotes,
  updateReportStatus,
  countActiveReportsAgainstUser,
  countReportsForTarget,
  deleteReport,
} from "../../models/community/report.model.js";

const ALLOWED_TARGET_TYPES = new Set([
  "post",
  "comment",
  "chat_message",
  "private_room",
  "direct_message",
  "user",
]);

const ALLOWED_REPORT_STATUSES = new Set([
  "pending",
  "reviewing",
  "resolved",
  "rejected",
]);

const ALLOWED_ACTIONS = new Set([
  "no_action",
  "content_removed",
  "user_warned",
  "user_suspended",
  "user_banned",
  "room_closed",
  "message_removed",
  "post_removed",
  "comment_removed",
]);

const ALLOWED_REASONS = new Set([
  "harassment",
  "hate_speech",
  "spam",
  "sexual_content",
  "violence",
  "self_harm",
  "misinformation",
  "privacy_violation",
  "impersonation",
  "scam",
  "inappropriate_content",
  "other",
]);

const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_MODERATION_NOTES_LENGTH = 3000;

function createServiceError(
  message,
  statusCode = 400,
  code = "REPORT_ERROR"
) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;

  return error;
}

function normalizeRequiredString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw createServiceError(
      `${fieldName} is required.`,
      400,
      `${fieldName.toUpperCase().replaceAll(" ", "_")}_REQUIRED`
    );
  }

  return value.trim();
}

function normalizeOptionalString(
  value,
  maximumLength,
  fieldName
) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw createServiceError(
      `${fieldName} must be text.`,
      400,
      `INVALID_${fieldName.toUpperCase().replaceAll(" ", "_")}`
    );
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > maximumLength) {
    throw createServiceError(
      `${fieldName} cannot exceed ${maximumLength} characters.`,
      400,
      `${fieldName.toUpperCase().replaceAll(" ", "_")}_TOO_LONG`
    );
  }

  return normalizedValue;
}

function validateTargetType(targetType) {
  const normalizedTargetType = normalizeRequiredString(
    targetType,
    "Target type"
  ).toLowerCase();

  if (!ALLOWED_TARGET_TYPES.has(normalizedTargetType)) {
    throw createServiceError(
      "Invalid report target type.",
      400,
      "INVALID_TARGET_TYPE"
    );
  }

  return normalizedTargetType;
}

function validateReason(reason) {
  const normalizedReason = normalizeRequiredString(
    reason,
    "Reason"
  )
    .toLowerCase()
    .replaceAll(" ", "_");

  if (!ALLOWED_REASONS.has(normalizedReason)) {
    throw createServiceError(
      "Invalid report reason.",
      400,
      "INVALID_REPORT_REASON"
    );
  }

  return normalizedReason;
}

function validateReportStatus(reportStatus) {
  const normalizedStatus = normalizeRequiredString(
    reportStatus,
    "Report status"
  ).toLowerCase();

  if (!ALLOWED_REPORT_STATUSES.has(normalizedStatus)) {
    throw createServiceError(
      "Invalid report status.",
      400,
      "INVALID_REPORT_STATUS"
    );
  }

  return normalizedStatus;
}

function validateModerationAction(actionTaken) {
  if (actionTaken === undefined || actionTaken === null) {
    return null;
  }

  const normalizedAction = normalizeRequiredString(
    actionTaken,
    "Action taken"
  ).toLowerCase();

  if (!ALLOWED_ACTIONS.has(normalizedAction)) {
    throw createServiceError(
      "Invalid moderation action.",
      400,
      "INVALID_MODERATION_ACTION"
    );
  }

  return normalizedAction;
}

async function requireReport(reportId) {
  const report = await findReportById(reportId);

  if (!report) {
    throw createServiceError(
      "Report not found.",
      404,
      "REPORT_NOT_FOUND"
    );
  }

  return report;
}

/**
 * Submit a report.
 */
export async function submitReport({
  reporterUserId,
  targetType,
  targetId,
  reportedUserId = null,
  reason,
  description = null,
}) {
  if (!reporterUserId) {
    throw createServiceError(
      "Reporter user ID is required.",
      400,
      "REPORTER_USER_ID_REQUIRED"
    );
  }

  if (!targetId) {
    throw createServiceError(
      "Target ID is required.",
      400,
      "TARGET_ID_REQUIRED"
    );
  }

  const normalizedTargetType =
    validateTargetType(targetType);

  const normalizedReason = validateReason(reason);

  const normalizedDescription = normalizeOptionalString(
    description,
    MAX_DESCRIPTION_LENGTH,
    "Description"
  );

  if (
    normalizedTargetType === "user" &&
    String(targetId) === String(reporterUserId)
  ) {
    throw createServiceError(
      "You cannot report your own account.",
      400,
      "SELF_REPORT_NOT_ALLOWED"
    );
  }

  if (
    reportedUserId &&
    String(reportedUserId) === String(reporterUserId)
  ) {
    throw createServiceError(
      "You cannot report yourself.",
      400,
      "SELF_REPORT_NOT_ALLOWED"
    );
  }

  const duplicateReport = await findDuplicateReport({
    reporterUserId,
    targetType: normalizedTargetType,
    targetId,
  });

  if (duplicateReport) {
    throw createServiceError(
      "You have already submitted an active report for this item.",
      409,
      "DUPLICATE_REPORT"
    );
  }

  const report = await createReport({
    reporterUserId,
    targetType: normalizedTargetType,
    targetId,
    reportedUserId,
    reason: normalizedReason,
    description: normalizedDescription,
  });

  if (!report) {
    throw createServiceError(
      "Unable to submit report.",
      500,
      "REPORT_CREATION_FAILED"
    );
  }

  return report;
}

/**
 * Get a report submitted by the current user.
 */
export async function getMyReport({
  reportId,
  userId,
}) {
  const report = await requireReport(reportId);

  if (report.reporter_user_id !== userId) {
    throw createServiceError(
      "You cannot view this report.",
      403,
      "REPORT_ACCESS_FORBIDDEN"
    );
  }

  return report;
}

/**
 * Get one report for an administrator or moderator.
 *
 * Role checking should also be performed by middleware.
 */
export async function getReportForModeration(reportId) {
  return requireReport(reportId);
}

/**
 * List reports submitted by the current user.
 */
export async function listMyReports({
  userId,
  limit = 30,
  offset = 0,
}) {
  const normalizedLimit = Math.min(
    Math.max(Number(limit) || 30, 1),
    100
  );

  const normalizedOffset = Math.max(
    Number(offset) || 0,
    0
  );

  return findReportsByReporter({
    reporterUserId: userId,
    limit: normalizedLimit,
    offset: normalizedOffset,
  });
}

/**
 * List reports for the moderation dashboard.
 */
export async function listReportsForModeration({
  status = null,
  targetType = null,
  reportedUserId = null,
  reporterUserId = null,
  limit = 30,
  offset = 0,
}) {
  const normalizedStatus =
    status === null || status === undefined || status === ""
      ? null
      : validateReportStatus(status);

  const normalizedTargetType =
    targetType === null ||
    targetType === undefined ||
    targetType === ""
      ? null
      : validateTargetType(targetType);

  const normalizedLimit = Math.min(
    Math.max(Number(limit) || 30, 1),
    100
  );

  const normalizedOffset = Math.max(
    Number(offset) || 0,
    0
  );

  const [reports, total] = await Promise.all([
    findReports({
      status: normalizedStatus,
      targetType: normalizedTargetType,
      reportedUserId: reportedUserId || null,
      reporterUserId: reporterUserId || null,
      limit: normalizedLimit,
      offset: normalizedOffset,
    }),

    countReports({
      status: normalizedStatus,
      targetType: normalizedTargetType,
      reportedUserId: reportedUserId || null,
      reporterUserId: reporterUserId || null,
    }),
  ]);

  return {
    reports,
    pagination: {
      total,
      limit: normalizedLimit,
      offset: normalizedOffset,
      has_more: normalizedOffset + reports.length < total,
    },
  };
}

/**
 * List reports made against one user.
 */
export async function listReportsAgainstUser({
  reportedUserId,
  status = null,
  limit = 30,
  offset = 0,
}) {
  if (!reportedUserId) {
    throw createServiceError(
      "Reported user ID is required.",
      400,
      "REPORTED_USER_ID_REQUIRED"
    );
  }

  const normalizedStatus =
    status === null || status === undefined || status === ""
      ? null
      : validateReportStatus(status);

  const normalizedLimit = Math.min(
    Math.max(Number(limit) || 30, 1),
    100
  );

  const normalizedOffset = Math.max(
    Number(offset) || 0,
    0
  );

  return findReportsAgainstUser({
    reportedUserId,
    status: normalizedStatus,
    limit: normalizedLimit,
    offset: normalizedOffset,
  });
}

/**
 * List all reports for a specific post, comment, message,
 * room or user.
 */
export async function listReportsForTarget({
  targetType,
  targetId,
}) {
  if (!targetId) {
    throw createServiceError(
      "Target ID is required.",
      400,
      "TARGET_ID_REQUIRED"
    );
  }

  return findReportsForTarget({
    targetType: validateTargetType(targetType),
    targetId,
  });
}

/**
 * Claim a pending report for review.
 */
export async function beginReportReview({
  reportId,
  moderatorUserId,
}) {
  if (!moderatorUserId) {
    throw createServiceError(
      "Moderator user ID is required.",
      400,
      "MODERATOR_USER_ID_REQUIRED"
    );
  }

  const report = await requireReport(reportId);

  if (report.report_status === "resolved") {
    throw createServiceError(
      "This report has already been resolved.",
      409,
      "REPORT_ALREADY_RESOLVED"
    );
  }

  if (report.report_status === "rejected") {
    throw createServiceError(
      "This report has already been rejected.",
      409,
      "REPORT_ALREADY_REJECTED"
    );
  }

  if (report.report_status === "reviewing") {
    return report;
  }

  const updatedReport = await markReportAsReviewing({
    reportId,
    reviewedBy: moderatorUserId,
  });

  if (!updatedReport) {
    throw createServiceError(
      "The report could not be moved into review.",
      409,
      "REPORT_REVIEW_CONFLICT"
    );
  }

  return findReportById(reportId);
}

/**
 * Resolve a report and record the moderation action.
 */
export async function resolveReportedContent({
  reportId,
  moderatorUserId,
  moderationNotes = null,
  actionTaken,
}) {
  const normalizedNotes = normalizeOptionalString(
    moderationNotes,
    MAX_MODERATION_NOTES_LENGTH,
    "Moderation notes"
  );

  const normalizedAction =
    validateModerationAction(actionTaken);

  if (!normalizedAction) {
    throw createServiceError(
      "A moderation action is required.",
      400,
      "MODERATION_ACTION_REQUIRED"
    );
  }

  const report = await requireReport(reportId);

  if (report.report_status === "resolved") {
    throw createServiceError(
      "This report has already been resolved.",
      409,
      "REPORT_ALREADY_RESOLVED"
    );
  }

  if (report.report_status === "rejected") {
    throw createServiceError(
      "A rejected report cannot be resolved directly.",
      409,
      "REPORT_ALREADY_REJECTED"
    );
  }

  const updatedReport = await resolveReport({
    reportId,
    reviewedBy: moderatorUserId,
    moderationNotes: normalizedNotes,
    actionTaken: normalizedAction,
  });

  return updatedReport;
}

/**
 * Reject a report because no policy violation was found.
 */
export async function rejectReportedContent({
  reportId,
  moderatorUserId,
  moderationNotes = null,
}) {
  const normalizedNotes = normalizeOptionalString(
    moderationNotes,
    MAX_MODERATION_NOTES_LENGTH,
    "Moderation notes"
  );

  const report = await requireReport(reportId);

  if (report.report_status === "resolved") {
    throw createServiceError(
      "A resolved report cannot be rejected.",
      409,
      "REPORT_ALREADY_RESOLVED"
    );
  }

  if (report.report_status === "rejected") {
    throw createServiceError(
      "This report has already been rejected.",
      409,
      "REPORT_ALREADY_REJECTED"
    );
  }

  return rejectReport({
    reportId,
    reviewedBy: moderatorUserId,
    moderationNotes: normalizedNotes,
  });
}

/**
 * Update moderation notes.
 */
export async function changeReportModerationNotes({
  reportId,
  moderatorUserId,
  moderationNotes,
}) {
  await requireReport(reportId);

  const normalizedNotes = normalizeOptionalString(
    moderationNotes,
    MAX_MODERATION_NOTES_LENGTH,
    "Moderation notes"
  );

  return updateReportModerationNotes({
    reportId,
    moderationNotes: normalizedNotes,
    reviewedBy: moderatorUserId,
  });
}

/**
 * Manually change report status.
 */
export async function changeReportStatus({
  reportId,
  moderatorUserId,
  reportStatus,
}) {
  await requireReport(reportId);

  const normalizedStatus =
    validateReportStatus(reportStatus);

  return updateReportStatus({
    reportId,
    reportStatus: normalizedStatus,
    reviewedBy: moderatorUserId,
  });
}

/**
 * Return moderation statistics for one reported user.
 */
export async function getReportedUserStatistics(
  reportedUserId
) {
  if (!reportedUserId) {
    throw createServiceError(
      "Reported user ID is required.",
      400,
      "REPORTED_USER_ID_REQUIRED"
    );
  }

  const [activeReportCount, reports] =
    await Promise.all([
      countActiveReportsAgainstUser(reportedUserId),

      findReportsAgainstUser({
        reportedUserId,
        status: null,
        limit: 100,
        offset: 0,
      }),
    ]);

  const statusCounts = reports.reduce(
    (counts, report) => {
      const status = report.report_status;

      counts[status] = (counts[status] || 0) + 1;

      return counts;
    },
    {
      pending: 0,
      reviewing: 0,
      resolved: 0,
      rejected: 0,
    }
  );

  return {
    reported_user_id: reportedUserId,
    active_report_count: activeReportCount,
    total_report_count: reports.length,
    status_counts: statusCounts,
  };
}

/**
 * Return report count for one target.
 */
export async function getTargetReportCount({
  targetType,
  targetId,
}) {
  if (!targetId) {
    throw createServiceError(
      "Target ID is required.",
      400,
      "TARGET_ID_REQUIRED"
    );
  }

  const reportCount = await countReportsForTarget({
    targetType: validateTargetType(targetType),
    targetId,
  });

  return {
    target_type: targetType,
    target_id: targetId,
    report_count: reportCount,
  };
}

/**
 * Permanently remove a report.
 *
 * Use this only for administrator cleanup or test data.
 */
export async function permanentlyDeleteReport({
  reportId,
}) {
  const report = await requireReport(reportId);

  const deletedReport = await deleteReport(reportId);

  return deletedReport || report;
}