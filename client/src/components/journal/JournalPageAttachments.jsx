import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  createPortal
} from "react-dom";

import {
  ExternalLink,
  FileText,
  Headphones,
  Image as ImageIcon,
  LoaderCircle,
  Maximize2,
  Paperclip,
  Play,
  Video,
  X
} from "lucide-react";

import {
  getJournalEntryAttachments
} from "../../services/journalAttachmentService";

import {
  getJournalAttachmentId,
  getJournalAttachmentType
} from "../../utils/journalAttachmentUtils";

import {
  getJournalEntryId
} from "../../utils/journalUtils";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getAttachmentSource(
  attachment
) {
  const type =
    getJournalAttachmentType(
      attachment
    ) || "document";

  /*
   * Documents must prefer the original file URL.
   * A preview URL may point to a generated preview
   * rather than the actual PDF/document.
   */
  if (type === "document") {
    return (
      attachment?.fileUrl ||
      attachment?.file_url ||
      attachment?.secureUrl ||
      attachment?.secure_url ||
      attachment?.resourceUrl ||
      attachment?.resource_url ||
      attachment?.url ||
      attachment?.previewUrl ||
      attachment?.preview_url ||
      ""
    );
  }

  /*
   * Images/video/audio may safely prefer previews.
   */
  return (
    attachment?.previewUrl ||
    attachment?.preview_url ||
    attachment?.fileUrl ||
    attachment?.file_url ||
    attachment?.secureUrl ||
    attachment?.secure_url ||
    attachment?.resourceUrl ||
    attachment?.resource_url ||
    attachment?.url ||
    ""
  );
}

function openJournalAttachment(
  attachment
) {
  const source =
    getAttachmentSource(
      attachment
    );

  if (!source) {
    console.error(
      "Journal attachment has no usable URL:",
      attachment
    );

    return;
  }

  console.log(
    "Opening journal attachment:",
    {
      name:
        getAttachmentName(
          attachment
        ),
      source,
      attachment
    }
  );

  const opened =
    window.open(
      source,
      "_blank",
      "noopener,noreferrer"
    );

  if (!opened) {
    console.warn(
      "Browser blocked journal attachment popup."
    );
  }
}


function getAttachmentName(
  attachment
) {
  return (
    attachment?.originalFileName ||
    attachment?.original_file_name ||
    attachment?.fileName ||
    attachment?.file_name ||
    "Journal attachment"
  );
}


function getAttachmentCaption(
  attachment
) {
  return (
    attachment?.caption ||
    attachment?.altText ||
    attachment?.alt_text ||
    ""
  );
}


function isAttachmentCover(
  attachment
) {
  return Boolean(
    attachment?.isCover ??
    attachment?.is_cover
  );
}


function getAttachmentKey(
  attachment,
  index = 0
) {
  return (
    getJournalAttachmentId(
      attachment
    ) ||
    attachment?.id ||
    `${getAttachmentName(
      attachment
    )}-${index}`
  );
}


/*
|--------------------------------------------------------------------------
| Sort attachments
|--------------------------------------------------------------------------
|
| The explicitly selected cover comes first.
|
| Everything else keeps the backend ordering.
|
*/

function sortJournalAttachments(
  attachments
) {
  return [
    ...(attachments || [])
  ].sort(
    (
      first,
      second
    ) => {
      const firstCover =
        isAttachmentCover(
          first
        )
          ? 1
          : 0;

      const secondCover =
        isAttachmentCover(
          second
        )
          ? 1
          : 0;


      if (
        firstCover !==
        secondCover
      ) {
        return (
          secondCover -
          firstCover
        );
      }


      const firstOrder =
        Number(
          first?.displayOrder ??
          first?.display_order ??
          first?.position ??
          0
        );


      const secondOrder =
        Number(
          second?.displayOrder ??
          second?.display_order ??
          second?.position ??
          0
        );


      return (
        firstOrder -
        secondOrder
      );
    }
  );
}


/*
|--------------------------------------------------------------------------
| Attachment icon
|--------------------------------------------------------------------------
*/

function AttachmentTypeIcon({
  type,
  size = 14
}) {
  switch (type) {
    case "image":
      return (
        <ImageIcon
          size={size}
        />
      );

    case "video":
      return (
        <Video
          size={size}
        />
      );

    case "audio":
      return (
        <Headphones
          size={size}
        />
      );

    default:
      return (
        <FileText
          size={size}
        />
      );
  }
}


/*
|--------------------------------------------------------------------------
| Cover attachment renderer
|--------------------------------------------------------------------------
*/

function JournalCoverAttachment({
  attachment,
  onSeeAll,
  total
}) {
  if (!attachment) {
    return null;
  }


  const source =
    getAttachmentSource(
      attachment
    );


  const type =
    getJournalAttachmentType(
      attachment
    ) || "document";


  const name =
    getAttachmentName(
      attachment
    );


  const caption =
    getAttachmentCaption(
      attachment
    );


  /*
  |--------------------------------------------------------------------------
  | Image cover
  |--------------------------------------------------------------------------
  */

  if (
    type === "image" &&
    source
  ) {
    return (
      <div className="journal-page-attachment-cover journal-page-attachment-cover--image">
        <figure>
          <img
            src={source}
            alt={
              attachment?.altText ||
              attachment?.alt_text ||
              caption ||
              name
            }
            loading="lazy"
          />

          <figcaption>
            {caption ||
              "A memory from this page"}
          </figcaption>
        </figure>


        {total > 1 ? (
          <SeeAllButton
            total={total}
            onClick={
              onSeeAll
            }
          />
        ) : null}
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Video cover
  |--------------------------------------------------------------------------
  */

  if (
    type === "video" &&
    source
  ) {
    return (
      <div className="journal-page-attachment-cover journal-page-attachment-cover--video">
        <div className="journal-page-attachment-cover__type">
          <Video
            size={11}
          />

          Video memory
        </div>


        <div className="journal-page-video-cover">
          <video
            src={source}
            controls
            playsInline
            preload="metadata"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
            onPointerDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            Your browser does not
            support video playback.
          </video>


          <span className="journal-page-video-cover__mark">
            <Play
              size={15}
            />
          </span>
        </div>


        {caption ? (
          <p className="journal-page-attachment-cover__caption">
            {caption}
          </p>
        ) : null}


        {total > 1 ? (
          <SeeAllButton
            total={total}
            onClick={
              onSeeAll
            }
          />
        ) : null}
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Voice / audio cover
  |--------------------------------------------------------------------------
  */

  if (
    type === "audio"
  ) {
    return (
      <div className="journal-page-attachment-cover journal-page-attachment-cover--audio">
        <div className="journal-page-audio-cover">
          <div className="journal-page-audio-cover__icon">
            <Headphones
              size={18}
            />
          </div>


          <div className="journal-page-audio-cover__content">
            <div className="journal-page-audio-cover__heading">
              <div>
                <small>
                  VOICE MEMORY
                </small>

                <strong>
                  {caption ||
                    name ||
                    "Listen to this moment"}
                </strong>
              </div>
            </div>


            {source ? (
              <audio
                src={source}
                controls
                preload="metadata"
                onClick={(
                  event
                ) =>
                  event.stopPropagation()
                }
                onPointerDown={(
                  event
                ) =>
                  event.stopPropagation()
                }
              >
                Your browser does not
                support audio playback.
              </audio>
            ) : (
              <span className="journal-page-attachment-missing">
                Audio unavailable
              </span>
            )}
          </div>
        </div>


        {total > 1 ? (
          <SeeAllButton
            total={total}
            onClick={
              onSeeAll
            }
          />
        ) : null}
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Document cover
  |--------------------------------------------------------------------------
  */

  return (
    <div className="journal-page-attachment-cover journal-page-attachment-cover--document">
      <div className="journal-page-document-cover">
        <div className="journal-page-document-cover__icon">
          <FileText
            size={22}
          />
        </div>


        <div className="journal-page-document-cover__body">
          <small>
            ATTACHED DOCUMENT
          </small>

          <strong>
            {name}
          </strong>

          {caption ? (
            <p>
              {caption}
            </p>
          ) : null}
        </div>


        {source ? (
  <button
    type="button"
    className="journal-page-document-cover__open"
    aria-label={`Open ${name}`}
    onPointerDown={(
      event
    ) =>
      event.stopPropagation()
    }
    onClick={(
      event
    ) => {
      event.stopPropagation();

      openJournalAttachment(
        attachment
      );
    }}
  >
    <ExternalLink
      size={15}
    />
  </button>
) : null}
      </div>


      {total > 1 ? (
        <SeeAllButton
          total={total}
          onClick={
            onSeeAll
          }
        />
      ) : null}
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| See all button
|--------------------------------------------------------------------------
*/

function SeeAllButton({
  total,
  onClick
}) {
  return (
    <button
      type="button"
      className="journal-page-see-all-attachments"
      onClick={(
        event
      ) => {
        event.stopPropagation();

        onClick();
      }}
      onPointerDown={(
        event
      ) =>
        event.stopPropagation()
      }
    >
      <Paperclip
        size={13}
      />

      See all attachments

      <span>
        {total}
      </span>
    </button>
  );
}


/*
|--------------------------------------------------------------------------
| Gallery attachment
|--------------------------------------------------------------------------
*/

function JournalGalleryAttachment({
  attachment,
  index
}) {
  const source =
    getAttachmentSource(
      attachment
    );


  const type =
    getJournalAttachmentType(
      attachment
    ) || "document";


  const name =
    getAttachmentName(
      attachment
    );


  const caption =
    getAttachmentCaption(
      attachment
    );


  const cover =
    isAttachmentCover(
      attachment
    );


  return (
    <article
      className={[
        "journal-attachment-viewer__item",

        `journal-attachment-viewer__item--${type}`,

        cover
          ? "is-cover"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="journal-attachment-viewer__item-header">
        <div>
          <AttachmentTypeIcon
            type={type}
          />

          <span>
            {type === "audio"
              ? "Voice / Audio"
              : type.charAt(
                  0
                ).toUpperCase() +
                type.slice(
                  1
                )}
          </span>
        </div>


        {cover ? (
          <span className="journal-attachment-viewer__cover-badge">
            Cover
          </span>
        ) : null}
      </header>


      <div className="journal-attachment-viewer__preview">
        {type === "image" &&
        source ? (
          <img
            src={source}
            alt={
              attachment?.altText ||
              attachment?.alt_text ||
              caption ||
              name
            }
            loading="lazy"
          />
        ) : null}


        {type === "video" &&
        source ? (
          <video
            src={source}
            controls
            playsInline
            preload="metadata"
          >
            Your browser does not
            support video playback.
          </video>
        ) : null}


        {type === "audio" ? (
          <div className="journal-attachment-viewer__audio">
            <div className="journal-attachment-viewer__audio-icon">
              <Headphones
                size={28}
              />
            </div>


            <strong>
              {caption ||
                name ||
                `Voice memory ${index + 1}`}
            </strong>


            {source ? (
              <audio
                src={source}
                controls
                preload="metadata"
              >
                Your browser does not
                support audio playback.
              </audio>
            ) : (
              <span>
                Audio unavailable
              </span>
            )}
          </div>
        ) : null}


        {type === "document" ? (
          <div className="journal-attachment-viewer__document">
            <FileText
              size={42}
            />

            <strong>
              {name}
            </strong>


            {caption ? (
              <p>
                {caption}
              </p>
            ) : null}


            {source ? (
  <button
    type="button"
    className="journal-attachment-viewer__document-open"
    onClick={() =>
      openJournalAttachment(
        attachment
      )
    }
  >
    <ExternalLink
      size={14}
    />

    Open document
  </button>
) : null}
          </div>
        ) : null}
      </div>


      {(type === "image" ||
        type === "video") ? (
        <footer className="journal-attachment-viewer__item-footer">
          <div>
            <strong>
              {name}
            </strong>

            {caption ? (
              <p>
                {caption}
              </p>
            ) : null}
          </div>


          {source ? (
            <a
              href={source}
              target="_blank"
              rel="noreferrer"
              aria-label="Open attachment in new tab"
            >
              <Maximize2
                size={14}
              />
            </a>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}


/*
|--------------------------------------------------------------------------
| All attachments viewer
|--------------------------------------------------------------------------
*/

function JournalAttachmentsViewer({
  open,
  attachments,
  title,
  onClose
}) {
  /*
  |--------------------------------------------------------------------------
  | ESC + BODY SCROLL LOCK
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!open) {
      return undefined;
    }


    const previousOverflow =
      document.body.style.overflow;


    document.body.style.overflow =
      "hidden";


    function handleEscape(
      event
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }


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
    open,
    onClose
  ]);


  if (
    !open ||
    typeof document ===
      "undefined"
  ) {
    return null;
  }


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | Render directly under document.body.
  |
  | DO NOT render this viewer inside the physical journal book.
  |
  | The book uses:
  |
  | - transform
  | - perspective
  | - transform-style
  | - overflow hidden
  |
  | Those properties can trap position:fixed children inside the book.
  |
  | React Portal completely removes that problem.
  |
  */

  return createPortal(
    <div
      className="journal-attachment-viewer"
      role="presentation"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="journal-attachment-viewer__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-attachments-title"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        {/* =====================================================
            HEADER
           ===================================================== */}

        <header className="journal-attachment-viewer__header">
          <div className="journal-attachment-viewer__heading">
            <span className="journal-attachment-viewer__eyebrow">
              <Paperclip
                size={14}
              />

              ATTACHMENTS
            </span>


            <h3 id="journal-attachments-title">
              {title}
            </h3>


            <p>
              {attachments.length}{" "}
              {attachments.length ===
              1
                ? "memory attached to this page"
                : "memories attached to this page"}
            </p>
          </div>


          <button
            type="button"
            className="journal-attachment-viewer__close"
            onClick={
              onClose
            }
            aria-label="Close attachments"
          >
            <X
              size={19}
            />
          </button>
        </header>


        {/* =====================================================
            ATTACHMENTS
           ===================================================== */}

        <div className="journal-attachment-viewer__body">
          <div className="journal-attachment-viewer__grid">
            {attachments.map(
              (
                attachment,
                index
              ) => (
                <JournalGalleryAttachment
                  key={
                    getAttachmentKey(
                      attachment,
                      index
                    )
                  }
                  attachment={
                    attachment
                  }
                  index={
                    index
                  }
                />
              )
            )}
          </div>
        </div>
      </section>
    </div>,

    document.body
  );
}


/*
|--------------------------------------------------------------------------
| Main journal page attachment component
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This DOES NOT try to read attachments from the lightweight journal entry.
|
| It calls your ALREADY EXISTING:
|
| GET /journal/attachments/entries/:entryId
|
| through:
|
| getJournalEntryAttachments(entryId)
|
| No backend change.
|
*/

function JournalPageAttachments({
  entry,
  title = "Journal attachments",
  disabled = false
}) {
  const entryId =
    getJournalEntryId(
      entry
    );


  const [
    attachments,
    setAttachments
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(false);


  const [
    error,
    setError
  ] = useState("");


  const [
    viewerOpen,
    setViewerOpen
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Load REAL attachments for this entry
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled =
      false;


    if (!entryId) {
      setAttachments([]);
      setLoading(false);
      setError("");

      return () => {
        cancelled = true;
      };
    }


    async function load() {
      try {
        setLoading(true);
        setError("");


        const result =
          await getJournalEntryAttachments(
            entryId
          );


        if (cancelled) {
          return;
        }


        const loaded =
          Array.isArray(
            result?.attachments
          )
            ? result.attachments
            : [];


        setAttachments(
          sortJournalAttachments(
            loaded
          )
        );
      } catch (
        loadError
      ) {
        if (cancelled) {
          return;
        }


        console.error(
          "Unable to load journal page attachments:",
          loadError
        );


        setAttachments([]);


        setError(
          "Attachments could not be loaded."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }


    load();


    return () => {
      cancelled = true;
    };
  }, [
    entryId
  ]);


  /*
  |--------------------------------------------------------------------------
  | Cover
  |--------------------------------------------------------------------------
  |
  | Because the array is sorted with the explicitly selected
  | cover first, attachment #0 is always the correct page cover.
  |
  | If no explicit cover exists, the first attachment becomes
  | the reading-view cover automatically.
  |
  */

  const coverAttachment =
    useMemo(
      () =>
        attachments[0] ||
        null,
      [
        attachments
      ]
    );


  if (
    !entryId ||
    disabled
  ) {
    return null;
  }


  /*
   * Small loading state.
   */

  if (loading) {
    return (
      <div
        className="journal-page-attachments__loading"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <LoaderCircle
          className="journal-spin"
          size={14}
        />

        Loading memories…
      </div>
    );
  }


  /*
   * Do not create an ugly empty card when this entry
   * genuinely has no attachments.
   */

  if (
    !loading &&
    attachments.length ===
      0
  ) {
    if (!error) {
      return null;
    }


    return (
      <div
        className="journal-page-attachments__error"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        {error}
      </div>
    );
  }


  return (
    <>
      <div
        className="journal-page-attachments"
        onClick={(
          event
        ) =>
          event.stopPropagation()
        }
        onPointerDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <JournalCoverAttachment
          attachment={
            coverAttachment
          }
          total={
            attachments.length
          }
          onSeeAll={() =>
            setViewerOpen(
              true
            )
          }
        />
      </div>


      <JournalAttachmentsViewer
        open={
          viewerOpen
        }
        attachments={
          attachments
        }
        title={
          title
        }
        onClose={() =>
          setViewerOpen(
            false
          )
        }
      />
    </>
  );
}


export default JournalPageAttachments;