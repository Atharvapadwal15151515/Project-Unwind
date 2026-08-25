import {
  Bot,
  Check,
  Copy,
  UserRound
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  useState
} from "react";

function ChatMessageBubble({
  message
}) {
  const [
    copied,
    setCopied
  ] = useState(false);

  const isUser =
    message?.role ===
    "user";

  const content =
    message?.content ||
    "";

  const source =
    message?.source ||
    null;

  const handleCopy =
    async () => {
      if (!content) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          content
        );

        setCopied(true);

        window.setTimeout(
          () =>
            setCopied(false),
          1600
        );
      } catch {
        // Clipboard unavailable.
      }
    };

  return (
    <article
      className={[
        "ai-message",
        isUser
          ? "ai-message--user"
          : "ai-message--assistant"
      ].join(" ")}
    >
      <span className="ai-message__avatar">
        {isUser ? (
          <UserRound size={17} />
        ) : (
          <Bot size={18} />
        )}
      </span>

      <div className="ai-message__content">
        {!isUser && (
          <header className="ai-message__header">
            <strong>
              UNWIND Companion
            </strong>
          </header>
        )}

       <div className="ai-message__bubble">
  {content ? (
    isUser ? (
      <p>
        {content}
      </p>
    ) : (
      <div className="ai-message__markdown">
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>
    )
  ) : message?.streaming ? (
    <div className="ai-typing">
      <span />
      <span />
      <span />
    </div>
  ) : null}
</div>

        {!isUser &&
          content && (
            <button
              type="button"
              className="ai-message__copy"
              onClick={
                handleCopy
              }
            >
              {copied ? (
                <Check
                  size={13}
                />
              ) : (
                <Copy
                  size={13}
                />
              )}

              {copied
                ? "Copied"
                : "Copy"}
            </button>
          )}
      </div>
    </article>
  );
}

export default ChatMessageBubble;