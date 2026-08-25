import api from "../../services/api";


export async function getAdminAuditLogs({
  action,
  targetType,
  adminId,
  limit = 50,
  offset = 0
} = {}) {
  const params = {
    limit,
    offset
  };

  if (action) {
    params.action =
      action;
  }

  if (targetType) {
    params.targetType =
      targetType;
  }

  if (adminId) {
    params.adminId =
      adminId;
  }

  const response =
    await api.get(
      "/admin/audit-logs",
      {
        params
      }
    );

  return {
    logs:
      response.data?.logs ||
      [],

    count:
      response.data?.count ||
      0
  };
}


export async function getAdminAuditLogById(
  auditId
) {
  const response =
    await api.get(
      `/admin/audit-logs/${auditId}`
    );

  return response.data?.log;
}