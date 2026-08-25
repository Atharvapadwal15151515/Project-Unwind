import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Reusable tracker validation schemas
|--------------------------------------------------------------------------
*/

export const uuidSchema = z
  .string({
    required_error: "ID is required"
  })
  .uuid("ID must be a valid UUID");

export const dateSchema = z
  .string({
    required_error: "Date is required"
  })
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use YYYY-MM-DD format"
  );

export const timeSchema = z
  .string({
    required_error: "Time is required"
  })
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
    "Time must use HH:mm or HH:mm:ss format"
  );

export const timestampSchema = z
  .string({
    required_error: "Timestamp is required"
  })
  .datetime({
    offset: true,
    message:
      "Timestamp must be a valid ISO 8601 datetime with timezone"
  });

export const optionalNullableTimestampSchema =
  timestampSchema
    .nullable()
    .optional();

export const optionalNullableText = (
  maximumLength,
  fieldName
) =>
  z
    .string({
      invalid_type_error:
        `${fieldName} must be a string`
    })
    .trim()
    .max(
      maximumLength,
      `${fieldName} cannot exceed ${maximumLength} characters`
    )
    .nullable()
    .optional();

export const requiredTrimmedText = (
  minimumLength,
  maximumLength,
  fieldName
) =>
  z
    .string({
      required_error:
        `${fieldName} is required`,
      invalid_type_error:
        `${fieldName} must be a string`
    })
    .trim()
    .min(
      minimumLength,
      `${fieldName} must contain at least ${minimumLength} character${minimumLength === 1 ? "" : "s"}`
    )
    .max(
      maximumLength,
      `${fieldName} cannot exceed ${maximumLength} characters`
    );

export const uuidArraySchema = (
  fieldName,
  maximumItems = 20
) =>
  z
    .array(
      z
        .string()
        .uuid(
          `${fieldName} must contain valid UUIDs`
        )
    )
    .max(
      maximumItems,
      `${fieldName} cannot contain more than ${maximumItems} items`
    )
    .transform((ids) => [
      ...new Set(ids)
    ]);

export const optionalUuidArraySchema = (
  fieldName,
  maximumItems = 20
) =>
  uuidArraySchema(
    fieldName,
    maximumItems
  ).optional();

export const pageQuerySchema = z
  .string()
  .regex(
    /^\d+$/,
    "Page must be a positive integer"
  )
  .optional();

export const limitQuerySchema = z
  .string()
  .regex(
    /^\d+$/,
    "Limit must be a positive integer"
  )
  .optional();

export const booleanQuerySchema = z
  .union([
    z.literal("true"),
    z.literal("false"),
    z.literal("1"),
    z.literal("0")
  ])
  .optional();

export const sortOrderQuerySchema = z
  .enum([
    "asc",
    "desc"
  ])
  .optional();

export function addPaginationIssues(
  query,
  context,
  maximumLimit = 100
) {
  if (
    query.page &&
    Number(query.page) < 1
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["page"],
      message: "Page must be at least 1"
    });
  }

  if (
    query.limit &&
    Number(query.limit) < 1
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["limit"],
      message: "Limit must be at least 1"
    });
  }

  if (
    query.limit &&
    Number(query.limit) > maximumLimit
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["limit"],
      message:
        `Limit cannot exceed ${maximumLimit}`
    });
  }
}

export function addDateRangeIssue(
  query,
  context,
  startField = "startDate",
  endField = "endDate"
) {
  if (
    query[startField] &&
    query[endField] &&
    query[startField] >
      query[endField]
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [endField],
      message:
        `${endField} cannot be earlier than ${startField}`
    });
  }
}

export function requireAtLeastOneField(
  data,
  context,
  message
) {
  const suppliedFields =
    Object.values(data).filter(
      (value) =>
        value !== undefined
    );

  if (
    suppliedFields.length === 0
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message
    });
  }
}

export const emptyBodySchema = z
  .object({})
  .passthrough()
  .optional();

export const emptyParamsSchema =
  z.object({});

export const emptyQuerySchema =
  z.object({});
