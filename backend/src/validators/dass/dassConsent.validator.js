import { z } from "zod";

export const giveDassConsentSchema = z.object({
  body: z.object({
    consentGiven: z.literal(true),
    consentVersion: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .default("1.0"),
  }),
});