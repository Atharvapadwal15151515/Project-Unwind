import api from "./api";

/*
|--------------------------------------------------------------------------
| Community profile
|--------------------------------------------------------------------------
*/

export async function getMyCommunityProfile() {
  const response = await api.get("/community/me");

  return response.data?.data;
}

export async function selectCommunityIdentity(
  identityMode,
  anonymousAlias = null
) {
  const payload = {
    identity_mode:
      identityMode
  };

  if (
    identityMode ===
      "anonymous" &&
    anonymousAlias?.trim()
  ) {
    payload.anonymous_alias =
      anonymousAlias.trim();
  }

  const response =
    await api.post(
      "/community/identity",
      payload
    );

  return response.data
    ?.data;
}

/*
|--------------------------------------------------------------------------
| Community posts
|--------------------------------------------------------------------------
*/

export async function getCommunityFeed({
  page = 1,
  limit = 10,
  postType
} = {}) {
  const params = {
    page,
    limit
  };

  if (postType && postType !== "all") {
    params.post_type = postType;
  }

  const response = await api.get(
    "/community/posts/feed",
    {
      params
    }
  );

  return response.data?.data;
}

export async function getCommunityPost(postId) {
  const response = await api.get(
    `/community/posts/${postId}`
  );

  return response.data?.data?.post;
}

export async function createCommunityPost({
  caption,
  postType,
  visibility,
  commentsEnabled,
  media = []
}) {
  const formData = new FormData();

  if (caption?.trim()) {
    formData.append(
      "caption",
      caption.trim()
    );
  }

  formData.append(
    "post_type",
    postType
  );

  formData.append(
    "visibility",
    visibility
  );

  formData.append(
    "comments_enabled",
    String(commentsEnabled)
  );

  media.forEach((file) => {
    formData.append("media", file);
  });

  const response = await api.post(
    "/community/posts",
    formData
  );

  return response.data?.data?.post;
}

export async function updateCommunityPost(
  postId,
  payload
) {
  const requestBody = {};

  if (payload.caption !== undefined) {
    requestBody.caption = payload.caption;
  }

  if (payload.visibility !== undefined) {
    requestBody.visibility =
      payload.visibility;
  }

  if (
    payload.commentsEnabled !== undefined
  ) {
    requestBody.comments_enabled =
      payload.commentsEnabled;
  }

  const response = await api.patch(
    `/community/posts/${postId}`,
    requestBody
  );

  return response.data?.data?.post;
}

export async function deleteCommunityPost(
  postId
) {
  const response = await api.delete(
    `/community/posts/${postId}`
  );

  return response.data?.data?.post;
}

export async function likeCommunityPost(
  postId
) {
  const response = await api.post(
    `/community/posts/${postId}/like`
  );

  return response.data?.data;
}

export async function unlikeCommunityPost(
  postId
) {
  const response = await api.delete(
    `/community/posts/${postId}/like`
  );

  return response.data?.data;
}

/*
|--------------------------------------------------------------------------
| Post comments
|--------------------------------------------------------------------------
*/

export async function getPostComments(
  postId,
  {
    page = 1,
    limit = 20
  } = {}
) {
  const response = await api.get(
    `/community/posts/${postId}/comments`,
    {
      params: {
        page,
        limit
      }
    }
  );

  return response.data?.data;
}

export async function createPostComment(
  postId,
  {
    commentText,
    parentCommentId = null
  }
) {
  const response = await api.post(
    `/community/posts/${postId}/comments`,
    {
      comment_text: commentText,
      parent_comment_id:
        parentCommentId
    }
  );

  return response.data?.data;
}

export async function getCommentReplies(
  commentId,
  {
    page = 1,
    limit = 20
  } = {}
) {
  const response = await api.get(
    `/community/comments/${commentId}/replies`,
    {
      params: {
        page,
        limit
      }
    }
  );

  return response.data?.data;
}

export async function updatePostComment(
  commentId,
  commentText
) {
  const response = await api.patch(
    `/community/comments/${commentId}`,
    {
      comment_text: commentText
    }
  );

  return response.data?.data?.comment;
}

export async function deletePostComment(
  commentId
) {
  const response = await api.delete(
    `/community/comments/${commentId}`
  );

  return response.data?.data;
}

/*
|--------------------------------------------------------------------------
| Comment likes
|--------------------------------------------------------------------------
*/

export async function likePostComment(
  commentId
) {
  const response = await api.post(
    `/community/comments/${commentId}/like`
  );

  return response.data?.data;
}

export async function unlikePostComment(
  commentId
) {
  const response = await api.delete(
    `/community/comments/${commentId}/like`
  );

  return response.data?.data;
}

/*
|--------------------------------------------------------------------------
| Community reports
|--------------------------------------------------------------------------
*/

export async function reportCommunityPost({
  postId,
  reportedUserId,
  reason,
  description
}) {
  const payload = {
    targetType: "post",
    targetId: postId,
    reason
  };

  if (reportedUserId) {
    payload.reportedUserId =
      reportedUserId;
  }

  if (description?.trim()) {
    payload.description =
      description.trim();
  }

  const response = await api.post(
    "/community/reports",
    payload
  );

  return response.data?.data;
}