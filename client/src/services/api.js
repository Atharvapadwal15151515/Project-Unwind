import axios from "axios";

import {
  clearJournalUnlockSession,
  getJournalUnlockToken,
  notifyJournalLocked
} from "../utils/journalSecuritySession";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const TOKEN_STORAGE_KEY =
  "unwind_access_token";

export function getAccessToken() {
  return localStorage.getItem(
    TOKEN_STORAGE_KEY
  );
}

export function hasUsableAccessToken() {
  const token = getAccessToken();

  if (!token) {
    return false;
  }

  try {
    const payloadPart =
      token.split(".")[1];

    if (!payloadPart) {
      return false;
    }

    const normalizedPayload =
      payloadPart
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(
          Math.ceil(
            payloadPart.length / 4
          ) * 4,
          "="
        );

    const payload = JSON.parse(
      globalThis.atob(
        normalizedPayload
      )
    );

    const expiresAt =
      Number(payload.exp);

    if (!Number.isFinite(expiresAt)) {
      return false;
    }

    /*
      Treat the token as expired five seconds early
      to prevent it expiring during /auth/me.
    */
    return (
      expiresAt * 1000 >
      Date.now() + 5000
    );
  } catch {
    return false;
  }
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(
      TOKEN_STORAGE_KEY,
      token
    );
  } else {
    localStorage.removeItem(
      TOKEN_STORAGE_KEY
    );
  }
}

export function clearAccessToken() {
  localStorage.removeItem(
    TOKEN_STORAGE_KEY
  );

  clearJournalUnlockSession();
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const accessToken =
      getAccessToken();

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    const isJournalRequest =
      config.url?.startsWith(
        "/journal/"
      );

    const journalUnlockToken =
      getJournalUnlockToken();

    if (
      isJournalRequest &&
      journalUnlockToken
    ) {
      config.headers[
        "X-Journal-Unlock-Token"
      ] = journalUnlockToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise =
      refreshClient
        .post("/auth/refresh")
        .then((response) => {
          const newAccessToken =
            response.data?.data
              ?.accessToken;

          if (!newAccessToken) {
            throw new Error(
              "No access token returned"
            );
          }

          setAccessToken(
            newAccessToken
          );

          return newAccessToken;
        })
        .finally(() => {
          refreshPromise = null;
        });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest =
      error.config;

    const requestUrl =
      originalRequest?.url || "";

    const responseMessage =
      error.response?.data?.message ||
      "";

    const isJournalRequest =
      requestUrl.startsWith(
        "/journal/"
      );

    const isJournalUnlockFailure =
      isJournalRequest &&
      (
        /journal unlock session/i.test(
          responseMessage
        ) ||
        /journal is locked/i.test(
          responseMessage
        ) ||
        /unlock session has expired/i.test(
          responseMessage
        )
      );

    if (isJournalUnlockFailure) {
      notifyJournalLocked(
        responseMessage
      );

      return Promise.reject(error);
    }

    const isUnauthorized =
      error.response?.status === 401;

    const isJournalPinFailure =
      isJournalRequest &&
      isUnauthorized &&
      /journal pin/i.test(
        responseMessage
      );

    const isRefreshRequest =
      originalRequest?.url?.includes(
        "/auth/refresh"
      );

    const isLoginRequest =
      originalRequest?.url?.includes(
        "/auth/login"
      );

    const isRegisterRequest =
      originalRequest?.url?.includes(
        "/auth/register"
      );

    if (
      !isUnauthorized ||
      originalRequest?._retry ||
      isRefreshRequest ||
      isLoginRequest ||
      isRegisterRequest ||
      isJournalPinFailure
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken =
        await refreshAccessToken();

      originalRequest
        .headers
        .Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearAccessToken();

      window.dispatchEvent(
        new CustomEvent(
          "unwind:session-expired"
        )
      );

      return Promise.reject(
        refreshError
      );
    }
  }
);

export function getApiErrorMessage(
  error,
  fallbackMessage =
    "Something went wrong. Please try again."
) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallbackMessage
  );
}

export default api;