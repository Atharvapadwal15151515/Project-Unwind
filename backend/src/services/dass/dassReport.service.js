import { getAssessmentById } from "../../models/dass/dassAssessment.model.js";
import { getResultByAssessmentId } from "../../models/dass/dassResult.model.js";
import { getReportByAssessmentId } from "../../models/dass/dassReport.model.js";
import { getResponsesByAssessmentId } from "../../models/dass/dassResponse.model.js";

import {
  generateDassPdfBuffer
} from "../../utils/dass/pdf/generateDassPdf.js";
export async function getDassReport(
  userId,
  assessmentId
) {
  const assessment = await getAssessmentById(
    assessmentId
  );

  if (!assessment) {
    const error = new Error("Assessment not found");
    error.statusCode = 404;
    throw error;
  }

  if (assessment.user_id !== userId) {
    const error = new Error(
      "You are not authorized to access this report"
    );
    error.statusCode = 403;
    throw error;
  }

  const result = await getResultByAssessmentId(
    assessmentId
  );

  const report = await getReportByAssessmentId(
    assessmentId
  );

  return {
    assessment,
    result,
    report,
  };
}

export async function downloadDassReportPdf(
  userId,
  assessmentId
) {
  const assessment =
    await getAssessmentById(
      assessmentId
    );

  if (!assessment) {
    const error =
      new Error(
        "Assessment not found"
      );

    error.statusCode = 404;

    throw error;
  }

  if (
    assessment.user_id !==
    userId
  ) {
    const error =
      new Error(
        "You are not authorized to download this report"
      );

    error.statusCode = 403;

    throw error;
  }

  const result =
    await getResultByAssessmentId(
      assessmentId
    );

  if (!result) {
    const error =
      new Error(
        "Assessment result not found"
      );

    error.statusCode = 404;

    throw error;
  }

  const report =
    await getReportByAssessmentId(
      assessmentId
    );

  const responses =
    await getResponsesByAssessmentId(
      assessmentId
    );

  const pdfBuffer =
    await generateDassPdfBuffer({
      assessment,
      result,

      /*
       * Some older assessments may
       * not have a report row.
       *
       * The PDF can still be generated
       * from assessment + result.
       */
      report:
        report || {},

      responses:
        responses || [],
    });

  return pdfBuffer;
}