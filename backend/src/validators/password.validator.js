import { z } from "zod";

const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password cannot exceed 100 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]+$/,
    "Password must contain an uppercase letter, lowercase letter, number and special character"
  );

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
  }),

  params: z.object({}),
  query: z.object({})
});

export const resetPasswordWithOTPSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Enter a valid email address"),

    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "OTP must contain exactly 6 digits"),

    newPassword: strongPasswordSchema
  }),

  params: z.object({}),
  query: z.object({})
});

export const resetPasswordWithLinkSchema = z.object({
  body: z.object({
    userId: z
      .string()
      .uuid("Invalid user ID"),

    token: z
      .string()
      .trim()
      .min(1, "Reset token is required"),

    newPassword: strongPasswordSchema
  }),

  params: z.object({}),
  query: z.object({})
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string()
        .min(1, "Current password is required"),

      newPassword: strongPasswordSchema,

      confirmPassword: z
        .string()
        .min(1, "Confirm your new password")
    })
    .refine(
      (data) =>
        data.newPassword === data.confirmPassword,
      {
        message: "New passwords do not match",
        path: ["confirmPassword"]
      }
    ),

  params: z.object({}),
  query: z.object({})
});