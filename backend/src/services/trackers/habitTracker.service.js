import {
  createHabit,
  findActiveHabitsForDate,
  findHabitById,
  findHabitsByUserId,
  pauseHabitById,
  permanentlyDeleteHabitById,
  restoreHabitById,
  resumeHabitById,
  softDeleteHabitById,
  updateHabitById
} from "../../models/trackers/habitTracker.model.js";

import AppError from "../../utils/AppError.js";

import {
  buildPagination,
  parseBooleanQuery,
  parsePositiveInteger,
  removeTotalItems
} from "./trackerService.utils.js";

import {
  requestImmediateNotificationCheck
} from "../notification/notificationScheduler.service.js";

/*
|--------------------------------------------------------------------------
| Create Habit
|--------------------------------------------------------------------------
*/

export async function createHabitRecord(
  userId,
  habitData
) {
  const createdHabit =
    await createHabit(
      userId,
      habitData
    );

  /*
  |--------------------------------------------------------------------------
  | Habit Reminder → Notification System
  |--------------------------------------------------------------------------
  |
  | If Daily Reminder is enabled, tell the notification scheduler to
  | immediately re-check reminders.
  |
  | This does NOT send the reminder before its configured time.
  | It simply makes sure the newly-created reminder is picked up without
  | waiting unnecessarily.
  |
  */

  if (
    createdHabit?.reminder_enabled &&
    createdHabit?.reminder_time
  ) {
    try {
      requestImmediateNotificationCheck();
    } catch (error) {
      /*
       * Notification scheduler failure should NEVER stop habit creation.
       */

      console.error(
        "Unable to refresh habit notification scheduler after habit creation:",
        error?.message ||
          error
      );
    }
  }

  return createdHabit;
}

/*
|--------------------------------------------------------------------------
| Get Habit By ID
|--------------------------------------------------------------------------
*/

export async function getHabitById(
  userId,
  habitId,
  includeDeleted = false
) {
  const habit =
    await findHabitById(
      userId,
      habitId,
      includeDeleted
    );

  if (!habit) {
    throw new AppError(
      "Habit not found",
      404
    );
  }

  return habit;
}

/*
|--------------------------------------------------------------------------
| Get Habits
|--------------------------------------------------------------------------
*/

export async function getHabits(
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
    await findHabitsByUserId(
      userId,
      {
        category:
          query.category,

        trackingType:
          query.trackingType,

        frequencyType:
          query.frequencyType,

        isActive:
          parseBooleanQuery(
            query.isActive
          ),

        search:
          query.search,

        page,

        limit,

        sortOrder:
          query.sortOrder
      }
    );

  return {
    habits:
      removeTotalItems(
        rows
      ),

    pagination:
      buildPagination(
        rows,
        page,
        limit
      )
  };
}

/*
|--------------------------------------------------------------------------
| Get Habits For Date
|--------------------------------------------------------------------------
*/

export async function getHabitsForDate(
  userId,
  date
) {
  return findActiveHabitsForDate(
    userId,
    date
  );
}

/*
|--------------------------------------------------------------------------
| Update Habit
|--------------------------------------------------------------------------
*/

export async function updateHabitRecord(
  userId,
  habitId,
  habitData
) {
  /*
   * Verify that the habit exists
   * and belongs to this user.
   */

  await getHabitById(
    userId,
    habitId
  );

  const updatedHabit =
    await updateHabitById(
      userId,
      habitId,
      habitData
    );

  if (!updatedHabit) {
    throw new AppError(
      "Habit not found",
      404
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Updated Habit Reminder → Notification System
  |--------------------------------------------------------------------------
  |
  | This covers:
  |
  | - Turning Daily Reminder ON
  | - Changing reminder time
  | - Changing daily/custom frequency
  | - Editing an existing habit with a reminder
  |
  |--------------------------------------------------------------------------
  */

  if (
    updatedHabit?.reminder_enabled &&
    updatedHabit?.reminder_time
  ) {
    try {
      requestImmediateNotificationCheck();
    } catch (error) {
      console.error(
        "Unable to refresh habit notification scheduler after habit update:",
        error?.message ||
          error
      );
    }
  }

  return updatedHabit;
}

/*
|--------------------------------------------------------------------------
| Pause Habit
|--------------------------------------------------------------------------
*/

export async function pauseHabit(
  userId,
  habitId
) {
  const pausedHabit =
    await pauseHabitById(
      userId,
      habitId
    );

  if (!pausedHabit) {
    throw new AppError(
      "Habit not found",
      404
    );
  }

  return pausedHabit;
}

/*
|--------------------------------------------------------------------------
| Resume Habit
|--------------------------------------------------------------------------
*/

export async function resumeHabit(
  userId,
  habitId
) {
  const resumedHabit =
    await resumeHabitById(
      userId,
      habitId
    );

  if (!resumedHabit) {
    throw new AppError(
      "Habit not found",
      404
    );
  }

  /*
   * If the resumed habit has an active reminder,
   * immediately refresh the scheduler as well.
   */

  if (
    resumedHabit?.reminder_enabled &&
    resumedHabit?.reminder_time
  ) {
    try {
      requestImmediateNotificationCheck();
    } catch (error) {
      console.error(
        "Unable to refresh habit notification scheduler after habit resume:",
        error?.message ||
          error
      );
    }
  }

  return resumedHabit;
}

/*
|--------------------------------------------------------------------------
| Soft Delete Habit
|--------------------------------------------------------------------------
*/

export async function softDeleteHabit(
  userId,
  habitId
) {
  const deletedHabit =
    await softDeleteHabitById(
      userId,
      habitId
    );

  if (!deletedHabit) {
    throw new AppError(
      "Habit not found",
      404
    );
  }

  return deletedHabit;
}

/*
|--------------------------------------------------------------------------
| Restore Habit
|--------------------------------------------------------------------------
*/

export async function restoreHabit(
  userId,
  habitId
) {
  const restoredHabit =
    await restoreHabitById(
      userId,
      habitId
    );

  if (!restoredHabit) {
    throw new AppError(
      "Deleted habit not found",
      404
    );
  }

  /*
   * A restored habit may already have Daily Reminder enabled.
   * Refresh the scheduler so it becomes active again immediately.
   */

  if (
    restoredHabit?.reminder_enabled &&
    restoredHabit?.reminder_time
  ) {
    try {
      requestImmediateNotificationCheck();
    } catch (error) {
      console.error(
        "Unable to refresh habit notification scheduler after habit restore:",
        error?.message ||
          error
      );
    }
  }

  return restoredHabit;
}

/*
|--------------------------------------------------------------------------
| Permanently Delete Habit
|--------------------------------------------------------------------------
*/

export async function permanentlyDeleteHabit(
  userId,
  habitId
) {
  const deletedHabit =
    await permanentlyDeleteHabitById(
      userId,
      habitId
    );

  if (!deletedHabit) {
    throw new AppError(
      "Habit not found",
      404
    );
  }

  return deletedHabit;
}