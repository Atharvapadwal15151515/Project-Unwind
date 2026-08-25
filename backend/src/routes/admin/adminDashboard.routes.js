import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  requireAdmin
} from "../../middleware/admin/requireAdmin.js";

import {
  adminReadLimiter
} from "../../middleware/rateLimiter.js";

import {
  requireAdminAccess
} from "../../middleware/admin/requireAdminAccess.js";

import {
  getAdminDashboardController
} from "../../controllers/admin/adminDashboard.controller.js";


const router =
  express.Router();

router.use(
  authenticate,
  requireAdmin,
  requireAdminAccess,
  adminReadLimiter
);

router.get(
  "/",
  authenticate,
  requireAdmin,
  requireAdminAccess,
  getAdminDashboardController
);


export default router;