import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Archive,
  ArchiveRestore,
  BookOpen,
  CalendarDays,
  Check,
  Feather,
  Heart,
  LoaderCircle,
  Mic,
  MoreHorizontal,
  Paperclip,
  Save,
  Sparkles,
  Tag,
  Trash2,
  X
} from "lucide-react";

import {
  JOURNAL_MOODS
} from "../../data/journalOptions";

import {
  countJournalWords,
  getJournalStatus
} from "../../utils/journalUtils";

import JournalAttachmentsSection
  from "./JournalAttachmentsSection";

import JournalTagSelector
  from "./JournalTagSelector";

import JournalEmotionSelector
  from "./JournalEmotionSelector";

import JournalActivitySelector
  from "./JournalActivitySelector";

import JournalVoiceSection
  from "./JournalVoiceSection";


function JournalEditorModal({
  open,
  editor,
  selectedEntry,
  saving,
  actionEntryId,
  attachmentManager,
  onClose,
  onFieldChange,
  onSelectMood,
  onSave,
  onEnsureSavedEntry,
  onArchive,
  onRestore,
  onDelete
}) {
  /*
  |--------------------------------------------------------------------------
  | LOCAL UI STATE
  |--------------------------------------------------------------------------
  */

  const [
    activeTool,
    setActiveTool
  ] = useState(null);

  const [
    entryMenuOpen,
    setEntryMenuOpen
  ] = useState(false);

  const contentRef =
    useRef(null);


  /*
  |--------------------------------------------------------------------------
  | BUSY STATES
  |--------------------------------------------------------------------------
  */

  const attachmentsBusy =
    Boolean(
      attachmentManager?.uploading
    );

  const actionInProgress =
    Boolean(
      actionEntryId
    );

  const controlsDisabled =
    saving ||
    attachmentsBusy ||
    actionInProgress;


  /*
  |--------------------------------------------------------------------------
  | ENTRY STATE
  |--------------------------------------------------------------------------
  */

  const selectedStatus =
    getJournalStatus(
      selectedEntry
    );

  const isArchivedEntry =
    Boolean(
      selectedEntry &&
      selectedStatus === "archived"
    );

  const showDraftButton =
    !selectedEntry ||
    selectedStatus === "draft";

  const wordCount =
    countJournalWords(
      editor.content
    );


  /*
  |--------------------------------------------------------------------------
  | COUNTS
  |--------------------------------------------------------------------------
  */

  const attachmentCount =
    (
      attachmentManager
        ?.attachments ||
      []
    ).length;

  const emotionCount =
    (
      editor.emotionIds ||
      []
    ).length;

  const activityCount =
    (
      editor.activityIds ||
      []
    ).length;

  const tagCount =
    (
      editor.tagIds ||
      []
    ).length;


  /*
  |--------------------------------------------------------------------------
  | RESET TRANSIENT UI
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveTool(null);
    setEntryMenuOpen(false);
  }, [
    open,
    selectedEntry
  ]);


  /*
  |--------------------------------------------------------------------------
  | ESCAPE KEY + BODY SCROLL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleEscape(
      event
    ) {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      if (entryMenuOpen) {
        setEntryMenuOpen(false);
        return;
      }

      if (activeTool) {
        setActiveTool(null);
        return;
      }

      if (!controlsDisabled) {
        onClose();
      }
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    activeTool,
    controlsDisabled,
    entryMenuOpen,
    onClose,
    open
  ]);


  /*
  |--------------------------------------------------------------------------
  | AUTO-GROW TEXTAREA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const textarea =
      contentRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height =
      "auto";

    textarea.style.height =
      `${Math.max(
        textarea.scrollHeight,
        430
      )}px`;
  }, [
    editor.content,
    open
  ]);


  if (!open) {
    return null;
  }


  /*
  |--------------------------------------------------------------------------
  | VOICE CALLBACK
  |--------------------------------------------------------------------------
  */

  function handleVoiceCreated(
    currentEntry,
    attachment,
    transcript
  ) {
    /*
     * SPEECH TO TEXT
     *
     * Keep the exact existing workflow:
     * transcript becomes normal journal text.
     */

    if (transcript) {
      const transcriptText =
        (
          transcript?.transcript ||
          transcript?.transcriptText ||
          transcript?.transcript_text ||
          ""
        ).trim();

      if (transcriptText) {
        const existingContent =
          (
            editor.content ||
            ""
          ).trim();

        const nextContent =
          existingContent
            ? `${existingContent}\n\n${transcriptText}`
            : transcriptText;

        onFieldChange(
          "content",
          nextContent
        );
      }

      onFieldChange(
        "entryType",
        "standard"
      );

      return;
    }

    /*
     * REAL VOICE NOTE
     */

    onFieldChange(
      "entryType",
      "voice"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | TOOL TOGGLE
  |--------------------------------------------------------------------------
  */

  function toggleTool(
    tool
  ) {
    setActiveTool(
      (current) =>
        current === tool
          ? null
          : tool
    );
  }


  /*
  |--------------------------------------------------------------------------
  | TOOL PANEL TITLE
  |--------------------------------------------------------------------------
  */

  function getToolTitle() {
    switch (activeTool) {
      case "attachments":
        return "Memories & attachments";

      case "voice":
        return "Voice journal";

      case "emotions":
        return "Emotions";

      case "activities":
        return "Activities";

      case "tags":
        return "Journal tags";

      default:
        return "";
    }
  }


  function getToolIcon() {
    switch (activeTool) {
      case "attachments":
        return (
          <Paperclip size={15} />
        );

      case "voice":
        return (
          <Mic size={15} />
        );

      case "emotions":
        return (
          <Heart size={15} />
        );

      case "activities":
        return (
          <Sparkles size={15} />
        );

      case "tags":
        return (
          <Tag size={15} />
        );

      default:
        return null;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="journal-modal journal-modal--diary"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !controlsDisabled
        ) {
          onClose();
        }
      }}
    >
      <section
        className="journal-editor journal-editor--diary"
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-editor-title"
      >
        {/* =====================================================
            FLOATING BOOK HEADER
           ===================================================== */}

        <header className="journal-diary-header">
          <div className="journal-diary-header__identity">
            <span className="journal-diary-header__icon">
              <Feather size={16} />
            </span>

            <div>
              <span className="journal-section-label">
                {selectedEntry
                  ? "Continue your reflection"
                  : "A new page"}
              </span>

              <p>
                Your private journal
              </p>
            </div>
          </div>

          <div className="journal-diary-header__actions">
            {selectedEntry ? (
              <div className="journal-editor__more-wrap">
                <button
                  type="button"
                  className="journal-diary-icon-button"
                  disabled={
                    controlsDisabled
                  }
                  aria-label="More entry options"
                  aria-expanded={
                    entryMenuOpen
                  }
                  onClick={() =>
                    setEntryMenuOpen(
                      (current) =>
                        !current
                    )
                  }
                >
                  <MoreHorizontal
                    size={19}
                  />
                </button>

                {entryMenuOpen ? (
                  <div className="journal-editor__entry-menu">
                    <button
                      type="button"
                      disabled={
                        controlsDisabled
                      }
                      onClick={() => {
                        setEntryMenuOpen(
                          false
                        );

                        if (
                          isArchivedEntry
                        ) {
                          onRestore(
                            selectedEntry
                          );
                        } else {
                          onArchive(
                            selectedEntry
                          );
                        }
                      }}
                    >
                      {isArchivedEntry ? (
                        <ArchiveRestore
                          size={15}
                        />
                      ) : (
                        <Archive
                          size={15}
                        />
                      )}

                      {isArchivedEntry
                        ? "Unarchive entry"
                        : "Archive entry"}
                    </button>

                    <button
                      type="button"
                      className="journal-editor__entry-menu-danger"
                      disabled={
                        controlsDisabled
                      }
                      onClick={() => {
                        setEntryMenuOpen(
                          false
                        );

                        onDelete(
                          selectedEntry
                        );
                      }}
                    >
                      <Trash2
                        size={15}
                      />

                      Delete entry
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              className="journal-diary-icon-button"
              onClick={
                onClose
              }
              disabled={
                controlsDisabled
              }
              aria-label="Close journal editor"
            >
              <X size={19} />
            </button>
          </div>
        </header>


        {/* =====================================================
            REAL DIARY / OPEN BOOK
           ===================================================== */}

        <div className="journal-diary-book">
          {/* ===================================================
              LEFT PAGE
             =================================================== */}

          <aside className="journal-diary-page journal-diary-page--left">
            <div className="journal-diary-page__corner journal-diary-page__corner--top-left" />

            <div className="journal-diary-page__decor">
              <BookOpen size={18} />

              <span>
                MY JOURNAL
              </span>
            </div>

            <div className="journal-diary-left-content">
              <div className="journal-diary-chapter">
                <span>
                  {selectedEntry
                    ? "A MOMENT REVISITED"
                    : "TODAY'S REFLECTION"}
                </span>

                <h2 id="journal-editor-title">
                  {selectedEntry
                    ? "Come back to this moment."
                    : "A quiet place for your thoughts."}
                </h2>

                <p>
                  Write slowly. Keep what matters.
                  There is no right way to fill
                  these pages.
                </p>
              </div>


              {/* ===============================================
                  DATE CARD
                 =============================================== */}

              <div className="journal-diary-date-card">
                <div className="journal-diary-date-card__heading">
                  <CalendarDays
                    size={15}
                  />

                  <span>
                    Date
                  </span>
                </div>

                <input
                  type="date"
                  value={
                    editor.entryDate
                  }
                  disabled={
                    controlsDisabled
                  }
                  onChange={(
                    event
                  ) =>
                    onFieldChange(
                      "entryDate",
                      event.target.value
                    )
                  }
                />
              </div>


              {/* ===============================================
                  PROMPT
                 =============================================== */}

              {editor
                .promptTextSnapshot ? (
                <div className="journal-diary-prompt-note">
                  <span className="journal-diary-prompt-note__pin">
                    <Sparkles
                      size={14}
                    />
                  </span>

                  <small>
                    A THOUGHT TO BEGIN WITH
                  </small>

                  <p>
                    {
                      editor
                        .promptTextSnapshot
                    }
                  </p>
                </div>
              ) : (
                <div className="journal-diary-quote">
                  <Feather
                    size={17}
                  />

                  <p>
                    “Some thoughts only need
                    somewhere safe to land.”
                  </p>
                </div>
              )}


              {/* ===============================================
                  MOOD
                 =============================================== */}

              <section className="journal-diary-mood">
                <div className="journal-diary-section-heading">
                  <span>
                    HOW DOES TODAY FEEL?
                  </span>

                  <div />
                </div>

                <div className="journal-diary-mood__list">
                  {JOURNAL_MOODS.map(
                    (mood) => {
                      const active =
                        editor
                          .moodScore ===
                        mood.score;

                      return (
                        <button
                          type="button"
                          key={
                            mood.score
                          }
                          disabled={
                            controlsDisabled
                          }
                          className={
                            active
                              ? "is-selected"
                              : ""
                          }
                          onClick={() =>
                            onSelectMood(
                              mood
                            )
                          }
                          aria-pressed={
                            active
                          }
                          title={
                            mood.label
                          }
                        >
                          <b>
                            {mood.emoji}
                          </b>

                          <small>
                            {mood.label}
                          </small>
                        </button>
                      );
                    }
                  )}
                </div>
              </section>


              {/* ===============================================
                  AUTOSAVE NOTE
                 =============================================== */}

              <div className="journal-diary-saved-note">
                <Check
                  size={14}
                />

                <div>
                  <strong>
                    Autosave is on
                  </strong>

                  <span>
                    Your unfinished writing can
                    remain a draft.
                  </span>
                </div>
              </div>
            </div>


            <span className="journal-diary-page-number journal-diary-page-number--left">
              UNWIND · JOURNAL
            </span>
          </aside>


          {/* ===================================================
              CENTER SPINE
             =================================================== */}

          <div
            className="journal-diary-spine"
            aria-hidden="true"
          >
            <div />
          </div>


          {/* ===================================================
              RIGHT PAGE
             =================================================== */}

          <main className="journal-diary-page journal-diary-page--right">
            <div className="journal-diary-page__corner journal-diary-page__corner--top-right" />

            <div className="journal-diary-right-top">
              <span>
                {selectedEntry
                  ? "CONTINUE THE STORY"
                  : "A BLANK PAGE"}
              </span>

              <span>
                {wordCount}{" "}
                {wordCount === 1
                  ? "word"
                  : "words"}
              </span>
            </div>


            {/* ===============================================
                WRITING PAGE
               =============================================== */}

            <section className="journal-diary-writing">
              <input
                className="journal-diary-title"
                value={
                  editor.title
                }
                disabled={
                  controlsDisabled
                }
                onChange={(
                  event
                ) =>
                  onFieldChange(
                    "title",
                    event.target.value
                  )
                }
                placeholder="Title this page..."
                maxLength={255}
                autoFocus
              />

              <textarea
                ref={
                  contentRef
                }
                className="journal-diary-content"
                value={
                  editor.content
                }
                disabled={
                  controlsDisabled
                }
                onChange={(
                  event
                ) =>
                  onFieldChange(
                    "content",
                    event.target.value
                  )
                }
                placeholder={
                  editor
                    .promptTextSnapshot
                    ? "Start with the prompt, then follow wherever your thoughts take you..."
                    : "Dear diary...\n\nStart anywhere. What happened today? What are you feeling? What do you want to remember?"
                }
                maxLength={100000}
              />

              <div className="journal-diary-writing__ending">
                <span>
                  No rules. Just write.
                </span>

                <Feather
                  size={14}
                />
              </div>
            </section>


            {/* ===============================================
                DIARY TOOL STRIP
               =============================================== */}

            <section className="journal-diary-tools">
              <div className="journal-diary-tools__heading">
                <span>
                  Add something to this page
                </span>
              </div>

              <div className="journal-diary-tool-strip">
                <button
                  type="button"
                  className={
                    activeTool ===
                    "attachments"
                      ? "journal-diary-tool is-active"
                      : "journal-diary-tool"
                  }
                  disabled={
                    controlsDisabled
                  }
                  onClick={() =>
                    toggleTool(
                      "attachments"
                    )
                  }
                  title="Add attachment"
                  aria-label="Add attachment"
                >
                  <span>
                    <Paperclip
                      size={18}
                    />

                    {attachmentCount >
                    0 ? (
                      <b>
                        {
                          attachmentCount
                        }
                      </b>
                    ) : null}
                  </span>

                  <small>
                    Memories
                  </small>
                </button>


                <button
                  type="button"
                  className={
                    activeTool ===
                    "voice"
                      ? "journal-diary-tool is-active"
                      : "journal-diary-tool"
                  }
                  disabled={
                    controlsDisabled
                  }
                  onClick={() =>
                    toggleTool(
                      "voice"
                    )
                  }
                  title="Voice journal"
                  aria-label="Voice journal"
                >
                  <span>
                    <Mic
                      size={18}
                    />

                    {editor.entryType ===
                    "voice" ? (
                      <i />
                    ) : null}
                  </span>

                  <small>
                    Voice
                  </small>
                </button>


                <button
                  type="button"
                  className={
                    activeTool ===
                    "emotions"
                      ? "journal-diary-tool is-active"
                      : "journal-diary-tool"
                  }
                  disabled={
                    controlsDisabled
                  }
                  onClick={() =>
                    toggleTool(
                      "emotions"
                    )
                  }
                  title="Add emotions"
                  aria-label="Add emotions"
                >
                  <span>
                    <Heart
                      size={18}
                    />

                    {emotionCount >
                    0 ? (
                      <b>
                        {emotionCount}
                      </b>
                    ) : null}
                  </span>

                  <small>
                    Emotions
                  </small>
                </button>


                <button
                  type="button"
                  className={
                    activeTool ===
                    "activities"
                      ? "journal-diary-tool is-active"
                      : "journal-diary-tool"
                  }
                  disabled={
                    controlsDisabled
                  }
                  onClick={() =>
                    toggleTool(
                      "activities"
                    )
                  }
                  title="Add activities"
                  aria-label="Add activities"
                >
                  <span>
                    <Sparkles
                      size={18}
                    />

                    {activityCount >
                    0 ? (
                      <b>
                        {
                          activityCount
                        }
                      </b>
                    ) : null}
                  </span>

                  <small>
                    Activities
                  </small>
                </button>


                <button
                  type="button"
                  className={
                    activeTool ===
                    "tags"
                      ? "journal-diary-tool is-active"
                      : "journal-diary-tool"
                  }
                  disabled={
                    controlsDisabled
                  }
                  onClick={() =>
                    toggleTool(
                      "tags"
                    )
                  }
                  title="Add tags"
                  aria-label="Add tags"
                >
                  <span>
                    <Tag
                      size={18}
                    />

                    {tagCount >
                    0 ? (
                      <b>
                        {tagCount}
                      </b>
                    ) : null}
                  </span>

                  <small>
                    Tags
                  </small>
                </button>
              </div>


              {/* =============================================
                  ACTIVE TOOL PANEL
                 ============================================= */}

              {activeTool ? (
                <div className="journal-diary-tool-panel">
                  <div className="journal-diary-tool-panel__header">
                    <div>
                      {getToolIcon()}

                      <strong>
                        {getToolTitle()}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveTool(
                          null
                        )
                      }
                      aria-label="Close tool"
                    >
                      <X
                        size={15}
                      />
                    </button>
                  </div>

                  <div className="journal-diary-tool-panel__content">
                    {activeTool ===
                    "attachments" ? (
                      <JournalAttachmentsSection
                        attachmentManager={
                          attachmentManager
                        }
                        hasSavedEntry={
                          Boolean(
                            selectedEntry
                          )
                        }
                        disabled={
                          saving ||
                          actionInProgress
                        }
                      />
                    ) : null}


                    {activeTool ===
                    "voice" ? (
                      <JournalVoiceSection
                        entry={
                          selectedEntry
                        }
                        disabled={
                          controlsDisabled
                        }
                        onRequireEntry={
                          onEnsureSavedEntry
                        }
                        onVoiceCreated={
                          handleVoiceCreated
                        }
                      />
                    ) : null}


                    {activeTool ===
                    "emotions" ? (
                      <JournalEmotionSelector
                        selectedIds={
                          editor.emotionIds ||
                          []
                        }
                        disabled={
                          controlsDisabled
                        }
                        onChange={(
                          emotionIds
                        ) =>
                          onFieldChange(
                            "emotionIds",
                            emotionIds
                          )
                        }
                      />
                    ) : null}


                    {activeTool ===
                    "activities" ? (
                      <JournalActivitySelector
                        selectedIds={
                          editor.activityIds ||
                          []
                        }
                        disabled={
                          controlsDisabled
                        }
                        onChange={(
                          activityIds
                        ) =>
                          onFieldChange(
                            "activityIds",
                            activityIds
                          )
                        }
                      />
                    ) : null}


                    {activeTool ===
                    "tags" ? (
                      <JournalTagSelector
                        selectedIds={
                          editor.tagIds ||
                          []
                        }
                        disabled={
                          controlsDisabled
                        }
                        onChange={(
                          tagIds
                        ) =>
                          onFieldChange(
                            "tagIds",
                            tagIds
                          )
                        }
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>


            <span className="journal-diary-page-number journal-diary-page-number--right">
              {selectedEntry
                ? "A MEMORY REVISITED"
                : "A NEW MEMORY"}
            </span>
          </main>
        </div>


        {/* =====================================================
            BOTTOM SAVE BAR
           ===================================================== */}

        <footer className="journal-diary-savebar">
          <div className="journal-diary-savebar__message">
            {saving ? (
              <>
                <LoaderCircle
                  className="journal-spin"
                  size={15}
                />

                <span>
                  Saving your reflection...
                </span>
              </>
            ) : attachmentsBusy ? (
              <>
                <LoaderCircle
                  className="journal-spin"
                  size={15}
                />

                <span>
                  Uploading your memories...
                </span>
              </>
            ) : (
              <>
                <Check
                  size={15}
                />

                <span>
                  Your reflection stays private
                </span>
              </>
            )}
          </div>


          <div className="journal-diary-savebar__actions">
            {showDraftButton ? (
              <button
                type="button"
                className="journal-secondary-button journal-diary-draft-button"
                disabled={
                  controlsDisabled
                }
                onClick={() =>
                  onSave(
                    "draft"
                  )
                }
              >
                Save draft
              </button>
            ) : null}


            <button
              type="button"
              className="journal-primary-button journal-diary-finish-button"
              disabled={
                controlsDisabled
              }
              onClick={() =>
                onSave(
                  "completed"
                )
              }
            >
              {saving ||
              attachmentsBusy ? (
                <LoaderCircle
                  className="journal-spin"
                  size={17}
                />
              ) : (
                <Save
                  size={17}
                />
              )}

              {attachmentsBusy
                ? "Uploading..."
                : selectedEntry
                  ? "Save reflection"
                  : "Finish reflection"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}


export default JournalEditorModal;