import {
  Download,
  FileJson,
  FileText,
  Search,
  X
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  JOURNAL_FILTERS
} from "../../data/journalOptions";

import {
  exportJournal
} from "../../utils/journalExport";

import {
  getJournalEntry
} from "../../services/journalService";

function JournalToolbar({
  entries = [],
  query,
  filter,
  onQueryChange,
  onFilterChange
}) {
  const [
    showExportMenu,
    setShowExportMenu
  ] =
    useState(false);

  const [
    exportError,
    setExportError
  ] =
    useState("");

    const [
  exporting,
  setExporting
] =
  useState(false);

  const exportMenuRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Close Export Menu on Outside Click
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      function handlePointerDown(
        event
      ) {
        if (
          exportMenuRef.current &&
          !exportMenuRef.current.contains(
            event.target
          )
        ) {
          setShowExportMenu(
            false
          );
        }
      }

      document.addEventListener(
        "mousedown",
        handlePointerDown
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handlePointerDown
        );
      };
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Export
  |--------------------------------------------------------------------------
  */

  async function handleExport(
  format
) {
  if (
    exporting ||
    entries.length === 0
  ) {
    return;
  }

  try {
    setExporting(
      true
    );

    setExportError(
      ""
    );

    /*
    |--------------------------------------------------------------------------
    | Hydrate Every Journal Entry
    |--------------------------------------------------------------------------
    |
    | JournalLibrary contains summary objects.
    |
    | Export must use the backend single-entry endpoint so every export receives
    | all stored journal information.
    |
    */

    const results =
      await Promise.allSettled(
        entries.map(
          (entry) =>
            getJournalEntry(
              entry
            )
        )
      );

    const completeEntries =
      results
        .filter(
          (result) =>
            result.status ===
              "fulfilled" &&
            result.value
        )
        .map(
          (result) =>
            result.value
        );

    if (
      completeEntries.length ===
      0
    ) {
      throw new Error(
        "Unable to load the complete journal entries for export."
      );
    }

    /*
     * Do not silently produce an incomplete backup.
     */
    if (
      completeEntries.length !==
      entries.length
    ) {
      throw new Error(
        `Could not load all journal entries. Loaded ${completeEntries.length} of ${entries.length}. Export cancelled so no information is lost.`
      );
    }

    exportJournal(
      completeEntries,
      format
    );

    setShowExportMenu(
      false
    );
  } catch (error) {
    console.error(
      "Unable to export journal:",
      error
    );

    setExportError(
      error?.message ||
        "Unable to export your journal."
    );
  } finally {
    setExporting(
      false
    );
  }
}

  return (
    <>
      <header className="journal-library__header">
        <div>
          <span className="journal-section-label">
            Your reflections
          </span>

          <h2>
            Journal entries
          </h2>
        </div>

        <div className="journal-toolbar__actions">
          <label className="journal-search">
            <Search size={17} />

            <input
              type="search"
              value={query}
              onChange={(
                event
              ) =>
                onQueryChange(
                  event.target.value
                )
              }
              placeholder="Search your thoughts..."
              aria-label="Search journal entries"
            />

            {query ? (
              <button
                type="button"
                className="journal-search__clear"
                onClick={() =>
                  onQueryChange(
                    ""
                  )
                }
                aria-label="Clear journal search"
              >
                <X
                  size={15}
                />
              </button>
            ) : null}
          </label>

          <div
            className="journal-export"
            ref={
              exportMenuRef
            }
          >
            <button
              type="button"
              className="journal-export__button"
              disabled={
  entries.length === 0 ||
  exporting
}
              onClick={() => {
                setExportError(
                  ""
                );

                setShowExportMenu(
                  (
                    current
                  ) =>
                    !current
                );
              }}
            >
              <Download
  size={17}
/>

{exporting
  ? "Preparing..."
  : "Export"}
            </button>

            {showExportMenu ? (
              <div className="journal-export__menu">
                <div className="journal-export__heading">
                  <strong>
                    Export journal
                  </strong>

                  <span>
                    {
                      entries.length
                    }{" "}
                    {entries.length ===
                    1
                      ? "entry"
                      : "entries"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleExport(
                      "pdf"
                    )
                  }
                >
                  <FileText
                    size={17}
                  />

                  <span>
                    <strong>
                      PDF
                    </strong>

                    <small>
                      Easy to read
                      and print
                    </small>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleExport(
                      "txt"
                    )
                  }
                >
                  <FileText
                    size={17}
                  />

                  <span>
                    <strong>
                      Text
                    </strong>

                    <small>
                      Simple
                      readable copy
                    </small>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleExport(
                      "json"
                    )
                  }
                >
                  <FileJson
                    size={17}
                  />

                  <span>
                    <strong>
                      JSON
                    </strong>

                    <small>
                      Structured
                      backup
                    </small>
                  </span>
                </button>

                <p className="journal-export__privacy">
                  Exporting happens
                  directly on this
                  device.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {exportError ? (
        <div
          className="journal-export__error"
          role="alert"
        >
          {exportError}
        </div>
      ) : null}

      <div
        className="journal-filters"
        role="group"
        aria-label="Filter journal entries"
      >
        {JOURNAL_FILTERS.map(
          (option) => (
            <button
              type="button"
              key={
                option.value
              }
              className={
                filter ===
                option.value
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                onFilterChange(
                  option.value
                )
              }
            >
              {
                option.label
              }
            </button>
          )
        )}
      </div>
    </>
  );
}

export default JournalToolbar;