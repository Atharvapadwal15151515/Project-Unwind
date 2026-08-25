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
  removeCommunityContentController,
  restoreCommunityContentController
} from "../../controllers/admin/adminCommunityModeration.controller.js";


const router =
  express.Router();


router.use(
  authenticate,
  requireAdmin,
  requireAdminAccess
);


router.patch(
  "/:targetType/:targetId/remove",
  removeCommunityContentController
);


router.patch(
  "/:targetType/:targetId/restore",
  restoreCommunityContentController
);


export default router;