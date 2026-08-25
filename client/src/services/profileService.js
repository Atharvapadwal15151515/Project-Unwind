import api
  from "./api";

export async function updateProfile(
  payload
) {
  const response =
    await api.patch(
      "/profile",
      payload
    );

  return response.data;
}

export async function uploadProfilePicture(
  file
) {
  const formData =
    new FormData();

  formData.append(
    "profileImage",
    file
  );

  const response =
    await api.patch(
      "/profile/picture",
      formData
    );

  return response.data;
}

export async function removeProfilePicture() {
  const response =
    await api.delete(
      "/profile/picture"
    );

  return response.data;
}