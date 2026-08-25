import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error(
    "GOOGLE_CLIENT_ID is not defined in environment variables"
  );
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error(
    "GOOGLE_CLIENT_SECRET is not defined in environment variables"
  );
}

if (!process.env.GOOGLE_CALLBACK_URL) {
  throw new Error(
    "GOOGLE_CALLBACK_URL is not defined in environment variables"
  );
}

/*
|--------------------------------------------------------------------------
| Google OAuth Strategy
|--------------------------------------------------------------------------
|
| This file only communicates with Google.
|
| It does NOT:
| - create users
| - create Unwind sessions
| - generate JWTs
|
| Those responsibilities belong to googleAuth.service.js.
|
|--------------------------------------------------------------------------
*/

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },

    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {
      try {
        const email =
          profile.emails?.[0]?.value
            ?.trim()
            ?.toLowerCase() || null;

        const profileImageUrl =
          profile.photos?.[0]?.value || null;

        const fullName =
          profile.displayName?.trim() || null;

        const googleId =
          profile.id || null;

        const emailVerified =
          profile._json?.email_verified === true;

        /*
        |--------------------------------------------------------------------------
        | Required Google Data
        |--------------------------------------------------------------------------
        */

        if (!googleId) {
          return done(
            new Error(
              "Google did not provide a valid account ID"
            ),
            null
          );
        }

        if (!email) {
          return done(
            new Error(
              "Google did not provide an email address"
            ),
            null
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Normalized Google User
        |--------------------------------------------------------------------------
        */

        const googleUser = {
          googleId,
          email,
          fullName,
          profileImageUrl,
          emailVerified,
          provider: "google"
        };

        return done(
          null,
          googleUser
        );
      } catch (error) {
        return done(
          error,
          null
        );
      }
    }
  )
);

/*
|--------------------------------------------------------------------------
| Passport Sessions
|--------------------------------------------------------------------------
|
| Unwind uses JWT access tokens + refresh-token sessions.
|
| Therefore:
| - passport.initialize() is required
| - passport.session() is NOT required
| - serializeUser() is NOT required
| - deserializeUser() is NOT required
|
|--------------------------------------------------------------------------
*/

export default passport;