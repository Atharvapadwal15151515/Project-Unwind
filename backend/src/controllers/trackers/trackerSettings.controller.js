import asyncHandler from "../../utils/asyncHandler.js";

import {
  getTrackerSettings,
  updateTrackerSettings
} from "../../services/trackers/trackerSettings.service.js";

import {
  getAuthenticatedUserId,
  sendSuccessResponse
} from "./trackerController.utils.js";

export const getTrackerSettingsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const settings =
        await getTrackerSettings(
          userId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker settings retrieved successfully",
          data: {
            settings
          }
        }
      );
    }
  );

export const updateTrackerSettingsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const settings =
        await updateTrackerSettings(
          userId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker settings updated successfully",
          data: {
            settings
          }
        }
      );
    }
  );
