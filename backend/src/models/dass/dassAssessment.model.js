import pool from "../../config/database.js";

export async function createAssessment(userId) {
  const query = `
    INSERT INTO dass_assessments (
      user_id,
      status,
      current_question,
      started_at
    )
    VALUES (
      $1,
      'in_progress',
      1,
      NOW()
    )
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0];
}

export async function getAssessmentById(assessmentId) {
  const query = `
    SELECT *
    FROM dass_assessments
    WHERE assessment_id = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [assessmentId]);

  return rows[0] || null;
}

export async function getActiveAssessmentByUserId(userId) {
  const query = `
    SELECT *
    FROM dass_assessments
    WHERE user_id = $1
      AND status = 'in_progress'
    ORDER BY started_at DESC
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows[0] || null;
}

export async function updateCurrentQuestion(
  assessmentId,
  currentQuestion
) {
  const query = `
    UPDATE dass_assessments
    SET
      current_question = $2,
      updated_at = NOW()
    WHERE assessment_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    assessmentId,
    currentQuestion,
  ]);

  return rows[0];
}

export async function completeAssessment(assessmentId) {
  const query = `
    UPDATE dass_assessments
    SET
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE assessment_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [assessmentId]);

  return rows[0];
}

export async function abandonAssessment(assessmentId) {
  const query = `
    UPDATE dass_assessments
    SET
      status = 'abandoned',
      updated_at = NOW()
    WHERE assessment_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [assessmentId]);

  return rows[0];
}

export async function getAssessmentHistory(userId) {
  const query = `
    SELECT *
    FROM dass_assessments
    WHERE user_id = $1
    ORDER BY started_at DESC;
  `;

  const { rows } = await pool.query(query, [userId]);

  return rows;
}