import {
  validateVerifyAccountDeletionOtp,
  validateDeleteAccount
} from "../validators/account.validator.js";

import {
  requestAccountDeletionOtp,
  verifyAccountDeletionOtp,
  deleteAccount
} from "../services/account.service.js";

import {
  clearRefreshTokenCookie
} from "../utils/sendCookie.js";


/*
|--------------------------------------------------------------------------
| Request Account Deletion OTP
|--------------------------------------------------------------------------
*/

export async function requestAccountDeletionOtpController(
  req,
  res,
  next
) {
  try {
    const result =
      await requestAccountDeletionOtp(
        req.user.user_id
      );

    return res.status(200).json({
      success: true,
      message:
        "Verification code sent to your registered email",
      expiresInMinutes:
        result.expiresInMinutes
    });
  } catch (error) {
    next(error);
  }
}


/*
|--------------------------------------------------------------------------
| Verify Account Deletion OTP
|--------------------------------------------------------------------------
*/

export async function verifyAccountDeletionOtpController(
  req,
  res,
  next
) {
  try {
    const {
      otp
    } =
      validateVerifyAccountDeletionOtp(
        req.body
      );

    const result =
      await verifyAccountDeletionOtp({
        userId: req.user.user_id,
        otp
      });

    return res.status(200).json({
      success: true,
      message:
        "Email verified successfully",
      deletionToken:
        result.deletionToken,
      expiresInMinutes:
        result.expiresInMinutes
    });
  } catch (error) {
    next(error);
  }
}


/*
|--------------------------------------------------------------------------
| Permanently Delete Account
|--------------------------------------------------------------------------
*/

export async function deleteAccountController(
  req,
  res,
  next
) {
  try {
    const {
      confirmation,
      deletionToken
    } =
      validateDeleteAccount(
        req.body
      );

    await deleteAccount({
      userId: req.user.user_id,
      confirmation,
      deletionToken
    });

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      message:
        "Account deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}