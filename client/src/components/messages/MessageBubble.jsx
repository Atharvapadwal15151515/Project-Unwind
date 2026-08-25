import {
  Check,
  Copy,
  Flag,
  MoreHorizontal,
  Pencil,
  Reply,
  Trash2
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState
} from "react";

import MemberAvatar
  from "./MemberAvatar";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const EDIT_TIME_LIMIT =
  30 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| Time formatter
|--------------------------------------------------------------------------
*/

function formatTime(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}

/*
|--------------------------------------------------------------------------
| Message Bubble
|--------------------------------------------------------------------------
*/

function MessageBubble({
  message,
  currentUserId,
  messageId,
  senderId,
  senderName,
  senderImage,
  text,
  createdAt,
  editedAt,

  replyMessageId,
  replySenderName,
  replyText,
  replyDeleted,
  deleted,

  onReply,
  onEdit,
  onDelete,
  onReport
}) {
  /*
  |--------------------------------------------------------------------------
  | Local state
  |--------------------------------------------------------------------------
  */

  const [
    menuOpen,
    setMenuOpen
  ] = useState(false);

  const [
    copied,
    setCopied
  ] = useState(false);

  const [
    canEdit,
    setCanEdit
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Refs
  |--------------------------------------------------------------------------
  */

  const menuContainerRef =
    useRef(null);

  const copyTimerRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Current user
  |--------------------------------------------------------------------------
  */

  const isOwn =
    Boolean(
      currentUserId &&
      senderId &&
      String(
        currentUserId
      ) ===
        String(
          senderId
        )
    );

  /*
  |--------------------------------------------------------------------------
  | Edit availability
  |--------------------------------------------------------------------------
  |
  | Messages can only be edited for
  | 30 minutes after being sent.
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      /*
       * Only the owner of a
       * non-deleted message can edit.
       */
      if (
        !isOwn ||
        deleted ||
        !createdAt
      ) {
        setCanEdit(
          false
        );

        return undefined;
      }

      const createdTime =
        new Date(
          createdAt
        ).getTime();

      if (
        Number.isNaN(
          createdTime
        )
      ) {
        setCanEdit(
          false
        );

        return undefined;
      }

      const expiresAt =
        createdTime +
        EDIT_TIME_LIMIT;

      const remainingTime =
        expiresAt -
        Date.now();

      /*
       * Message is already older
       * than 30 minutes.
       */
      if (
        remainingTime <= 0
      ) {
        setCanEdit(
          false
        );

        return undefined;
      }

      /*
       * Message is currently editable.
       */
      setCanEdit(
        true
      );

      /*
       * Automatically remove Edit
       * exactly when the 30-minute
       * window expires.
       */
      const editTimer =
        window.setTimeout(
          () => {
            setCanEdit(
              false
            );
          },
          remainingTime
        );

      return () => {
        window.clearTimeout(
          editTimer
        );
      };
    },
    [
      createdAt,
      deleted,
      isOwn
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Close menu when clicking outside
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!menuOpen) {
        return undefined;
      }

      const handlePointerDown =
        (event) => {
          if (
            menuContainerRef
              .current &&
            !menuContainerRef
              .current
              .contains(
                event.target
              )
          ) {
            setMenuOpen(
              false
            );
          }
        };

      const handleKeyDown =
        (event) => {
          if (
            event.key ===
            "Escape"
          ) {
            setMenuOpen(
              false
            );
          }
        };

      document.addEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        document.removeEventListener(
          "pointerdown",
          handlePointerDown
        );

        document.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      menuOpen
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Cleanup timers
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      return () => {
        if (
          copyTimerRef.current
        ) {
          window.clearTimeout(
            copyTimerRef.current
          );
        }
      };
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Copy message
  |--------------------------------------------------------------------------
  */

  const handleCopy =
    async () => {
      if (
        !text ||
        deleted
      ) {
        return;
      }

      try {
        await navigator
          .clipboard
          .writeText(
            text
          );

        setCopied(
          true
        );

        if (
          copyTimerRef.current
        ) {
          window.clearTimeout(
            copyTimerRef.current
          );
        }

        copyTimerRef.current =
          window.setTimeout(
            () => {
              setCopied(
                false
              );

              copyTimerRef.current =
                null;
            },
            1500
          );
      } catch {
        // Clipboard unavailable.
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <article
      className={
        isOwn
          ? "message-bubble-row message-bubble-row--own"
          : "message-bubble-row"
      }
    >
      {/* Other user's avatar */}

      {!isOwn && (
        <MemberAvatar
          name={
            senderName
          }
          imageUrl={
            senderImage
          }
          size={34}
        />
      )}

      <div className="message-bubble-content">
        {/* Sender */}

        {!isOwn && (
          <div className="message-bubble-sender">
            {senderName}
          </div>
        )}

        <div className="message-bubble-shell">
          {/* Message */}

          <div className="message-bubble">
            {/* Reply preview */}

            {replyMessageId && (
              <div className="message-bubble-reply">
                <strong>
                  {replySenderName}
                </strong>

                <span>
                  {replyDeleted
                    ? "This message was deleted"
                    : replyText}
                </span>
              </div>
            )}

            <p>
              {deleted
                ? "This message was deleted"
                : text}
            </p>
          </div>

          {/* =========================================================
              MESSAGE OPTIONS
          ========================================================= */}

          <div
            ref={
              menuContainerRef
            }
          >
            <button
              type="button"
              className="message-bubble-menu-button"
              onClick={() => {
                setMenuOpen(
                  (current) =>
                    !current
                );
              }}
              aria-label="Message options"
              aria-expanded={
                menuOpen
              }
            >
              <MoreHorizontal
                size={16}
              />
            </button>

            {menuOpen && (
              <div
                className="message-bubble-menu"
                role="menu"
              >
                {/* Reply */}

                {!deleted && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(
                        false
                      );

                      onReply?.(
                        message
                      );
                    }}
                  >
                    <Reply
                      size={14}
                    />

                    Reply
                  </button>
                )}

                {/* Copy */}

                {!deleted && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCopy();

                      setMenuOpen(
                        false
                      );
                    }}
                  >
                    {copied ? (
                      <Check
                        size={14}
                      />
                    ) : (
                      <Copy
                        size={14}
                      />
                    )}

                    {copied
                      ? "Copied"
                      : "Copy"}
                  </button>
                )}

                {/* Report */}

                {!isOwn &&
                  !deleted &&
                  onReport && (
                    <button
                      type="button"
                      className="message-bubble-menu__danger"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onReport(
                          message
                        );
                      }}
                    >
                      <Flag
                        size={14}
                      />

                      Report
                    </button>
                  )}

                {/* Edit */}

                {isOwn &&
                  !deleted &&
                  canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onEdit?.(
                          message
                        );
                      }}
                    >
                      <Pencil
                        size={14}
                      />

                      Edit
                    </button>
                  )}

                {/* Delete */}

                {isOwn &&
                  !deleted && (
                    <button
                      type="button"
                      className="message-bubble-menu__danger"
                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onDelete?.(
                          messageId
                        );
                      }}
                    >
                      <Trash2
                        size={14}
                      />

                      Delete
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================
            MESSAGE META
        ========================================================= */}

        <div className="message-bubble-meta">
          {formatTime(
            createdAt
          )}

          {editedAt && (
            <span>
              Edited
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default MessageBubble;