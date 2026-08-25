import pool from "../../config/database.js";

export async function createReport({
  assessmentId,
  resultId,
  interpretation,
  reportStatus = "generated",
  interpretationSource = "rule_based",
  interpretationVersion = "dass_interpretation_v1"
}) {
  const query = `
    INSERT INTO dass_reports (
      assessment_id,
      result_id,
      report_status,
      interpretation_text,
      interpretation_source,
      interpretation_version
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    assessmentId,
    resultId,
    reportStatus,
    interpretation,
    interpretationSource,
    interpretationVersion
  ];

  const result = await pool.query(
    query,
    values
  );

  return result.rows[0];
}

export async function getReportByAssessmentId(assessmentId) {
  const query = `
    SELECT *
    FROM dass_reports
    WHERE assessment_id = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [assessmentId]);

  return rows[0] || null;
}

export async function updateReportStatus(
  assessmentId,
  reportStatus
) {
  const query = `
    UPDATE dass_reports
    SET
      report_status = $2,
      updated_at = NOW()
    WHERE assessment_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    assessmentId,
    reportStatus,
  ]);

  return rows[0];
}

export async function updatePdfDetails(
  assessmentId,
  pdfUrl,
  pdfPublicId
) {
  const query = `
    UPDATE dass_reports
    SET
      pdf_url = $2,
      pdf_public_id = $3,
      updated_at = NOW()
    WHERE assessment_id = $1
    RETURNING *;
  `;

  const result = await pool.query(
    query,
    [
      assessmentId,
      pdfUrl,
      pdfPublicId
    ]
  );

  return result.rows[0] || null;
}
export async function deleteReport(assessmentId) {
  const query = `
    DELETE FROM dass_reports
    WHERE assessment_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [assessmentId]);

  return rows[0] || null;
}