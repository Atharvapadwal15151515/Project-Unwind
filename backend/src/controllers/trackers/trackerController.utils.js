import AppError from "../../utils/AppError.js";

export function getAuthenticatedUserId(
  req
) {
  const userId =
    req.user?.userId ??
    req.user?.user_id ??
    req.user?.id;

  if (!userId) {
    throw new AppError(
      "Authenticated user ID is missing",
      401
    );
  }

  return userId;
}

export function sendSuccessResponse(
  res,
  {
    statusCode = 200,
    message,
    data = null
  }
) {
  return res
    .status(statusCode)
    .json({
      success: true,
      message,
      data
    });
}
