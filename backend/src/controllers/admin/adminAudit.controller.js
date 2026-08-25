import {
  getAdminAuditLogs,
  getAdminAuditLogById
} from "../../services/admin/adminAudit.service.js";


export async function getAdminAuditLogsController(
  req,
  res
) {
  try {
    const {
      action,
      targetType,
      adminId
    } = req.query;


    const limit =
      Math.min(
        Number(req.query.limit) || 50,
        100
      );


    const offset =
      Math.max(
        Number(req.query.offset) || 0,
        0
      );


    const logs =
      await getAdminAuditLogs({
        action,
        targetType,
        adminId,
        limit,
        offset
      });


    return res.status(200).json({
      success: true,

      count:
        logs.length,

      logs
    });

  } catch (error) {
    console.error(
      "Admin audit logs error:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        "Failed to load admin audit logs"
    });
  }
}


export async function getAdminAuditLogByIdController(
  req,
  res
) {
  try {
    const log =
      await getAdminAuditLogById(
        req.params.auditId
      );


    if (!log) {
      return res.status(404).json({
        success: false,
        message:
          "Audit log not found"
      });
    }


    return res.status(200).json({
      success: true,
      log
    });

  } catch (error) {
    console.error(
      "Admin audit log details error:",
      error
    );


    return res.status(500).json({
      success: false,

      message:
        "Failed to load audit log"
    });
  }
}