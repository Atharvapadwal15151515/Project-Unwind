import jwt from "jsonwebtoken";

import pool from "../config/database.js";

import {
  findUserByEmail,
  findUserByUsername,
  findUserByGoogleId,
  linkGoogleAccount,
  updateLastLogin
} from "../models/user.model.js";

import {
  createAccessToken
} from "./token.service.js";

import {
  startSession
} from "./session.service.js";

import AppError from "../utils/AppError.js";


/*
|--------------------------------------------------------------------------
| Google OAuth Configuration
|--------------------------------------------------------------------------
*/

const GOOGLE_SIGNUP_TOKEN_EXPIRY =
  "15m";


/*
|--------------------------------------------------------------------------
| Create Temporary Google Signup Token
|--------------------------------------------------------------------------
|
| A new Google user has successfully authenticated with Google, but has
| not yet completed the additional information required by Unwind.
|
| This token temporarily stores the verified Google identity until the
| user completes:
|
| - username
| - date of birth
| - gender
| - occupation type
|
| This is NOT an Unwind access token.
|
|--------------------------------------------------------------------------
*/

function createGoogleSignupToken({
  googleId,
  email,
  fullName,
  profileImageUrl
}) {
  if (
    !process.env.JWT_ACCESS_SECRET
  ) {
    throw new Error(
      "JWT_ACCESS_SECRET is not configured"
    );
  }

  return jwt.sign(
    {
      purpose:
        "google_signup",

      googleId,

      email,

      fullName:
        fullName || null,

      profileImageUrl:
        profileImageUrl || null
    },

    process.env.JWT_ACCESS_SECRET,

    {
      expiresIn:
        GOOGLE_SIGNUP_TOKEN_EXPIRY
    }
  );
}


/*
|--------------------------------------------------------------------------
| Verify Temporary Google Signup Token
|--------------------------------------------------------------------------
*/

function verifyGoogleSignupToken(
  googleSignupToken
) {
  if (!googleSignupToken) {
    throw new AppError(
      "Google signup token is required",
      400
    );
  }

  if (
    !process.env.JWT_ACCESS_SECRET
  ) {
    throw new Error(
      "JWT_ACCESS_SECRET is not configured"
    );
  }

  try {
    const decoded =
      jwt.verify(
        googleSignupToken,
        process.env.JWT_ACCESS_SECRET
      );

    /*
    |--------------------------------------------------------------------------
    | Ensure this token was created specifically for Google signup.
    |--------------------------------------------------------------------------
    */

    if (
      decoded.purpose !==
      "google_signup"
    ) {
      throw new Error(
        "Invalid token purpose"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Google identity must contain both Google ID and email.
    |--------------------------------------------------------------------------
    */

    if (
      !decoded.googleId ||
      !decoded.email
    ) {
      throw new Error(
        "Incomplete Google identity"
      );
    }

    return decoded;

  } catch {
    throw new AppError(
      "Google signup session is invalid or has expired. Please continue with Google again.",
      401
    );
  }
}


/*
|--------------------------------------------------------------------------
| Sanitize User
|--------------------------------------------------------------------------
|
| Never expose sensitive database fields such as password_hash.
|
|--------------------------------------------------------------------------
*/

function sanitizeUser(user) {
  return {
    user_id:
      user.user_id,

    email:
      user.email,

    username:
      user.username,

    google_id:
      user.google_id,

    auth_provider:
      user.auth_provider,

    role:
      user.role,

    account_status:
      user.account_status,

    email_verified:
      user.email_verified,

    two_factor_enabled:
      user.two_factor_enabled,

    two_factor_method:
      user.two_factor_method,

    last_login_at:
      user.last_login_at,

    created_at:
      user.created_at,

    updated_at:
      user.updated_at
  };
}


/*
|--------------------------------------------------------------------------
| Create Google Login Session
|--------------------------------------------------------------------------
|
| Google users use the exact same authentication/session system as normal
| email/password users.
|
| This creates:
|
| - access token
| - refresh token
| - user session
| - last login timestamp
|
|--------------------------------------------------------------------------
*/

async function createGoogleLoginSession({
  user,

  deviceName = null,

  browser = null,

  operatingSystem = null,

  ipAddress = null,

  userAgent = null
}) {
  /*
  |--------------------------------------------------------------------------
  | Account Status Check
  |--------------------------------------------------------------------------
  */

  if (
    user.account_status !==
    "active"
  ) {
    throw new AppError(
      "This account is not currently active",
      403
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Generate Access Token
  |--------------------------------------------------------------------------
  */

  const accessToken =
    createAccessToken(user);


  /*
  |--------------------------------------------------------------------------
  | Create Refresh Session
  |--------------------------------------------------------------------------
  */

 const {
  refreshToken,
  session
} =
  await startSession({
    user,

    deviceName,

    browser,

    operatingSystem,

    ipAddress,

    userAgent,

    rememberMe: true
  });

  /*
  |--------------------------------------------------------------------------
  | Update Last Login
  |--------------------------------------------------------------------------
  */

  await updateLastLogin(
    user.user_id
  );


  return {
    user:
      sanitizeUser(user),

    accessToken,

    refreshToken,

    sessionId:
      session.session_id
  };
}


/*
|--------------------------------------------------------------------------
| Process Google Authentication
|--------------------------------------------------------------------------
|
| Called after Passport successfully authenticates the Google account.
|
| Possible flows:
|
| CASE 1
| google_id already exists
| → Login existing Google user
|
| CASE 2
| Email already exists as local account
| → Link Google account
| → Login
|
| CASE 3
| Completely new user
| → Generate temporary signup token
| → Ask user to complete profile
|
|--------------------------------------------------------------------------
*/

export async function processGoogleAuthentication({
  googleUser,

  deviceName = null,

  browser = null,

  operatingSystem = null,

  ipAddress = null,

  userAgent = null
}) {
  /*
  |--------------------------------------------------------------------------
  | Validate Google Authentication Data
  |--------------------------------------------------------------------------
  */

  if (
    !googleUser?.googleId ||
    !googleUser?.email
  ) {
    throw new AppError(
      "Invalid Google authentication data",
      400
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Google Email Must Be Verified
  |--------------------------------------------------------------------------
  |
  | This is particularly important when automatically linking Google to an
  | existing Unwind account with the same email.
  |
  |--------------------------------------------------------------------------
  */

  if (
    googleUser.emailVerified !==
    true
  ) {
    throw new AppError(
      "Google could not verify your email address",
      403
    );
  }


  const normalizedEmail =
    googleUser.email
      .trim()
      .toLowerCase();


  /*
  |--------------------------------------------------------------------------
  | CASE 1
  |--------------------------------------------------------------------------
  |
  | Google account is already connected to an Unwind account.
  |
  |--------------------------------------------------------------------------
  */

  const existingGoogleUser =
    await findUserByGoogleId(
      googleUser.googleId
    );


  if (existingGoogleUser) {
    const loginResult =
      await createGoogleLoginSession({
        user:
          existingGoogleUser,

        deviceName,

        browser,

        operatingSystem,

        ipAddress,

        userAgent
      });


    return {
      action:
        "login",

      isNewUser:
        false,

      ...loginResult
    };
  }


  /*
  |--------------------------------------------------------------------------
  | CASE 2
  |--------------------------------------------------------------------------
  |
  | Google ID is not linked yet, but the Google email already belongs to
  | an existing Unwind account.
  |
  | Example:
  |
  | Existing account:
  |
  | email         = user@gmail.com
  | password_hash = existing hash
  | google_id     = NULL
  |
  | User later chooses "Continue with Google" using the same verified email.
  |
  | We connect Google to the existing account rather than creating a
  | duplicate user.
  |
  |--------------------------------------------------------------------------
  */

  const existingEmailUser =
    await findUserByEmail(
      normalizedEmail
    );


  if (existingEmailUser) {
    /*
    |--------------------------------------------------------------------------
    | Prevent Linking Another Google Account
    |--------------------------------------------------------------------------
    */

    if (
      existingEmailUser.google_id &&
      existingEmailUser.google_id !==
        googleUser.googleId
    ) {
      throw new AppError(
        "This Unwind account is already connected to another Google account",
        409
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Link Google ID
    |--------------------------------------------------------------------------
    |
    | Password is NOT removed.
    |
    | Existing local users can therefore continue using:
    |
    | - email/password
    | - Google
    |
    |--------------------------------------------------------------------------
    */

    let linkedUser =
      existingEmailUser;


    if (
      !existingEmailUser.google_id
    ) {
      try {
        linkedUser =
          await linkGoogleAccount(
            existingEmailUser.user_id,
            googleUser.googleId
          );

      } catch (error) {
        /*
        |--------------------------------------------------------------------------
        | PostgreSQL Unique Constraint
        |--------------------------------------------------------------------------
        */

        if (
          error.code ===
          "23505"
        ) {
          throw new AppError(
            "This Google account is already connected to another Unwind account",
            409
          );
        }

        throw error;
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Login Existing Account
    |--------------------------------------------------------------------------
    */

    const loginResult =
      await createGoogleLoginSession({
        user:
          linkedUser,

        deviceName,

        browser,

        operatingSystem,

        ipAddress,

        userAgent
      });


    return {
      action:
        "linked_and_logged_in",

      isNewUser:
        false,

      ...loginResult
    };
  }


  /*
  |--------------------------------------------------------------------------
  | CASE 3
  |--------------------------------------------------------------------------
  |
  | Completely new Google user.
  |
  | Do NOT create their database account yet because Unwind still requires:
  |
  | - username
  | - date of birth
  | - gender
  | - occupation type
  |
  |--------------------------------------------------------------------------
  */

  const googleSignupToken =
    createGoogleSignupToken({
      googleId:
        googleUser.googleId,

      email:
        normalizedEmail,

      fullName:
        googleUser.fullName,

      profileImageUrl:
        googleUser.profileImageUrl
    });


  return {
    action:
      "complete_profile",

    isNewUser:
      true,

    googleSignupToken,

    googleProfile: {
      email:
        normalizedEmail,

      fullName:
        googleUser.fullName ||
        null,

      profileImageUrl:
        googleUser.profileImageUrl ||
        null
    }
  };
}


/*
|--------------------------------------------------------------------------
| Complete Google Signup
|--------------------------------------------------------------------------
|
| Called after a new Google user completes the remaining Unwind signup
| information.
|
| Expected:
|
| googleSignupToken
| username
| dateOfBirth
| gender
| occupationType
|
|--------------------------------------------------------------------------
*/

export async function completeGoogleSignup({
  googleSignupToken,

  username,

  dateOfBirth = null,

  gender = null,

  occupationType = null,

  deviceName = null,

  browser = null,

  operatingSystem = null,

  ipAddress = null,

  userAgent = null
}) {
  /*
  |--------------------------------------------------------------------------
  | Username Validation
  |--------------------------------------------------------------------------
  */

  if (
    typeof username !==
      "string" ||
    !username.trim()
  ) {
    throw new AppError(
      "Username is required",
      400
    );
  }


  const normalizedUsername =
    username.trim();


  /*
  |--------------------------------------------------------------------------
  | Verify Temporary Google Signup Token
  |--------------------------------------------------------------------------
  */

  const googleIdentity =
    verifyGoogleSignupToken(
      googleSignupToken
    );


  const normalizedEmail =
    googleIdentity.email
      .trim()
      .toLowerCase();


  /*
  |--------------------------------------------------------------------------
  | Check Username Availability
  |--------------------------------------------------------------------------
  */

  const existingUsername =
    await findUserByUsername(
      normalizedUsername
    );


  if (existingUsername) {
    throw new AppError(
      "This username is already taken",
      409
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Prevent Duplicate Google Account
  |--------------------------------------------------------------------------
  |
  | Protects against:
  |
  | - multiple signup tabs
  | - repeated requests
  | - already completed Google signup
  |
  |--------------------------------------------------------------------------
  */

  const existingGoogleUser =
    await findUserByGoogleId(
      googleIdentity.googleId
    );


  if (existingGoogleUser) {
    throw new AppError(
      "This Google account already has an Unwind account. Please log in instead.",
      409
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Prevent Duplicate Email
  |--------------------------------------------------------------------------
  */

  const existingEmailUser =
    await findUserByEmail(
      normalizedEmail
    );


  if (existingEmailUser) {
    throw new AppError(
      "An account with this email already exists. Please log in instead.",
      409
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Full Name
  |--------------------------------------------------------------------------
  |
  | user_profiles.full_name is NOT NULL.
  |
  |--------------------------------------------------------------------------
  */

  const fullName =
    typeof googleIdentity.fullName ===
      "string"
      ? googleIdentity.fullName.trim()
      : "";


  if (!fullName) {
    throw new AppError(
      "Google did not provide your name. Unable to complete signup.",
      400
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Database Transaction
  |--------------------------------------------------------------------------
  |
  | These records must be created together:
  |
  | 1. users
  | 2. user_profiles
  | 3. user_settings
  |
  | If any step fails, the entire signup is rolled back.
  |
  |--------------------------------------------------------------------------
  */

  const client =
    await pool.connect();


  let user;
  let profile;
  let settings;


  try {
    await client.query(
      "BEGIN"
    );


    /*
    |--------------------------------------------------------------------------
    | Create Google User
    |--------------------------------------------------------------------------
    |
    | Google users:
    |
    | password_hash  = NULL
    | google_id      = Google's unique account ID
    | auth_provider  = google
    | email_verified = TRUE
    |
    |--------------------------------------------------------------------------
    */

    const userResult =
      await client.query(
        `
          INSERT INTO users (
            email,
            username,
            password_hash,
            google_id,
            auth_provider,
            email_verified
          )
          VALUES (
            $1,
            $2,
            NULL,
            $3,
            'google',
            TRUE
          )
          RETURNING
            user_id,
            email,
            username,
            password_hash,
            google_id,
            auth_provider,
            role,
            account_status,
            email_verified,
            two_factor_enabled,
            two_factor_method,
            last_login_at,
            created_at,
            updated_at
        `,
        [
          normalizedEmail,
          normalizedUsername,
          googleIdentity.googleId
        ]
      );


    user =
      userResult.rows[0];


    /*
    |--------------------------------------------------------------------------
    | Create User Profile
    |--------------------------------------------------------------------------
    |
    | Google profile image:
    |
    | profile_image_url
    | → Google's image URL
    |
    | profile_image_public_id
    | → NULL because Google images are not stored in Cloudinary.
    |
    |--------------------------------------------------------------------------
    */

    const profileResult =
      await client.query(
        `
          INSERT INTO user_profiles (
            user_id,
            full_name,
            date_of_birth,
            gender,
            occupation_type,
            profile_image_url,
            profile_image_public_id
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            NULL
          )
          RETURNING
            profile_id,
            user_id,
            full_name,
            date_of_birth,
            gender,
            occupation_type,
            profile_image_url,
            profile_image_public_id,
            created_at,
            updated_at
        `,
        [
          user.user_id,

          fullName,

          dateOfBirth,

          gender,

          occupationType,

          googleIdentity.profileImageUrl ||
            null
        ]
      );


    profile =
      profileResult.rows[0];


    /*
    |--------------------------------------------------------------------------
    | Create Default User Settings
    |--------------------------------------------------------------------------
    */

    const settingsResult =
      await client.query(
        `
          INSERT INTO user_settings (
            user_id
          )
          VALUES ($1)
          RETURNING *
        `,
        [
          user.user_id
        ]
      );


    settings =
      settingsResult.rows[0];


    /*
    |--------------------------------------------------------------------------
    | Complete Transaction
    |--------------------------------------------------------------------------
    */

    await client.query(
      "COMMIT"
    );

  } catch (error) {
    await client.query(
      "ROLLBACK"
    );


    /*
    |--------------------------------------------------------------------------
    | PostgreSQL Unique Constraint Error
    |--------------------------------------------------------------------------
    */

    if (
      error.code ===
      "23505"
    ) {
      throw new AppError(
        "An account with this email, username, or Google account already exists",
        409
      );
    }


    throw error;

  } finally {
    client.release();
  }


  /*
  |--------------------------------------------------------------------------
  | Create Normal Unwind Login Session
  |--------------------------------------------------------------------------
  |
  | Google signup is now complete.
  |
  | From this point onward the user behaves like every other authenticated
  | Unwind user.
  |
  |--------------------------------------------------------------------------
  */

  const loginResult =
    await createGoogleLoginSession({
      user,

      deviceName,

      browser,

      operatingSystem,

      ipAddress,

      userAgent
    });


  /*
  |--------------------------------------------------------------------------
  | Return Signup Result
  |--------------------------------------------------------------------------
  */

  return {
    action:
      "signup_complete",

    isNewUser:
      true,

    user:
      loginResult.user,

    profile,

    settings,

    accessToken:
      loginResult.accessToken,

    refreshToken:
      loginResult.refreshToken,

    sessionId:
      loginResult.sessionId
  };
}