import api from "../../services/api";


export async function removeAdminCommunityContent(
  targetType,
  targetId,
  reason
) {
  const response =
    await api.patch(
      `/admin/community/${targetType}/${targetId}/remove`,
      {
        reason
      }
    );

  return response.data;
}


export async function restoreAdminCommunityContent(
  targetType,
  targetId,
  reason
) {
  const response =
    await api.patch(
      `/admin/community/${targetType}/${targetId}/restore`,
      {
        reason
      }
    );

  return response.data;
}