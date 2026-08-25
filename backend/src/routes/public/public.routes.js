import express from "express";

import {
  getLandingStatsController
} from "../../controllers/public/public.controller.js";

const router =
  express.Router();

router.get(
  "/stats",
  getLandingStatsController
);

export default router;