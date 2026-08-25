import api from "./api";

/*
|--------------------------------------------------------------------------
| Date helpers
|--------------------------------------------------------------------------
*/

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getLocalDayRange(date = new Date()) {
  const start = new Date(date);

  start.setHours(0, 0, 0, 0);

  const end = new Date(start);

  end.setDate(end.getDate() + 1);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
}

/*
|--------------------------------------------------------------------------
| Tracker metadata
|--------------------------------------------------------------------------
*/

export async function getTrackerMetadata() {
  const response = await api.get(
    "/trackers/metadata"
  );

  return (
    response.data?.data?.metadata ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Tracker Notification Settings
|--------------------------------------------------------------------------
*/

export async function initializeTrackerNotificationSettings() {
  const response =
    await api.get(
      "/trackers/settings"
    );

  let settings =
    response.data?.data
      ?.settings ||
    null;

  /*
   * Scheduled reminders should follow
   * the user's actual local timezone.
   */

  const browserTimezone =
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone;

  if (
    browserTimezone &&
    settings?.timezone !==
      browserTimezone
  ) {
    try {
      const updateResponse =
        await api.patch(
          "/trackers/settings",
          {
            timezone:
              browserTimezone
          }
        );

      settings =
        updateResponse.data
          ?.data
          ?.settings ||
        settings;
    } catch {
      /*
       * Do not break the tracker page
       * if timezone sync fails.
       */
    }
  }

  return settings;
}

export async function getTrackerEmotions() {
  const response = await api.get(
    "/trackers/metadata/emotions"
  );

  return (
    response.data?.data?.emotions ||
    []
  );
}

export async function getTrackerActivities() {
  const response = await api.get(
    "/trackers/metadata/activities"
  );

  return (
    response.data?.data?.activities ||
    []
  );
}

export async function getSleepFactors() {
  const response = await api.get(
    "/trackers/metadata/sleep-factors"
  );

  return (
    response.data?.data?.sleepFactors ||
    []
  );
}

/*
|--------------------------------------------------------------------------
| Mood tracker
|--------------------------------------------------------------------------
*/

export async function getMoodEntries({
  page = 1,
  limit = 20,
  startDate,
  endDate,
  sortOrder = "desc"
} = {}) {
  const response = await api.get(
    "/trackers/mood",
    {
      params: {
        page,
        limit,
        startDate,
        endDate,
        sortOrder
      }
    }
  );

  return response.data?.data;
}

export async function createMoodEntry({
  moodLabel,
  moodScore,
  intensity = null,
  stressScore = null,
  energyScore = null,
  triggerCategory = null,
  triggerNote = null,
  note = null,
  loggedAt = null,
  emotionIds = [],
  activityIds = []
}) {
  const response = await api.post(
    "/trackers/mood",
    {
      moodLabel,
      moodScore,
      intensity,
      stressScore,
      energyScore,
      triggerCategory,
      triggerNote,
      note,
      loggedAt,
      emotionIds,
      activityIds
    }
  );

  return (
    response.data?.data?.moodEntry ||
    null
  );
}

export async function updateMoodEntry(
  moodEntryId,
  payload
) {
  const response = await api.patch(
    `/trackers/mood/${moodEntryId}`,
    payload
  );

  return (
    response.data?.data?.moodEntry ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Energy tracker
|--------------------------------------------------------------------------
*/

export async function getEnergyEntries({
  page = 1,
  limit = 20,
  startDate,
  endDate,
  sortOrder = "desc"
} = {}) {
  const response = await api.get(
    "/trackers/energy",
    {
      params: {
        page,
        limit,
        startDate,
        endDate,
        sortOrder
      }
    }
  );

  return response.data?.data;
}

export async function createEnergyEntry({
  energyScore,
  fatigueScore = null,
  focusScore = null,
  motivationScore = null,
  physicalEnergyScore = null,
  mentalEnergyScore = null,
  contextCategory = null,
  note = null,
  loggedAt = null
}) {
  const response = await api.post(
    "/trackers/energy",
    {
      energyScore,
      fatigueScore,
      focusScore,
      motivationScore,
      physicalEnergyScore,
      mentalEnergyScore,
      contextCategory,
      note,
      loggedAt
    }
  );

  return (
    response.data?.data?.energyEntry ||
    null
  );
}

export async function updateEnergyEntry(
  energyEntryId,
  payload
) {
  const response = await api.patch(
    `/trackers/energy/${energyEntryId}`,
    payload
  );

  return (
    response.data?.data?.energyEntry ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Sleep tracker
|--------------------------------------------------------------------------
*/

export async function getSleepEntries({
  page = 1,
  limit = 20,
  startDate,
  endDate,
  sortOrder = "desc"
} = {}) {
  const response = await api.get(
    "/trackers/sleep",
    {
      params: {
        page,
        limit,
        startDate,
        endDate,
        sortOrder
      }
    }
  );

  return response.data?.data;
}

export async function getSleepEntryByDate(
  sleepDate
) {
  const response = await api.get(
    `/trackers/sleep/date/${sleepDate}`
  );

  return (
    response.data?.data?.sleepEntry ||
    null
  );
}

export async function createSleepEntry({
  sleepDate,
  bedtime,
  sleepStartTime,
  wakeTime,
  gotOutOfBedTime = null,
  sleepQuality,
  wakeMood = null,
  interruptionsCount = 0,
  interruptionMinutes = 0,
  napMinutes = 0,
  note = null,
  factors = []
}) {
  const response = await api.post(
    "/trackers/sleep",
    {
      sleepDate,
      bedtime,
      sleepStartTime,
      wakeTime,
      gotOutOfBedTime,
      sleepQuality,
      wakeMood,
      interruptionsCount,
      interruptionMinutes,
      napMinutes,
      note,
      factors
    }
  );

  return (
    response.data?.data?.sleepEntry ||
    null
  );
}

export async function updateSleepEntry(
  sleepEntryId,
  payload
) {
  const response = await api.patch(
    `/trackers/sleep/${sleepEntryId}`,
    payload
  );

  return (
    response.data?.data?.sleepEntry ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Water tracker
|--------------------------------------------------------------------------
*/

export async function getWaterLogs({
  page = 1,
  limit = 50,
  startDate,
  endDate,
  sortOrder = "desc"
} = {}) {
  const response = await api.get(
    "/trackers/water/logs",
    {
      params: {
        page,
        limit,
        startDate,
        endDate,
        sortOrder
      }
    }
  );

  return response.data?.data;
}

export async function getWaterTotal(
  date = getLocalDateString()
) {
  const response = await api.get(
    "/trackers/water/logs/total",
    {
      params: {
        date
      }
    }
  );

  return (
    response.data?.data?.waterTotal ||
    null
  );
}

export async function createWaterLog({
  amountMl,
  waterContainerId = null,
  containerType = null,
  note = null,
  loggedAt = null
}) {
  const response = await api.post(
    "/trackers/water/logs",
    {
      amountMl,
      waterContainerId,
      containerType,
      note,
      loggedAt
    }
  );

  return (
    response.data?.data?.waterLog ||
    null
  );
}

export async function deleteWaterLog(
  waterLogId
) {
  const response = await api.delete(
    `/trackers/water/logs/${waterLogId}`
  );

  return (
    response.data?.data?.waterLog ||
    null
  );
}

export async function getWaterContainers({
  includeInactive = false
} = {}) {
  const response = await api.get(
    "/trackers/water/containers",
    {
      params: {
        includeInactive
      }
    }
  );

  return (
    response.data?.data?.containers ||
    response.data?.data?.waterContainers ||
    []
  );
}

/*
|--------------------------------------------------------------------------
| Habit tracker
|--------------------------------------------------------------------------
*/
export async function createHabit({
  habitName,
  description = null,
  category = "custom",
  trackingType = "boolean",
  targetValue = 1,
  targetUnit = "times",
  frequencyType = "daily",
  targetDays = [],
  targetCountPerPeriod = null,
  startDate = getLocalDateString(),
  endDate = null,
  reminderEnabled = false,
  reminderTime = null
}) {
  const response = await api.post(
    "/trackers/habits",
    {
      habitName,
      description,
      category,
      trackingType,
      targetValue,
      targetUnit,
      frequencyType,
      targetDays,
      targetCountPerPeriod,
      startDate,
      endDate,
      reminderEnabled,
      reminderTime
    }
  );

  return (
    response.data?.data?.habit ||
    null
  );
}

export async function getHabitsForDate(date) {
  const response = await api.get(
    "/trackers/habits/for-date",
    {
      params: {
        date
      }
    }
  );

  const result = response.data?.data;

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.habits)) {
    return result.habits;
  }

  if (
    Array.isArray(
      response.data?.habits
    )
  ) {
    return response.data.habits;
  }

  return [];
}

export async function deleteHabit(
  habitId
) {
  const response = await api.delete(
    `/trackers/habits/${habitId}`
  );

  return (
    response.data?.data?.habit ||
    response.data?.data ||
    null
  );
}

export async function completeHabit(
  habitId,
  {
    logDate = getLocalDateString(),
    value = 1,
    note = null,
    completedAt = null
  } = {}
) {
  const response = await api.patch(
    `/trackers/habits/${habitId}/logs/complete`,
    {
      logDate,
      value,
      note,
      completedAt
    }
  );

  return (
    response.data?.data?.habitLog ||
    null
  );
}

export async function skipHabit(
  habitId,
  {
    logDate = getLocalDateString(),
    note = null
  } = {}
) {
  const response = await api.patch(
    `/trackers/habits/${habitId}/logs/skip`,
    {
      logDate,
      note
    }
  );

  return (
    response.data?.data?.habitLog ||
    null
  );
}