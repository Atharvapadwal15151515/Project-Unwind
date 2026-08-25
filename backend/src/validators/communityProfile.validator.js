import {
  z
} from "zod";

const anonymousAliasSchema =
  z
    .string()
    .trim()
    .min(
      3,
      "Anonymous username must contain at least 3 characters"
    )
    .max(
      30,
      "Anonymous username cannot exceed 30 characters"
    )
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Anonymous username can only contain letters, numbers and underscores"
    )
    .optional()
    .nullable();

export const selectIdentitySchema =
  z.object({
    identity_mode: z.enum(
      [
        "username",
        "anonymous"
      ],
      {
        message:
          "Identity mode must be either username or anonymous"
      }
    ),

    anonymous_alias:
      anonymousAliasSchema
  });