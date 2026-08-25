import {
  createCommunityPost,
  findCommunityPostByIdForUser,
  findCommunityFeed,
  countCommunityFeed,
  updateCommunityPost,
  softDeleteCommunityPost,
  findPostsByUserId
} from "../../models/community/communityPost.model.js";
import {
  uploadPostMedia,
  deletePostMedia
} from "./postMedia.service.js";
import {
  getCommunityProfile
} from "./communityProfile.service.js";

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function createPost({
  userId,
  caption,
  postType,
  visibility,
  commentsEnabled,
  files = []
}) {
  if (!userId) {
    throw createHttpError(
      "Authenticated user ID is required",
      401
    );
  }

  const {
    profile,
    visibleName
  } = await getCommunityProfile(userId);

  if (!profile.is_active) {
    throw createHttpError(
      "Your community profile is inactive",
      403
    );
  }

  if (profile.is_suspended) {
    throw createHttpError(
      "Your community profile has been suspended",
      403
    );
  }

  const uploadedFiles = Array.isArray(files)
    ? files
    : [];

  if (
    postType === "text" &&
    !caption?.trim()
  ) {
    throw createHttpError(
      "Caption is required for a text post",
      400
    );
  }

  if (
    postType === "text" &&
    uploadedFiles.length > 0
  ) {
    throw createHttpError(
      "Text posts cannot contain media files",
      400
    );
  }

  if (
    ["image", "video", "mixed"].includes(postType) &&
    uploadedFiles.length === 0
  ) {
    throw createHttpError(
      "At least one media file is required",
      400
    );
  }

  const containsImages = uploadedFiles.some((file) =>
    file.mimetype.startsWith("image/")
  );

  const containsVideos = uploadedFiles.some((file) =>
    file.mimetype.startsWith("video/")
  );

  if (
    postType === "image" &&
    containsVideos
  ) {
    throw createHttpError(
      "Image posts can only contain image files",
      400
    );
  }

  if (
    postType === "video" &&
    containsImages
  ) {
    throw createHttpError(
      "Video posts can only contain video files",
      400
    );
  }

  if (
    postType === "mixed" &&
    !(containsImages && containsVideos)
  ) {
    throw createHttpError(
      "Mixed posts must contain at least one image and one video",
      400
    );
  }

  const post = await createCommunityPost({
    authorUserId: userId,
    authorVisibleName: visibleName,
    authorIdentityMode: profile.identity_mode,
    caption: caption?.trim() || null,
    postType,
    visibility,
    commentsEnabled
  });

  try {
    const media = await uploadPostMedia({
      postId: post.post_id,
      files: uploadedFiles
    });

    return {
      ...post,
      media
    };
  } catch (error) {
    try {
      await deletePostMedia(post.post_id);

      await softDeleteCommunityPost({
        postId: post.post_id,
        userId
      });
    } catch {
      // Ignore cleanup errors
    }

    throw error;
  }
}

export async function getPostById({
  postId,
  userId
}) {
  if (!userId) {
    throw createHttpError(
      "Authenticated user ID is required",
      401
    );
  }

  const post = await findCommunityPostByIdForUser(
    postId,
    userId
  );

  if (!post) {
    throw createHttpError(
      "Post not found",
      404
    );
  }

  return post;
}

export async function getFeed({
  userId,
  page,
  limit,
  postType
}) {
  if (!userId) {
    throw createHttpError(
      "Authenticated user ID is required",
      401
    );
  }

  const offset = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    findCommunityFeed({
      userId,
      limit,
      offset,
      postType
    }),

   countCommunityFeed({
  userId,
  postType
})
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: offset + posts.length < total,
      hasPreviousPage: page > 1
    }
  };
}

export async function editPost({
  postId,
  userId,
  caption,
  visibility,
  commentsEnabled
}) {
  if (!userId) {
    throw createHttpError(
      "Authenticated user ID is required",
      401
    );
  }

  const existingPost =
    await findCommunityPostByIdForUser(
      postId,
      userId
    );

  if (!existingPost) {
    throw createHttpError(
      "Post not found",
      404
    );
  }

  if (existingPost.author_user_id !== userId) {
    throw createHttpError(
      "You can only edit your own posts",
      403
    );
  }

  const finalCaption =
    caption !== undefined
      ? caption?.trim() || null
      : undefined;

  if (
    existingPost.post_type === "text" &&
    caption !== undefined &&
    !finalCaption
  ) {
    throw createHttpError(
      "A text post cannot have an empty caption",
      400
    );
  }

  const updatedPost = await updateCommunityPost({
    postId,
    userId,
    caption: finalCaption,
    visibility,
    commentsEnabled
  });

  if (!updatedPost) {
    throw createHttpError(
      "Post could not be updated",
      404
    );
  }

  return updatedPost;
}

export async function deletePost({
  postId,
  userId
}) {
  if (!userId) {
    throw createHttpError(
      "Authenticated user ID is required",
      401
    );
  }

  const existingPost =
    await findCommunityPostByIdForUser(
      postId,
      userId
    );

  if (!existingPost) {
    throw createHttpError(
      "Post not found",
      404
    );
  }

  if (existingPost.author_user_id !== userId) {
    throw createHttpError(
      "You can only delete your own posts",
      403
    );
  }

  const deletedPost =
    await softDeleteCommunityPost({
      postId,
      userId
    });

  if (!deletedPost) {
    throw createHttpError(
      "Post could not be deleted",
      404
    );
  }

  return deletedPost;
}

export async function getPostsByUser({
  authorUserId,
  currentUserId,
  page,
  limit
}) {
  if (!currentUserId) {
    throw createHttpError(
      "Authenticated user ID is required",
      401
    );
  }

  const offset = (page - 1) * limit;

  const posts = await findPostsByUserId({
    authorUserId,
    currentUserId,
    limit,
    offset
  });

  return {
    posts,
    pagination: {
      page,
      limit,
      returned: posts.length,
      hasNextPage: posts.length === limit,
      hasPreviousPage: page > 1
    }
  };
}