import pool from "../config/database.js";


/**
 * Create a new testimonial.
 *
 * Public users do NOT require an account.
 */
export async function createTestimonial({
  displayName,
  testimonialText,
  isAnonymous = false,
  rating = null,
}) {
  const query = `
    INSERT INTO testimonials (
      display_name,
      testimonial_text,
      is_anonymous,
      rating,
      status,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      'approved',
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  const values = [
    displayName,
    testimonialText,
    isAnonymous,
    rating,
  ];

  const result = await pool.query(
    query,
    values
  );

  return result.rows[0];
}


/**
 * Find testimonial by ID.
 *
 * Mainly used for admin moderation.
 */
export async function findTestimonialById(
  testimonialId
) {
  const query = `
    SELECT *
    FROM testimonials
    WHERE testimonial_id = $1
    LIMIT 1
  `;

  const result = await pool.query(
    query,
    [testimonialId]
  );

  return result.rows[0] || null;
}


/**
 * Get approved testimonials
 * for the public landing page.
 *
 * Anonymous testimonials NEVER expose
 * the originally entered name.
 */
export async function findPublicTestimonials() {
  const query = `
    SELECT
      testimonial_id,

      CASE
        WHEN is_anonymous = TRUE
          THEN 'Anonymous'
        ELSE display_name
      END AS display_name,

      testimonial_text,
      rating,
      created_at

    FROM testimonials

    WHERE status = 'approved'

    ORDER BY created_at DESC
  `;

  const result =
    await pool.query(query);

  return result.rows;
}


/**
 * Get all testimonials for admin.
 *
 * Admin can optionally filter:
 * pending / approved / rejected
 */
export async function findAllTestimonials({
  status = null,
  limit = 50,
  offset = 0,
}) {
  const query = `
    SELECT
      testimonial_id,
      display_name,
      testimonial_text,
      is_anonymous,
      rating,
      status,
      created_at,
      updated_at,
      approved_at

    FROM testimonials

    WHERE (
      $1::TEXT IS NULL
      OR status = $1
    )

    ORDER BY
      CASE status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 4
      END,
      created_at DESC

    LIMIT $2
    OFFSET $3
  `;

  const result = await pool.query(
    query,
    [
      status,
      limit,
      offset,
    ]
  );

  return result.rows;
}


/**
 * Approve testimonial.
 */
export async function approveTestimonial(
  testimonialId
) {
  const query = `
    UPDATE testimonials

    SET
      status = 'approved',
      approved_at = NOW(),
      updated_at = NOW()

    WHERE testimonial_id = $1

    RETURNING *
  `;

  const result = await pool.query(
    query,
    [testimonialId]
  );

  return result.rows[0] || null;
}


/**
 * Reject testimonial.
 */
export async function rejectTestimonial(
  testimonialId
) {
  const query = `
    UPDATE testimonials

    SET
      status = 'rejected',
      approved_at = NULL,
      updated_at = NOW()

    WHERE testimonial_id = $1

    RETURNING *
  `;

  const result = await pool.query(
    query,
    [testimonialId]
  );

  return result.rows[0] || null;
}


/**
 * Admin permanently deletes testimonial.
 */
export async function deleteTestimonial(
  testimonialId
) {
  const query = `
    DELETE FROM testimonials

    WHERE testimonial_id = $1

    RETURNING *
  `;

  const result = await pool.query(
    query,
    [testimonialId]
  );

  return result.rows[0] || null;
}