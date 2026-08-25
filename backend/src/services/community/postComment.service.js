import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";

import {
  createPostComment,
  findPostCommentById,
  findPostComments,
  findCommentReplies,
  countPostComments,
  updatePostComment,
  softDeletePostComment
} from "../../models/community/postComment.model.js";

import {
  notifyPostCommented
} from "../notification/communityNotification.service.js";

import {
  findCommunityPostByIdForUser
} from "../../models/community/communityPost.model.js";

import {
  getCommunityProfile
} from "./communityProfile.service.js";

export async function addPostComment({
  postId,
  userId,
  commentText,
  parentCommentId = null
}) {
  if (!userId) {
    throw new AppError(
      "Authenticated user ID is required",
      401
    );
  }

  if (!commentText?.trim()) {
    throw new AppError(
      "Comment text is required",
      400
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const post = await findCommunityPostByIdForUser(
      postId,
      userId
    );

    if (!post) {
      throw new AppError(
        "Post not found",
        404
      );
    }

    if (!post.comments_enabled) {
      throw new AppError(
        "Comments are disabled for this post",
        403
      );
    }

    const {
      profile,
      visibleName
    } = await getCommunityProfile(userId);

    if (!profile.is_active) {
      throw new AppError(
        "Your community profile is inactive",
        403
      );
    }

    if (profile.is_suspended) {
      throw new AppError(
        "Your community profile has been suspended",
        403
      );
    }

    let parentComment =
  null;

    if (parentCommentId) {
  parentComment =
    await findPostCommentById({
      commentId:
        parentCommentId,

      client
    });

      if (!parentComment) {
        throw new AppError(
          "Parent comment not found",
          404
        );
      }

      if (parentComment.post_id !== postId) {
        throw new AppError(
          "Parent comment does not belong to this post",
          400
        );
      }

      if (parentComment.is_deleted) {
        throw new AppError(
          "Cannot reply to a deleted comment",
          400
        );
      }
    }

    const comment = await createPostComment({
      postId,
      authorUserId: userId,
      authorVisibleName: visibleName,
      authorIdentityMode: profile.identity_mode,
      parentCommentId,
      commentText: commentText.trim(),
      client
    });

    const updateResult = await client.query(
      `
        UPDATE community_posts
        SET comment_count = comment_count + 1
        WHERE post_id = $1
        RETURNING comment_count;
      `,
      [postId]
    );

    await client.query("COMMIT");

    await notifyPostCommented({
  post,

  comment,

  parentComment,

  actorUserId:
    userId,

  actorVisibleName:
    visibleName
});

    return {
      comment,
      commentCount: updateResult.rows[0].comment_count
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getPostComments({
  postId,
  userId,
  page = 1,
  limit = 20
}) {
  const post = await findCommunityPostByIdForUser(
    postId,
    userId
  );

  if (!post) {
    throw new AppError(
      "Post not found",
      404
    );
  }

  const offset = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    findPostComments({
  postId,
  userId,
  limit,
  offset
}),
    countPostComments({
      postId
    })
  ]);

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getReplies({
  parentCommentId,
  userId,
  page = 1,
  limit = 20
}) {
  const parentComment =
    await findPostCommentById({
      commentId: parentCommentId
    });

  if (!parentComment) {
    throw new AppError(
      "Parent comment not found",
      404
    );
  }

  const post =
    await findCommunityPostByIdForUser(
      parentComment.post_id,
      userId
    );

  if (!post) {
    throw new AppError(
      "Post not found",
      404
    );
  }

  const offset =
    (page - 1) * limit;

  const replies =
    await findCommentReplies({
      parentCommentId,
      userId,
      limit,
      offset
    });

  return {
    replies,
    pagination: {
      page,
      limit,
      returned: replies.length,
      hasNextPage:
        replies.length === limit,
      hasPreviousPage:
        page > 1
    }
  };
}

export async function editPostComment({
  commentId,
  userId,
  commentText
}) {
  if (!commentText?.trim()) {
    throw new AppError(
      "Comment text is required",
      400
    );
  }

  const existingComment = await findPostCommentById({
    commentId
  });

  if (!existingComment) {
    throw new AppError(
      "Comment not found",
      404
    );
  }

  if (existingComment.is_deleted) {
    throw new AppError(
      "Deleted comments cannot be edited",
      400
    );
  }

  if (existingComment.author_user_id !== userId) {
    throw new AppError(
      "You can only edit your own comments",
      403
    );
  }

  const updatedComment = await updatePostComment({
    commentId,
    authorUserId: userId,
    commentText: commentText.trim()
  });

  if (!updatedComment) {
    throw new AppError(
      "Comment could not be updated",
      400
    );
  }

  return updatedComment;
}

export async function deletePostComment({
  commentId,
  userId
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingComment = await findPostCommentById({
      commentId,
      client
    });

    if (!existingComment) {
      throw new AppError(
        "Comment not found",
        404
      );
    }

    if (existingComment.is_deleted) {
      const commentCount = await countPostComments({
        postId: existingComment.post_id,
        client
      });

      await client.query("COMMIT");

      return {
        alreadyDeleted: true,
        commentCount
      };
    }

    if (existingComment.author_user_id !== userId) {
      throw new AppError(
        "You can only delete your own comments",
        403
      );
    }

    const deletedComment = await softDeletePostComment({
      commentId,
      authorUserId: userId,
      deletedBy: "author",
      client
    });

    if (!deletedComment) {
      throw new AppError(
        "Comment could not be deleted",
        400
      );
    }

    const updateResult = await client.query(
      `
        UPDATE community_posts
        SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE post_id = $1
        RETURNING comment_count;
      `,
      [existingComment.post_id]
    );

    await client.query("COMMIT");

    return {
      alreadyDeleted: false,
      comment: deletedComment,
      commentCount: updateResult.rows[0].comment_count
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}