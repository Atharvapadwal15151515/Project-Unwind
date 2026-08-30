import {
  Bell,
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  Plus,
  Repeat2,
  Target,
  X
} from "lucide-react";
import {
  UnwindDatePicker,
  UnwindSelect
} from "../common/UnwindControls/UnwindControls";
import {
  useEffect,
  useMemo,
  useState
} from "react";

const categories = [
  {
    value: "wellness",
    label: "Wellness"
  },
  {
    value: "fitness",
    label: "Fitness"
  },
  {
    value: "study",
    label: "Study"
  },
  {
    value: "sleep",
    label: "Sleep"
  },
  {
    value: "self_care",
    label: "Self-care"
  },
  {
    value: "nutrition",
    label: "Nutrition"
  },
  {
    value: "productivity",
    label: "Productivity"
  },
  {
    value: "custom",
    label: "Other"
  }
];

const trackingTypes = [
  {
    value: "boolean",
    label: "Done or not",
    description:
      "Mark the habit complete once."
  },
  {
    value: "count",
    label: "Count",
    description:
      "Track a number of repetitions."
  },
  {
    value: "duration",
    label: "Duration",
    description:
      "Track time spent on the habit."
  }
];

const weekDays = [
  {
    value: 0,
    shortLabel: "Sun",
    label: "Sunday"
  },
  {
    value: 1,
    shortLabel: "Mon",
    label: "Monday"
  },
  {
    value: 2,
    shortLabel: "Tue",
    label: "Tuesday"
  },
  {
    value: 3,
    shortLabel: "Wed",
    label: "Wednesday"
  },
  {
    value: 4,
    shortLabel: "Thu",
    label: "Thursday"
  },
  {
    value: 5,
    shortLabel: "Fri",
    label: "Friday"
  },
  {
    value: 6,
    shortLabel: "Sat",
    label: "Saturday"
  }
];

function getInitialForm(startDate) {
  return {
    habitName: "",
    description: "",
    category: "wellness",
    trackingType: "boolean",
    targetValue: 1,
    targetUnit: "times",
    frequencyType: "daily",
    targetDays: [],
    startDate,
    endDate: "",
    reminderEnabled: false,
    reminderTime: ""
  };
}

function CreateHabitModal({
  open,
  selectedDate,
  saving = false,
  onClose,
  onCreate
}) {
  const [form, setForm] = useState(
    () =>
      getInitialForm(
        selectedDate
      )
  );

  const [formError, setFormError] =
    useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      getInitialForm(
        selectedDate
      )
    );

    setFormError("");
  }, [open, selectedDate]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !saving
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        "";
    };
  }, [
    open,
    saving,
    onClose
  ]);

  const targetUnitOptions =
    useMemo(() => {
      if (
        form.trackingType ===
        "duration"
      ) {
        return [
          "minutes",
          "hours"
        ];
      }

      if (
        form.trackingType ===
        "count"
      ) {
        return [
          "times",
          "glasses",
          "pages",
          "steps",
          "sessions",
          "items"
        ];
      }

      return ["times"];
    }, [form.trackingType]);

  const updateField = (
    field,
    value
  ) => {
    setForm(
      (currentForm) => ({
        ...currentForm,
        [field]: value
      })
    );

    setFormError("");
  };

  const handleTrackingTypeChange = (
    trackingType
  ) => {
    if (
      trackingType === "boolean"
    ) {
      setForm(
        (currentForm) => ({
          ...currentForm,
          trackingType,
          targetValue: 1,
          targetUnit: "times"
        })
      );

      return;
    }

    if (
      trackingType === "duration"
    ) {
      setForm(
        (currentForm) => ({
          ...currentForm,
          trackingType,
          targetValue:
            currentForm.targetValue >
            1
              ? currentForm.targetValue
              : 10,
          targetUnit: "minutes"
        })
      );

      return;
    }

    setForm(
      (currentForm) => ({
        ...currentForm,
        trackingType,
        targetValue:
          currentForm.targetValue > 1
            ? currentForm.targetValue
            : 2,
        targetUnit: "times"
      })
    );
  };

  const handleFrequencyChange = (
    frequencyType
  ) => {
    setForm(
      (currentForm) => ({
        ...currentForm,
        frequencyType,
        targetDays:
          frequencyType === "custom"
            ? currentForm.targetDays
            : []
      })
    );

    setFormError("");
  };

  const toggleTargetDay = (
    dayValue
  ) => {
    setForm(
      (currentForm) => {
        const isSelected =
          currentForm.targetDays.includes(
            dayValue
          );

        return {
          ...currentForm,
          targetDays: isSelected
            ? currentForm.targetDays.filter(
                (day) =>
                  day !== dayValue
              )
            : [
                ...currentForm.targetDays,
                dayValue
              ].sort(
                (
                  firstDay,
                  secondDay
                ) =>
                  firstDay -
                  secondDay
              )
        };
      }
    );

    setFormError("");
  };

  const validateForm = () => {
    if (!form.habitName.trim()) {
      return "Enter a name for your habit.";
    }

    if (
      form.habitName.trim()
        .length > 120
    ) {
      return "Habit name cannot exceed 120 characters.";
    }

    if (
      form.description.trim()
        .length > 5000
    ) {
      return "Description cannot exceed 5000 characters.";
    }

    if (
      form.frequencyType ===
        "custom" &&
      form.targetDays.length === 0
    ) {
      return "Select at least one day for a custom schedule.";
    }

    if (
      form.trackingType !==
        "boolean" &&
      (
        !Number.isFinite(
          Number(
            form.targetValue
          )
        ) ||
        Number(
          form.targetValue
        ) < 1
      )
    ) {
      return "Target value must be at least 1.";
    }

    if (
      form.endDate &&
      form.endDate <
        form.startDate
    ) {
      return "End date cannot be earlier than the start date.";
    }

    if (
      form.reminderEnabled &&
      !form.reminderTime
    ) {
      return "Choose a reminder time.";
    }

    return "";
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (validationMessage) {
      setFormError(
        validationMessage
      );

      return;
    }

    try {
      await onCreate({
        habitName:
          form.habitName.trim(),

        description:
          form.description.trim() ||
          null,

        category:
          form.category,

        trackingType:
          form.trackingType,

        targetValue:
          form.trackingType ===
          "boolean"
            ? 1
            : Number(
                form.targetValue
              ),

        targetUnit:
          form.trackingType ===
          "boolean"
            ? "times"
            : form.targetUnit,

        frequencyType:
          form.frequencyType,

        targetDays:
          form.frequencyType ===
          "custom"
            ? form.targetDays
            : [],

        targetCountPerPeriod:
          null,

        startDate:
          form.startDate,

        endDate:
          form.endDate || null,

        reminderEnabled:
          form.reminderEnabled,

        reminderTime:
          form.reminderEnabled
            ? form.reminderTime
            : null
      });
    } catch {
      // Parent page displays
      // the API error.
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="habit-modal"
      role="presentation"
    >
      <button
        type="button"
        className="habit-modal__backdrop"
        onClick={
          saving
            ? undefined
            : onClose
        }
        aria-label="Close create habit modal"
      />

      <section
        className="habit-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-habit-title"
      >
        <header className="habit-modal__header">
          <div className="habit-modal__heading">
            <span>
              <Plus size={20} />
            </span>

            <div>
              <small>
                New daily routine
              </small>

              <h2 id="create-habit-title">
                Create a habit
              </h2>

              <p>
                Start with something small,
                realistic and meaningful.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="habit-modal__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </header>

        <form
          className="habit-modal__form"
          onSubmit={handleSubmit}
        >
          {formError && (
            <div
              className="habit-modal__error"
              role="alert"
            >
              {formError}
            </div>
          )}

          <label className="habit-field">
            <span>
              Habit name
              <strong>*</strong>
            </span>

            <input
              type="text"
              maxLength={120}
              value={form.habitName}
              placeholder="For example, meditate for ten minutes"
              autoFocus
              onChange={(event) =>
                updateField(
                  "habitName",
                  event.target.value
                )
              }
            />
          </label>

          <label className="habit-field">
            <span>
              Description
              <small>Optional</small>
            </span>

            <textarea
              rows={3}
              maxLength={5000}
              value={form.description}
              placeholder="Add a gentle reminder about why this habit matters."
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value
                )
              }
            />
          </label>

          <div className="habit-form-grid">
            <label className="habit-field">
              <span>Category</span>

              <UnwindSelect
  value={form.category}
  onChange={(event) =>
    updateField(
      "category",
      event.target.value
    )
  }
>
  {categories.map(
    (category) => (
      <option
        key={category.value}
        value={category.value}
      >
        {category.label}
      </option>
    )
  )}
</UnwindSelect>
            </label>

            <label className="habit-field">
              <span>Start date</span>

<UnwindDatePicker
  name="startDate"
  value={form.startDate}
  onChange={(event) =>
    updateField(
      "startDate",
      event.target.value
    )
  }
/>
            </label>
          </div>

          <fieldset className="habit-fieldset">
            <legend>
              <Target size={15} />
              How will you track it?
            </legend>

            <div className="habit-tracking-options">
              {trackingTypes.map(
                (trackingType) => {
                  const active =
                    form.trackingType ===
                    trackingType.value;

                  return (
                    <button
                      key={
                        trackingType.value
                      }
                      type="button"
                      className={
                        active
                          ? "habit-tracking-option habit-tracking-option--active"
                          : "habit-tracking-option"
                      }
                      onClick={() =>
                        handleTrackingTypeChange(
                          trackingType.value
                        )
                      }
                    >
                      <span>
                        {active ? (
                          <Check
                            size={16}
                          />
                        ) : (
                          <Target
                            size={16}
                          />
                        )}
                      </span>

                      <div>
                        <strong>
                          {
                            trackingType.label
                          }
                        </strong>

                        <small>
                          {
                            trackingType.description
                          }
                        </small>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </fieldset>

          {form.trackingType !==
            "boolean" && (
            <div className="habit-form-grid">
              <label className="habit-field">
                <span>
                  Daily target
                </span>

                <input
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  value={form.targetValue}
                  onChange={(event) =>
                    updateField(
                      "targetValue",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="habit-field">
                <span>Unit</span>

               <UnwindSelect
  value={form.targetUnit}
  onChange={(event) =>
    updateField(
      "targetUnit",
      event.target.value
    )
  }
>
  {targetUnitOptions.map(
    (unit) => (
      <option
        key={unit}
        value={unit}
      >
        {unit}
      </option>
    )
  )}
</UnwindSelect>
              </label>
            </div>
          )}

          <fieldset className="habit-fieldset">
            <legend>
              <Repeat2 size={15} />
              Schedule
            </legend>

            <div className="habit-frequency-options">
              {[
                {
                  value: "daily",
                  label: "Every day"
                },
                {
                  value: "weekly",
                  label: "Weekly"
                },
                {
                  value: "custom",
                  label: "Choose days"
                }
              ].map(
                (frequency) => (
                  <button
                    key={
                      frequency.value
                    }
                    type="button"
                    className={
                      form.frequencyType ===
                      frequency.value
                        ? "habit-frequency-option habit-frequency-option--active"
                        : "habit-frequency-option"
                    }
                    onClick={() =>
                      handleFrequencyChange(
                        frequency.value
                      )
                    }
                  >
                    {frequency.label}
                  </button>
                )
              )}
            </div>

            {form.frequencyType ===
              "custom" && (
              <div className="habit-weekdays">
                {weekDays.map(
                  (day) => {
                    const active =
                      form.targetDays.includes(
                        day.value
                      );

                    return (
                      <button
                        key={day.value}
                        type="button"
                        className={
                          active
                            ? "habit-weekday habit-weekday--active"
                            : "habit-weekday"
                        }
                        title={day.label}
                        onClick={() =>
                          toggleTargetDay(
                            day.value
                          )
                        }
                      >
                        {day.shortLabel}
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </fieldset>

          <div className="habit-form-grid">
            <label className="habit-field">
              <span>
                End date
                <small>Optional</small>
              </span>

              <UnwindDatePicker
  name="endDate"
  value={form.endDate}
  min={form.startDate}
  placeholder="No end date"
  onChange={(event) =>
    updateField(
      "endDate",
      event.target.value
    )
  }
/>
            </label>

            <div className="habit-reminder">
              <div>
                <span>
                  <Bell size={16} />
                </span>

                <div>
                  <strong>
                    Daily reminder
                  </strong>

                  <small>
                    Get a gentle reminder.
                  </small>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={
                  form.reminderEnabled
                }
                className={
                  form.reminderEnabled
                    ? "habit-switch habit-switch--active"
                    : "habit-switch"
                }
                onClick={() =>
                  updateField(
                    "reminderEnabled",
                    !form.reminderEnabled
                  )
                }
              >
                <span />
              </button>
            </div>
          </div>

          {form.reminderEnabled && (
            <label className="habit-field">
              <span>
                Reminder time
              </span>

              <div className="habit-input-icon">
                <Clock3 size={16} />

                <input
                  type="time"
                  value={
                    form.reminderTime
                  }
                  onChange={(event) =>
                    updateField(
                      "reminderTime",
                      event.target.value
                    )
                  }
                />
              </div>
            </label>
          )}

          <footer className="habit-modal__footer">
            <button
              type="button"
              className="habit-modal__cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="habit-modal__submit"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle
                  size={17}
                  className="trackers-icon-spin"
                />
              ) : (
                <Plus size={17} />
              )}

              {saving
                ? "Creating habit…"
                : "Create habit"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default CreateHabitModal;