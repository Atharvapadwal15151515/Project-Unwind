import express from "express";

import {
  authenticate
} from "../../middleware/authenticate.js";

import {
  validate
} from "../../middleware/validate.js";

import {
  authLimiter,
  otpLimiter
} from "../../middleware/rateLimiter.js";

import {
  getJournalSecurityStatusController,
  createJournalPinController,
  unlockJournalController,
  changeJournalPinController,
  disableJournalPinController,
  lockJournalController
} from "../../controllers/journal/journalSecurity.controller.js";

import {
  requestJournalPinResetController,
  verifyJournalPinResetOtpController,
  completeJournalPinResetController
} from "../../controllers/journal/journalSecurityOtp.controller.js";

import {
  createJournalPinSchema,
  unlockJournalSchema,
  changeJournalPinSchema,
  disableJournalPinSchema,
  requestJournalPinResetSchema,
  verifyJournalPinResetOtpSchema,
  resetJournalPinSchema,
  lockJournalSchema
} from "../../validators/journal/journalSecurity.validator.js";
import requireJournalUnlock from "../../middleware/journal/requireJournalUnlock.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| All Journal Security endpoints require authentication
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| GET /api/journal/security/status
|--------------------------------------------------------------------------
*/

router.get(
  "/status",
  getJournalSecurityStatusController
);

/*
|--------------------------------------------------------------------------
| POST /api/journal/security/pin
|--------------------------------------------------------------------------
*/

router.post(
  "/pin",
  authLimiter,
  validate(
    createJournalPinSchema
  ),
  createJournalPinController
);

/*
|--------------------------------------------------------------------------
| POST /api/journal/security/unlock
|--------------------------------------------------------------------------
*/

router.post(
  "/unlock",
  authLimiter,
  validate(
    unlockJournalSchema
  ),
  unlockJournalController
);

/*
|--------------------------------------------------------------------------
| PATCH /api/journal/security/pin
|--------------------------------------------------------------------------
*/

router.patch(
  "/pin",
  authLimiter,
  validate(
    changeJournalPinSchema
  ),
  changeJournalPinController
);

/*
|--------------------------------------------------------------------------
| DELETE /api/journal/security/pin
|--------------------------------------------------------------------------
*/

router.delete(
  "/pin",
  authLimiter,
  validate(
    disableJournalPinSchema
  ),
  disableJournalPinController
);

/*
|--------------------------------------------------------------------------
| Request Journal PIN Reset OTP
|--------------------------------------------------------------------------
| POST /api/journal/security/pin/forgot
*/

router.post(
  "/pin/forgot",
  otpLimiter,
  validate(
    requestJournalPinResetSchema
  ),
  requestJournalPinResetController
);

/*
|--------------------------------------------------------------------------
| Verify Journal PIN Reset OTP
|--------------------------------------------------------------------------
| POST /api/journal/security/pin/reset/verify
*/

router.post(
  "/pin/reset/verify",
  otpLimiter,
  validate(
    verifyJournalPinResetOtpSchema
  ),
  verifyJournalPinResetOtpController
);

/*
|--------------------------------------------------------------------------
| Complete Journal PIN Reset
|--------------------------------------------------------------------------
| POST /api/journal/security/pin/reset
*/

router.post(
  "/pin/reset",
  authLimiter,
  validate(
    resetJournalPinSchema
  ),
  completeJournalPinResetController
);
/*
|--------------------------------------------------------------------------
| Lock Journal
|--------------------------------------------------------------------------
| POST /api/journal/security/lock
|
| Requires an active Journal unlock session.
*/

router.post(
  "/lock",
  authLimiter,
  requireJournalUnlock,
  validate(
    lockJournalSchema
  ),
  lockJournalController
);

/*
|--------------------------------------------------------------------------
| These routes will be enabled after OTP implementation
|--------------------------------------------------------------------------
|

router.post(
  "/pin/forgot",
  otpLimiter,
  validate(
    requestJournalPinResetSchema
  ),
  requestJournalPinResetController
);

router.post(
  "/pin/reset/verify",
  otpLimiter,
  validate(
    verifyJournalPinResetOtpSchema
  ),
  verifyJournalPinResetOtpController
);

router.post(
  "/pin/reset",
  authLimiter,
  validate(
    resetJournalPinSchema
  ),
  resetJournalPinController
);

router.post(
  "/lock",
  authLimiter,
  lockJournalController
);

*/

export default router;