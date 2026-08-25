import asyncHandler from "../../utils/asyncHandler.js";

import {
  requestJournalPinReset,
  verifyJournalPinResetOtp,
  completeJournalPinReset
} from "../../services/journal/journalSecurityOtp.service.js";

/*
|--------------------------------------------------------------------------
| Request Journal PIN reset OTP
|--------------------------------------------------------------------------
| POST /api/journal/security/pin/forgot
|
| Email is obtained from the authenticated user's account.
*/

export const requestJournalPinResetController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      await requestJournalPinReset(
        userId
      );

      res.status(200).json({
        success: true,
        message:
          "Journal PIN reset OTP has been sent to your registered email address",
        data: {}
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Verify Journal PIN reset OTP
|--------------------------------------------------------------------------
| POST /api/journal/security/pin/reset/verify
*/

export const verifyJournalPinResetOtpController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const { otp } =
        req.body;

      const verificationResult =
        await verifyJournalPinResetOtp({
          userId,
          otp
        });

      res.status(200).json({
        success: true,
        message:
          "Journal PIN reset OTP verified successfully",
        data: {
          resetToken:
            verificationResult
              .resetToken,

          expiresInMinutes:
            verificationResult
              .expiresInMinutes
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Complete Journal PIN reset
|--------------------------------------------------------------------------
| POST /api/journal/security/pin/reset
*/

export const completeJournalPinResetController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        resetToken,
        newPin
      } = req.body;

      const securityStatus =
        await completeJournalPinReset({
          userId,
          resetToken,
          newPin
        });

      res.status(200).json({
        success: true,
        message:
          "Journal PIN reset successfully. Please unlock the Journal using your new PIN",
        data: {
          security:
            securityStatus
        }
      });
    }
  );