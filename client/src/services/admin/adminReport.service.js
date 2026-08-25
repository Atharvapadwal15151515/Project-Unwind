import api from "../../services/api";


export async function getAdminReports({
  status,
  priority,
  targetType,
  limit = 50,
  offset = 0
} = {}) {
  const params = {
    limit,
    offset
  };

  if (status) {
    params.status =
      status;
  }

  if (priority) {
    params.priority =
      priority;
  }

  if (targetType) {
    params.targetType =
      targetType;
  }

  const response =
    await api.get(
      "/admin/reports",
      {
        params
      }
    );

  return {
    reports:
      response.data?.reports ||
      [],

    count:
      response.data?.count ||
      0
  };
}


export async function getAdminReportById(
  reportId
) {
  const response =
    await api.get(
      `/admin/reports/${reportId}`
    );

  return response.data?.report;
}


export async function markAdminReportUnderReview(
  reportId,
  moderationNotes
) {
  const response =
    await api.patch(
      `/admin/reports/${reportId}/review`,
      {
        moderationNotes
      }
    );

  return response.data;
}


export async function resolveAdminReport(
  reportId,
  {
    actionTaken,
    moderationNotes
  }
) {
  const response =
    await api.patch(
      `/admin/reports/${reportId}/resolve`,
      {
        actionTaken,
        moderationNotes
      }
    );

  return response.data;
}