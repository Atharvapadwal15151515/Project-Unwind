import {
  verifyAdminPassword,
  createAdminAccessSession,
  revokeAdminAccessSession
} from "../../services/admin/adminAccess.service.js";

export async function verifyAdminAccessController(
  req,
  res
) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message:
          "Admin password is required"
      });
    }

    const isValid =
      await verifyAdminPassword(
        password
      );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid admin password"
      });
    }

    const session =
      await createAdminAccessSession({
        adminId:
          req.user.user_id,

        ipAddress:
          req.ip,

        userAgent:
          req.get("user-agent")
      });

    res.cookie(
  "admin_access_token",
  session.token,
  {
    httpOnly: true,

    secure:
      process.env.NODE_ENV ===
      "production",

    sameSite:
      process.env.NODE_ENV ===
      "production"
        ? "none"
        : "lax"
  }
);
    return res.status(200).json({
      success: true,

      message:
        "Admin access granted",

      expiresAt:
        session.expiresAt
    });
  } catch (error) {
    console.error(
      "Admin access verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to verify admin access"
    });
  }
}

export async function getAdminAccessStatusController(
  req,
  res
) {
  return res.status(200).json({
    success: true,
    verified: true,

    adminAccess: {
      expiresAt:
        req.adminAccess.expires_at
    }
  });
}

export async function revokeAdminAccessController(
  req,
  res
) {
  try {
    await revokeAdminAccessSession(
      req.adminAccess.session_id
    );

    res.clearCookie(
      "admin_access_token",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite:
          process.env.NODE_ENV ===
          "production"
            ? "none"
            : "lax"
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Admin access revoked successfully"
    });
  } catch (error) {
    console.error(
      "Admin access revoke error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to revoke admin access"
    });
  }
}