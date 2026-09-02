import api from "../api";


export async function getAdminAnalyticsOverview() {
  const response =
    await api.get(
      "/admin/analytics/overview"
    );

  return (
    response.data?.analytics ||
    null
  );
}
