import {
  useRef,
  useState
} from "react";

import {
  Paperclip,
  UploadCloud
} from "lucide-react";

import {
  JOURNAL_ATTACHMENT_ACCEPT
} from "../../utils/journalAttachmentUtils";

function JournalAttachmentPicker({
  disabled,
  remainingSlots,
  storage,
  onSelectFiles
}) {
  const inputRef =
    useRef(null);

  const [dragging, setDragging] =
    useState(false);

  const pickerDisabled =
    disabled ||
    remainingSlots <= 0;

  function sendFiles(fileList) {
    if (
      pickerDisabled ||
      !fileList?.length
    ) {
      return;
    }

    onSelectFiles(fileList);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div
      className={[
        "journal-attachment-picker",
        dragging
          ? "is-dragging"
          : "",
        pickerDisabled
          ? "is-disabled"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onDragEnter={(event) => {
        event.preventDefault();

        if (!pickerDisabled) {
          setDragging(true);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget
          )
        ) {
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);

        sendFiles(
          event.dataTransfer.files
        );
      }}
    >
      <input
        ref={inputRef}
        className="journal-attachment-picker__input"
        type="file"
        accept={JOURNAL_ATTACHMENT_ACCEPT}
        multiple
        disabled={pickerDisabled}
        onChange={(event) =>
          sendFiles(
            event.target.files
          )
        }
      />

      <span className="journal-attachment-picker__icon">
        <UploadCloud size={22} />
      </span>

      <div>
        <strong>
          Add photos, audio, videos or documents
        </strong>

        <p>
          Drag files here or choose them from your device.
        </p>

        <small>
          {remainingSlots > 0
            ? `${remainingSlots} attachment slot${remainingSlots === 1 ? "" : "s"} remaining`
            : "Maximum 10 attachments reached"}

          {storage
            ?.formattedRemainingStorage
            ? ` · ${storage.formattedRemainingStorage} storage remaining`
            : ""}
        </small>
      </div>

      <button
        type="button"
        disabled={pickerDisabled}
        onClick={() =>
          inputRef.current?.click()
        }
      >
        <Paperclip size={15} />
        Choose files
      </button>
    </div>
  );
}

export default JournalAttachmentPicker;