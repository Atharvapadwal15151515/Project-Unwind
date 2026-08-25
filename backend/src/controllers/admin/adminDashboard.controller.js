import {
  getAdminDashboardStats
} from "../../services/admin/adminDashboard.service.js";


export async function getAdminDashboardController(
  req,
  res
) {
  try {
    const dashboard =
      await getAdminDashboardStats();

    return res.status(200).json({
      success: true,
      dashboard
    });

  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load admin dashboard"
    });
  }
}