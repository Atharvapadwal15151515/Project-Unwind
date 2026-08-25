import asyncHandler from "../../utils/asyncHandler.js";

import {
  createHabitRecord,
  getHabitById,
  getHabits,
  getHabitsForDate,
  pauseHabit,
  permanentlyDeleteHabit,
  restoreHabit,
  resumeHabit,
  softDeleteHabit,
  updateHabitRecord
} from "../../services/trackers/habitTracker.service.js";

import {
  getAuthenticatedUserId,
  sendSuccessResponse
} from "./trackerController.utils.js";

export const createHabitController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habit =
        await createHabitRecord(
          userId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          statusCode: 201,
          message:
            "Habit created successfully",
          data: {
            habit
          }
        }
      );
    }
  );

export const getHabitsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const result =
        await getHabits(
          userId,
          req.validatedQuery ?? {}
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habits retrieved successfully",
          data: result
        }
      );
    }
  );

export const getHabitsForDateController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habits =
        await getHabitsForDate(
          userId,
          req.validatedQuery.date
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habits for date retrieved successfully",
          data: {
            habits
          }
        }
      );
    }
  );

export const getHabitByIdController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habit =
        await getHabitById(
          userId,
          req.params.habitId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit retrieved successfully",
          data: {
            habit
          }
        }
      );
    }
  );

export const updateHabitController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habit =
        await updateHabitRecord(
          userId,
          req.params.habitId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit updated successfully",
          data: {
            habit
          }
        }
      );
    }
  );

export const pauseHabitController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habit =
        await pauseHabit(
          userId,
          req.params.habitId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit paused successfully",
          data: {
            habit
          }
        }
      );
    }
  );

export const resumeHabitController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habit =
        await resumeHabit(
          userId,
          req.params.habitId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit resumed successfully",
          data: {
            habit
          }
        }
      );
    }
  );

export const softDeleteHabitController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habit =
        await softDeleteHabit(
          userId,
          req.params.habitId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit deleted successfully",
          data: {
            habit
          }
        }
      );
    }
  );

export const restoreHabitController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const habit =
        await restoreHabit(
          userId,
          req.params.habitId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit restored successfully",
          data: {
            habit
          }
        }
      );
    }
  );

export const permanentlyDeleteHabitController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      await permanentlyDeleteHabit(
        userId,
        req.params.habitId
      );

      return sendSuccessResponse(
        res,
        {
          message:
            "Habit permanently deleted successfully",
          data: null
        }
      );
    }
  );
