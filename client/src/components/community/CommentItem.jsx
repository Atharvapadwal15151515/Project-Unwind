import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Ellipsis,
  EyeOff,
  Flag,
  Heart,
  LoaderCircle,
  Pencil,
  Reply,
  Trash2,
  X
} from "lucide-react";

import {
  deletePostComment,
  getCommentReplies,
  likePostComment,
  unlikePostComment,
  updatePostComment
} from "../../services/communityService";

import {
  getApiErrorMessage
} from "../../services/api";

import ReportModal
  from "../reports/ReportModal";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getCommentId(
  comment
) {
  return (
    comment?.comment_id ||
    comment?.commentId ||
    comment?.id ||
    null
  );
}

function getAuthorName(
  comment
) {
  return (
    comment?.author_visible_name ||
    comment?.authorVisibleName ||
    comment?.visible_name ||
    comment?.author?.visible_name ||
    comment?.author?.name ||
    "Community member"
  );
}

function getAuthorInitials(
  comment
) {
  return getAuthorName(
    comment
  )
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}

function formatRelativeTime(
  value
) {
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

  const difference =
    Date.now() -
    date.getTime();

  const minutes =
    Math.floor(
      difference /
        60000
    );

  if (
    minutes < 1
  ) {
    return "Just now";
  }

  if (
    minutes < 60
  ) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  if (
    hours < 24
  ) {
    return `${hours}h`;
  }

  const days =
    Math.floor(
      hours /
        24
    );

  if (
    days < 7
  ) {
    return `${days}d`;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short"
    }
  ).format(
    date
  );
}

/*
|--------------------------------------------------------------------------
| Comment Item
|--------------------------------------------------------------------------
*/

function CommentItem({
  comment,
  currentUserId,
  depth = 0,
  onReply,
  onDeleted,
  onCommentChanged
}) {
  const menuRef =
    useRef(null);

  const [
    menuOpen,
    setMenuOpen
  ] = useState(
    false
  );

  const [
    editing,
    setEditing
  ] = useState(
    false
  );

  const [
    editText,
    setEditText
  ] = useState(
    comment?.comment_text ||
      ""
  );

  const [
    saving,
    setSaving
  ] = useState(
    false
  );

  const [
    deleting,
    setDeleting
  ] = useState(
    false
  );

  const [
    likeLoading,
    setLikeLoading
  ] = useState(
    false
  );

  const [
    replies,
    setReplies
  ] = useState(
    []
  );

  const [
    repliesVisible,
    setRepliesVisible
  ] = useState(
    false
  );

  const [
    repliesLoading,
    setRepliesLoading
  ] = useState(
    false
  );

  const [
    repliesLoaded,
    setRepliesLoaded
  ] = useState(
    false
  );

  const [
    error,
    setError
  ] = useState(
    ""
  );

  /*
  |--------------------------------------------------------------------------
  | Reporting
  |--------------------------------------------------------------------------
  */

  const [
    reportOpen,
    setReportOpen
  ] = useState(
    false
  );

  /*
  |--------------------------------------------------------------------------
  | Derived values
  |--------------------------------------------------------------------------
  */

  const commentId =
    getCommentId(
      comment
    );

  const authorUserId =
    comment?.author_user_id ||
    comment?.authorUserId ||
    comment?.author?.user_id ||
    comment?.author?.userId ||
    comment?.author?.id ||
    null;

  const isOwner =
    Boolean(
      currentUserId
    ) &&
    Boolean(
      authorUserId
    ) &&
    String(
      authorUserId
    ) ===
      String(
        currentUserId
      );

  const isLiked =
    Boolean(
      comment?.is_liked ||
        comment?.isLiked ||
        comment?.liked
    );

  const likeCount =
    Number(
      comment?.like_count ??
        comment?.likeCount ??
        0
    );

  const replyCount =
    Number(
      comment?.reply_count ??
        comment?.replyCount ??
        comment?.replies_count ??
        0
    );

  const isDeleted =
    Boolean(
      comment?.is_deleted
    );

  /*
  |--------------------------------------------------------------------------
  | Keep edit text synced
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !editing
      ) {
        setEditText(
          comment?.comment_text ||
            ""
        );
      }
    },
    [
      comment?.comment_text,
      editing
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Close menu on outside click
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const handleOutsideClick =
        (
          event
        ) => {
          if (
            menuRef.current &&
            !menuRef.current.contains(
              event.target
            )
          ) {
            setMenuOpen(
              false
            );
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
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Like / Unlike
  |--------------------------------------------------------------------------
  */

  const handleLike =
    async () => {
      if (
        !commentId ||
        likeLoading ||
        isDeleted
      ) {
        return;
      }

      const nextLiked =
        !isLiked;

      onCommentChanged?.(
        commentId,
        {
          is_liked:
            nextLiked,

          like_count:
            Math.max(
              likeCount +
                (
                  nextLiked
                    ? 1
                    : -1
                ),
              0
            )
        }
      );

      try {
        setLikeLoading(
          true
        );

        const result =
          nextLiked
            ? await likePostComment(
                commentId
              )
            : await unlikePostComment(
                commentId
              );

        onCommentChanged?.(
          commentId,
          {
            is_liked:
              Boolean(
                result?.liked
              ),

            like_count:
              result?.likeCount ??
              likeCount
          }
        );
      } catch {
        onCommentChanged?.(
          commentId,
          {
            is_liked:
              isLiked,

            like_count:
              likeCount
          }
        );
      } finally {
        setLikeLoading(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Save edited comment
  |--------------------------------------------------------------------------
  */

  const handleSaveEdit =
    async () => {
      const trimmedText =
        editText.trim();

      if (
        !trimmedText ||
        !commentId
      ) {
        return;
      }

      try {
        setSaving(
          true
        );

        setError(
          ""
        );

        const updatedComment =
          await updatePostComment(
            commentId,
            trimmedText
          );

        onCommentChanged?.(
          commentId,

          updatedComment || {
            comment_text:
              trimmedText,

            updated_at:
              new Date()
                .toISOString()
          }
        );

        setEditing(
          false
        );
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,

            "Unable to update this comment."
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    async () => {
      if (
        !commentId
      ) {
        return;
      }

      try {
        setDeleting(
          true
        );

        setError(
          ""
        );

        const result =
          await deletePostComment(
            commentId
          );

        onDeleted?.(
          commentId,
          result
        );
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,

            "Unable to delete this comment."
          )
        );

        setDeleting(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Replies
  |--------------------------------------------------------------------------
  */

  const toggleReplies =
    async () => {
      if (
        repliesVisible
      ) {
        setRepliesVisible(
          false
        );

        return;
      }

      setRepliesVisible(
        true
      );

      if (
        repliesLoaded
      ) {
        return;
      }

      try {
        setRepliesLoading(
          true
        );

        setError(
          ""
        );

        const result =
          await getCommentReplies(
            commentId
          );

        setReplies(
          Array.isArray(
            result?.replies
          )
            ? result.replies
            : []
        );

        setRepliesLoaded(
          true
        );
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,

            "Unable to load replies."
          )
        );
      } finally {
        setRepliesLoading(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Update nested reply
  |--------------------------------------------------------------------------
  */

  const updateReply = (
    replyId,
    changes
  ) => {
    setReplies(
      (
        currentReplies
      ) =>
        currentReplies.map(
          (
            reply
          ) =>
            getCommentId(
              reply
            ) ===
            replyId
              ? {
                  ...reply,
                  ...changes
                }
              : reply
        )
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Remove nested reply
  |--------------------------------------------------------------------------
  */

  const removeReply = (
    replyId
  ) => {
    setReplies(
      (
        currentReplies
      ) =>
        currentReplies.filter(
          (
            reply
          ) =>
            getCommentId(
              reply
            ) !==
            replyId
        )
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Open report modal
  |--------------------------------------------------------------------------
  */

  const handleOpenReport =
    () => {
      if (
        !commentId ||
        isOwner ||
        isDeleted
      ) {
        return;
      }

      setMenuOpen(
        false
      );

      setReportOpen(
        true
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <motion.article
        className={`comment-item ${
          depth > 0
            ? "comment-item--reply"
            : ""
        }`}

        initial={{
          opacity: 0,
          y: 8
        }}

        animate={{
          opacity: 1,
          y: 0
        }}

        layout
      >
        {/* ===============================================================
            AVATAR
        =============================================================== */}

        <span className="comment-item__avatar">
          {getAuthorInitials(
            comment
          )}
        </span>

        {/* ===============================================================
            BODY
        =============================================================== */}

        <div className="comment-item__body">
          <div className="comment-item__bubble">
            <header>
              <div>
                <strong>
                  {getAuthorName(
                    comment
                  )}
                </strong>

                {comment
                  ?.author_identity_mode ===
                  "anonymous" && (
                  <span>
                    <EyeOff
                      size={11}
                    />

                    Anonymous
                  </span>
                )}

                <small>
                  {formatRelativeTime(
                    comment
                      ?.created_at ||
                      comment
                        ?.createdAt
                  )}
                </small>
              </div>

              {/* =======================================================
                  COMMENT MENU

                  Own comment:
                  - Edit
                  - Delete

                  Other person's comment:
                  - Report
              ======================================================= */}

              {!isDeleted && (
                <div
                  className="comment-item__menu"

                  ref={
                    menuRef
                  }
                >
                  <button
                    type="button"

                    onClick={() =>
                      setMenuOpen(
                        (
                          currentValue
                        ) =>
                          !currentValue
                      )
                    }

                    aria-label="Comment options"
                  >
                    <Ellipsis
                      size={17}
                    />
                  </button>

                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.96,
                          y: -4
                        }}

                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0
                        }}

                        exit={{
                          opacity: 0
                        }}
                      >
                        {isOwner ? (
                          <>
                            {/* Edit */}

                            <button
                              type="button"

                              onClick={() => {
                                setEditing(
                                  true
                                );

                                setMenuOpen(
                                  false
                                );
                              }}
                            >
                              <Pencil
                                size={14}
                              />

                              Edit
                            </button>

                            {/* Delete */}

                            <button
                              type="button"

                              className="comment-item__delete"

                              onClick={() => {
                                setMenuOpen(
                                  false
                                );

                                handleDelete();
                              }}

                              disabled={
                                deleting
                              }
                            >
                              {deleting ? (
                                <LoaderCircle
                                  size={14}

                                  className="community-icon-spin"
                                />
                              ) : (
                                <Trash2
                                  size={14}
                                />
                              )}

                              {deleting
                                ? "Deleting…"
                                : "Delete"}
                            </button>
                          </>
                        ) : (
                          /* =================================================
                             REPORT COMMENT
                          ================================================= */

                          <button
                            type="button"

                            className="comment-item__delete"

                            onClick={
                              handleOpenReport
                            }
                          >
                            <Flag
                              size={14}
                            />

                            Report comment
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </header>

            {/* =========================================================
                EDITOR
            ========================================================= */}

            {editing ? (
              <div className="comment-item__editor">
                <textarea
                  value={
                    editText
                  }

                  onChange={(
                    event
                  ) =>
                    setEditText(
                      event
                        .target
                        .value
                    )
                  }

                  maxLength={
                    2000
                  }

                  rows={
                    3
                  }

                  autoFocus
                />

                <div>
                  <button
                    type="button"

                    onClick={() => {
                      setEditing(
                        false
                      );

                      setEditText(
                        comment
                          ?.comment_text ||
                          ""
                      );
                    }}

                    disabled={
                      saving
                    }
                  >
                    <X
                      size={14}
                    />

                    Cancel
                  </button>

                  <button
                    type="button"

                    onClick={
                      handleSaveEdit
                    }

                    disabled={
                      saving ||
                      !editText.trim()
                    }
                  >
                    {saving ? (
                      <LoaderCircle
                        size={14}

                        className="community-icon-spin"
                      />
                    ) : (
                      <Check
                        size={14}
                      />
                    )}

                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p>
                {isDeleted
                  ? "This comment was deleted."
                  : comment
                      ?.comment_text}
              </p>
            )}
          </div>

          {/* ===========================================================
              COMMENT ACTIONS
          =========================================================== */}

          {!isDeleted && (
            <div className="comment-item__actions">
              {/* Like */}

              <button
                type="button"

                className={
                  isLiked
                    ? "comment-item__action comment-item__action--liked"
                    : "comment-item__action"
                }

                onClick={
                  handleLike
                }

                disabled={
                  likeLoading
                }
              >
                {likeLoading ? (
                  <LoaderCircle
                    size={14}

                    className="community-icon-spin"
                  />
                ) : (
                  <Heart
                    size={14}

                    fill={
                      isLiked
                        ? "currentColor"
                        : "none"
                    }
                  />
                )}

                {likeCount >
                  0 &&
                  likeCount}
              </button>

              {/* Reply */}

              {depth ===
                0 && (
                <button
                  type="button"

                  className="comment-item__action"

                  onClick={() =>
                    onReply?.(
                      comment
                    )
                  }
                >
                  <Reply
                    size={14}
                  />

                  Reply
                </button>
              )}

              {/* Show replies */}

              {depth ===
                0 &&
                replyCount >
                  0 && (
                  <button
                    type="button"

                    className="comment-item__action comment-item__replies-button"

                    onClick={
                      toggleReplies
                    }
                  >
                    {repliesVisible ? (
                      <ChevronUp
                        size={14}
                      />
                    ) : (
                      <ChevronDown
                        size={14}
                      />
                    )}

                    {replyCount}{" "}

                    {replyCount ===
                    1
                      ? "reply"
                      : "replies"}
                  </button>
                )}
            </div>
          )}

          {/* ===========================================================
              ERROR
          =========================================================== */}

          {error && (
            <div className="comment-item__error">
              {error}
            </div>
          )}

          {/* ===========================================================
              REPLIES
          =========================================================== */}

          {repliesVisible && (
            <div className="comment-item__replies">
              {repliesLoading ? (
                <div className="comment-item__replies-loading">
                  <LoaderCircle
                    size={16}

                    className="community-icon-spin"
                  />

                  Loading replies…
                </div>
              ) : (
                replies.map(
                  (
                    reply
                  ) => (
                    <CommentItem
                      key={
                        getCommentId(
                          reply
                        )
                      }

                      comment={
                        reply
                      }

                      currentUserId={
                        currentUserId
                      }

                      depth={
                        depth + 1
                      }

                      onReply={
                        onReply
                      }

                      onDeleted={
                        removeReply
                      }

                      onCommentChanged={
                        updateReply
                      }
                    />
                  )
                )
              )}
            </div>
          )}
        </div>
      </motion.article>

      {/* ===============================================================
          REPORT COMMENT MODAL

          This is outside motion.article deliberately so the modal's
          position: fixed backdrop is not affected by Framer Motion's
          transformed article.
      =============================================================== */}

      <ReportModal
        open={
          reportOpen
        }

        targetType="comment"

        targetId={
          commentId
        }

        reportedUserId={
          authorUserId
        }

        targetLabel="comment"

        targetName={
          getAuthorName(
            comment
          )
        }

        onClose={() =>
          setReportOpen(
            false
          )
        }

        onReported={() => {}}
      />
    </>
  );
}

export default CommentItem;