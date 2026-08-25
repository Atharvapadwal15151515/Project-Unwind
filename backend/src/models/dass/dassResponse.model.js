import pool from "../../config/database.js";

export async function saveResponse(
  assessmentId,
  questionId,
  answerValue
) {
  const query = `
    INSERT INTO dass_responses (
      assessment_id,
      question_id,
      answer_value
    )
    VALUES (
      $1,
      $2,
      $3
    )
    ON CONFLICT (assessment_id, question_id)
    DO UPDATE SET
      answer_value = EXCLUDED.answer_value,
      updated_at = NOW()
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    assessmentId,
    questionId,
    answerValue,
  ]);

  return rows[0];
}

export async function getResponseByQuestion(
  assessmentId,
  questionId
) {
  const query = `
    SELECT *
    FROM dass_responses
    WHERE assessment_id = $1
      AND question_id = $2
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [
    assessmentId,
    questionId,
  ]);

  return rows[0] || null;
}

export async function getResponsesByAssessmentId(
  assessmentId
) {
  const query = `
    SELECT
      dr.response_id,
      dr.question_id,
      dq.question_number,
      dq.question_text,
      dq.category,
      dr.answer_value
    FROM dass_responses dr
    JOIN dass_questions dq
      ON dr.question_id = dq.question_id
    WHERE dr.assessment_id = $1
    ORDER BY dq.question_number ASC;
  `;

  const { rows } = await pool.query(query, [assessmentId]);

  return rows;
}

export async function getResponseCount(
  assessmentId
) {
  const query = `
    SELECT COUNT(*)::INT AS total
    FROM dass_responses
    WHERE assessment_id = $1;
  `;

  const { rows } = await pool.query(query, [assessmentId]);

  return rows[0].total;
}

export async function deleteResponses(
  assessmentId
) {
  const query = `
    DELETE FROM dass_responses
    WHERE assessment_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [assessmentId]);

  return rows;
}