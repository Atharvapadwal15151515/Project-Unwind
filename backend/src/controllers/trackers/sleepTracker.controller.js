import asyncHandler from "../../utils/asyncHandler.js";

import {
  createSleep,
  getSleepByDate,
  getSleepById,
  getSleepEntries,
  permanentlyDeleteSleep,
  restoreSleep,
  softDeleteSleep,
  updateSleep
} from "../../services/trackers/sleepTracker.service.js";

import {
  getAuthenticatedUserId,
  sendSuccessResponse
} from "./trackerController.utils.js";

export const createSleepController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const sleepEntry =
        await createSleep(
          userId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          statusCode: 201,
          message:
            "Sleep entry created successfully",
          data: {
            sleepEntry
          }
        }
      );
    }
  );

export const getSleepEntriesController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const result =
        await getSleepEntries(
          userId,
          req.validatedQuery ?? {}
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Sleep entries retrieved successfully",
          data: result
        }
      );
    }
  );

export const getSleepEntryByIdController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const sleepEntry =
        await getSleepById(
          userId,
          req.params.sleepEntryId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Sleep entry retrieved successfully",
          data: {
            sleepEntry
          }
        }
      );
    }
  );

export const getSleepEntryByDateController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const sleepEntry =
        await getSleepByDate(
          userId,
          req.params.sleepDate
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Sleep entry retrieved successfully",
          data: {
            sleepEntry
          }
        }
      );
    }
  );

export const updateSleepController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const sleepEntry =
        await updateSleep(
          userId,
          req.params.sleepEntryId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Sleep entry updated successfully",
          data: {
            sleepEntry
          }
        }
      );
    }
  );

export const softDeleteSleepController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const sleepEntry =
        await softDeleteSleep(
          userId,
          req.params.sleepEntryId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Sleep entry deleted successfully",
          data: {
            sleepEntry
          }
        }
      );
    }
  );

export const restoreSleepController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const sleepEntry =
        await restoreSleep(
          userId,
          req.params.sleepEntryId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Sleep entry restored successfully",
          data: {
            sleepEntry
          }
        }
      );
    }
  );

export const permanentlyDeleteSleepController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      await permanentlyDeleteSleep(
        userId,
        req.params.sleepEntryId
      );

      return sendSuccessResponse(
        res,
        {
          message:
            "Sleep entry permanently deleted successfully",
          data: null
        }
      );
    }
  );
