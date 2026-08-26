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
import {
  createPortal
} from "react-dom";

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

    const menuButtonRef =
  useRef(null);

const [
  menuPosition,
  setMenuPosition
] = useState({
  top: 0,
  left: 0
});

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

  useEffect(() => {
  const handleOutsideClick =
    (event) => {
      const clickedMenu =
        menuContainerRef
          .current
          ?.contains(
            event.target
          );

      const clickedButton =
        menuButtonRef
          .current
          ?.contains(
            event.target
          );

      if (
        menuOpen &&
        !clickedMenu &&
        !clickedButton
      ) {
        setMenuOpen(false);
      }
    };

  document.addEventListener(
    "mousedown",
    handleOutsideClick
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleOutsideClick
    );
  };
}, [menuOpen]);

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
            ref={menuButtonRef}
              type="button"
              className="message-bubble-menu-button"
              onClick={() => {
  if (!menuOpen) {
    const button =
      menuButtonRef.current;

    if (button) {
      const rect =
        button.getBoundingClientRect();

      const MENU_WIDTH = 170;
      const MENU_HEIGHT =
        isOwn
          ? 190
          : 145;

      const GAP = 8;
      const EDGE = 12;

      let left =
        isOwn
          ? rect.right -
            MENU_WIDTH
          : rect.left;

      left =
        Math.max(
          EDGE,
          Math.min(
            left,
            window.innerWidth -
              MENU_WIDTH -
              EDGE
          )
        );

      const roomBelow =
        window.innerHeight -
        rect.bottom;

      const shouldOpenAbove =
        roomBelow <
        MENU_HEIGHT + GAP;

      let top =
        shouldOpenAbove
          ? rect.top -
            MENU_HEIGHT -
            GAP
          : rect.bottom +
            GAP;

      top =
        Math.max(
          EDGE,
          Math.min(
            top,
            window.innerHeight -
              MENU_HEIGHT -
              EDGE
          )
        );

      setMenuPosition({
        top,
        left
      });
    }
  }

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

            {menuOpen &&
  createPortal(
    <div
      ref={menuContainerRef}
      className="message-bubble-menu message-bubble-menu--portal"
      role="menu"
      style={{
        top:
          `${menuPosition.top}px`,
        left:
          `${menuPosition.left}px`
      }}
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
              </div>,
              document.body
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