import {
  Activity,
  BatteryCharging,
  CheckCircle2,
  Droplets,
  MoonStar,
  Smile
} from "lucide-react";

function getNumericValue(entry, keys) {
  for (const key of keys) {
    const value = Number(entry?.[key]);

    if (Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

function getSleepMinutes(entry) {
  return getNumericValue(entry, [
    "total_sleep_minutes",
    "totalSleepMinutes",
    "sleep_duration_minutes",
    "sleepDurationMinutes"
  ]);
}

function getScoreMessage(score) {
  if (score >= 85) {
    return "You are building a balanced day.";
  }

  if (score >= 65) {
    return "You are moving in a positive direction.";
  }

  if (score >= 35) {
    return "A few gentle check-ins can help.";
  }

  return "Start with one small check-in.";
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
  const moodScore = getNumericValue(
    moodEntry,
    ["mood_score", "moodScore"]
  );

  const energyScore = getNumericValue(
    energyEntry,
    ["energy_score", "energyScore"]
  );

  const sleepMinutes =
    getSleepMinutes(sleepEntry);

  const habitPercentage =
    habits.length > 0
      ? Math.round(
          (completedHabitCount /
            habits.length) *
            100
        )
      : 0;

  const metrics = [
    {
      label: "Mood",
      value: moodScore
        ? `${moodScore}/5`
        : "Not logged",
      icon: Smile
    },
    {
      label: "Energy",
      value: energyScore
        ? `${energyScore}/5`
        : "Not logged",
      icon: BatteryCharging
    },
    {
      label: "Sleep",
      value: sleepMinutes
        ? `${Math.floor(
            sleepMinutes / 60
          )}h ${sleepMinutes % 60}m`
        : "Not logged",
      icon: MoonStar
    },
    {
      label: "Water",
      value: `${waterTotal || 0} ml`,
      icon: Droplets
    },
    {
      label: "Habits",
      value: habits.length
        ? `${habitPercentage}%`
        : "None today",
      icon: CheckCircle2
    }
  ];

  return (
    <article className="wellness-score-card">
      <header>
        <div>
          <span className="tracker-card__eyebrow">
            <Activity size={14} />
            Overall wellness
          </span>

          <h2>Today&apos;s balance</h2>

          <p>{getScoreMessage(score)}</p>
        </div>

        <div
          className="wellness-score-card__ring"
          style={{
            "--wellness-score": `${score}%`
          }}
        >
          <span>
            <strong>{score}%</strong>
            <small>today</small>
          </span>
        </div>
      </header>

      <div className="wellness-score-card__metrics">
        {metrics.map(
          ({ label, value, icon: Icon }) => (
            <div key={label}>
              <span>
                <Icon size={16} />
              </span>

              <div>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            </div>
          )
        )}
      </div>
    </article>
  );
}

export default WellnessScoreCard;