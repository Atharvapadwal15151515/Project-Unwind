import pool from "../../config/database.js";

import {
  notifyDailyTracker,
  notifyHabitReminder
} from "./dailyTrackerNotification.service.js";

/*
|--------------------------------------------------------------------------
| Scheduler Configuration
|--------------------------------------------------------------------------
*/

const DEFAULT_TIMEZONE =
  "Asia/Kolkata";

const POLL_INTERVAL_MS =
  30 * 1000;

const DUE_WINDOW_MINUTES =
  10;

/*
|--------------------------------------------------------------------------
| Missed Notification Recovery Window
|--------------------------------------------------------------------------
|
| Normal reminders are delivered inside the first 10 minutes.
|
| If the backend was sleeping/restarting/unavailable, the scheduler can
| recover that notification for up to 6 hours.
|
|--------------------------------------------------------------------------
*/

const MISSED_RECOVERY_WINDOW_MINUTES =
  6 * 60;

const ADVISORY_LOCK_KEY =
  90316003;

/*
|--------------------------------------------------------------------------
| Automatic Daily Tracker Times
|--------------------------------------------------------------------------
*/

const DAILY_TRACKER_SCHEDULE = {
  sleep:
    "09:00",

  energy:
    "10:00",

  water:
    "13:00",

  mood:
    "22:00"
};

let schedulerTimer =
  null;

let schedulerRunning =
  false;

/*
|--------------------------------------------------------------------------
| Normalize Time
|--------------------------------------------------------------------------
*/

function normalizeTime(
  value
) {
  const match =
    String(
      value ||
        ""
    ).match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return null;
  }

  const hour =
    Number(
      match[1]
    );

  const minute =
    Number(
      match[2]
    );

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return {
    hour,

    minute,

    minutes:
      hour * 60 +
      minute
  };
}

/*
|--------------------------------------------------------------------------
| Safe Timezone
|--------------------------------------------------------------------------
*/

function getSafeTimezone(
  timezone
) {
  const candidate =
    String(
      timezone ||
        DEFAULT_TIMEZONE
    ).trim();

  try {
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          candidate
      }
    ).format(
      new Date()
    );

    return candidate;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/*
|--------------------------------------------------------------------------
| Zoned Date Parts
|--------------------------------------------------------------------------
*/

function getZonedParts(
  date,
  timezone
) {
  const safeTimezone =
    getSafeTimezone(
      timezone
    );

  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          safeTimezone,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        weekday:
          "short",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hourCycle:
          "h23"
      }
    );

  const parts =
    Object.fromEntries(
      formatter
        .formatToParts(
          date
        )
        .filter(
          part =>
            part.type !==
            "literal"
        )
        .map(
          part => [
            part.type,
            part.value
          ]
        )
    );

  const weekdayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return {
    year:
      Number(
        parts.year
      ),

    month:
      Number(
        parts.month
      ),

    day:
      Number(
        parts.day
      ),

    hour:
      Number(
        parts.hour
      ),

    minute:
      Number(
        parts.minute
      ),

    weekday:
      weekdayMap[
        parts.weekday
      ] ?? 0
  };
}

/*
|--------------------------------------------------------------------------
| Normalize PostgreSQL Date
|--------------------------------------------------------------------------
|
| pg may return DATE fields as JavaScript Date objects.
|
| Example:
|
| 2026-08-16
|
| may arrive as:
|
| 2026-08-15T18:30:00.000Z
|
| which is still 2026-08-16 in India.
|
|--------------------------------------------------------------------------
*/

function normalizeDatabaseDate(
  value,
  timezone
) {
  if (!value) {
    return null;
  }

  /*
   * Already YYYY-MM-DD
   */

  if (
    typeof value ===
      "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(
      value
    )
  ) {
    return value.slice(
      0,
      10
    );
  }

  const parsedDate =
    value instanceof Date
      ? value
      : new Date(
          value
        );

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return null;
  }

  const parts =
    getZonedParts(
      parsedDate,
      timezone
    );

  return [
    parts.year,

    String(
      parts.month
    ).padStart(
      2,
      "0"
    ),

    String(
      parts.day
    ).padStart(
      2,
      "0"
    )
  ].join("-");
}

/*
|--------------------------------------------------------------------------
| Get Reminder Occurrence Context
|--------------------------------------------------------------------------
*/

function getOccurrenceContext({
  now,
  timezone,
  reminderTime
}) {
  const reminder =
    normalizeTime(
      reminderTime
    );

  if (!reminder) {
    return null;
  }

  const safeTimezone =
    getSafeTimezone(
      timezone
    );

  const nowParts =
    getZonedParts(
      now,
      safeTimezone
    );

  const nowMinutes =
    nowParts.hour *
      60 +
    nowParts.minute;

  /*
  |--------------------------------------------------------------------------
  | How Late Is This Scheduler Tick?
  |--------------------------------------------------------------------------
  |
  | Circular comparison makes this safe around midnight.
  |
  | Example:
  |
  | Reminder = 22:00
  | Current  = 00:30
  |
  | minutesLate = 150
  |
  |--------------------------------------------------------------------------
  */

  const minutesLate =
    (
      nowMinutes -
      reminder.minutes +
      1440
    ) % 1440;

  /*
  |--------------------------------------------------------------------------
  | Recovery Limit
  |--------------------------------------------------------------------------
  |
  | 0 - 9 minutes:
  |   Normal notification delivery.
  |
  | 10 minutes - 5h 59m:
  |   Missed-notification recovery.
  |
  | 6 hours or more:
  |   Too stale. Do not deliver it.
  |
  |--------------------------------------------------------------------------
  */

  if (
    minutesLate >=
    MISSED_RECOVERY_WINDOW_MINUTES
  ) {
    return null;
  }

  /*
   * Work backwards from now to determine
   * the actual scheduled occurrence.
   */

  const occurrenceDate =
    new Date(
      now.getTime() -
        minutesLate *
          60 *
          1000
    );

  const occurrenceParts =
    getZonedParts(
      occurrenceDate,
      safeTimezone
    );

  const dateKey =
    [
      occurrenceParts.year,

      String(
        occurrenceParts.month
      ).padStart(
        2,
        "0"
      ),

      String(
        occurrenceParts.day
      ).padStart(
        2,
        "0"
      )
    ].join("-");

  const timeKey =
    `${String(
      reminder.hour
    ).padStart(
      2,
      "0"
    )}:${String(
      reminder.minute
    ).padStart(
      2,
      "0"
    )}`;

  return {
    dateKey,

    timeKey,

    weekday:
      occurrenceParts.weekday,

    timezone:
      safeTimezone,

    occurrenceKey:
      `${dateKey}T${timeKey}`,

    /*
     * Used by missed-notification
     * recovery.
     */

    minutesLate,

    isRecovery:
      minutesLate >=
      DUE_WINDOW_MINUTES,

    /*
     * Real instant at which this reminder
     * should originally have happened.
     */

    scheduledAt:
      occurrenceDate
  };
}

/*
|--------------------------------------------------------------------------
| Normalize Days
|--------------------------------------------------------------------------
*/

function normalizeDays(
  value
) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value.map(
      Number
    );
  }

  if (
    typeof value ===
    "string"
  ) {
    return value
      .replace(
        /[{}]/g,
        ""
      )
      .split(",")
      .filter(Boolean)
      .map(Number);
  }

  return [];
}

/*
|--------------------------------------------------------------------------
| Habit Frequency Rules
|--------------------------------------------------------------------------
*/

function isHabitScheduledForDay(
  habit,
  weekday
) {
  const frequency =
    habit.frequency_type ||
    "daily";

  if (
    frequency ===
    "daily"
  ) {
    return true;
  }

  if (
    frequency ===
    "custom"
  ) {
    return normalizeDays(
      habit.target_days
    ).includes(
      weekday
    );
  }

  if (
    frequency ===
    "weekly"
  ) {
    const targetDays =
      normalizeDays(
        habit.target_days
      );

    if (
      targetDays.length >
      0
    ) {
      return targetDays.includes(
        weekday
      );
    }

    return true;
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| Duplicate Notification Protection
|--------------------------------------------------------------------------
*/

async function alreadySent({
  userId,
  referenceType,
  referenceId,
  occurrenceKey,
  trackerType = null
}) {
  const result =
    await pool.query(
      `
        SELECT
          1

        FROM notifications n

        JOIN user_notifications un
          ON un.notification_id =
             n.notification_id

        WHERE
          un.user_id = $1

          AND n.reference_type =
              $2

          AND n.reference_id =
              $3

          AND n.metadata ->>
              'occurrence_key' =
              $4

          AND (
            $5::VARCHAR IS NULL

            OR n.metadata ->>
               'tracker_type' =
               $5
          )

        LIMIT 1
      `,
      [
        userId,
        referenceType,
        referenceId,
        occurrenceKey,
        trackerType
      ]
    );

  return (
    result.rowCount >
    0
  );
}

/*
|--------------------------------------------------------------------------
| Load Tracker Settings
|--------------------------------------------------------------------------
*/

async function loadTrackerSettings() {
  const result =
    await pool.query(
      `
        SELECT
          user_id,

          COALESCE(
            NULLIF(
              timezone,
              ''
            ),
            $1
          ) AS timezone,

          daily_water_goal_ml,

          mood_tracker_enabled,

          sleep_tracker_enabled,

          energy_tracker_enabled,

          water_tracker_enabled,

          habit_tracker_enabled

        FROM tracker_settings
      `,
      [
        DEFAULT_TIMEZONE
      ]
    );

  return result.rows;
}

/*
|--------------------------------------------------------------------------
| Load Habit Reminders
|--------------------------------------------------------------------------
*/

async function loadHabitReminders() {
  const result =
    await pool.query(
      `
        SELECT
          h.*,

          COALESCE(
            NULLIF(
              ts.timezone,
              ''
            ),
            $1
          ) AS timezone,

          COALESCE(
            ts.habit_tracker_enabled,
            TRUE
          ) AS habit_tracker_enabled

        FROM habits h

        LEFT JOIN tracker_settings ts
          ON ts.user_id =
             h.user_id

        WHERE
          h.deleted_at IS NULL

          AND h.is_active =
              TRUE

          AND h.reminder_enabled =
              TRUE

          AND h.reminder_time
              IS NOT NULL
      `,
      [
        DEFAULT_TIMEZONE
      ]
    );

  console.log(
    `🔔 Habit reminders currently enabled: ${result.rows.length}`
  );

  return result.rows;
}

/*
|--------------------------------------------------------------------------
| Daily Tracker Already Completed
|--------------------------------------------------------------------------
*/

async function trackerAlreadyCompleted({
  userId,
  trackerType,
  dateKey,
  timezone,
  dailyWaterGoalMl
}) {
  /*
  |--------------------------------------------------------------------------
  | Sleep
  |--------------------------------------------------------------------------
  */

  if (
    trackerType ===
    "sleep"
  ) {
    const result =
      await pool.query(
        `
          SELECT
            1

          FROM sleep_entries

          WHERE
            user_id = $1

            AND sleep_date =
                $2::DATE

            AND deleted_at
                IS NULL

          LIMIT 1
        `,
        [
          userId,
          dateKey
        ]
      );

    return (
      result.rowCount >
      0
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Mood
  |--------------------------------------------------------------------------
  */

  if (
    trackerType ===
    "mood"
  ) {
    const result =
      await pool.query(
        `
          SELECT
            1

          FROM mood_entries

          WHERE
            user_id = $1

            AND deleted_at
                IS NULL

            AND (
              logged_at
              AT TIME ZONE $2
            )::DATE =
            $3::DATE

          LIMIT 1
        `,
        [
          userId,
          timezone,
          dateKey
        ]
      );

    return (
      result.rowCount >
      0
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Energy
  |--------------------------------------------------------------------------
  */

  if (
    trackerType ===
    "energy"
  ) {
    const result =
      await pool.query(
        `
          SELECT
            1

          FROM energy_entries

          WHERE
            user_id = $1

            AND deleted_at
                IS NULL

            AND (
              logged_at
              AT TIME ZONE $2
            )::DATE =
            $3::DATE

          LIMIT 1
        `,
        [
          userId,
          timezone,
          dateKey
        ]
      );

    return (
      result.rowCount >
      0
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Water
  |--------------------------------------------------------------------------
  */

  if (
    trackerType ===
    "water"
  ) {
    const result =
      await pool.query(
        `
          SELECT
            COALESCE(
              SUM(
                amount_ml
              ),
              0
            )::INTEGER AS total_ml

          FROM water_logs

          WHERE
            user_id = $1

            AND deleted_at
                IS NULL

            AND (
              logged_at
              AT TIME ZONE $2
            )::DATE =
            $3::DATE
        `,
        [
          userId,
          timezone,
          dateKey
        ]
      );

    const totalMl =
      Number(
        result.rows[0]
          ?.total_ml ||
          0
      );

    const goalMl =
      Number(
        dailyWaterGoalMl ||
          2000
      );

    return (
      totalMl >=
      goalMl
    );
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| Tracker Enabled
|--------------------------------------------------------------------------
*/

function trackerIsEnabled(
  settings,
  trackerType
) {
  const fieldMap = {
    mood:
      "mood_tracker_enabled",

    sleep:
      "sleep_tracker_enabled",

    energy:
      "energy_tracker_enabled",

    water:
      "water_tracker_enabled"
  };

  const field =
    fieldMap[
      trackerType
    ];

  return (
    field &&
    settings[field] !==
      false
  );
}

/*
|--------------------------------------------------------------------------
| Process Daily Tracker Reminder
|--------------------------------------------------------------------------
*/

async function processDailyTracker(
  settings,
  trackerType,
  now
) {
  if (
    !trackerIsEnabled(
      settings,
      trackerType
    )
  ) {
    return false;
  }

  const context =
    getOccurrenceContext({
      now,

      timezone:
        settings.timezone,

      reminderTime:
        DAILY_TRACKER_SCHEDULE[
          trackerType
        ]
    });

  if (!context) {
    return false;
  }

  /*
   * Skip if today's tracker
   * entry is already complete.
   */

  if (
    await trackerAlreadyCompleted({
      userId:
        settings.user_id,

      trackerType,

      dateKey:
        context.dateKey,

      timezone:
        context.timezone,

      dailyWaterGoalMl:
        settings
          .daily_water_goal_ml
    })
  ) {
    return false;
  }

  /*
   * Prevent duplicate reminder.
   */

  if (
    await alreadySent({
      userId:
        settings.user_id,

      referenceType:
        "daily_tracker_reminder",

      referenceId:
        settings.user_id,

      occurrenceKey:
        context.occurrenceKey,

      trackerType
    })
  ) {
    return false;
  }

  const notification =
    await notifyDailyTracker({
      userId:
        settings.user_id,

      trackerType,

      occurrenceKey:
        context.occurrenceKey,

      timezone:
        context.timezone,

      metadata: {
  /*
  |--------------------------------------------------------------------------
  | Tracker-specific metadata
  |--------------------------------------------------------------------------
  */

  ...(
    trackerType ===
    "water"
      ? {
          daily_water_goal_ml:
            Number(
              settings
                .daily_water_goal_ml ||
              2000
            )
        }
      : {}
  ),

  /*
  |--------------------------------------------------------------------------
  | Missed Notification Recovery Metadata
  |--------------------------------------------------------------------------
  */

  recovery: {
    is_recovered:
      context.isRecovery,

    minutes_late:
      context.minutesLate,

    scheduled_for:
      context.occurrenceKey
  }
}
    });

  if (notification) {
  console.log(
    `✅ ${trackerType} tracker reminder ${
      context.isRecovery
        ? "recovered"
        : "sent"
    } | User: ${
      settings.user_id
    } | ${
      context.occurrenceKey
    } | ${
      context.minutesLate
    } minute(s) late`
  );
}

  return Boolean(
    notification
  );
}

/*
|--------------------------------------------------------------------------
| Habit Already Logged Today
|--------------------------------------------------------------------------
*/

async function habitAlreadyLogged({
  userId,
  habitId,
  dateKey
}) {
  const result =
    await pool.query(
      `
        SELECT
          1

        FROM habit_logs

        WHERE
          user_id = $1

          AND habit_id =
              $2

          AND log_date =
              $3::DATE

          AND deleted_at
              IS NULL

        LIMIT 1
      `,
      [
        userId,
        habitId,
        dateKey
      ]
    );

  return (
    result.rowCount >
    0
  );
}

/*
|--------------------------------------------------------------------------
| Process Habit Reminder
|--------------------------------------------------------------------------
*/

async function processHabitReminder(
  habit,
  now
) {
  if (!context) {
  return false;
}

/*
|--------------------------------------------------------------------------
| Do Not Recover A Reminder That Did Not Exist Yet
|--------------------------------------------------------------------------
|
| Example:
|
| Current time: 14:00
| Habit reminder time: 10:00
| Habit created at: 13:30
|
| Although 10:00 falls inside our recovery window,
| there was no reminder configured at 10:00.
|
| Therefore we MUST NOT recover it.
|
|--------------------------------------------------------------------------
*/

if (
  context.isRecovery
) {
  const schedulingChangedAt =
    habit.updated_at ||
    habit.created_at ||
    null;

  if (
    schedulingChangedAt
  ) {
    const changedAt =
      new Date(
        schedulingChangedAt
      );

    if (
      !Number.isNaN(
        changedAt.getTime()
      ) &&
      changedAt >
        context.scheduledAt
    ) {
      return false;
    }
  }
}

/*
|--------------------------------------------------------------------------
| Frequency
|--------------------------------------------------------------------------
*/

  /*
   * Uses the exact Daily Reminder time
   * selected by the user.
   */

  const context =
    getOccurrenceContext({
      now,

      timezone:
        habit.timezone,

      reminderTime:
        habit.reminder_time
    });

  if (!context) {
    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | Frequency
  |--------------------------------------------------------------------------
  */

  if (
    !isHabitScheduledForDay(
      habit,
      context.weekday
    )
  ) {
    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | Start / End Date
  |--------------------------------------------------------------------------
  */

  const startDate =
    normalizeDatabaseDate(
      habit.start_date,
      context.timezone
    );

  const endDate =
    normalizeDatabaseDate(
      habit.end_date,
      context.timezone
    );

  if (
    startDate &&
    context.dateKey <
      startDate
  ) {
    console.log(
      "⏭️ Habit reminder skipped — habit has not started yet:",
      {
        habit:
          habit.habit_name,

        today:
          context.dateKey,

        startDate
      }
    );

    return false;
  }

  if (
    endDate &&
    context.dateKey >
      endDate
  ) {
    console.log(
      "⏭️ Habit reminder skipped — habit has ended:",
      {
        habit:
          habit.habit_name,

        today:
          context.dateKey,

        endDate
      }
    );

    return false;
  }

  console.log(
    "✅ HABIT DATE CHECK PASSED:",
    {
      habit:
        habit.habit_name,

      today:
        context.dateKey,

      startDate,

      endDate
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Already Completed / Skipped
  |--------------------------------------------------------------------------
  */

  if (
    await habitAlreadyLogged({
      userId:
        habit.user_id,

      habitId:
        habit.habit_id,

      dateKey:
        context.dateKey
    })
  ) {
    console.log(
      `⏭️ Habit reminder skipped because "${habit.habit_name}" already has a log for ${context.dateKey}`
    );

    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | Duplicate Notification Protection
  |--------------------------------------------------------------------------
  */

  if (
    await alreadySent({
      userId:
        habit.user_id,

      referenceType:
        "habit_reminder",

      referenceId:
        habit.habit_id,

      occurrenceKey:
        context.occurrenceKey
    })
  ) {
    console.log(
      `⏭️ Habit reminder already sent | ${habit.habit_name} | ${context.occurrenceKey}`
    );

    return false;
  }

  /*
  |--------------------------------------------------------------------------
  | Create Notification
  |--------------------------------------------------------------------------
  */

  const notification =
  await notifyHabitReminder({
    userId:
      habit.user_id,

    habit,

    occurrenceKey:
      context.occurrenceKey,

    timezone:
      context.timezone,

    recovery: {
      isRecovered:
        context.isRecovery,

      minutesLate:
        context.minutesLate,

      scheduledFor:
        context.occurrenceKey
    }
  });

  if (notification) {
  console.log(
    `✅ Habit reminder ${
      context.isRecovery
        ? "recovered"
        : "sent"
    } | ${
      habit.habit_name
    } | User: ${
      habit.user_id
    } | ${
      context.occurrenceKey
    } | ${
      context.minutesLate
    } minute(s) late`
  );
} else {
    console.error(
      `❌ Habit reminder notification creation failed | ${habit.habit_name}`
    );
  }

  return Boolean(
    notification
  );
}

/*
|--------------------------------------------------------------------------
| Process Due Notifications
|--------------------------------------------------------------------------
*/

export async function processDueNotifications() {
  const client =
    await pool.connect();

  let hasLock =
    false;

  try {
    /*
    |--------------------------------------------------------------------------
    | PostgreSQL Multi-instance Lock
    |--------------------------------------------------------------------------
    */

    const lockResult =
      await client.query(
        `
          SELECT
            pg_try_advisory_lock(
              $1
            ) AS locked
        `,
        [
          ADVISORY_LOCK_KEY
        ]
      );

    hasLock =
      Boolean(
        lockResult
          .rows[0]
          ?.locked
      );

    if (!hasLock) {
      return {
        skipped:
          true,

        sent:
          0
      };
    }

    const now =
      new Date();

    const [
      trackerSettings,
      habitReminders
    ] =
      await Promise.all([
        loadTrackerSettings(),
        loadHabitReminders()
      ]);

    let sent =
      0;

    /*
    |--------------------------------------------------------------------------
    | Mood / Sleep / Energy / Water
    |--------------------------------------------------------------------------
    */

    for (
      const settings of
      trackerSettings
    ) {
      for (
        const trackerType of
        Object.keys(
          DAILY_TRACKER_SCHEDULE
        )
      ) {
        try {
          const wasSent =
            await processDailyTracker(
              settings,
              trackerType,
              now
            );

          if (wasSent) {
            sent += 1;
          }
        } catch (error) {
          console.error(
            `${trackerType} daily reminder processing failed:`,
            error?.message ||
              error
          );
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Habit Reminders
    |--------------------------------------------------------------------------
    */

    for (
      const habit of
      habitReminders
    ) {
      try {
        const wasSent =
          await processHabitReminder(
            habit,
            now
          );

        if (wasSent) {
          sent += 1;
        }
      } catch (error) {
        console.error(
          `Habit reminder processing failed for "${habit.habit_name}":`,
          error?.message ||
            error
        );
      }
    }

    return {
      skipped:
        false,

      sent
    };
  } finally {
    /*
    |--------------------------------------------------------------------------
    | Release PostgreSQL Advisory Lock
    |--------------------------------------------------------------------------
    */

    if (hasLock) {
      try {
        await client.query(
          `
            SELECT
              pg_advisory_unlock(
                $1
              )
          `,
          [
            ADVISORY_LOCK_KEY
          ]
        );
      } catch (error) {
        console.error(
          "Notification scheduler lock release failed:",
          error?.message ||
            error
        );
      }
    }

    client.release();
  }
}

/*
|--------------------------------------------------------------------------
| Scheduler Tick
|--------------------------------------------------------------------------
*/

async function runSchedulerTick() {
  if (
    schedulerRunning
  ) {
    return;
  }

  schedulerRunning =
    true;

  try {
    const result =
      await processDueNotifications();

    if (
      result?.sent >
      0
    ) {
      console.log(
        `🔔 Notification scheduler delivered ${result.sent} notification(s).`
      );
    }
  } catch (error) {
    console.error(
      "Notification scheduler tick failed:",
      error?.message ||
        error
    );
  } finally {
    schedulerRunning =
      false;
  }
}

/*
|--------------------------------------------------------------------------
| Immediate Scheduler Refresh
|--------------------------------------------------------------------------
|
| Called after a habit is created, updated or restored.
|
| It DOES NOT send the reminder early.
| It simply checks whether anything is currently due.
|
|--------------------------------------------------------------------------
*/

export function requestImmediateNotificationCheck() {
  setTimeout(
    () => {
      runSchedulerTick()
        .catch(
          error => {
            console.error(
              "Immediate notification check failed:",
              error?.message ||
                error
            );
          }
        );
    },
    100
  );
}

/*
|--------------------------------------------------------------------------
| Start Scheduler
|--------------------------------------------------------------------------
*/

export function startNotificationScheduler() {
  if (
    schedulerTimer
  ) {
    return;
  }

  /*
   * Check once immediately when
   * the backend starts.
   */

  runSchedulerTick()
    .catch(
      error => {
        console.error(
          "Initial notification scheduler check failed:",
          error?.message ||
            error
        );
      }
    );

  /*
   * Then every 30 seconds.
   */

  schedulerTimer =
    setInterval(
      () => {
        runSchedulerTick()
          .catch(
            error => {
              console.error(
                "Scheduled notification check failed:",
                error?.message ||
                  error
              );
            }
          );
      },
      POLL_INTERVAL_MS
    );

  schedulerTimer
    .unref?.();

  console.log(
    "✅ Daily tracker notification scheduler started."
  );
}

/*
|--------------------------------------------------------------------------
| Stop Scheduler
|--------------------------------------------------------------------------
*/

export function stopNotificationScheduler() {
  if (
    !schedulerTimer
  ) {
    return;
  }

  clearInterval(
    schedulerTimer
  );

  schedulerTimer =
    null;

  console.log(
    "Daily tracker notification scheduler stopped."
  );
}