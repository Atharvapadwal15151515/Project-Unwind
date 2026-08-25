import asyncHandler from "../../utils/asyncHandler.js";

import {
  createReminder,
  getReminderById,
  getReminders,
  permanentlyDeleteReminder,
  restoreReminder,
  softDeleteReminder,
  updateReminder
} from "../../services/trackers/trackerReminder.service.js";

import {
  getAuthenticatedUserId,
  sendSuccessResponse
} from "./trackerController.utils.js";

export const createTrackerReminderController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const trackerReminder =
        await createReminder(
          userId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          statusCode: 201,
          message:
            "Tracker reminder created successfully",
          data: {
            trackerReminder
          }
        }
      );
    }
  );

export const getTrackerRemindersController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const trackerReminders =
        await getReminders(
          userId,
          req.validatedQuery
            ?.trackerType ?? null
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker reminders retrieved successfully",
          data: {
            trackerReminders
          }
        }
      );
    }
  );

export const getTrackerReminderByIdController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const trackerReminder =
        await getReminderById(
          userId,
          req.params
            .trackerReminderId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker reminder retrieved successfully",
          data: {
            trackerReminder
          }
        }
      );
    }
  );

export const updateTrackerReminderController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const trackerReminder =
        await updateReminder(
          userId,
          req.params
            .trackerReminderId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker reminder updated successfully",
          data: {
            trackerReminder
          }
        }
      );
    }
  );

export const softDeleteTrackerReminderController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const trackerReminder =
        await softDeleteReminder(
          userId,
          req.params
            .trackerReminderId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker reminder deleted successfully",
          data: {
            trackerReminder
          }
        }
      );
    }
  );

export const restoreTrackerReminderController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const trackerReminder =
        await restoreReminder(
          userId,
          req.params
            .trackerReminderId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker reminder restored successfully",
          data: {
            trackerReminder
          }
        }
      );
    }
  );

export const permanentlyDeleteTrackerReminderController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      await permanentlyDeleteReminder(
        userId,
        req.params
          .trackerReminderId
      );

      return sendSuccessResponse(
        res,
        {
          message:
            "Tracker reminder permanently deleted successfully",
          data: null
        }
      );
    }
  );
