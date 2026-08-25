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
  getAdminUsersController,
  getAdminUserByIdController
} from "../../controllers/admin/adminUser.controller.js";


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
  getAdminUsersController
);


router.get(
  "/:userId",
  getAdminUserByIdController
);


export default router;