import {
  createWaterContainer,
  createWaterLog,
  findWaterContainerById,
  findWaterContainersByUserId,
  findWaterLogById,
  findWaterLogsByUserId,
  findWaterTotalForDate,
  permanentlyDeleteWaterLogById,
  restoreWaterLogById,
  softDeleteWaterContainerById,
  softDeleteWaterLogById,
  updateWaterContainerById,
  updateWaterLogById
} from "../../models/trackers/waterTracker.model.js";

import AppError from "../../utils/AppError.js";

import {
  getTrackerSettings
} from "./trackerSettings.service.js";

import {
  buildPagination,
  parseBooleanQuery,
  parsePositiveInteger,
  removeTotalItems
} from "./trackerService.utils.js";

export async function createWater(
  userId,
  waterData
) {
  if (
    waterData.waterContainerId
  ) {
    const container =
      await findWaterContainerById(
        userId,
        waterData.waterContainerId
      );

    if (!container) {
      throw new AppError(
        "Water container not found",
        404
      );
    }
  }

  return createWaterLog(
    userId,
    waterData
  );
}

export async function getWaterById(
  userId,
  waterLogId,
  includeDeleted = false
) {
  const waterLog =
    await findWaterLogById(
      userId,
      waterLogId,
      includeDeleted
    );

  if (!waterLog) {
    throw new AppError(
      "Water log not found",
      404
    );
  }

  return waterLog;
}

export async function getWaterLogs(
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
      50
    );

  const rows =
    await findWaterLogsByUserId(
      userId,
      {
        startDate:
          query.startDate,
        endDate:
          query.endDate,
        waterContainerId:
          query.waterContainerId,
        page,
        limit,
        sortOrder:
          query.sortOrder
      }
    );

  return {
    waterLogs:
      removeTotalItems(rows),
    pagination:
      buildPagination(
        rows,
        page,
        limit
      )
  };
}

export async function getWaterTotal(
  userId,
  startOfDay,
  endOfDay
) {
  const [
    total,
    settings
  ] = await Promise.all([
    findWaterTotalForDate(
      userId,
      startOfDay,
      endOfDay
    ),
    getTrackerSettings(
      userId
    )
  ]);

  const goalMl =
    Number(
      settings.daily_water_goal_ml
    );

  const totalMl =
    Number(
      total.total_amount_ml
    );

  return {
    totalAmountMl:
      totalMl,
    totalLogs:
      Number(total.total_logs),
    dailyGoalMl:
      goalMl,
    remainingAmountMl:
      Math.max(
        goalMl - totalMl,
        0
      ),
    progressPercentage:
      goalMl > 0
        ? Math.min(
            Math.round(
              (
                totalMl /
                goalMl
              ) * 100
            ),
            100
          )
        : 0
  };
}

export async function updateWater(
  userId,
  waterLogId,
  waterData
) {
  if (
    waterData.waterContainerId
  ) {
    const container =
      await findWaterContainerById(
        userId,
        waterData.waterContainerId
      );

    if (!container) {
      throw new AppError(
        "Water container not found",
        404
      );
    }
  }

  const updatedLog =
    await updateWaterLogById(
      userId,
      waterLogId,
      waterData
    );

  if (!updatedLog) {
    throw new AppError(
      "Water log not found",
      404
    );
  }

  return updatedLog;
}

export async function softDeleteWater(
  userId,
  waterLogId
) {
  const deletedLog =
    await softDeleteWaterLogById(
      userId,
      waterLogId
    );

  if (!deletedLog) {
    throw new AppError(
      "Water log not found",
      404
    );
  }

  return deletedLog;
}

export async function restoreWater(
  userId,
  waterLogId
) {
  const restoredLog =
    await restoreWaterLogById(
      userId,
      waterLogId
    );

  if (!restoredLog) {
    throw new AppError(
      "Deleted water log not found",
      404
    );
  }

  return restoredLog;
}

export async function permanentlyDeleteWater(
  userId,
  waterLogId
) {
  const deletedLog =
    await permanentlyDeleteWaterLogById(
      userId,
      waterLogId
    );

  if (!deletedLog) {
    throw new AppError(
      "Water log not found",
      404
    );
  }

  return deletedLog;
}

export async function createContainer(
  userId,
  containerData
) {
  return createWaterContainer(
    userId,
    containerData
  );
}

export async function getWaterContainers(
  userId,
  query = {}
) {
  return findWaterContainersByUserId(
    userId,
    parseBooleanQuery(
      query.includeInactive
    ) ?? false
  );
}

export async function getWaterContainerById(
  userId,
  waterContainerId
) {
  const container =
    await findWaterContainerById(
      userId,
      waterContainerId
    );

  if (!container) {
    throw new AppError(
      "Water container not found",
      404
    );
  }

  return container;
}

export async function updateContainer(
  userId,
  waterContainerId,
  containerData
) {
  const updatedContainer =
    await updateWaterContainerById(
      userId,
      waterContainerId,
      containerData
    );

  if (!updatedContainer) {
    throw new AppError(
      "Water container not found",
      404
    );
  }

  return updatedContainer;
}

export async function softDeleteContainer(
  userId,
  waterContainerId
) {
  const deletedContainer =
    await softDeleteWaterContainerById(
      userId,
      waterContainerId
    );

  if (!deletedContainer) {
    throw new AppError(
      "Water container not found",
      404
    );
  }

  return deletedContainer;
}
