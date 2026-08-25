import pool from "../../config/database.js";

export async function createResult({
  assessmentId,
  depressionRawScore,
  anxietyRawScore,
  stressRawScore,
  depressionScore,
  anxietyScore,
  stressScore,
  depressionLevel,
  anxietyLevel,
  stressLevel,
  scoringVersion = "1.0"
}) {
  const query = `
    INSERT INTO dass_results (
      assessment_id,
      depression_raw_score,
      anxiety_raw_score,
      stress_raw_score,
      depression_score,
      anxiety_score,
      stress_score,
      depression_level,
      anxiety_level,
      stress_level,
      scoring_version
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11
    )
    RETURNING *;
  `;

  const values = [
    assessmentId,
    depressionRawScore,
    anxietyRawScore,
    stressRawScore,
    depressionScore,
    anxietyScore,
    stressScore,
    depressionLevel,
    anxietyLevel,
    stressLevel,
    scoringVersion
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
}

export async function getResultByAssessmentId(assessmentId) {
  const query = `
    SELECT *
    FROM dass_results
    WHERE assessment_id = $1
    LIMIT 1;
  `;

  const result = await pool.query(query, [assessmentId]);

  return result.rows[0] || null;
}

export async function updateResult(
  assessmentId,
  {
    depressionRawScore,
    anxietyRawScore,
    stressRawScore,
    depressionScore,
    anxietyScore,
    stressScore,
    depressionLevel,
    anxietyLevel,
    stressLevel,
    scoringVersion = "1.0"
  }
) {
  const query = `
    UPDATE dass_results
    SET
      depression_raw_score = $2,
      anxiety_raw_score = $3,
      stress_raw_score = $4,
      depression_score = $5,
      anxiety_score = $6,
      stress_score = $7,
      depression_level = $8,
      anxiety_level = $9,
      stress_level = $10,
      scoring_version = $11,
      updated_at = NOW()
    WHERE assessment_id = $1
    RETURNING *;
  `;

  const values = [
    assessmentId,
    depressionRawScore,
    anxietyRawScore,
    stressRawScore,
    depressionScore,
    anxietyScore,
    stressScore,
    depressionLevel,
    anxietyLevel,
    stressLevel,
    scoringVersion
  ];

  const result = await pool.query(query, values);

  return result.rows[0] || null;
}

export async function deleteResult(assessmentId) {
  const query = `
    DELETE FROM dass_results
    WHERE assessment_id = $1;
  `;

  await pool.query(query, [assessmentId]);
}