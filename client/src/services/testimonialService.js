const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


/**
 * Fetch approved testimonials
 * for the landing page.
 */
export async function getPublicTestimonials() {
  const response = await fetch(
    `${API_URL}/testimonials/public`
  );

  const result =
    await response.json();

  console.log(
    "PUBLIC TESTIMONIALS RESPONSE:",
    result
  );

  if (!response.ok) {
    throw new Error(
      result.message ||
      "Failed to fetch testimonials"
    );
  }

  return result;
}


/**
 * Submit a testimonial.
 *
 * Public endpoint.
 * No authentication required.
 */
export async function submitTestimonial({
  display_name,
  testimonial_text,
  is_anonymous,
  rating
}) {
  const response = await fetch(
    `${API_URL}/testimonials`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        display_name,
        testimonial_text,
        is_anonymous,
        rating
      })
    }
  );

  const result =
    await response.json();

  console.log(
    "SUBMIT TESTIMONIAL RESPONSE:",
    result
  );

  if (!response.ok) {
    throw new Error(
      result.message ||
      "Failed to submit testimonial"
    );
  }

  return result;
}