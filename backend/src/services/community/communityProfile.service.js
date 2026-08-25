import {
  createCommunityProfile,
  findCommunityProfileByAlias,
  findCommunityProfileByUserId,
  updateIdentityMode
} from "../../models/community/communityProfile.model.js";

import {
  generateAnonymousAlias
} from "../../utils/generateAnonymousAlias.js";

import AppError from "../../utils/AppError.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeAnonymousAlias(
  value
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const trimmed =
    String(value).trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

async function ensureAnonymousAliasAvailable({
  anonymousAlias,
  currentUserId
}) {
  const existingProfile =
    await findCommunityProfileByAlias(
      anonymousAlias
    );

  if (!existingProfile) {
    return;
  }

  if (
    String(
      existingProfile.user_id
    ) ===
    String(currentUserId)
  ) {
    return;
  }

  throw new AppError(
    "That anonymous username is already being used. Please choose another one.",
    409
  );
}

async function createUniqueAnonymousAlias() {
  let anonymousAlias;
  let aliasExists = true;
  let attempts = 0;

  while (
    aliasExists &&
    attempts < 10
  ) {
    anonymousAlias =
      generateAnonymousAlias();

    const existingProfile =
      await findCommunityProfileByAlias(
        anonymousAlias
      );

    aliasExists =
      Boolean(existingProfile);

    attempts += 1;
  }

  if (aliasExists) {
    throw new AppError(
      "Could not generate a unique anonymous alias. Please try again.",
      500
    );
  }

  return anonymousAlias;
}

/*
|--------------------------------------------------------------------------
| Select / switch community identity
|--------------------------------------------------------------------------
*/

export async function selectCommunityIdentity({
  userId,
  username,
  identityMode,
  anonymousAlias:
    requestedAnonymousAlias
}) {
  if (!userId) {
    throw new AppError(
      "Authenticated user ID is required",
      401
    );
  }

  if (
    ![
      "username",
      "anonymous"
    ].includes(identityMode)
  ) {
    throw new AppError(
      "Identity mode must be either username or anonymous",
      400
    );
  }

  const existingProfile =
    await findCommunityProfileByUserId(
      userId
    );

  if (
    existingProfile?.is_suspended
  ) {
    throw new AppError(
      "Your community profile has been suspended",
      403
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Existing profile
  |--------------------------------------------------------------------------
  */

  if (existingProfile) {
    let anonymousAlias =
      existingProfile.anonymous_alias;

    if (
      identityMode ===
      "anonymous"
    ) {
      const customAlias =
        normalizeAnonymousAlias(
          requestedAnonymousAlias
        );

      /*
       * If user explicitly entered
       * an anonymous username,
       * use it.
       */
      if (customAlias) {
        await ensureAnonymousAliasAvailable(
          {
            anonymousAlias:
              customAlias,
            currentUserId:
              userId
          }
        );

        anonymousAlias =
          customAlias;
      }

      /*
       * If no custom alias was sent
       * and this account does not
       * already have an alias,
       * generate one automatically.
       */
      if (!anonymousAlias) {
        anonymousAlias =
          await createUniqueAnonymousAlias();
      }
    }

    const updatedProfile =
      await updateIdentityMode({
        userId,
        identityMode,
        displayName:
          username,
        anonymousAlias
      });

    return {
      profile:
        updatedProfile,

      visibleName:
        identityMode ===
        "anonymous"
          ? updatedProfile
              .anonymous_alias
          : updatedProfile
              .display_name
    };
  }

  /*
  |--------------------------------------------------------------------------
  | First community setup
  |--------------------------------------------------------------------------
  */

  let anonymousAlias =
    normalizeAnonymousAlias(
      requestedAnonymousAlias
    );

  if (anonymousAlias) {
    await ensureAnonymousAliasAvailable(
      {
        anonymousAlias,
        currentUserId:
          userId
      }
    );
  }

  if (!anonymousAlias) {
    anonymousAlias =
      await createUniqueAnonymousAlias();
  }

  const profile =
    await createCommunityProfile({
      userId,
      displayName:
        username,
      anonymousAlias,
      identityMode
    });

  return {
    profile,

    visibleName:
      identityMode ===
      "anonymous"
        ? profile.anonymous_alias
        : profile.display_name
  };
}

/*
|--------------------------------------------------------------------------
| Get profile
|--------------------------------------------------------------------------
*/

export async function getCommunityProfile(
  userId
) {
  if (!userId) {
    throw new AppError(
      "Authenticated user ID is required",
      401
    );
  }

  const profile =
    await findCommunityProfileByUserId(
      userId
    );

  if (!profile) {
    throw new AppError(
      "Community profile not found",
      404
    );
  }

  return {
    profile,

    visibleName:
      profile.identity_mode ===
      "anonymous"
        ? profile.anonymous_alias
        : profile.display_name
  };
}