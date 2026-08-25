import {
  getIO
} from "../../config/socket.js";

import {
  createNotification
} from "./notification.service.js";

export const NOTIFICATION_SOCKET_EVENT =
  "notification:new";

/*
|--------------------------------------------------------------------------
| Realtime Notification
|--------------------------------------------------------------------------
*/

function emitRealtimeNotification(
  userId,
  notification
) {
  try {
    getIO()
      .to(
        `user:${userId}`
      )
      .emit(
        NOTIFICATION_SOCKET_EVENT,
        {
          notification
        }
      );
  } catch (error) {
    console.error(
      "Unable to emit wellness notification:",
      error?.message ||
        error
    );
  }
}

/*
|--------------------------------------------------------------------------
| Tracker Notification Copy
|--------------------------------------------------------------------------
*/

function getTrackerCopy(
  trackerType,
  reminderName
) {
  const customName =
    String(
      reminderName ||
        ""
    ).trim();

  const config = {
    mood: {
      title:
        customName ||
        "Time for a mood check-in",

      message:
        "Take a quiet moment to notice how you are feeling today.",

      iconName:
        "smile",

      actionUrl:
        "/dashboard/trackers?tracker=mood"
    },

    sleep: {
      title:
        customName ||
        "Sleep check-in",

      message:
        "A gentle reminder to log your sleep and notice how rested you feel.",

      iconName:
        "moon",

      actionUrl:
        "/dashboard/trackers?tracker=sleep"
    },

    energy: {
      title:
        customName ||
        "Energy check-in",

      message:
        "Take a moment to check in with your energy level.",

      iconName:
        "battery-medium",

      actionUrl:
        "/dashboard/trackers?tracker=energy"
    },

    water: {
      title:
        customName ||
        "Hydration reminder",

      message:
        "A gentle nudge to drink some water and log your hydration.",

      iconName:
        "droplets",

      actionUrl:
        "/dashboard/trackers?tracker=water"
    }
  };

  return (
    config[
      trackerType
    ] || {
      title:
        customName ||
        "Wellness reminder",

      message:
        "You have a wellness check-in waiting for you.",

      iconName:
        "bell",

      actionUrl:
        "/dashboard/trackers"
    }
  );
}

/*
|--------------------------------------------------------------------------
| Tracker Reminder Notification
|--------------------------------------------------------------------------
*/

export async function notifyTrackerReminder({
  userId,
  reminder,
  occurrenceKey
}) {
  if (
    !userId ||
    !reminder
      ?.tracker_reminder_id
  ) {
    return null;
  }

  const trackerType =
    reminder
      .tracker_type ||
    "tracker";

  const copy =
    getTrackerCopy(
      trackerType,
      reminder
        .reminder_name
    );

  try {
    const notification =
      await createNotification(
        null,
        {
          title:
            copy.title,

          message:
            copy.message,

          notificationType:
            [
              "mood",
              "sleep",
              "energy",
              "water"
            ].includes(
              trackerType
            )
              ? trackerType
              : "tracker",

          audienceType:
            "individual",

          priority:
            "normal",

          iconName:
            copy.iconName,

          actionUrl:
            copy.actionUrl,

          referenceType:
            "tracker_reminder",

          referenceId:
            reminder
              .tracker_reminder_id,

          metadata: {
            source:
              "tracker_reminder",

            occurrence_key:
              occurrenceKey,

            tracker_type:
              trackerType,

            reminder_name:
              reminder
                .reminder_name ||
              null,

            reminder_time:
              reminder
                .reminder_time,

            frequency_type:
              reminder
                .frequency_type,

            timezone:
              reminder
                .timezone ||
              "UTC"
          },

          userIds: [
            userId
          ]
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Realtime Delivery
    |--------------------------------------------------------------------------
    */

    emitRealtimeNotification(
      userId,
      notification
    );

    return notification;
  } catch (error) {
    /*
     * Reminder notification failure
     * must never break the rest
     * of the scheduler.
     */

    console.error(
      "Tracker reminder notification failed:",
      error?.message ||
        error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Habit Reminder Notification
|--------------------------------------------------------------------------
*/

export async function notifyHabitReminder({
  userId,
  habit,
  occurrenceKey
}) {
  if (
    !userId ||
    !habit?.habit_id
  ) {
    return null;
  }

  const habitName =
    String(
      habit.habit_name ||
        "your habit"
    ).trim();

  try {
    const notification =
      await createNotification(
        null,
        {
          title:
            `Gentle reminder: ${habitName}`,

          message:
            habit.description
              ? String(
                  habit.description
                ).trim()
              : "A small step still counts. Check in with this habit when you are ready.",

          notificationType:
            "habit",

          audienceType:
            "individual",

          priority:
            "normal",

          iconName:
            "circle-check-big",

          actionUrl:
            "/dashboard/trackers?tracker=habits",

          referenceType:
            "habit_reminder",

          referenceId:
            habit.habit_id,

          metadata: {
            source:
              "habit_reminder",

            occurrence_key:
              occurrenceKey,

            habit_id:
              habit.habit_id,

            habit_name:
              habit.habit_name,

            reminder_time:
              habit.reminder_time,

            frequency_type:
              habit.frequency_type,

            timezone:
              habit.timezone ||
              "UTC"
          },

          userIds: [
            userId
          ]
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Realtime Delivery
    |--------------------------------------------------------------------------
    */

    emitRealtimeNotification(
      userId,
      notification
    );

    return notification;
  } catch (error) {
    console.error(
      "Habit reminder notification failed:",
      error?.message ||
        error
    );

    return null;
  }
}