import {
  createTrackerReminder,
  findTrackerReminderById,
  findTrackerRemindersByUserId,
  permanentlyDeleteTrackerReminderById,
  restoreTrackerReminderById,
  softDeleteTrackerReminderById,
  updateTrackerReminderById
} from "../../models/trackers/trackerReminder.model.js";

import AppError from "../../utils/AppError.js";

export async function createReminder(
  userId,
  reminderData
) {
  return createTrackerReminder(
    userId,
    reminderData
  );
}

export async function getReminderById(
  userId,
  trackerReminderId,
  includeDeleted = false
) {
  const reminder =
    await findTrackerReminderById(
      userId,
      trackerReminderId,
      includeDeleted
    );

  if (!reminder) {
    throw new AppError(
      "Tracker reminder not found",
      404
    );
  }

  return reminder;
}

export async function getReminders(
  userId,
  trackerType = null
) {
  return findTrackerRemindersByUserId(
    userId,
    trackerType
  );
}

export async function updateReminder(
  userId,
  trackerReminderId,
  reminderData
) {
  const updatedReminder =
    await updateTrackerReminderById(
      userId,
      trackerReminderId,
      reminderData
    );

  if (!updatedReminder) {
    throw new AppError(
      "Tracker reminder not found",
      404
    );
  }

  return updatedReminder;
}

export async function softDeleteReminder(
  userId,
  trackerReminderId
) {
  const deletedReminder =
    await softDeleteTrackerReminderById(
      userId,
      trackerReminderId
    );

  if (!deletedReminder) {
    throw new AppError(
      "Tracker reminder not found",
      404
    );
  }

  return deletedReminder;
}

export async function restoreReminder(
  userId,
  trackerReminderId
) {
  const restoredReminder =
    await restoreTrackerReminderById(
      userId,
      trackerReminderId
    );

  if (!restoredReminder) {
    throw new AppError(
      "Deleted tracker reminder not found",
      404
    );
  }

  return restoredReminder;
}

export async function permanentlyDeleteReminder(
  userId,
  trackerReminderId
) {
  const deletedReminder =
    await permanentlyDeleteTrackerReminderById(
      userId,
      trackerReminderId
    );

  if (!deletedReminder) {
    throw new AppError(
      "Tracker reminder not found",
      404
    );
  }

  return deletedReminder;
}
