export function getErrorType(error) {
  if (
    !navigator.onLine
  ) {
    return "network";
  }

  if (
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT"
  ) {
    return "timeout";
  }

  const status =
    error?.response?.status;

  if (status === 401) {
    return "unauthorized";
  }

  if (status === 403) {
    return "forbidden";
  }

  if (status === 404) {
    return "notFound";
  }

  if (status === 408) {
    return "timeout";
  }

  if (status === 422) {
    return "validation";
  }

  if (status === 429) {
    return "rateLimit";
  }

  if (
    status === 502 ||
    status === 503
  ) {
    return "maintenance";
  }

  if (status >= 500) {
    return "server";
  }

  return "error";
}