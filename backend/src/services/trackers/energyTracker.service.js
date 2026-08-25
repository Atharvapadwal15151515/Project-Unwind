import {
  createEnergyEntry,
  findEnergyEntriesByUserId,
  findEnergyEntryById,
  permanentlyDeleteEnergyEntryById,
  restoreEnergyEntryById,
  softDeleteEnergyEntryById,
  updateEnergyEntryById
} from "../../models/trackers/energyTracker.model.js";

import AppError from "../../utils/AppError.js";

import {
  buildPagination,
  parseOptionalInteger,
  parsePositiveInteger,
  removeTotalItems
} from "./trackerService.utils.js";

export async function createEnergy(
  userId,
  energyData
) {
  return createEnergyEntry(
    userId,
    energyData
  );
}

export async function getEnergyById(
  userId,
  energyEntryId,
  includeDeleted = false
) {
  const energyEntry =
    await findEnergyEntryById(
      userId,
      energyEntryId,
      includeDeleted
    );

  if (!energyEntry) {
    throw new AppError(
      "Energy entry not found",
      404
    );
  }

  return energyEntry;
}

export async function getEnergyEntries(
  userId,
  query = {}
) {
  const page =
    parsePositiveInteger(
      query.page,
      1
    );

  const limit =
    parsePositiveInteger(
      query.limit,
      20
    );

  const rows =
    await findEnergyEntriesByUserId(
      userId,
      {
        startDate:
          query.startDate,
        endDate:
          query.endDate,
        minEnergyScore:
          parseOptionalInteger(
            query.minEnergyScore
          ),
        maxEnergyScore:
          parseOptionalInteger(
            query.maxEnergyScore
          ),
        contextCategory:
          query.contextCategory,
        page,
        limit,
        sortOrder:
          query.sortOrder
      }
    );

  return {
    energyEntries:
      removeTotalItems(rows),
    pagination:
      buildPagination(
        rows,
        page,
        limit
      )
  };
}

export async function updateEnergy(
  userId,
  energyEntryId,
  energyData
) {
  const updatedEntry =
    await updateEnergyEntryById(
      userId,
      energyEntryId,
      energyData
    );

  if (!updatedEntry) {
    throw new AppError(
      "Energy entry not found",
      404
    );
  }

  return updatedEntry;
}

export async function softDeleteEnergy(
  userId,
  energyEntryId
) {
  const deletedEntry =
    await softDeleteEnergyEntryById(
      userId,
      energyEntryId
    );

  if (!deletedEntry) {
    throw new AppError(
      "Energy entry not found",
      404
    );
  }

  return deletedEntry;
}

export async function restoreEnergy(
  userId,
  energyEntryId
) {
  const restoredEntry =
    await restoreEnergyEntryById(
      userId,
      energyEntryId
    );

  if (!restoredEntry) {
    throw new AppError(
      "Deleted energy entry not found",
      404
    );
  }

  return restoredEntry;
}

export async function permanentlyDeleteEnergy(
  userId,
  energyEntryId
) {
  const deletedEntry =
    await permanentlyDeleteEnergyEntryById(
      userId,
      energyEntryId
    );

  if (!deletedEntry) {
    throw new AppError(
      "Energy entry not found",
      404
    );
  }

  return deletedEntry;
}
