import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

import {
  DEFAULT_TRANSCRIPTION_PROVIDER,
  DEFAULT_TRANSCRIPTION_MODEL,
  DEFAULT_TRANSCRIPTION_LANGUAGE,
  TRANSCRIPTION_PROVIDER,
  TRANSCRIPTION_PROVIDER_VALUES,
  MAX_TRANSCRIPTION_RETRIES
} from "./voice.constants.js";

/*
|--------------------------------------------------------------------------
| Provider Configuration
|--------------------------------------------------------------------------
*/

const PROVIDER_CONFIG = {
  [TRANSCRIPTION_PROVIDER.GROQ]: {
    baseURL:
      "https://api.groq.com/openai/v1",

    endpoint:
      "/audio/transcriptions",

    apiKey:
      process.env.GROQ_API_KEY
  },

  [TRANSCRIPTION_PROVIDER.OPENAI]: {
    baseURL:
      "https://api.openai.com/v1",

    endpoint:
      "/audio/transcriptions",

    apiKey:
      process.env.OPENAI_API_KEY
  },

  [TRANSCRIPTION_PROVIDER.GOOGLE]: {
    apiKey:
      process.env.GOOGLE_API_KEY
  },

  [TRANSCRIPTION_PROVIDER.AZURE]: {
    apiKey:
      process.env.AZURE_SPEECH_KEY,

    region:
      process.env.AZURE_SPEECH_REGION
  }
};

/*
|--------------------------------------------------------------------------
| Error
|--------------------------------------------------------------------------
*/

export class VoiceTranscriptionError extends Error {
  constructor(
    message,
    statusCode = 500,
    provider = null
  ) {
    super(message);

    this.name =
      "VoiceTranscriptionError";

    this.statusCode =
      statusCode;

    this.provider =
      provider;
  }
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

export function providerExists(
  provider
) {
  return TRANSCRIPTION_PROVIDER_VALUES.includes(
    provider
  );
}

export function resolveProvider(
  provider
) {
  if (
    provider &&
    providerExists(provider)
  ) {
    return provider;
  }

  return DEFAULT_TRANSCRIPTION_PROVIDER;
}

export function resolveModel(
  model
) {
  if (
    typeof model === "string" &&
    model.trim()
  ) {
    return model.trim();
  }

  return DEFAULT_TRANSCRIPTION_MODEL;
}

export function resolveLanguage(
  language
) {
  if (
    typeof language === "string" &&
    language.trim()
  ) {
    return language.trim();
  }

  return DEFAULT_TRANSCRIPTION_LANGUAGE;
}

/*
|--------------------------------------------------------------------------
| File Validation
|--------------------------------------------------------------------------
*/

export function ensureAudioFileExists(
  audioPath
) {
  if (
    !audioPath ||
    typeof audioPath !== "string"
  ) {
    throw new VoiceTranscriptionError(
      "Audio file path is required.",
      400
    );
  }

  if (
    !fs.existsSync(audioPath)
  ) {
    throw new VoiceTranscriptionError(
      "Audio file does not exist.",
      404
    );
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| Provider Validation
|--------------------------------------------------------------------------
*/

export function ensureProviderConfigured(
  provider
) {
  const config =
    PROVIDER_CONFIG[
      provider
    ];

  if (!config) {
    throw new VoiceTranscriptionError(
      "Unsupported transcription provider.",
      400,
      provider
    );
  }

  switch (provider) {
    case TRANSCRIPTION_PROVIDER.GROQ:
    case TRANSCRIPTION_PROVIDER.OPENAI:
      if (!config.apiKey) {
        throw new VoiceTranscriptionError(
          `${provider} API key is missing.`,
          500,
          provider
        );
      }
      break;

    case TRANSCRIPTION_PROVIDER.GOOGLE:
      if (!config.apiKey) {
        throw new VoiceTranscriptionError(
          "Google Speech API key is missing.",
          500,
          provider
        );
      }
      break;

    case TRANSCRIPTION_PROVIDER.AZURE:
      if (
        !config.apiKey ||
        !config.region
      ) {
        throw new VoiceTranscriptionError(
          "Azure Speech configuration is incomplete.",
          500,
          provider
        );
      }
      break;

    default:
      break;
  }

  return config;
}

/*
|--------------------------------------------------------------------------
| Multipart Builder
|--------------------------------------------------------------------------
*/

export function buildMultipartRequest(
  {
    audioPath,
    model,
    language
  }
) {
  ensureAudioFileExists(
    audioPath
  );

  const form =
    new FormData();

  form.append(
    "file",
    fs.createReadStream(
      audioPath
    ),
    {
      filename:
        path.basename(
          audioPath
        )
    }
  );

  form.append(
    "model",
    model
  );

  if (language) {
    form.append(
      "language",
      language
    );
  }

  form.append(
    "response_format",
    "verbose_json"
  );

  return form;
}

/*
|--------------------------------------------------------------------------
| Axios Builder
|--------------------------------------------------------------------------
*/

export function createAxiosClient(
  provider
) {
  const config =
    ensureProviderConfigured(
      provider
    );

  return axios.create({
    baseURL:
      config.baseURL,

    timeout: 300000,

    headers: {
      Authorization: `Bearer ${config.apiKey}`
    }
  });
}

/*
|--------------------------------------------------------------------------
| Normalize Provider Response
|--------------------------------------------------------------------------
*/

export function normalizeTranscriptResponse(
  provider,
  response
) {
  if (!response) {
    throw new VoiceTranscriptionError(
      "Empty transcription response.",
      500,
      provider
    );
  }

  return {
    provider,

    transcript:
      response.text ??
      "",

    language:
      response.language ??
      null,

    duration:
      response.duration ??
      null,

    segments:
      response.segments ??
      [],

    words:
      response.words ??
      [],

    confidence:
      null,

    raw:
      response
  };
}

/*
|--------------------------------------------------------------------------
| Retry Helper
|--------------------------------------------------------------------------
*/

export async function executeWithRetry(
  callback,
  retries = MAX_TRANSCRIPTION_RETRIES
) {
  let attempt = 0;
  let lastError;

  while (
    attempt <= retries
  ) {
    try {
      return await callback();
    } catch (error) {
      lastError = error;

      if (
        attempt === retries
      ) {
        break;
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1000 *
              (attempt + 1)
          )
      );

      attempt++;
    }
  }

  throw lastError;
}

/*
|--------------------------------------------------------------------------
| Temporary Placeholder
|--------------------------------------------------------------------------
|
| These are implemented in the next parts.
|
*/

/*
|--------------------------------------------------------------------------
| Groq Error Helpers
|--------------------------------------------------------------------------
*/

function getGroqErrorMessage(error) {
  const responseData =
    error?.response?.data;

  if (
    typeof responseData ===
    "string"
  ) {
    return responseData;
  }

  return (
    responseData?.error?.message ||
    responseData?.message ||
    error?.message ||
    "Groq transcription failed."
  );
}

function getGroqErrorStatus(error) {
  return (
    error?.response?.status ||
    error?.statusCode ||
    500
  );
}

function isRetryableGroqError(error) {
  const statusCode =
    getGroqErrorStatus(error);

  return [
    408,
    409,
    425,
    429,
    500,
    502,
    503,
    504
  ].includes(statusCode);
}

function convertGroqError(error) {
  if (
    error instanceof
    VoiceTranscriptionError
  ) {
    return error;
  }

  const statusCode =
    getGroqErrorStatus(error);

  const providerMessage =
    getGroqErrorMessage(error);

  let message =
    providerMessage;

  switch (statusCode) {
    case 400:
      message =
        providerMessage ||
        "The audio file or transcription request is invalid.";
      break;

    case 401:
      message =
        "The Groq API key is invalid or missing.";
      break;

    case 403:
      message =
        "Groq denied access to the requested transcription model.";
      break;

    case 404:
      message =
        "The Groq transcription endpoint or model was not found.";
      break;

    case 413:
      message =
        "The audio file is too large for Groq transcription.";
      break;

    case 415:
      message =
        "The uploaded audio format is not supported by Groq.";
      break;

    case 422:
      message =
        providerMessage ||
        "Groq could not process the supplied audio file.";
      break;

    case 429:
      message =
        "The Groq free-tier rate limit has been reached. Try again later.";
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      message =
        "Groq transcription is temporarily unavailable.";
      break;

    default:
      break;
  }

  return new VoiceTranscriptionError(
    message,
    statusCode,
    TRANSCRIPTION_PROVIDER.GROQ
  );
}

/*
|--------------------------------------------------------------------------
| Groq Response Validation
|--------------------------------------------------------------------------
*/

function ensureGroqTranscriptExists(
  responseData
) {
  if (
    !responseData ||
    typeof responseData !==
      "object"
  ) {
    throw new VoiceTranscriptionError(
      "Groq returned an invalid transcription response.",
      502,
      TRANSCRIPTION_PROVIDER.GROQ
    );
  }

  const transcript =
    responseData.text;

  if (
    typeof transcript !==
      "string" ||
    !transcript.trim()
  ) {
    throw new VoiceTranscriptionError(
      "Groq returned an empty transcript.",
      422,
      TRANSCRIPTION_PROVIDER.GROQ
    );
  }

  return transcript.trim();
}

/*
|--------------------------------------------------------------------------
| Groq Request Builder
|--------------------------------------------------------------------------
*/

function buildGroqMultipartRequest({
  audioPath,
  model,
  language,
  prompt = null,
  temperature = 0,
  includeWordTimestamps = false
}) {
  const form =
    buildMultipartRequest({
      audioPath,
      model,
      language
    });

  if (
    typeof prompt === "string" &&
    prompt.trim()
  ) {
    form.append(
      "prompt",
      prompt.trim()
    );
  }

  const normalizedTemperature =
    Number(temperature);

  form.append(
    "temperature",
    Number.isFinite(
      normalizedTemperature
    )
      ? String(
          Math.min(
            1,
            Math.max(
              0,
              normalizedTemperature
            )
          )
        )
      : "0"
  );

  form.append(
    "timestamp_granularities[]",
    "segment"
  );

  if (includeWordTimestamps) {
    form.append(
      "timestamp_granularities[]",
      "word"
    );
  }

  return form;
}

/*
|--------------------------------------------------------------------------
| Groq Transcription Request
|--------------------------------------------------------------------------
*/

async function sendGroqTranscriptionRequest({
  audioPath,
  model,
  language,
  prompt,
  temperature,
  includeWordTimestamps
}) {
  const config =
    ensureProviderConfigured(
      TRANSCRIPTION_PROVIDER.GROQ
    );

  const client =
    createAxiosClient(
      TRANSCRIPTION_PROVIDER.GROQ
    );

  const form =
    buildGroqMultipartRequest({
      audioPath,
      model,
      language,
      prompt,
      temperature,
      includeWordTimestamps
    });

  const response =
    await client.post(
      config.endpoint,
      form,
      {
        headers: {
          ...form.getHeaders()
        },

        maxBodyLength:
          Infinity,

        maxContentLength:
          Infinity
      }
    );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Groq Transcription
|--------------------------------------------------------------------------
*/

async function transcribeWithGroq({
  audioPath,
  model =
    DEFAULT_TRANSCRIPTION_MODEL,
  language =
    DEFAULT_TRANSCRIPTION_LANGUAGE,
  prompt = null,
  temperature = 0,
  includeWordTimestamps = false,
  retries = 2
}) {
  ensureAudioFileExists(
    audioPath
  );

  ensureProviderConfigured(
    TRANSCRIPTION_PROVIDER.GROQ
  );

  const resolvedModel =
    resolveModel(model);

  const resolvedLanguage =
    resolveLanguage(language);

  const safeRetries =
    Math.min(
      Math.max(
        Number(retries) || 0,
        0
      ),
      MAX_TRANSCRIPTION_RETRIES
    );

  let attempt = 0;
  let lastError = null;

  while (
    attempt <= safeRetries
  ) {
    try {
      const responseData =
        await sendGroqTranscriptionRequest({
          audioPath,
          model:
            resolvedModel,
          language:
            resolvedLanguage,
          prompt,
          temperature,
          includeWordTimestamps
        });

      const transcript =
        ensureGroqTranscriptExists(
          responseData
        );

      const normalized =
        normalizeTranscriptResponse(
          TRANSCRIPTION_PROVIDER.GROQ,
          responseData
        );

      return {
        ...normalized,

        transcript,

        model:
          resolvedModel,

        requestedLanguage:
          resolvedLanguage,

        detectedLanguage:
          responseData.language ??
          resolvedLanguage ??
          null,

        durationSeconds:
          responseData.duration ??
          null,

        segments:
          Array.isArray(
            responseData.segments
          )
            ? responseData.segments
            : [],

        words:
          Array.isArray(
            responseData.words
          )
            ? responseData.words
            : [],

        requestId:
          responseData.x_groq?.id ??
          null,

        attemptCount:
          attempt + 1
      };
    } catch (error) {
      const convertedError =
        convertGroqError(error);

      lastError =
        convertedError;

      const shouldRetry =
        isRetryableGroqError(
          error
        );

      if (
        !shouldRetry ||
        attempt >= safeRetries
      ) {
        throw convertedError;
      }

      const delay =
        Math.min(
          1000 *
            2 ** attempt,
          10000
        );

      await new Promise(
        (resolve) => {
          setTimeout(
            resolve,
            delay
          );
        }
      );

      attempt++;
    }
  }

  throw (
    lastError ||
    new VoiceTranscriptionError(
      "Groq transcription failed.",
      500,
      TRANSCRIPTION_PROVIDER.GROQ
    )
  );
}

/*
|--------------------------------------------------------------------------
| Transcription Input Validation
|--------------------------------------------------------------------------
*/

function validateTranscriptionInput({
  audioPath,
  provider,
  model,
  language,
  prompt,
  temperature,
  retries
}) {
  ensureAudioFileExists(
    audioPath
  );

  const resolvedProvider =
    resolveProvider(
      provider
    );

  if (
    resolvedProvider !==
    TRANSCRIPTION_PROVIDER.GROQ
  ) {
    throw new VoiceTranscriptionError(
      "Only Groq transcription is currently supported.",
      400,
      resolvedProvider
    );
  }

  if (
    model !== undefined &&
    (
      typeof model !==
        "string" ||
      !model.trim()
    )
  ) {
    throw new VoiceTranscriptionError(
      "Transcription model must be a valid string.",
      400,
      resolvedProvider
    );
  }

  if (
    language !== undefined &&
    language !== null &&
    (
      typeof language !==
        "string" ||
      !language.trim()
    )
  ) {
    throw new VoiceTranscriptionError(
      "Transcription language must be a valid string.",
      400,
      resolvedProvider
    );
  }

  if (
    prompt !== undefined &&
    prompt !== null &&
    typeof prompt !==
      "string"
  ) {
    throw new VoiceTranscriptionError(
      "Transcription prompt must be a string.",
      400,
      resolvedProvider
    );
  }

  if (
    temperature !== undefined
  ) {
    const normalizedTemperature =
      Number(
        temperature
      );

    if (
      !Number.isFinite(
        normalizedTemperature
      ) ||
      normalizedTemperature < 0 ||
      normalizedTemperature > 1
    ) {
      throw new VoiceTranscriptionError(
        "Transcription temperature must be between 0 and 1.",
        400,
        resolvedProvider
      );
    }
  }

  if (
    retries !== undefined
  ) {
    const normalizedRetries =
      Number(
        retries
      );

    if (
      !Number.isInteger(
        normalizedRetries
      ) ||
      normalizedRetries < 0 ||
      normalizedRetries >
        MAX_TRANSCRIPTION_RETRIES
    ) {
      throw new VoiceTranscriptionError(
        `Transcription retries must be between 0 and ${MAX_TRANSCRIPTION_RETRIES}.`,
        400,
        resolvedProvider
      );
    }
  }

  return {
    provider:
      resolvedProvider,

    model:
      resolveModel(
        model
      ),

    language:
      resolveLanguage(
        language
      )
  };
}

/*
|--------------------------------------------------------------------------
| Transcript Result Normalization
|--------------------------------------------------------------------------
*/

function buildTranscriptionResult({
  result,
  provider,
  model,
  requestedLanguage
}) {
  const transcript =
    typeof result?.transcript ===
      "string"
      ? result.transcript.trim()
      : "";

  if (!transcript) {
    throw new VoiceTranscriptionError(
      "The transcription provider returned an empty transcript.",
      422,
      provider
    );
  }

  const durationValue =
    Number(
      result.durationSeconds ??
        result.duration
    );

  const confidenceValue =
    Number(
      result.confidence
    );

  return {
    transcript,

    originalTranscript:
      transcript,

    provider,

    model:
      result.model ??
      model ??
      null,

    language:
      result.detectedLanguage ??
      result.language ??
      requestedLanguage ??
      null,

    requestedLanguage:
      requestedLanguage ??
      null,

    durationSeconds:
      Number.isFinite(
        durationValue
      )
        ? durationValue
        : null,

    confidence:
      Number.isFinite(
        confidenceValue
      )
        ? confidenceValue
        : null,

    segments:
      Array.isArray(
        result.segments
      )
        ? result.segments
        : [],

    words:
      Array.isArray(
        result.words
      )
        ? result.words
        : [],

    requestId:
      result.requestId ??
      null,

    attemptCount:
      result.attemptCount ??
      1,

    transcribedAt:
      new Date()
        .toISOString(),

    raw:
      result.raw ??
      null
  };
}

/*
|--------------------------------------------------------------------------
| Public Transcription Function
|--------------------------------------------------------------------------
*/

export async function transcribeAudio({
  audioPath,
  provider =
    DEFAULT_TRANSCRIPTION_PROVIDER,
  model =
    DEFAULT_TRANSCRIPTION_MODEL,
  language =
    DEFAULT_TRANSCRIPTION_LANGUAGE,
  prompt = null,
  temperature = 0,
  includeWordTimestamps = false,
  retries = 2
}) {
  const validated =
    validateTranscriptionInput({
      audioPath,
      provider,
      model,
      language,
      prompt,
      temperature,
      retries
    });

  try {
    let result;

    switch (
      validated.provider
    ) {
      case TRANSCRIPTION_PROVIDER.GROQ:
        result =
          await transcribeWithGroq({
            audioPath,

            model:
              validated.model,

            language:
              validated.language,

            prompt,

            temperature,

            includeWordTimestamps:
              Boolean(
                includeWordTimestamps
              ),

            retries
          });
        break;

      default:
        throw new VoiceTranscriptionError(
          "Unsupported transcription provider.",
          400,
          validated.provider
        );
    }

    return buildTranscriptionResult({
      result,

      provider:
        validated.provider,

      model:
        validated.model,

      requestedLanguage:
        validated.language
    });
  } catch (error) {
    if (
      error instanceof
      VoiceTranscriptionError
    ) {
      throw error;
    }

    throw new VoiceTranscriptionError(
      error?.message ||
        "Voice transcription failed.",
      error?.statusCode ||
        500,
      validated.provider
    );
  }
}

/*
|--------------------------------------------------------------------------
| Retry Existing Transcription
|--------------------------------------------------------------------------
*/

export async function retryAudioTranscription({
  audioPath,
  provider =
    DEFAULT_TRANSCRIPTION_PROVIDER,
  model =
    DEFAULT_TRANSCRIPTION_MODEL,
  language =
    DEFAULT_TRANSCRIPTION_LANGUAGE,
  prompt = null,
  temperature = 0,
  includeWordTimestamps = false,
  currentRetryCount = 0
}) {
  const normalizedRetryCount =
    Number(
      currentRetryCount
    );

  if (
    !Number.isInteger(
      normalizedRetryCount
    ) ||
    normalizedRetryCount < 0
  ) {
    throw new VoiceTranscriptionError(
      "Current retry count must be a non-negative integer.",
      400,
      provider
    );
  }

  if (
    normalizedRetryCount >=
    MAX_TRANSCRIPTION_RETRIES
  ) {
    throw new VoiceTranscriptionError(
      "Maximum transcription retry limit has been reached.",
      429,
      provider
    );
  }

  const result =
    await transcribeAudio({
      audioPath,
      provider,
      model,
      language,
      prompt,
      temperature,
      includeWordTimestamps,
      retries: 1
    });

  return {
    ...result,

    retryCount:
      normalizedRetryCount +
      1
  };
}

/*
|--------------------------------------------------------------------------
| Transcription Availability
|--------------------------------------------------------------------------
*/

export function isVoiceTranscriptionConfigured(
  provider =
    DEFAULT_TRANSCRIPTION_PROVIDER
) {
  const resolvedProvider =
    resolveProvider(
      provider
    );

  if (
    resolvedProvider !==
    TRANSCRIPTION_PROVIDER.GROQ
  ) {
    return false;
  }

  return Boolean(
    PROVIDER_CONFIG[
      TRANSCRIPTION_PROVIDER
        .GROQ
    ]?.apiKey
  );
}

/*
|--------------------------------------------------------------------------
| Public Configuration
|--------------------------------------------------------------------------
*/

export function getVoiceTranscriptionConfiguration() {
  const provider =
    resolveProvider(
      DEFAULT_TRANSCRIPTION_PROVIDER
    );

  return {
    provider,

    model:
      resolveModel(
        DEFAULT_TRANSCRIPTION_MODEL
      ),

    language:
      resolveLanguage(
        DEFAULT_TRANSCRIPTION_LANGUAGE
      ),

    configured:
      isVoiceTranscriptionConfigured(
        provider
      ),

    maxRetries:
      MAX_TRANSCRIPTION_RETRIES
  };
}