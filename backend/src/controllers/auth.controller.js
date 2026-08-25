import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  logoutUserFromAllDevices,
  getAuthenticatedUser,
  verifyEmailWithOTP,
  verifyEmailWithLink,
  resendEmailVerification
} from "../services/auth.service.js";

import {
  sendRefreshTokenCookie,
  clearRefreshTokenCookie
} from "../utils/sendCookie.js";

import {
  uploadImageBuffer,
  deleteCloudinaryImage
} from "../services/cloudinary.service.js";

import {
  getUserProfile
} from "../services/profile.service.js";

import {
  updateProfileImage
} from "../models/profile.model.js";

/**
 * POST /api/auth/register
 */
/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  let uploadedImagePublicId = null;

  try {
    const result = await registerUser({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      fullName: req.body.fullName,
      displayName: req.body.displayName,
      dateOfBirth:
        req.body.dateOfBirth || null,
      gender:
        req.body.gender || null,
      occupationType:
        req.body.occupationType || null
    });

    /*
    |--------------------------------------------------------------------------
    | Resolve the newly created user's ID
    |--------------------------------------------------------------------------
    |
    | Keep the property matching the object returned by registerUser().
    | These fallbacks make the controller work with common result structures.
    |
    */

    const createdUserId =
      result?.user?.user_id ||
      result?.user?.userId ||
      result?.user_id ||
      result?.userId ||
      result?.profile?.user_id ||
      result?.profile?.userId;

    let updatedProfile = null;
    let profileImageWarning = null;

    /*
    |--------------------------------------------------------------------------
    | Optional Profile Image Upload
    |--------------------------------------------------------------------------
    */

    if (req.file) {
      if (!createdUserId) {
        profileImageWarning =
          "Account created, but the profile picture could not be attached because the created user ID was unavailable.";
      } else {
        try {
          const uploadResult =
            await uploadImageBuffer(
              req.file.buffer,
              {
                publicId: `user-${createdUserId}`
              }
            );

          uploadedImagePublicId =
            uploadResult.public_id;

          updatedProfile =
            await updateProfileImage({
              userId: createdUserId,
              profileImageUrl:
                uploadResult.secure_url,
              profileImagePublicId:
                uploadResult.public_id
            });
        } catch (imageError) {
          /*
          |--------------------------------------------------------------------------
          | Remove Cloudinary image if DB update failed
          |--------------------------------------------------------------------------
          */

          if (uploadedImagePublicId) {
            try {
              await deleteCloudinaryImage(
                uploadedImagePublicId
              );
            } catch (cleanupError) {
              console.error(
                "Unable to clean up registration profile image:",
                cleanupError
              );
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Do not destroy a successfully created account because an optional
          | profile image failed.
          |--------------------------------------------------------------------------
          */

          console.error(
            "Registration profile image upload failed:",
            imageError
          );

          profileImageWarning =
            "Your account was created, but the profile picture could not be saved. You can upload it later from your profile.";
        }
      }
    }

    return res.status(201).json({
      success: true,
      message:
        "Account created. Check your email for the verification OTP or link.",
      data: {
        ...result,
        ...(updatedProfile
          ? {
              profile: updatedProfile
            }
          : {}),
        ...(profileImageWarning
          ? {
              warning: profileImageWarning
            }
          : {})
      }
    });
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Clean up an uploaded image if registration later fails
    |--------------------------------------------------------------------------
    */

    if (uploadedImagePublicId) {
      try {
        await deleteCloudinaryImage(
          uploadedImagePublicId
        );
      } catch (cleanupError) {
        console.error(
          "Unable to clean up failed registration image:",
          cleanupError
        );
      }
    }

    next(error);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(
  req,
  res,
  next
) {
  try {
    const {
      identifier,
      password,
      deviceName = null,
      browser = null,
      operatingSystem = null,
      rememberMe = false
    } = req.body || {};

    const shouldRemember =
      rememberMe === true ||
      rememberMe === "true";

    const result =
      await loginUser({
        identifier,
        password,
        deviceName,
        browser,
        operatingSystem,

        ipAddress:
          req.ip || null,

        userAgent:
          req.get(
            "user-agent"
          ) || null,

        rememberMe:
          shouldRemember
      });

    sendRefreshTokenCookie(
      res,
      result.refreshToken,
      shouldRemember
    );

    return res.status(200).json({
      success: true,
      message:
        "Login successful",

      data: {
        user:
          result.user,

        accessToken:
          result.accessToken,

        sessionId:
          result.sessionId,

        rememberMe:
          shouldRemember
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 */
export async function refreshToken(
  req,
  res,
  next
) {
  try {
    const currentRefreshToken =
      req.cookies?.refreshToken;

    const result =
      await refreshUserSession(
        currentRefreshToken
      );

    sendRefreshTokenCookie(
      res,
      result.refreshToken,
      result.rememberMe
    );

    return res.status(200).json({
      success: true,
      message:
        "Session refreshed",

      data: {
        accessToken:
          result.accessToken
      }
    });

  } catch (error) {
    clearRefreshTokenCookie(
      res
    );

    next(error);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res, next) {
  try {
    const refreshToken =
      req.cookies?.refreshToken;

    await logoutUser(refreshToken);

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout-all
 */
export async function logoutAllDevices(
  req,
  res,
  next
) {
  try {
    await logoutUserFromAllDevices(
      req.user.user_id
    );

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message:
        "Logged out from all devices successfully"
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 */
/**
 * GET /api/auth/me
 */
export async function getCurrentUser(
  req,
  res,
  next
) {
  try {
    const userId = req.user.user_id;

    const [
      user,
      profile
    ] = await Promise.all([
      getAuthenticatedUser(userId),
      getUserProfile(userId)
    ]);

    const completeUser = {
      ...user,

      full_name:
        profile?.full_name ??
        profile?.fullName ??
        null,

      display_name:
        profile?.display_name ??
        profile?.displayName ??
        null,

      date_of_birth:
        profile?.date_of_birth ??
        profile?.dateOfBirth ??
        null,

      gender:
        profile?.gender ??
        null,

      occupation_type:
        profile?.occupation_type ??
        profile?.occupationType ??
        null,

      profile_image_url:
        profile?.profile_image_url ??
        profile?.profileImageUrl ??
        null
    };

    return res.status(200).json({
      success: true,
      data: {
        user: completeUser
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-email-otp
 */
export async function verifyEmailOTP(
  req,
  res,
  next
) {
  try {
    const result = await verifyEmailWithOTP({
      email: req.body.email,
      otp: req.body.otp
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyVerified
        ? "Email is already verified"
        : "Email verified successfully",
      data: {
        user: result.user
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-email-link
 */
export async function verifyEmailLink(
  req,
  res,
  next
) {
  try {
    const result = await verifyEmailWithLink({
      userId: req.body.userId,
      token: req.body.token
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyVerified
        ? "Email is already verified"
        : "Email verified successfully",
      data: {
        user: result.user
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/resend-verification
 */
export async function resendVerification(
  req,
  res,
  next
) {
  try {
    await resendEmailVerification(
      req.body.email
    );

    return res.status(200).json({
      success: true,
      message:
        "If an unverified account exists, a new verification email has been sent."
    });
  } catch (error) {
    next(error);
  }
}