import express from "express";

import {
  createTestimonial,
  getPublicTestimonials,
  getAdminTestimonials,
  approveTestimonial,
  rejectTestimonial,
  adminDeleteTestimonial,
} from "../controllers/testimonial.controller.js";

import { authenticate }
  from "../middleware/authenticate.js";


const router = express.Router();


/* =========================================================
   PUBLIC ROUTES
   ========================================================= */


/**
 * POST /api/testimonials
 *
 * Anyone can submit a testimonial.
 * NO authentication required.
 */
router.post(
  "/",
  createTestimonial
);


/**
 * GET /api/testimonials/public
 *
 * Landing page fetches approved testimonials.
 * NO authentication required.
 */
router.get(
  "/public",
  getPublicTestimonials
);


/* =========================================================
   ADMIN MIDDLEWARE
   ========================================================= */

function requireAdmin(req, res, next) {
  if (
    !req.user ||
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
}


/* =========================================================
   ADMIN ROUTES
   ========================================================= */


/**
 * GET /api/testimonials/admin
 *
 * Get all testimonials.
 *
 * Optional:
 * ?status=pending
 * ?status=approved
 * ?status=rejected
 */
router.get(
  "/admin",
  authenticate,
  requireAdmin,
  getAdminTestimonials
);


/**
 * PATCH /api/testimonials/admin/:id/approve
 */
router.patch(
  "/admin/:id/approve",
  authenticate,
  requireAdmin,
  approveTestimonial
);


/**
 * PATCH /api/testimonials/admin/:id/reject
 */
router.patch(
  "/admin/:id/reject",
  authenticate,
  requireAdmin,
  rejectTestimonial
);


/**
 * DELETE /api/testimonials/admin/:id
 */
router.delete(
  "/admin/:id",
  authenticate,
  requireAdmin,
  adminDeleteTestimonial
);


export default router;