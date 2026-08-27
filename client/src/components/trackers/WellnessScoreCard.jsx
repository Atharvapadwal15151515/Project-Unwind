import {
  Activity,
  BatteryCharging,
  CheckCircle2,
  Droplets,
  MoonStar,
  Smile
} from "lucide-react";

function getNumericValue(
  entry,
  keys
) {
  for (const key of keys) {
    const value =
      Number(entry?.[key]);

    if (
      Number.isFinite(value)
    ) {
      return value;
    }
  }

  return 0;
}

function getSleepMinutes(
  entry
) {
  if (!entry) {
    return 0;
  }

  /*
   * First use a duration already
   * calculated by the backend.
   */
  const storedMinutes =
    Number(
      entry?.total_sleep_minutes ??
      entry?.totalSleepMinutes ??
      entry?.sleep_duration_minutes ??
      entry?.sleepDurationMinutes
    );

  if (
    Number.isFinite(
      storedMinutes
    ) &&
    storedMinutes > 0
  ) {
    return storedMinutes;
  }

  /*
   * Some sleep entries only contain
   * sleep + wake timestamps.
   */
  const sleepStart =
    entry?.sleep_start_time ??
    entry?.sleepStartTime;

  const wakeTime =
    entry?.wake_time ??
    entry?.wakeTime;

  if (
    !sleepStart ||
    !wakeTime
  ) {
    return 0;
  }

  const start =
    new Date(
      sleepStart
    ).getTime();

  const end =
    new Date(
      wakeTime
    ).getTime();

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end)
  ) {
    return 0;
  }

  let difference =
    end - start;

  /*
   * Defensive handling for APIs
   * returning time values crossing
   * midnight.
   */
  if (difference <= 0) {
    difference +=
      24 *
      60 *
      60 *
      1000;
  }

  const minutes =
    Math.round(
      difference /
      60000
    );

  return Math.max(
    minutes,
    0
  );
}

function clampPercentage(
  value
) {
  return Math.max(
    0,
    Math.min(
      Math.round(value),
      100
    )
  );
}

function getScoreMessage(
  score
) {
  if (score >= 85) {
    return (
      "You are building a balanced day."
    );
  }

  if (score >= 65) {
    return (
      "You are moving in a positive direction."
    );
  }

  if (score >= 35) {
    return (
      "A few gentle check-ins can help."
    );
  }

  return (
    "Start with one small check-in."
  );
}

function WellnessScoreCard({
  score,
  moodEntry,
  energyEntry,
  sleepEntry,
  waterTotal,
  habits,
  completedHabitCount
}) {
  const moodScore =
    getNumericValue(
      moodEntry,
      [
        "mood_score",
        "moodScore"
      ]
    );

  const energyScore =
    getNumericValue(
      energyEntry,
      [
        "energy_score",
        "energyScore"
      ]
    );

  const sleepMinutes =
    getSleepMinutes(
      sleepEntry
    );

  const habitPercentage =
    habits.length > 0
      ? clampPercentage(
          (
            completedHabitCount /
            habits.length
          ) *
            100
        )
      : null;

  const moodPercentage =
    moodScore > 0
      ? clampPercentage(
          (
            moodScore /
            5
          ) *
            100
        )
      : null;

  const energyPercentage =
    energyScore > 0
      ? clampPercentage(
          (
            energyScore /
            5
          ) *
            100
        )
      : null;

  const sleepPercentage =
    sleepMinutes > 0
      ? clampPercentage(
          (
            sleepMinutes /
            480
          ) *
            100
        )
      : null;

  const waterPercentage =
    waterTotal > 0
      ? clampPercentage(
          (
            waterTotal /
            2500
          ) *
            100
        )
      : null;

  const metrics = [
    {
      label: "Mood",
      value:
        moodScore > 0
          ? `${moodScore}/5`
          : "Not logged",
      percentage:
        moodPercentage,
      icon: Smile
    },

    {
      label: "Energy",
      value:
        energyScore > 0
          ? `${energyScore}/5`
          : "Not logged",
      percentage:
        energyPercentage,
      icon:
        BatteryCharging
    },

    {
      label: "Sleep",
      value:
        sleepMinutes > 0
          ? `${Math.floor(
              sleepMinutes /
                60
            )}h ${
              sleepMinutes %
              60
            }m`
          : "Not logged",
      percentage:
        sleepPercentage,
      icon: MoonStar
    },

    {
      label: "Water",
      value:
        waterTotal > 0
          ? `${
              waterTotal
            } ml`
          : "Not logged",
      percentage:
        waterPercentage,
      icon: Droplets
    },

    {
      label: "Habits",
      value:
        habits.length > 0
          ? `${completedHabitCount} / ${habits.length}`
          : "Not set",
      percentage:
        habitPercentage,
      icon:
        CheckCircle2
    }
  ];

  return (
    <article
      className="wellness-score-card"
    >
      <header
        className="wellness-score-card__header"
      >
        <div>
          <span
            className="tracker-card__eyebrow"
          >
            <Activity
              size={14}
            />

            Overall wellness
          </span>

          <h2>
            Today&apos;s
            balance
          </h2>

          <p>
            {getScoreMessage(
              score
            )}
          </p>
        </div>

        <div
          className="wellness-score-card__overall"
        >
          <strong>
            {score}%
          </strong>

          <span>
            overall
          </span>
        </div>
      </header>

      <div
        className="wellness-score-card__chart"
      >
        {metrics.map(
          ({
            label,
            value,
            percentage,
            icon: Icon
          }) => (
            <div
              className="wellness-metric"
              key={label}
            >
              <div
                className="wellness-metric__top"
              >
                <div
                  className="wellness-metric__identity"
                >
                  <span
                    className="wellness-metric__icon"
                  >
                    <Icon
                      size={16}
                    />
                  </span>

                  <span>
                    {label}
                  </span>
                </div>

                <strong>
                  {value}
                </strong>
              </div>

              <div
                className={
                  percentage ===
                  null
                    ? "wellness-metric__track wellness-metric__track--empty"
                    : "wellness-metric__track"
                }
                aria-label={
                  percentage ===
                  null
                    ? `${label} not available`
                    : `${label} ${percentage}%`
                }
              >
                {percentage !==
                  null && (
                  <span
                    className="wellness-metric__fill"
                    style={{
                      width:
                        `${percentage}%`
                    }}
                  />
                )}
              </div>
            </div>
          )
        )}
      </div>
    </article>
  );
}

export default WellnessScoreCard;