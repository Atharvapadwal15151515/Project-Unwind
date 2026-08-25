import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password cannot exceed 100 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]+$/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character."
  );

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Invalid email address"),

    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers and underscores."
      ),

    password: passwordSchema,

    fullName: z
      .string()
      .trim()
      .min(2, "Full name is required")
      .max(100, "Full name cannot exceed 100 characters"),

    displayName: z
      .string()
      .trim()
      .max(100, "Display name cannot exceed 100 characters")
      .optional(),

    dateOfBirth: z
      .string()
      .optional(),

    gender: z
      .enum([
        "male",
        "female",
        "non_binary",
        "prefer_not_to_say",
        "other"
      ])
      .optional(),

    occupationType: z
      .string()
      .trim()
      .max(50, "Occupation cannot exceed 50 characters")
      .optional()
  }),

  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .trim()
      .min(1, "Email or username is required"),

    password: z
      .string()
      .min(1, "Password is required")
  }),

  params: z.object({}),
  query: z.object({})
});

export const verifyEmailOTPSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Invalid email address"),

    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "OTP must contain exactly 6 digits")
  }),

  params: z.object({}),
  query: z.object({})
});

export const verifyEmailLinkSchema = z.object({
  body: z.object({
    userId: z
      .string()
      .uuid("Invalid user ID"),

    token: z
      .string()
      .trim()
      .min(1, "Verification token is required")
  }),

  params: z.object({}),
  query: z.object({})
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Invalid email address")
  }),

  params: z.object({}),
  query: z.object({})
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Invalid email address")
  }),

  params: z.object({}),
  query: z.object({})
});

export const verifyResetOTPSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .email("Invalid email address"),

    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "OTP must contain exactly 6 digits")
  }),

  params: z.object({}),
  query: z.object({})
});

export const resetPasswordSchema = z.object({
  body: z.object({
    userId: z
      .string()
      .uuid("Invalid user ID"),

    token: z
      .string()
      .trim()
      .min(1, "Reset token is required"),

    newPassword: passwordSchema
  }),

  params: z.object({}),
  query: z.object({})
});