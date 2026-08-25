import pool
  from "../../config/database.js";


export async function getAdminTestimonials({
  status,
  limit = 50,
  offset = 0
}) {
  const conditions = [];
  const values = [];

  let index = 1;

  if (status) {
    conditions.push(
      `t.status = $${index}`
    );

    values.push(status);
    index++;
  }

  const whereClause =
    conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

  values.push(limit);
  const limitIndex = index;
  index++;

  values.push(offset);
  const offsetIndex = index;

  const result =
    await pool.query(
      `
        SELECT
          t.testimonial_id,
          t.display_name,
          t.testimonial_text,
          t.is_anonymous,
          t.rating,
          t.status,
          t.created_at,
          t.updated_at,
          t.approved_at,
          t.rejected_at,
          t.moderation_notes,
          t.reviewed_by,

          reviewer.username
            AS reviewer_username

        FROM testimonials t

        LEFT JOIN users reviewer
          ON reviewer.user_id =
             t.reviewed_by

        ${whereClause}

        ORDER BY
          CASE t.status
            WHEN 'pending' THEN 1
            WHEN 'approved' THEN 2
            WHEN 'rejected' THEN 3
            WHEN 'hidden' THEN 4
            ELSE 5
          END,

          t.created_at DESC

        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      values
    );

  return result.rows;
}


export async function getAdminTestimonialById(
  testimonialId
) {
  const result =
    await pool.query(
      `
        SELECT
          t.*,

          reviewer.username
            AS reviewer_username

        FROM testimonials t

        LEFT JOIN users reviewer
          ON reviewer.user_id =
             t.reviewed_by

        WHERE
          t.testimonial_id = $1

        LIMIT 1
      `,
      [testimonialId]
    );

  return result.rows[0] || null;
}


export async function approveTestimonial({
  testimonialId,
  adminId,
  moderationNotes
}) {
  const result =
    await pool.query(
      `
        UPDATE testimonials

        SET
          status = 'approved',

          approved_at = NOW(),

          rejected_at = NULL,

          reviewed_by = $2,

          moderation_notes = $3,

          updated_at = NOW()

        WHERE
          testimonial_id = $1

        RETURNING *
      `,
      [
        testimonialId,
        adminId,
        moderationNotes || null
      ]
    );

  return result.rows[0] || null;
}


export async function rejectTestimonial({
  testimonialId,
  adminId,
  moderationNotes
}) {
  const result =
    await pool.query(
      `
        UPDATE testimonials

        SET
          status = 'rejected',

          rejected_at = NOW(),

          approved_at = NULL,

          reviewed_by = $2,

          moderation_notes = $3,

          updated_at = NOW()

        WHERE
          testimonial_id = $1

        RETURNING *
      `,
      [
        testimonialId,
        adminId,
        moderationNotes || null
      ]
    );

  return result.rows[0] || null;
}