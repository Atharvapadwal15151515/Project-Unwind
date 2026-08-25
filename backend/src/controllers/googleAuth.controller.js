import {
  processGoogleAuthentication,
  completeGoogleSignup
} from "../services/googleAuth.service.js";

import {
  sendRefreshTokenCookie
} from "../utils/sendCookie.js";


/*
|--------------------------------------------------------------------------
| Helper — Get Request Metadata
|--------------------------------------------------------------------------
|
| Collects basic request information for Unwind's existing session system.
|
*/

function getRequestMetadata(req) {
  return {
    deviceName:
      req.body?.deviceName ||
      req.headers["x-device-name"] ||
      null,

    browser:
      req.body?.browser ||
      req.headers["x-browser"] ||
      null,

    operatingSystem:
      req.body?.operatingSystem ||
      req.headers["x-operating-system"] ||
      null,

    ipAddress:
      req.ip ||
      req.socket?.remoteAddress ||
      null,

    userAgent:
      req.get("user-agent") ||
      null
  };
}


/*
|--------------------------------------------------------------------------
| Google OAuth Callback
|--------------------------------------------------------------------------
|
| Passport authenticates Google BEFORE this controller runs.
|
| Therefore:
|
| req.user
|
| contains the normalized Google identity from googleOAuth.js:
|
| {
|   googleId,
|   email,
|   fullName,
|   profileImageUrl,
|   emailVerified,
|   provider
| }
|
|--------------------------------------------------------------------------
*/

export async function googleCallback(
  req,
  res,
  next
) {
  try {
    const googleUser =
      req.user;

    if (!googleUser) {
      return res.status(401).json({
        success: false,
        message:
          "Google authentication failed"
      });
    }


    /*
    |--------------------------------------------------------------------------
    | Require Verified Google Email
    |--------------------------------------------------------------------------
    */

    if (!googleUser.emailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Google could not verify your email address"
      });
    }


    const metadata =
      getRequestMetadata(req);


    const result =
      await processGoogleAuthentication({
        googleUser,
        ...metadata
      });


    /*
    |--------------------------------------------------------------------------
    | CASE 1 / CASE 2
    |--------------------------------------------------------------------------
    |
    | Existing Google account
    |
    | OR
    |
    | Existing local account that has now been linked to Google.
    |
    | In both cases the service has already:
    |
    | - created access token
    | - created refresh token
    | - created user session
    |
    |--------------------------------------------------------------------------
    */

    if (
      result.action === "login" ||
      result.action ===
        "linked_and_logged_in"
    ) {

      /*
      |--------------------------------------------------------------------------
      | Refresh Token Cookie
      |--------------------------------------------------------------------------
      |
      | Reuse Unwind's existing refresh-token cookie system.
      |
      */

      sendRefreshTokenCookie(
  res,
  result.refreshToken,
  true
);


      /*
      |--------------------------------------------------------------------------
      | Redirect Back To React
      |--------------------------------------------------------------------------
      |
      | We DON'T put the refresh token in the URL.
      |
      | Only the short-lived access token is returned through the redirect.
      |
      |--------------------------------------------------------------------------
      */

      const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";


      const redirectUrl =
        new URL(
          "/auth/google/success",
          frontendUrl
        );


      redirectUrl.searchParams.set(
        "accessToken",
        result.accessToken
      );


      redirectUrl.searchParams.set(
        "action",
        result.action
      );


      return res.redirect(
        redirectUrl.toString()
      );
    }


    /*
    |--------------------------------------------------------------------------
    | CASE 3 — New Google User
    |--------------------------------------------------------------------------
    |
    | Google authentication succeeded, but this user doesn't have an
    | Unwind account yet.
    |
    | Redirect to React's Complete Google Profile page.
    |
    |--------------------------------------------------------------------------
    */

    if (
      result.action ===
      "complete_profile"
    ) {
      const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";


      const redirectUrl =
        new URL(
          "/auth/google/complete-profile",
          frontendUrl
        );


      /*
      |--------------------------------------------------------------------------
      | Temporary Signup Token
      |--------------------------------------------------------------------------
      |
      | This is NOT an access token.
      |
      | It only proves that Google authentication succeeded and allows
      | completion of the Google signup process.
      |
      */

      redirectUrl.searchParams.set(
        "token",
        result.googleSignupToken
      );


      return res.redirect(
        redirectUrl.toString()
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Unexpected Service Result
    |--------------------------------------------------------------------------
    */

    return res.status(500).json({
      success: false,
      message:
        "Unable to complete Google authentication"
    });

  } catch (error) {
    next(error);
  }
}


/*
|--------------------------------------------------------------------------
| Complete Google Signup
|--------------------------------------------------------------------------
|
| POST /api/auth/google/complete-profile
|
| Called after a brand-new Google user fills:
|
| - username
| - dateOfBirth
| - gender
| - occupationType
|
|--------------------------------------------------------------------------
*/

export async function completeGoogleProfile(
  req,
  res,
  next
) {
  try {
    const {
      googleSignupToken,
      username,
      dateOfBirth,
      gender,
      occupationType
    } = req.body;


    /*
    |--------------------------------------------------------------------------
    | Basic Request Validation
    |--------------------------------------------------------------------------
    |
    | More detailed validation can remain in your validation middleware /
    | service layer.
    |
    |--------------------------------------------------------------------------
    */

    if (!googleSignupToken) {
      return res.status(400).json({
        success: false,
        message:
          "Google signup token is required"
      });
    }


    if (
      typeof username !== "string" ||
      !username.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username is required"
      });
    }


    const metadata =
      getRequestMetadata(req);


    const result =
      await completeGoogleSignup({
        googleSignupToken,

        username:
          username.trim(),

        dateOfBirth:
          dateOfBirth || null,

        gender:
          gender || null,

        occupationType:
          occupationType || null,

        ...metadata
      });


    /*
    |--------------------------------------------------------------------------
    | Set Refresh Token Cookie
    |--------------------------------------------------------------------------
    */

   sendRefreshTokenCookie(
  res,
  result.refreshToken,
  true
);


    /*
    |--------------------------------------------------------------------------
    | Successful Google Signup
    |--------------------------------------------------------------------------
    |
    | At this point:
    |
    | ✓ users created
    | ✓ user_profiles created
    | ✓ user_settings created
    | ✓ email already verified
    | ✓ session created
    | ✓ access token generated
    | ✓ refresh cookie created
    |
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message:
        "Google account created successfully",

      data: {
        user:
          result.user,

        profile:
          result.profile,

        settings:
          result.settings,

        accessToken:
          result.accessToken,

        sessionId:
          result.sessionId,

        isNewUser: true
      }
    });

  } catch (error) {
    next(error);
  }
}


/*
|--------------------------------------------------------------------------
| Google Authentication Failure
|--------------------------------------------------------------------------
|
| Passport can redirect here when Google authentication itself fails.
|
|--------------------------------------------------------------------------
*/

export function googleAuthFailure(
  req,
  res
) {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "http://localhost:5173";


  const redirectUrl =
    new URL(
      "/auth/google/error",
      frontendUrl
    );


  redirectUrl.searchParams.set(
    "error",
    "google_authentication_failed"
  );


  return res.redirect(
    redirectUrl.toString()
  );
}