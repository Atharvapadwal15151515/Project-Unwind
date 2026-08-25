import asyncHandler from "../../utils/asyncHandler.js";

import {
  createEnergy,
  getEnergyById,
  getEnergyEntries,
  permanentlyDeleteEnergy,
  restoreEnergy,
  softDeleteEnergy,
  updateEnergy
} from "../../services/trackers/energyTracker.service.js";

import {
  getAuthenticatedUserId,
  sendSuccessResponse
} from "./trackerController.utils.js";

export const createEnergyController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const energyEntry =
        await createEnergy(
          userId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          statusCode: 201,
          message:
            "Energy entry created successfully",
          data: {
            energyEntry
          }
        }
      );
    }
  );

export const getEnergyEntriesController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const result =
        await getEnergyEntries(
          userId,
          req.validatedQuery ?? {}
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Energy entries retrieved successfully",
          data: result
        }
      );
    }
  );

export const getEnergyEntryByIdController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const energyEntry =
        await getEnergyById(
          userId,
          req.params.energyEntryId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Energy entry retrieved successfully",
          data: {
            energyEntry
          }
        }
      );
    }
  );

export const updateEnergyController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const energyEntry =
        await updateEnergy(
          userId,
          req.params.energyEntryId,
          req.body
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Energy entry updated successfully",
          data: {
            energyEntry
          }
        }
      );
    }
  );

export const softDeleteEnergyController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const energyEntry =
        await softDeleteEnergy(
          userId,
          req.params.energyEntryId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Energy entry deleted successfully",
          data: {
            energyEntry
          }
        }
      );
    }
  );

export const restoreEnergyController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      const energyEntry =
        await restoreEnergy(
          userId,
          req.params.energyEntryId
        );

      return sendSuccessResponse(
        res,
        {
          message:
            "Energy entry restored successfully",
          data: {
            energyEntry
          }
        }
      );
    }
  );

export const permanentlyDeleteEnergyController =
  asyncHandler(
    async (req, res) => {
      const userId =
        getAuthenticatedUserId(req);

      await permanentlyDeleteEnergy(
        userId,
        req.params.energyEntryId
      );

      return sendSuccessResponse(
        res,
        {
          message:
            "Energy entry permanently deleted successfully",
          data: null
        }
      );
    }
  );
