import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  LoaderCircle,
  MessageCircleHeart,
  RefreshCw,
  Sparkles
} from "lucide-react";

import {
  useAuth
} from "../../context/AuthContext";

import {
  deleteCommunityPost,
  getCommunityPost,
  getMyCommunityProfile
} from "../../services/communityService";

import {
  getApiErrorMessage
} from "../../services/api";

import {
  useCommunityFeed
} from "../../hooks/useCommunityFeed";

import CommunityIdentitySetup from "../../components/community/CommunityIdentitySetup";
import CommunityHeader from "../../components/community/CommunityHeader";
import CreatePostModal from "../../components/community/CreatePostModal";
import CommunityPostCard from "../../components/community/CommunityPostCard";
import PostSkeleton from "../../components/community/PostSkeleton";
import ConfirmDialog from "../../components/community/ConfirmDialog";
import EditPostModal from "../../components/community/EditPostModal";
import CommentsDrawer from "../../components/community/CommentsDrawer";
import ReportPostModal from "../../components/community/ReportPostModal";
import ReportModal
  from "../../components/reports/ReportModal";

import "./Community.css";

function getPostId(post) {
  return (
    post?.post_id ||
    post?.postId ||
    post?.id ||
    null
  );
}

function CommunityPage() {
  const { user } = useAuth();

  const [
    communityProfile,
    setCommunityProfile
  ] = useState(null);

  const [
    profileLoading,
    setProfileLoading
  ] = useState(true);

  const [
    profileError,
    setProfileError
  ] = useState("");

  const [
    activeFilter,
    setActiveFilter
  ] = useState("all");

  const [
    createModalOpen,
    setCreateModalOpen
  ] = useState(false);

  const [
    editingPost,
    setEditingPost
  ] = useState(null);

  const [
    deletingPost,
    setDeletingPost
  ] = useState(null);

  const [
    commentsPost,
    setCommentsPost
  ] = useState(null);

  const [
  reportingPost,
  setReportingPost
] = useState(null);

const [
  reportingUser,
  setReportingUser
] = useState(
  null
);

const deepLinkHandledRef =
  useRef(false);

  const [
    deleteLoading,
    setDeleteLoading
  ] = useState(false);

  const [
    pageError,
    setPageError
  ] = useState("");

  const {
    posts,
    pagination,
    loading,
    loadingMore,
    error,
    refreshFeed,
    loadMore,
    prependPost,
    updatePostInFeed,
    removePostFromFeed
  } = useCommunityFeed(activeFilter);

  /*
|--------------------------------------------------------------------------
| Shared post deep link
|--------------------------------------------------------------------------
|
| A CommunityPostCard shares:
|
| /dashboard/community?post=<postId>
|
| Previously the URL was copied but the Community page ignored the
| post parameter. This now fetches the post if necessary and scrolls
| directly to it.
*/

useEffect(() => {
  if (
    profileLoading ||
    !communityProfile ||
    deepLinkHandledRef.current
  ) {
    return;
  }

  const searchParams =
    new URLSearchParams(
      window.location.search
    );

  const sharedPostId =
    searchParams.get("post");

  if (!sharedPostId) {
    deepLinkHandledRef.current =
      true;

    return;
  }

  deepLinkHandledRef.current =
    true;

  let cancelled = false;

  async function revealSharedPost() {
    try {
      const existingPost =
        posts.find(
          (post) =>
            String(
              getPostId(post)
            ) ===
            String(
              sharedPostId
            )
        );

      if (!existingPost) {
        const sharedPost =
          await getCommunityPost(
            sharedPostId
          );

        if (
          sharedPost &&
          !cancelled
        ) {
          prependPost(
            sharedPost
          );
        }
      }

      window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        const element =
          document.getElementById(
            `community-post-${sharedPostId}`
          );

        element?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        element?.classList.add(
          "community-post-card--highlighted"
        );

        window.setTimeout(
          () => {
            element?.classList.remove(
              "community-post-card--highlighted"
            );
          },
          2200
        );
      }, 180);
    } catch (requestError) {
      if (!cancelled) {
        setPageError(
          getApiErrorMessage(
            requestError,
            "The shared community post could not be opened."
          )
        );
      }
    }
  }

  revealSharedPost();

  return () => {
    cancelled = true;
  };
}, [
  communityProfile,
  posts,
  prependPost,
  profileLoading
]);

  useEffect(() => {
    let ignore = false;

    async function loadCommunityProfile() {
      try {
        setProfileLoading(true);
        setProfileError("");

        const result =
          await getMyCommunityProfile();

        if (!ignore) {
          setCommunityProfile(result);
        }
      } catch (requestError) {
        if (ignore) {
          return;
        }

        const status =
          requestError.response?.status;

        const message =
          requestError.response?.data
            ?.message;

        if (
          status === 404 ||
          message ===
            "Community profile not found"
        ) {
          setCommunityProfile(null);
          setProfileError("");
        } else {
          setProfileError(
            getApiErrorMessage(
              requestError,
              "Unable to load your community profile."
            )
          );
        }
      } finally {
        if (!ignore) {
          setProfileLoading(false);
        }
      }
    }

    loadCommunityProfile();

    return () => {
      ignore = true;
    };
  }, []);

  const handleIdentityComplete = (
    result
  ) => {
    setCommunityProfile(result);
    setProfileError("");
    setPageError("");
  };

  const handleIdentityChanged = (
    updatedProfile
  ) => {
    setCommunityProfile(
      updatedProfile
    );

    setProfileError("");
    setPageError("");
  };

  const handleFilterChange = (
    nextFilter
  ) => {
    setPageError("");
    setActiveFilter(nextFilter);
  };

  const handleRefreshFeed =
    async () => {
      setPageError("");

      try {
        await refreshFeed();
      } catch {
        setPageError(
          "The community feed could not be refreshed."
        );
      }
    };

  const handleOpenCreatePost = () => {
    setPageError("");
    setCreateModalOpen(true);
  };

  const handleCloseCreatePost = () => {
    setCreateModalOpen(false);
  };

  const handlePostCreated = (
    createdPost
  ) => {
    if (!createdPost) {
      return;
    }

    prependPost(createdPost);
    setPageError("");
    setCreateModalOpen(false);
  };

  const handlePostUpdate = (
    postId,
    changes
  ) => {
    if (!postId) {
      return;
    }

    updatePostInFeed(
      postId,
      (currentPost) => ({
        ...currentPost,
        ...changes
      })
    );
  };

  const handlePostEdited = (
    updatedPost
  ) => {
    const postId =
      getPostId(updatedPost);

    if (!postId) {
      return;
    }

    updatePostInFeed(
      postId,
      (currentPost) => ({
        ...currentPost,
        ...updatedPost
      })
    );

    setEditingPost(null);
    setPageError("");
  };

  const handleDeletePost =
    async () => {
      const postId =
        getPostId(deletingPost);

      if (!postId) {
        return;
      }

      try {
        setDeleteLoading(true);
        setPageError("");

        await deleteCommunityPost(
          postId
        );

        removePostFromFeed(postId);
        setDeletingPost(null);
      } catch (requestError) {
        setPageError(
          getApiErrorMessage(
            requestError,
            "Unable to delete the post."
          )
        );
      } finally {
        setDeleteLoading(false);
      }
    };

  const handleCommentCountChanged = (
    commentCount
  ) => {
    const postId =
      getPostId(commentsPost);

    if (!postId) {
      return;
    }

    updatePostInFeed(postId, {
      comment_count:
        Number(commentCount)
    });

    setCommentsPost(
      (currentPost) =>
        currentPost
          ? {
              ...currentPost,
              comment_count:
                Number(
                  commentCount
                )
            }
          : null
    );
  };

  if (profileLoading) {
    return (
      <section className="community-profile-loading">
        <LoaderCircle size={33} />

        <p>
          Preparing your community…
        </p>
      </section>
    );
  }

  if (profileError) {
    return (
      <section className="community-error-state">
        <span>
          <MessageCircleHeart
            size={28}
          />
        </span>

        <h2>
          The community could not be
          loaded
        </h2>

        <p>{profileError}</p>

        <button
          type="button"
          className="community-primary-button"
          onClick={() =>
            window.location.reload()
          }
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </section>
    );
  }

  if (!communityProfile) {
    return (
      <CommunityIdentitySetup
        onComplete={
          handleIdentityComplete
        }
      />
    );
  }

  return (
    <div className="community-page">
      <CommunityHeader
        communityProfile={
          communityProfile
        }
        activeFilter={
          activeFilter
        }
        onFilterChange={
          handleFilterChange
        }
        onCreatePost={
          handleOpenCreatePost
        }
        onRefresh={
          handleRefreshFeed
        }
        refreshing={loading}
        onIdentityChanged={
          handleIdentityChanged
        }
      />

      {pageError && (
        <div
          className="community-page-alert"
          role="alert"
        >
          <span>{pageError}</span>

          <button
            type="button"
            onClick={() =>
              setPageError("")
            }
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <section className="community-feed-layout">
        <main className="community-feed">
          {loading ? (
            Array.from({
              length: 3
            }).map((_, index) => (
              <PostSkeleton
                key={`post-skeleton-${index}`}
              />
            ))
          ) : error ? (
            <section className="community-feed-state">
              <span>
                <MessageCircleHeart
                  size={27}
                />
              </span>

              <h3>
                Unable to load posts
              </h3>

              <p>{error}</p>

              <button
                type="button"
                className="community-primary-button"
                onClick={
                  handleRefreshFeed
                }
              >
                <RefreshCw
                  size={16}
                />
                Try again
              </button>
            </section>
          ) : posts.length === 0 ? (
            <section className="community-feed-state">
              <span>
                <Sparkles size={28} />
              </span>

              <h3>
                Be the first to share
              </h3>

              <p>
                There are no posts in
                this category yet.
              </p>

              <button
                type="button"
                className="community-primary-button"
                onClick={
                  handleOpenCreatePost
                }
              >
                Create a post
              </button>
            </section>
          ) : (
            <>
              {posts.map((post) => {
                const postId =
                  getPostId(post);

                if (!postId) {
                  return null;
                }

                return (
                  <CommunityPostCard
  key={
    postId
  }

  post={
    post
  }

  currentUserId={
    user?.user_id ||
    user?.userId
  }

  onRequestReport={
    setReportingPost
  }

  onRequestReportUser={(
    userToReport
  ) => {
    if (
      !userToReport
        ?.userId
    ) {
      return;
    }

    setReportingUser(
      userToReport
    );
  }}

  onUpdate={
    handlePostUpdate
  }

  onRequestEdit={
    setEditingPost
  }

  onRequestDelete={
    setDeletingPost
  }

  onOpenComments={() =>
    setCommentsPost(
      post
    )
  }
/>
                );
              })}

              {pagination?.hasNextPage && (
                <button
                  type="button"
                  className="community-load-more"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="community-icon-spin"
                      />
                      Loading more…
                    </>
                  ) : (
                    "Load more posts"
                  )}
                </button>
              )}
            </>
          )}
        </main>

        <aside className="community-sidebar">
          <article className="community-guidelines-card">
            <span>
              <Sparkles size={19} />
            </span>

            <h3>
              A kinder community begins
              with us.
            </h3>

            <p>
              Listen without judgement,
              respect privacy and avoid
              presenting personal
              experiences as medical
              advice.
            </p>

            <ul>
              <li>
                Be respectful and
                considerate
              </li>

              <li>
                Protect personal
                information
              </li>

              <li>
                Report unsafe content
              </li>
            </ul>
          </article>
        </aside>
      </section>

      <CreatePostModal
        open={createModalOpen}
        onClose={
          handleCloseCreatePost
        }
        onCreated={
          handlePostCreated
        }
        communityProfile={
          communityProfile
        }
      />

      <EditPostModal
        open={Boolean(editingPost)}
        post={editingPost}
        onClose={() =>
          setEditingPost(null)
        }
        onUpdated={
          handlePostEdited
        }
      />

      <ConfirmDialog
        open={Boolean(deletingPost)}
        title="Delete this post?"
        description="This action cannot be undone. The post will no longer appear in the community."
        confirmLabel="Delete post"
        loading={deleteLoading}
        onConfirm={
          handleDeletePost
        }
        onCancel={() =>
          setDeletingPost(null)
        }
      />

      <ReportPostModal
  open={Boolean(
    reportingPost
  )}
  post={reportingPost}
  onClose={() =>
    setReportingPost(null)
  }
  onReported={() => {
    setPageError("");
  }}
/>

<ReportModal
  open={
    Boolean(
      reportingUser
    )
  }

  targetType="user"

  targetId={
    reportingUser
      ?.userId
  }

  reportedUserId={
    reportingUser
      ?.userId
  }

  targetLabel="community member"

  targetName={
    reportingUser
      ?.visibleName ||
    "Community member"
  }

  onClose={() =>
    setReportingUser(
      null
    )
  }

  onReported={() => {
    setPageError(
      ""
    );
  }}
/>

      <CommentsDrawer
        open={Boolean(commentsPost)}
        post={commentsPost}
        currentUserId={
          user?.user_id ||
          user?.userId
        }
        onClose={() =>
          setCommentsPost(null)
        }
        onCommentCountChanged={
          handleCommentCountChanged
        }
      />
    </div>
  );
}

export default CommunityPage;