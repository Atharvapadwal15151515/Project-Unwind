import AppError from "../utils/AppError.js";

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      status: error.status,
      message: error.message
    });
  }

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists"
    });
  }

  if (error.code === "23503") {
    return res.status(400).json({
      success: false,
      message: "Invalid related record"
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired"
    });
  }
if (error.code === "LIMIT_FILE_SIZE") {
  return res.status(400).json({
    success: false,
    message: "Profile image cannot exceed 5 MB"
  });
}

if (
  error.message ===
  "Only JPEG, PNG and WebP images are allowed"
) {
  return res.status(400).json({
    success: false,
    message: error.message
  });
}
  return res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : error.message || "Internal server error"
  });
}