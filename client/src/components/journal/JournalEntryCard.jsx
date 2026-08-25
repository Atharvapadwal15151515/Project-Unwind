import {
  Download,
  Heart
} from "lucide-react";

import {
  useState
} from "react";

import {
  formatJournalDate,
  getJournalEntryId,
  getJournalField,
  getJournalMood,
  getJournalStatus,
  isJournalFavourite
} from "../../utils/journalUtils";

import {
  exportJournalEntry
} from "../../utils/journalExport";

import {
  getJournalEntry
} from "../../services/journalService";

function JournalEntryCard({
  entry,
  busy,
  onOpen,
  onToggleFavourite
}) {
  const mood =
    getJournalMood(
      entry
    );

  const favourite =
    isJournalFavourite(
      entry
    );

  const [
    exporting,
    setExporting
  ] =
    useState(false);

  const title =
    getJournalField(
      entry,
      "title",
      "title"
    ) ||
    "Untitled reflection";

  const content =
    getJournalField(
      entry,
      "content",
      "content"
    ) ||
    "No preview for this private reflection.";

  const entryDate =
    getJournalField(
      entry,
      "entryDate",
      "entry_date"
    );

  const moodLabel =
  mood?.label ||
  "Mood";

  /*
  |--------------------------------------------------------------------------
  | Open Entry with Keyboard
  |--------------------------------------------------------------------------
  */

  function handleKeyDown(
    event
  ) {
    if (
      event.key ===
        "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      onOpen(
        entry
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Favourite
  |--------------------------------------------------------------------------
  */

  function handleFavourite(
    event
  ) {
    event.stopPropagation();

    onToggleFavourite(
      entry
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Export
  |--------------------------------------------------------------------------
  */

  async function handleExport(
  event
) {
  event.stopPropagation();

  if (exporting) {
    return;
  }

  try {
    setExporting(
      true
    );

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Do NOT export the JournalEntryCard object.
    |
    | The card/list API is intentionally lightweight and may not contain:
    | - mood
    | - prompt
    | - emotions
    | - activities
    | - attachments
    | - transcripts
    | - complete timestamps
    |
    | Fetch the backend's full single-entry representation first.
    |
    */

    const fullEntry =
      await getJournalEntry(
        entry
      );

    if (!fullEntry) {
      throw new Error(
        "Unable to load the complete journal entry."
      );
    }

    exportJournalEntry(
      fullEntry,
      "pdf"
    );
  } catch (error) {
    console.error(
      "Unable to export journal entry:",
      error
    );
  } finally {
    setExporting(
      false
    );
  }
}


  return (
    <article
      className="journal-entry-card"
      tabIndex={0}
      onClick={() =>
        onOpen(
          entry
        )
      }
      onKeyDown={
        handleKeyDown
      }
      aria-label={`Open ${title}`}
      data-entry-id={
        getJournalEntryId(
          entry
        )
      }
    >
      <div className="journal-entry-card__top">
        <span>
          {formatJournalDate(
            entryDate
          )}
        </span>

        <div className="journal-entry-card__actions">
          <button
            type="button"
            className="journal-entry-card__export"
            disabled={
              busy ||
              exporting
            }
            onClick={
              handleExport
            }
            aria-label={`Export ${title} as PDF`}
            title="Export as PDF"
          >
            <Download
              size={17}
            />
          </button>

          <button
            type="button"
            className={
              favourite
                ? "is-favourite"
                : ""
            }
            disabled={busy}
            onClick={
              handleFavourite
            }
            aria-label={
              favourite
                ? "Remove from favourites"
                : "Add to favourites"
            }
          >
            <Heart
              size={17}
              fill={
                favourite
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {content}
      </p>

      <footer>
        {mood ? (
          <span>
            {mood.emoji}{" "}
            {moodLabel}
          </span>
        ) : (
          <span />
        )}

        <small>
          {getJournalStatus(
            entry
          )}
        </small>
      </footer>
    </article>
  );
}

export default JournalEntryCard;