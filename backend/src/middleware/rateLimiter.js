import rateLimit from "express-rate-limit";


/*
|--------------------------------------------------------------------------
| Authentication Limiter
|--------------------------------------------------------------------------
|
| Use for login, signup/register, forgot-password and similar
| authentication endpoints.
|
*/

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 20,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again later."
  }
});


/*
|--------------------------------------------------------------------------
| OTP Limiter
|--------------------------------------------------------------------------
|
| Use only for OTP sending / resending endpoints.
|
*/

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,

  limit: 5,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many OTP requests. Please try again later."
  }
});

/*
|--------------------------------------------------------------------------
| Account Deletion OTP Limiter
|--------------------------------------------------------------------------
|
| Protects account deletion OTP sending / resending.
| This limiter should only be used on the endpoint that sends
| account deletion verification codes.
|
*/

export const accountDeletionOtpLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 5,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many account deletion verification requests. Please try again later."
    }
  });
/*
|--------------------------------------------------------------------------
| Admin Password Verification Limiter
|--------------------------------------------------------------------------
|
| Protects the shared admin password from brute-force attempts.
| Successful requests are not counted.
|
*/

export const adminAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 5,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: {
    success: false,
    message:
      "Too many admin access attempts. Please try again in 15 minutes."
  }
});


/*
|--------------------------------------------------------------------------
| Admin Read Limiter
|--------------------------------------------------------------------------
|
| For admin dashboard reads:
| users, reports, testimonials, audit logs, statistics, etc.
|
*/

export const adminReadLimiter = rateLimit({
  windowMs: 60 * 1000,

  limit: 120,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many admin requests. Please slow down."
  }
});


/*
|--------------------------------------------------------------------------
| Admin Action Limiter
|--------------------------------------------------------------------------
|
| For moderation/write actions:
| warnings, restrictions, suspensions, bans,
| report decisions, testimonial decisions, etc.
|
*/

export const adminActionLimiter = rateLimit({
  windowMs: 60 * 1000,

  limit: 30,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many admin actions. Please wait before performing more actions."
  }
});