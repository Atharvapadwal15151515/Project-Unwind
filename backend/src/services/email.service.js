import brevoClient from "../config/brevo.js";

import {
  createEmailLog,
  updateEmailStatus
} from "../models/emailLog.model.js";

/**
 * Create an email log manually.
 */
export async function logEmail({
  userId = null,
  recipientEmail,
  emailType,
  brevoMessageId = null,
  deliveryStatus = "pending",
  failureReason = null,
  sentAt = null,
  deliveredAt = null
}) {
  return createEmailLog({
    userId,
    recipientEmail,
    emailType,
    brevoMessageId,
    deliveryStatus,
    failureReason,
    sentAt,
    deliveredAt
  });
}

/**
 * Mark an email as accepted by Brevo.
 */
export async function markEmailSent(
  emailLogId,
  brevoMessageId
) {
  return updateEmailStatus(
    emailLogId,
    "sent",
    {
      brevoMessageId,
      sentAt: new Date()
    }
  );
}

/**
 * Mark an email as delivered.
 *
 * This will generally be called later through
 * a Brevo webhook.
 */
export async function markEmailDelivered(emailLogId) {
  return updateEmailStatus(
    emailLogId,
    "delivered",
    {
      deliveredAt: new Date()
    }
  );
}

/**
 * Mark an email as failed.
 */
export async function markEmailFailed(
  emailLogId,
  reason
) {
  return updateEmailStatus(
    emailLogId,
    "failed",
    {
      failureReason: reason
    }
  );
}

/**
 * Send any transactional email through Brevo.
 */
export async function sendTransactionalEmail({
  userId = null,
  recipientEmail,
  recipientName = null,
  emailType,
  subject,
  htmlContent,
  textContent = null
}) {
  const emailLog = await createEmailLog({
    userId,
    recipientEmail,
    emailType,
    deliveryStatus: "pending"
  });

  try {
    const result =
      await brevoClient.transactionalEmails.sendTransacEmail({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "UNWIND",
          email: process.env.BREVO_SENDER_EMAIL
        },

        to: [
          {
            email: recipientEmail,
            ...(recipientName
              ? { name: recipientName }
              : {})
          }
        ],

        subject,
        htmlContent,

        ...(textContent
          ? { textContent }
          : {})
      });

    await markEmailSent(
      emailLog.email_log_id,
      result.messageId
    );

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    const failureReason =
      error?.body?.message ||
      error?.response?.body?.message ||
      error?.message ||
      "Email delivery failed";

    await markEmailFailed(
      emailLog.email_log_id,
      failureReason
    );

    throw error;
  }
}

/**
 * Send one email containing both:
 * - verification OTP
 * - verification link
 */
export async function sendVerificationEmail({
  userId,
  recipientEmail,
  recipientName = null,
  otp,
  verificationToken
}) {
  const verificationUrl =
  `${process.env.FRONTEND_URL}/verify-email` +
  `?userId=${encodeURIComponent(userId)}` +
  `&token=${encodeURIComponent(verificationToken)}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </head>

      <body
        style="
          margin: 0;
          padding: 30px;
          background-color: #f5f7fb;
          font-family: Arial, sans-serif;
          color: #242424;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: 0 auto;
            padding: 32px;
            background-color: #ffffff;
            border-radius: 12px;
          "
        >
          <h2 style="margin-top: 0;">
            Verify your UNWIND account
          </h2>

          <p>
            ${
              recipientName
                ? `Hello ${recipientName},`
                : "Hello,"
            }
          </p>

          <p>
            Enter this OTP to verify your email address:
          </p>

          <div
            style="
              margin: 28px 0;
              padding: 16px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              background-color: #f2effa;
              border-radius: 8px;
            "
          >
            ${otp}
          </div>

          <p>
            You can also verify your email using the
            button below.
          </p>

          <div
            style="
              margin: 30px 0;
              text-align: center;
            "
          >
            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                padding: 13px 24px;
                background-color: #6750a4;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              "
            >
              Verify Email
            </a>
          </div>

          <p>
            The OTP expires in 10 minutes. The verification
            link expires in 30 minutes.
          </p>

          <p>
            If you did not create an UNWIND account, you can
            ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Verify your UNWIND account.

Your verification OTP is: ${otp}

You can also verify your email using this link:
${verificationUrl}

The OTP expires in 10 minutes.
The verification link expires in 30 minutes.

If you did not create this account, ignore this email.
  `.trim();

  return sendTransactionalEmail({
    userId,
    recipientEmail,
    recipientName,
    emailType: "email_verification",
    subject: "Verify your UNWIND email address",
    htmlContent,
    textContent
  });
}

export async function sendPasswordResetEmail({
  userId,
  recipientEmail,
  recipientName = null,
  otp,
  resetToken
}) {
  const resetUrl =
    `${process.env.FRONTEND_URL}/reset-password` +
    `?userId=${encodeURIComponent(userId)}` +
    `&token=${encodeURIComponent(resetToken)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </head>

      <body
        style="
          margin: 0;
          padding: 30px;
          background-color: #f5f7fb;
          font-family: Arial, sans-serif;
          color: #242424;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: 0 auto;
            padding: 32px;
            background-color: #ffffff;
            border-radius: 12px;
          "
        >
          <h2 style="margin-top: 0;">
            Reset your UNWIND password
          </h2>

          <p>
            ${
              recipientName
                ? `Hello ${recipientName},`
                : "Hello,"
            }
          </p>

          <p>
            We received a request to reset your password.
            Use this OTP:
          </p>

          <div
            style="
              margin: 28px 0;
              padding: 16px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              background-color: #f2effa;
              border-radius: 8px;
            "
          >
            ${otp}
          </div>

          <p>
            You can also reset your password using the
            button below.
          </p>

          <div
            style="
              margin: 30px 0;
              text-align: center;
            "
          >
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 13px 24px;
                background-color: #6750a4;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              "
            >
              Reset Password
            </a>
          </div>

          <p>
            The OTP expires in 10 minutes. The reset link
            expires in 30 minutes.
          </p>

          <p>
            If you did not request a password reset, ignore
            this email. Your password will remain unchanged.
          </p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Reset your UNWIND password.

Your password reset OTP is: ${otp}

You can also reset your password using this link:
${resetUrl}

The OTP expires in 10 minutes.
The reset link expires in 30 minutes.

If you did not request this reset, ignore this email.
  `.trim();

  return sendTransactionalEmail({
    userId,
    recipientEmail,
    recipientName,
    emailType: "password_reset",
    subject: "Reset your UNWIND password",
    htmlContent,
    textContent
  });
}
/**
 * Send Journal PIN reset OTP.
 */
export async function sendJournalPinResetEmail({
  userId,
  recipientEmail,
  recipientName = null,
  otp
}) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </head>

      <body
        style="
          margin: 0;
          padding: 30px;
          background-color: #f5f7fb;
          font-family: Arial, sans-serif;
          color: #242424;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: 0 auto;
            padding: 32px;
            background-color: #ffffff;
            border-radius: 12px;
          "
        >
          <h2 style="margin-top: 0;">
            Reset your UNWIND Journal PIN
          </h2>

          <p>
            ${
              recipientName
                ? `Hello ${recipientName},`
                : "Hello,"
            }
          </p>

          <p>
            We received a request to reset your
            Journal PIN. Use the OTP below to
            verify your identity:
          </p>

          <div
            style="
              margin: 28px 0;
              padding: 16px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              background-color: #f2effa;
              border-radius: 8px;
            "
          >
            ${otp}
          </div>

          <p>
            This OTP expires in 10 minutes.
          </p>

          <p>
            After verification, you will be able
            to create a new Journal PIN.
          </p>

          <p>
            If you did not request this reset,
            ignore this email. Your Journal PIN
            will remain unchanged.
          </p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Reset your UNWIND Journal PIN.

Your Journal PIN reset OTP is: ${otp}

This OTP expires in 10 minutes.

After verification, you will be able to create a new Journal PIN.

If you did not request this reset, ignore this email.
Your Journal PIN will remain unchanged.
  `.trim();

  return sendTransactionalEmail({
    userId,
    recipientEmail,
    recipientName,
    emailType:
      "journal_pin_reset",
    subject:
      "Reset your UNWIND Journal PIN",
    htmlContent,
    textContent
  });
}

/*
|--------------------------------------------------------------------------
| Send Account Deletion OTP
|--------------------------------------------------------------------------
*/

export async function sendAccountDeletionOtpEmail({
  userId,
  recipientEmail,
  recipientName = null,
  otp
}) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </head>

      <body
        style="
          margin: 0;
          padding: 30px;
          background-color: #f5f7fb;
          font-family: Arial, sans-serif;
          color: #242424;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: 0 auto;
            padding: 32px;
            background-color: #ffffff;
            border-radius: 12px;
          "
        >
          <h2 style="margin-top: 0;">
            Confirm UNWIND account deletion
          </h2>

          <p>
            ${
              recipientName
                ? `Hello ${recipientName},`
                : "Hello,"
            }
          </p>

          <p>
            We received a request to permanently
            delete your UNWIND account.
          </p>

          <p>
            Use the verification code below to
            confirm your identity:
          </p>

          <div
            style="
              margin: 28px 0;
              padding: 16px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              background-color: #f2effa;
              border-radius: 8px;
            "
          >
            ${otp}
          </div>

          <p>
            This verification code expires in
            10 minutes.
          </p>

          <p>
            Entering this code does not immediately
            delete your account. You will still need
            to confirm permanent deletion in UNWIND.
          </p>

          <p>
            If you did not request account deletion,
            ignore this email. Your account will
            remain unchanged.
          </p>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Confirm UNWIND account deletion.

${
  recipientName
    ? `Hello ${recipientName},`
    : "Hello,"
}

We received a request to permanently delete your UNWIND account.

Your account deletion verification code is: ${otp}

This verification code expires in 10 minutes.

Entering this code does not immediately delete your account.
You will still need to confirm permanent deletion in UNWIND.

If you did not request account deletion, ignore this email.
Your account will remain unchanged.
  `.trim();

  return sendTransactionalEmail({
    userId,
    recipientEmail,
    recipientName,
    emailType:
      "account_deletion",
    subject:
      "Confirm your UNWIND account deletion",
    htmlContent,
    textContent
  });
}