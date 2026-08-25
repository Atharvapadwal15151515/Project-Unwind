import {
  getAllActiveQuestions
} from "../../models/dass/dassQuestion.model.js";

import {
  createAssessment,
  getAssessmentById,
  getActiveAssessmentByUserId,
  updateCurrentQuestion,
  completeAssessment,
  abandonAssessment
} from "../../models/dass/dassAssessment.model.js";

import {
  saveResponse,
  getResponsesByAssessmentId,
  getResponseCount
} from "../../models/dass/dassResponse.model.js";

import {
  createResult,
  getResultByAssessmentId
} from "../../models/dass/dassResult.model.js";

import {
  createReport
} from "../../models/dass/dassReport.model.js";

import {
  verifyActiveConsent
} from "./dassConsent.service.js";

import {
  calculateDassScores
} from "./dassScoring.service.js";

import {
  generateDassInterpretation
} from "../../utils/dass/dassInterpretation.js";

/*
  Get all active DASS-21 questions
*/
export async function getQuestions() {
  return getAllActiveQuestions();
}

/*
  Start a new DASS-21 assessment
*/
export async function startAssessment(userId) {
  await verifyActiveConsent(userId);

  const activeAssessment =
    await getActiveAssessmentByUserId(
      userId
    );

  if (activeAssessment) {
    return activeAssessment;
  }

  return createAssessment(userId);
}

/*
  Save or update one response
*/
export async function saveAssessmentResponse(
  userId,
  assessmentId,
  questionId,
  answerValue
) {
  const assessment =
    await getAssessmentById(
      assessmentId
    );

  if (!assessment) {
    const error = new Error(
      "Assessment not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (assessment.user_id !== userId) {
    const error = new Error(
      "You are not authorized to access this assessment"
    );

    error.statusCode = 403;
    throw error;
  }

  if (
    assessment.status !==
    "in_progress"
  ) {
    const error = new Error(
      "This assessment is no longer active"
    );

    error.statusCode = 400;
    throw error;
  }

  await saveResponse(
    assessmentId,
    questionId,
    answerValue
  );

  /*
    Question 21 must not advance to 22 because
    the database constraint only allows 1–21.
  */
  const nextQuestion = Math.min(
    Number(questionId) + 1,
    21
  );

  await updateCurrentQuestion(
    assessmentId,
    nextQuestion
  );

  return {
    assessmentId,
    questionId,
    answerValue,
    currentQuestion:
      nextQuestion
  };
}

/*
  Submit and calculate the completed assessment
*/
export async function submitAssessment(
  userId,
  assessmentId
) {
  const assessment =
    await getAssessmentById(
      assessmentId
    );

  if (!assessment) {
    const error = new Error(
      "Assessment not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (assessment.user_id !== userId) {
    const error = new Error(
      "You are not authorized to submit this assessment"
    );

    error.statusCode = 403;
    throw error;
  }

  if (
    assessment.status ===
    "completed"
  ) {
    const existingResult =
      await getResultByAssessmentId(
        assessmentId
      );

    if (existingResult) {
      return {
        result: existingResult,
        message:
          "Assessment was already completed"
      };
    }

    const error = new Error(
      "Assessment has already been completed"
    );

    error.statusCode = 400;
    throw error;
  }

  if (
    assessment.status !==
    "in_progress"
  ) {
    const error = new Error(
      "Only an active assessment can be submitted"
    );

    error.statusCode = 400;
    throw error;
  }

  const responseCount =
    await getResponseCount(
      assessmentId
    );

  /*
    This supports either:
    - getResponseCount returning a number
    - getResponseCount returning a database row
  */
  const totalResponses =
    typeof responseCount === "number"
      ? responseCount
      : Number(
          responseCount?.count ??
          responseCount?.response_count ??
          responseCount?.total ??
          0
        );

  if (totalResponses !== 21) {
    const error = new Error(
      `All 21 questions must be answered before submission. Currently answered: ${totalResponses}`
    );

    error.statusCode = 400;
    throw error;
  }

  const responses =
    await getResponsesByAssessmentId(
      assessmentId
    );

  const {
    rawScores,
    scores,
    severities
  } = calculateDassScores(
    responses
  );

  const existingResult =
    await getResultByAssessmentId(
      assessmentId
    );

  if (existingResult) {
    const error = new Error(
      "A result already exists for this assessment"
    );

    error.statusCode = 409;
    throw error;
  }

  const result =
    await createResult({
      assessmentId,

      depressionRawScore:
        rawScores.depression,

      anxietyRawScore:
        rawScores.anxiety,

      stressRawScore:
        rawScores.stress,

      depressionScore:
        scores.depression,

      anxietyScore:
        scores.anxiety,

      stressScore:
        scores.stress,

      depressionLevel:
        severities.depression,

      anxietyLevel:
        severities.anxiety,

      stressLevel:
        severities.stress,

      scoringVersion: "1.0"
    });

  const interpretation =
    generateDassInterpretation({
      depressionSeverity:
        severities.depression,

      anxietySeverity:
        severities.anxiety,

      stressSeverity:
        severities.stress
    });

  await createReport({
  assessmentId,
  resultId: result.result_id,
  interpretation: JSON.stringify(
    interpretation
  )
});
  

  await completeAssessment(
    assessmentId
  );

  return {
    result,
    interpretation
  };
}

/*
  Abandon an active assessment
*/
export async function exitAssessment(
  userId,
  assessmentId
) {
  const assessment =
    await getAssessmentById(
      assessmentId
    );

  if (!assessment) {
    const error = new Error(
      "Assessment not found"
    );

    error.statusCode = 404;
    throw error;
  }

  if (assessment.user_id !== userId) {
    const error = new Error(
      "You are not authorized to abandon this assessment"
    );

    error.statusCode = 403;
    throw error;
  }

  if (
    assessment.status !==
    "in_progress"
  ) {
    const error = new Error(
      "Only an active assessment can be abandoned"
    );

    error.statusCode = 400;
    throw error;
  }

  return abandonAssessment(
    assessmentId
  );
}