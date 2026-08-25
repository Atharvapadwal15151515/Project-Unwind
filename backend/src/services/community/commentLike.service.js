import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";

import {
  createCommentLike,
  deleteCommentLike,
  countCommentLikes
} from "../../models/community/commentLike.model.js";

import {
  notifyCommentLiked
} from "../notification/communityNotification.service.js";

import {
  findPostCommentById
} from "../../models/community/postComment.model.js";

export async function likeComment({
  commentId,
  userId
}) {
  if (!userId) {
    throw new AppError(
      "Authenticated user ID is required",
      401
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const comment = await findPostCommentById({
      commentId,
      client
    });

    if (!comment) {
      throw new AppError(
        "Comment not found",
        404
      );
    }

    if (comment.is_deleted) {
      throw new AppError(
        "Deleted comments cannot be liked",
        400
      );
    }

    const like = await createCommentLike({
      commentId,
      userId,
      client
    });

    if (!like) {
      const likeCount = await countCommentLikes({
        commentId,
        client
      });

      await client.query("COMMIT");

      return {
        alreadyLiked: true,
        liked: true,
        likeCount,
        like: null
      };
    }

    const updateResult = await client.query(
      `
        UPDATE post_comments
        SET
          like_count = like_count + 1,
          updated_at = now()
        WHERE comment_id = $1
        RETURNING like_count;
      `,
      [commentId]
    );

   await client.query(
  "COMMIT"
);

await notifyCommentLiked({
  comment,

  actorUserId:
    userId
});

return {
  alreadyLiked:
    false,

  liked:
    true,

  likeCount:
    updateResult
      .rows[0]
      .like_count,

  like
};
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function unlikeComment({
  commentId,
  userId
}) {
  if (!userId) {
    throw new AppError(
      "Authenticated user ID is required",
      401
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const comment = await findPostCommentById({
      commentId,
      client
    });

    if (!comment) {
      throw new AppError(
        "Comment not found",
        404
      );
    }

    const deletedLike = await deleteCommentLike({
      commentId,
      userId,
      client
    });

    if (!deletedLike) {
      const likeCount = await countCommentLikes({
        commentId,
        client
      });

      await client.query("COMMIT");

      return {
        alreadyUnliked: true,
        liked: false,
        likeCount
      };
    }

    const updateResult = await client.query(
      `
        UPDATE post_comments
        SET
          like_count = GREATEST(like_count - 1, 0),
          updated_at = now()
        WHERE comment_id = $1
        RETURNING like_count;
      `,
      [commentId]
    );

    await client.query("COMMIT");

    return {
      alreadyUnliked: false,
      liked: false,
      likeCount: updateResult.rows[0].like_count
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}