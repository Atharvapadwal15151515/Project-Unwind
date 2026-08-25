import api from "../../services/api";


export async function getAdminUsers({
  search,
  status,
  role,
  limit = 50,
  offset = 0
} = {}) {
  const params = {
    limit,
    offset
  };

  if (search?.trim()) {
    params.search =
      search.trim();
  }

  if (status) {
    params.status =
      status;
  }

  if (role) {
    params.role =
      role;
  }

  const response =
    await api.get(
      "/admin/users",
      {
        params
      }
    );

  return {
    users:
      response.data?.users ||
      [],

    count:
      response.data?.count ||
      0
  };
}


export async function getAdminUserById(
  userId
) {
  const response =
    await api.get(
      `/admin/users/${userId}`
    );

  return response.data;
}