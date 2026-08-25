import {
  getAssessmentById,
  getAssessmentHistory,
} from "../../models/dass/dassAssessment.model.js";

import {
  getResponsesByAssessmentId,
} from "../../models/dass/dassResponse.model.js";

import {
  getResultByAssessmentId,
} from "../../models/dass/dassResult.model.js";

import {
  getReportByAssessmentId,
} from "../../models/dass/dassReport.model.js";

export async function getUserDassHistory(userId) {
  const assessments = await getAssessmentHistory(userId);

  const history = await Promise.all(
    assessments.map(async (assessment) => {
      const result = await getResultByAssessmentId(
        assessment.assessment_id
      );

      const report = await getReportByAssessmentId(
        assessment.assessment_id
      );

      return {
        assessment,
        result,
        report,
      };
    })
  );

  return history;
}

export async function getDassHistoryDetails(
  userId,
  assessmentId
) {
  const assessment = await getAssessmentById(assessmentId);

  if (!assessment) {
    const error = new Error("Assessment not found");
    error.statusCode = 404;
    throw error;
  }

  if (assessment.user_id !== userId) {
    const error = new Error(
      "You are not allowed to view this assessment"
    );
    error.statusCode = 403;
    throw error;
  }

  const responses = await getResponsesByAssessmentId(
    assessmentId
  );

  const result = await getResultByAssessmentId(
    assessmentId
  );

  const report = await getReportByAssessmentId(
    assessmentId
  );

  return {
    assessment,
    responses,
    result,
    report,
  };
}