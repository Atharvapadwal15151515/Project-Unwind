import api from "../../services/api";


export async function warnAdminUser(
  userId,
  {
    reason,
    severity = "low"
  }
) {
  const response =
    await api.post(
      `/admin/moderation/users/${userId}/warn`,
      {
        reason,
        severity
      }
    );

  return response.data;
}


export async function restrictAdminUser(
  userId,
  {
    restrictionType,
    reason,
    durationMinutes
  }
) {
  const response =
    await api.post(
      `/admin/moderation/users/${userId}/restrict`,
      {
        restrictionType,
        reason,
        durationMinutes
      }
    );

  return response.data;
}


export async function suspendAdminUser(
  userId,
  {
    reason,
    durationMinutes
  }
) {
  const response =
    await api.post(
      `/admin/moderation/users/${userId}/suspend`,
      {
        reason,
        durationMinutes
      }
    );

  return response.data;
}


export async function banAdminUser(
  userId,
  reason
) {
  const response =
    await api.post(
      `/admin/moderation/users/${userId}/ban`,
      {
        reason
      }
    );

  return response.data;
}


export async function restoreAdminUser(
  userId,
  reason
) {
  const response =
    await api.post(
      `/admin/moderation/users/${userId}/restore`,
      {
        reason
      }
    );

  return response.data;
}