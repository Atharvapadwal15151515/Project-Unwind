import {
  getAdminUsers,
  getAdminUserById
} from "../../services/admin/adminUser.service.js";


export async function getAdminUsersController(
  req,
  res
) {
  try {
    const {
      search,
      status,
      role
    } = req.query;

    const limit =
      Math.min(
        Number(req.query.limit) || 50,
        100
      );

    const offset =
      Math.max(
        Number(req.query.offset) || 0,
        0
      );

    const users =
      await getAdminUsers({
        search,
        status,
        role,
        limit,
        offset
      });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error(
      "Admin users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load users"
    });
  }
}


export async function getAdminUserByIdController(
  req,
  res
) {
  try {
    const result =
      await getAdminUserById(
        req.params.userId
      );

    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error(
      "Admin user details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load user details"
    });
  }
}