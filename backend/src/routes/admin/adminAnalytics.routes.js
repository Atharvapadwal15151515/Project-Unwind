import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  requireAdmin
} from "../../middleware/admin/requireAdmin.js";

import {
  requireAdminAccess
} from "../../middleware/admin/requireAdminAccess.js";

import {
  adminReadLimiter
} from "../../middleware/rateLimiter.js";

import {
  getAdminAnalyticsOverviewController
} from "../../controllers/admin/adminAnalytics.controller.js";


const router =
  express.Router();

router.use(
  authenticate,
  requireAdmin,
  requireAdminAccess,
  adminReadLimiter
);

router.get(
  "/overview",
  getAdminAnalyticsOverviewController
);


export default router;