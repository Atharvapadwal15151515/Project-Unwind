import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Send,
  X
} from "lucide-react";

function CommentComposer({
  placeholder = "Write a thoughtful comment…",
  submitting = false,
  replyingTo = null,
  onCancelReply,
  onSubmit
}) {
  const [commentText, setCommentText] =
    useState("");

  const textareaRef = useRef(null);

  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedComment =
      commentText.trim();

    if (
      !trimmedComment ||
      submitting
    ) {
      return;
    }

    const successful =
      await onSubmit(trimmedComment);

    if (successful !== false) {
      setCommentText("");
    }
  };

  return (
    <form
      className="comment-composer"
      onSubmit={handleSubmit}
    >
      {replyingTo && (
        <div className="comment-composer__replying">
          <span>
            Replying to{" "}
            <strong>
              {replyingTo}
            </strong>
          </span>

          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="comment-composer__input">
        <textarea
          ref={textareaRef}
          value={commentText}
          onChange={(event) =>
            setCommentText(
              event.target.value
            )
          }
          placeholder={placeholder}
          maxLength={2000}
          rows={2}
        />

        <button
          type="submit"
          disabled={
            submitting ||
            !commentText.trim()
          }
          aria-label="Post comment"
        >
          <Send size={17} />
        </button>
      </div>

      <div className="comment-composer__footer">
        <span>
          Be kind and avoid sharing private
          information.
        </span>

        <small>
          {commentText.length}/2000
        </small>
      </div>
    </form>
  );
}

export default CommentComposer;