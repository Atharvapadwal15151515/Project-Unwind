import pool from "../../config/database.js";

export async function createCommentLike({
  commentId,
  userId,
  client = pool
}) {
  const query = `
    INSERT INTO comment_likes (
      comment_id,
      user_id
    )
    VALUES ($1, $2)
    ON CONFLICT (user_id, comment_id)
    DO NOTHING
    RETURNING
      comment_like_id,
      comment_id,
      user_id,
      created_at;
  `;

  const { rows } = await client.query(query, [
    commentId,
    userId
  ]);

  return rows[0] ?? null;
}

export async function findCommentLike({
  commentId,
  userId,
  client = pool
}) {
  const query = `
    SELECT
      comment_like_id,
      comment_id,
      user_id,
      created_at
    FROM comment_likes
    WHERE comment_id = $1
      AND user_id = $2
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [
    commentId,
    userId
  ]);

  return rows[0] ?? null;
}

export async function deleteCommentLike({
  commentId,
  userId,
  client = pool
}) {
  const query = `
    DELETE FROM comment_likes
    WHERE comment_id = $1
      AND user_id = $2
    RETURNING
      comment_like_id,
      comment_id,
      user_id,
      created_at;
  `;

  const { rows } = await client.query(query, [
    commentId,
    userId
  ]);

  return rows[0] ?? null;
}

export async function countCommentLikes({
  commentId,
  client = pool
}) {
  const query = `
    SELECT COUNT(*)::INTEGER AS like_count
    FROM comment_likes
    WHERE comment_id = $1;
  `;

  const { rows } = await client.query(query, [
    commentId
  ]);

  return rows[0]?.like_count ?? 0;
}

export async function findLikesByCommentId({
  commentId,
  limit = 20,
  offset = 0,
  client = pool
}) {
  const query = `
    SELECT
      cl.comment_like_id,
      cl.comment_id,
      cl.user_id,
      cl.created_at
    FROM comment_likes cl
    WHERE cl.comment_id = $1
    ORDER BY cl.created_at DESC
    LIMIT $2
    OFFSET $3;
  `;

  const { rows } = await client.query(query, [
    commentId,
    limit,
    offset
  ]);

  return rows;
}