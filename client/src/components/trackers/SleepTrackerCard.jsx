import {
  BedDouble,
  CheckCircle2,
  MoonStar,
  Save,
  Star
} from "lucide-react";
import UnwindDateTimePicker
  from "../common/UnwindControls/UnwindDateTimePicker";
import {
  useEffect,
  useMemo,
  useState
} from "react";
import ButtonLoader
  from "../common/AppStates/ButtonLoader";

const wakeMoodOptions = [
  {
    value: "very_low",
    emoji: "😞",
    label: "Very low"
  },
  {
    value: "low",
    emoji: "😕",
    label: "Low"
  },
  {
    value: "neutral",
    emoji: "😐",
    label: "Neutral"
  },
  {
    value: "good",
    emoji: "🙂",
    label: "Good"
  },
  {
    value: "very_good",
    emoji: "😊",
    label: "Very good"
  }
];

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const timezoneOffset =
    date.getTimezoneOffset() *
    60000;

  return new Date(
    date.getTime() -
      timezoneOffset
  )
    .toISOString()
    .slice(0, 16);
}

function createDefaultSleepTimes(
  selectedDate
) {
  const wakeDate = new Date(
    `${selectedDate}T07:00:00`
  );

  const sleepStartDate =
    new Date(wakeDate);

  sleepStartDate.setDate(
    sleepStartDate.getDate() - 1
  );

  sleepStartDate.setHours(
    23,
    0,
    0,
    0
  );

  const bedtimeDate =
    new Date(sleepStartDate);

  bedtimeDate.setMinutes(
    bedtimeDate.getMinutes() - 30
  );

  const outOfBedDate =
    new Date(wakeDate);

  outOfBedDate.setMinutes(
    outOfBedDate.getMinutes() + 15
  );

  return {
    bedtime:
      toDateTimeLocal(
        bedtimeDate
      ),

    sleepStartTime:
      toDateTimeLocal(
        sleepStartDate
      ),

    wakeTime:
      toDateTimeLocal(
        wakeDate
      ),

    gotOutOfBedTime:
      toDateTimeLocal(
        outOfBedDate
      )
  };
}

function calculateDuration(
  startValue,
  endValue
) {
  if (
    !startValue ||
    !endValue
  ) {
    return null;
  }

  const start =
    new Date(startValue);

  const end =
    new Date(endValue);

  const difference =
    end.getTime() -
    start.getTime();

  if (
    !Number.isFinite(
      difference
    ) ||
    difference <= 0
  ) {
    return null;
  }

  const minutes =
    Math.round(
      difference / 60000
    );

  return {
    hours:
      Math.floor(
        minutes / 60
      ),

    minutes:
      minutes % 60,

    totalMinutes:
      minutes
  };
}

function SleepTrackerCard({
  entry,
  selectedDate,
  saving,
  onSave
}) {
  const [
    form,
    setForm
  ] = useState(() => ({
    sleepDate:
      selectedDate,

    ...createDefaultSleepTimes(
      selectedDate
    ),

    sleepQuality: 3,
    wakeMood: "neutral",
    interruptionsCount: 0,
    interruptionMinutes: 0,
    napMinutes: 0,
    note: "",
    factors: []
  }));

  const [
    formError,
    setFormError
  ] = useState("");

  const [
    saved,
    setSaved
  ] = useState(false);

  useEffect(() => {
    if (!entry) {
      setForm({
        sleepDate:
          selectedDate,

        ...createDefaultSleepTimes(
          selectedDate
        ),

        sleepQuality: 3,
        wakeMood: "neutral",
        interruptionsCount: 0,
        interruptionMinutes: 0,
        napMinutes: 0,
        note: "",
        factors: []
      });

      setFormError("");
      return;
    }

    setForm({
      sleepDate:
        entry.sleep_date ||
        entry.sleepDate ||
        selectedDate,

      bedtime:
        toDateTimeLocal(
          entry.bedtime
        ),

      sleepStartTime:
        toDateTimeLocal(
          entry.sleep_start_time ||
            entry.sleepStartTime
        ),

      wakeTime:
        toDateTimeLocal(
          entry.wake_time ||
            entry.wakeTime
        ),

      gotOutOfBedTime:
        toDateTimeLocal(
          entry.got_out_of_bed_time ||
            entry.gotOutOfBedTime
        ),

      sleepQuality:
        Number(
          entry.sleep_quality ??
            entry.sleepQuality ??
            3
        ),

      wakeMood:
        entry.wake_mood ||
        entry.wakeMood ||
        "neutral",

      interruptionsCount:
        Number(
          entry.interruptions_count ??
            entry.interruptionsCount ??
            0
        ),

      interruptionMinutes:
        Number(
          entry.interruption_minutes ??
            entry.interruptionMinutes ??
            0
        ),

      napMinutes:
        Number(
          entry.nap_minutes ??
            entry.napMinutes ??
            0
        ),

      note:
        entry.note || "",

      factors:
        Array.isArray(
          entry.factors
        )
          ? entry.factors.map(
              (factor) => ({
                sleepFactorId:
                  factor.sleep_factor_id ||
                  factor.sleepFactorId,

                factorValue:
                  factor.factor_value ??
                  factor.factorValue ??
                  null,

                note:
                  factor.note ??
                  null
              })
            )
          : []
    });

    setFormError("");
  }, [
    entry,
    selectedDate
  ]);

  const duration =
    useMemo(
      () =>
        calculateDuration(
          form.sleepStartTime,
          form.wakeTime
        ),
      [
        form.sleepStartTime,
        form.wakeTime
      ]
    );

  const updateField = (
    field,
    value
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value
      })
    );

    setFormError("");
    setSaved(false);
  };

  const validateForm = () => {
    if (
      !form.bedtime ||
      !form.sleepStartTime ||
      !form.wakeTime
    ) {
      return "Bedtime, sleep time and wake time are required.";
    }

    const bedtime =
      new Date(
        form.bedtime
      );

    const sleepStart =
      new Date(
        form.sleepStartTime
      );

    const wakeTime =
      new Date(
        form.wakeTime
      );

    if (
      sleepStart < bedtime
    ) {
      return "Sleep start time cannot be earlier than bedtime.";
    }

    if (
      wakeTime <=
      sleepStart
    ) {
      return "Wake time must be later than sleep start time.";
    }

    if (
      form.gotOutOfBedTime &&
      new Date(
        form.gotOutOfBedTime
      ) < wakeTime
    ) {
      return "The time you left bed cannot be earlier than your wake time.";
    }

    if (
      !duration ||
      duration.totalMinutes >
        1440
    ) {
      return "Sleep duration must be between 1 minute and 24 hours.";
    }

    return "";
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const validationMessage =
        validateForm();

      if (
        validationMessage
      ) {
        setFormError(
          validationMessage
        );

        return;
      }

      setFormError("");

      try {
        await onSave({
          sleepDate:
            selectedDate,

          bedtime:
            new Date(
              form.bedtime
            ).toISOString(),

          sleepStartTime:
            new Date(
              form.sleepStartTime
            ).toISOString(),

          wakeTime:
            new Date(
              form.wakeTime
            ).toISOString(),

          gotOutOfBedTime:
            form.gotOutOfBedTime
              ? new Date(
                  form.gotOutOfBedTime
                ).toISOString()
              : null,

          sleepQuality:
            Number(
              form.sleepQuality
            ),

          wakeMood:
            form.wakeMood ||
            null,

          interruptionsCount:
            Number(
              form.interruptionsCount
            ),

          interruptionMinutes:
            Number(
              form.interruptionMinutes
            ),

          napMinutes:
            Number(
              form.napMinutes
            ),

          note:
            form.note.trim() ||
            null,

          factors:
            form.factors
        });

        setSaved(true);

        window.setTimeout(
          () => {
            setSaved(false);
          },
          2000
        );
      } catch {
        // Global tracker error is
        // displayed by TrackersPage.
      }
    };

  return (
    <article className="tracker-card tracker-card--sleep">
      <header className="tracker-card__header">
        <div>
          <span className="tracker-card__eyebrow">
            <MoonStar
              size={14}
            />
            Sleep
          </span>

          <h2>
            How did you sleep?
          </h2>

          <p>
            Record last night&apos;s
            rest and recovery.
          </p>
        </div>

        <span className="sleep-duration">
          <BedDouble
            size={18}
          />

          {duration
            ? `${duration.hours}h ${duration.minutes}m`
            : "Not calculated"}
        </span>
      </header>

      <form
  onSubmit={handleSubmit}
  aria-busy={saving}
>
        {formError && (
          <div
            className="tracker-form-error"
            role="alert"
          >
            {formError}
          </div>
        )}

        <div className="sleep-time-grid">
          <label>
            <span>
              Bedtime
            </span>

<UnwindDateTimePicker
  name="bedtime"
  label="Bedtime"
  value={form.bedtime}
  disabled={saving}
  onChange={(event) =>
    updateField(
      "bedtime",
      event.target.value
    )
  }
  required
/>
          </label>

          <label>
            <span>
              Fell asleep
            </span>

            <UnwindDateTimePicker
  name="sleepStartTime"
  label="Fell asleep"
  value={
    form.sleepStartTime
  }
  disabled={saving}
  onChange={(event) =>
    updateField(
      "sleepStartTime",
      event.target.value
    )
  }
  required
/>
          </label>

          <label>
            <span>
              Woke up
            </span>

           <UnwindDateTimePicker
  name="wakeTime"
  label="Woke up"
  value={form.wakeTime}
  disabled={saving}
  onChange={(event) =>
    updateField(
      "wakeTime",
      event.target.value
    )
  }
  required
/>
          </label>

          <label>
            <span>
              Left bed
            </span>

<UnwindDateTimePicker
  name="gotOutOfBedTime"
  label="Left bed"
  value={
    form.gotOutOfBedTime
  }
  disabled={saving}
  onChange={(event) =>
    updateField(
      "gotOutOfBedTime",
      event.target.value
    )
  }
/>
          </label>
        </div>

        <div className="sleep-quality">
          <span>
            Sleep quality
          </span>

          <div>
            {[1, 2, 3, 4, 5].map(
              (quality) => (
                <button
                  key={
                    quality
                  }
                  type="button"
                  disabled={saving}
                  aria-label={`Sleep quality ${quality}`}
                  onClick={() =>
                    updateField(
                      "sleepQuality",
                      quality
                    )
                  }
                >
                  <Star
                    size={22}
                    fill={
                      quality <=
                      form.sleepQuality
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
              )
            )}
          </div>
        </div>

        <div className="sleep-wake-mood">
          <span>
            How did you feel
            after waking?
          </span>

          <div>
            {wakeMoodOptions.map(
              (option) => (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  disabled={saving}
                  className={
                    form.wakeMood ===
                    option.value
                      ? "sleep-wake-mood__option sleep-wake-mood__option--active"
                      : "sleep-wake-mood__option"
                  }
                  onClick={() =>
                    updateField(
                      "wakeMood",
                      option.value
                    )
                  }
                >
                  <span>
                    {
                      option.emoji
                    }
                  </span>

                  <small>
                    {
                      option.label
                    }
                  </small>
                </button>
              )
            )}
          </div>
        </div>

        <div className="sleep-number-grid">
          <label>
            <span>
              Interruptions
            </span>

            <input
              type="number"
              min="0"
              max="100"
              value={
                form.interruptionsCount
              }
              disabled={saving}
              onChange={(
                event
              ) =>
                updateField(
                  "interruptionsCount",
                  Number(
                    event.target
                      .value
                  )
                )
              }
            />
          </label>

          <label>
            <span>
              Awake minutes
            </span>

            <input
              type="number"
              min="0"
              max="1440"
              value={
                form.interruptionMinutes
              }
              disabled={saving}
              onChange={(
                event
              ) =>
                updateField(
                  "interruptionMinutes",
                  Number(
                    event.target
                      .value
                  )
                )
              }
            />
          </label>

          <label>
            <span>
              Nap minutes
            </span>

            <input
              type="number"
              min="0"
              max="1440"
              value={
                form.napMinutes
              }
              disabled={saving}
              onChange={(
                event
              ) =>
                updateField(
                  "napMinutes",
                  Number(
                    event.target
                      .value
                  )
                )
              }
            />
          </label>
        </div>

        <label className="tracker-textarea">
          <span>
            Sleep notes{" "}
            <small>
              Optional
            </small>
          </span>

          <textarea
            rows={3}
            maxLength={5000}
            value={
              form.note
            }
            disabled={saving}
            placeholder="Anything that affected your sleep?"
            onChange={(
              event
            ) =>
              updateField(
                "note",
                event.target
                  .value
              )
            }
          />
        </label>

        <button
          type="submit"
          className="tracker-save-button"
          disabled={
            saving ||
            !form.bedtime ||
            !form.sleepStartTime ||
            !form.wakeTime
          }
        >
          {saving ? (
            <LoaderCircle
              size={16}
              className="trackers-icon-spin"
            />
          ) : (
            <Save size={16} />
          )}

          {saving
            ? "Saving…"
            : saved
              ? "Sleep saved"
              : entry
                ? "Update sleep"
                : "Save sleep"}
        </button>
      </form>
    </article>
  );
}

export default SleepTrackerCard;