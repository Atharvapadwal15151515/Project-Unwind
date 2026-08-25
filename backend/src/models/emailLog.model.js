import pool from "../config/database.js";

export async function createEmailLog({
  userId = null,
  recipientEmail,
  emailType,
  brevoMessageId = null,
  deliveryStatus = "pending",
  failureReason = null,
  sentAt = null,
  deliveredAt = null
}) {
  const query = `
    INSERT INTO email_logs (
      user_id,
      recipient_email,
      email_type,
      brevo_message_id,
      delivery_status,
      failure_reason,
      sent_at,
      delivered_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `;

  const values = [
    userId,
    recipientEmail,
    emailType,
    brevoMessageId,
    deliveryStatus,
    failureReason,
    sentAt,
    deliveredAt
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function updateEmailStatus(
  emailLogId,
  deliveryStatus,
  {
    brevoMessageId = null,
    failureReason = null,
    sentAt = null,
    deliveredAt = null
  } = {}
) {
  const query = `
    UPDATE email_logs
    SET
      delivery_status = $2,
      brevo_message_id = COALESCE($3, brevo_message_id),
      failure_reason = $4,
      sent_at = COALESCE($5, sent_at),
      delivered_at = COALESCE($6, delivered_at)
    WHERE email_log_id = $1
    RETURNING *
  `;

  const values = [
    emailLogId,
    deliveryStatus,
    brevoMessageId,
    failureReason,
    sentAt,
    deliveredAt
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

export async function getEmailLogByMessageId(messageId) {
  const query = `
    SELECT *
    FROM email_logs
    WHERE brevo_message_id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [messageId]);
  return rows[0] || null;
}