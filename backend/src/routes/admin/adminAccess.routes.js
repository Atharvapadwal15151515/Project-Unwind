import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";
import {
  adminAccessLimiter
} from "../../middleware/rateLimiter.js";

import {
  requireAdmin
} from "../../middleware/admin/requireAdmin.js";

import {
  requireAdminAccess
} from "../../middleware/admin/requireAdminAccess.js";

import {
  verifyAdminAccessController,
  getAdminAccessStatusController,
  revokeAdminAccessController
} from "../../controllers/admin/adminAccess.controller.js";


const router = express.Router();


/*
|--------------------------------------------------------------------------
| Verify Common Admin Password
|--------------------------------------------------------------------------
*/

router.post(
  "/verify",
  authenticate,
  requireAdmin,
  adminAccessLimiter,
  verifyAdminAccessController
);


/*
|--------------------------------------------------------------------------
| Check Admin Access Session
|--------------------------------------------------------------------------
*/

router.get(
  "/status",
  authenticate,
  requireAdmin,
  requireAdminAccess,
  getAdminAccessStatusController
);

router.post(
  "/revoke",
  authenticate,
  requireAdmin,
  requireAdminAccess,
  revokeAdminAccessController
);

export default router;