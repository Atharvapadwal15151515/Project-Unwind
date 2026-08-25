import pool from "../../config/database.js";

import {
  getCommunityProfile,
  selectCommunityIdentity
} from "../../services/community/communityProfile.service.js";

async function getUsernameByUserId(
  userId
) {
  const query = `
    SELECT username
    FROM users
    WHERE user_id = $1
    LIMIT 1
  `;

  const {
    rows
  } = await pool.query(
    query,
    [userId]
  );

  return (
    rows[0]?.username ||
    null
  );
}

export async function selectIdentity(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user?.user_id;

    const {
      identity_mode:
        identityMode,

      anonymous_alias:
        anonymousAlias
    } = req.body;

    const username =
      await getUsernameByUserId(
        userId
      );

    if (!username) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "User account not found"
        });
    }

    const result =
      await selectCommunityIdentity(
        {
          userId,
          username,
          identityMode,
          anonymousAlias
        }
      );

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Community identity selected successfully",

        data: result
      });
  } catch (error) {
    next(error);
  }
}

export async function getMyCommunityProfile(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user?.user_id;

    const result =
      await getCommunityProfile(
        userId
      );

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Community profile fetched successfully",

        data: result
      });
  } catch (error) {
    next(error);
  }
}