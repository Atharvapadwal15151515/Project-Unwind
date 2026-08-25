import {
  useEffect,
  useState
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  ShieldAlert,
  X
} from "lucide-react";

import {
  submitReport
} from "../../services/reportService";

import {
  getApiErrorMessage
} from "../../services/api";

import "./ReportModal.css";

const REPORT_REASONS = [
  {
    value: "harassment",
    label: "Harassment or bullying"
  },
  {
    value: "hate_speech",
    label: "Hate speech"
  },
  {
    value: "spam",
    label: "Spam"
  },
  {
    value: "sexual_content",
    label: "Sexual content"
  },
  {
    value: "violence",
    label: "Violence or dangerous content"
  },
  {
    value: "self_harm",
    label: "Self-harm related content"
  },
  {
    value: "misinformation",
    label: "Misinformation"
  },
  {
    value: "privacy_violation",
    label: "Privacy violation"
  },
  {
    value: "impersonation",
    label: "Impersonation"
  },
  {
    value: "scam",
    label: "Scam or fraud"
  },
  {
    value: "inappropriate_content",
    label: "Inappropriate content"
  },
  {
    value: "other",
    label: "Something else"
  }
];

function ReportModal({
  open,

  targetType,
  targetId,

  reportedUserId = null,

  targetLabel =
    "content",

  targetName =
    "",

  onClose,
  onReported
}) {
  const [
    reason,
    setReason
  ] = useState("");

  const [
    description,
    setDescription
  ] = useState("");

  const [
    submitting,
    setSubmitting
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    success,
    setSuccess
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Reset whenever target changes
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!open) {
        return;
      }

      setReason("");
      setDescription("");
      setSubmitting(false);
      setError("");
      setSuccess(false);
    },
    [
      open,
      targetType,
      targetId
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Modal keyboard / body lock
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!open) {
        return undefined;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style
        .overflow =
        "hidden";

      const handleKeyDown =
        (
          event
        ) => {
          if (
            event.key ===
              "Escape" &&
            !submitting
          ) {
            onClose?.();
          }
        };

      document.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        document.body.style
          .overflow =
          previousOverflow;

        document.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      open,
      submitting,
      onClose
    ]
  );

  if (!open) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (!reason) {
        setError(
          "Please choose a reason for the report."
        );

        return;
      }

      if (
        !targetType ||
        !targetId
      ) {
        setError(
          "This item cannot be reported right now."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setError("");

        const report =
          await submitReport({
            targetType,

            targetId,

            reportedUserId,

            reason,

            description
          });

        setSuccess(
          true
        );

        onReported?.(
          report
        );
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,

            "Unable to submit this report."
          )
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="unwind-report-backdrop"

      role="presentation"

      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !submitting
        ) {
          onClose?.();
        }
      }}
    >
      <section
        className="unwind-report-modal"

        role="dialog"

        aria-modal="true"

        aria-label={`Report ${targetLabel}`}
      >
        {/* ===============================================================
            HEADER
        =============================================================== */}

        <header className="unwind-report-modal__header">
          <div className="unwind-report-modal__heading">
            <span className="unwind-report-modal__icon">
              <ShieldAlert
                size={20}
              />
            </span>

            <div>
              <h2>
                Report{" "}
                {targetLabel}
              </h2>

              <p>
                Help keep UNWIND
                safe, respectful and
                supportive.
              </p>
            </div>
          </div>

          <button
            type="button"

            className="unwind-report-modal__close"

            onClick={
              onClose
            }

            disabled={
              submitting
            }

            aria-label="Close report dialog"
          >
            <X
              size={18}
            />
          </button>
        </header>

        {/* ===============================================================
            SUCCESS
        =============================================================== */}

        {success ? (
          <div className="unwind-report-success">
            <span>
              <CheckCircle2
                size={30}
              />
            </span>

            <h3>
              Report submitted
            </h3>

            <p>
              Your report has
              been sent to the
              Safety & Reports
              queue for review.
            </p>

            <button
              type="button"

              onClick={
                onClose
              }
            >
              Done
            </button>
          </div>
        ) : (
          /* =============================================================
             FORM
          ============================================================= */

          <form
            className="unwind-report-form"

            onSubmit={
              handleSubmit
            }
          >
            {targetName && (
              <div className="unwind-report-target">
                <span>
                  Reporting
                </span>

                <strong>
                  {targetName}
                </strong>
              </div>
            )}

            {/* Reason */}

            <label className="unwind-report-field">
              <span>
                Why are you
                reporting this?
              </span>

              <select
                value={
                  reason
                }

                onChange={(
                  event
                ) => {
                  setReason(
                    event
                      .target
                      .value
                  );

                  setError(
                    ""
                  );
                }}

                disabled={
                  submitting
                }

                required
              >
                <option value="">
                  Select a reason
                </option>

                {REPORT_REASONS.map(
                  (
                    item
                  ) => (
                    <option
                      key={
                        item.value
                      }

                      value={
                        item.value
                      }
                    >
                      {
                        item.label
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            {/* Description */}

            <label className="unwind-report-field">
              <span>
                Additional details

                <small>
                  Optional
                </small>
              </span>

              <textarea
                value={
                  description
                }

                onChange={(
                  event
                ) =>
                  setDescription(
                    event
                      .target
                      .value
                  )
                }

                rows={4}

                maxLength={
                  2000
                }

                placeholder="Tell the moderation team what happened or what they should look at."

                disabled={
                  submitting
                }
              />

              <small className="unwind-report-count">
                {
                  description.length
                }
                /2000
              </small>
            </label>

            {/* Error */}

            {error && (
              <div className="unwind-report-error">
                <AlertTriangle
                  size={15}
                />

                <span>
                  {error}
                </span>
              </div>
            )}

            {/* Actions */}

            <div className="unwind-report-actions">
              <button
                type="button"

                className="unwind-report-cancel"

                onClick={
                  onClose
                }

                disabled={
                  submitting
                }
              >
                Cancel
              </button>

              <button
                type="submit"

                className="unwind-report-submit"

                disabled={
                  submitting ||
                  !reason
                }
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      size={15}

                      className="unwind-report-spin"
                    />

                    Submitting…
                  </>
                ) : (
                  <>
                    <ShieldAlert
                      size={15}
                    />

                    Submit report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default ReportModal;