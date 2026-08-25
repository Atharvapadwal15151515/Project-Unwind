import asyncHandler from "../../utils/asyncHandler.js";

import {
  getSleepFactors,
  getTrackerActivities,
  getTrackerEmotions,
  getTrackerMetadata
} from "../../services/trackers/trackerMetadata.service.js";

import {
  getAuthenticatedUserId,
  sendSuccessResponse
} from "./trackerController.utils.js";

export const getTrackerMetadataController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const metadata =
        await getTrackerMetadata(
          userId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker metadata retrieved successfully",
          data: {
            metadata
          }
        }
      );
    }
  );

export const getTrackerEmotionsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const emotions =
        await getTrackerEmotions(
          userId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker emotions retrieved successfully",
          data: {
            emotions
          }
        }
      );
    }
  );

export const getTrackerActivitiesController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const activities =
        await getTrackerActivities(
          userId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker activities retrieved successfully",
          data: {
            activities
          }
        }
      );
    }
  );

export const getSleepFactorsController =
  asyncHandler(
    async (req, res) => {
      const sleepFactors =
        await getSleepFactors();

      return sendSuccessResponse(
        res,
        {
          message:
            "Sleep factors retrieved successfully",
          data: {
            sleepFactors
          }
        }
      );
    }
  );
