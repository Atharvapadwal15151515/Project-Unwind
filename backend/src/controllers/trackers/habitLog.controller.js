import asyncHandler from "../../utils/asyncHandler.js";

import {
  completeHabit,
  createHabitLog,
  getHabitLogById,
  getHabitLogs,
  permanentlyDeleteHabitLog,
  restoreHabitLog,
  skipHabit,
  softDeleteHabitLog,
  updateHabitLog
} from "../../services/trackers/habitLog.service.js";

import {
  getAuthenticatedUserId,
  sendSuccessResponse
} from "./trackerController.utils.js";

export const createHabitLogController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habitLog =
        await createHabitLog(
          userId,
          req.params.habitId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          statusCode: 201,
          message:
            "Habit log saved successfully",
          data: {
            habitLog
          }
        }
      );
    }
  );

export const completeHabitController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habitLog =
        await completeHabit(
          userId,
          req.params.habitId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit completed successfully",
          data: {
            habitLog
          }
        }
      );
    }
  );

export const skipHabitController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habitLog =
        await skipHabit(
          userId,
          req.params.habitId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit skipped successfully",
          data: {
            habitLog
          }
        }
      );
    }
  );

export const getHabitLogsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const result =
        await getHabitLogs(
          userId,
          req.params.habitId,
          req.validatedQuery ?? {}
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit logs retrieved successfully",
          data: result
        }
      );
    }
  );

export const getHabitLogByIdController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habitLog =
        await getHabitLogById(
          userId,
          req.params.habitId,
          req.params.habitLogId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit log retrieved successfully",
          data: {
            habitLog
          }
        }
      );
    }
  );

export const updateHabitLogController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habitLog =
        await updateHabitLog(
          userId,
          req.params.habitId,
          req.params.habitLogId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit log updated successfully",
          data: {
            habitLog
          }
        }
      );
    }
  );

export const softDeleteHabitLogController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habitLog =
        await softDeleteHabitLog(
          userId,
          req.params.habitId,
          req.params.habitLogId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit log deleted successfully",
          data: {
            habitLog
          }
        }
      );
    }
  );

export const restoreHabitLogController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habitLog =
        await restoreHabitLog(
          userId,
          req.params.habitId,
          req.params.habitLogId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit log restored successfully",
          data: {
            habitLog
          }
        }
      );
    }
  );

export const permanentlyDeleteHabitLogController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      await permanentlyDeleteHabitLog(
        userId,
        req.params.habitId,
        req.params.habitLogId
      );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit log permanently deleted successfully",
          data: null
        }
      );
    }
  );
