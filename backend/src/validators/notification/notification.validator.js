import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Shared Fields
|--------------------------------------------------------------------------
*/

const uuidSchema = z
  .string({
    required_error: "ID is required",
    invalid_type_error:
      "ID must be a string"
  })
  .uuid("ID must be a valid UUID");

const titleSchema = z
  .string({
    required_error:
      "Notification title is required",
    invalid_type_error:
      "Notification title must be a string"
  })
  .trim()
  .min(
    1,
    "Notification title cannot be empty"
  )
  .max(
    150,
    "Notification title cannot exceed 150 characters"
  );

const messageSchema = z
  .string({
    required_error:
      "Notification message is required",
    invalid_type_error:
      "Notification message must be a string"
  })
  .trim()
  .min(
    1,
    "Notification message cannot be empty"
  )
  .max(
    5000,
    "Notification message cannot exceed 5000 characters"
  );

const notificationTypeSchema = z.enum(
  [
    "system",
    "announcement",
    "community",
    "journal",
    "tracker",
    "water",
    "sleep",
    "habit",
    "mood",
    "energy",
    "toolkit",
    "chatbot",
    "security"
  ],
  {
    required_error:
      "Notification type is required",
    invalid_type_error:
      "Notification type is invalid"
  }
);

const audienceTypeSchema = z.enum(
  [
    "global",
    "individual",
    "selected_users"
  ],
  {
    required_error:
      "Audience type is required",
    invalid_type_error:
      "Audience type is invalid"
  }
);

const prioritySchema = z.enum(
  [
    "low",
    "normal",
    "high",
    "urgent"
  ],
  {
    invalid_type_error:
      "Notification priority is invalid"
  }
);

const actionUrlSchema = z
  .string({
    invalid_type_error:
      "Action URL must be a string"
  })
  .trim()
  .max(
    1000,
    "Action URL cannot exceed 1000 characters"
  )
  .nullable()
  .optional();

const iconNameSchema = z
  .string({
    invalid_type_error:
      "Icon name must be a string"
  })
  .trim()
  .max(
    100,
    "Icon name cannot exceed 100 characters"
  )
  .nullable()
  .optional();

const referenceTypeSchema = z
  .string({
    invalid_type_error:
      "Reference type must be a string"
  })
  .trim()
  .max(
    50,
    "Reference type cannot exceed 50 characters"
  )
  .nullable()
  .optional();

const referenceIdSchema = z
  .union([
    z
      .string()
      .uuid(
        "Reference ID must be a valid UUID"
      ),
    z.null()
  ])
  .optional();

const dateTimeSchema = z
  .string({
    invalid_type_error:
      "Date and time must be a string"
  })
  .datetime({
    offset: true,
    message:
      "Date and time must be a valid ISO datetime"
  });

const booleanQuerySchema = z
  .enum([
    "true",
    "false"
  ])
  .transform(
    value => value === "true"
  );

const pageSchema = z
  .string()
  .regex(
    /^\d+$/,
    "Page must be a positive integer"
  )
  .transform(Number)
  .refine(
    value => value >= 1,
    "Page must be at least 1"
  );

const limitSchema = z
  .string()
  .regex(
    /^\d+$/,
    "Limit must be a positive integer"
  )
  .transform(Number)
  .refine(
    value =>
      value >= 1 &&
      value <= 100,
    "Limit must be between 1 and 100"
  );

/*
|--------------------------------------------------------------------------
| Notification ID Parameter
|--------------------------------------------------------------------------
*/

export const notificationIdParamSchema =
  z.object({
    params: z.object({
      notificationId:
        uuidSchema
    }),

    body: z
      .object({})
      .passthrough()
      .optional(),

    query: z
      .object({})
      .passthrough()
      .optional()
  });

/*
|--------------------------------------------------------------------------
| User Notification ID Parameter
|--------------------------------------------------------------------------
*/

export const userNotificationIdParamSchema =
  z.object({
    params: z.object({
      userNotificationId:
        uuidSchema
    }),

    body: z
      .object({})
      .passthrough()
      .optional(),

    query: z
      .object({})
      .passthrough()
      .optional()
  });

/*
|--------------------------------------------------------------------------
| Create Notification
|--------------------------------------------------------------------------
*/

export const createNotificationSchema =
  z
    .object({
      body: z.object({
        title:
          titleSchema,

        message:
          messageSchema,

        notificationType:
          notificationTypeSchema,

        audienceType:
          audienceTypeSchema,

        priority:
          prioritySchema
            .default(
              "normal"
            ),

        iconName:
          iconNameSchema,

        actionUrl:
          actionUrlSchema,

        referenceType:
          referenceTypeSchema,

        referenceId:
          referenceIdSchema,

        metadata: z
          .record(
            z.any()
          )
          .default({}),

        startsAt:
          dateTimeSchema
            .optional(),

        expiresAt:
          dateTimeSchema
            .nullable()
            .optional(),

        isActive: z
          .boolean({
            invalid_type_error:
              "isActive must be a boolean"
          })
          .default(true),

        userIds: z
          .array(
            uuidSchema
          )
          .min(
            1,
            "At least one user ID is required"
          )
          .max(
            1000,
            "A maximum of 1000 users can be selected"
          )
          .optional()
      }),

      params: z
        .object({})
        .passthrough()
        .optional(),

      query: z
        .object({})
        .passthrough()
        .optional()
    })
    .superRefine(
      (
        data,
        context
      ) => {
        const {
          audienceType,
          userIds,
          startsAt,
          expiresAt
        } = data.body;

        if (
          audienceType ===
            "individual" &&
          (
            !userIds ||
            userIds.length !== 1
          )
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "body",
              "userIds"
            ],
            message:
              "Exactly one user ID is required for an individual notification"
          });
        }

        if (
          audienceType ===
            "selected_users" &&
          (
            !userIds ||
            userIds.length < 1
          )
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "body",
              "userIds"
            ],
            message:
              "At least one user ID is required for selected users"
          });
        }

        if (
          audienceType ===
            "global" &&
          userIds &&
          userIds.length > 0
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "body",
              "userIds"
            ],
            message:
              "User IDs must not be provided for a global notification"
          });
        }

        if (
          startsAt &&
          expiresAt &&
          new Date(
            expiresAt
          ) <=
            new Date(
              startsAt
            )
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "body",
              "expiresAt"
            ],
            message:
              "Expiration time must be after the start time"
          });
        }
      }
    );

/*
|--------------------------------------------------------------------------
| Update Notification
|--------------------------------------------------------------------------
*/

export const updateNotificationSchema =
  z
    .object({
      params: z.object({
        notificationId:
          uuidSchema
      }),

      body: z
        .object({
          title:
            titleSchema
              .optional(),

          message:
            messageSchema
              .optional(),

          notificationType:
            notificationTypeSchema
              .optional(),

          priority:
            prioritySchema
              .optional(),

          iconName:
            iconNameSchema,

          actionUrl:
            actionUrlSchema,

          referenceType:
            referenceTypeSchema,

          referenceId:
            referenceIdSchema,

          metadata: z
            .record(
              z.any()
            )
            .optional(),

          startsAt:
            dateTimeSchema
              .optional(),

          expiresAt:
            dateTimeSchema
              .nullable()
              .optional(),

          isActive: z
            .boolean({
              invalid_type_error:
                "isActive must be a boolean"
            })
            .optional()
        })
        .refine(
          body =>
            Object.keys(
              body
            ).length > 0,
          {
            message:
              "At least one notification field must be provided"
          }
        ),

      query: z
        .object({})
        .passthrough()
        .optional()
    })
    .superRefine(
      (
        data,
        context
      ) => {
        const {
          startsAt,
          expiresAt
        } = data.body;

        if (
          startsAt &&
          expiresAt &&
          new Date(
            expiresAt
          ) <=
            new Date(
              startsAt
            )
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: [
              "body",
              "expiresAt"
            ],
            message:
              "Expiration time must be after the start time"
          });
        }
      }
    );

/*
|--------------------------------------------------------------------------
| List User Notifications
|--------------------------------------------------------------------------
*/

export const listNotificationsSchema =
  z.object({
    query: z.object({
      page:
        pageSchema
          .default("1"),

      limit:
        limitSchema
          .default("20"),

      notificationType:
        notificationTypeSchema
          .optional(),

      priority:
        prioritySchema
          .optional(),

      unreadOnly:
        booleanQuerySchema
          .optional(),

      includeDismissed:
  booleanQuerySchema
    .optional(),

dismissedOnly:
  booleanQuerySchema
    .optional(),

search: z
        .string({
          invalid_type_error:
            "Search must be a string"
        })
        .trim()
        .min(
          1,
          "Search cannot be empty"
        )
        .max(
          100,
          "Search cannot exceed 100 characters"
        )
        .optional()
    }),

    params: z
      .object({})
      .passthrough()
      .optional(),

    body: z
      .object({})
      .passthrough()
      .optional()
  });

/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

export const markNotificationReadSchema =
  notificationIdParamSchema;

export const dismissNotificationSchema =
  notificationIdParamSchema;

export const deleteUserNotificationSchema =
  notificationIdParamSchema;

/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
*/

export const markAllNotificationsReadSchema =
  z.object({
    body: z
      .object({})
      .passthrough()
      .optional(),

    params: z
      .object({})
      .passthrough()
      .optional(),

    query: z
      .object({})
      .passthrough()
      .optional()
  });