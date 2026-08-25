import {
  getConsentByUserId,
  createConsent,
  updateConsent,
  revokeConsent,
} from "../../models/dass/dassConsent.model.js";

export async function getConsentStatus(userId) {
  const consent = await getConsentByUserId(userId);

  if (!consent) {
    return {
      hasConsent: false,
      consent: null,
    };
  }

  return {
    hasConsent:
      consent.consent_given === true &&
      consent.revoked_at === null,
    consent,
  };
}

export async function giveConsent(
  userId,
  consentVersion = "1.0"
) {
  const existingConsent =
    await getConsentByUserId(userId);

  if (existingConsent) {
    return updateConsent(
      userId,
      consentVersion
    );
  }

  return createConsent(
    userId,
    consentVersion
  );
}

export async function removeConsent(userId) {
  const existingConsent =
    await getConsentByUserId(userId);

  if (!existingConsent) {
    const error = new Error(
      "Consent record not found"
    );
    error.statusCode = 404;
    throw error;
  }

  return revokeConsent(userId);
}

export async function verifyActiveConsent(userId) {
  const consent = await getConsentByUserId(userId);

  if (
    !consent ||
    consent.consent_given !== true ||
    consent.revoked_at !== null
  ) {
    const error = new Error(
      "DASS assessment consent is required"
    );
    error.statusCode = 403;
    throw error;
  }

  return consent;
}