import {
  findProfileByUserId,
  updateProfile
} from "../models/profile.model.js";

import {
  findUserById,
  findUserByUsername,
  updateUsername
} from "../models/user.model.js";

import AppError from "../utils/AppError.js";

export async function updateUserProfile({
  userId,
  username,
  fullName,
  displayName,
  dateOfBirth,
  gender,
  occupationType
}) {
  const existingProfile =
    await findProfileByUserId(
      userId
    );

  if (!existingProfile) {
    throw new AppError(
      "Profile not found",
      404
    );
  }

  const existingUser =
    await findUserById(
      userId
    );

  if (!existingUser) {
    throw new AppError(
      "User not found",
      404
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Username update
  |--------------------------------------------------------------------------
  */

  if (
    username !== undefined
  ) {
    const normalizedUsername =
      username.trim();

    const usernameChanged =
      normalizedUsername.toLowerCase() !==
      String(
        existingUser.username ||
          ""
      ).toLowerCase();

    if (usernameChanged) {
      const userWithUsername =
        await findUserByUsername(
          normalizedUsername
        );

      if (
        userWithUsername &&
        userWithUsername.user_id !==
          userId
      ) {
        throw new AppError(
          "This username is already taken",
          409
        );
      }

      try {
        await updateUsername(
          userId,
          normalizedUsername
        );
      } catch (error) {
        /*
         * PostgreSQL unique constraint fallback.
         * This protects against two users trying
         * to claim the same username simultaneously.
         */
        if (
          error?.code ===
          "23505"
        ) {
          throw new AppError(
            "This username is already taken",
            409
          );
        }

        throw error;
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Profile information update
  |--------------------------------------------------------------------------
  */

  const updates = {};

  if (
    fullName !== undefined
  ) {
    updates.fullName =
      fullName.trim();
  }

  if (
    displayName !== undefined
  ) {
    updates.displayName =
      displayName === null
        ? null
        : displayName.trim();
  }

  if (
    dateOfBirth !== undefined
  ) {
    updates.dateOfBirth =
      dateOfBirth;
  }

  if (
    gender !== undefined
  ) {
    updates.gender =
      gender;
  }

  if (
    occupationType !==
    undefined
  ) {
    updates.occupationType =
      occupationType;
  }

  const profile =
    await updateProfile(
      userId,
      updates
    );

  /*
  |--------------------------------------------------------------------------
  | Return latest account information too
  |--------------------------------------------------------------------------
  */

  const updatedUser =
    await findUserById(
      userId
    );

  return {
    profile,
    user: {
      user_id:
        updatedUser.user_id,

      email:
        updatedUser.email,

      username:
        updatedUser.username,

      role:
        updatedUser.role,

      account_status:
        updatedUser.account_status,

      email_verified:
        updatedUser.email_verified
    }
  };
}

export async function getUserProfile(
  userId
) {
  const profile =
    await findProfileByUserId(
      userId
    );

  if (!profile) {
    throw new AppError(
      "Profile not found",
      404
    );
  }

  return profile;
}