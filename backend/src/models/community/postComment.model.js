import pool from "../../config/database.js";

export async function createPostComment({
  postId,
  authorUserId,
  authorVisibleName,
  authorIdentityMode,
  parentCommentId = null,
  commentText,
  client = pool
}) {
  const query = `
    INSERT INTO post_comments (
      post_id,
      author_user_id,
      author_visible_name,
      author_identity_mode,
      parent_comment_id,
      comment_text
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      comment_id,
      post_id,
      author_user_id,
      author_visible_name,
      author_identity_mode,
      parent_comment_id,
      comment_text,
      is_edited,
      edited_at,
      is_deleted,
      deleted_at,
      deleted_by,
      created_at,
      updated_at;
  `;

  const { rows } = await client.query(query, [
    postId,
    authorUserId,
    authorVisibleName,
    authorIdentityMode,
    parentCommentId,
    commentText
  ]);

  return rows[0];
}

export async function findPostCommentById({
  commentId,
  client = pool
}) {
  const query = `
    SELECT
      comment_id,
      post_id,
      author_user_id,
      author_visible_name,
      author_identity_mode,
      parent_comment_id,
      comment_text,
      is_edited,
      edited_at,
      is_deleted,
      deleted_at,
      deleted_by,
      created_at,
      updated_at
    FROM post_comments
    WHERE comment_id = $1
    LIMIT 1;
  `;

  const { rows } = await client.query(query, [
    commentId
  ]);

  return rows[0] ?? null;
}

export async function findPostComments({
  postId,
  userId,
  limit = 20,
  offset = 0,
  client = pool
}) {
  const query = `
    SELECT
      pc.comment_id,
      pc.post_id,
      pc.author_user_id,
      pc.author_visible_name,
      pc.author_identity_mode,
      pc.parent_comment_id,
      pc.comment_text,
      pc.is_edited,
      pc.edited_at,
      pc.is_deleted,
      pc.deleted_at,
      pc.deleted_by,
      pc.created_at,
      pc.updated_at,

      COALESCE(pc.like_count, 0)::INTEGER
        AS like_count,

      EXISTS (
        SELECT 1
        FROM comment_likes cl
        WHERE cl.comment_id = pc.comment_id
          AND cl.user_id = $2
      ) AS is_liked,

      (
        SELECT COUNT(*)::INTEGER
        FROM post_comments replies
        WHERE replies.parent_comment_id = pc.comment_id
          AND replies.is_deleted = false
      ) AS reply_count

    FROM post_comments pc
    WHERE pc.post_id = $1
      AND pc.parent_comment_id IS NULL
      AND pc.is_deleted = false
    ORDER BY pc.created_at ASC
    LIMIT $3
    OFFSET $4;
  `;

  const { rows } = await client.query(query, [
    postId,
    userId,
    limit,
    offset
  ]);

  return rows;
}

export async function findCommentReplies({
  parentCommentId,
  userId,
  limit = 20,
  offset = 0,
  client = pool
}) {
  const query = `
    SELECT
      pc.comment_id,
      pc.post_id,
      pc.author_user_id,
      pc.author_visible_name,
      pc.author_identity_mode,
      pc.parent_comment_id,
      pc.comment_text,
      pc.is_edited,
      pc.edited_at,
      pc.is_deleted,
      pc.deleted_at,
      pc.deleted_by,
      pc.created_at,
      pc.updated_at,

      COALESCE(pc.like_count, 0)::INTEGER
        AS like_count,

      EXISTS (
        SELECT 1
        FROM comment_likes cl
        WHERE cl.comment_id = pc.comment_id
          AND cl.user_id = $2
      ) AS is_liked

    FROM post_comments pc
    WHERE pc.parent_comment_id = $1
    AND pc.is_deleted = false
    ORDER BY pc.created_at ASC
    LIMIT $3
    OFFSET $4;
  `;

  const { rows } = await client.query(query, [
    parentCommentId,
    userId,
    limit,
    offset
  ]);

  return rows;
}

export async function countPostComments({
  postId,
  client = pool
}) {
  const query = `
    SELECT COUNT(*)::INTEGER AS comment_count
    FROM post_comments
    WHERE post_id = $1
      AND is_deleted = false;
  `;

  const { rows } = await client.query(query, [
    postId
  ]);

  return rows[0]?.comment_count ?? 0;
}

export async function updatePostComment({
  commentId,
  authorUserId,
  commentText,
  client = pool
}) {
  const query = `
    UPDATE post_comments
    SET
      comment_text = $3,
      is_edited = true,
      edited_at = now(),
      updated_at = now()
    WHERE comment_id = $1
      AND author_user_id = $2
      AND is_deleted = false
    RETURNING
      comment_id,
      post_id,
      author_user_id,
      author_visible_name,
      author_identity_mode,
      parent_comment_id,
      comment_text,
      is_edited,
      edited_at,
      is_deleted,
      deleted_at,
      deleted_by,
      created_at,
      updated_at;
  `;

  const { rows } = await client.query(query, [
    commentId,
    authorUserId,
    commentText
  ]);

  return rows[0] ?? null;
}

export async function softDeletePostComment({
  commentId,
  authorUserId,
  deletedBy = "author",
  client = pool
}) {
  const query = `
    UPDATE post_comments
    SET
      comment_text = NULL,
      is_deleted = true,
      deleted_at = now(),
      deleted_by = $3,
      updated_at = now()
    WHERE comment_id = $1
      AND author_user_id = $2
      AND is_deleted = false
    RETURNING
      comment_id,
      post_id,
      author_user_id,
      author_visible_name,
      author_identity_mode,
      parent_comment_id,
      comment_text,
      is_edited,
      edited_at,
      is_deleted,
      deleted_at,
      deleted_by,
      created_at,
      updated_at;
  `;

  const { rows } = await client.query(query, [
    commentId,
    authorUserId,
    deletedBy
  ]);

  return rows[0] ?? null;
}