import asyncHandler from "../../utils/asyncHandler.js";

import {
  getJournalSecurityStatus,
  createJournalPin,
  unlockJournal,
  changeJournalPin,
  disableJournalPin,
  lockJournal
} from "../../services/journal/journalSecurity.service.js";

/*
|--------------------------------------------------------------------------
| Get Journal security status
|--------------------------------------------------------------------------
| GET /api/journal/security/status
*/

export const getJournalSecurityStatusController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const securityStatus =
        await getJournalSecurityStatus(
          userId
        );

      res.status(200).json({
        success: true,
        message:
          "Journal security status retrieved successfully",
        data: {
          security:
            securityStatus
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Create Journal PIN
|--------------------------------------------------------------------------
| POST /api/journal/security/pin
*/

export const createJournalPinController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const { pin } =
        req.body;

      const securityStatus =
        await createJournalPin(
          userId,
          pin
        );

      res.status(201).json({
        success: true,
        message:
          "Journal PIN created successfully",
        data: {
          security:
            securityStatus
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Unlock Journal
|--------------------------------------------------------------------------
| POST /api/journal/security/unlock
*/

export const unlockJournalController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const { pin } =
        req.body;

      const unlockData =
        await unlockJournal(
          userId,
          pin
        );

      res.status(200).json({
        success: true,
        message:
          "Journal unlocked successfully",
        data: {
          journalUnlockToken:
            unlockData
              .journalUnlockToken,

          expiresAt:
            unlockData.expiresAt
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Change Journal PIN
|--------------------------------------------------------------------------
| PATCH /api/journal/security/pin
*/

export const changeJournalPinController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        currentPin,
        newPin
      } = req.body;

      const securityStatus =
        await changeJournalPin(
          userId,
          currentPin,
          newPin
        );

      res.status(200).json({
        success: true,
        message:
          "Journal PIN changed successfully. Please unlock the Journal again",
        data: {
          security:
            securityStatus
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Disable Journal PIN
|--------------------------------------------------------------------------
| DELETE /api/journal/security/pin
*/

export const disableJournalPinController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const {
        currentPin
      } = req.body;

      const securityStatus =
        await disableJournalPin(
          userId,
          currentPin
        );

      res.status(200).json({
        success: true,
        message:
          "Journal PIN security disabled successfully",
        data: {
          security:
            securityStatus
        }
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Lock Journal
|--------------------------------------------------------------------------
| POST /api/journal/security/lock
|
| requireJournalUnlock middleware verifies the unlock token and attaches:
|
| req.journalUnlockSession.unlockSessionId
*/

export const lockJournalController =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user.user_id;

      const unlockSessionId =
        req.journalUnlockSession
          ?.unlockSessionId;

      const lockResult =
        await lockJournal(
          userId,
          unlockSessionId
        );

      res.status(200).json({
        success: true,
        message:
          "Journal locked successfully",
        data: {
          isLocked:
            lockResult.isLocked
        }
      });
    }
  );