import jwt from "jsonwebtoken";

import { hashToken } from "../utils/hashToken.js";
import {
  createRefreshToken
} from "./token.service.js";

import {
  createSession,
  findSessionByRefreshTokenHash,
  updateSessionActivity,
  revokeSession,
  revokeAllUserSessions
} from "../models/session.model.js";

function getRefreshTokenExpiry() {
  const days = Number(process.env.REFRESH_TOKEN_DAYS || 30);

  return new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  );
}
export async function startSession({
  user,
  deviceName = null,
  browser = null,
  operatingSystem = null,
  ipAddress = null,
  userAgent = null,
  rememberMe = false
}) {
  const {
    refreshToken,
    refreshTokenHash
  } = createRefreshToken(user);

  const session = await createSession({
    userId: user.user_id,
    refreshTokenHash,
    deviceName,
    browser,
    operatingSystem,
    ipAddress,
    userAgent,
    expiresAt:
      getRefreshTokenExpiry(),

    rememberMe
  });

  return {
    refreshToken,
    session
  };
}

export async function validateRefreshSession(refreshToken) {
  let decoded;

  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
  } catch {
    return null;
  }

  const refreshTokenHash = hashToken(refreshToken);

  const session = await findSessionByRefreshTokenHash(
    refreshTokenHash
  );

  if (!session) {
    return null;
  }

  if (session.expires_at <= new Date()) {
    await revokeSession(session.session_id);
    return null;
  }

  if (session.user_id !== decoded.sub) {
    await revokeSession(session.session_id);
    return null;
  }

  return {
    session,
    userId: decoded.sub
  };
}

export async function rotateRefreshSession({
  currentSession,
  user
}) {
  await revokeSession(
    currentSession.session_id
  );

  return startSession({
    user,

    deviceName:
      currentSession.device_name,

    browser:
      currentSession.browser,

    operatingSystem:
      currentSession.operating_system,

    ipAddress:
      currentSession.ip_address,

    userAgent:
      currentSession.user_agent,

    rememberMe:
      currentSession.remember_me === true
  });
}

export async function touchSession(sessionId) {
  return updateSessionActivity(sessionId);
}

export async function endSession(refreshToken) {
  if (!refreshToken) return null;

  const refreshTokenHash = hashToken(refreshToken);

  const session = await findSessionByRefreshTokenHash(
    refreshTokenHash
  );

  if (!session) return null;

  return revokeSession(session.session_id);
}

export async function endAllUserSessions(userId) {
  await revokeAllUserSessions(userId);
}