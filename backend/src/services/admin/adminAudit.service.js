import pool
  from "../../config/database.js";


export async function getAdminAuditLogs({
  action,
  targetType,
  adminId,
  limit = 50,
  offset = 0
}) {
  const conditions = [];
  const values = [];

  let index = 1;


  if (action) {
    conditions.push(
      `aal.action = $${index}`
    );

    values.push(action);
    index++;
  }


  if (targetType) {
    conditions.push(
      `aal.target_type = $${index}`
    );

    values.push(targetType);
    index++;
  }


  if (adminId) {
    conditions.push(
      `aal.admin_id = $${index}`
    );

    values.push(adminId);
    index++;
  }


  const whereClause =
    conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";


  values.push(limit);
  const limitIndex = index;
  index++;


  values.push(offset);
  const offsetIndex = index;


  const result =
    await pool.query(
      `
        SELECT
          aal.audit_id,

          aal.admin_id,

          admin.username
            AS admin_username,

          admin.email
            AS admin_email,

          aal.action,

          aal.target_type,
          aal.target_id,

          aal.reason,

          aal.old_value,
          aal.new_value,

          aal.metadata,

          aal.ip_address,

          aal.created_at

        FROM admin_audit_logs aal

        LEFT JOIN users admin
          ON admin.user_id =
             aal.admin_id

        ${whereClause}

        ORDER BY
          aal.created_at DESC

        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      values
    );


  return result.rows;
}


export async function getAdminAuditLogById(
  auditId
) {
  const result =
    await pool.query(
      `
        SELECT
          aal.*,

          admin.username
            AS admin_username,

          admin.email
            AS admin_email

        FROM admin_audit_logs aal

        LEFT JOIN users admin
          ON admin.user_id =
             aal.admin_id

        WHERE
          aal.audit_id = $1

        LIMIT 1
      `,
      [auditId]
    );


  return result.rows[0] || null;
}