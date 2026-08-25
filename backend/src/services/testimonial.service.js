import * as testimonialModel
  from "../models/testimonial.model.js";


/* =========================================================
   VALIDATION HELPERS
   ========================================================= */


/**
 * Validate testimonial text.
 */
function validateTestimonialText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Testimonial text is required");
  }

  const trimmedText = text.trim();

  if (trimmedText.length < 10) {
    throw new Error(
      "Testimonial must contain at least 10 characters"
    );
  }

  if (trimmedText.length > 1000) {
    throw new Error(
      "Testimonial cannot exceed 1000 characters"
    );
  }

  return trimmedText;
}


/**
 * Validate rating.
 *
 * Rating is optional.
 */
function validateRating(rating) {
  if (
    rating === undefined ||
    rating === null ||
    rating === ""
  ) {
    return null;
  }

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new Error(
      "Rating must be between 1 and 5"
    );
  }

  return numericRating;
}


/**
 * Validate anonymous option.
 */
function validateAnonymous(value) {
  if (value === undefined) {
    return false;
  }

  if (typeof value !== "boolean") {
    throw new Error(
      "is_anonymous must be true or false"
    );
  }

  return value;
}


/**
 * Validate display name.
 *
 * If anonymous:
 * name is completely ignored and stored as NULL.
 *
 * If not anonymous:
 * name is required.
 */
function validateDisplayName(
  displayName,
  isAnonymous
) {
  if (isAnonymous) {
    return null;
  }

  if (
    !displayName ||
    typeof displayName !== "string"
  ) {
    throw new Error(
      "Name is required when submitting a non-anonymous testimonial"
    );
  }

  const trimmedName = displayName.trim();

  if (trimmedName.length < 2) {
    throw new Error(
      "Name must contain at least 2 characters"
    );
  }

  if (trimmedName.length > 100) {
    throw new Error(
      "Name cannot exceed 100 characters"
    );
  }

  return trimmedName;
}


/* =========================================================
   PUBLIC SERVICES
   ========================================================= */


/**
 * Create testimonial.
 *
 * No authentication required.
 */
export async function createTestimonial(data) {
  if (!data || typeof data !== "object") {
    throw new Error(
      "Testimonial data is required"
    );
  }

  const testimonialText =
    validateTestimonialText(
      data.testimonial_text
    );

  const rating =
    validateRating(data.rating);

  const isAnonymous =
    validateAnonymous(
      data.is_anonymous
    );

  const displayName =
    validateDisplayName(
      data.display_name,
      isAnonymous
    );

  const testimonial =
    await testimonialModel.createTestimonial({
      displayName,
      testimonialText,
      isAnonymous,
      rating,
    });

  return testimonial;
}


/**
 * Get approved testimonials
 * for landing page.
 */
export async function getPublicTestimonials() {
  return await testimonialModel
    .findPublicTestimonials();
}


/* =========================================================
   ADMIN SERVICES
   ========================================================= */


/**
 * Get testimonials for moderation.
 *
 * Supports:
 * status
 * page
 * limit
 */
export async function getAdminTestimonials({
  status = null,
  page = 1,
  limit = 50,
}) {

  const allowedStatuses = [
    "pending",
    "approved",
    "rejected",
  ];

  if (
    status &&
    !allowedStatuses.includes(status)
  ) {
    throw new Error(
      "Invalid testimonial status"
    );
  }


  let parsedPage = Number(page);
  let parsedLimit = Number(limit);


  if (
    !Number.isInteger(parsedPage) ||
    parsedPage < 1
  ) {
    parsedPage = 1;
  }


  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1
  ) {
    parsedLimit = 50;
  }


  /**
   * Prevent huge database requests.
   */
  if (parsedLimit > 100) {
    parsedLimit = 100;
  }


  const offset =
    (parsedPage - 1) * parsedLimit;


  return await testimonialModel
    .findAllTestimonials({
      status,
      limit: parsedLimit,
      offset,
    });
}


/**
 * Approve testimonial.
 */
export async function approveTestimonial(
  testimonialId
) {

  if (!testimonialId) {
    throw new Error(
      "Testimonial ID is required"
    );
  }


  const existing =
    await testimonialModel
      .findTestimonialById(
        testimonialId
      );


  if (!existing) {
    const error =
      new Error(
        "Testimonial not found"
      );

    error.statusCode = 404;

    throw error;
  }


  if (existing.status === "approved") {
    throw new Error(
      "Testimonial is already approved"
    );
  }


  const approved =
    await testimonialModel
      .approveTestimonial(
        testimonialId
      );


  if (!approved) {
    throw new Error(
      "Unable to approve testimonial"
    );
  }


  return approved;
}


/**
 * Reject testimonial.
 */
export async function rejectTestimonial(
  testimonialId
) {

  if (!testimonialId) {
    throw new Error(
      "Testimonial ID is required"
    );
  }


  const existing =
    await testimonialModel
      .findTestimonialById(
        testimonialId
      );


  if (!existing) {
    const error =
      new Error(
        "Testimonial not found"
      );

    error.statusCode = 404;

    throw error;
  }


  if (existing.status === "rejected") {
    throw new Error(
      "Testimonial is already rejected"
    );
  }


  const rejected =
    await testimonialModel
      .rejectTestimonial(
        testimonialId
      );


  if (!rejected) {
    throw new Error(
      "Unable to reject testimonial"
    );
  }


  return rejected;
}


/**
 * Admin permanently deletes testimonial.
 */
export async function adminDeleteTestimonial(
  testimonialId
) {

  if (!testimonialId) {
    throw new Error(
      "Testimonial ID is required"
    );
  }


  const existing =
    await testimonialModel
      .findTestimonialById(
        testimonialId
      );


  if (!existing) {
    const error =
      new Error(
        "Testimonial not found"
      );

    error.statusCode = 404;

    throw error;
  }


  const deleted =
    await testimonialModel
      .deleteTestimonial(
        testimonialId
      );


  if (!deleted) {
    throw new Error(
      "Unable to delete testimonial"
    );
  }


  return deleted;
}