import {
  useCallback,
  useEffect,
  useState
} from "react";

import { getCommunityFeed } from "../services/communityService";
import { getApiErrorMessage } from "../services/api";

const PAGE_LIMIT = 10;

function mergeUniquePosts(
  currentPosts,
  incomingPosts
) {
  const postMap = new Map();

  [...currentPosts, ...incomingPosts].forEach(
    (post) => {
      const postId =
        post?.post_id ||
        post?.postId ||
        post?.id;

      if (postId) {
        postMap.set(postId, post);
      }
    }
  );

  return Array.from(postMap.values());
}

export function useCommunityFeed(
  postType = "all"
) {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [error, setError] = useState("");

  const loadFeed = useCallback(
    async ({
      page = 1,
      append = false
    } = {}) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        setError("");

        const result =
          await getCommunityFeed({
            page,
            limit: PAGE_LIMIT,
            postType
          });

        const incomingPosts =
          Array.isArray(result?.posts)
            ? result.posts
            : [];

        setPosts((currentPosts) =>
          append
            ? mergeUniquePosts(
                currentPosts,
                incomingPosts
              )
            : incomingPosts
        );

        setPagination(
          result?.pagination || null
        );
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to load the community feed."
          )
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [postType]
  );

  useEffect(() => {
    loadFeed({
      page: 1,
      append: false
    });
  }, [loadFeed]);

  const refreshFeed = useCallback(() => {
    return loadFeed({
      page: 1,
      append: false
    });
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    if (
      loadingMore ||
      !pagination?.hasNextPage
    ) {
      return;
    }

    loadFeed({
      page: pagination.page + 1,
      append: true
    });
  }, [
    loadFeed,
    loadingMore,
    pagination
  ]);

  const prependPost = useCallback(
    (post) => {
      setPosts((currentPosts) => [
        post,
        ...currentPosts.filter(
          (currentPost) => {
            const currentId =
              currentPost?.post_id ||
              currentPost?.postId ||
              currentPost?.id;

            const newId =
              post?.post_id ||
              post?.postId ||
              post?.id;

            return currentId !== newId;
          }
        )
      ]);
    },
    []
  );

  const updatePostInFeed = useCallback(
    (postId, updater) => {
      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          const currentPostId =
            post?.post_id ||
            post?.postId ||
            post?.id;

          if (currentPostId !== postId) {
            return post;
          }

          return typeof updater === "function"
            ? updater(post)
            : {
                ...post,
                ...updater
              };
        })
      );
    },
    []
  );

  const removePostFromFeed = useCallback(
    (postId) => {
      setPosts((currentPosts) =>
        currentPosts.filter((post) => {
          const currentPostId =
            post?.post_id ||
            post?.postId ||
            post?.id;

          return currentPostId !== postId;
        })
      );
    },
    []
  );

  return {
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
  };
}