import {
  ArrowLeft,
  Check,
  LoaderCircle,
  NotebookPen,
  RotateCcw,
  Trash2
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

import "./ThoughtDump.css";

const categories = [
  "Work",
  "College",
  "Relationship",
  "Family",
  "Health",
  "Future",
  "Other"
];

function ThoughtDump() {
  const navigate =
    useNavigate();

  const [
    text,
    setText
  ] = useState("");

  const [
    category,
    setCategory
  ] = useState(null);

  const [
    complete,
    setComplete
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Journal integration state
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
  | Word count
  |--------------------------------------------------------------------------
  */

  const wordCount =
    useMemo(() => {
      const trimmed =
        text.trim();

      if (!trimmed) {
        return 0;
      }

      return trimmed
        .split(/\s+/)
        .length;
    }, [text]);

  const canContinue =
    text.trim().length > 0;

  /*
  |--------------------------------------------------------------------------
  | Finish thought dump
  |--------------------------------------------------------------------------
  */

  const handleFinish =
    () => {
      if (!canContinue) {
        return;
      }

      addWellnessHistoryEntry({
        toolId:
          "thought-dump",

        toolName:
          "Thought Dump",

        type:
          "thought-dump",

        category:
          category || null,

        wordCount
      });

      setComplete(true);
    };

  /*
  |--------------------------------------------------------------------------
  | Discard
  |--------------------------------------------------------------------------
  */

  const handleDiscard =
    () => {
      setText("");
      setCategory(null);
      setComplete(false);

      setJournalSaved(false);
      setJournalError("");
      setSavingToJournal(false);
    };

  /*
  |--------------------------------------------------------------------------
  | Restart
  |--------------------------------------------------------------------------
  */

  const handleRestart =
    () => {
      setText("");
      setCategory(null);
      setComplete(false);

      setJournalSaved(false);
      setJournalError("");
      setSavingToJournal(false);
    };

  /*
  |--------------------------------------------------------------------------
  | Continue reflecting
  |--------------------------------------------------------------------------
  */

  const handleContinueReflecting =
    () => {
      setComplete(false);

      setJournalError("");
    };

  /*
  |--------------------------------------------------------------------------
  | Save Thought Dump to Journal
  |--------------------------------------------------------------------------
  |
  | Important:
  |
  | 1. We use the EXISTING Journal backend.
  | 2. No duplicate Toolkit journal storage.
  | 3. The entry is first created normally.
  | 4. Then we use the Journal's existing complete endpoint.
  |--------------------------------------------------------------------------
  */

  const handleSaveToJournal =
    async () => {
      if (
        !text.trim() ||
        savingToJournal ||
        journalSaved
      ) {
        return;
      }

      try {
        setSavingToJournal(true);
        setJournalError("");

        const title =
          category
            ? `Thought Dump — ${category}`
            : "Thought Dump";

        /*
        |--------------------------------------------------------------------------
        | Create normal Journal entry
        |--------------------------------------------------------------------------
        */

        const createdEntry =
          await createJournalEntry({
            title,

            content:
              text.trim(),

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
        | Mark it completed using the Journal's own completion system
        |--------------------------------------------------------------------------
        */

        await completeJournalEntry(
          createdEntry
        );

        setJournalSaved(true);
      } catch (error) {
        console.error(
          "Unable to save Thought Dump to Journal:",
          error
        );

        setJournalError(
          getJournalError(
            error,
            "Unable to save this Thought Dump to your journal."
          )
        );
      } finally {
        setSavingToJournal(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="thought-dump-page">
      <header className="thought-dump-header">
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
            Clear Your Mind
          </span>

          <h1>
            Thought Dump
          </h1>
        </div>
      </header>

      {!complete ? (
        <section className="thought-dump-card">
          <div className="thought-dump-card__icon">
            <NotebookPen
              size={24}
            />
          </div>

          <span className="thought-dump-eyebrow">
            Make some space
          </span>

          <h2>
            What&apos;s taking up
            space in your mind?
          </h2>

          <p>
            Write freely. It doesn&apos;t
            need to be organized,
            polished or complete.
          </p>

          <div className="thought-dump-categories">
            {categories.map(
              (item) => (
                <button
                  key={
                    item
                  }
                  type="button"
                  className={
                    category === item
                      ? "thought-dump-category thought-dump-category--active"
                      : "thought-dump-category"
                  }
                  onClick={() =>
                    setCategory(
                      (
                        current
                      ) =>
                        current ===
                        item
                          ? null
                          : item
                    )
                  }
                >
                  {item}
                </button>
              )
            )}
          </div>

          <label className="thought-dump-input">
            <span>
              Write whatever comes
              to mind
            </span>

            <textarea
              rows={14}
              value={
                text
              }
              placeholder="Start anywhere..."
              onChange={(
                event
              ) =>
                setText(
                  event.target
                    .value
                )
              }
            />
          </label>

          <div className="thought-dump-meta">
            <span>
              {wordCount}{" "}
              {wordCount === 1
                ? "word"
                : "words"}
            </span>

            <span>
              {category
                ? `Category: ${category}`
                : "No category selected"}
            </span>
          </div>

          <div className="thought-dump-actions">
            <button
              type="button"
              className="thought-dump-secondary"
              onClick={
                handleDiscard
              }
              disabled={
                !text &&
                !category
              }
            >
              <Trash2
                size={16}
              />

              Discard
            </button>

            <button
              type="button"
              className="thought-dump-primary"
              disabled={
                !canContinue
              }
              onClick={
                handleFinish
              }
            >
              Done writing

              <Check
                size={16}
              />
            </button>
          </div>
        </section>
      ) : (
        <section className="thought-dump-complete">
          <div className="thought-dump-complete__icon">
            <Check
              size={26}
            />
          </div>

          <span>
            Thought dump complete
          </span>

          <h2>
            You got it out
            of your head.
          </h2>

          <p>
            You wrote {wordCount}{" "}
            {wordCount === 1
              ? "word"
              : "words"}

            {category
              ? ` about ${category.toLowerCase()}`
              : ""}

            . You can leave it here,
            continue reflecting, or
            save it to your journal.
          </p>

          <div className="thought-dump-complete__preview">
            {text}
          </div>

          {journalError && (
            <div
              className="thought-dump-journal-message thought-dump-journal-message--error"
              role="alert"
            >
              {journalError}
            </div>
          )}

          {journalSaved && (
            <div
              className="thought-dump-journal-message thought-dump-journal-message--success"
              role="status"
            >
              <Check size={16} />

              <span>
                Saved to your Journal.
              </span>
            </div>
          )}

          <div className="thought-dump-complete__actions">
            {!journalSaved && (
              <>
                <button
                  type="button"
                  className="thought-dump-secondary"
                  onClick={
                    handleRestart
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
                  className="thought-dump-secondary"
                  onClick={
                    handleContinueReflecting
                  }
                  disabled={
                    savingToJournal
                  }
                >
                  Continue reflecting
                </button>
              </>
            )}

            {!journalSaved ? (
              <button
                type="button"
                className="thought-dump-primary"
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
                      className="thought-dump-spin"
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
              <button
                type="button"
                className="thought-dump-primary"
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
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default ThoughtDump;