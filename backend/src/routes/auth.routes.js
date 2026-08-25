import express from "express";

import {
  register,
  login,
  refreshToken,
  logout,
  logoutAllDevices,
  getCurrentUser,
  verifyEmailOTP,
  verifyEmailLink,
  resendVerification
} from "../controllers/auth.controller.js";
import passport from "../config/googleOAuth.js";

import {
  googleCallback,
  completeGoogleProfile,
  googleAuthFailure
} from "../controllers/googleAuth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  authLimiter,
  otpLimiter
} from "../middleware/rateLimiter.js";
import { uploadProfileImage } from "../middleware/upload.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public Authentication Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  authLimiter,
  uploadProfileImage,
  register
);

router.post(
  "/login",
  authLimiter,
  login
);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

/*
|--------------------------------------------------------------------------
| Email Verification
|--------------------------------------------------------------------------
*/
router.post(
  "/verify-email-otp",
  authLimiter,
  verifyEmailOTP
);

router.post(
  "/verify-email-link",
  verifyEmailLink
);

router.post(
  "/resend-verification",
  otpLimiter,
  resendVerification
);


/*
|--------------------------------------------------------------------------
| Google OAuth
|--------------------------------------------------------------------------
*/

/**
 * Start Google authentication.
 *
 * GET /api/auth/google
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email"
    ],
    session: false
  })
);


/**
 * Google OAuth callback.
 *
 * Google redirects the user here after authentication.
 *
 * GET /api/auth/google/callback
 */
router.get(
  "/google/callback",

  passport.authenticate("google", {
    session: false,
    failureRedirect:
      "/auth/google/failure"
  }),

  googleCallback
);


/**
 * Google authentication failure.
 *
 * GET /api/auth/google/failure
 */
router.get(
  "/google/failure",
  googleAuthFailure
);


/**
 * Complete registration for a new Google user.
 *
 * POST /api/auth/google/complete-profile
 *
 * Body:
 * {
 *   googleSignupToken,
 *   username,
 *   dateOfBirth,
 *   gender,
 *   occupationType
 * }
 */
router.post(
  "/google/complete-profile",
  authLimiter,
  completeGoogleProfile
);
/*
|--------------------------------------------------------------------------
| Protected Authentication Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/logout-all",
  authenticate,
  logoutAllDevices
);

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

export default router;