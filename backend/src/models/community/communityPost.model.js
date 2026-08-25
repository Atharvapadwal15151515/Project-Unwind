import pool from "../../config/database.js";

export async function createCommunityPost({
  authorUserId,
  authorVisibleName,
  authorIdentityMode,
  caption,
  postType,
  visibility,
  commentsEnabled
}) {
  const query = `
    INSERT INTO community_posts (
      author_user_id,
      author_visible_name,
      author_identity_mode,
      caption,
      post_type,
      visibility,
      comments_enabled
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [
    authorUserId,
    authorVisibleName,
    authorIdentityMode,
    caption ?? null,
    postType,
    visibility,
    commentsEnabled
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
}

export async function findCommunityPostByIdForUser(
  postId,
  userId
) {
  const query = `
    SELECT
      cp.*,

      CASE
        WHEN cp.author_identity_mode = 'username'
        THEN up.profile_image_url
        ELSE NULL
      END AS author_profile_image_url,

      EXISTS (
        SELECT 1
        FROM post_likes pl
        WHERE pl.post_id = cp.post_id
          AND pl.user_id = $2
      ) AS liked_by_current_user,

      COALESCE(
        json_agg(
          json_build_object(
            'media_id',
              pm.media_id,

            'media_type',
              pm.media_type,

            'media_url',
              pm.media_url,

            'thumbnail_url',
              pm.thumbnail_url,

            'width',
              pm.width,

            'height',
              pm.height,

            'duration_seconds',
              pm.duration_seconds,

            'display_order',
              pm.display_order
          )
          ORDER BY pm.display_order
        )
        FILTER (
          WHERE pm.media_id IS NOT NULL
        ),
        '[]'::json
      ) AS media

    FROM community_posts cp

    LEFT JOIN post_media pm
      ON pm.post_id = cp.post_id

    LEFT JOIN user_profiles up
      ON up.user_id = cp.author_user_id

    WHERE cp.post_id = $1

      AND cp.is_deleted = FALSE

      AND (
        cp.visibility = 'community'
        OR cp.author_user_id = $2
      )

      AND (
        cp.author_user_id = $2

        OR NOT EXISTS (
          SELECT 1
          FROM user_restrictions ur

          WHERE ur.user_id =
            cp.author_user_id

            AND ur.restriction_type =
              'shadow_ban'

            AND ur.is_active = TRUE

            AND ur.starts_at <= NOW()

            AND (
              ur.expires_at IS NULL
              OR ur.expires_at > NOW()
            )
        )
      )

    GROUP BY
      cp.post_id,
      up.profile_image_url

    LIMIT 1;
  `;

  const result =
    await pool.query(
      query,
      [
        postId,
        userId
      ]
    );

  return result.rows[0] ?? null;
}

export async function findCommunityFeed({
  userId,
  limit,
  offset,
  postType
}) {
  const values = [
    userId,
    limit,
    offset
  ];

  let postTypeCondition = "";

  if (postType) {
    values.push(postType);

    postTypeCondition =
      `AND cp.post_type = $4`;
  }

  const query = `
    SELECT
      cp.*,

      CASE
        WHEN cp.author_identity_mode = 'username'
        THEN up.profile_image_url
        ELSE NULL
      END AS author_profile_image_url,

      EXISTS (
        SELECT 1
        FROM post_likes pl
        WHERE pl.post_id = cp.post_id
          AND pl.user_id = $1
      ) AS liked_by_current_user,

      COALESCE(
        json_agg(
          json_build_object(
            'media_id',
              pm.media_id,

            'media_type',
              pm.media_type,

            'media_url',
              pm.media_url,

            'thumbnail_url',
              pm.thumbnail_url,

            'width',
              pm.width,

            'height',
              pm.height,

            'duration_seconds',
              pm.duration_seconds,

            'display_order',
              pm.display_order
          )
          ORDER BY pm.display_order
        )
        FILTER (
          WHERE pm.media_id IS NOT NULL
        ),
        '[]'::json
      ) AS media

    FROM community_posts cp

    LEFT JOIN post_media pm
      ON pm.post_id = cp.post_id

    LEFT JOIN user_profiles up
      ON up.user_id = cp.author_user_id

    WHERE cp.is_deleted = FALSE

      AND cp.visibility = 'community'

      AND (
        cp.author_user_id = $1

        OR NOT EXISTS (
          SELECT 1

          FROM user_restrictions ur

          WHERE ur.user_id =
            cp.author_user_id

            AND ur.restriction_type =
              'shadow_ban'

            AND ur.is_active = TRUE

            AND ur.starts_at <= NOW()

            AND (
              ur.expires_at IS NULL
              OR ur.expires_at > NOW()
            )
        )
      )

      ${postTypeCondition}

    GROUP BY
      cp.post_id,
      up.profile_image_url

    ORDER BY
      cp.created_at DESC

    LIMIT $2
    OFFSET $3;
  `;

  const result =
    await pool.query(
      query,
      values
    );

  return result.rows;
}

export async function countCommunityFeed({
  userId,
  postType
}) {
  const values = [
    userId
  ];

  let postTypeCondition = "";

  if (postType) {
    values.push(postType);

    postTypeCondition =
      `AND cp.post_type = $2`;
  }

  const query = `
    SELECT
      COUNT(*)::INTEGER AS total

    FROM community_posts cp

    WHERE cp.is_deleted = FALSE

      AND cp.visibility = 'community'

      AND (
        cp.author_user_id = $1

        OR NOT EXISTS (
          SELECT 1

          FROM user_restrictions ur

          WHERE ur.user_id =
            cp.author_user_id

            AND ur.restriction_type =
              'shadow_ban'

            AND ur.is_active = TRUE

            AND ur.starts_at <= NOW()

            AND (
              ur.expires_at IS NULL
              OR ur.expires_at > NOW()
            )
        )
      )

      ${postTypeCondition};
  `;

  const result =
    await pool.query(
      query,
      values
    );

  return result.rows[0].total;
}

export async function updateCommunityPost({
  postId,
  userId,
  caption,
  visibility,
  commentsEnabled
}) {
  const query = `
    UPDATE community_posts
    SET
      caption = CASE
        WHEN $3::BOOLEAN = TRUE THEN $4
        ELSE caption
      END,

      visibility = COALESCE($5, visibility),

      comments_enabled = COALESCE($6, comments_enabled),

      is_edited = TRUE,
      edited_at = NOW(),
      updated_at = NOW()

    WHERE post_id = $1
      AND author_user_id = $2
      AND is_deleted = FALSE

    RETURNING *;
  `;

  const captionWasProvided = caption !== undefined;

  const result = await pool.query(query, [
    postId,
    userId,
    captionWasProvided,
    caption ?? null,
    visibility ?? null,
    commentsEnabled ?? null
  ]);

  return result.rows[0] ?? null;
}

export async function softDeleteCommunityPost({
  postId,
  userId
}) {
  const query = `
    UPDATE community_posts
    SET
      is_deleted = TRUE,
      deleted_at = NOW(),
      deleted_by = 'author',
      updated_at = NOW()

    WHERE post_id = $1
      AND author_user_id = $2
      AND is_deleted = FALSE

    RETURNING *;
  `;

  const result = await pool.query(query, [postId, userId]);

  return result.rows[0] ?? null;
}

export async function findPostsByUserId({
  authorUserId,
  currentUserId,
  limit,
  offset
}) {
  const query = `
    SELECT
      cp.*,

      EXISTS (
        SELECT 1
        FROM post_likes pl

        WHERE pl.post_id = cp.post_id
          AND pl.user_id = $2
      ) AS liked_by_current_user

    FROM community_posts cp

    WHERE cp.author_user_id = $1

      AND cp.is_deleted = FALSE

      AND (
        cp.visibility = 'community'
        OR cp.author_user_id = $2
      )

      AND (
        cp.author_user_id = $2

        OR NOT EXISTS (
          SELECT 1

          FROM user_restrictions ur

          WHERE ur.user_id =
            cp.author_user_id

            AND ur.restriction_type =
              'shadow_ban'

            AND ur.is_active = TRUE

            AND ur.starts_at <= NOW()

            AND (
              ur.expires_at IS NULL
              OR ur.expires_at > NOW()
            )
        )
      )

    ORDER BY
      cp.created_at DESC

    LIMIT $3
    OFFSET $4;
  `;

  const result =
    await pool.query(
      query,
      [
        authorUserId,
        currentUserId,
        limit,
        offset
      ]
    );

  return result.rows;
}