import {
  getAdminReports,
  getAdminReportById,
  markReportUnderReview,
  resolveReport
} from "../../services/admin/adminReport.service.js";


export async function getAdminReportsController(
  req,
  res
) {
  try {
    const {
      status,
      priority,
      targetType
    } = req.query;

    const limit =
      Math.min(
        Number(req.query.limit) || 50,
        100
      );

    const offset =
      Math.max(
        Number(req.query.offset) || 0,
        0
      );

    const reports =
      await getAdminReports({
        status,
        priority,
        targetType,
        limit,
        offset
      });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error(
      "Get admin reports error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load reports"
    });
  }
}


export async function getAdminReportByIdController(
  req,
  res
) {
  try {
    const {
      reportId
    } = req.params;

    const report =
      await getAdminReportById(
        reportId
      );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    return res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    console.error(
      "Get admin report error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load report"
    });
  }
}


export async function markReportUnderReviewController(
  req,
  res
) {
  try {
    const {
      reportId
    } = req.params;

    const {
      moderationNotes
    } = req.body;

    const report =
      await markReportUnderReview({
        reportId,

        adminId:
          req.user.user_id,

        moderationNotes
      });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Report marked under review",

      report
    });
  } catch (error) {
    console.error(
      "Review report error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to review report"
    });
  }
}


export async function resolveReportController(
  req,
  res
) {
  try {
    const {
      reportId
    } = req.params;

    const {
      actionTaken,
      moderationNotes
    } = req.body;

    if (!actionTaken) {
      return res.status(400).json({
        success: false,
        message:
          "Action taken is required"
      });
    }

    const report =
      await resolveReport({
        reportId,

        adminId:
          req.user.user_id,

        actionTaken,
        moderationNotes
      });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Report resolved successfully",

      report
    });
  } catch (error) {
    console.error(
      "Resolve report error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to resolve report"
    });
  }
}