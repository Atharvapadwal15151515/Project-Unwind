import {
  getPostHogOverview
} from "../../services/admin/posthogAnalytics.service.js";


export async function getAdminAnalyticsOverviewController(
  req,
  res
) {
  try {
    const analytics =
      await getPostHogOverview();

    return res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error(
      "Admin analytics error:",
      error.message
    );

    const configurationError =
      error.message ===
      "PostHog analytics is not configured";

    return res
      .status(
        configurationError
          ? 503
          : 502
      )
      .json({
        success: false,

        message:
          configurationError
            ? "Analytics service is not configured"
            : "Failed to load analytics"
      });
  }
}