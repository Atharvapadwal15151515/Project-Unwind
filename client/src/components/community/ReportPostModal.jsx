import {
  useEffect,
  useState
} from "react";

import {
  AnimatePresence,
  motion
} from "framer-motion";
import {
  UnwindRadioGroup
} from "../common/UnwindControls/UnwindControls";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  ShieldAlert,
  X
} from "lucide-react";

import {
  reportCommunityPost
} from "../../services/communityService";

import {
  getApiErrorMessage
} from "../../services/api";

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

function getPostId(post) {
  return (
    post?.post_id ||
    post?.postId ||
    post?.id ||
    null
  );
}

function getAuthorUserId(post) {
  return (
    post?.author_user_id ||
    post?.authorUserId ||
    post?.author?.user_id ||
    post?.author?.userId ||
    null
  );
}

function getAuthorName(post) {
  return (
    post?.author_visible_name ||
    post?.authorVisibleName ||
    post?.visible_name ||
    post?.author?.visible_name ||
    post?.author?.name ||
    "Community member"
  );
}

function ReportPostModal({
  open,
  post,
  onClose,
  onReported
}) {
  const [reason, setReason] =
    useState("");

  const [
    description,
    setDescription
  ] = useState("");

  const [
    submitting,
    setSubmitting
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const postId =
    getPostId(post);

  const reportedUserId =
    getAuthorUserId(post);

  useEffect(() => {
    if (!open) {
      return;
    }

    setReason("");
    setDescription("");
    setSubmitting(false);
    setError("");
    setSuccess(false);
  }, [open, postId]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !submitting
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    onClose,
    open,
    submitting
  ]);

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (
      !postId ||
      !reason ||
      submitting
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const result =
        await reportCommunityPost({
          postId,
          reportedUserId,
          reason,
          description
        });

      setSuccess(true);

      if (onReported) {
        onReported(result);
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to submit this report."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && post && (
        <div className="community-modal-layer">
          <motion.button
            type="button"
            className="community-modal-backdrop"
            aria-label="Close report dialog"
            onClick={() => {
              if (!submitting) {
                onClose();
              }
            }}
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
          />

          <div className="community-modal-positioner">
            <motion.section
              className="community-modal community-modal--small community-report-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Report community post"
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.97
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                y: 12,
                scale: 0.98
              }}
              transition={{
                duration: 0.18
              }}
            >
              <header className="community-modal__header">
                <div>
                  <h2>
                    Report post
                  </h2>

                  <p>
                    Help us keep Unwind
                    respectful and safe.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  aria-label="Close"
                >
                  <X size={19} />
                </button>
              </header>

              {success ? (
                <div className="community-report-success">
                  <span>
                    <CheckCircle2
                      size={28}
                    />
                  </span>

                  <h3>
                    Report submitted
                  </h3>

                  <p>
                    Thank you for helping
                    keep the community
                    safe. The report has
                    been sent for review.
                  </p>

                  <button
                    type="button"
                    className="community-primary-button"
                    onClick={onClose}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  className="community-report-form"
                  onSubmit={
                    handleSubmit
                  }
                >
                  <div className="community-report-warning">
                    <ShieldAlert
                      size={20}
                    />

                    <div>
                      <strong>
                        Reporting{" "}
                        {getAuthorName(
                          post
                        )}
                        's post
                      </strong>

                      <p>
                        Reports should be
                        used for content
                        that violates
                        community safety
                        or guidelines.
                      </p>
                    </div>
                  </div>

<fieldset className="community-report-reasons">
  <legend>
    Why are you
    reporting this?
  </legend>

  <UnwindRadioGroup
    name="report-reason"
    value={reason}
    onChange={(event) =>
      setReason(
        event.target.value
      )
    }
    options={
      REPORT_REASONS.map(
        (item) => ({
          value: item.value,
          label: item.label
        })
      )
    }
  />
</fieldset>
                  <label className="community-report-description">
                    <span>
                      Additional details
                      <small>
                        Optional
                      </small>
                    </span>

                    <textarea
                      value={description}
                      maxLength={2000}
                      rows={4}
                      placeholder="Tell us anything that may help the moderation team understand the issue…"
                      onChange={(event) =>
                        setDescription(
                          event.target
                            .value
                        )
                      }
                    />

                    <small>
                      {
                        description.length
                      }
                      /2000
                    </small>
                  </label>

                  {error && (
                    <div
                      className="community-form-error"
                      role="alert"
                    >
                      <AlertTriangle
                        size={16}
                      />

                      <span>
                        {error}
                      </span>
                    </div>
                  )}

                  <footer className="community-modal__footer">
                    <button
                      type="button"
                      className="community-secondary-button"
                      onClick={onClose}
                      disabled={
                        submitting
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="community-danger-button"
                      disabled={
                        submitting ||
                        !reason
                      }
                    >
                      {submitting ? (
                        <>
                          <LoaderCircle
                            size={16}
                            className="community-icon-spin"
                          />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <ShieldAlert
                            size={16}
                          />
                          Submit report
                        </>
                      )}
                    </button>
                  </footer>
                </form>
              )}
            </motion.section>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ReportPostModal;