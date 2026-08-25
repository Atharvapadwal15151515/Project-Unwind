import asyncHandler from "../../utils/asyncHandler.js";

import {
  createContainer,
  createWater,
  getWaterById,
  getWaterContainerById,
  getWaterContainers,
  getWaterLogs,
  getWaterTotal,
  permanentlyDeleteWater,
  restoreWater,
  softDeleteContainer,
  softDeleteWater,
  updateContainer,
  updateWater
} from "../../services/trackers/waterTracker.service.js";

import {
  getAuthenticatedUserId,
  sendSuccessResponse
} from "./trackerController.utils.js";

function getDayRange(
  date
) {
  const startOfDay =
    new Date(
      `${date}T00:00:00.000Z`
    );

  const endOfDay =
    new Date(
      startOfDay
    );

  endOfDay.setUTCDate(
    endOfDay.getUTCDate() + 1
  );

  return {
    startOfDay:
      startOfDay.toISOString(),
    endOfDay:
      endOfDay.toISOString()
  };
}

export const createWaterController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const waterLog =
        await createWater(
          userId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          statusCode: 201,
          message:
            "Water log created successfully",
          data: {
            waterLog
          }
        }
      );
    }
  );

export const getWaterLogsController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const result =
        await getWaterLogs(
          userId,
          req.validatedQuery ?? {}
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water logs retrieved successfully",
          data: result
        }
      );
    }
  );

export const getWaterLogByIdController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const waterLog =
        await getWaterById(
          userId,
          req.params.waterLogId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water log retrieved successfully",
          data: {
            waterLog
          }
        }
      );
    }
  );

export const getWaterTotalController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const {
        startOfDay,
        endOfDay
      } = getDayRange(
        req.validatedQuery.date
      );

      const waterTotal =
        await getWaterTotal(
          userId,
          startOfDay,
          endOfDay
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water total retrieved successfully",
          data: {
            waterTotal
          }
        }
      );
    }
  );

export const updateWaterController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const waterLog =
        await updateWater(
          userId,
          req.params.waterLogId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water log updated successfully",
          data: {
            waterLog
          }
        }
      );
    }
  );

export const softDeleteWaterController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const waterLog =
        await softDeleteWater(
          userId,
          req.params.waterLogId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water log deleted successfully",
          data: {
            waterLog
          }
        }
      );
    }
  );

export const restoreWaterController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const waterLog =
        await restoreWater(
          userId,
          req.params.waterLogId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water log restored successfully",
          data: {
            waterLog
          }
        }
      );
    }
  );

export const permanentlyDeleteWaterController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      await permanentlyDeleteWater(
        userId,
        req.params.waterLogId
      );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water log permanently deleted successfully",
          data: null
        }
      );
    }
  );

export const createWaterContainerController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const waterContainer =
        await createContainer(
          userId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          statusCode: 201,
          message:
            "Water container created successfully",
          data: {
            waterContainer
          }
        }
      );
    }
  );

export const getWaterContainersController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const waterContainers =
        await getWaterContainers(
          userId,
          req.validatedQuery ?? {}
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water containers retrieved successfully",
          data: {
            waterContainers
          }
        }
      );
    }
  );

export const getWaterContainerByIdController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const waterContainer =
        await getWaterContainerById(
          userId,
          req.params.waterContainerId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water container retrieved successfully",
          data: {
            waterContainer
          }
        }
      );
    }
  );

export const updateWaterContainerController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const waterContainer =
        await updateContainer(
          userId,
          req.params.waterContainerId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water container updated successfully",
          data: {
            waterContainer
          }
        }
      );
    }
  );

export const softDeleteWaterContainerController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const waterContainer =
        await softDeleteContainer(
          userId,
          req.params.waterContainerId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Water container deleted successfully",
          data: {
            waterContainer
          }
        }
      );
    }
  );
