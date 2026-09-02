import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  AnimatePresence,
  motion,
  useReducedMotion
} from "framer-motion";

import JournalPageAttachments
  from "./JournalPageAttachments";

import {
  BookHeart,
  BookOpen,
  Bookmark,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Feather,
  File,
  Heart,
  Image as Imagecon,
  LoaderCircle,
  LockKeyhole,
  Mic,
  PencilLine,
  Play,
  Plus,
  Sparkles,
  Video
} from "lucide-react";

import JournalToolbar
  from "./JournalToolbar";

import "./JournalBook.css";

import {
  getJournalEntry
} from "../../services/journalService";

import {
  exportJournalEntry
} from "../../utils/journalExport";

import {
  countJournalWords,
  formatJournalDate,
  getJournalEntryId,
  getJournalField,
  getJournalMood,
  getJournalStatus,
  getPromptText,
  isJournalFavourite
} from "../../utils/journalUtils";


const TURN_MS = 760;
const SWAP_MS = 340;


/*
|--------------------------------------------------------------------------
| Responsive book mode
|--------------------------------------------------------------------------
|
| Desktop:
|   two physical pages
|
| Mobile:
|   one physical page
|
*/

function useSinglePageBook() {
  const [
    singlePage,
    setSinglePage
  ] = useState(
    () =>
      typeof window !==
        "undefined" &&
      window.matchMedia(
        "(max-width: 780px)"
      ).matches
  );


  useEffect(() => {
    const media =
      window.matchMedia(
        "(max-width: 780px)"
      );


    const update = () =>
      setSinglePage(
        media.matches
      );


    update();


    media.addEventListener(
      "change",
      update
    );


    return () =>
      media.removeEventListener(
        "change",
        update
      );
  }, []);


  return singlePage;
}


/*
|--------------------------------------------------------------------------
| Entry helpers
|--------------------------------------------------------------------------
*/

const field = (
  entry,
  camel,
  snake
) =>
  getJournalField(
    entry,
    camel,
    snake
  );


const titleOf = (
  entry
) =>
  field(
    entry,
    "title",
    "title"
  ) ||
  "Untitled reflection";


const contentOf = (
  entry
) =>
  field(
    entry,
    "content",
    "content"
  ) ||
  "This page is waiting for a few more words.";


/*
|--------------------------------------------------------------------------
| Attachment helpers
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Attachment helpers
|--------------------------------------------------------------------------
*/
function attachmentUrl(
  attachment
) {
  return (
    attachment?.previewUrl ||
    attachment?.preview_url ||
    attachment?.fileUrl ||
    attachment?.file_url ||
    attachment?.secure_url ||
    attachment?.resource_url ||
    attachment?.url ||
    ""
  );
}
function imageCover(
  entry
) {
  const direct =
    entry?.coverAttachment ||
    entry?.cover_attachment ||
    entry?.cover;


  if (
    attachmentUrl(
      direct
    )
  ) {
    return direct;
  }


  const attachments =
    Array.isArray(
      entry?.attachments
    )
      ? entry.attachments
      : [];


  return (
    attachments.find(
      (item) =>
        item?.isCover ||
        item?.is_cover
    ) ||

    attachments.find(
      (item) => {
        const type =
          String(
            item?.resourceType ||
            item?.resource_type ||
            item?.mimeType ||
            item?.mime_type ||
            ""
          ).toLowerCase();


        return type.includes(
          "image"
        );
      }
    ) ||

    null
  );
}


/*
|--------------------------------------------------------------------------
| Single physical journal page
|--------------------------------------------------------------------------
*/

function JournalPageLeaf({
  entry,
  side,
  pageNumber,
  busy,
  turning,
  decorative = false,
  onOpenEntry,
  onToggleFavourite,
  onCreateEntry
}) {
  const [
    exporting,
    setExporting
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Blank page
  |--------------------------------------------------------------------------
  */

  if (!entry) {
    return (
      <article
        className={
          `journal-book-page journal-book-page--${side} journal-book-page--blank`
        }
      >
        <div className="journal-book-page__paper-grain" />


        <div className="journal-book-blank">
          <span className="journal-book-blank__mark">
            <Feather
              size={22}
            />
          </span>


          <small>
            A blank page
          </small>


          <h3>
            Something worth
            remembering?
          </h3>


          <p>
            Begin a new reflection
            and let this page become
            part of your story.
          </p>


          {!decorative ? (
            <button
              type="button"
              className="journal-book-blank__button"
              disabled={
                busy ||
                turning
              }
              onClick={
                onCreateEntry
              }
            >
              <Plus
                size={16}
              />

              Write on this page
            </button>
          ) : null}
        </div>


        <span className="journal-book-page__number">
          {pageNumber}
        </span>
      </article>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Page information
  |--------------------------------------------------------------------------
  */

  const title =
    titleOf(
      entry
    );


  const content =
    contentOf(
      entry
    );


  const date =
    field(
      entry,
      "entryDate",
      "entry_date"
    );


  const prompt =
    field(
      entry,
      "promptTextSnapshot",
      "prompt_text_snapshot"
    );


  const mood =
    getJournalMood(
      entry
    );


  const status =
    getJournalStatus(
      entry
    );


  const favourite =
    isJournalFavourite(
      entry
    );


  const words =
    countJournalWords(
      content
    );

  /*
  |--------------------------------------------------------------------------
  | Export this entry
  |--------------------------------------------------------------------------
  |
  | Uses your EXISTING getJournalEntry() and export system.
  |
  | No endpoint changes.
  |
  */

  async function exportPage(
    event
  ) {
    event.stopPropagation();


    if (
      busy ||
      turning ||
      exporting
    ) {
      return;
    }


    try {
      setExporting(
        true
      );


      const completeEntry =
        await getJournalEntry(
          entry
        );


      if (!completeEntry) {
        throw new Error(
          "Unable to load the complete journal entry."
        );
      }


      exportJournalEntry(
        completeEntry,
        "pdf"
      );
    } catch (
      error
    ) {
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


  /*
  |--------------------------------------------------------------------------
  | Favourite
  |--------------------------------------------------------------------------
  */

  function favouritePage(
    event
  ) {
    event.stopPropagation();


    if (
      !busy &&
      !turning
    ) {
      onToggleFavourite(
        entry
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Keyboard accessibility
  |--------------------------------------------------------------------------
  */

  function openWithKeyboard(
    event
  ) {
    if (
      event.key ===
        "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();


      onOpenEntry(
        entry
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Render page
  |--------------------------------------------------------------------------
  */

  return (
    <article
      className={[
        "journal-book-page",

        `journal-book-page--${side}`,

        words > 260
          ? "is-dense"
          : "",

        words > 520
          ? "is-very-dense"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
      data-entry-id={
        getJournalEntryId(
          entry
        )
      }
      tabIndex={
        decorative
          ? -1
          : 0
      }
      onClick={
        decorative
          ? undefined
          : () =>
              onOpenEntry(
                entry
              )
      }
      onKeyDown={
        decorative
          ? undefined
          : openWithKeyboard
      }
      aria-label={
        decorative
          ? undefined
          : `Open ${title}`
      }
    >
      {/* Paper texture */}

      <div className="journal-book-page__paper-grain" />


      {/* Date + actions */}

      <header className="journal-book-page__header">
        <div className="journal-book-page__date">
          <CalendarDays
            size={13}
          />


          <span>
            {formatJournalDate(
              date
            )}
          </span>
        </div>


        {!decorative ? (
          <div className="journal-book-page__actions">
            <button
              type="button"
              onClick={
                exportPage
              }
              disabled={
                busy ||
                turning ||
                exporting
              }
              aria-label={
                `Export ${title}`
              }
              title="Export this page"
            >
              {exporting ? (
                <LoaderCircle
                  className="journal-spin"
                  size={14}
                />
              ) : (
                <Download
                  size={14}
                />
              )}
            </button>


            <button
              type="button"
              className={
                favourite
                  ? "is-favourite"
                  : ""
              }
              onClick={
                favouritePage
              }
              disabled={
                busy ||
                turning
              }
              aria-label={
                favourite
                  ? "Remove from favourites"
                  : "Add to favourites"
              }
            >
              <Heart
                size={14}
                fill={
                  favourite
                    ? "currentColor"
                    : "none"
                }
              />
            </button>
          </div>
        ) : null}
      </header>


      <div className="journal-book-page__rule" />


      {/* Mood + status */}

      <div className="journal-book-page__meta">
        <span className="journal-book-page__mood">
          {mood ? (
            <>
              <b>
                {mood.emoji}
              </b>

              {mood.label}
            </>
          ) : (
            <>
              <Feather
                size={12}
              />

              Reflection
            </>
          )}
        </span>


        <span
          className={
            `journal-book-page__status is-${status}`
          }
        >
          {status}
        </span>
      </div>


      {/* Title */}

      <h2 className="journal-book-page__title">
        {title}
      </h2>


      {/* Prompt */}

      {prompt ? (
        <div className="journal-book-page__prompt">
          <Sparkles
            size={12}
          />

          <span>
            {prompt}
          </span>
        </div>
      ) : null}

      {/* =====================================================
    REAL ENTRY ATTACHMENTS
    ===================================================== */}

{!decorative ? (
  <JournalPageAttachments
    entry={
      entry
    }
    title={
      title
    }
    disabled={
      decorative
    }
  />
) : null}


      {/* Cover attachment */}

      {/* =====================================================
    JOURNAL MEDIA
    Images + Videos + Voice Notes
   ===================================================== */}


      {/* Journal writing */}

      <div className="journal-book-page__writing">
        <p>
          {content}
        </p>


        <div className="journal-book-page__fade" />
      </div>


      {/* Footer */}

      <footer className="journal-book-page__footer">
        <span>
          {words}{" "}
          {words === 1
            ? "word"
            : "words"}
        </span>


        {!decorative ? (
          <button
            type="button"
            disabled={
              busy ||
              turning
            }
            onClick={(
              event
            ) => {
              event.stopPropagation();


              onOpenEntry(
                entry
              );
            }}
          >
            <PencilLine
              size={13}
            />

            Read / edit
          </button>
        ) : null}
      </footer>


      {/* Physical page number */}

      <span className="journal-book-page__number">
        {pageNumber}
      </span>


      {/* Inner page shadow */}

      <div
        className={
          `journal-book-page__edge journal-book-page__edge--${side}`
        }
      />
    </article>
  );
}


/*
|--------------------------------------------------------------------------
| Physical flipping page
|--------------------------------------------------------------------------
|
| A duplicate of the currently turning page is temporarily placed above
| the book.
|
| Framer Motion rotates this duplicate through 180deg.
|
| Halfway through the animation the real book content swaps underneath.
|
| This creates the illusion of a genuinely turning page rather than
| simply sliding one card away.
|
*/

function TurningLeaf({
  snapshot,
  singlePage,
  reducedMotion,
  onDone
}) {
  if (!snapshot) {
    return null;
  }


  const forward =
    snapshot.direction ===
    1;


  return (
    <motion.div
      key={
        snapshot.key
      }
      className={[
        "journal-book-turning-page",

        forward
          ? "journal-book-turning-page--forward"
          : "journal-book-turning-page--backward",

        singlePage
          ? "journal-book-turning-page--single"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
      initial={{
        rotateY: 0
      }}
      animate={{
        rotateY:
          forward
            ? -180
            : 180
      }}
      transition={{
        duration:
          reducedMotion
            ? 0.01
            : TURN_MS /
              1000,

        ease: [
          0.22,
          0.61,
          0.36,
          1
        ]
      }}
      onAnimationComplete={
        onDone
      }
    >
      {/* Front */}

      <div className="journal-book-turning-page__front">
        <JournalPageLeaf
          entry={
            snapshot.entry
          }
          pageNumber={
            snapshot.pageNumber
          }
          side={
            forward
              ? "right"
              : "left"
          }
          busy
          turning
          decorative
          onOpenEntry={() => {}}
          onToggleFavourite={() => {}}
          onCreateEntry={() => {}}
        />
      </div>


      {/* Back of paper */}

      <div className="journal-book-turning-page__back">
        <div className="journal-book-turning-page__back-paper">
          <Feather
            size={18}
          />

          <span>
            UNWIND
          </span>
        </div>
      </div>
    </motion.div>
  );
}


/*
|--------------------------------------------------------------------------
| Journal Book
|--------------------------------------------------------------------------
*/

function JournalBook({
  entries = [],
  query,
  filter,
  loading,
  actionEntryId,
  stats,
  dailyPrompt,
  onQueryChange,
  onFilterChange,
  onCreateEntry,
  onOpenEntry,
  onToggleFavourite,
  onBrowsePrompts
}) {
  const reducedMotion =
    useReducedMotion();


  const singlePage =
    useSinglePageBook();


  const [
    bookOpen,
    setBookOpen
  ] = useState(false);


  const [
    pageIndex,
    setPageIndex
  ] = useState(0);


  const [
    turning,
    setTurning
  ] = useState(false);


  const [
    turnSnapshot,
    setTurnSnapshot
  ] = useState(null);


  const pointerStart =
    useRef(null);


  const swapTimer =
    useRef(null);


  const finishTimer =
    useRef(null);


  /*
  |--------------------------------------------------------------------------
  | Page calculations
  |--------------------------------------------------------------------------
  */

  const step =
    singlePage
      ? 1
      : 2;


  const maxIndex =
    Math.max(
      0,
      entries.length -
        1
    );


  const leftEntry =
    entries[
      pageIndex
    ] ||
    null;


  const rightEntry =
    singlePage
      ? null
      : entries[
          pageIndex + 1
        ] ||
        null;


  const hasPrevious =
    pageIndex > 0;


  const hasNext =
    pageIndex +
      step <
    entries.length;


  const promptText =
    dailyPrompt
      ? getPromptText(
          dailyPrompt
        )
      : "";


  const shownEnd =
    Math.min(
      entries.length,
      pageIndex +
        step
    );


  const progress =
    entries.length <= 1
      ? 0
      : Math.round(
          (
            pageIndex /
            (
              entries.length -
              1
            )
          ) *
            100
        );


  /*
  |--------------------------------------------------------------------------
  | Jump-to-page options
  |--------------------------------------------------------------------------
  */

  const jumpOptions =
    useMemo(
      () =>
        entries
          .map(
            (
              entry,
              index
            ) => ({
              index,

              id:
                getJournalEntryId(
                  entry
                ) ||
                index,

              title:
                titleOf(
                  entry
                )
            })
          )
          .filter(
            (
              item
            ) =>
              singlePage ||
              item.index %
                2 ===
                0
          ),
      [
        entries,
        singlePage
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Finish page turn
  |--------------------------------------------------------------------------
  */

  const finishTurn =
    useCallback(
      () => {
        setTurning(
          false
        );


        setTurnSnapshot(
          null
        );
      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | Timer cleanup
  |--------------------------------------------------------------------------
  */

  useEffect(
    () =>
      () => {
        window.clearTimeout(
          swapTimer.current
        );


        window.clearTimeout(
          finishTimer.current
        );
      },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | Keep index valid when filters/search change
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      entries.length ===
      0
    ) {
      setPageIndex(
        0
      );
    } else {
      setPageIndex(
        (
          current
        ) =>
          Math.min(
            current,
            entries.length -
              1
          )
      );
    }
  }, [
    entries.length
  ]);


  /*
  |--------------------------------------------------------------------------
  | Normalize desktop spreads
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!singlePage) {
      setPageIndex(
        (
          current
        ) =>
          current % 2 ===
          0
            ? current
            : Math.max(
                0,
                current -
                  1
              )
      );
    }
  }, [
    singlePage
  ]);


  /*
  |--------------------------------------------------------------------------
  | Searching/filtering automatically opens book
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      query ||
      filter !== "all"
    ) {
      setBookOpen(
        true
      );


      setPageIndex(
        0
      );
    }
  }, [
    query,
    filter
  ]);


  /*
  |--------------------------------------------------------------------------
  | Turn page
  |--------------------------------------------------------------------------
  */

  const turnPage =
    useCallback(
      (
        direction
      ) => {
        if (
          turning ||
          loading ||
          entries.length ===
            0
        ) {
          return;
        }


        const target =
          pageIndex +
          direction *
            step;


        if (
          target < 0 ||
          target >
            maxIndex
        ) {
          return;
        }


        /*
         * The physical sheet that the user sees turning.
         */
        const flippingEntry =
          direction === 1
            ? (
                singlePage
                  ? leftEntry
                  : rightEntry ||
                    leftEntry
              )
            : leftEntry ||
              rightEntry;


        setTurning(
          true
        );


        setTurnSnapshot({
          key:
            `${Date.now()}-${direction}`,

          direction,

          entry:
            flippingEntry,

          pageNumber:
            direction ===
            1
              ? Math.min(
                  entries.length,
                  pageIndex +
                    step
                )
              : pageIndex +
                1
        });


        window.clearTimeout(
          swapTimer.current
        );


        window.clearTimeout(
          finishTimer.current
        );


        /*
         * Swap the real content when the physical page
         * reaches approximately 90 degrees.
         */
        swapTimer.current =
          window.setTimeout(
            () =>
              setPageIndex(
                target
              ),

            reducedMotion
              ? 0
              : SWAP_MS
          );


        finishTimer.current =
          window.setTimeout(
            finishTurn,

            reducedMotion
              ? 20
              : TURN_MS +
                40
          );
      },
      [
        entries.length,
        finishTurn,
        leftEntry,
        loading,
        maxIndex,
        pageIndex,
        reducedMotion,
        rightEntry,
        singlePage,
        step,
        turning
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Arrow keyboard navigation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    function onKeyDown(
      event
    ) {
      if (!bookOpen) {
        return;
      }


      if (
        [
          "INPUT",
          "TEXTAREA",
          "SELECT"
        ].includes(
          event.target
            ?.tagName
        )
      ) {
        return;
      }


      if (
        event.key ===
        "ArrowRight"
      ) {
        event.preventDefault();


        turnPage(
          1
        );
      }


      if (
        event.key ===
        "ArrowLeft"
      ) {
        event.preventDefault();


        turnPage(
          -1
        );
      }
    }


    window.addEventListener(
      "keydown",
      onKeyDown
    );


    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, [
    bookOpen,
    turnPage
  ]);


  /*
  |--------------------------------------------------------------------------
  | Swipe navigation
  |--------------------------------------------------------------------------
  */

  function pointerDown(
    event
  ) {
    if (
      event.target.closest(
        "button,input,select,textarea,a"
      )
    ) {
      return;
    }


    pointerStart.current =
      event.clientX;
  }


  function pointerUp(
    event
  ) {
    if (
      pointerStart.current ==
      null
    ) {
      return;
    }


    const delta =
      event.clientX -
      pointerStart.current;


    pointerStart.current =
      null;


    if (
      Math.abs(
        delta
      ) < 70
    ) {
      return;
    }


    turnPage(
      delta < 0
        ? 1
        : -1
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Jump directly
  |--------------------------------------------------------------------------
  */

  function jumpTo(
    index
  ) {
    if (turning) {
      return;
    }


    const normalized =
      singlePage
        ? index
        : index -
          (
            index %
            2
          );


    setPageIndex(
      Math.max(
        0,
        Math.min(
          normalized,
          maxIndex
        )
      )
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section className="journal-book-experience">

      {/* ===================================
          EXISTING SEARCH / FILTER / EXPORT
         =================================== */}

      <div className="journal-book-toolbar-shell">
        <JournalToolbar
          entries={
            entries
          }
          query={
            query
          }
          filter={
            filter
          }
          onQueryChange={
            onQueryChange
          }
          onFilterChange={
            onFilterChange
          }
        />
      </div>


      {/* ===================================
          DAILY PROMPT NOTE
         =================================== */}

      {promptText ? (
        <div className="journal-book-prompt-ribbon">
          <span>
            <Sparkles
              size={15}
            />
          </span>


          <div>
            <small>
              Today&apos;s
              reflection
            </small>


            <p>
              {promptText}
            </p>
          </div>


          <div className="journal-book-prompt-ribbon__actions">
            <button
              type="button"
              onClick={
                onBrowsePrompts
              }
            >
              Browse prompts
            </button>


            <button
              type="button"
              className="is-primary"
              onClick={() =>
                onCreateEntry(
                  dailyPrompt
                )
              }
            >
              Write this page
            </button>
          </div>
        </div>
      ) : null}


      {/* ===================================
          PHYSICAL BOOK STAGE
         =================================== */}

      <div
        className={
          `journal-book-stage ${
            bookOpen
              ? "is-open"
              : "is-closed"
          } ${
            singlePage
              ? "is-single-page"
              : ""
          }`
        }
        onPointerDown={
          pointerDown
        }
        onPointerUp={
          pointerUp
        }
      >
        <div className="journal-book-stage__ambient journal-book-stage__ambient--one" />

        <div className="journal-book-stage__ambient journal-book-stage__ambient--two" />


        <AnimatePresence
          mode="wait"
          initial={false}
        >
          {!bookOpen ? (

            /* ===============================
               CLOSED JOURNAL COVER
               =============================== */

            <motion.div
              key="cover"
              className="journal-real-cover"
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity:
                        0,

                      y:
                        14,

                      rotateX:
                        -3
                    }
              }
              animate={{
                opacity:
                  1,

                y:
                  0,

                rotateX:
                  0
              }}
              exit={
                reducedMotion
                  ? {
                      opacity:
                        0
                    }
                  : {
                      opacity:
                        0,

                      x:
                        -105,

                      rotateY:
                        -102,

                      scale:
                        0.96
                    }
              }
              transition={{
                duration:
                  reducedMotion
                    ? 0.01
                    : 0.58,

                ease: [
                  0.22,
                  0.61,
                  0.36,
                  1
                ]
              }}
              style={{
                transformOrigin:
                  "left center"
              }}
            >
              <div className="journal-real-cover__spine" />

              <div className="journal-real-cover__inner-line" />


              <div className="journal-real-cover__ornament journal-real-cover__ornament--top">
                <span />

                <Feather
                  size={22}
                />

                <span />
              </div>


              <div className="journal-real-cover__content">
                <small>
                  PRIVATE
                  REFLECTIONS
                </small>


                <BookHeart
                  size={33}
                />


                <h1>
                  My Unwind
                  Journal
                </h1>


                <p>
                  A quiet collection
                  of thoughts,
                  feelings, memories
                  and little moments.
                </p>


                <div className="journal-real-cover__stats">
                  <span>
                    <strong>
                      {
                        stats?.total ??
                        entries.length
                      }
                    </strong>

                    pages
                  </span>


                  <i />


                  <span>
                    <strong>
                      {
                        stats?.thisMonth ??
                        0
                      }
                    </strong>

                    this month
                  </span>


                  <i />


                  <span>
                    <strong>
                      {
                        stats?.favourites ??
                        0
                      }
                    </strong>

                    favourites
                  </span>
                </div>


                <button
                  type="button"
                  className="journal-real-cover__open"
                  onClick={() =>
                    setBookOpen(
                      true
                    )
                  }
                >
                  <BookOpen
                    size={17}
                  />

                  Open my journal
                </button>


                <button
                  type="button"
                  className="journal-real-cover__new"
                  onClick={() =>
                    onCreateEntry()
                  }
                >
                  <Plus
                    size={15}
                  />

                  Write a new page
                </button>
              </div>


              <div className="journal-real-cover__ornament journal-real-cover__ornament--bottom">
                <span />

                <LockKeyhole
                  size={16}
                />

                <span />
              </div>


              <div className="journal-real-cover__page-stack" />
            </motion.div>

          ) : (

            /* ===============================
               OPEN JOURNAL
               =============================== */

            <motion.div
              key="open-book"
              className="journal-open-book-wrap"
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity:
                        0,

                      scale:
                        0.92,

                      rotateX:
                        5
                    }
              }
              animate={{
                opacity:
                  1,

                scale:
                  1,

                rotateX:
                  0
              }}
              exit={{
                opacity:
                  0,

                scale:
                  0.94
              }}
              transition={{
                duration:
                  reducedMotion
                    ? 0.01
                    : 0.5
              }}
            >
              {/* Physical page stack */}

              <div className="journal-open-book__stack journal-open-book__stack--left" />

              <div className="journal-open-book__stack journal-open-book__stack--right" />


              <div className="journal-open-book">
                {/* Book binding */}

                <div className="journal-open-book__binding" />


                {/* Loading */}

                {loading ? (
                  <div className="journal-open-book__loading">
                    <LoaderCircle
                      className="journal-spin"
                      size={25}
                    />

                    <p>
                      Opening your
                      pages…
                    </p>
                  </div>
                ) : (

                  /* Actual pages */

                  <div className="journal-open-book__pages">
                    <JournalPageLeaf
                      entry={
                        leftEntry
                      }
                      side="left"
                      pageNumber={
                        pageIndex +
                        1
                      }
                      busy={
                        Boolean(
                          actionEntryId
                        )
                      }
                      turning={
                        turning
                      }
                      onOpenEntry={
                        onOpenEntry
                      }
                      onToggleFavourite={
                        onToggleFavourite
                      }
                      onCreateEntry={
                        onCreateEntry
                      }
                    />


                    {!singlePage ? (
                      <JournalPageLeaf
                        entry={
                          rightEntry
                        }
                        side="right"
                        pageNumber={
                          entries.length ===
                          0
                            ? 2
                            : Math.min(
                                entries.length +
                                  1,

                                pageIndex +
                                  2
                              )
                        }
                        busy={
                          Boolean(
                            actionEntryId
                          )
                        }
                        turning={
                          turning
                        }
                        onOpenEntry={
                          onOpenEntry
                        }
                        onToggleFavourite={
                          onToggleFavourite
                        }
                        onCreateEntry={
                          onCreateEntry
                        }
                      />
                    ) : null}
                  </div>
                )}


                {/* Animated flipping sheet */}

                <AnimatePresence>
                  {turnSnapshot ? (
                    <TurningLeaf
                      snapshot={
                        turnSnapshot
                      }
                      singlePage={
                        singlePage
                      }
                      reducedMotion={
                        reducedMotion
                      }
                      onDone={
                        finishTurn
                      }
                    />
                  ) : null}
                </AnimatePresence>


                {/* Physical page corners */}

                {!loading &&
                entries.length >
                  0 ? (
                  <>
                    <button
                      type="button"
                      className="journal-book-corner journal-book-corner--previous"
                      disabled={
                        !hasPrevious ||
                        turning
                      }
                      onClick={() =>
                        turnPage(
                          -1
                        )
                      }
                      aria-label="Previous page"
                    >
                      <ChevronLeft
                        size={18}
                      />
                    </button>


                    <button
                      type="button"
                      className="journal-book-corner journal-book-corner--next"
                      disabled={
                        !hasNext ||
                        turning
                      }
                      onClick={() =>
                        turnPage(
                          1
                        )
                      }
                      aria-label="Next page"
                    >
                      <ChevronRight
                        size={18}
                      />
                    </button>
                  </>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* ===================================
          PAGE NAVIGATION
         =================================== */}

      {bookOpen ? (
        <div className="journal-book-navigation">
          <button
            type="button"
            className="journal-book-navigation__arrow"
            disabled={
              !hasPrevious ||
              turning ||
              loading
            }
            onClick={() =>
              turnPage(
                -1
              )
            }
            aria-label="Previous page"
          >
            <ChevronLeft
              size={17}
            />
          </button>


          <div className="journal-book-navigation__center">
            <div className="journal-book-navigation__meta">
              <span>
                {entries.length ===
                0
                  ? "Blank journal"

                  : singlePage
                    ? `Page ${pageIndex + 1} of ${entries.length}`

                    : `Pages ${pageIndex + 1}–${shownEnd} of ${entries.length}`}
              </span>


              <span>
                Swipe or use ← →
                to turn pages
              </span>
            </div>


            <div className="journal-book-navigation__progress">
              <span
                style={{
                  width:
                    `${progress}%`
                }}
              />
            </div>


            {jumpOptions.length >
            0 ? (
              <label className="journal-book-jump">
                <Bookmark
                  size={13}
                />


                <span>
                  Jump to
                </span>


                <select
                  value={
                    pageIndex
                  }
                  disabled={
                    turning
                  }
                  onChange={(
                    event
                  ) =>
                    jumpTo(
                      Number(
                        event
                          .target
                          .value
                      )
                    )
                  }
                >
                  {jumpOptions.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.id
                        }
                        value={
                          option.index
                        }
                      >
                        {singlePage
                          ? `Page ${option.index + 1}`

                          : `Pages ${option.index + 1}–${Math.min(
                              option.index +
                                2,

                              entries.length
                            )}`}{" "}
                        —{" "}
                        {
                          option.title
                        }
                      </option>
                    )
                  )}
                </select>
              </label>
            ) : null}
          </div>


          <button
            type="button"
            className="journal-book-navigation__arrow"
            disabled={
              !hasNext ||
              turning ||
              loading
            }
            onClick={() =>
              turnPage(
                1
              )
            }
            aria-label="Next page"
          >
            <ChevronRight
              size={17}
            />
          </button>
        </div>
      ) : null}


      {/* ===================================
          BOOK ACTIONS
         =================================== */}

      <div className="journal-book-bottom-actions">
        <button
          type="button"
          onClick={() =>
            setBookOpen(
              (
                current
              ) =>
                !current
            )
          }
        >
          {bookOpen ? (
            <BookHeart
              size={16}
            />
          ) : (
            <BookOpen
              size={16}
            />
          )}


          {bookOpen
            ? "Close journal"
            : "Open journal"}
        </button>


        <button
          type="button"
          className="is-primary"
          onClick={() =>
            onCreateEntry()
          }
        >
          <Plus
            size={16}
          />

          New page
        </button>
      </div>
    </section>
  );
}


export default JournalBook;