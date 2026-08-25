import {
  getConsentStatus,
  giveConsent,
  removeConsent,
} from "../../services/dass/dassConsent.service.js";

export async function getDassConsentStatus(req, res, next) {
  try {
    const result = await getConsentStatus(req.user.user_id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function giveDassConsent(req, res, next) {
  try {
    const { consentVersion } = req.body;

    const consent = await giveConsent(
      req.user.user_id,
      consentVersion
    );

    res.status(200).json({
      success: true,
      message: "Consent saved successfully",
      data: consent,
    });
  } catch (error) {
    next(error);
  }
}

export async function revokeDassConsent(req, res, next) {
  try {
    const consent = await removeConsent(req.user.user_id);

    res.status(200).json({
      success: true,
      message: "Consent revoked successfully",
      data: consent,
    });
  } catch (error) {
    next(error);
  }
}