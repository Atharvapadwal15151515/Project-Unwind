import EmojiPicker from "emoji-picker-react";
import {
  LoaderCircle,
  Reply,
  Send,
  Smile,
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
  const [
  emojiOpen,
  setEmojiOpen
] = useState(false);

  const textareaRef =
    useRef(null);
    const emojiPickerRef =
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

  useEffect(() => {
  const handleClickOutside =
    (event) => {
      if (
        emojiOpen &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(
          event.target
        )
      ) {
        setEmojiOpen(false);
      }
    };

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, [emojiOpen]);

  const insertEmoji =
  (emoji) => {
    const textarea =
      textareaRef.current;

    if (!textarea) {
      setValue(
        (current) =>
          `${current}${emoji}`
      );

      return;
    }

    const start =
      textarea.selectionStart;

    const end =
      textarea.selectionEnd;

    setValue(
      (current) =>
        current.slice(
          0,
          start
        ) +
        emoji +
        current.slice(
          end
        )
    );

    requestAnimationFrame(
      () => {
        const nextPosition =
          start +
          emoji.length;

        textarea.focus();

        textarea.setSelectionRange(
          nextPosition,
          nextPosition
        );
      }
    );
  };
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
<div
  ref={emojiPickerRef}
  className="message-composer__emoji-wrapper"
>
  <button
    type="button"
    className="message-composer__emoji-button"
    disabled={disabled}
    onClick={() =>
      setEmojiOpen(
        (current) =>
          !current
      )
    }
    aria-label="Choose emoji"
  >
    <Smile size={19} />
  </button>

  {emojiOpen && (
    <div
      ref={emojiPickerRef}
      className="message-composer__emoji-picker"
    >
      <EmojiPicker
        onEmojiClick={(
          emojiData
        ) => {
          insertEmoji(
            emojiData.emoji
          );
        }}
        lazyLoadEmojis
        searchDisabled={false}
        skinTonesDisabled={false}
        previewConfig={{
          showPreview: false
        }}
      />
    </div>
  )}
</div>
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