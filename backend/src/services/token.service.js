import crypto from "crypto";

import {
  generateAccessToken,
  generateRefreshToken
} from "../utils/generateTokens.js";

import { hashToken } from "../utils/hashToken.js";

import {
  createAuthToken,
  findAuthToken,
  findLatestActiveToken,
  incrementAttemptCount,
  markTokenAsUsed,
  deleteUserTokens
} from "../models/authToken.model.js";

export function createAccessToken(user) {
  return generateAccessToken(user);
}

export function createRefreshToken(user) {
  const refreshToken = generateRefreshToken(user);

  return {
    refreshToken,
    refreshTokenHash: hashToken(refreshToken)
  };
}

export async function createTemporaryToken({
  userId,
  tokenType,
  deliveryMethod,
  expiresInMinutes = 15
}) {
  let rawToken;

  if (deliveryMethod === "otp") {
    rawToken = crypto.randomInt(100000, 1000000).toString();
  } else {
    rawToken = crypto.randomBytes(32).toString("hex");
  }

  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(
    Date.now() + expiresInMinutes * 60 * 1000
  );

  await deleteUserTokens(
    userId,
    tokenType,
    deliveryMethod
  );

  const tokenRecord = await createAuthToken({
    userId,
    tokenHash,
    tokenType,
    deliveryMethod,
    expiresAt
  });

  return {
    rawToken,
    tokenRecord
  };
}

export async function verifyTemporaryToken({
  userId,
  rawToken,
  tokenType,
  deliveryMethod,
  maximumAttempts = 5
}) {
  const activeToken = await findLatestActiveToken({
    userId,
    tokenType,
    deliveryMethod
  });

  if (!activeToken) {
    return {
      success: false,
      reason: "expired_or_missing"
    };
  }

  if (activeToken.attempt_count >= maximumAttempts) {
    return {
      success: false,
      reason: "maximum_attempts"
    };
  }

  const tokenHash = hashToken(rawToken);

  const tokenRecord = await findAuthToken({
    userId,
    tokenHash,
    tokenType,
    deliveryMethod
  });

  if (!tokenRecord) {
    const updatedToken =
      await incrementAttemptCount(
        activeToken.token_id
      );

    if (
      updatedToken?.attempt_count >=
      maximumAttempts
    ) {
      return {
        success: false,
        reason: "maximum_attempts"
      };
    }

    return {
      success: false,
      reason: "invalid"
    };
  }

  await markTokenAsUsed(tokenRecord.token_id);

  return {
    success: true,
    tokenRecord
  };
}