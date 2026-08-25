import {
  getUserDassHistory,
  getDassHistoryDetails,
} from "../../services/dass/dassHistory.service.js";

export async function getDassHistory(req, res, next) {
  try {
    const history = await getUserDassHistory(
      req.user.user_id
    );

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDassHistoryById(req, res, next) {
  try {
    const { assessmentId } = req.params;

    const details = await getDassHistoryDetails(
      req.user.user_id,
      assessmentId
    );

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
}