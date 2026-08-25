import crypto from "crypto";
import jwt from "jsonwebtoken";


export function generateAccessToken(user) {
  return jwt.sign(
    {
      role: user.role
    },
    process.env.JWT_ACCESS_SECRET,
    {
      subject: user.user_id,
      expiresIn:
        process.env.JWT_ACCESS_EXPIRES_IN ||
        "15m"
    }
  );
}


export function generateRefreshToken(user) {
  return jwt.sign(
    {
      role: user.role
    },
    process.env.JWT_REFRESH_SECRET,
    {
      subject: user.user_id,

      expiresIn:
        process.env.JWT_REFRESH_EXPIRES_IN ||
        "30d",

      /*
      |--------------------------------------------------------------------------
      | Unique Refresh Token ID
      |--------------------------------------------------------------------------
      |
      | Prevents two refresh tokens generated for the same user at nearly
      | the same time from producing the same JWT and therefore the same
      | refresh_token_hash.
      |
      */
      jwtid:
        crypto.randomUUID()
    }
  );
}