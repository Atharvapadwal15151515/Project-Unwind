import {
  ArrowLeft,
  ArrowRight,
  Check,
  HeartPulse,
  LoaderCircle,
  NotebookPen
} from "lucide-react";

import {
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  emotionalCheckinOptions
} from "../../../data/wellness/emotions";

import {
  wellnessRecommendations
} from "../../../data/wellness/recommendations";

import {
  wellnessTools
} from "../../../data/wellness/tools";

import {
  addWellnessHistoryEntry
} from "../../../utils/wellnessStorage";

import {
  completeJournalEntry,
  createJournalEntry,
  getJournalError
} from "../../../services/journalService";

import "./EmotionalCheckin.css";

/*
|--------------------------------------------------------------------------
| Convert Toolkit emotion into Journal mood score
|--------------------------------------------------------------------------
|
| Journal mood_score uses a 1–5 scale.
|
| Toolkit intensity is NOT the same thing as mood score.
| Intensity tells us how strongly the emotion is felt.
|
| Therefore we derive the Journal mood score from the selected emotion,
| while keeping intensity inside the journal content.
|--------------------------------------------------------------------------
*/

function EmotionalCheckin() {
  const navigate =
    useNavigate();

  const [
    selectedEmotion,
    setSelectedEmotion
  ] = useState(null);

  const [
    intensity,
    setIntensity
  ] = useState(5);

  const [
    note,
    setNote
  ] = useState("");

  const [
    complete,
    setComplete
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Journal state
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
  | Recommendations
  |--------------------------------------------------------------------------
  */

  const recommendedTools =
    useMemo(() => {
      if (!selectedEmotion) {
        return [];
      }

      const ids =
        wellnessRecommendations[
          selectedEmotion
        ] || [];

      return ids
        .map((id) =>
          wellnessTools.find(
            (tool) =>
              tool.id === id
          )
        )
        .filter(Boolean)
        .slice(0, 3);
    }, [selectedEmotion]);

  const selectedEmotionData =
    emotionalCheckinOptions.find(
      (emotion) =>
        emotion.id ===
        selectedEmotion
    );

  /*
  |--------------------------------------------------------------------------
  | Finish check-in
  |--------------------------------------------------------------------------
  */

  const handleComplete =
    () => {
      if (!selectedEmotion) {
        return;
      }

      addWellnessHistoryEntry({
        toolId:
          "emotional-checkin",

        toolName:
          "Emotional Check-In",

        type:
          "emotional-checkin",

        emotion:
          selectedEmotion,

        intensity
      });

      setComplete(true);
    };

  /*
  |--------------------------------------------------------------------------
  | Start another check-in
  |--------------------------------------------------------------------------
  */

  const handleCheckInAgain =
    () => {
      setSelectedEmotion(null);

      setIntensity(5);

      setNote("");

      setComplete(false);

      setJournalSaved(false);

      setJournalError("");

      setSavingToJournal(false);
    };

  /*
  |--------------------------------------------------------------------------
  | Journal content
  |--------------------------------------------------------------------------
  */

  const buildJournalContent =
    () => {
      const label =
        selectedEmotionData
          ?.label ||
        "Unknown";

      const emoji =
        selectedEmotionData
          ?.emoji ||
        "";

      const parts = [
        "Emotional Check-In",
        "",
        `Feeling: ${emoji} ${label}`.trim(),
        "",
        `Intensity: ${intensity}/10`
      ];

      if (
        note.trim()
      ) {
        parts.push(
          "",
          "What's contributing to this feeling?",
          "",
          note.trim()
        );
      }

      return parts.join(
        "\n"
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Save Emotional Check-In to Journal
  |--------------------------------------------------------------------------
  */

 const handleSaveToJournal =
  async () => {
    if (
      !selectedEmotionData ||
      savingToJournal ||
      journalSaved
    ) {
      return;
    }

    try {
      setSavingToJournal(true);

      setJournalError("");

      /*
      |--------------------------------------------------------------------------
      | IMPORTANT
      |--------------------------------------------------------------------------
      |
      | Journal entry creation only receives fields supported by the
      | existing Journal create-entry validator.
      |
      | Do NOT send moodLabel / moodScore here.
      |--------------------------------------------------------------------------
      */

      const createdEntry =
        await createJournalEntry({
          title:
            `Emotional Check-In — ${selectedEmotionData.label}`,

          content:
            buildJournalContent(),

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
      | Complete through existing Journal endpoint
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
        "Unable to save Emotional Check-In to Journal:",
        error
      );

      console.error(
        "Journal API response:",
        error?.response?.data
      );

      console.error(
        "Journal validation details:",
        error?.response?.data?.details ||
        error?.response?.data?.errors ||
        null
      );

      setJournalError(
        getJournalError(
          error,
          "Unable to save this emotional check-in to your journal."
        )
      );
    } finally {
      setSavingToJournal(false);
    }
  };

  return (
    <main className="emotional-page">
      <header className="emotional-header">
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
            Emotional Support
          </span>

          <h1>
            Emotional Check-In
          </h1>
        </div>
      </header>

      {!complete ? (
        <section className="emotional-card">
          <div className="emotional-card__icon">
            <HeartPulse
              size={25}
            />
          </div>

          <span className="emotional-eyebrow">
            Pause for a moment
          </span>

          <h2>
            How are you feeling?
          </h2>

          <p>
            Pick the emotion that feels
            closest right now. It
            doesn&apos;t need to be exact.
          </p>

          <div className="emotional-grid">
            {emotionalCheckinOptions.map(
              (emotion) => {
                const active =
                  selectedEmotion ===
                  emotion.id;

                return (
                  <button
                    key={
                      emotion.id
                    }
                    type="button"
                    className={
                      active
                        ? "emotional-option emotional-option--active"
                        : "emotional-option"
                    }
                    onClick={() =>
                      setSelectedEmotion(
                        emotion.id
                      )
                    }
                  >
                    <span>
                      {emotion.emoji}
                    </span>

                    <strong>
                      {emotion.label}
                    </strong>
                  </button>
                );
              }
            )}
          </div>

          <div className="emotional-intensity">
            <div className="emotional-intensity__header">
              <div>
                <span>
                  Intensity
                </span>

                <strong>
                  How strong is it?
                </strong>
              </div>

              <strong>
                {intensity}/10
              </strong>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={
                intensity
              }
              onChange={(
                event
              ) =>
                setIntensity(
                  Number(
                    event.target
                      .value
                  )
                )
              }
            />

            <div className="emotional-intensity__labels">
              <span>
                Mild
              </span>

              <span>
                Strong
              </span>
            </div>
          </div>

          <label className="emotional-note">
            <span>
              What&apos;s contributing
              to this feeling?
              Optional
            </span>

            <textarea
              rows={4}
              value={
                note
              }
              placeholder="Write anything you want to notice..."
              onChange={(
                event
              ) =>
                setNote(
                  event.target
                    .value
                )
              }
            />
          </label>

          <button
            type="button"
            className="emotional-continue"
            disabled={
              !selectedEmotion
            }
            onClick={
              handleComplete
            }
          >
            Continue

            <ArrowRight
              size={16}
            />
          </button>
        </section>
      ) : (
        <section className="emotional-result">
          <div className="emotional-result__icon">
            <Check
              size={25}
            />
          </div>

          <span>
            Check-in complete
          </span>

          <h2>
            You&apos;re feeling{" "}
            {selectedEmotionData
              ?.label
              .toLowerCase()}
            .
          </h2>

          <p>
            You marked the intensity
            as {intensity}/10. Here are
            a few tools that may be
            useful right now.
          </p>

          {note.trim() && (
            <div className="emotional-note-preview">
              <span>
                Your reflection
              </span>

              <p>
                {note}
              </p>
            </div>
          )}

          <div className="emotional-recommendations">
            {recommendedTools.length >
            0 ? (
              recommendedTools.map(
                (tool) => (
                  <button
                    key={
                      tool.id
                    }
                    type="button"
                    onClick={() =>
                      navigate(
                        tool.route
                      )
                    }
                  >
                    <div>
                      <strong>
                        {tool.name}
                      </strong>

                      <span>
                        {tool.duration}
                      </span>
                    </div>

                    <ArrowRight
                      size={15}
                    />
                  </button>
                )
              )
            ) : (
              <div className="emotional-no-recommendations">
                Take a few quiet
                moments or explore the
                Toolkit for something
                that feels useful.
              </div>
            )}
          </div>

          {journalError && (
            <div
              className="emotional-journal-message emotional-journal-message--error"
              role="alert"
            >
              {journalError}
            </div>
          )}

          {journalSaved && (
            <div
              className="emotional-journal-message emotional-journal-message--success"
              role="status"
            >
              <Check
                size={16}
              />

              <span>
                Emotional Check-In saved
                to your Journal.
              </span>
            </div>
          )}

          <div className="emotional-result__actions">
            {!journalSaved && (
              <button
                type="button"
                className="emotional-secondary"
                onClick={
                  handleCheckInAgain
                }
                disabled={
                  savingToJournal
                }
              >
                Check in again
              </button>
            )}

            {!journalSaved && (
              <button
                type="button"
                className="emotional-secondary"
                onClick={() =>
                  navigate(
                    "/dashboard/toolkit"
                  )
                }
                disabled={
                  savingToJournal
                }
              >
                Return to Toolkit
              </button>
            )}

            {!journalSaved ? (
              <button
                type="button"
                className="emotional-primary"
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
                      className="emotional-spin"
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
                  className="emotional-secondary"
                  onClick={() =>
                    navigate(
                      "/dashboard/toolkit"
                    )
                  }
                >
                  Return to Toolkit
                </button>

                <button
                  type="button"
                  className="emotional-primary"
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

export default EmotionalCheckin;