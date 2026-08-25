import api, {
  clearAccessToken
} from "./api";

import {
  clearRememberMePreference
} from "./authService";


/*
|--------------------------------------------------------------------------
| Request Account Deletion OTP
|--------------------------------------------------------------------------
*/

export async function requestAccountDeletionOtp() {
  const response =
    await api.post(
      "/account/delete/request-otp",
      {}
    );

  return response.data;
}


/*
|--------------------------------------------------------------------------
| Verify Account Deletion OTP
|--------------------------------------------------------------------------
*/

export async function verifyAccountDeletionOtp(
  otp
) {
  const response =
    await api.post(
      "/account/delete/verify-otp",
      {
        otp
      }
    );

  return response.data;
}


/*
|--------------------------------------------------------------------------
| Permanently Delete Account
|--------------------------------------------------------------------------
*/

export async function deleteAccount({
  confirmation,
  deletionToken
}) {
  const response =
    await api.delete(
      "/account",
      {
        data: {
          confirmation,
          deletionToken
        }
      }
    );

  clearAccessToken();
  clearRememberMePreference();

  return response.data;
}