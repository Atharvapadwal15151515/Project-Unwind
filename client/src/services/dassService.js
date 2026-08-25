import api from "./api";

/*
|--------------------------------------------------------------------------
| Response helpers
|--------------------------------------------------------------------------
*/

function extractData(response) {
  return (
    response?.data?.data ??
    null
  );
}

function extractAssessmentId(
  assessment
) {
  return (
    assessment?.assessment_id ||
    assessment?.assessmentId ||
    assessment?.id ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Consent
|--------------------------------------------------------------------------
*/

export async function getDassConsentStatus() {
  const response =
    await api.get(
      "/dass/consent"
    );

  const data =
    extractData(response);

  return {
    hasConsent:
      Boolean(
        data?.hasConsent ??
        data?.has_consent
      ),

    consent:
      data?.consent ||
      null
  };
}

export async function giveDassConsent({
  consentVersion = "1.0"
} = {}) {
  const response =
    await api.post(
      "/dass/consent",
      {
        consentGiven: true,
        consentVersion
      }
    );

  return extractData(
    response
  );
}

export async function revokeDassConsent() {
  const response =
    await api.delete(
      "/dass/consent"
    );

  return extractData(
    response
  );
}

/*
|--------------------------------------------------------------------------
| Questions
|--------------------------------------------------------------------------
*/

export async function getDassQuestions() {
  const response = await api.get(
    "/dass/questions"
  );

  const responseData =
    response?.data;

  const data =
    responseData?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.questions
    )
  ) {
    return data.questions;
  }

  if (
    Array.isArray(
      responseData?.questions
    )
  ) {
    return responseData.questions;
  }

  console.error(
    "Unexpected DASS questions response:",
    responseData
  );

  return [];
}

/*
|--------------------------------------------------------------------------
| Assessment
|--------------------------------------------------------------------------
*/

export async function startDassAssessment() {
  const response =
    await api.post(
      "/dass/assessments"
    );

  return extractData(
    response
  );
}

export async function saveDassAnswer({
  assessmentId,
  questionId,
  answerValue
}) {
  if (!assessmentId) {
    throw new Error(
      "Assessment ID is required."
    );
  }

  const numericQuestionId =
    Number(questionId);

  const numericAnswerValue =
    Number(answerValue);

  if (
    !Number.isInteger(
      numericQuestionId
    ) ||
    numericQuestionId < 1
  ) {
    throw new Error(
      "A valid question ID is required."
    );
  }

  if (
    !Number.isInteger(
      numericAnswerValue
    ) ||
    numericAnswerValue < 0 ||
    numericAnswerValue > 3
  ) {
    throw new Error(
      "Answer value must be between 0 and 3."
    );
  }

  const response =
    await api.put(
      `/dass/assessments/${assessmentId}/responses`,
      {
        questionId:
          numericQuestionId,

        answerValue:
          numericAnswerValue
      }
    );

  return extractData(
    response
  );
}

export async function submitDassAssessment(
  assessmentId
) {
  if (!assessmentId) {
    throw new Error(
      "Assessment ID is required."
    );
  }

  const response =
    await api.post(
      `/dass/assessments/${assessmentId}/submit`
    );

  return extractData(
    response
  );
}

export async function abandonDassAssessment(
  assessmentId
) {
  if (!assessmentId) {
    throw new Error(
      "Assessment ID is required."
    );
  }

  const response =
    await api.patch(
      `/dass/assessments/${assessmentId}/abandon`
    );

  return extractData(
    response
  );
}

/*
|--------------------------------------------------------------------------
| History
|--------------------------------------------------------------------------
*/

export async function getDassHistory() {
  const response =
    await api.get(
      "/dass/history"
    );

  const data =
    extractData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.history
    )
  ) {
    return data.history;
  }

  if (
    Array.isArray(
      data?.assessments
    )
  ) {
    return data.assessments;
  }

  return [];
}

export async function getDassHistoryDetails(
  assessmentId
) {
  if (!assessmentId) {
    throw new Error(
      "Assessment ID is required."
    );
  }

  const response =
    await api.get(
      `/dass/history/${assessmentId}`
    );

  return extractData(
    response
  );
}

/*
|--------------------------------------------------------------------------
| Reports
|--------------------------------------------------------------------------
*/

export async function getDassReport(
  assessmentId
) {
  if (!assessmentId) {
    throw new Error(
      "Assessment ID is required."
    );
  }

  const response =
    await api.get(
      `/dass/reports/${assessmentId}`
    );

  return extractData(
    response
  );
}

export async function downloadDassReportPdf(
  assessmentId
) {
  if (!assessmentId) {
    throw new Error(
      "Assessment ID is required."
    );
  }

  const response =
    await api.get(
      `/dass/reports/${assessmentId}/pdf`,
      {
        responseType: "blob"
      }
    );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Browser download helper
|--------------------------------------------------------------------------
*/

export async function saveDassReportPdf(
  assessmentId
) {
  const pdfBlob =
    await downloadDassReportPdf(
      assessmentId
    );

  const blob =
    pdfBlob instanceof Blob
      ? pdfBlob
      : new Blob(
          [pdfBlob],
          {
            type: "application/pdf"
          }
        );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    `dass-report-${assessmentId}.pdf`;

  document.body.appendChild(
    link
  );

  link.click();
  link.remove();

  URL.revokeObjectURL(
    url
  );
}

/*
|--------------------------------------------------------------------------
| Assessment helpers
|--------------------------------------------------------------------------
*/

export function getDassAssessmentId(
  assessment
) {
  return extractAssessmentId(
    assessment
  );
}

export function getDassCurrentQuestion(
  assessment
) {
  const currentQuestion =
    Number(
      assessment?.current_question ??
      assessment?.currentQuestion ??
      1
    );

  if (
    !Number.isInteger(
      currentQuestion
    )
  ) {
    return 1;
  }

  return Math.min(
    Math.max(
      currentQuestion,
      1
    ),
    21
  );
}