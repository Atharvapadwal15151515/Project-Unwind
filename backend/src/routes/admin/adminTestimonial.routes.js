import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  requireAdmin
} from "../../middleware/admin/requireAdmin.js";
import {
  adminReadLimiter,
  adminActionLimiter
} from "../../middleware/rateLimiter.js";
import {
  requireAdminAccess
} from "../../middleware/admin/requireAdminAccess.js";

import {
  getAdminTestimonialsController,
  getAdminTestimonialByIdController,
  approveTestimonialController,
  rejectTestimonialController
} from "../../controllers/admin/adminTestimonial.controller.js";


const router =
  express.Router();


router.use(
  authenticate,
  requireAdmin,
  requireAdminAccess
);


router.get(
  "/",
  adminReadLimiter,
  getAdminTestimonialsController
);

router.get(
  "/:testimonialId",
  adminReadLimiter,
  getAdminTestimonialByIdController
);


router.patch(
  "/:testimonialId/approve",
  adminActionLimiter,
  approveTestimonialController
);

router.patch(
  "/:testimonialId/reject",
  adminActionLimiter,
  rejectTestimonialController
);


export default router;