import pool from "../../config/database.js";

export async function createPostMedia({
  postId,
  mediaType,
  mediaUrl,
  cloudinaryPublicId,
  thumbnailUrl = null,
  fileSizeBytes = null,
  width = null,
  height = null,
  durationSeconds = null,
  displayOrder = 1
}) {
  const query = `
    INSERT INTO post_media (
      post_id,
      media_type,
      media_url,
      cloudinary_public_id,
      thumbnail_url,
      file_size_bytes,
      width,
      height,
      duration_seconds,
      display_order
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10
    )
    RETURNING *;
  `;

  const values = [
    postId,
    mediaType,
    mediaUrl,
    cloudinaryPublicId,
    thumbnailUrl,
    fileSizeBytes,
    width,
    height,
    durationSeconds,
    displayOrder
  ];

  const { rows } = await pool.query(query, values);

  return rows[0];
}

export async function createMultiplePostMedia(mediaItems) {
  if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
    return [];
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const createdMedia = [];

    for (const mediaItem of mediaItems) {
      const query = `
        INSERT INTO post_media (
          post_id,
          media_type,
          media_url,
          cloudinary_public_id,
          thumbnail_url,
          file_size_bytes,
          width,
          height,
          duration_seconds,
          display_order
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10
        )
        RETURNING *;
      `;

      const values = [
        mediaItem.postId,
        mediaItem.mediaType,
        mediaItem.mediaUrl,
        mediaItem.cloudinaryPublicId,
        mediaItem.thumbnailUrl ?? null,
        mediaItem.fileSizeBytes ?? null,
        mediaItem.width ?? null,
        mediaItem.height ?? null,
        mediaItem.durationSeconds ?? null,
        mediaItem.displayOrder
      ];

      const { rows } = await client.query(query, values);

      createdMedia.push(rows[0]);
    }

    await client.query("COMMIT");

    return createdMedia;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findMediaByPostId(postId) {
  const query = `
    SELECT *
    FROM post_media
    WHERE post_id = $1
    ORDER BY display_order ASC, created_at ASC;
  `;

  const { rows } = await pool.query(query, [postId]);

  return rows;
}

export async function findPostMediaById(mediaId) {
  const query = `
    SELECT *
    FROM post_media
    WHERE media_id = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [mediaId]);

  return rows[0] ?? null;
}

export async function deletePostMediaById(mediaId) {
  const query = `
    DELETE FROM post_media
    WHERE media_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [mediaId]);

  return rows[0] ?? null;
}

export async function deletePostMediaByPostId(postId) {
  const query = `
    DELETE FROM post_media
    WHERE post_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [postId]);

  return rows;
}

export async function updatePostMediaDisplayOrder({
  mediaId,
  displayOrder
}) {
  const query = `
    UPDATE post_media
    SET display_order = $2
    WHERE media_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    mediaId,
    displayOrder
  ]);

  return rows[0] ?? null;
}