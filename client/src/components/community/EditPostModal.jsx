import {
  useEffect,
  useState
} from "react";

import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  MessageCircle,
  Save,
  X
} from "lucide-react";

import { updateCommunityPost } from "../../services/communityService";
import { getApiErrorMessage } from "../../services/api";

function EditPostModal({
  post,
  open,
  onClose,
  onUpdated
}) {
  const [caption, setCaption] =
    useState("");

  const [visibility, setVisibility] =
    useState("community");

  const [
    commentsEnabled,
    setCommentsEnabled
  ] = useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!post) {
      return;
    }

    setCaption(post.caption || "");

    setVisibility(
      post.visibility || "community"
    );

    setCommentsEnabled(
      post.comments_enabled !== false
    );

    setError("");
  }, [post]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const postId =
      post?.post_id ||
      post?.postId ||
      post?.id;

    if (!postId) {
      return;
    }

    if (
      post?.post_type === "text" &&
      !caption.trim()
    ) {
      setError(
        "A text post cannot have an empty caption."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const updatedPost =
        await updateCommunityPost(
          postId,
          {
            caption:
              caption.trim() || null,
            visibility,
            commentsEnabled
          }
        );

      onUpdated(updatedPost);
      onClose();
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to update your post."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && post && (
        <>
          <motion.button
            type="button"
            className="community-modal-backdrop"
            onClick={onClose}
            aria-label="Close edit post"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.section
            className="community-modal community-modal--small"
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 25
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.97
            }}
          >
            <header className="community-modal__header">
              <div>
                <span>Edit post</span>
                <p>
                  Media cannot be changed
                  after publishing.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </header>

            <form
              className="community-create-form"
              onSubmit={handleSubmit}
            >
              <label className="community-create-form__caption">
                <textarea
                  value={caption}
                  onChange={(event) =>
                    setCaption(
                      event.target.value
                    )
                  }
                  maxLength={3000}
                  rows={7}
                />

                <span>
                  {caption.length}/3000
                </span>
              </label>

              <div className="community-create-form__settings">
                <label>
                  <span>Visibility</span>

                  <select
                    value={visibility}
                    onChange={(event) =>
                      setVisibility(
                        event.target.value
                      )
                    }
                  >
                    <option value="community">
                      Community
                    </option>

                    <option value="private">
                      Private
                    </option>
                  </select>
                </label>

                <label>
                  <span>
                    <MessageCircle
                      size={17}
                    />
                    Comments
                  </span>

                  <input
                    type="checkbox"
                    checked={
                      commentsEnabled
                    }
                    onChange={(event) =>
                      setCommentsEnabled(
                        event.target.checked
                      )
                    }
                  />
                </label>
              </div>

              {error && (
                <div className="community-form-error">
                  {error}
                </div>
              )}

              <footer className="community-modal__footer">
                <button
                  type="button"
                  className="community-secondary-button"
                  onClick={onClose}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="community-primary-button"
                  disabled={loading}
                >
                  <Save size={16} />

                  {loading
                    ? "Saving…"
                    : "Save changes"}
                </button>
              </footer>
            </form>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

export default EditPostModal;