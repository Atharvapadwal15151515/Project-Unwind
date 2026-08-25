import pool from "../../config/database.js";

import {
  createPostLike,
  deletePostLike,
  countPostLikes
} from "../../models/community/postLike.model.js";

import {
  notifyPostLiked
} from "../notification/communityNotification.service.js";

import {
  findCommunityPostByIdForUser
} from "../../models/community/communityPost.model.js";

import AppError from "../../utils/AppError.js";

export async function likePost({
  postId,
  userId
}) {
  if (!userId) {
    throw createHttpError(
      "Authenticated user ID is required",
      401
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
      throw createHttpError(
        "Post not found",
        404
      );
    }

    const like = await createPostLike({
      postId,
      userId,
      client
    });

    if (!like) {
      const likeCount = await countPostLikes({
        postId,
        client
      });

      await client.query(
  "COMMIT"
);

await notifyPostLiked({
  post,

  actorUserId:
    userId
});

return {
  alreadyLiked:
    false,

  liked:
    true,

  likeCount:
    rows[0].like_count,

  like
};
    }

    const updateQuery = `
      UPDATE community_posts
      SET like_count = like_count + 1
      WHERE post_id = $1
      RETURNING like_count;
    `;

    const { rows } = await client.query(
      updateQuery,
      [postId]
    );

    await client.query("COMMIT");

    return {
      alreadyLiked: false,
      liked: true,
      likeCount: rows[0].like_count,
      like
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function unlikePost({
  postId,
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

    const deletedLike = await deletePostLike({
      postId,
      userId,
      client
    });

    if (!deletedLike) {
      const likeCount = await countPostLikes({
        postId,
        client
      });

      await client.query("COMMIT");

      return {
        alreadyUnliked: true,
        liked: false,
        likeCount
      };
    }

    const updateQuery = `
      UPDATE community_posts
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE post_id = $1
      RETURNING like_count;
    `;

    const { rows } = await client.query(
      updateQuery,
      [postId]
    );

    await client.query("COMMIT");

    return {
      alreadyUnliked: false,
      liked: false,
      likeCount: rows[0].like_count
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}