import api from "../../services/api";

export async function verifyAdminAccess(
  password
) {
  const response =
    await api.post(
      "/admin/access/verify",
      {
        password
      }
    );

  return response.data;
}


export async function getAdminAccessStatus() {
  const response =
    await api.get(
      "/admin/access/status"
    );

  return response.data;
}


export async function revokeAdminAccess() {
  const response =
    await api.post(
      "/admin/access/revoke"
    );

  return response.data;
}