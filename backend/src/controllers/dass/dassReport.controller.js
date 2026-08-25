import {
  getDassReport,
  downloadDassReportPdf,
} from "../../services/dass/dassReport.service.js";

export async function getDassReportDetails(req, res, next) {
  try {
    const { assessmentId } = req.params;

    const report = await getDassReport(
      req.user.user_id,
      assessmentId
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadDassPdf(req, res, next) {
  try {
    const { assessmentId } = req.params;

    const pdfBuffer = await downloadDassReportPdf(
      req.user.user_id,
      assessmentId
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="dass-report-${assessmentId}.pdf"`
    );

    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}