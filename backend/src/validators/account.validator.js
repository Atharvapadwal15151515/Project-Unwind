import { z } from "zod";


/*
|--------------------------------------------------------------------------
| Verify Account Deletion OTP
|--------------------------------------------------------------------------
*/

export const verifyAccountDeletionOtpSchema =
  z.object({
    otp: z
      .string()
      .trim()
      .regex(
        /^\d{6}$/,
        "OTP must contain exactly 6 digits"
      )
  });


export function validateVerifyAccountDeletionOtp(
  data
) {
  return verifyAccountDeletionOtpSchema.parse(
    data
  );
}


/*
|--------------------------------------------------------------------------
| Permanently Delete Account
|--------------------------------------------------------------------------
*/

export const deleteAccountSchema =
  z.object({
    confirmation: z.literal(
      "DELETE",
      {
        errorMap: () => ({
          message:
            "Type DELETE to confirm account deletion"
        })
      }
    ),

    deletionToken: z
      .string()
      .trim()
      .min(
        1,
        "Account deletion verification is required"
      )
      .max(
        200,
        "Invalid account deletion token"
      )
  });


export function validateDeleteAccount(
  data
) {
  return deleteAccountSchema.parse(
    data
  );
}