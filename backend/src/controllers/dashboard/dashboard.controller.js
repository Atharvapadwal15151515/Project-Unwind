import asyncHandler
  from "../../utils/asyncHandler.js";

import {
  getDashboardStats
} from "../../services/dashboard/dashboard.service.js";

export const getDashboardStatsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const stats =
        await getDashboardStats(
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "Dashboard statistics retrieved successfully",
        data: stats
      });
    }
  );