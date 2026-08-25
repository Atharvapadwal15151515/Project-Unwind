import {
  requestPasswordReset,
  resetPasswordUsingOTP,
  resetPasswordUsingLink,
  changeUserPassword
} from "../services/password.service.js";

import {
  clearRefreshTokenCookie
} from "../utils/sendCookie.js";

/**
 * POST /api/password/forgot
 */
export async function forgotPassword(
  req,
  res,
  next
) {
  try {
    await requestPasswordReset(req.body.email);

    return res.status(200).json({
      success: true,
      message:
        "If an account exists for this email, a password reset email has been sent."
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/password/reset-otp
 */
export async function resetWithOTP(
  req,
  res,
  next
) {
  try {
    await resetPasswordUsingOTP({
      email: req.body.email,
      otp: req.body.otp,
      newPassword: req.body.newPassword
    });

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please log in again."
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/password/reset-link
 */
export async function resetWithLink(
  req,
  res,
  next
) {
  try {
    await resetPasswordUsingLink({
      userId: req.body.userId,
      token: req.body.token,
      newPassword: req.body.newPassword
    });

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please log in again."
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/password/change
 */
export async function changePassword(
  req,
  res,
  next
) {
  try {
    await changeUserPassword({
      userId: req.user.user_id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword
    });

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please log in again."
    });
  } catch (error) {
    next(error);
  }
}