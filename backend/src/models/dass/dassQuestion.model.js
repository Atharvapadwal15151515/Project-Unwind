import pool from "../../config/database.js";

export async function getAllActiveQuestions() {
  const query = `
    SELECT
      question_id,
      question_number,
      question_text,
      category
    FROM dass_questions
    WHERE is_active = TRUE
    ORDER BY question_number ASC;
  `;

  const { rows } = await pool.query(query);

  return rows;
}

export async function getQuestionById(questionId) {
  const query = `
    SELECT
      question_id,
      question_number,
      question_text,
      category
    FROM dass_questions
    WHERE question_id = $1
      AND is_active = TRUE
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [questionId]);

  return rows[0] || null;
}

export async function getQuestionByNumber(questionNumber) {
  const query = `
    SELECT
      question_id,
      question_number,
      question_text,
      category
    FROM dass_questions
    WHERE question_number = $1
      AND is_active = TRUE
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [questionNumber]);

  return rows[0] || null;
}

export async function getTotalActiveQuestions() {
  const query = `
    SELECT COUNT(*)::INT AS total
    FROM dass_questions
    WHERE is_active = TRUE;
  `;

  const { rows } = await pool.query(query);

  return rows[0].total;
}