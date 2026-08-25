import asyncHandler from "../../utils/asyncHandler.js";

import {
  createMood,
  getMoodById,
  getMoodEntries,
  permanentlyDeleteMood,
  restoreMood,
  softDeleteMood,
  updateMood
} from "../../services/trackers/moodTracker.service.js";

import {
  getAuthenticatedUserId,
  sendSuccessResponse
} from "./trackerController.utils.js";

export const createMoodController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const moodEntry =
        await createMood(
          userId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          statusCode: 201,
          message:
            "Mood entry created successfully",
          data: {
            moodEntry
          }
        }
      );
    }
  );

export const getMoodEntriesController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const result =
        await getMoodEntries(
          userId,
          req.validatedQuery ?? {}
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Mood entries retrieved successfully",
          data: result
        }
      );
    }
  );

export const getMoodEntryByIdController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const moodEntry =
        await getMoodById(
          userId,
          req.params.moodEntryId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Mood entry retrieved successfully",
          data: {
            moodEntry
          }
        }
      );
    }
  );

export const updateMoodController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const moodEntry =
        await updateMood(
          userId,
          req.params.moodEntryId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Mood entry updated successfully",
          data: {
            moodEntry
          }
        }
      );
    }
  );

export const softDeleteMoodController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const moodEntry =
        await softDeleteMood(
          userId,
          req.params.moodEntryId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Mood entry deleted successfully",
          data: {
            moodEntry
          }
        }
      );
    }
  );

export const restoreMoodController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const moodEntry =
        await restoreMood(
          userId,
          req.params.moodEntryId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Mood entry restored successfully",
          data: {
            moodEntry
          }
        }
      );
    }
  );

export const permanentlyDeleteMoodController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      await permanentlyDeleteMood(
        userId,
        req.params.moodEntryId
      );

      return sendSuccessResponse(
        res,
        {
          message:
            "Mood entry permanently deleted successfully",
          data: null
        }
      );
    }
  );
