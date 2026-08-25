import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Journal PIN schema
|--------------------------------------------------------------------------
| PIN rules:
| - must be a string
| - must contain only numbers
| - must contain 4 to 6 digits
|
| PIN must remain a string so values such as "0048"
| do not lose their leading zeroes.
*/

const journalPinSchema = z
  .string({
    required_error:
      "Journal PIN is required",
    invalid_type_error:
      "Journal PIN must be a string"
  })
  .trim()
  .regex(
    /^\d{4,6}$/,
    "Journal PIN must contain 4 to 6 digits"
  );

/*
|--------------------------------------------------------------------------
| Create Journal PIN
|--------------------------------------------------------------------------
| POST /api/journal/security/pin
*/

export const createJournalPinSchema =
  z.object({
    body: z
      .object({
        pin: journalPinSchema,

        confirmPin:
          journalPinSchema
      })
      .strict()
      .refine(
        (data) =>
          data.pin ===
          data.confirmPin,
        {
          message:
            "Journal PIN and confirmation PIN do not match",
          path: ["confirmPin"]
        }
      )
  });

/*
|--------------------------------------------------------------------------
| Unlock Journal
|--------------------------------------------------------------------------
| POST /api/journal/security/unlock
*/

export const unlockJournalSchema =
  z.object({
    body: z
      .object({
        pin: journalPinSchema
      })
      .strict()
  });

/*
|--------------------------------------------------------------------------
| Change Journal PIN
|--------------------------------------------------------------------------
| PATCH /api/journal/security/pin
*/

export const changeJournalPinSchema =
  z.object({
    body: z
      .object({
        currentPin:
          journalPinSchema,

        newPin:
          journalPinSchema,

        confirmNewPin:
          journalPinSchema
      })
      .strict()
      .refine(
        (data) =>
          data.newPin ===
          data.confirmNewPin,
        {
          message:
            "New Journal PIN and confirmation PIN do not match",
          path: [
            "confirmNewPin"
          ]
        }
      )
      .refine(
        (data) =>
          data.currentPin !==
          data.newPin,
        {
          message:
            "New Journal PIN must be different from the current PIN",
          path: ["newPin"]
        }
      )
  });

/*
|--------------------------------------------------------------------------
| Disable Journal PIN
|--------------------------------------------------------------------------
| DELETE /api/journal/security/pin
*/

export const disableJournalPinSchema =
  z.object({
    body: z
      .object({
        currentPin:
          journalPinSchema
      })
      .strict()
  });

/*
|--------------------------------------------------------------------------
| Request Journal PIN reset OTP
|--------------------------------------------------------------------------
| POST /api/journal/security/pin/forgot
|
| No email is accepted from the frontend.
| The authenticated user's email must be loaded from the database.
*/

export const requestJournalPinResetSchema =
  z.object({
    body: z
      .object({})
      .strict()
      .optional()
  });

/*
|--------------------------------------------------------------------------
| Verify Journal PIN reset OTP
|--------------------------------------------------------------------------
| POST /api/journal/security/pin/reset/verify
*/

export const verifyJournalPinResetOtpSchema =
  z.object({
    body: z
      .object({
        otp: z
          .string({
            required_error:
              "OTP is required",
            invalid_type_error:
              "OTP must be a string"
          })
          .trim()
          .regex(
            /^\d{6}$/,
            "OTP must contain exactly 6 digits"
          )
      })
      .strict()
  });

/*
|--------------------------------------------------------------------------
| Reset Journal PIN
|--------------------------------------------------------------------------
| POST /api/journal/security/pin/reset
|
| resetToken is issued only after successful OTP verification.
| It prevents the new PIN endpoint from accepting an OTP directly.
*/

export const resetJournalPinSchema =
  z.object({
    body: z
      .object({
        resetToken: z
          .string({
            required_error:
              "Journal PIN reset token is required",
            invalid_type_error:
              "Journal PIN reset token must be a string"
          })
          .trim()
          .min(
            1,
            "Journal PIN reset token is required"
          ),

        newPin:
          journalPinSchema,

        confirmNewPin:
          journalPinSchema
      })
      .strict()
      .refine(
        (data) =>
          data.newPin ===
          data.confirmNewPin,
        {
          message:
            "New Journal PIN and confirmation PIN do not match",
          path: [
            "confirmNewPin"
          ]
        }
      )
  });

/*
|--------------------------------------------------------------------------
| Revoke current Journal unlock session
|--------------------------------------------------------------------------
| POST /api/journal/security/lock
|
| The unlock token is read from the request header,
| so this endpoint requires no request body.
*/

export const lockJournalSchema =
  z.object({
    body: z
      .object({})
      .strict()
      .optional()
  });