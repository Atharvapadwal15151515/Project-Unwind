import {
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  LoaderCircle,
  Plus,
  SkipForward,
  Sparkles,
  Trash2
} from "lucide-react";

import {
  useState
} from "react";
import AppEmptyState
  from "../common/AppStates/AppEmptyState";

import ButtonLoader
  from "../common/AppStates/ButtonLoader";

function getHabitId(habit) {
  return (
    habit?.habit_id ||
    habit?.habitId ||
    habit?.id ||
    null
  );
}

function getHabitName(habit) {
  return (
    habit?.habit_name ||
    habit?.habitName ||
    habit?.name ||
    "Daily habit"
  );
}

function getHabitDescription(habit) {
  return (
    habit?.description ||
    habit?.habit_description ||
    habit?.habitDescription ||
    ""
  );
}

function getHabitStatus(habit) {
  return (
    habit?.status ||
    habit?.log_status ||
    habit?.habit_log?.status ||
    habit?.habitLog?.status ||
    "pending"
  );
}

function getHabitStreak(habit) {
  const streak = Number(
    habit?.current_streak ??
      habit?.currentStreak ??
      habit?.streak ??
      0
  );

  return Number.isFinite(streak)
    ? streak
    : 0;
}

function getHabitTarget(habit) {
  const target = Number(
    habit?.target_value ??
      habit?.targetValue ??
      1
  );

  return Number.isFinite(target)
    ? target
    : 1;
}

function getHabitUnit(habit) {
  return (
    habit?.target_unit ||
    habit?.targetUnit ||
    ""
  );
}

function HabitTrackerCard({
  habits = [],
  savingTracker,
  onCreate,
  onComplete,
  onSkip,
  onDelete
}) {
  const [
    deleteCandidate,
    setDeleteCandidate
  ] = useState(null);

  const habitList =
    Array.isArray(habits)
      ? habits
      : [];

  const handleDelete =
    async () => {
      const habitId =
        getHabitId(
          deleteCandidate
        );

      if (
        !habitId ||
        typeof onDelete !==
          "function"
      ) {
        return;
      }

      try {
        await onDelete(
          habitId
        );

        setDeleteCandidate(
          null
        );
      } catch {
        /*
         * The parent hook already
         * displays the API error.
         */
      }
    };

  if (habitList.length === 0) {
    return (
      <section className="habit-empty-state">
        <span className="habit-empty-state__icon">
          <Sparkles size={25} />
        </span>

        <h3>
          No habits scheduled today
        </h3>

        <p>
          Begin with one small habit that
          feels realistic and meaningful
          for you.
        </p>

        <button
          type="button"
          className="habit-create-button"
          onClick={onCreate}
        >
          <Plus size={17} />
          Create your first habit
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="habit-tracker-container">
        <header className="habit-tracker-container__header">
          <div>
            <span>
              {habitList.length}{" "}
              {habitList.length === 1
                ? "habit"
                : "habits"}{" "}
              scheduled
            </span>

            <p>
              Focus on consistency rather
              than perfection.
            </p>
          </div>

          <button
            type="button"
            className="habit-create-button habit-create-button--compact"
            onClick={onCreate}
          >
            <Plus size={16} />
            Create habit
          </button>
        </header>

        <div className="habit-grid">
          {habitList.map(
            (habit, index) => {
              const habitId =
                getHabitId(habit);

              const status =
                getHabitStatus(habit);

              const isCompleted =
                status ===
                "completed";

              const isSkipped =
                status ===
                "skipped";

              const saving =
                savingTracker ===
                `habit-${habitId}`;

              const deleting =
                savingTracker ===
                `habit-delete-${habitId}`;

              const streak =
                getHabitStreak(
                  habit
                );

              const description =
                getHabitDescription(
                  habit
                );

              const target =
                getHabitTarget(
                  habit
                );

              const unit =
                getHabitUnit(
                  habit
                );

              return (
                <article
                  key={
                    habitId ||
                    `habit-${index}`
                  }
                  className={[
                    "habit-card",
                    isCompleted
                      ? "habit-card--completed"
                      : "",
                    isSkipped
                      ? "habit-card--skipped"
                      : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <button
                    type="button"
                    className="habit-card__delete"
                    aria-label={`Delete ${getHabitName(
                      habit
                    )}`}
                    title="Delete habit"
                    disabled={
                      !habitId ||
                      deleting
                    }
                    onClick={() =>
                      setDeleteCandidate(
                        habit
                      )
                    }
                  >
                    {deleting ? (
                      <LoaderCircle
                        size={16}
                        className="trackers-icon-spin"
                      />
                    ) : (
                      <Trash2
                        size={16}
                      />
                    )}
                  </button>

                  <header>
                    <span className="habit-card__status-icon">
                      {isCompleted ? (
                        <CheckCircle2
                          size={21}
                        />
                      ) : isSkipped ? (
                        <SkipForward
                          size={21}
                        />
                      ) : (
                        <Circle
                          size={21}
                        />
                      )}
                    </span>

                    <div className="habit-card__content">
                      <h3>
                        {getHabitName(
                          habit
                        )}
                      </h3>

                      {description && (
                        <p>
                          {
                            description
                          }
                        </p>
                      )}
                    </div>
                  </header>

                  <div className="habit-card__information">
                    <div className="habit-card__streak">
                      <Clock3
                        size={15}
                      />

                      <span>
                        {streak} day
                        {streak === 1
                          ? ""
                          : "s"}{" "}
                        streak
                      </span>
                    </div>

                    {target > 1 && (
                      <div className="habit-card__target">
                        <span>
                          Goal:{" "}
                          {target}
                          {unit
                            ? ` ${unit}`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <footer>
                    <button
                      type="button"
                      className="habit-card__complete"
                      onClick={() => {
                        if (
                          habitId &&
                          typeof onComplete ===
                            "function"
                        ) {
                          onComplete(
                            habitId
                          );
                        }
                      }}
                      disabled={
                        !habitId ||
                        saving ||
                        deleting ||
                        isCompleted ||
                        isSkipped
                      }
                    >
                      {saving ? (
                        <LoaderCircle
                          size={15}
                          className="trackers-icon-spin"
                        />
                      ) : (
                        <Check
                          size={15}
                        />
                      )}

                      {isCompleted
                        ? "Completed"
                        : "Complete"}
                    </button>

                    <button
                      type="button"
                      className="habit-card__skip"
                      onClick={() => {
                        if (
                          habitId &&
                          typeof onSkip ===
                            "function"
                        ) {
                          onSkip(
                            habitId
                          );
                        }
                      }}
                      disabled={
                        !habitId ||
                        saving ||
                        deleting ||
                        isCompleted ||
                        isSkipped
                      }
                    >
                      {saving ? (
                        <LoaderCircle
                          size={15}
                          className="trackers-icon-spin"
                        />
                      ) : (
                        <SkipForward
                          size={15}
                        />
                      )}

                      {isSkipped
                        ? "Skipped"
                        : "Skip"}
                    </button>
                  </footer>
                </article>
              );
            }
          )}
        </div>
      </section>

      {deleteCandidate && (
        <div
          className="habit-delete-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDeleteCandidate(
                null
              );
            }
          }}
        >
          <div
            className="habit-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="habit-delete-title"
          >
            <span className="habit-delete-modal__icon">
              <Trash2
                size={23}
              />
            </span>

            <h3
              id="habit-delete-title"
            >
              Delete habit?
            </h3>

            <p>
              Are you sure you want to
              delete{" "}
              <strong>
                {getHabitName(
                  deleteCandidate
                )}
              </strong>
              ?
            </p>

            <span className="habit-delete-modal__hint">
              This habit will be removed
              from your active habit
              tracker.
            </span>

            <div className="habit-delete-modal__actions">
              <button
                type="button"
                className="habit-delete-modal__cancel"
                onClick={() =>
                  setDeleteCandidate(
                    null
                  )
                }
                disabled={
                  savingTracker ===
                  `habit-delete-${getHabitId(
                    deleteCandidate
                  )}`
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="habit-delete-modal__confirm"
                onClick={
                  handleDelete
                }
                disabled={
                  savingTracker ===
                  `habit-delete-${getHabitId(
                    deleteCandidate
                  )}`
                }
              >
                {savingTracker ===
                `habit-delete-${getHabitId(
                  deleteCandidate
                )}` ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="trackers-icon-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2
                      size={16}
                    />
                    Delete habit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HabitTrackerCard;