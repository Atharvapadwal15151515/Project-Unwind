import pool from "../../config/database.js";

import {
  addSleepEntryFactor,
  createSleepEntry,
  deleteSleepEntryFactors,
  findSleepEntriesByUserId,
  findSleepEntryByDate,
  findSleepEntryById,
  permanentlyDeleteSleepEntryById,
  restoreSleepEntryById,
  softDeleteSleepEntryById,
  updateSleepEntryById
} from "../../models/trackers/sleepTracker.model.js";

import AppError from "../../utils/AppError.js";

import {
  validateSleepFactors
} from "./trackerMetadata.service.js";

import {
  buildPagination,
  parseOptionalInteger,
  parsePositiveInteger,
  removeTotalItems
} from "./trackerService.utils.js";

function calculateSleepDurationMinutes(
  sleepStartTime,
  wakeTime
) {
  const start =
    new Date(sleepStartTime);

  const end =
    new Date(wakeTime);

  const difference =
    end.getTime() -
    start.getTime();

  const minutes =
    Math.round(
      difference / 60000
    );

  if (
    !Number.isFinite(minutes) ||
    minutes <= 0 ||
    minutes > 1440
  ) {
    throw new AppError(
      "Sleep duration must be between 1 and 1440 minutes",
      400
    );
  }

  return minutes;
}

export async function createSleep(
  userId,
  sleepData
) {
  const existingEntry =
    await findSleepEntryByDate(
      userId,
      sleepData.sleepDate
    );

  if (existingEntry) {
    throw new AppError(
      "A sleep entry already exists for this date",
      409
    );
  }

  const factors =
    await validateSleepFactors(
      sleepData.factors ?? []
    );

  const sleepDurationMinutes =
    calculateSleepDurationMinutes(
      sleepData.sleepStartTime,
      sleepData.wakeTime
    );

  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const sleepEntry =
      await createSleepEntry(
        userId,
        {
          ...sleepData,
          sleepDurationMinutes
        },
        client
      );

    for (
      const factor of factors
    ) {
      await addSleepEntryFactor(
        sleepEntry.sleep_entry_id,
        factor,
        client
      );
    }

    await client.query("COMMIT");

    return getSleepById(
      userId,
      sleepEntry.sleep_entry_id
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getSleepById(
  userId,
  sleepEntryId,
  includeDeleted = false
) {
  const sleepEntry =
    await findSleepEntryById(
      userId,
      sleepEntryId,
      includeDeleted
    );

  if (!sleepEntry) {
    throw new AppError(
      "Sleep entry not found",
      404
    );
  }

  return sleepEntry;
}

export async function getSleepByDate(
  userId,
  sleepDate
) {
  const sleepEntry =
    await findSleepEntryByDate(
      userId,
      sleepDate
    );

  if (!sleepEntry) {
    throw new AppError(
      "Sleep entry not found",
      404
    );
  }

  return sleepEntry;
}

export async function getSleepEntries(
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
    await findSleepEntriesByUserId(
      userId,
      {
        startDate:
          query.startDate,
        endDate:
          query.endDate,
        minQuality:
          parseOptionalInteger(
            query.minQuality
          ),
        maxQuality:
          parseOptionalInteger(
            query.maxQuality
          ),
        minDurationMinutes:
          parseOptionalInteger(
            query.minDurationMinutes
          ),
        maxDurationMinutes:
          parseOptionalInteger(
            query.maxDurationMinutes
          ),
        factorId:
          query.factorId,
        page,
        limit,
        sortOrder:
          query.sortOrder
      }
    );

  return {
    sleepEntries:
      removeTotalItems(rows),
    pagination:
      buildPagination(
        rows,
        page,
        limit
      )
  };
}

export async function updateSleep(
  userId,
  sleepEntryId,
  sleepData
) {
  const existing =
    await getSleepById(
      userId,
      sleepEntryId
    );

  if (
    sleepData.sleepDate &&
    sleepData.sleepDate !==
      existing.sleep_date
  ) {
    const duplicate =
      await findSleepEntryByDate(
        userId,
        sleepData.sleepDate
      );

    if (
      duplicate &&
      duplicate.sleep_entry_id !==
        sleepEntryId
    ) {
      throw new AppError(
        "A sleep entry already exists for this date",
        409
      );
    }
  }

  const hasFactors =
    sleepData.factors !==
      undefined;

  const factors =
    hasFactors
      ? await validateSleepFactors(
          sleepData.factors
        )
      : [];

  const finalStartTime =
    sleepData.sleepStartTime ??
    existing.sleep_start_time;

  const finalWakeTime =
    sleepData.wakeTime ??
    existing.wake_time;

  const sleepDurationMinutes =
    calculateSleepDurationMinutes(
      finalStartTime,
      finalWakeTime
    );

  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedEntry =
      await updateSleepEntryById(
        userId,
        sleepEntryId,
        {
          ...sleepData,
          sleepDurationMinutes
        },
        client
      );

    if (!updatedEntry) {
      throw new AppError(
        "Sleep entry not found",
        404
      );
    }

    if (hasFactors) {
      await deleteSleepEntryFactors(
        sleepEntryId,
        client
      );

      for (
        const factor of factors
      ) {
        await addSleepEntryFactor(
          sleepEntryId,
          factor,
          client
        );
      }
    }

    await client.query("COMMIT");

    return getSleepById(
      userId,
      sleepEntryId
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function softDeleteSleep(
  userId,
  sleepEntryId
) {
  const deletedEntry =
    await softDeleteSleepEntryById(
      userId,
      sleepEntryId
    );

  if (!deletedEntry) {
    throw new AppError(
      "Sleep entry not found",
      404
    );
  }

  return deletedEntry;
}

export async function restoreSleep(
  userId,
  sleepEntryId
) {
  const deletedEntry =
    await findSleepEntryById(
      userId,
      sleepEntryId,
      true
    );

  if (
    !deletedEntry ||
    !deletedEntry.deleted_at
  ) {
    throw new AppError(
      "Deleted sleep entry not found",
      404
    );
  }

  const duplicate =
    await findSleepEntryByDate(
      userId,
      deletedEntry.sleep_date
    );

  if (duplicate) {
    throw new AppError(
      "Another active sleep entry already exists for this date",
      409
    );
  }

  const restoredEntry =
    await restoreSleepEntryById(
      userId,
      sleepEntryId
    );

  if (!restoredEntry) {
    throw new AppError(
      "Deleted sleep entry not found",
      404
    );
  }

  return getSleepById(
    userId,
    sleepEntryId
  );
}

export async function permanentlyDeleteSleep(
  userId,
  sleepEntryId
) {
  const deletedEntry =
    await permanentlyDeleteSleepEntryById(
      userId,
      sleepEntryId
    );

  if (!deletedEntry) {
    throw new AppError(
      "Sleep entry not found",
      404
    );
  }

  return deletedEntry;
}
