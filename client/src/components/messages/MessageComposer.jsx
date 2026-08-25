import {
  LoaderCircle,
  Reply,
  Send,
  X
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState
} from "react";

function MessageComposer({
  sending = false,
  disabled = false,
  replyMessage = null,
  editingMessage = null,
  getMessageText,
  onSend,
  onCancelReply,
  onCancelEdit
}) {
  const [
    value,
    setValue
  ] = useState("");

  const textareaRef =
    useRef(null);

  useEffect(() => {
    if (
      editingMessage
    ) {
      setValue(
        getMessageText?.(
          editingMessage
        ) || ""
      );

      textareaRef
        .current
        ?.focus();

      return;
    }

    setValue("");
  }, [
    editingMessage,
    getMessageText
  ]);

  const submit =
    async () => {
      const text =
        value.trim();

      if (
        !text ||
        disabled ||
        sending
      ) {
        return;
      }

      await onSend?.(
        text
      );

      setValue("");
    };

  const handleKeyDown =
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        submit();
      }
    };

  const replyText =
    replyMessage
      ? getMessageText?.(
          replyMessage
        )
      : "";

  const editingText =
    editingMessage
      ? getMessageText?.(
          editingMessage
        )
      : "";

  return (
    <div className="message-composer-wrapper">
      {replyMessage && (
        <div className="message-composer-context">
          <Reply
            size={15}
          />

          <div>
            <strong>
              Replying to
            </strong>

            <span>
              {replyText}
            </span>
          </div>

          <button
            type="button"
            onClick={
              onCancelReply
            }
          >
            <X size={15} />
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="message-composer-context">
          <span>
            ✏️
          </span>

          <div>
            <strong>
              Editing message
            </strong>

            <span>
              {editingText}
            </span>
          </div>

          <button
            type="button"
            onClick={
              onCancelEdit
            }
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="message-composer">

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={
            disabled
          }
          placeholder="Write a message..."
          onChange={(event) =>
            setValue(
              event.target.value
            )
          }
          onKeyDown={
            handleKeyDown
          }
        />

        <button
          type="button"
          className="message-composer__send"
          disabled={
            disabled ||
            sending ||
            !value.trim()
          }
          onClick={
            submit
          }
        >
          {sending ? (
            <LoaderCircle
              size={17}
              className="messages-spin"
            />
          ) : (
            <Send
              size={17}
            />
          )}
        </button>
      </div>
    </div>
  );
}

export default MessageComposer;