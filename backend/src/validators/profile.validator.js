import {
  z
} from "zod";

const genders = [
  "male",
  "female",
  "non_binary",
  "prefer_not_to_say",
  "other"
];

const occupations = [
  "student",
  "working_professional",
  "self_employed",
  "business_owner",
  "homemaker",
  "retired",
  "unemployed",
  "other"
];

const optionalNullableText = (
  minimum,
  maximum,
  minimumMessage,
  maximumMessage
) =>
  z
    .union([
      z
        .string()
        .trim()
        .min(
          minimum,
          minimumMessage
        )
        .max(
          maximum,
          maximumMessage
        ),

      z.null()
    ])
    .optional();

export const updateProfileSchema =
  z.object({
    body: z.object({
      /*
      |--------------------------------------------------------------------------
      | Username
      |--------------------------------------------------------------------------
      */

      username: z
        .string()
        .trim()
        .min(
          3,
          "Username must be at least 3 characters"
        )
        .max(
          30,
          "Username cannot exceed 30 characters"
        )
        .regex(
          /^[a-zA-Z0-9_]+$/,
          "Username can only contain letters, numbers and underscores."
        )
        .optional(),

      /*
      |--------------------------------------------------------------------------
      | Profile fields
      |--------------------------------------------------------------------------
      */

      fullName: z
        .string()
        .trim()
        .min(
          2,
          "Full name must be at least 2 characters"
        )
        .max(
          100,
          "Full name cannot exceed 100 characters"
        )
        .optional(),

      displayName:
        optionalNullableText(
          2,
          100,
          "Display name must be at least 2 characters",
          "Display name cannot exceed 100 characters"
        ),

      dateOfBirth: z
        .union([
          z
            .string()
            .regex(
              /^\d{4}-\d{2}-\d{2}$/,
              "Date must be in YYYY-MM-DD format"
            ),

          z.null()
        ])
        .optional(),

      gender: z
        .union([
          z.enum(
            genders
          ),
          z.null()
        ])
        .optional(),

      occupationType: z
        .union([
          z.enum(
            occupations
          ),
          z.null()
        ])
        .optional()
    }),

    params: z.object({}),

    query: z.object({})
  });