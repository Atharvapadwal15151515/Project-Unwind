import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  createPortal
} from "react-dom";

import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  LoaderCircle,
  MessageCircleHeart,
  RefreshCw,
  X
} from "lucide-react";

import {
  createPostComment,
  getPostComments
} from "../../services/communityService";

import {
  getApiErrorMessage
} from "../../services/api";

import CommentComposer from "./CommentComposer";
import CommentItem from "./CommentItem";
import CommentSkeleton from "./CommentSkeleton";

function getPostId(post) {
  return (
    post?.post_id ||
    post?.postId ||
    post?.id ||
    null
  );
}

function getCommentId(comment) {
  return (
    comment?.comment_id ||
    comment?.commentId ||
    comment?.id ||
    null
  );
}

function getAuthorName(comment) {
  return (
    comment?.author_visible_name ||
    comment?.authorVisibleName ||
    comment?.visible_name ||
    "Community member"
  );
}

function CommentsDrawer({
  open,
  post,
  currentUserId,
  onClose,
  onCommentCountChanged
}) {
  const [comments, setComments] =
    useState([]);

  const [pagination, setPagination] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [replyingTo, setReplyingTo] =
    useState(null);

  const [error, setError] =
    useState("");

  const postId = getPostId(post);

  const loadComments = useCallback(
    async ({
      page = 1,
      append = false
    } = {}) => {
      if (!postId) {
        return;
      }

      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        setError("");

        const result =
          await getPostComments(
            postId,
            {
              page,
              limit: 20
            }
          );

        const incomingComments =
          Array.isArray(
            result?.comments
          )
            ? result.comments
            : [];

        setComments(
          (currentComments) =>
            append
              ? [
                  ...currentComments,
                  ...incomingComments
                ]
              : incomingComments
        );

        setPagination(
          result?.pagination || null
        );
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to load comments."
          )
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [postId]
  );

  useEffect(() => {
    if (!open || !postId) {
      return;
    }

    setComments([]);
    setPagination(null);
    setReplyingTo(null);
    setError("");

    loadComments({
      page: 1,
      append: false
    });
  }, [
    loadComments,
    open,
    postId
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [onClose, open]);

  const handleSubmitComment =
    async (commentText) => {
      if (!postId) {
        return false;
      }

      try {
        setSubmitting(true);
        setError("");

        const result =
          await createPostComment(
            postId,
            {
              commentText,
              parentCommentId:
                replyingTo
                  ? getCommentId(
                      replyingTo
                    )
                  : null
            }
          );

        const createdComment =
          result?.comment;

        if (!createdComment) {
          throw new Error(
            "The server did not return the created comment."
          );
        }

        if (replyingTo) {
          /*
           * Refresh comments so the reply counter
           * returned by the backend is reflected.
           */
          await loadComments({
            page: 1,
            append: false
          });

          setReplyingTo(null);
        } else {
          setComments(
            (currentComments) => [
              createdComment,
              ...currentComments
            ]
          );
        }

        if (
          result?.commentCount !==
          undefined
        ) {
          onCommentCountChanged(
            result.commentCount
          );
        }

        return true;
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to add your comment."
          )
        );

        return false;
      } finally {
        setSubmitting(false);
      }
    };

  const updateComment = (
    commentId,
    changes
  ) => {
    setComments((currentComments) =>
      currentComments.map((comment) =>
        getCommentId(comment) ===
        commentId
          ? {
              ...comment,
              ...changes
            }
          : comment
      )
    );
  };

  const handleCommentDeleted = (
    commentId,
    result
  ) => {
    setComments((currentComments) =>
      currentComments.filter(
        (comment) =>
          getCommentId(comment) !==
          commentId
      )
    );

    if (
      result?.commentCount !==
      undefined
    ) {
      onCommentCountChanged(
        result.commentCount
      );
    }
  };

  const hasMoreComments =
    pagination &&
    pagination.page <
      pagination.totalPages;

  const drawer = (
    <AnimatePresence>
      {open && (
        <div className="comments-drawer-layer">
          <motion.button
            type="button"
            className="comments-drawer-backdrop"
            onClick={onClose}
            aria-label="Close comments"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
          />

          <motion.aside
            className="comments-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Post comments"
            initial={{
              x: "100%"
            }}
            animate={{
              x: 0
            }}
            exit={{
              x: "100%"
            }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 34
            }}
          >
            <header className="comments-drawer__header">
              <div>
                <span>
                  <MessageCircleHeart
                    size={18}
                  />
                </span>

                <div>
                  <h2>Comments</h2>
                  <p>
                    Join the conversation
                    thoughtfully.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close comments"
              >
                <X size={20} />
              </button>
            </header>

            <div className="comments-drawer__content">
              {error && (
                <div
                  className="community-page-alert"
                  role="alert"
                >
                  <span>{error}</span>

                  <button
                    type="button"
                    onClick={() =>
                      setError("")
                    }
                  >
                    ×
                  </button>
                </div>
              )}

              {loading ? (
                <div className="comments-drawer__comments">
                  {Array.from({
                    length: 4
                  }).map((_, index) => (
                    <CommentSkeleton
                      key={index}
                    />
                  ))}
                </div>
              ) : comments.length ===
                0 ? (
                <section className="comments-empty-state">
                  <span>
                    <MessageCircleHeart
                      size={25}
                    />
                  </span>

                  <h3>
                    Start a kind conversation
                  </h3>

                  <p>
                    No comments have been
                    shared on this post yet.
                  </p>
                </section>
              ) : (
                <div className="comments-drawer__comments">
                  {comments.map(
                    (comment) => (
                      <CommentItem
                        key={getCommentId(
                          comment
                        )}
                        comment={comment}
                        currentUserId={
                          currentUserId
                        }
                        onReply={
                          setReplyingTo
                        }
                        onDeleted={
                          handleCommentDeleted
                        }
                        onCommentChanged={
                          updateComment
                        }
                      />
                    )
                  )}

                  {hasMoreComments && (
                    <button
                      type="button"
                      className="comments-load-more"
                      onClick={() =>
                        loadComments({
                          page:
                            pagination.page +
                            1,
                          append: true
                        })
                      }
                      disabled={
                        loadingMore
                      }
                    >
                      {loadingMore ? (
                        <>
                          <LoaderCircle
                            size={16}
                            className="community-icon-spin"
                          />
                          Loading…
                        </>
                      ) : (
                        <>
                          <RefreshCw
                            size={15}
                          />
                          Load more comments
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            <footer className="comments-drawer__footer">
              <CommentComposer
                submitting={submitting}
                replyingTo={
                  replyingTo
                    ? getAuthorName(
                        replyingTo
                      )
                    : null
                }
                onCancelReply={() =>
                  setReplyingTo(null)
                }
                onSubmit={
                  handleSubmitComment
                }
              />
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  if (
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    drawer,
    document.body
  );
}

export default CommentsDrawer;