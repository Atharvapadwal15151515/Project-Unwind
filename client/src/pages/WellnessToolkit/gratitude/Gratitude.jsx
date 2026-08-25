import {
  ArrowLeft,
  Check,
  Heart,
  LoaderCircle,
  NotebookPen,
  RotateCcw
} from "lucide-react";

import {
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  addWellnessHistoryEntry
} from "../../../utils/wellnessStorage";

import {
  completeJournalEntry,
  createJournalEntry,
  getJournalError
} from "../../../services/journalService";

import "./Gratitude.css";

function Gratitude() {
  const navigate =
    useNavigate();

  const [
    entries,
    setEntries
  ] = useState([
    "",
    "",
    ""
  ]);

  const [
    complete,
    setComplete
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Journal integration
  |--------------------------------------------------------------------------
  */

  const [
    savingToJournal,
    setSavingToJournal
  ] = useState(false);

  const [
    journalSaved,
    setJournalSaved
  ] = useState(false);

  const [
    journalError,
    setJournalError
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Completion state
  |--------------------------------------------------------------------------
  */

  const completedCount =
    useMemo(
      () =>
        entries.filter(
          (item) =>
            item.trim()
        ).length,
      [entries]
    );

  const canComplete =
    completedCount === 3;

  /*
  |--------------------------------------------------------------------------
  | Update entry
  |--------------------------------------------------------------------------
  */

  const updateEntry =
    (
      index,
      value
    ) => {
      setEntries(
        (
          current
        ) =>
          current.map(
            (
              item,
              currentIndex
            ) =>
              currentIndex ===
              index
                ? value
                : item
          )
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Complete Gratitude activity
  |--------------------------------------------------------------------------
  */

  const handleComplete =
    () => {
      if (
        !canComplete
      ) {
        return;
      }

      addWellnessHistoryEntry({
        toolId:
          "gratitude",

        toolName:
          "Gratitude",

        type:
          "gratitude",

        completedItems:
          3
      });

      setComplete(true);
    };

  /*
  |--------------------------------------------------------------------------
  | Restart
  |--------------------------------------------------------------------------
  */

  const restart =
    () => {
      setEntries([
        "",
        "",
        ""
      ]);

      setComplete(false);

      setJournalSaved(false);
      setJournalError("");
      setSavingToJournal(false);
    };

  /*
  |--------------------------------------------------------------------------
  | Build Journal content
  |--------------------------------------------------------------------------
  */

  const buildJournalContent =
    () => {
      return [
        "Three things I'm grateful for today:",
        "",
        `1. ${entries[0].trim()}`,
        "",
        `2. ${entries[1].trim()}`,
        "",
        `3. ${entries[2].trim()}`
      ].join("\n");
    };

  /*
  |--------------------------------------------------------------------------
  | Save Gratitude Reflection to Journal
  |--------------------------------------------------------------------------
  */

  const handleSaveToJournal =
  async () => {
    if (
      !canComplete ||
      savingToJournal ||
      journalSaved
    ) {
      return;
    }

    try {
      setSavingToJournal(true);
      setJournalError("");

      const journalContent =
        buildJournalContent();

      /*
      |--------------------------------------------------------------------------
      | Create Toolkit reflection as a normal Journal entry
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      |
      | This is intentionally "standard".
      |
      | "prompt" / prompt-based Journal entries belong to the
      | Journal Prompt system and should only be used when an actual
      | Journal prompt is involved.
      |
      | Gratitude is coming from Wellness Toolkit, so it should create
      | a normal Journal entry containing the completed reflection.
      |--------------------------------------------------------------------------
      */

      const createdEntry =
        await createJournalEntry({
          title:
            "Gratitude Reflection",

          content:
            journalContent,

          entryType:
            "standard"
        });

      if (!createdEntry) {
        throw new Error(
          "Journal entry could not be created."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Mark Journal entry completed
      |--------------------------------------------------------------------------
      */

      const completedEntry =
        await completeJournalEntry(
          createdEntry
        );

      if (!completedEntry) {
        throw new Error(
          "Journal entry was created but could not be completed."
        );
      }

      setJournalSaved(true);
    } catch (error) {
      console.error(
        "Unable to save Gratitude reflection to Journal:",
        error
      );

      console.error(
        "Journal API response:",
        error?.response?.data
      );

      setJournalError(
        getJournalError(
          error,
          "Unable to save this gratitude reflection to your journal."
        )
      );
    } finally {
      setSavingToJournal(false);
    }
  };

  return (
    <main className="gratitude-page">
      <header className="gratitude-header">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/dashboard/toolkit"
            )
          }
        >
          <ArrowLeft
            size={17}
          />

          Back
        </button>

        <div>
          <span>
            Emotional Wellness
          </span>

          <h1>
            Gratitude
          </h1>
        </div>
      </header>

      {!complete ? (
        <section className="gratitude-card">
          <div className="gratitude-card__icon">
            <Heart
              size={25}
            />
          </div>

          <span className="gratitude-eyebrow">
            A small pause
          </span>

          <h2>
            Name 3 things
            you&apos;re grateful
            for today.
          </h2>

          <p>
            They don&apos;t have
            to be big. Something
            simple still counts.
          </p>

          <div className="gratitude-entry-list">
            {entries.map(
              (
                entry,
                index
              ) => (
                <label
                  key={
                    index
                  }
                  className={
                    entry.trim()
                      ? "gratitude-entry gratitude-entry--filled"
                      : "gratitude-entry"
                  }
                >
                  <span className="gratitude-entry__number">
                    {index + 1}
                  </span>

                  <textarea
                    rows={3}
                    value={
                      entry
                    }
                    placeholder={
                      index === 0
                        ? "Something that made today a little better..."
                        : index === 1
                          ? "Someone, somewhere, or something you appreciate..."
                          : "One more thing you're grateful for..."
                    }
                    onChange={(
                      event
                    ) =>
                      updateEntry(
                        index,
                        event
                          .target
                          .value
                      )
                    }
                  />

                  {entry.trim() && (
                    <Check
                      size={16}
                    />
                  )}
                </label>
              )
            )}
          </div>

          <div className="gratitude-progress">
            <span>
              {completedCount} of 3
              complete
            </span>

            <div>
              <span
                style={{
                  width:
                    `${(completedCount / 3) * 100}%`
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className="gratitude-primary"
            disabled={
              !canComplete
            }
            onClick={
              handleComplete
            }
          >
            Complete reflection

            <Check
              size={16}
            />
          </button>
        </section>
      ) : (
        <section className="gratitude-complete">
          <div className="gratitude-complete__icon">
            <Heart
              size={27}
            />
          </div>

          <span>
            Reflection complete
          </span>

          <h2>
            Three good things
            are worth noticing.
          </h2>

          <p>
            You took a moment to
            notice something
            meaningful. You can
            leave it here or save
            the reflection to your
            journal.
          </p>

          <div className="gratitude-summary">
            {entries.map(
              (
                entry,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="gratitude-summary__item"
                >
                  <span>
                    {index + 1}
                  </span>

                  <p>
                    {entry}
                  </p>
                </div>
              )
            )}
          </div>

          {journalError && (
            <div
              className="gratitude-journal-message gratitude-journal-message--error"
              role="alert"
            >
              {journalError}
            </div>
          )}

          {journalSaved && (
            <div
              className="gratitude-journal-message gratitude-journal-message--success"
              role="status"
            >
              <Check
                size={16}
              />

              <span>
                Saved to your Journal.
              </span>
            </div>
          )}

          <div className="gratitude-complete__actions">
            {!journalSaved && (
              <>
                <button
                  type="button"
                  className="gratitude-secondary"
                  onClick={
                    restart
                  }
                  disabled={
                    savingToJournal
                  }
                >
                  <RotateCcw
                    size={16}
                  />

                  Start again
                </button>

                <button
                  type="button"
                  className="gratitude-secondary"
                  onClick={() =>
                    navigate(
                      "/dashboard/toolkit"
                    )
                  }
                  disabled={
                    savingToJournal
                  }
                >
                  Done
                </button>
              </>
            )}

            {!journalSaved ? (
              <button
                type="button"
                className="gratitude-primary"
                onClick={
                  handleSaveToJournal
                }
                disabled={
                  savingToJournal
                }
              >
                {savingToJournal ? (
                  <>
                    <LoaderCircle
                      className="gratitude-spin"
                      size={16}
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <NotebookPen
                      size={16}
                    />

                    Save to Journal
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="gratitude-secondary"
                  onClick={() =>
                    navigate(
                      "/dashboard/toolkit"
                    )
                  }
                >
                  Done
                </button>

                <button
                  type="button"
                  className="gratitude-primary"
                  onClick={() =>
                    navigate(
                      "/dashboard/journal"
                    )
                  }
                >
                  <NotebookPen
                    size={16}
                  />

                  Open Journal
                </button>
              </>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default Gratitude;