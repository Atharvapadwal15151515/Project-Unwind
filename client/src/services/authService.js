import api, {
  clearAccessToken,
  setAccessToken
} from "./api";

const REMEMBER_ME_KEY =
  "unwind_remember_me";

export function setRememberMePreference(
  rememberMe
) {
  if (rememberMe) {
    localStorage.setItem(
      REMEMBER_ME_KEY,
      "true"
    );

    return;
  }

  localStorage.removeItem(
    REMEMBER_ME_KEY
  );
}

export function getRememberMePreference() {
  return (
    localStorage.getItem(
      REMEMBER_ME_KEY
    ) === "true"
  );
}

export function clearRememberMePreference() {
  localStorage.removeItem(
    REMEMBER_ME_KEY
  );
}

export async function registerUser(
  payload
) {
  const formData =
    new FormData();

  formData.append(
    "email",
    payload.email
  );

  formData.append(
    "username",
    payload.username
  );

  formData.append(
    "password",
    payload.password
  );

  formData.append(
    "fullName",
    payload.fullName
  );

  formData.append(
    "displayName",
    payload.displayName
  );

  if (payload.dateOfBirth) {
    formData.append(
      "dateOfBirth",
      payload.dateOfBirth
    );
  }

  if (payload.gender) {
    formData.append(
      "gender",
      payload.gender
    );
  }

  if (payload.occupationType) {
    formData.append(
      "occupationType",
      payload.occupationType
    );
  }

  if (payload.profileImage) {
    formData.append(
      "profileImage",
      payload.profileImage
    );
  }

  const response =
    await api.post(
      "/auth/register",
      formData
    );

  return response.data;
}

export async function loginUser(
  payload
) {
  const rememberMe =
    Boolean(
      payload?.rememberMe
    );

  const response =
    await api.post(
      "/auth/login",
      {
        ...payload,
        rememberMe
      }
    );

  const accessToken =
    response.data?.data
      ?.accessToken;

  if (accessToken) {
    setAccessToken(
      accessToken
    );
  }

  setRememberMePreference(
    rememberMe
  );

  return response.data;
}

export async function getCurrentUser() {
  const response =
    await api.get(
      "/auth/me"
    );

  return (
    response.data?.data?.user ||
    null
  );
}

export async function refreshSession() {
  const rememberMe =
    getRememberMePreference();

  const response =
    await api.post(
      "/auth/refresh",
      {
        rememberMe
      }
    );

  const accessToken =
    response.data?.data
      ?.accessToken;

  if (!accessToken) {
    throw new Error(
      "No access token was returned."
    );
  }

  setAccessToken(
    accessToken
  );

  return accessToken;
}

export async function logoutUser() {
  try {
    await api.post(
      "/auth/logout"
    );
  } finally {
    clearAccessToken();
    clearRememberMePreference();
  }
}

export async function logoutAllDevices() {
  try {
    await api.post(
      "/auth/logout-all"
    );
  } finally {
    clearAccessToken();
    clearRememberMePreference();
  }
}

export async function verifyEmailOtp(
  payload
) {
  const response =
    await api.post(
      "/auth/verify-email-otp",
      payload
    );

  return response.data;
}

export async function verifyEmailLink(
  payload
) {
  const response =
    await api.post(
      "/auth/verify-email-link",
      payload
    );

  return response.data;
}

export async function resendVerification(
  email
) {
  const response =
    await api.post(
      "/auth/resend-verification",
      {
        email
      }
    );

  return response.data;
}

export async function requestPasswordReset(
  email
) {
  const response =
    await api.post(
      "/password/forgot",
      {
        email
      }
    );

  return response.data;
}

export async function resetPasswordWithOtp(
  payload
) {
  const response =
    await api.post(
      "/password/reset-otp",
      payload
    );

  clearAccessToken();
  clearRememberMePreference();

  return response.data;
}

export async function resetPasswordWithLink(
  payload
) {
  const response =
    await api.post(
      "/password/reset-link",
      payload
    );

  clearAccessToken();
  clearRememberMePreference();

  return response.data;
}

export async function changePassword(
  payload
) {
  const response =
    await api.patch(
      "/password/change",
      payload
    );

  clearAccessToken();
  clearRememberMePreference();

  return response.data;
}