import {
  LoaderCircle,
  MessageCircle
} from "lucide-react";

import {
  useEffect,
  useRef
} from "react";

import MessageBubble
  from "./MessageBubble";

function MessageList({
  messages = [],
  currentUserId,
  loading = false,
  loadingOlder = false,
  hasOlderMessages = false,

  getMessageId,
  getMessageUserId,
  getMessageSenderName,
  getMessageSenderImage,
  getMessageText,
  getMessageCreatedAt,
  getMessageEditedAt,

  getReplyMessageId,
  getReplySenderName,
  getReplyMessageText,
  isReplyDeleted,
  isMessageDeleted,

  onLoadOlder,
  onReply,
  onEdit,
  onDelete,
  onReport
}) {
  const bottomRef =
    useRef(null);

  const previousMessageCountRef =
    useRef(
      messages.length
    );

  const previousNewestMessageIdRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Scroll handling
  |--------------------------------------------------------------------------
  |
  | Initial messages:
  | scroll to newest message.
  |
  | New live message:
  | scroll to bottom.
  |
  | Older messages loaded:
  | DO NOT jump back to bottom.
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const currentCount =
        messages.length;

      if (
        currentCount === 0
      ) {
        previousMessageCountRef.current =
          0;

        previousNewestMessageIdRef.current =
          null;

        return;
      }

      const newestMessage =
        messages[
          currentCount - 1
        ];

      const newestMessageId =
        getMessageId?.(
          newestMessage
        );

      const previousCount =
        previousMessageCountRef.current;

      const previousNewestMessageId =
        previousNewestMessageIdRef.current;

      /*
       * First render with messages.
       */
      if (
        previousCount === 0
      ) {
        bottomRef
          .current
          ?.scrollIntoView({
            behavior:
              "auto"
          });
      }

      /*
       * Messages increased AND
       * newest message changed.
       *
       * This means a new live message
       * was appended at the bottom.
       */
      else if (
        currentCount >
          previousCount &&
        String(
          newestMessageId
        ) !==
          String(
            previousNewestMessageId
          )
      ) {
        bottomRef
          .current
          ?.scrollIntoView({
            behavior:
              "smooth"
          });
      }

      /*
       * If message count increases but
       * newest message stays the same,
       * older messages were prepended.
       *
       * Therefore:
       * do nothing.
       */

      previousMessageCountRef.current =
        currentCount;

      previousNewestMessageIdRef.current =
        newestMessageId;
    },
    [
      messages,
      getMessageId
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="message-list-state">
        <LoaderCircle
          size={24}
          className="messages-spin"
        />

        <p>
          Loading messages…
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Empty
  |--------------------------------------------------------------------------
  */

  if (
    messages.length === 0
  ) {
    return (
      <div className="message-list-state">
        <span className="message-list-state__icon">
          <MessageCircle
            size={26}
          />
        </span>

        <h3>
          No messages yet
        </h3>

        <p>
          Start the conversation when
          you&apos;re ready.
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Messages
  |--------------------------------------------------------------------------
  */

  return (
    <div className="message-list">
      {hasOlderMessages && (
        <button
          type="button"
          className="message-load-older"
          disabled={
            loadingOlder
          }
          onClick={
            onLoadOlder
          }
        >
          {loadingOlder ? (
            <>
              <LoaderCircle
                size={14}
                className="messages-spin"
              />

              Loading…
            </>
          ) : (
            "Load older messages"
          )}
        </button>
      )}

      {messages.map(
        (
          message,
          index
        ) => {
          const messageId =
            getMessageId(
              message
            );

          return (
            <MessageBubble
              key={
                messageId ||
                `message-${index}`
              }

              message={
                message
              }

              currentUserId={
                currentUserId
              }

              messageId={
                messageId
              }

              senderId={
                getMessageUserId(
                  message
                )
              }

              senderName={
                getMessageSenderName(
                  message
                )
              }

              senderImage={
                getMessageSenderImage(
                  message
                )
              }

              text={
                getMessageText(
                  message
                )
              }

              createdAt={
                getMessageCreatedAt(
                  message
                )
              }

              editedAt={
                getMessageEditedAt(
                  message
                )
              }

              replyMessageId={
                getReplyMessageId?.(
                  message
                )
              }

              replySenderName={
                getReplySenderName?.(
                  message
                )
              }

              replyText={
                getReplyMessageText?.(
                  message
                )
              }

              replyDeleted={
                isReplyDeleted?.(
                  message
                )
              }

              deleted={
                isMessageDeleted?.(
                  message
                )
              }

              onReply={
                onReply
              }

              onEdit={
                onEdit
              }

              onDelete={
                onDelete
              }

              onReport={
                onReport
              }
            />
          );
        }
      )}

      <div
        ref={
          bottomRef
        }
      />
    </div>
  );
}

export default MessageList;