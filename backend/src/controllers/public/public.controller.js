import asyncHandler from "../../utils/asyncHandler.js";

import {
  getLandingStats
} from "../../services/public/public.service.js";

export const getLandingStatsController =
  asyncHandler(
    async (req, res) => {
      const stats =
        await getLandingStats();

      return res.status(200).json({
        success: true,
        message:
          "Landing statistics retrieved successfully",
        data: stats
      });
    }
  );