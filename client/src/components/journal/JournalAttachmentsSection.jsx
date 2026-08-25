import {
  LoaderCircle,
  Paperclip,
  X
} from "lucide-react";
import {
  useConfirm
} from "../../context/ConfirmDialogContext";
import JournalAttachmentCard
  from "./JournalAttachmentCard";
import JournalAttachmentPicker
  from "./JournalAttachmentPicker";

import {
  getJournalAttachmentId
} from "../../utils/journalAttachmentUtils";

function JournalAttachmentsSection({
  attachmentManager,
  disabled = false,
  hasSavedEntry = false
}) {
  const confirm = useConfirm();
  const {
    attachments,
    pendingAttachments,
    loading,
    uploading,
    uploadProgress,
    busyAttachmentId,
    error,
    totalCount,
    remainingSlots,
    clearError,
    addFiles,
    updatePendingAttachment,
    removePendingAttachment,
    updateAttachmentDraft,
    saveAttachmentMetadata,
    toggleAttachmentCover,
    removeAttachment,
    reorderAttachments
  } = attachmentManager;

  async function handleRemoveSaved(
    attachment
  ) {
    const attachmentId =
      getJournalAttachmentId(
        attachment
      );

   const confirmed =
  await confirm({
    title: "Remove attachment?",
    message:
      "This attachment will be removed from the journal entry.",
    confirmText: "Remove",
    tone: "danger"
  });

    if (confirmed) {
      await removeAttachment(
        attachmentId
      );
    }
  }

  async function handleMoveSaved(
    attachment,
    direction
  ) {
    const attachmentId =
      getJournalAttachmentId(
        attachment
      );

    const currentIndex =
      attachments.findIndex(
        (candidate) =>
          getJournalAttachmentId(
            candidate
          ) === attachmentId
      );

    const nextIndex =
      currentIndex + direction;

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >=
        attachments.length
    ) {
      return;
    }

    const orderedAttachments =
      [...attachments];

    [
      orderedAttachments[
        currentIndex
      ],
      orderedAttachments[nextIndex]
    ] = [
      orderedAttachments[nextIndex],
      orderedAttachments[
        currentIndex
      ]
    ];

    await reorderAttachments(
      orderedAttachments
    );
  }

  return (
    <section className="journal-attachments">
      <header className="journal-attachments__header">
        <div>
          <span>
            <Paperclip size={16} />
            Attachments
          </span>

          <p>
            {hasSavedEntry
              ? "Uploaded media appears here immediately and remains available when you reopen this entry."
              : "Selected files preview here now and upload after this entry is saved."}
          </p>
        </div>

        <small>
          {totalCount}/10
        </small>
      </header>

      {error ? (
        <div className="journal-attachments__error" role="alert">
          <span>{error}</span>

          <button
            type="button"
            aria-label="Dismiss attachment error"
            onClick={clearError}
          >
            <X size={15} />
          </button>
        </div>
      ) : null}

      <JournalAttachmentPicker
        disabled={
          disabled || uploading
        }
        remainingSlots={
          remainingSlots
        }
        onSelectFiles={addFiles}
      />

      {uploading ? (
        <div className="journal-attachments__uploading" aria-live="polite">
          <div>
            <LoaderCircle
              className="journal-spin"
              size={15}
            />
            Uploading attachment{pendingAttachments.length === 1 ? "" : "s"}...
          </div>

          <strong>
            {uploadProgress}%
          </strong>

          <span>
            <i
              style={{
                width: `${uploadProgress}%`
              }}
            />
          </span>
        </div>
      ) : null}

      {loading ? (
        <div className="journal-attachments__loading">
          <LoaderCircle
            className="journal-spin"
            size={18}
          />
          Loading attachments...
        </div>
      ) : null}

      {pendingAttachments.length > 0 ? (
        <div className="journal-attachments__group">
          <div className="journal-attachments__pending-heading">
            <h4>
              {hasSavedEntry
                ? "Upload queue"
                : "Ready after save"}
            </h4>

            {!hasSavedEntry ? (
              <small>
                Save the entry to upload these files securely.
              </small>
            ) : null}
          </div>

          <div className="journal-attachments__grid">
            {pendingAttachments.map(
              (attachment) => (
                <JournalAttachmentCard
                  key={attachment.pendingId}
                  attachment={attachment}
                  pending
                  disabled={
                    disabled ||
                    uploading
                  }
                  onChange={(
                    pendingAttachment,
                    changes
                  ) =>
                    updatePendingAttachment(
                      pendingAttachment.pendingId,
                      changes
                    )
                  }
                  onToggleCover={(
                    pendingAttachment
                  ) =>
                    updatePendingAttachment(
                      pendingAttachment.pendingId,
                      {
                        isCover:
                          !pendingAttachment.isCover
                      }
                    )
                  }
                  onRemove={
                    (pendingAttachment) =>
                      removePendingAttachment(
                        pendingAttachment.pendingId
                      )
                  }
                />
              )
            )}
          </div>
        </div>
      ) : null}

      {!loading &&
      attachments.length > 0 ? (
        <div className="journal-attachments__group">
          <h4>Uploaded media</h4>

          <div className="journal-attachments__grid">
            {attachments.map(
              (attachment, index) => {
                const attachmentId =
                  getJournalAttachmentId(
                    attachment
                  );

                return (
                  <JournalAttachmentCard
                    key={attachmentId}
                    attachment={attachment}
                    disabled={
                      disabled ||
                      uploading
                    }
                    actionAttachmentId={
                      busyAttachmentId
                    }
                    index={index}
                    total={
                      attachments.length
                    }
                    onChange={(
                      savedAttachment,
                      changes
                    ) =>
                      updateAttachmentDraft(
                        getJournalAttachmentId(
                          savedAttachment
                        ),
                        changes
                      )
                    }
                    onSaveMetadata={(
                      savedAttachment
                    ) =>
                      saveAttachmentMetadata(
                        getJournalAttachmentId(
                          savedAttachment
                        )
                      )
                    }
                    onToggleCover={(
                      savedAttachment
                    ) =>
                      toggleAttachmentCover(
                        getJournalAttachmentId(
                          savedAttachment
                        )
                      )
                    }
                    onMove={
                      handleMoveSaved
                    }
                    onRemove={
                      handleRemoveSaved
                    }
                  />
                );
              }
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default JournalAttachmentsSection;
