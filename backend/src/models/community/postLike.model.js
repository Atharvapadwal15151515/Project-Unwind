import pool from "../../config/database.js";

export async function createPostLike({
  postId,
  userId,
  client = pool
}) {
  const query = `
    INSERT INTO post_likes (
      post_id,
      user_id
    )
    VALUES ($1, $2)
    ON CONFLICT (post_id, user_id)
    DO NOTHING
    RETURNING
      post_like_id,
      post_id,
      user_id,
      created_at;
  `;

  const { rows } = await client.query(query, [
    postId,
    userId
  ]);

  return rows[0] ?? null;
}

export async function findPostLike({
  postId,
  userId,
  client = pool
}) {
  const query = `
    SELECT
      post_like_id,
      post_id,
      user_id,
      created_at
    FROM post_likes
    WHERE post_id = $1
      AND user_id = $2
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [
    postId,
    userId
  ]);

  return rows[0] ?? null;
}

export async function deletePostLike({
  postId,
  userId,
  client = pool
}) {
  const query = `
    DELETE FROM post_likes
    WHERE post_id = $1
      AND user_id = $2
    RETURNING
      post_like_id,
      post_id,
      user_id,
      created_at;
  `;

  const { rows } = await client.query(query, [
    postId,
    userId
  ]);

  return rows[0] ?? null;
}

export async function countPostLikes({
  postId,
  client = pool
}) {
  const query = `
    SELECT COUNT(*)::INTEGER AS like_count
    FROM post_likes
    WHERE post_id = $1;
  `;

  const { rows } = await client.query(query, [
    postId
  ]);

  return rows[0]?.like_count ?? 0;
}

export async function findLikesByPostId({
  postId,
  limit = 20,
  offset = 0,
  client = pool
}) {
  const query = `
    SELECT
      pl.post_like_id,
      pl.post_id,
      pl.user_id,
      pl.created_at
    FROM post_likes pl
    WHERE pl.post_id = $1
    ORDER BY pl.created_at DESC
    LIMIT $2
    OFFSET $3;
  `;

  const { rows } = await client.query(query, [
    postId,
    limit,
    offset
  ]);

  return rows;
}