import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Headphones,
  Image as ImageIcon,
  LoaderCircle,
  Save,
  Star,
  Trash2,
  Video
} from "lucide-react";

import {
  getJournalAttachmentId,
  getJournalAttachmentType
} from "../../utils/journalAttachmentUtils";

function AttachmentPreview({
  attachment
}) {
  const attachmentType =
    getJournalAttachmentType(
      attachment
    );

  const source =
    attachment.previewUrl ||
    attachment.fileUrl ||
    attachment.file_url ||
    attachment.secure_url;

  const fileName =
    attachment.originalFileName ||
    attachment.original_file_name ||
    "Journal attachment";

  if (
    attachmentType === "image" &&
    source
  ) {
    return (
      <img
        src={source}
        alt={
          attachment.altText ||
          fileName
        }
      />
    );
  }

  if (
    attachmentType === "video" &&
    source
  ) {
    return (
      <video
        src={source}
        controls
        preload="metadata"
      />
    );
  }

  if (
    attachmentType === "audio"
  ) {
    return (
      <div className="journal-attachment-card__audio">
        <Headphones size={28} />

        {source ? (
          <audio
            src={source}
            controls
            preload="metadata"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="journal-attachment-card__document">
      <FileText size={34} />
      <span>{fileName}</span>
    </div>
  );
}

function TypeIcon({
  attachment
}) {
  const attachmentType =
    getJournalAttachmentType(
      attachment
    );

  if (attachmentType === "image") {
    return <ImageIcon size={14} />;
  }

  if (attachmentType === "video") {
    return <Video size={14} />;
  }

  if (attachmentType === "audio") {
    return <Headphones size={14} />;
  }

  return <FileText size={14} />;
}

function JournalAttachmentCard({
  attachment,
  pending,
  index,
  total,
  disabled,
  actionAttachmentId,
  onChange,
  onSaveMetadata,
  onToggleCover,
  onMove,
  onRemove
}) {
  const attachmentId =
    pending
      ? attachment.pendingId ||
        attachment.clientId
      : getJournalAttachmentId(
          attachment
        );

  const busy =
    disabled ||
    actionAttachmentId ===
      attachmentId ||
    attachment.status ===
      "uploading";

  const source =
    attachment.previewUrl ||
    attachment.fileUrl ||
    attachment.file_url ||
    attachment.secure_url;

  const isCover = Boolean(
    attachment.isCover ??
      attachment.is_cover
  );

  const fileName =
    attachment.originalFileName ||
    attachment.original_file_name ||
    "Journal attachment";

  return (
    <article
      className={[
        "journal-attachment-card",
        isCover
          ? "is-cover"
          : "",
        pending
          ? "is-pending"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="journal-attachment-card__preview">
        <AttachmentPreview
          attachment={attachment}
        />

        <span className="journal-attachment-card__type">
          <TypeIcon
            attachment={attachment}
          />

          {attachment.attachmentType ||
            "document"}
        </span>

        {isCover ? (
          <span className="journal-attachment-card__cover">
            <Star
              size={12}
              fill="currentColor"
            />
            Cover
          </span>
        ) : null}
      </div>

      <div className="journal-attachment-card__body">
        <div className="journal-attachment-card__heading">
          <div>
            <strong title={fileName}>
              {fileName}
            </strong>

            <small>
              {attachment.formattedFileSize ||
                attachment.formatted_file_size ||
                ""}

              {pending
                ? [
                    "error",
                    "failed"
                  ].includes(
                    attachment.status
                  )
                  ? " · Upload failed"
                  : " · Waiting to upload"
                : ""}
            </small>
          </div>

          {source ? (
            <a
              href={source}
              target="_blank"
              rel="noreferrer"
              aria-label="Open attachment"
              title="Open attachment"
            >
              <ExternalLink size={15} />
            </a>
          ) : null}
        </div>

        {attachment.status ===
        "uploading" ? (
          <div className="journal-attachment-card__progress">
            <span
              style={{
                width:
                  `${attachment.uploadProgress || 0}%`
              }}
            />
          </div>
        ) : null}

        {attachment.errorMessage ||
        attachment.error ? (
          <p className="journal-attachment-card__error">
            {attachment.errorMessage ||
              attachment.error}
          </p>
        ) : null}

        <label>
          <span>Caption</span>

          <input
            type="text"
            value={
              attachment.caption || ""
            }
            maxLength={500}
            disabled={busy}
            placeholder="Add a short caption"
            onChange={(event) =>
              onChange?.(
                attachment,
                {
                  caption:
                    event.target.value
                }
              )
            }
          />
        </label>

        <label>
          <span>Alternative text</span>

          <input
            type="text"
            value={
              attachment.altText || ""
            }
            maxLength={500}
            disabled={busy}
            placeholder="Describe this attachment"
            onChange={(event) =>
              onChange?.(
                attachment,
                {
                  altText:
                    event.target.value
                }
              )
            }
          />
        </label>

        <div className="journal-attachment-card__actions">
          <button
            type="button"
            className={
              isCover
                ? "is-active"
                : ""
            }
            disabled={busy}
            onClick={() =>
              onToggleCover?.(
                attachment
              )
            }
          >
            <Star
              size={14}
              fill={
                isCover
                  ? "currentColor"
                  : "none"
              }
            />

            {isCover
              ? "Remove cover"
              : "Make cover"}
          </button>

          <div>
            {onMove ? (
              <>
            <button
              type="button"
              disabled={
                busy || index === 0
              }
              aria-label="Move attachment left"
              title="Move left"
              onClick={() =>
                onMove?.(
                  attachment,
                  -1
                )
              }
            >
              <ChevronLeft size={15} />
            </button>

            <button
              type="button"
              disabled={
                busy ||
                index === total - 1
              }
              aria-label="Move attachment right"
              title="Move right"
              onClick={() =>
                onMove?.(
                  attachment,
                  1
                )
              }
            >
              <ChevronRight size={15} />
            </button>
              </>
            ) : null}

            <button
              type="button"
              className="is-danger"
              disabled={busy}
              aria-label="Remove attachment"
              title="Remove"
              onClick={() =>
                onRemove?.(
                  attachment
                )
              }
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {!pending &&
        (attachment.metadataDirty ||
          attachment.hasUnsavedMetadata) ? (
          <button
            type="button"
            className="journal-attachment-card__save"
            disabled={busy}
            onClick={() =>
              onSaveMetadata?.(
                attachment
              )
            }
          >
            {actionAttachmentId ===
            attachmentId ? (
              <LoaderCircle
                size={14}
                className="journal-spin"
              />
            ) : (
              <Save size={14} />
            )}

            Save attachment details
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default JournalAttachmentCard;
