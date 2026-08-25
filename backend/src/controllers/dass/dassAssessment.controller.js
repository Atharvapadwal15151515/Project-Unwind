import {
  getQuestions,
  startAssessment,
  saveAssessmentResponse,
  submitAssessment,
  exitAssessment
} from "../../services/dass/dassAssessment.service.js";

/**
 * GET /api/dass/questions
 */
export async function getDassQuestions(
  req,
  res,
  next
) {
  try {
    const questions =
      await getQuestions();

    return res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/dass/assessments
 */
export async function startDassAssessment(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const assessment =
      await startAssessment(userId);

    return res.status(201).json({
      success: true,
      message:
        "Assessment started successfully",
      data: assessment
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/dass/assessments/:assessmentId/responses
 */
export async function saveDassResponse(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      assessmentId
    } = req.params;

    const {
      questionId,
      answerValue
    } = req.body;

    const result =
      await saveAssessmentResponse(
        userId,
        assessmentId,
        questionId,
        answerValue
      );

    return res.status(200).json({
      success: true,
      message:
        "Response saved successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/dass/assessments/:assessmentId/submit
 */
export async function submitDassAssessment(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      assessmentId
    } = req.params;

    const result =
      await submitAssessment(
        userId,
        assessmentId
      );

    return res.status(200).json({
      success: true,
      message:
        "Assessment submitted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/dass/assessments/:assessmentId/abandon
 */
export async function abandonDassAssessment(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.user_id;

    const {
      assessmentId
    } = req.params;

    const assessment =
      await exitAssessment(
        userId,
        assessmentId
      );

    return res.status(200).json({
      success: true,
      message:
        "Assessment abandoned successfully",
      data: assessment
    });
  } catch (error) {
    next(error);
  }
}