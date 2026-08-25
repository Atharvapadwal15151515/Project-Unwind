import express from "express";

import {
  authenticate
} from "../middleware/authenticate.js";

import {
  accountDeletionOtpLimiter
} from "../middleware/rateLimiter.js";

import {
  requestAccountDeletionOtpController,
  verifyAccountDeletionOtpController,
  deleteAccountController
} from "../controllers/account.controller.js";


const router = express.Router();


/*
|--------------------------------------------------------------------------
| Request Account Deletion OTP
|--------------------------------------------------------------------------
*/

router.post(
  "/delete/request-otp",
  authenticate,
  accountDeletionOtpLimiter,
  requestAccountDeletionOtpController
);


/*
|--------------------------------------------------------------------------
| Verify Account Deletion OTP
|--------------------------------------------------------------------------
*/

router.post(
  "/delete/verify-otp",
  authenticate,
  verifyAccountDeletionOtpController
);


/*
|--------------------------------------------------------------------------
| Permanently Delete Account
|--------------------------------------------------------------------------
*/

router.delete(
  "/",
  authenticate,
  deleteAccountController
);


export default router;