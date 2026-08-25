import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  adminReadLimiter
} from "../../middleware/rateLimiter.js";

import {
  requireAdmin
} from "../../middleware/admin/requireAdmin.js";

import {
  requireAdminAccess
} from "../../middleware/admin/requireAdminAccess.js";

import {
  getAdminAuditLogsController,
  getAdminAuditLogByIdController
} from "../../controllers/admin/adminAudit.controller.js";


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
  getAdminAuditLogsController
);


router.get(
  "/:auditId",
  getAdminAuditLogByIdController
);


export default router;