import api from "../../services/api";


export async function getAdminTestimonials({
  status,
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

  const response =
    await api.get(
      "/admin/testimonials",
      {
        params
      }
    );

  return {
    testimonials:
      response.data?.testimonials ||
      [],

    count:
      response.data?.count ||
      0
  };
}


export async function getAdminTestimonialById(
  testimonialId
) {
  const response =
    await api.get(
      `/admin/testimonials/${testimonialId}`
    );

  return response.data?.testimonial;
}


export async function approveAdminTestimonial(
  testimonialId,
  moderationNotes = ""
) {
  const response =
    await api.patch(
      `/admin/testimonials/${testimonialId}/approve`,
      {
        moderationNotes
      }
    );

  return response.data;
}


export async function rejectAdminTestimonial(
  testimonialId,
  moderationNotes
) {
  const response =
    await api.patch(
      `/admin/testimonials/${testimonialId}/reject`,
      {
        moderationNotes
      }
    );

  return response.data;
}