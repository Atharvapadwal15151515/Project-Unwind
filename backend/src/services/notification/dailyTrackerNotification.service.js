import {
  getIO
} from "../../config/socket.js";

import {
  createNotification
} from "./notification.service.js";

export const NOTIFICATION_SOCKET_EVENT =
  "notification:new";

const TRACKER_COPY = {
  sleep: {
    title:
      "Good morning — how did you sleep?",

    message:
      "Take a moment to log last night's sleep and notice how rested you feel.",

    iconName:
      "moon",

    actionUrl:
      "/dashboard/trackers",

    priority:
      "normal"
  },

  energy: {
    title:
      "Morning energy check-in",

    message:
      "How is your energy feeling today? A quick check-in can help you understand your day better.",

    iconName:
      "battery-medium",

    actionUrl:
      "/dashboard/trackers",

    priority:
      "normal"
  },

  water: {
    title:
      "A gentle hydration reminder",

    message:
      "You're still working toward today's water goal. Take a sip and log it when you can.",

    iconName:
      "droplets",

    actionUrl:
      "/dashboard/trackers",

    priority:
      "normal"
  },

  mood: {
    title:
      "Evening mood check-in",

    message:
      "Before the day ends, take a moment to notice how you're feeling and log your mood.",

    iconName:
      "smile",

    actionUrl:
      "/dashboard/trackers",

    priority:
      "normal"
  }
};

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
      "Unable to emit tracker notification:",
      error?.message ||
        error
    );
  }
}

export async function notifyDailyTracker({
  userId,
  trackerType,
  occurrenceKey,
  timezone,
  metadata = {}
}) {
  const copy =
    TRACKER_COPY[
      trackerType
    ];

  if (
    !userId ||
    !copy
  ) {
    return null;
  }

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
            trackerType,

          audienceType:
            "individual",

          priority:
            copy.priority,

          iconName:
            copy.iconName,

          actionUrl:
            copy.actionUrl,

          referenceType:
            "daily_tracker_reminder",

          referenceId:
            userId,

          metadata: {
            source:
              "daily_tracker_reminder",

            tracker_type:
              trackerType,

            occurrence_key:
              occurrenceKey,

            timezone,

            ...metadata
          },

          userIds: [
            userId
          ]
        }
      );

    emitRealtimeNotification(
      userId,
      notification
    );

    return notification;
  } catch (error) {
    console.error(
      `${trackerType} tracker notification failed:`,
      error?.message ||
        error
    );

    return null;
  }
}

export async function notifyHabitReminder({
  userId,
  habit,
  occurrenceKey,
  timezone,
  recovery = {}
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
            `Habit reminder: ${habitName}`,

          message:
            habit.description
              ? String(
                  habit.description
                ).trim()
              : "A small step still counts. Check in with your habit when you're ready.",

          notificationType:
            "habit",

          audienceType:
            "individual",

          priority:
            "normal",

          iconName:
            "circle-check-big",

          actionUrl:
            "/dashboard/trackers",

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

  timezone,

  /*
  |--------------------------------------------------------------------------
  | Missed Notification Recovery
  |--------------------------------------------------------------------------
  */

  recovery: {
    is_recovered:
      Boolean(
        recovery.isRecovered
      ),

    minutes_late:
      Number(
        recovery.minutesLate ||
        0
      ),

    scheduled_for:
      recovery.scheduledFor ||
      occurrenceKey
  }
},

          userIds: [
            userId
          ]
        }
      );

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