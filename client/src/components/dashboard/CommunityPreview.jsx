import {
  useEffect,
  useState
} from "react";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  MessagesSquare,
  UsersRound
} from "lucide-react";

import {
  getPublicChatHistory
} from "../../services/communityChatService";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getDisplayName(message) {
  return (
    message?.display_name ||
    message?.displayName ||
    message?.sender_name ||
    message?.senderName ||
    message?.username ||
    message?.sender_username ||
    "UNWIND Member"
  );
}

function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

function getMessageText(message) {
  return (
    message?.message_text ||
    message?.messageText ||
    message?.content ||
    message?.message ||
    message?.text ||
    ""
  );
}

function getMessageDate(message) {
  return (
    message?.created_at ||
    message?.createdAt ||
    message?.sent_at ||
    message?.sentAt ||
    null
  );
}

function formatRelativeTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const difference =
    Date.now() -
    date.getTime();

  const minutes =
    Math.floor(
      difference / 60000
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours} ${
      hours === 1
        ? "hr"
        : "hrs"
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days} ${
      days === 1
        ? "day"
        : "days"
    } ago`;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short"
    }
  ).format(date);
}

/*
|--------------------------------------------------------------------------
| Community Preview
|--------------------------------------------------------------------------
*/

function CommunityPreview() {
  const [
    messages,
    setMessages
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  useEffect(() => {
    let active = true;

    const loadMessages =
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await getPublicChatHistory({
              limit: 5
            });

          if (!active) {
            return;
          }

          /*
            Supports a few common response shapes
            so the component stays resilient.
          */

          const fetchedMessages =
            response?.data?.messages ||
            response?.messages ||
            response?.data?.data
              ?.messages ||
            response?.data ||
            [];

          const normalizedMessages =
            Array.isArray(
              fetchedMessages
            )
              ? fetchedMessages
              : [];

          setMessages(
            normalizedMessages
              .slice(0, 5)
          );
        } catch (err) {
          console.error(
            "Community preview error:",
            err
          );

          if (active) {
            setError(
              "Unable to load recent conversations."
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadMessages();

    return () => {
      active = false;
    };
  }, []);

  return (
    <motion.article
      className="dashboard-widget community-preview"
      initial={{
        opacity: 0,
        y: 25
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.5,
        delay: 0.26
      }}
    >
      <div className="dashboard-widget__header">
        <div>
          <span className="dashboard-widget__eyebrow">
            <UsersRound size={14} />
            Community
          </span>

          <h2>
            Recent conversations
          </h2>
        </div>

        <Link
          to="/dashboard/community-chat"
          className="dashboard-widget__view-link"
        >
          View all
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="community-preview__posts">
        {loading && (
          <div className="community-preview__state">
            <span className="community-preview__loader" />

            <strong>
              Loading conversations
            </strong>

            <small>
              Checking what the community
              is talking about...
            </small>
          </div>
        )}

        {!loading &&
          error && (
            <div className="community-preview__state">
              <MessagesSquare
                size={22}
              />

              <strong>
                Couldn't load conversations
              </strong>

              <small>
                {error}
              </small>
            </div>
          )}

        {!loading &&
          !error &&
          messages.length === 0 && (
            <div className="community-preview__state">
              <MessagesSquare
                size={22}
              />

              <strong>
                No conversations yet
              </strong>

              <small>
                Start a conversation with
                the UNWIND community.
              </small>
            </div>
          )}

        {!loading &&
          !error &&
          messages.map(
            (message, index) => {
              const name =
                getDisplayName(
                  message
                );

              const text =
                getMessageText(
                  message
                );

              const messageId =
                message?.message_id ||
                message?.messageId ||
                message?.id ||
                index;

              return (
                <Link
                  to="/dashboard/community-chat"
                  className="community-preview__post"
                  key={messageId}
                >
                  <span className="community-preview__avatar">
                    {getInitials(
                      name
                    )}
                  </span>

                  <div className="community-preview__post-content">
                    <div className="community-preview__post-meta">
                      <strong>
                        {name}
                      </strong>

                      <span>
                        Community chat
                      </span>

                      <small>
                        {formatRelativeTime(
                          getMessageDate(
                            message
                          )
                        )}
                      </small>
                    </div>

                    <p>
                      {text ||
                        "Shared a message with the community."}
                    </p>
                  </div>
                </Link>
              );
            }
          )}
      </div>
    </motion.article>
  );
}

export default CommunityPreview;