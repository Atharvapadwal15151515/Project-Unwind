import express from "express";

import {
  forgotPassword,
  resetWithOTP,
  resetWithLink,
  changePassword
} from "../controllers/password.controller.js";

import {
  authenticate
} from "../middleware/authenticate.js";

import {
  validate
} from "../middleware/validate.js";

import {
  forgotPasswordSchema,
  resetPasswordWithOTPSchema,
  resetPasswordWithLinkSchema,
  changePasswordSchema
} from "../validators/password.validator.js";

import {
  authLimiter,
  otpLimiter
} from "../middleware/rateLimiter.js";

const router = express.Router();

router.post(
  "/forgot",
  otpLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

router.post(
  "/reset-otp",
  authLimiter,
  validate(resetPasswordWithOTPSchema),
  resetWithOTP
);

router.post(
  "/reset-link",
  authLimiter,
  validate(resetPasswordWithLinkSchema),
  resetWithLink
);

router.patch(
  "/change",
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

export default router;