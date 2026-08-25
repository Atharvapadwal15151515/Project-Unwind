import * as testimonialService
  from "../services/testimonial.service.js";


/* =========================================================
   PUBLIC CONTROLLERS
   ========================================================= */


/**
 * POST /api/testimonials
 *
 * Public visitor submits a testimonial.
 * Authentication is NOT required.
 */
export async function createTestimonial(req, res) {
  try {
    const testimonial =
      await testimonialService.createTestimonial(
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        "Testimonial submitted successfully and is awaiting approval.",
      data: testimonial,
    });

  } catch (error) {
    console.error(
      "Create testimonial error:",
      error
    );

    return res
      .status(error.statusCode || 400)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to submit testimonial",
      });
  }
}


/**
 * GET /api/testimonials/public
 *
 * Returns approved testimonials
 * for the landing page.
 *
 * Authentication is NOT required.
 */
export async function getPublicTestimonials(
  req,
  res
) {
  try {
    const testimonials =
      await testimonialService
        .getPublicTestimonials();

    return res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });

  } catch (error) {
    console.error(
      "Get public testimonials error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch testimonials",
    });
  }
}


/* =========================================================
   ADMIN CONTROLLERS
   ========================================================= */


/**
 * GET /api/testimonials/admin
 *
 * Admin can view all testimonials.
 *
 * Optional query parameters:
 *
 * ?status=pending
 * ?status=approved
 * ?status=rejected
 * ?page=1
 * ?limit=50
 */
export async function getAdminTestimonials(
  req,
  res
) {
  try {
    const {
      status = null,
      page = 1,
      limit = 50,
    } = req.query;

    const testimonials =
      await testimonialService
        .getAdminTestimonials({
          status,
          page,
          limit,
        });

    return res.status(200).json({
      success: true,
      count: testimonials.length,
      page: Number(page),
      data: testimonials,
    });

  } catch (error) {
    console.error(
      "Get admin testimonials error:",
      error
    );

    return res
      .status(error.statusCode || 400)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to fetch testimonials",
      });
  }
}


/**
 * PATCH /api/testimonials/admin/:id/approve
 *
 * Admin approves testimonial.
 */
export async function approveTestimonial(
  req,
  res
) {
  try {
    const testimonialId =
      req.params.id;

    const testimonial =
      await testimonialService
        .approveTestimonial(
          testimonialId
        );

    return res.status(200).json({
      success: true,
      message:
        "Testimonial approved successfully",
      data: testimonial,
    });

  } catch (error) {
    console.error(
      "Approve testimonial error:",
      error
    );

    return res
      .status(error.statusCode || 400)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to approve testimonial",
      });
  }
}


/**
 * PATCH /api/testimonials/admin/:id/reject
 *
 * Admin rejects testimonial.
 */
export async function rejectTestimonial(
  req,
  res
) {
  try {
    const testimonialId =
      req.params.id;

    const testimonial =
      await testimonialService
        .rejectTestimonial(
          testimonialId
        );

    return res.status(200).json({
      success: true,
      message:
        "Testimonial rejected successfully",
      data: testimonial,
    });

  } catch (error) {
    console.error(
      "Reject testimonial error:",
      error
    );

    return res
      .status(error.statusCode || 400)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to reject testimonial",
      });
  }
}


/**
 * DELETE /api/testimonials/admin/:id
 *
 * Admin permanently deletes testimonial.
 */
export async function adminDeleteTestimonial(
  req,
  res
) {
  try {
    const testimonialId =
      req.params.id;

    await testimonialService
      .adminDeleteTestimonial(
        testimonialId
      );

    return res.status(200).json({
      success: true,
      message:
        "Testimonial deleted successfully",
    });

  } catch (error) {
    console.error(
      "Admin delete testimonial error:",
      error
    );

    return res
      .status(error.statusCode || 400)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to delete testimonial",
      });
  }
}