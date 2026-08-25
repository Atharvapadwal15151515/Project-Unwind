import api from "./api";


/*
|--------------------------------------------------------------------------
| My reports
|--------------------------------------------------------------------------
*/

export async function getMyReports({
  status = null,
  limit = 50,
  offset = 0
} = {}) {
  const params = {
    limit,
    offset
  };

  if (
    status &&
    status !== "all"
  ) {
    params.status =
      status;
  }

  const response =
    await api.get(
      "/community/reports/my",
      {
        params
      }
    );

  return (
    response.data?.data ||
    []
  );
}


/*
|--------------------------------------------------------------------------
| Single report
|--------------------------------------------------------------------------
*/

export async function getMyReport(
  reportId
) {
  if (!reportId) {
    throw new Error(
      "Report ID is required."
    );
  }

  const response =
    await api.get(
      `/community/reports/my/${reportId}`
    );

  return response.data
    ?.data;
}

/*
|--------------------------------------------------------------------------
| Submit report
|--------------------------------------------------------------------------
*/

export async function submitReport({
  targetType,
  targetId,

  reportedUserId =
    null,

  reason,

  description =
    ""
}) {
  if (!targetType) {
    throw new Error(
      "Report target type is required."
    );
  }

  if (!targetId) {
    throw new Error(
      "Report target ID is required."
    );
  }

  const payload = {
    targetType,
    targetId,
    reason
  };

  if (
    reportedUserId
  ) {
    payload.reportedUserId =
      reportedUserId;
  }

  if (
    description?.trim()
  ) {
    payload.description =
      description.trim();
  }

  const response =
    await api.post(
      "/community/reports",
      payload
    );

  return response.data
    ?.data;
}