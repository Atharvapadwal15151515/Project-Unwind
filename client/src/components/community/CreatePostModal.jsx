import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { createPortal } from "react-dom";

import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  Eye,
  EyeOff,
  FileImage,
  Image,
  MessageCircle,
  Play,
  Send,
  Trash2,
  Upload,
  Video,
  X
} from "lucide-react";

import {
  createCommunityPost
} from "../../services/communityService";

import {
  getApiErrorMessage
} from "../../services/api";

const MAX_FILES = 10;

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime"
];

function determinePostType(files) {
  if (!files.length) {
    return "text";
  }

  const hasImages =
    files.some((file) =>
      file.type.startsWith("image/")
    );

  const hasVideos =
    files.some((file) =>
      file.type.startsWith("video/")
    );

  if (hasImages && hasVideos) {
    return "mixed";
  }

  if (hasVideos) {
    return "video";
  }

  return "image";
}

function getVisibleName(
  communityProfile
) {
  return (
    communityProfile?.visibleName ||
    communityProfile?.visible_name ||
    communityProfile?.profile
      ?.visible_name ||
    (
      communityProfile?.profile
        ?.identity_mode === "anonymous"
        ? communityProfile?.profile
            ?.anonymous_alias
        : communityProfile?.profile
            ?.display_name
    ) ||
    "Community member"
  );
}

function CreatePostModal({
  open,
  onClose,
  onCreated,
  communityProfile
}) {
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  const [caption, setCaption] =
    useState("");

  const [media, setMedia] =
    useState([]);

  const [visibility, setVisibility] =
    useState("community");

  const [
    commentsEnabled,
    setCommentsEnabled
  ] = useState(true);

  const [
    dragActive,
    setDragActive
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const postType = useMemo(
    () => determinePostType(media),
    [media]
  );

  const previews = useMemo(
    () =>
      media.map((file) => ({
        file,
        url: URL.createObjectURL(file)
      })),
    [media]
  );

  const visibleName =
    getVisibleName(
      communityProfile
    );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(
          preview.url
        );
      });
    };
  }, [previews]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !loading
      ) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    window.setTimeout(() => {
      modalRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [loading, onClose, open]);

  useEffect(() => {
    if (open) {
      return;
    }

    setCaption("");
    setMedia([]);
    setVisibility("community");
    setCommentsEnabled(true);
    setDragActive(false);
    setLoading(false);
    setError("");
  }, [open]);

  const validateAndAddFiles = (
    selectedFiles
  ) => {
    const files =
      Array.from(
        selectedFiles || []
      );

    if (!files.length) {
      return;
    }

    const combinedFiles = [
      ...media,
      ...files
    ];

    if (
      combinedFiles.length >
      MAX_FILES
    ) {
      setError(
        `You can upload up to ${MAX_FILES} media files.`
      );

      return;
    }

    const invalidFile =
      files.find(
        (file) =>
          !ACCEPTED_TYPES.includes(
            file.type
          )
      );

    if (invalidFile) {
      setError(
        "Only JPEG, PNG, WebP, GIF, MP4, WebM and MOV files are allowed."
      );

      return;
    }

    const oversizedFile =
      files.find(
        (file) =>
          file.size >
          MAX_FILE_SIZE
      );

    if (oversizedFile) {
      setError(
        `"${oversizedFile.name}" is larger than 20 MB.`
      );

      return;
    }

    setError("");
    setMedia(combinedFiles);
  };

  const handleFileInput = (
    event
  ) => {
    validateAndAddFiles(
      event.target.files
    );

    event.target.value = "";
  };

  const handleDragEnter = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragOver = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragLeave = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      event.currentTarget ===
      event.target
    ) {
      setDragActive(false);
    }
  };

  const handleDrop = (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    validateAndAddFiles(
      event.dataTransfer.files
    );
  };

  const removeFile = (
    indexToRemove
  ) => {
    setMedia(
      (currentMedia) =>
        currentMedia.filter(
          (_, index) =>
            index !== indexToRemove
        )
    );
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const trimmedCaption =
      caption.trim();

    if (
      postType === "text" &&
      !trimmedCaption
    ) {
      setError(
        "Write something before publishing a text post."
      );

      return;
    }

    if (
      media.length >
      MAX_FILES
    ) {
      setError(
        `You can upload up to ${MAX_FILES} files.`
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const createdPost =
        await createCommunityPost({
          caption:
            trimmedCaption || null,

          postType,
          visibility,
          commentsEnabled,
          media
        });

      if (!createdPost) {
        throw new Error(
          "The server did not return the created post."
        );
      }

      onCreated?.(createdPost);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to create your post."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div
          className="community-modal-layer"
          aria-hidden={!open}
        >
          <motion.button
            type="button"
            className="community-modal-backdrop"
            onClick={handleClose}
            aria-label="Close create post modal"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            transition={{
              duration: 0.2
            }}
          />

          <div className="community-modal-positioner">
            <motion.section
              ref={modalRef}
              className="community-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-post-title"
              tabIndex={-1}
              initial={{
                opacity: 0,
                scale: 0.96
              }}
              animate={{
                opacity: 1,
                scale: 1
              }}
              exit={{
                opacity: 0,
                scale: 0.97
              }}
              transition={{
                duration: 0.2,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1
                ]
              }}
            >
              <header className="community-modal__header">
                <div>
                  <h2 id="create-post-title">
                    Create a post
                  </h2>

                  <p>
                    Posting as{" "}
                    <strong>
                      {visibleName}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleClose
                  }
                  disabled={loading}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </header>

              <form
                className="community-create-form"
                onSubmit={
                  handleSubmit
                }
              >
                <label className="community-create-form__caption">
                  <textarea
                    value={caption}
                    onChange={(
                      event
                    ) =>
                      setCaption(
                        event.target
                          .value
                      )
                    }
                    placeholder="Share something with the community…"
                    maxLength={3000}
                    rows={6}
                    autoFocus
                  />

                  <span>
                    {caption.length}
                    /3000
                  </span>
                </label>

                <section
                  className={
                    dragActive
                      ? "community-media-dropzone community-media-dropzone--active"
                      : "community-media-dropzone"
                  }
                  onDragEnter={
                    handleDragEnter
                  }
                  onDragOver={
                    handleDragOver
                  }
                  onDragLeave={
                    handleDragLeave
                  }
                  onDrop={
                    handleDrop
                  }
                >
                  <span className="community-media-dropzone__icon">
                    <Upload
                      size={23}
                    />
                  </span>

                  <div>
                    <strong>
                      Add photos or
                      videos
                    </strong>

                    <p>
                      Drag and drop
                      files here, or
                      choose them from
                      your device.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef
                        .current
                        ?.click()
                    }
                  >
                    Choose media
                  </button>

                  <small>
                    JPEG, PNG, WebP,
                    GIF, MP4, WebM or
                    MOV. Maximum 20 MB
                    per file.
                  </small>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    multiple
                    hidden
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    onChange={
                      handleFileInput
                    }
                  />
                </section>

                {previews.length >
                  0 && (
                  <div className="community-create-previews">
                    {previews.map(
                      (
                        preview,
                        index
                      ) => (
                        <div
                          key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
                          className="community-create-preview"
                        >
                          {preview.file.type.startsWith(
                            "video/"
                          ) ? (
                            <>
                              <video
                                src={
                                  preview.url
                                }
                                muted
                                playsInline
                                preload="metadata"
                              />

                              <span className="community-create-preview__type">
                                <Play
                                  size={
                                    14
                                  }
                                />
                              </span>
                            </>
                          ) : (
                            <img
                              src={
                                preview.url
                              }
                              alt={`Selected media ${
                                index +
                                1
                              }`}
                            />
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              removeFile(
                                index
                              )
                            }
                            aria-label={`Remove ${preview.file.name}`}
                          >
                            <Trash2
                              size={
                                15
                              }
                            />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className="community-create-form__toolbar">
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef
                        .current
                        ?.click()
                    }
                  >
                    <Upload
                      size={17}
                    />
                    Add media
                  </button>

                  <span>
                    {media.length}/
                    {MAX_FILES}
                  </span>
                </div>

                <div className="community-create-form__settings">
                  <label>
                    <span>
                      {visibility ===
                      "community" ? (
                        <Eye
                          size={
                            17
                          }
                        />
                      ) : (
                        <EyeOff
                          size={
                            17
                          }
                        />
                      )}

                      Visibility
                    </span>

                    <select
                      value={
                        visibility
                      }
                      onChange={(
                        event
                      ) =>
                        setVisibility(
                          event
                            .target
                            .value
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
                      onChange={(
                        event
                      ) =>
                        setCommentsEnabled(
                          event
                            .target
                            .checked
                        )
                      }
                    />
                  </label>
                </div>

                <div className="community-create-form__summary">
                  {postType ===
                  "text" ? (
                    <FileImage
                      size={17}
                    />
                  ) : postType ===
                    "video" ? (
                    <Video
                      size={17}
                    />
                  ) : postType ===
                    "image" ? (
                    <Image
                      size={17}
                    />
                  ) : (
                    <FileImage
                      size={17}
                    />
                  )}

                  <span>
                    Post type:{" "}
                    <strong>
                      {postType}
                    </strong>
                  </span>
                </div>

                {error && (
                  <div
                    className="community-form-error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <footer className="community-modal__footer">
                  <button
                    type="button"
                    className="community-secondary-button"
                    onClick={
                      handleClose
                    }
                    disabled={
                      loading
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="community-primary-button"
                    disabled={
                      loading
                    }
                  >
                    {loading
                      ? "Publishing…"
                      : "Publish post"}

                    {!loading && (
                      <Send
                        size={16}
                      />
                    )}
                  </button>
                </footer>
              </form>
            </motion.section>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  if (
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    modalContent,
    document.body
  );
}

export default CreatePostModal;