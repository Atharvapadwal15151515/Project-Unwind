import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  completeHabit,
  createEnergyEntry,
  createHabit,
  deleteHabit,
  createMoodEntry,
  createSleepEntry,
  createWaterLog,
  deleteWaterLog,
  getEnergyEntries,
  getHabitsForDate,
  getLocalDateString,
  getLocalDayRange,
  getMoodEntries,
  getSleepEntries,
  getTrackerMetadata,
  initializeTrackerNotificationSettings,
  getWaterContainers,
  getWaterLogs,
  getWaterTotal,
  skipHabit,
  updateEnergyEntry,
  updateMoodEntry,
  updateSleepEntry
} from "../services/trackerService";

import {
  getApiErrorMessage
} from "../services/api";

/*
|--------------------------------------------------------------------------
| Relation helpers
|--------------------------------------------------------------------------
*/

function getRelationIds(
  entry,
  relationKey,
  idKeys
) {
  const directIds =
    entry?.[`${relationKey}Ids`] ||
    entry?.[
      `${relationKey}_ids`
    ];

  if (Array.isArray(directIds)) {
    return directIds;
  }

  const relations =
    entry?.[relationKey];

  if (!Array.isArray(relations)) {
    return [];
  }

  return relations
    .map((relation) => {
      for (const key of idKeys) {
        if (relation?.[key]) {
          return relation[key];
        }
      }

      return null;
    })
    .filter(Boolean);
}

/*
|--------------------------------------------------------------------------
| General response helpers
|--------------------------------------------------------------------------
*/

function extractEntries(
  result,
  possibleKeys
) {
  if (Array.isArray(result)) {
    return result;
  }

  for (
    const key of possibleKeys
  ) {
    if (
      Array.isArray(
        result?.[key]
      )
    ) {
      return result[key];
    }
  }

  return [];
}

function getEntryId(
  entry,
  possibleKeys
) {
  for (
    const key of possibleKeys
  ) {
    if (entry?.[key]) {
      return entry[key];
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Date helpers
|--------------------------------------------------------------------------
*/

function getDateAtCurrentLocalTime(
  dateString
) {
  const now = new Date();

  const hours = String(
    now.getHours()
  ).padStart(2, "0");

  const minutes = String(
    now.getMinutes()
  ).padStart(2, "0");

  const seconds = String(
    now.getSeconds()
  ).padStart(2, "0");

  const localDate = new Date(
    `${dateString}T${hours}:${minutes}:${seconds}`
  );

  return localDate.toISOString();
}

/*
|--------------------------------------------------------------------------
| Sleep helpers
|--------------------------------------------------------------------------
*/

function calculateSleepMinutes(
  entry
) {
  if (!entry) {
    return 0;
  }

  const storedMinutes = Number(
    entry.total_sleep_minutes ??
      entry.totalSleepMinutes ??
      entry.sleep_duration_minutes ??
      entry.sleepDurationMinutes
  );

  if (
    Number.isFinite(
      storedMinutes
    ) &&
    storedMinutes > 0
  ) {
    return storedMinutes;
  }

  const sleepStart =
    entry.sleep_start_time ||
    entry.sleepStartTime;

  const wakeTime =
    entry.wake_time ||
    entry.wakeTime;

  if (
    !sleepStart ||
    !wakeTime
  ) {
    return 0;
  }

  const difference =
    new Date(
      wakeTime
    ).getTime() -
    new Date(
      sleepStart
    ).getTime();

  if (
    !Number.isFinite(
      difference
    ) ||
    difference <= 0
  ) {
    return 0;
  }

  return Math.round(
    difference / 60000
  );
}

/*
|--------------------------------------------------------------------------
| Water helpers
|--------------------------------------------------------------------------
*/

function normalizeWaterTotal(
  result
) {
  if (
    typeof result === "number"
  ) {
    return result;
  }

  return Number(
    result?.totalAmountMl ??
      result?.total_amount_ml ??
      result?.totalMl ??
      result?.total_ml ??
      result?.amountMl ??
      result?.amount_ml ??
      result?.total ??
      0
  );
}

function getWaterLogId(
  log
) {
  return (
    log?.water_log_id ||
    log?.waterLogId ||
    log?.id ||
    null
  );
}

function getWaterLogAmount(
  log
) {
  return Number(
    log?.amount_ml ??
      log?.amountMl ??
      0
  );
}

function getWaterLogTime(
  log
) {
  const value =
    log?.logged_at ||
    log?.loggedAt ||
    log?.created_at ||
    log?.createdAt;

  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(
      value
    ).getTime();

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : 0;
}

/*
|--------------------------------------------------------------------------
| Habit helpers
|--------------------------------------------------------------------------
*/

function getHabitId(
  habit
) {
  return (
    habit?.habit_id ||
    habit?.habitId ||
    habit?.id ||
    null
  );
}

function getHabitStatus(
  habit
) {
  return (
    habit?.status ||
    habit?.log_status ||
    habit?.habit_log?.status ||
    habit?.habitLog?.status ||
    "pending"
  );
}

/*
|--------------------------------------------------------------------------
| Daily trackers hook
|--------------------------------------------------------------------------
*/

export function useDailyTrackers() {
  const today = useMemo(
    () =>
      getLocalDateString(),
    []
  );

  const [
    selectedDate,
    setSelectedDate
  ] = useState(today);

  const [
    moodEntry,
    setMoodEntry
  ] = useState(null);

  const [
    energyEntry,
    setEnergyEntry
  ] = useState(null);

  const [
    sleepEntry,
    setSleepEntry
  ] = useState(null);

  const [
    waterLogs,
    setWaterLogs
  ] = useState([]);

  const [
    waterTotal,
    setWaterTotal
  ] = useState(0);

  const [
    waterContainers,
    setWaterContainers
  ] = useState([]);

  const [
    habits,
    setHabits
  ] = useState([]);

  const [
    metadata,
    setMetadata
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    refreshing,
    setRefreshing
  ] = useState(false);

  const [
    savingTracker,
    setSavingTracker
  ] = useState(null);

  const [
    error,
    setError
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load the selected date
  |--------------------------------------------------------------------------
  */

  const loadDailyTrackers =
    useCallback(
      async ({
        showInitialLoader = false
      } = {}) => {
        try {
          if (
            showInitialLoader
          ) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }

          setError("");

          const selectedDateObject =
            new Date(
              `${selectedDate}T12:00:00`
            );

          const {
            startDate,
            endDate
          } = getLocalDayRange(
            selectedDateObject
          );

          const results =
            await Promise.allSettled([
              getMoodEntries({
                page: 1,
                limit: 1,
                startDate,
                endDate,
                sortOrder: "desc"
              }),

              getEnergyEntries({
                page: 1,
                limit: 1,
                startDate,
                endDate,
                sortOrder: "desc"
              }),
getSleepEntries({
  page: 1,
  limit: 1,
  startDate: selectedDate,
  endDate: selectedDate,
  sortOrder: "desc"
}),

              getWaterLogs({
                page: 1,
                limit: 100,
                startDate,
                endDate,
                sortOrder: "desc"
              }),

              getWaterTotal(
                selectedDate
              ),

              getHabitsForDate(
                selectedDate
              ),

             getWaterContainers(),

getTrackerMetadata(),

initializeTrackerNotificationSettings()
            ]);

          const [
  moodResult,
  energyResult,
  sleepResult,
  waterLogsResult,
  waterTotalResult,
  habitsResult,
  containersResult,
  metadataResult,
  notificationSettingsResult
] = results;

void notificationSettingsResult;

          /*
          |--------------------------------------------------------------------------
          | Mood
          |--------------------------------------------------------------------------
          */

          if (
            moodResult.status ===
            "fulfilled"
          ) {
            const entries =
              extractEntries(
                moodResult.value,
                [
                  "moodEntries",
                  "mood_entries",
                  "entries",
                  "moods"
                ]
              );

            setMoodEntry(
              entries[0] ||
                null
            );
          } else {
            setMoodEntry(null);
          }

          /*
          |--------------------------------------------------------------------------
          | Energy
          |--------------------------------------------------------------------------
          */

          if (
            energyResult.status ===
            "fulfilled"
          ) {
            const entries =
              extractEntries(
                energyResult.value,
                [
                  "energyEntries",
                  "energy_entries",
                  "entries",
                  "energies"
                ]
              );

            setEnergyEntry(
              entries[0] ||
                null
            );
          } else {
            setEnergyEntry(null);
          }

          /*
          |--------------------------------------------------------------------------
          | Sleep
          |--------------------------------------------------------------------------
          */

          if (
            sleepResult.status ===
            "fulfilled"
          ) {
            const entries =
              extractEntries(
                sleepResult.value,
                [
                  "sleepEntries",
                  "sleep_entries",
                  "entries",
                  "sleep"
                ]
              );

            setSleepEntry(
              entries[0] ||
                null
            );
          } else {
            setSleepEntry(null);
          }
                    /*
          |--------------------------------------------------------------------------
          | Water logs
          |--------------------------------------------------------------------------
          */

          if (
            waterLogsResult.status ===
            "fulfilled"
          ) {
            const logs =
              extractEntries(
                waterLogsResult.value,
                [
                  "waterLogs",
                  "water_logs",
                  "logs",
                  "entries"
                ]
              );

            setWaterLogs(logs);
          } else {
            setWaterLogs([]);
          }

          /*
          |--------------------------------------------------------------------------
          | Water total
          |--------------------------------------------------------------------------
          */

          if (
            waterTotalResult.status ===
            "fulfilled"
          ) {
            setWaterTotal(
              normalizeWaterTotal(
                waterTotalResult.value
              )
            );
          } else {
            setWaterTotal(0);
          }

          /*
          |--------------------------------------------------------------------------
          | Habits
          |--------------------------------------------------------------------------
          */

          if (
            habitsResult.status ===
            "fulfilled"
          ) {
            const habitList =
              Array.isArray(
                habitsResult.value
              )
                ? habitsResult.value
                : extractEntries(
                    habitsResult.value,
                    [
                      "habits",
                      "scheduledHabits",
                      "scheduled_habits"
                    ]
                  );

            setHabits(habitList);
          } else {
            setHabits([]);
          }

          /*
          |--------------------------------------------------------------------------
          | Water containers
          |--------------------------------------------------------------------------
          */

          if (
            containersResult.status ===
            "fulfilled"
          ) {
            setWaterContainers(
              Array.isArray(
                containersResult.value
              )
                ? containersResult.value
                : []
            );
          } else {
            setWaterContainers([]);
          }

          /*
          |--------------------------------------------------------------------------
          | Metadata
          |--------------------------------------------------------------------------
          */

          if (
            metadataResult.status ===
            "fulfilled"
          ) {
            setMetadata(
              metadataResult.value
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Overall request failure
          |--------------------------------------------------------------------------
          */

          const failedRequests =
            results.filter(
              (result) =>
                result.status ===
                "rejected"
            );

          if (
            failedRequests.length ===
            results.length
          ) {
            throw (
              failedRequests[0]
                .reason
            );
          }
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load your daily trackers."
            )
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [selectedDate]
    );

  useEffect(() => {
    loadDailyTrackers({
      showInitialLoader: true
    });
  }, [
    loadDailyTrackers
  ]);

  /*
  |--------------------------------------------------------------------------
  | Save mood
  |--------------------------------------------------------------------------
  */

  const saveMood =
    useCallback(
      async (payload) => {
        try {
          setSavingTracker(
            "mood"
          );

          setError("");

          const entryId =
            getEntryId(
              moodEntry,
              [
                "mood_entry_id",
                "moodEntryId",
                "id"
              ]
            );

          const finalPayload = {
            ...payload
          };

          if (!entryId) {
            finalPayload.loggedAt =
              payload.loggedAt ||
              getDateAtCurrentLocalTime(
                selectedDate
              );
          }

          const savedEntry =
            entryId
              ? await updateMoodEntry(
                  entryId,
                  finalPayload
                )
              : await createMoodEntry(
                  finalPayload
                );

          setMoodEntry(
            savedEntry
          );

          return savedEntry;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to save your mood."
            )
          );

          throw requestError;
        } finally {
          setSavingTracker(
            null
          );
        }
      },
      [
        moodEntry,
        selectedDate
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Save mood details
  |--------------------------------------------------------------------------
  */

  const saveMoodDetails =
    useCallback(
      async (changes) => {
        const moodLabel =
          moodEntry?.mood_label ||
          moodEntry?.moodLabel ||
          "neutral";

        const moodScore =
          Number(
            moodEntry?.mood_score ??
              moodEntry?.moodScore ??
              3
          );

        const emotionIds =
          getRelationIds(
            moodEntry,
            "emotions",
            [
              "emotion_id",
              "emotionId",
              "id"
            ]
          );

        const activityIds =
          getRelationIds(
            moodEntry,
            "activities",
            [
              "activity_id",
              "activityId",
              "id"
            ]
          );

        return saveMood({
          moodLabel,
          moodScore,

          intensity:
            moodEntry?.intensity ??
            null,

          stressScore:
            moodEntry?.stress_score ??
            moodEntry?.stressScore ??
            null,

          energyScore:
            moodEntry?.energy_score ??
            moodEntry?.energyScore ??
            null,

          triggerCategory:
            moodEntry?.trigger_category ??
            moodEntry?.triggerCategory ??
            null,

          triggerNote:
            moodEntry?.trigger_note ??
            moodEntry?.triggerNote ??
            null,

          note:
            moodEntry?.note ??
            null,

          emotionIds,
          activityIds,

          ...changes
        });
      },
      [
        moodEntry,
        saveMood
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Save energy
  |--------------------------------------------------------------------------
  */

  const saveEnergy =
    useCallback(
      async (payload) => {
        try {
          setSavingTracker(
            "energy"
          );

          setError("");

          const entryId =
            getEntryId(
              energyEntry,
              [
                "energy_entry_id",
                "energyEntryId",
                "id"
              ]
            );

          const finalPayload = {
            ...payload
          };

          if (!entryId) {
            finalPayload.loggedAt =
              payload.loggedAt ||
              getDateAtCurrentLocalTime(
                selectedDate
              );
          }

          const savedEntry =
            entryId
              ? await updateEnergyEntry(
                  entryId,
                  finalPayload
                )
              : await createEnergyEntry(
                  finalPayload
                );

          setEnergyEntry(
            savedEntry
          );

          return savedEntry;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to save your energy level."
            )
          );

          throw requestError;
        } finally {
          setSavingTracker(
            null
          );
        }
      },
      [
        energyEntry,
        selectedDate
      ]
    );
      /*
  |--------------------------------------------------------------------------
  | Save sleep
  |--------------------------------------------------------------------------
  */

  const saveSleep =
    useCallback(
      async (payload) => {
        try {
          setSavingTracker(
            "sleep"
          );

          setError("");

          const entryId =
            getEntryId(
              sleepEntry,
              [
                "sleep_entry_id",
                "sleepEntryId",
                "id"
              ]
            );

          const finalPayload = {
            ...payload,
            sleepDate:
              payload.sleepDate ||
              selectedDate
          };

          const savedEntry =
            entryId
              ? await updateSleepEntry(
                  entryId,
                  finalPayload
                )
              : await createSleepEntry(
                  finalPayload
                );

          setSleepEntry(
            savedEntry
          );

          return savedEntry;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to save your sleep entry."
            )
          );

          throw requestError;
        } finally {
          setSavingTracker(
            null
          );
        }
      },
      [
        sleepEntry,
        selectedDate
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Add water
  |--------------------------------------------------------------------------
  */

  const addWater =
    useCallback(
      async ({
        amountMl,
        waterContainerId = null,
        containerType = null
      }) => {
        try {
          const numericAmount =
            Number(amountMl);

          if (
            !Number.isFinite(
              numericAmount
            ) ||
            numericAmount < 1
          ) {
            throw new Error(
              "Water amount must be at least 1 ml."
            );
          }

          setSavingTracker(
            "water"
          );

          setError("");

          const waterLog =
            await createWaterLog({
              amountMl:
                numericAmount,

              waterContainerId,
              containerType,

              loggedAt:
                getDateAtCurrentLocalTime(
                  selectedDate
                )
            });

          if (waterLog) {
            setWaterLogs(
              (currentLogs) => [
                waterLog,
                ...currentLogs
              ]
            );
          }

          setWaterTotal(
            (currentTotal) =>
              Number(
                currentTotal
              ) +
              numericAmount
          );

          return waterLog;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to add your water intake."
            )
          );

          throw requestError;
        } finally {
          setSavingTracker(
            null
          );
        }
      },
      [selectedDate]
    );

  /*
  |--------------------------------------------------------------------------
  | Remove latest water entry
  |--------------------------------------------------------------------------
  */

  const removeLastWater =
    useCallback(
      async () => {
        const activeLogs =
          [...waterLogs]
            .filter(
              (log) =>
                !(
                  log?.is_deleted ||
                  log?.isDeleted
                )
            )
            .sort(
              (
                firstLog,
                secondLog
              ) =>
                getWaterLogTime(
                  secondLog
                ) -
                getWaterLogTime(
                  firstLog
                )
            );

        const latestLog =
          activeLogs[0];

        if (!latestLog) {
          const noLogError =
            new Error(
              "There is no water entry to remove."
            );

          setError(
            noLogError.message
          );

          throw noLogError;
        }

        const waterLogId =
          getWaterLogId(
            latestLog
          );

        if (!waterLogId) {
          const missingIdError =
            new Error(
              "The latest water entry has no valid ID."
            );

          setError(
            missingIdError.message
          );

          throw missingIdError;
        }

        try {
          setSavingTracker(
            "water-remove"
          );

          setError("");

          await deleteWaterLog(
            waterLogId
          );

          const removedAmount =
            getWaterLogAmount(
              latestLog
            );

          setWaterLogs(
            (currentLogs) =>
              currentLogs.filter(
                (log) =>
                  getWaterLogId(
                    log
                  ) !==
                  waterLogId
              )
          );

          setWaterTotal(
            (currentTotal) =>
              Math.max(
                Number(
                  currentTotal
                ) -
                removedAmount,
                0
              )
          );

          return latestLog;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to remove the latest water entry."
            )
          );

          throw requestError;
        } finally {
          setSavingTracker(
            null
          );
        }
      },
      [waterLogs]
    );

  /*
  |--------------------------------------------------------------------------
  | Create habit
  |--------------------------------------------------------------------------
  */

  const createNewHabit =
    useCallback(
      async (payload) => {
        try {
          setSavingTracker(
            "habit-create"
          );

          setError("");

          const createdHabit =
            await createHabit(
              payload
            );

          const updatedHabits =
            await getHabitsForDate(
              selectedDate
            );

          setHabits(
            Array.isArray(
              updatedHabits
            )
              ? updatedHabits
              : []
          );

          return createdHabit;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to create your habit."
            )
          );

          throw requestError;
        } finally {
          setSavingTracker(
            null
          );
        }
      },
      [selectedDate]
    );

  /*
  |--------------------------------------------------------------------------
  | Complete habit
  |--------------------------------------------------------------------------
  */

  const markHabitComplete =
    useCallback(
      async (
        habitId,
        value = 1
      ) => {
        try {
          setSavingTracker(
            `habit-${habitId}`
          );

          setError("");

          const habitLog =
            await completeHabit(
              habitId,
              {
                logDate:
                  selectedDate,

                value,

                completedAt:
                  getDateAtCurrentLocalTime(
                    selectedDate
                  )
              }
            );

          setHabits(
            (currentHabits) =>
              currentHabits.map(
                (habit) => {
                  const currentId =
                    getHabitId(
                      habit
                    );

                  if (
                    currentId !==
                    habitId
                  ) {
                    return habit;
                  }

                  return {
                    ...habit,
                    habit_log:
                      habitLog,
                    habitLog,
                    status:
                      "completed",
                    log_status:
                      "completed"
                  };
                }
              )
          );

          return habitLog;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to complete this habit."
            )
          );

          throw requestError;
        } finally {
          setSavingTracker(
            null
          );
        }
      },
      [selectedDate]
    );

  /*
  |--------------------------------------------------------------------------
  | Skip habit
  |--------------------------------------------------------------------------
  */

  const markHabitSkipped =
    useCallback(
      async (
        habitId
      ) => {
        try {
          setSavingTracker(
            `habit-${habitId}`
          );

          setError("");

          const habitLog =
            await skipHabit(
              habitId,
              {
                logDate:
                  selectedDate
              }
            );

          setHabits(
            (currentHabits) =>
              currentHabits.map(
                (habit) => {
                  const currentId =
                    getHabitId(
                      habit
                    );

                  if (
                    currentId !==
                    habitId
                  ) {
                    return habit;
                  }

                  return {
                    ...habit,
                    habit_log:
                      habitLog,
                    habitLog,
                    status:
                      "skipped",
                    log_status:
                      "skipped"
                  };
                }
              )
          );

          return habitLog;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to skip this habit."
            )
          );

          throw requestError;
        } finally {
          setSavingTracker(
            null
          );
        }
      },
      [selectedDate]
    );
      /*
  |--------------------------------------------------------------------------
  | Calculated statistics
  |--------------------------------------------------------------------------
  */

    /*
  |--------------------------------------------------------------------------
  | Delete habit
  |--------------------------------------------------------------------------
  */

  const removeHabit =
    useCallback(
      async (habitId) => {
        try {
          setSavingTracker(
            `habit-delete-${habitId}`
          );

          setError("");

          await deleteHabit(
            habitId
          );

          /*
           * Remove the deleted habit from
           * the UI immediately.
           */
          setHabits(
            (currentHabits) =>
              currentHabits.filter(
                (habit) =>
                  getHabitId(
                    habit
                  ) !== habitId
              )
          );

          return true;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to delete this habit."
            )
          );

          throw requestError;
        } finally {
          setSavingTracker(
            null
          );
        }
      },
      []
    );

  const completedHabitCount =
    useMemo(
      () =>
        habits.filter(
          (habit) =>
            getHabitStatus(
              habit
            ) ===
            "completed"
        ).length,
      [habits]
    );

  const wellnessScore =
    useMemo(() => {
      const scores = [];

      const moodScore =
        Number(
          moodEntry?.mood_score ??
            moodEntry?.moodScore
        );

      if (
        Number.isFinite(
          moodScore
        ) &&
        moodScore > 0
      ) {
        scores.push(
          Math.min(
            (
              moodScore /
              5
            ) *
              100,
            100
          )
        );
      }

      const energyScore =
        Number(
          energyEntry?.energy_score ??
            energyEntry?.energyScore
        );

      if (
        Number.isFinite(
          energyScore
        ) &&
        energyScore > 0
      ) {
        scores.push(
          Math.min(
            (
              energyScore /
              5
            ) *
              100,
            100
          )
        );
      }

      const sleepMinutes =
        calculateSleepMinutes(
          sleepEntry
        );

      if (
        sleepMinutes > 0
      ) {
        scores.push(
          Math.min(
            (
              sleepMinutes /
              480
            ) *
              100,
            100
          )
        );
      }

      if (
        waterTotal > 0
      ) {
        scores.push(
          Math.min(
            (
              waterTotal /
              2500
            ) *
              100,
            100
          )
        );
      }

      if (
        habits.length > 0
      ) {
        scores.push(
          (
            completedHabitCount /
            habits.length
          ) *
            100
        );
      }

      if (
        scores.length === 0
      ) {
        return 0;
      }

      const total =
        scores.reduce(
          (
            currentTotal,
            score
          ) =>
            currentTotal +
            score,
          0
        );

      return Math.round(
        total /
          scores.length
      );
    }, [
      completedHabitCount,
      energyEntry,
      habits.length,
      moodEntry,
      sleepEntry,
      waterTotal
    ]);

  return {
    selectedDate,
    setSelectedDate,

    moodEntry,
    energyEntry,
    sleepEntry,

    waterLogs,
    waterTotal,
    waterContainers,

    habits,
    metadata,

    completedHabitCount,
    wellnessScore,

    loading,
    refreshing,
    savingTracker,
    error,

    refresh:
      loadDailyTrackers,

    saveMood,
    saveMoodDetails,
    saveEnergy,
    saveSleep,

    addWater,
    removeLastWater,

        createNewHabit,
    markHabitComplete,
    markHabitSkipped,
    removeHabit,

    clearError: () =>
      setError("")
  };
}