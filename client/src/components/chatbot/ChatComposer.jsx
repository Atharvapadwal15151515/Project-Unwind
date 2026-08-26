import {
  ArrowUp,
  LoaderCircle,
  Square
} from "lucide-react";

import {
  useMemo,
  useRef,
  useState
} from "react";

import {
  getChatbotSuggestions
} from "../../utils/chatbotSuggestions";

import ChatSuggestionList from "./ChatSuggestionList";

function ChatComposer({
  disabled = false,
  streaming = false,
  onSend,
  onStop
}) {
  const [
    message,
    setMessage
  ] = useState("");

  const [
    focused,
    setFocused
  ] = useState(false);

  const textareaRef =
    useRef(null);

  const suggestions =
    useMemo(
      () =>
        getChatbotSuggestions(
          message,
          {
            limit: 5
          }
        ),
      [message]
    );

  const showSuggestions =
    focused &&
    !streaming &&
    suggestions.length > 0;

  const submitMessage = async (
    text = message
  ) => {
    const cleanedMessage =
      String(text).trim();

    if (
      !cleanedMessage ||
      disabled ||
      streaming
    ) {
      return;
    }

    setMessage("");

    await onSend?.(
      cleanedMessage
    );
  };

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      submitMessage();
    }
  };

  const handleSuggestionSelect =
  (suggestion) => {
    const exactPhrase =
      suggestion?.text;

    if (!exactPhrase) {
      return;
    }

    setMessage("");

    /*
     * IMPORTANT:
     * Do not modify, lowercase,
     * trim/rewrite, or paraphrase
     * this phrase here.
     *
     * It is sent exactly as stored
     * in the backend JSON.
     */
    onSend?.(
      exactPhrase
    );
  };

  return (
    <div className="chat-composer-shell">
      {showSuggestions && (
        <ChatSuggestionList
          suggestions={
            suggestions
          }
          onSelect={
            handleSuggestionSelect
          }
        />
      )}

      <div
        className={[
          "chat-composer",
          focused
            ? "chat-composer--focused"
            : ""
        ]
          .filter(Boolean)
          .join(" ")}
      >
        

        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          disabled={
            disabled
          }
          placeholder="Tell me what's on your mind..."
          onFocus={() =>
            setFocused(true)
          }
          onBlur={() =>
            setFocused(false)
          }
          onKeyDown={
            handleKeyDown
          }
          onChange={(event) =>
            setMessage(
              event.target.value
            )
          }
        />

        {streaming ? (
          <button
            type="button"
            className="chat-composer__send chat-composer__send--stop"
            onClick={
              onStop
            }
            aria-label="Stop response"
          >
            <Square
              size={15}
              fill="currentColor"
            />
          </button>
        ) : (
          <button
            type="button"
            className="chat-composer__send"
            disabled={
              disabled ||
              !message.trim()
            }
            onClick={() =>
              submitMessage()
            }
            aria-label="Send message"
          >
            {disabled ? (
              <LoaderCircle
                size={17}
                className="chat-icon-spin"
              />
            ) : (
              <ArrowUp
                size={18}
              />
            )}
          </button>
        )}
      </div>

      <p className="chat-composer__notice">
        UNWIND can make mistakes.
        It does not replace
        professional mental-health
        care.
      </p>
    </div>
  );
}

export default ChatComposer;