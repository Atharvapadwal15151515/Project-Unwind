import {
  findActiveSleepFactors,
  findAvailableTrackerActivities,
  findAvailableTrackerEmotions,
  findSleepFactorById,
  findTrackerActivityById,
  findTrackerEmotionById
} from "../../models/trackers/trackerMetadata.model.js";

import AppError from "../../utils/AppError.js";

export async function getTrackerMetadata(
  userId
) {
  const [
    emotions,
    activities,
    sleepFactors
  ] = await Promise.all([
    findAvailableTrackerEmotions(
      userId
    ),
    findAvailableTrackerActivities(
      userId
    ),
    findActiveSleepFactors()
  ]);

  return {
    emotions,
    activities,
    sleepFactors
  };
}

export async function getTrackerEmotions(
  userId
) {
  return findAvailableTrackerEmotions(
    userId
  );
}

export async function getTrackerActivities(
  userId
) {
  return findAvailableTrackerActivities(
    userId
  );
}

export async function getSleepFactors() {
  return findActiveSleepFactors();
}

export async function validateEmotionIds(
  userId,
  emotionIds = []
) {
  const uniqueIds = [
    ...new Set(emotionIds)
  ];

  for (
    const emotionId of uniqueIds
  ) {
    const emotion =
      await findTrackerEmotionById(
        userId,
        emotionId
      );

    if (!emotion) {
      throw new AppError(
        `Tracker emotion not found: ${emotionId}`,
        404
      );
    }
  }

  return uniqueIds;
}

export async function validateActivityIds(
  userId,
  activityIds = []
) {
  const uniqueIds = [
    ...new Set(activityIds)
  ];

  for (
    const activityId of uniqueIds
  ) {
    const activity =
      await findTrackerActivityById(
        userId,
        activityId
      );

    if (!activity) {
      throw new AppError(
        `Tracker activity not found: ${activityId}`,
        404
      );
    }
  }

  return uniqueIds;
}

export async function validateSleepFactors(
  factors = []
) {
  const factorIds =
    factors.map(
      (factor) =>
        factor.sleepFactorId
    );

  if (
    new Set(factorIds).size !==
    factorIds.length
  ) {
    throw new AppError(
      "Sleep factors cannot contain duplicate IDs",
      400
    );
  }

  for (
    const factor of factors
  ) {
    const existingFactor =
      await findSleepFactorById(
        factor.sleepFactorId
      );

    if (!existingFactor) {
      throw new AppError(
        `Sleep factor not found: ${factor.sleepFactorId}`,
        404
      );
    }
  }

  return factors;
}
