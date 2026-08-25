import {
  getAdminTestimonials,
  getAdminTestimonialById,
  approveTestimonial,
  rejectTestimonial
} from "../../services/admin/adminTestimonial.service.js";


export async function getAdminTestimonialsController(
  req,
  res
) {
  try {
    const {
      status
    } = req.query;

    const limit =
      Math.min(
        Number(req.query.limit) || 50,
        100
      );

    const offset =
      Math.max(
        Number(req.query.offset) || 0,
        0
      );

    const testimonials =
      await getAdminTestimonials({
        status,
        limit,
        offset
      });

    return res.status(200).json({
      success: true,
      count:
        testimonials.length,
      testimonials
    });

  } catch (error) {
    console.error(
      "Get admin testimonials error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load testimonials"
    });
  }
}


export async function getAdminTestimonialByIdController(
  req,
  res
) {
  try {
    const testimonial =
      await getAdminTestimonialById(
        req.params.testimonialId
      );

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message:
          "Testimonial not found"
      });
    }

    return res.status(200).json({
      success: true,
      testimonial
    });

  } catch (error) {
    console.error(
      "Get admin testimonial error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load testimonial"
    });
  }
}


export async function approveTestimonialController(
  req,
  res
) {
  try {
    const {
      moderationNotes
    } = req.body;

    const testimonial =
      await approveTestimonial({
        testimonialId:
          req.params.testimonialId,

        adminId:
          req.user.user_id,

        moderationNotes
      });

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message:
          "Testimonial not found"
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Testimonial approved successfully",

      testimonial
    });

  } catch (error) {
    console.error(
      "Approve testimonial error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve testimonial"
    });
  }
}


export async function rejectTestimonialController(
  req,
  res
) {
  try {
    const {
      moderationNotes
    } = req.body;

    if (!moderationNotes) {
      return res.status(400).json({
        success: false,
        message:
          "Moderation notes are required when rejecting a testimonial"
      });
    }

    const testimonial =
      await rejectTestimonial({
        testimonialId:
          req.params.testimonialId,

        adminId:
          req.user.user_id,

        moderationNotes
      });

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message:
          "Testimonial not found"
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Testimonial rejected successfully",

      testimonial
    });

  } catch (error) {
    console.error(
      "Reject testimonial error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject testimonial"
    });
  }
}