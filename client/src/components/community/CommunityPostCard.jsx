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
  Ellipsis,
  EyeOff,
  Flag,
  Heart,
  Link2,
  LockKeyhole,
  MessageCircle,
  Pencil,
  Share2,
  Trash2,
  UserRound
} from "lucide-react";

import PostMedia from "./PostMedia";

import {
  likeCommunityPost,
  unlikeCommunityPost
} from "../../services/communityService";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getPostId(post) {
  return (
    post?.post_id ||
    post?.postId ||
    post?.id ||
    null
  );
}

function getAuthorName(post) {
  return (
    post?.author_visible_name ||
    post?.authorVisibleName ||
    post?.visible_name ||
    post?.author?.visible_name ||
    post?.author?.name ||
    "Community member"
  );
}

function getAuthorInitials(
  post
) {
  const name =
    getAuthorName(post);

  if (!name) {
    return "U";
  }

  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return "U";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase();
}

function getAuthorProfileImage(
  post
) {
  return (
    post
      ?.author_profile_image_url ||
    post
      ?.authorProfileImageUrl ||
    post?.author
      ?.profile_image_url ||
    null
  );
}

function getAuthorUserId(
  post
) {
  return (
    post?.author_user_id ||
    post?.authorUserId ||
    post?.author?.user_id ||
    post?.author?.userId ||
    post?.author?.id ||
    null
  );
}

function isAnonymousPost(
  post
) {
  return (
    post
      ?.author_identity_mode ===
    "anonymous"
  );
}

function getPostMedia(
  post
) {
  return (
    post?.media ||
    post?.post_media ||
    post?.media_items ||
    []
  );
}

function formatRelativeTime(
  dateValue
) {
  if (!dateValue) {
    return "";
  }

  const date =
    new Date(
      dateValue
    );

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
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes /
        60
    );

  if (
    hours < 24
  ) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours /
        24
    );

  if (
    days < 7
  ) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        date.getFullYear() !==
        new Date().getFullYear()
          ? "numeric"
          : undefined
    }
  ).format(
    date
  );
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function CommunityPostCard({
  post,

  currentUserId,

  onUpdate,

  onRequestEdit,

  onRequestDelete,

  onRequestReport,

  onRequestReportUser,

  onOpenComments
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
    likeLoading,
    setLikeLoading
  ] = useState(
    false
  );

  const [
    shareStatus,
    setShareStatus
  ] = useState(
    ""
  );

  /*
  |--------------------------------------------------------------------------
  | Derived values
  |--------------------------------------------------------------------------
  */

  const postId =
    getPostId(
      post
    );

  const anonymous =
    isAnonymousPost(
      post
    );

  const authorProfileImage =
    getAuthorProfileImage(
      post
    );

  const authorInitials =
    getAuthorInitials(
      post
    );

  const authorUserId =
    getAuthorUserId(
      post
    );

  const isOwner =
    Boolean(
      currentUserId &&
        authorUserId
    ) &&
    String(
      authorUserId
    ) ===
      String(
        currentUserId
      );

  /*
   * IMPORTANT:
   *
   * The backend feed query returns:
   *
   * liked_by_current_user
   *
   * This must remain supported so
   * liked posts continue appearing
   * correctly after refresh.
   */

  const isLiked =
    Boolean(
      post
        ?.liked_by_current_user ??
        post?.is_liked ??
        post?.isLiked ??
        post?.liked ??
        false
    );

  const likeCount =
    Number(
      post?.like_count ??
        post?.likeCount ??
        post?.likes_count ??
        0
    );

  const commentCount =
    Number(
      post?.comment_count ??
        post?.commentCount ??
        post?.comments_count ??
        0
    );

  const commentsEnabled =
    post
      ?.comments_enabled !==
    false;

  /*
  |--------------------------------------------------------------------------
  | Close menu on outside click
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const closeMenu =
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
        closeMenu
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          closeMenu
        );
      };
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Share feedback cleanup
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !shareStatus
      ) {
        return undefined;
      }

      const timeoutId =
        window.setTimeout(
          () => {
            setShareStatus(
              ""
            );
          },
          2400
        );

      return () => {
        window.clearTimeout(
          timeoutId
        );
      };
    },
    [
      shareStatus
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Like / Unlike
  |--------------------------------------------------------------------------
  */

  const handleLike =
    async () => {
      if (
        !postId ||
        likeLoading
      ) {
        return;
      }

      const optimisticLiked =
        !isLiked;

      const optimisticCount =
        Math.max(
          likeCount +
            (
              optimisticLiked
                ? 1
                : -1
            ),
          0
        );

      onUpdate(
        postId,
        {
          liked_by_current_user:
            optimisticLiked,

          is_liked:
            optimisticLiked,

          like_count:
            optimisticCount
        }
      );

      try {
        setLikeLoading(
          true
        );

        const result =
          optimisticLiked
            ? await likeCommunityPost(
                postId
              )
            : await unlikeCommunityPost(
                postId
              );

        const serverLiked =
          Boolean(
            result?.liked
          );

        onUpdate(
          postId,
          {
            liked_by_current_user:
              serverLiked,

            is_liked:
              serverLiked,

            like_count:
              result?.likeCount ??
              optimisticCount
          }
        );
      } catch {
        onUpdate(
          postId,
          {
            liked_by_current_user:
              isLiked,

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
  | Share
  |--------------------------------------------------------------------------
  */

  const handleShare =
    async () => {
      if (
        !postId
      ) {
        return;
      }

      const shareUrl =
        `${window.location.origin}` +
        `/dashboard/community?post=${encodeURIComponent(
          postId
        )}`;

      try {
        if (
          navigator.share &&
          window.isSecureContext
        ) {
          await navigator.share({
            title:
              "Unwind Community",

            text:
              post?.caption
                ?.trim()
                ?.slice(
                  0,
                  120
                ) ||
              "View this post on Unwind Community.",

            url:
              shareUrl
          });

          setShareStatus(
            "shared"
          );

          return;
        }

        if (
          navigator.clipboard
            ?.writeText
        ) {
          await navigator.clipboard.writeText(
            shareUrl
          );

          setShareStatus(
            "copied"
          );

          return;
        }

        throw new Error(
          "Sharing unavailable"
        );
      } catch (
        error
      ) {
        /*
         * AbortError means the
         * user intentionally closed
         * the native share window.
         */

        if (
          error?.name ===
          "AbortError"
        ) {
          return;
        }

        setShareStatus(
          "failed"
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <motion.article
      id={
        postId
          ? `community-post-${postId}`
          : undefined
      }

      className="community-post-card"

      layout

      initial={{
        opacity: 0,
        y: 18
      }}

      animate={{
        opacity: 1,
        y: 0
      }}
    >
      {/* ===============================================================
          HEADER
      =============================================================== */}

      <header className="community-post-card__header">
        {/* Avatar */}

        <div
          className={
            anonymous
              ? "community-post-card__avatar community-post-card__avatar--anonymous"
              : "community-post-card__avatar"
          }
        >
          {!anonymous &&
          authorProfileImage ? (
            <img
              src={
                authorProfileImage
              }

              alt=""
            />
          ) : anonymous ? (
            <EyeOff
              size={18}
            />
          ) : (
            <span>
              {authorInitials ||
                "U"}
            </span>
          )}
        </div>

        {/* Identity */}

        <div className="community-post-card__identity">
          <div>
            <strong>
              {getAuthorName(
                post
              )}
            </strong>

            {post
              ?.author_identity_mode ===
              "anonymous" && (
              <span>
                <EyeOff
                  size={12}
                />

                Anonymous
              </span>
            )}
          </div>

          <small>
            {formatRelativeTime(
              post?.created_at ||
                post?.createdAt
            )}

            {post
              ?.is_edited && (
              <>
                <i>
                  •
                </i>

                Edited
              </>
            )}

            {post
              ?.visibility ===
              "private" && (
              <>
                <i>
                  •
                </i>

                <LockKeyhole
                  size={11}
                />

                Private
              </>
            )}
          </small>
        </div>

        {/* =============================================================
            POST MENU

            Own post:
              Edit
              Delete

            Someone else's post:
              Report post
              Report user
        ============================================================= */}

        <div
          className="community-post-card__menu"

          ref={
            menuRef
          }
        >
          <button
            type="button"

            aria-label="Post options"

            aria-expanded={
              menuOpen
            }

            onClick={() =>
              setMenuOpen(
                (
                  currentValue
                ) =>
                  !currentValue
              )
            }
          >
            <Ellipsis
              size={20}
            />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                  scale: 0.96
                }}

                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1
                }}

                exit={{
                  opacity: 0,
                  scale: 0.97
                }}
              >
                {isOwner ? (
                  <>
                    {/* Edit post */}

                    <button
                      type="button"

                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onRequestEdit?.(
                          post
                        );
                      }}
                    >
                      <Pencil
                        size={15}
                      />

                      Edit post
                    </button>

                    {/* Delete post */}

                    <button
                      type="button"

                      className="community-post-card__delete"

                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onRequestDelete?.(
                          post
                        );
                      }}
                    >
                      <Trash2
                        size={15}
                      />

                      Delete post
                    </button>
                  </>
                ) : (
                  <>
                    {/* =================================================
                        REPORT POST
                    ================================================= */}

                    <button
                      type="button"

                      className="community-post-card__report"

                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onRequestReport?.(
                          post
                        );
                      }}
                    >
                      <Flag
                        size={15}
                      />

                      Report post
                    </button>

                    {/* =================================================
                        REPORT USER
                    ================================================= */}

                    <button
                      type="button"

                      className="community-post-card__report community-post-card__report-user"

                      onClick={() => {
                        setMenuOpen(
                          false
                        );

                        onRequestReportUser?.(
                          {
                            userId:
                              authorUserId,

                            visibleName:
                              getAuthorName(
                                post
                              ),

                            post
                          }
                        );
                      }}

                      disabled={
                        !authorUserId
                      }
                    >
                      <UserRound
                        size={15}
                      />

                      Report user
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ===============================================================
          CAPTION
      =============================================================== */}

      {post?.caption && (
        <p className="community-post-card__caption">
          {post.caption}
        </p>
      )}

      {/* ===============================================================
          MEDIA
      =============================================================== */}

      <PostMedia
        media={
          getPostMedia(
            post
          )
        }
      />

      {/* ===============================================================
          FOOTER
      =============================================================== */}

      <footer className="community-post-card__footer">
        {/* Like */}

        <button
          type="button"

          className={
            isLiked
              ? "community-post-action community-post-action--liked"
              : "community-post-action"
          }

          onClick={
            handleLike
          }

          disabled={
            likeLoading
          }

          aria-label={
            isLiked
              ? "Unlike post"
              : "Like post"
          }
        >
          <Heart
            size={18}

            fill={
              isLiked
                ? "currentColor"
                : "none"
            }
          />

          <span>
            {likeCount}
          </span>
        </button>

        {/* Comments */}

        <button
          type="button"

          className="community-post-action"

          disabled={
            !commentsEnabled
          }

          onClick={() =>
            onOpenComments?.(
              post
            )
          }
        >
          <MessageCircle
            size={18}
          />

          <span>
            {commentsEnabled
              ? commentCount
              : "Disabled"}
          </span>
        </button>

        {/* Share */}

        <button
          type="button"

          className={
            shareStatus ===
            "copied"
              ? "community-post-action community-post-action--shared"
              : "community-post-action"
          }

          onClick={
            handleShare
          }
        >
          {shareStatus ===
          "copied" ? (
            <Check
              size={18}
            />
          ) : shareStatus ===
            "failed" ? (
            <Link2
              size={18}
            />
          ) : (
            <Share2
              size={18}
            />
          )}

          <span>
            {shareStatus ===
            "copied"
              ? "Copied"
              : shareStatus ===
                  "shared"
                ? "Shared"
                : shareStatus ===
                    "failed"
                  ? "Try again"
                  : "Share"}
          </span>
        </button>
      </footer>
    </motion.article>
  );
}

export default CommunityPostCard;