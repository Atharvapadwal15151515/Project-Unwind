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
  getAdminReportsController,
  getAdminReportByIdController,
  markReportUnderReviewController,
  resolveReportController
} from "../../controllers/admin/adminReport.controller.js";


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
  getAdminReportsController
);


router.get(
  "/:reportId",
  adminReadLimiter,
  getAdminReportByIdController
);

router.patch(
  "/:reportId/review",
  markReportUnderReviewController
);


router.patch(
  "/:reportId/resolve",
  adminActionLimiter,
  resolveReportController
);


export default router;