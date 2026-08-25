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
  adminActionLimiter
} from "../../middleware/rateLimiter.js";
import {
  warnUserController,
  restrictUserController,
  suspendUserController,
  banUserController,
  restoreUserController
} from "../../controllers/admin/adminModeration.controller.js";


const router =
  express.Router();


router.use(
  authenticate,
  requireAdmin,
  requireAdminAccess,
  adminActionLimiter
);


router.post(
  "/users/:userId/warn",
  warnUserController
);


router.post(
  "/users/:userId/restrict",
  restrictUserController
);


router.post(
  "/users/:userId/suspend",
  suspendUserController
);


router.post(
  "/users/:userId/ban",
  banUserController
);


router.post(
  "/users/:userId/restore",
  restoreUserController
);


export default router;