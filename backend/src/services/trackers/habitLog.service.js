import {
  createOrUpdateHabitLog,
  findHabitLogById,
  findHabitLogs,
  permanentlyDeleteHabitLogById,
  restoreHabitLogById,
  softDeleteHabitLogById,
  updateHabitLogById
} from "../../models/trackers/habitLog.model.js";

import AppError from "../../utils/AppError.js";

import {
  getHabitById
} from "./habitTracker.service.js";

import {
  buildPagination,
  parsePositiveInteger,
  removeTotalItems
} from "./trackerService.utils.js";

function normalizeHabitLogData(
  habit,
  logData
) {
  const status =
    logData.status ??
    "completed";

  let value =
    logData.value;

  if (
    status === "skipped" ||
    status === "missed"
  ) {
    value = 0;
  } else if (
    value === undefined
  ) {
    value =
      habit.tracking_type ===
        "boolean"
        ? 1
        : habit.target_value;
  }

  const completedAt =
    status === "completed"
      ? (
          logData.completedAt ??
          new Date().toISOString()
        )
      : null;

  return {
    ...logData,
    status,
    value,
    completedAt
  };
}

export async function createHabitLog(
  userId,
  habitId,
  logData
) {
  const habit =
    await getHabitById(
      userId,
      habitId
    );

  if (!habit.is_active) {
    throw new AppError(
      "Cannot log progress for a paused habit",
      400
    );
  }

  const normalizedData =
    normalizeHabitLogData(
      habit,
      logData
    );

  return createOrUpdateHabitLog(
    userId,
    habitId,
    normalizedData
  );
}

export async function completeHabit(
  userId,
  habitId,
  logData
) {
  return createHabitLog(
    userId,
    habitId,
    {
      ...logData,
      status: "completed"
    }
  );
}

export async function skipHabit(
  userId,
  habitId,
  logData
) {
  return createHabitLog(
    userId,
    habitId,
    {
      ...logData,
      status: "skipped",
      value: 0,
      completedAt: null
    }
  );
}

export async function getHabitLogById(
  userId,
  habitId,
  habitLogId,
  includeDeleted = false
) {
  const habitLog =
    await findHabitLogById(
      userId,
      habitId,
      habitLogId,
      includeDeleted
    );

  if (!habitLog) {
    throw new AppError(
      "Habit log not found",
      404
    );
  }

  return habitLog;
}

export async function getHabitLogs(
  userId,
  habitId,
  query = {}
) {
  await getHabitById(
    userId,
    habitId
  );

  const page =
    parsePositiveInteger(
      query.page,
      1
    );

  const limit =
    parsePositiveInteger(
      query.limit,
      31
    );

  const rows =
    await findHabitLogs(
      userId,
      habitId,
      {
        startDate:
          query.startDate,
        endDate:
          query.endDate,
        status:
          query.status,
        page,
        limit,
        sortOrder:
          query.sortOrder
      }
    );

  return {
    habitLogs:
      removeTotalItems(rows),
    pagination:
      buildPagination(
        rows,
        page,
        limit
      )
  };
}

export async function updateHabitLog(
  userId,
  habitId,
  habitLogId,
  logData
) {
  const habit =
    await getHabitById(
      userId,
      habitId
    );

  await getHabitLogById(
    userId,
    habitId,
    habitLogId
  );

  const normalizedData =
    normalizeHabitLogData(
      habit,
      logData
    );

  const updatedLog =
    await updateHabitLogById(
      userId,
      habitId,
      habitLogId,
      normalizedData
    );

  if (!updatedLog) {
    throw new AppError(
      "Habit log not found",
      404
    );
  }

  return updatedLog;
}

export async function softDeleteHabitLog(
  userId,
  habitId,
  habitLogId
) {
  const deletedLog =
    await softDeleteHabitLogById(
      userId,
      habitId,
      habitLogId
    );

  if (!deletedLog) {
    throw new AppError(
      "Habit log not found",
      404
    );
  }

  return deletedLog;
}

export async function restoreHabitLog(
  userId,
  habitId,
  habitLogId
) {
  const restoredLog =
    await restoreHabitLogById(
      userId,
      habitId,
      habitLogId
    );

  if (!restoredLog) {
    throw new AppError(
      "Deleted habit log not found",
      404
    );
  }

  return restoredLog;
}

export async function permanentlyDeleteHabitLog(
  userId,
  habitId,
  habitLogId
) {
  const deletedLog =
    await permanentlyDeleteHabitLogById(
      userId,
      habitId,
      habitLogId
    );

  if (!deletedLog) {
    throw new AppError(
      "Habit log not found",
      404
    );
  }

  return deletedLog;
}
