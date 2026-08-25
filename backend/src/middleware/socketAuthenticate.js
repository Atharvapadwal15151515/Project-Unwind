import jwt from "jsonwebtoken";

import {
  findUserById
} from "../models/user.model.js";

import {
  restoreExpiredSuspensionForUser
} from "../services/admin/adminSuspension.service.js";


function createSocketError(
  message,
  code,
  statusCode = 401
) {
  const error =
    new Error(message);

  error.data = {
    code,
    status_code:
      statusCode
  };

  return error;
}


function extractAccessToken(
  socket
) {
  const authToken =
    socket.handshake.auth
      ?.accessToken ||
    socket.handshake.auth
      ?.access_token ||
    socket.handshake.auth
      ?.token;

  if (authToken) {
    return authToken;
  }

  const authorizationHeader =
    socket.handshake.headers
      ?.authorization;

  if (
    typeof authorizationHeader ===
      "string" &&
    authorizationHeader.startsWith(
      "Bearer "
    )
  ) {
    return authorizationHeader
      .slice(7)
      .trim();
  }

  return null;
}


export default async function socketAuthenticate(
  socket,
  next
) {
  try {
    const accessToken =
      extractAccessToken(socket);

    if (!accessToken) {
      return next(
        createSocketError(
          "Authentication token is required.",
          "AUTH_TOKEN_REQUIRED",
          401
        )
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Access Token
    |--------------------------------------------------------------------------
    */

    let decodedToken;

    try {
      decodedToken =
        jwt.verify(
          accessToken,
          process.env
            .JWT_ACCESS_SECRET
        );

    } catch (error) {
      const message =
        error.name ===
        "TokenExpiredError"
          ? "Access token has expired."
          : "Invalid access token.";

      const code =
        error.name ===
        "TokenExpiredError"
          ? "ACCESS_TOKEN_EXPIRED"
          : "INVALID_ACCESS_TOKEN";

      return next(
        createSocketError(
          message,
          code,
          401
        )
      );
    }


    const userId =
      decodedToken.sub;

    if (!userId) {
      return next(
        createSocketError(
          "Access token does not contain a valid user ID.",
          "INVALID_TOKEN_PAYLOAD",
          401
        )
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Load Current User
    |--------------------------------------------------------------------------
    |
    | Never trust account status or role stored inside the JWT.
    |
    */

    let user =
      await findUserById(
        userId
      );

    if (!user) {
      return next(
        createSocketError(
          "User account was not found.",
          "USER_NOT_FOUND",
          401
        )
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Restore Expired Temporary Suspension
    |--------------------------------------------------------------------------
    */

    if (
      user.account_status ===
      "suspended"
    ) {
      const restored =
        await restoreExpiredSuspensionForUser(
          user.user_id
        );

      if (restored) {
        user =
          await findUserById(
            user.user_id
          );
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Current Account Status
    |--------------------------------------------------------------------------
    */

    if (
      user.account_status ===
      "suspended"
    ) {
      return next(
        createSocketError(
          "Your account is temporarily suspended.",
          "ACCOUNT_SUSPENDED",
          403
        )
      );
    }


    if (
      user.account_status ===
      "banned"
    ) {
      return next(
        createSocketError(
          "Your account has been banned.",
          "ACCOUNT_BANNED",
          403
        )
      );
    }


    if (
      user.account_status !==
      "active"
    ) {
      return next(
        createSocketError(
          "Your account is not active.",
          "ACCOUNT_NOT_ACTIVE",
          403
        )
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Email Verification
    |--------------------------------------------------------------------------
    */

    if (!user.email_verified) {
      return next(
        createSocketError(
          "Verify your email before accessing chat.",
          "EMAIL_NOT_VERIFIED",
          403
        )
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Attach Current User
    |--------------------------------------------------------------------------
    */

    socket.user = {
      user_id:
        user.user_id,

      username:
        user.username,

      email:
        user.email,

      role:
        user.role
    };


    return next();

  } catch (error) {
    console.error(
      "Socket authentication error:",
      error
    );

    return next(
      createSocketError(
        "Socket authentication failed.",
        "SOCKET_AUTHENTICATION_FAILED",
        500
      )
    );
  }
}