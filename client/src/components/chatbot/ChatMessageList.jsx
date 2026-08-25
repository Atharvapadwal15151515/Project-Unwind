import {
  Bot,
  LoaderCircle,
  MessageCircleHeart,
  MoonStar,
  Sparkles
} from "lucide-react";

import {
  useEffect,
  useRef
} from "react";

import ChatMessageBubble from "./ChatMessageBubble";

const starterPrompts = [
  {
    icon:
      MessageCircleHeart,

    title:
      "Talk something through",

    text:
      "I need someone to talk to"
  },

  {
    icon:
      MoonStar,

    title:
      "Slow things down",

    text:
      "I want to relax"
  },

  {
    icon:
      Sparkles,

    title:
      "Start gently",

    text:
      "How are you feeling today?"
  }
];

function ChatMessageList({
  messages = [],
  loading = false,
  onStarterPrompt
}) {
  const bottomRef =
    useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior:
        "smooth"
    });
  }, [messages]);

  if (loading) {
    return (
      <div className="ai-chat-loading">
        <LoaderCircle
          size={27}
          className="chat-icon-spin"
        />

        <p>
          Loading conversation…
        </p>
      </div>
    );
  }

  if (
    messages.length === 0
  ) {
    return (
      <section className="ai-chat-empty">
        <span className="ai-chat-empty__icon">
          <Bot size={31} />
        </span>

        <span className="ai-chat-empty__eyebrow">
          <Sparkles size={13} />
          AI Companion
        </span>

        <h2>
          What&apos;s on your mind?
        </h2>

        <p>
          You can talk freely, or
          start with one of these
          gentle prompts.
        </p>

        <div className="ai-starter-prompts">
          {starterPrompts.map(
            ({
              icon: Icon,
              title,
              text
            }) => (
              <button
                key={text}
                type="button"
                onClick={() =>
                  onStarterPrompt?.(
                    text
                  )
                }
              >
                <span>
                  <Icon
                    size={18}
                  />
                </span>

                <div>
                  <strong>
                    {title}
                  </strong>

                  <small>
                    {text}
                  </small>
                </div>
              </button>
            )
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="ai-message-list">
      {messages.map(
        (
          message,
          index
        ) => (
          <ChatMessageBubble
            key={
              message?.id ||
              index
            }
            message={
              message
            }
          />
        )
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default ChatMessageList;