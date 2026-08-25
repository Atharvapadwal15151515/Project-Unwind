import api from "../../services/api";

export async function getAdminDashboard() {
  const response =
    await api.get(
      "/admin/dashboard"
    );

  return (
    response.data?.dashboard ||
    null
  );
}