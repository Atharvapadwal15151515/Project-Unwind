import {
  AlertCircle,
  Bot,
  Menu,
  Plus,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";

import {
  useState
} from "react";

import ChatComposer from "../../components/chatbot/ChatComposer";
import ChatConversationSidebar from "../../components/chatbot/ChatConversationSidebar";
import ChatMessageList from "../../components/chatbot/ChatMessageList";

import {
  useChatbot
} from "../../hooks/useChatbot";

import "./AICompanion.css";

function AICompanionPage() {
  const [
    mobileHistoryOpen,
    setMobileHistoryOpen
  ] = useState(false);

  const {
    conversations,

    activeConversationId,

    messages,

    conversationsLoading,
    messagesLoading,
    streaming,
    error,

    openConversation,
    startNewConversation,
    sendMessage,
    stopStreaming,
    removeConversation,

    getConversationId,
    getConversationTitle,

    clearError
  } = useChatbot();

  const handleOpenConversation =
    async (
      conversation
    ) => {
      await openConversation(
        conversation
      );

      setMobileHistoryOpen(
        false
      );
    };

  const handleNewConversation =
    () => {
      startNewConversation();

      setMobileHistoryOpen(
        false
      );
    };

  return (
    <div className="ai-companion-page">
      <button
        type="button"
        className={
          mobileHistoryOpen
            ? "ai-history-backdrop ai-history-backdrop--open"
            : "ai-history-backdrop"
        }
        onClick={() =>
          setMobileHistoryOpen(
            false
          )
        }
        aria-label="Close conversation history"
      />

      <div
        className={
          mobileHistoryOpen
            ? "ai-companion-layout ai-companion-layout--history-open"
            : "ai-companion-layout"
        }
      >
        <ChatConversationSidebar
          conversations={
            conversations
          }
          activeConversationId={
            activeConversationId
          }
          loading={
            conversationsLoading
          }
          getConversationId={
            getConversationId
          }
          getConversationTitle={
            getConversationTitle
          }
          onOpen={
            handleOpenConversation
          }
          onNew={
            handleNewConversation
          }
          onDelete={
            removeConversation
          }
        />

        <main className="ai-chat-panel">
          <header className="ai-chat-header">
            <div className="ai-chat-header__left">
              <button
                type="button"
                className="ai-chat-header__mobile-history"
                onClick={() =>
                  setMobileHistoryOpen(
                    true
                  )
                }
                aria-label="Open conversation history"
              >
                <Menu size={19} />
              </button>

              <span className="ai-chat-header__icon">
                <Bot size={21} />
              </span>

              <div>
                <h1>
                  AI Companion
                </h1>

                <p>
                  A calm space to talk
                  things through.
                </p>
              </div>
            </div>

            <div className="ai-chat-header__actions">
              <span className="ai-chat-private">
                <ShieldCheck
                  size={14}
                />
                Private
              </span>

              <button
  type="button"
  className="ai-new-chat-button"
  onClick={handleNewConversation}
  aria-label="New chat"
>
  <Plus size={16} />

  <span>
    New chat
  </span>
</button>
            </div>
          </header>

          {error && (
            <div
              className="ai-chat-alert"
              role="alert"
            >
              <AlertCircle
                size={17}
              />

              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={
                  clearError
                }
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="ai-chat-body">
            <ChatMessageList
              messages={
                messages
              }
              loading={
                messagesLoading
              }
              onStarterPrompt={
                sendMessage
              }
            />
          </div>

          <footer className="ai-chat-footer">
            <div className="ai-guided-badge">
              <Sparkles
                size={13}
              />

              <span>
                Smart suggestions use
                your predefined UNWIND
                response library when
                available.
              </span>
            </div>

            <ChatComposer
              disabled={
                messagesLoading
              }
              streaming={
                streaming
              }
              onSend={
                sendMessage
              }
              onStop={
                stopStreaming
              }
            />
          </footer>
        </main>
      </div>
    </div>
  );
}

export default AICompanionPage;