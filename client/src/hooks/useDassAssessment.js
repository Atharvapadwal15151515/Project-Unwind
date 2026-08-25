import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  abandonDassAssessment,
  getDassAssessmentId,
  getDassConsentStatus,
  getDassCurrentQuestion,
  getDassQuestions,
  giveDassConsent,
  saveDassAnswer,
  startDassAssessment,
  submitDassAssessment
} from "../services/dassService";

import {
  getApiErrorMessage
} from "../services/api";

const TOTAL_QUESTIONS = 21;

function getQuestionId(question) {
  return (
    question?.question_id ||
    question?.questionId ||
    question?.id ||
    null
  );
}

function getQuestionNumber(question) {
  const value = Number(
    question?.question_number ??
      question?.questionNumber
  );

  return Number.isInteger(value)
    ? value
    : null;
}

function normalizeQuestionList(
  questions
) {
  if (!Array.isArray(questions)) {
    return [];
  }

  return [...questions].sort(
    (firstQuestion, secondQuestion) =>
      Number(
        firstQuestion?.question_number ??
          firstQuestion?.questionNumber ??
          0
      ) -
      Number(
        secondQuestion?.question_number ??
          secondQuestion?.questionNumber ??
          0
      )
  );
}

export function useDassAssessment() {
  const [
    consent,
    setConsent
  ] = useState(null);

  const [
    hasConsent,
    setHasConsent
  ] = useState(false);

  const [
    questions,
    setQuestions
  ] = useState([]);

  const [
    assessment,
    setAssessment
  ] = useState(null);

  const [
    answers,
    setAnswers
  ] = useState({});

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex
  ] = useState(0);

  const [
    result,
    setResult
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    starting,
    setStarting
  ] = useState(false);

  const [
    savingAnswer,
    setSavingAnswer
  ] = useState(false);

  const [
    submitting,
    setSubmitting
  ] = useState(false);

  const [
    abandoning,
    setAbandoning
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const sortedQuestions =
    useMemo(
      () =>
        normalizeQuestionList(
          questions
        ),
      [questions]
    );

  const assessmentId =
    useMemo(
      () =>
        getDassAssessmentId(
          assessment
        ),
      [assessment]
    );

  const currentQuestion =
    sortedQuestions[
      currentQuestionIndex
    ] || null;

  const currentQuestionNumber =
    getQuestionNumber(
      currentQuestion
    ) ||
    currentQuestionIndex + 1;

  const answeredCount =
    useMemo(
      () =>
        Object.values(
          answers
        ).filter(
          (answer) =>
            Number.isInteger(
              answer
            ) &&
            answer >= 0 &&
            answer <= 3
        ).length,
      [answers]
    );

  const progressPercentage =
    Math.round(
      (
        answeredCount /
        TOTAL_QUESTIONS
      ) *
        100
    );

  const isFirstQuestion =
    currentQuestionIndex === 0;

  const isLastQuestion =
    currentQuestionIndex ===
    sortedQuestions.length - 1;

  const currentAnswer =
    currentQuestion
      ? answers[
          getQuestionId(
            currentQuestion
          )
        ]
      : undefined;

  const canGoNext =
    Number.isInteger(
      currentAnswer
    );

  const canSubmit =
    answeredCount ===
      TOTAL_QUESTIONS &&
    Boolean(assessmentId);

  /*
  |--------------------------------------------------------------------------
  | Load consent and questions
  |--------------------------------------------------------------------------
  */

  const initializeDass =
  useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        consentResult,
        questionResult
      ] = await Promise.all([
        getDassConsentStatus(),
        getDassQuestions()
      ]);

      const normalizedQuestions =
        normalizeQuestionList(
          questionResult
        );

      console.log(
        "DASS questions loaded:",
        normalizedQuestions
      );

      setHasConsent(
        Boolean(
          consentResult?.hasConsent
        )
      );

      setConsent(
        consentResult?.consent ||
          null
      );

      setQuestions(
        normalizedQuestions
      );

      if (
        normalizedQuestions.length === 0
      ) {
        setError(
          "No DASS-21 questions were received from the server."
        );
      }
    } catch (requestError) {
      console.error(
        "DASS initialization failed:",
        requestError
      );

      setQuestions([]);

      setError(
        getApiErrorMessage(
          requestError,
          "Unable to load the DASS-21 assessment."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeDass();
  }, [initializeDass]);

  /*
  |--------------------------------------------------------------------------
  | Give consent
  |--------------------------------------------------------------------------
  */

  const acceptConsent =
    useCallback(
      async ({
        consentVersion = "1.0"
      } = {}) => {
        try {
          setStarting(true);
          setError("");

          const savedConsent =
            await giveDassConsent({
              consentVersion
            });

          setConsent(
            savedConsent
          );

          setHasConsent(true);

          return savedConsent;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to save your consent."
            )
          );

          throw requestError;
        } finally {
          setStarting(false);
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Start or resume assessment
  |--------------------------------------------------------------------------
  */

  const beginAssessment =
  useCallback(async () => {
    if (
      sortedQuestions.length !==
      TOTAL_QUESTIONS
    ) {
      const questionError =
        new Error(
          `The assessment requires ${TOTAL_QUESTIONS} questions, but ${sortedQuestions.length} were loaded.`
        );

      setError(
        questionError.message
      );

      throw questionError;
    }

    try {
      setStarting(true);
      setError("");
      setResult(null);

      const startedAssessment =
        await startDassAssessment();

      if (!startedAssessment) {
        throw new Error(
          "The server did not return an assessment."
        );
      }

      setAssessment(
        startedAssessment
      );

      const backendCurrentQuestion =
        getDassCurrentQuestion(
          startedAssessment
        );

      const matchingIndex =
        sortedQuestions.findIndex(
          (question) =>
            getQuestionNumber(
              question
            ) ===
            backendCurrentQuestion
        );

      setCurrentQuestionIndex(
        matchingIndex >= 0
          ? matchingIndex
          : 0
      );

      return startedAssessment;
    } catch (requestError) {
      console.error(
        "Unable to start DASS assessment:",
        requestError
      );

      setError(
        getApiErrorMessage(
          requestError,
          "Unable to start the assessment."
        )
      );

      throw requestError;
    } finally {
      setStarting(false);
    }
  }, [sortedQuestions]);

  /*
  |--------------------------------------------------------------------------
  | Save one answer
  |--------------------------------------------------------------------------
  */

  const answerQuestion =
    useCallback(
      async (
        answerValue,
        {
          advance = true
        } = {}
      ) => {
        if (!assessmentId) {
          const missingAssessmentError =
            new Error(
              "No active assessment was found."
            );

          setError(
            missingAssessmentError.message
          );

          throw missingAssessmentError;
        }

        if (!currentQuestion) {
          const missingQuestionError =
            new Error(
              "The current question could not be found."
            );

          setError(
            missingQuestionError.message
          );

          throw missingQuestionError;
        }

        const questionId =
          getQuestionId(
            currentQuestion
          );

        const numericAnswer =
          Number(answerValue);

        if (!questionId) {
          const missingQuestionIdError =
            new Error(
              "The current question has no valid ID."
            );

          setError(
            missingQuestionIdError.message
          );

          throw missingQuestionIdError;
        }

        if (
          !Number.isInteger(
            numericAnswer
          ) ||
          numericAnswer < 0 ||
          numericAnswer > 3
        ) {
          const invalidAnswerError =
            new Error(
              "Choose one response between 0 and 3."
            );

          setError(
            invalidAnswerError.message
          );

          throw invalidAnswerError;
        }

        try {
          setSavingAnswer(true);
          setError("");

          setAnswers(
            (
              currentAnswers
            ) => ({
              ...currentAnswers,
              [questionId]:
                numericAnswer
            })
          );

          const savedResponse =
            await saveDassAnswer({
              assessmentId,
              questionId,
              answerValue:
                numericAnswer
            });

          if (
            advance &&
            currentQuestionIndex <
              sortedQuestions.length -
                1
          ) {
            setCurrentQuestionIndex(
              (
                currentIndex
              ) =>
                currentIndex + 1
            );
          }

          return savedResponse;
        } catch (
          requestError
        ) {
          setAnswers(
            (
              currentAnswers
            ) => {
              const updatedAnswers = {
                ...currentAnswers
              };

              delete updatedAnswers[
                questionId
              ];

              return updatedAnswers;
            }
          );

          setError(
            getApiErrorMessage(
              requestError,
              "Unable to save your answer."
            )
          );

          throw requestError;
        } finally {
          setSavingAnswer(false);
        }
      },
      [
        assessmentId,
        currentQuestion,
        currentQuestionIndex,
        sortedQuestions.length
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const goToPreviousQuestion =
    useCallback(
      () => {
        setCurrentQuestionIndex(
          (currentIndex) =>
            Math.max(
              currentIndex - 1,
              0
            )
        );
      },
      []
    );

  const goToNextQuestion =
    useCallback(
      () => {
        if (!canGoNext) {
          setError(
            "Choose an answer before continuing."
          );

          return;
        }

        setCurrentQuestionIndex(
          (currentIndex) =>
            Math.min(
              currentIndex + 1,
              sortedQuestions.length -
                1
            )
        );

        setError("");
      },
      [
        canGoNext,
        sortedQuestions.length
      ]
    );

  const goToQuestion =
    useCallback(
      (questionIndex) => {
        const numericIndex =
          Number(
            questionIndex
          );

        if (
          !Number.isInteger(
            numericIndex
          )
        ) {
          return;
        }

        setCurrentQuestionIndex(
          Math.min(
            Math.max(
              numericIndex,
              0
            ),
            Math.max(
              sortedQuestions.length -
                1,
              0
            )
          )
        );

        setError("");
      },
      [
        sortedQuestions.length
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Submit assessment
  |--------------------------------------------------------------------------
  */

  const finishAssessment =
    useCallback(
      async () => {
        if (!assessmentId) {
          const missingAssessmentError =
            new Error(
              "No active assessment was found."
            );

          setError(
            missingAssessmentError.message
          );

          throw missingAssessmentError;
        }

        if (
          answeredCount !==
          TOTAL_QUESTIONS
        ) {
          const incompleteError =
            new Error(
              `Answer all ${TOTAL_QUESTIONS} questions before submitting.`
            );

          setError(
            incompleteError.message
          );

          throw incompleteError;
        }

        try {
          setSubmitting(true);
          setError("");

          const submittedResult =
            await submitDassAssessment(
              assessmentId
            );

          setResult(
            submittedResult
          );

          setAssessment(
            (
              currentAssessment
            ) => ({
              ...currentAssessment,
              status: "completed"
            })
          );

          return submittedResult;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to submit the assessment."
            )
          );

          throw requestError;
        } finally {
          setSubmitting(false);
        }
      },
      [
        answeredCount,
        assessmentId
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Abandon assessment
  |--------------------------------------------------------------------------
  */

  const abandonAssessment =
    useCallback(
      async () => {
        if (!assessmentId) {
          return null;
        }

        try {
          setAbandoning(true);
          setError("");

          const abandonedAssessment =
            await abandonDassAssessment(
              assessmentId
            );

          setAssessment(null);
          setAnswers({});
          setCurrentQuestionIndex(0);
          setResult(null);

          return abandonedAssessment;
        } catch (
          requestError
        ) {
          setError(
            getApiErrorMessage(
              requestError,
              "Unable to exit the assessment."
            )
          );

          throw requestError;
        } finally {
          setAbandoning(false);
        }
      },
      [assessmentId]
    );

  /*
  |--------------------------------------------------------------------------
  | Reset local assessment state
  |--------------------------------------------------------------------------
  */

  const resetAssessment =
    useCallback(
      () => {
        setAssessment(null);
        setAnswers({});
        setCurrentQuestionIndex(0);
        setResult(null);
        setError("");
      },
      []
    );

  return {
    consent,
    hasConsent,

    questions:
      sortedQuestions,

       questionsReady:
    sortedQuestions.length ===
    TOTAL_QUESTIONS,

  questionCount:
    sortedQuestions.length,

    assessment,
    assessmentId,
    answers,

    answers,
    currentAnswer,
    currentQuestion,
    currentQuestionIndex,
    currentQuestionNumber,

    answeredCount,
    totalQuestions:
      TOTAL_QUESTIONS,
    progressPercentage,

    isFirstQuestion,
    isLastQuestion,
    canGoNext,
    canSubmit,

    result,

    loading,
    starting,
    savingAnswer,
    submitting,
    abandoning,
    error,

    initializeDass,
    acceptConsent,
    beginAssessment,
    answerQuestion,

    goToPreviousQuestion,
    goToNextQuestion,
    goToQuestion,

    finishAssessment,
    abandonAssessment,
    resetAssessment,

    clearError: () =>
      setError("")
  };
}