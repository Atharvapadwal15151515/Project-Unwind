import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  getDashboardStatsController
} from "../../controllers/dashboard/dashboard.controller.js";

const router =
  express.Router();

router.use(authenticate);

router.get(
  "/stats",
  getDashboardStatsController
);

export default router;