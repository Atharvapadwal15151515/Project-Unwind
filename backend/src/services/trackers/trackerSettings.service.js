import {
  createDefaultTrackerSettings,
  findTrackerSettingsByUserId,
  updateTrackerSettingsByUserId
} from "../../models/trackers/trackerSettings.model.js";

import AppError from "../../utils/AppError.js";

export async function getTrackerSettings(
  userId
) {
  let settings =
    await findTrackerSettingsByUserId(
      userId
    );

  if (!settings) {
    settings =
      await createDefaultTrackerSettings(
        userId
      );
  }

  return settings;
}

export async function updateTrackerSettings(
  userId,
  settingsData
) {
  await getTrackerSettings(userId);

  const updatedSettings =
    await updateTrackerSettingsByUserId(
      userId,
      settingsData
    );

  if (!updatedSettings) {
    throw new AppError(
      "Tracker settings could not be updated",
      500
    );
  }

  return updatedSettings;
}
