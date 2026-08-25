import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  deleteJournalAttachment,
  getJournalAttachmentError,
  getJournalEntryAttachments,
  removeJournalAttachmentCover,
  reorderJournalAttachments,
  setJournalAttachmentCover,
  updateJournalAttachment,
  uploadJournalAttachment,
  uploadJournalAttachments
} from "../services/journalAttachmentService";

const MAX_ATTACHMENTS = 10;

const FILE_RULES = new Map([
  ["image/jpeg", ["image", 10]],
  ["image/png", ["image", 10]],
  ["image/webp", ["image", 10]],
  ["image/gif", ["image", 10]],
  ["video/mp4", ["video", 25]],
  ["video/webm", ["video", 25]],
  ["video/quicktime", ["video", 25]],
  ["audio/mpeg", ["audio", 15]],
  ["audio/mp3", ["audio", 15]],
  ["audio/wav", ["audio", 15]],
  ["audio/x-wav", ["audio", 15]],
  ["audio/webm", ["audio", 15]],
  ["audio/ogg", ["audio", 15]],
  ["audio/mp4", ["audio", 15]],
  ["audio/x-m4a", ["audio", 15]],
  ["application/pdf", ["document", 10]],
  ["text/plain", ["document", 10]],
  ["application/msword", ["document", 10]],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ["document", 10]
  ]
]);

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;

  if (size <= 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const unitIndex = Math.min(
    Math.floor(
      Math.log(size) /
        Math.log(1024)
    ),
    units.length - 1
  );

  const value =
    size / 1024 ** unitIndex;

  return `${Number(
    value.toFixed(
      value >= 10 ||
      unitIndex === 0
        ? 0
        : 1
    )
  )} ${units[unitIndex]}`;
}

function getAttachmentId(
  attachment
) {
  return (
    attachment?.attachmentId ||
    attachment?.attachment_id ||
    attachment?.pendingId ||
    null
  );
}

function createPendingId() {
  if (
    globalThis.crypto
      ?.randomUUID
  ) {
    return (
      globalThis.crypto
        .randomUUID()
    );
  }

  return (
    `pending-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2)
  );
}

function createPreviewUrl(file) {
  if (
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !==
      "function"
  ) {
    return null;
  }

  if (
    !file.type.startsWith(
      "image/"
    ) &&
    !file.type.startsWith(
      "video/"
    ) &&
    !file.type.startsWith(
      "audio/"
    )
  ) {
    return null;
  }

  return URL.createObjectURL(file);
}

function revokePreviewUrl(
  previewUrl
) {
  if (
    !previewUrl ||
    typeof URL === "undefined" ||
    typeof URL.revokeObjectURL !==
      "function"
  ) {
    return;
  }

  URL.revokeObjectURL(
    previewUrl
  );
}

function sortAttachments(
  attachments
) {
  return [...attachments].sort(
    (first, second) =>
      Number(
        first.attachmentOrder ??
          first.attachment_order ??
          0
      ) -
      Number(
        second.attachmentOrder ??
          second.attachment_order ??
          0
      )
  );
}

function mergeAttachments(
  currentAttachments,
  incomingAttachments
) {
  const merged = new Map();

  currentAttachments.forEach(
    (attachment) => {
      const id =
        getAttachmentId(
          attachment
        );

      if (id) {
        merged.set(id, attachment);
      }
    }
  );

  incomingAttachments.forEach(
    (attachment) => {
      const id =
        getAttachmentId(
          attachment
        );

      if (id) {
        merged.set(id, attachment);
      }
    }
  );

  return sortAttachments(
    [...merged.values()]
  );
}

function validateFiles(
  files,
  availableSlots
) {
  if (files.length === 0) {
    return "Choose at least one file.";
  }

  if (
    files.length > availableSlots
  ) {
    return `Only ${availableSlots} attachment slot${
      availableSlots === 1
        ? " is"
        : "s are"
    } remaining.`;
  }

  for (const file of files) {
    const rule = FILE_RULES.get(
      String(file.type).toLowerCase()
    );

    if (!rule) {
      return `${file.name}: this file type is not supported.`;
    }

    if (!file.size) {
      return `${file.name}: the file is empty.`;
    }

    const [attachmentType,
      maximumMegabytes] = rule;

    if (
      file.size >
      maximumMegabytes *
        1024 *
        1024
    ) {
      return `${file.name}: ${attachmentType} files cannot exceed ${maximumMegabytes} MB.`;
    }
  }

  return "";
}

export function useJournalAttachments({
  entryId = null,
  active = true
} = {}) {
  const [attachments,
    setAttachmentsState] = useState([]);

  const [pendingAttachments,
    setPendingAttachmentsState] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [uploading,
    setUploading] = useState(false);

  const [uploadProgress,
    setUploadProgress] =
    useState(0);

  const [busyAttachmentId,
    setBusyAttachmentId] =
    useState(null);

  const [error, setError] =
    useState("");

  const attachmentsRef =
    useRef([]);

  const pendingAttachmentsRef =
    useRef([]);

  const loadRequestRef =
    useRef(0);

  const loadedEntryIdRef =
    useRef(null);

  const setAttachments =
    useCallback((updater) => {
      setAttachmentsState(
        (current) => {
          const next =
            typeof updater ===
            "function"
              ? updater(current)
              : updater;

          attachmentsRef.current =
            next;

          return next;
        }
      );
    }, []);

  const setPendingAttachments =
    useCallback((updater) => {
      setPendingAttachmentsState(
        (current) => {
          const next =
            typeof updater ===
            "function"
              ? updater(current)
              : updater;

          pendingAttachmentsRef.current =
            next;

          return next;
        }
      );
    }, []);

  const reset = useCallback(() => {
    loadRequestRef.current += 1;

    pendingAttachmentsRef
      .current
      .forEach((attachment) => {
        revokePreviewUrl(
          attachment.previewUrl
        );
      });

    attachmentsRef.current = [];
    pendingAttachmentsRef.current = [];
    loadedEntryIdRef.current = null;

    setAttachmentsState([]);
    setPendingAttachmentsState([]);
    setLoading(false);
    setUploading(false);
    setUploadProgress(0);
    setBusyAttachmentId(null);
    setError("");
  }, []);

  const loadAttachments =
    useCallback(
      async (
        targetEntryId = entryId
      ) => {
        if (
          !active ||
          !targetEntryId
        ) {
          setLoading(false);
          return [];
        }

        const requestId =
          loadRequestRef.current + 1;

        loadRequestRef.current =
          requestId;

        setLoading(true);
        setError("");

        try {
          const result =
            await getJournalEntryAttachments(
              targetEntryId
            );

          if (
            loadRequestRef.current !==
            requestId
          ) {
            return [];
          }

          const loadedAttachments =
            result.attachments || [];

          if (
            loadedEntryIdRef.current !==
            targetEntryId
          ) {
            loadedEntryIdRef.current =
              targetEntryId;

            setAttachments(
              sortAttachments(
                loadedAttachments
              )
            );
          } else {
            setAttachments(
              (current) =>
                mergeAttachments(
                  current,
                  loadedAttachments
                )
            );
          }

          return loadedAttachments;
        } catch (loadError) {
          if (
            loadRequestRef.current ===
            requestId
          ) {
            setError(
              getJournalAttachmentError(
                loadError,
                "Attachments could not be loaded."
              )
            );
          }

          return [];
        } finally {
          if (
            loadRequestRef.current ===
            requestId
          ) {
            setLoading(false);
          }
        }
      },
      [active, entryId, setAttachments]
    );

  useEffect(() => {
    if (
      !active ||
      !entryId
    ) {
      return;
    }

    const loadTimer =
      globalThis.setTimeout(
        () => {
          loadAttachments(
            entryId
          );
        },
        0
      );

    return () => {
      globalThis.clearTimeout(
        loadTimer
      );
    };
  }, [
    active,
    entryId,
    loadAttachments
  ]);

  useEffect(
    () => () => {
      pendingAttachmentsRef
        .current
        .forEach((attachment) => {
          revokePreviewUrl(
            attachment.previewUrl
          );
        });
    },
    []
  );

  const uploadRecords =
    useCallback(
      async (
        records,
        targetEntryId
      ) => {
        if (
          !targetEntryId ||
          records.length === 0
        ) {
          return true;
        }

        setUploading(true);
        setUploadProgress(0);
        setError("");

        const recordIds = new Set(
          records.map(
            (record) =>
              record.pendingId
          )
        );

        setPendingAttachments(
          (current) =>
            current.map(
              (record) =>
                recordIds.has(
                  record.pendingId
                )
                  ? {
                      ...record,
                      status:
                        "uploading",
                      error: ""
                    }
                  : record
            )
        );

        try {
          let uploadedAttachments;

          if (records.length === 1) {
            const record = records[0];

            const uploaded =
              await uploadJournalAttachment(
                targetEntryId,
                record.file,
                {
                  caption:
                    record.caption,
                  altText:
                    record.altText,
                  isCover:
                    record.isCover
                },
                setUploadProgress
              );

            uploadedAttachments =
              uploaded
                ? [uploaded]
                : [];
          } else {
            uploadedAttachments =
              await uploadJournalAttachments(
                targetEntryId,
                records.map(
                  (record) =>
                    record.file
                ),
                records.map(
                  (record) => ({
                    caption:
                      record.caption,
                    altText:
                      record.altText,
                    isCover:
                      record.isCover
                  })
                ),
                setUploadProgress
              );
          }

          if (
            uploadedAttachments.length !==
            records.length
          ) {
            throw new Error(
              "The server did not return every uploaded attachment."
            );
          }

          setAttachments(
            (current) =>
              mergeAttachments(
                current,
                uploadedAttachments
              )
          );

          setPendingAttachments(
            (current) =>
              current.filter(
                (record) => {
                  if (
                    !recordIds.has(
                      record.pendingId
                    )
                  ) {
                    return true;
                  }

                  revokePreviewUrl(
                    record.previewUrl
                  );

                  return false;
                }
              )
          );

          setUploadProgress(100);

          return true;
        } catch (uploadError) {
          const message =
            getJournalAttachmentError(
              uploadError,
              "The files could not be uploaded."
            );

          setError(message);

          setPendingAttachments(
            (current) =>
              current.map(
                (record) =>
                  recordIds.has(
                    record.pendingId
                  )
                    ? {
                        ...record,
                        status:
                          "failed",
                        error:
                          message
                      }
                    : record
              )
          );

          return false;
        } finally {
          setUploading(false);
        }
      },
      [
        setAttachments,
        setPendingAttachments
      ]
    );

  const addFiles = useCallback(
    async (fileList) => {
      const files =
        Array.from(fileList || []);

      const availableSlots =
        Math.max(
          MAX_ATTACHMENTS -
            attachmentsRef.current
              .length -
            pendingAttachmentsRef
              .current.length,
          0
        );

      const validationError =
        validateFiles(
          files,
          availableSlots
        );

      if (validationError) {
        setError(validationError);
        return false;
      }

      const records = files.map(
        (file) => {
          const [attachmentType] =
            FILE_RULES.get(
              String(file.type)
                .toLowerCase()
            );

          return {
            pendingId:
              createPendingId(),
            file,
            previewUrl:
              createPreviewUrl(file),
            attachmentType,
            originalFileName:
              file.name,
            mimeType: file.type,
            fileSizeBytes:
              file.size,
            formattedFileSize:
              formatFileSize(
                file.size
              ),
            caption: "",
            altText: "",
            isCover: false,
            status: "pending",
            error: ""
          };
        }
      );

      setPendingAttachments(
        (current) => [
          ...current,
          ...records
        ]
      );

      setError("");

      if (entryId) {
        return uploadRecords(
          records,
          entryId
        );
      }

      return true;
    },
    [
      entryId,
      setPendingAttachments,
      uploadRecords
    ]
  );

  const updatePendingAttachment =
    useCallback(
      (pendingId, changes) => {
        setPendingAttachments(
          (current) =>
            current.map(
              (attachment) =>
                attachment.pendingId ===
                pendingId
                  ? {
                      ...attachment,
                      ...changes
                    }
                  : changes.isCover ===
                      true
                    ? {
                        ...attachment,
                        isCover: false
                      }
                  : attachment
            )
        );
      },
      [setPendingAttachments]
    );

  const removePendingAttachment =
    useCallback(
      (pendingId) => {
        setPendingAttachments(
          (current) =>
            current.filter(
              (attachment) => {
                if (
                  attachment.pendingId !==
                  pendingId
                ) {
                  return true;
                }

                revokePreviewUrl(
                  attachment.previewUrl
                );

                return false;
              }
            )
        );
      },
      [setPendingAttachments]
    );

  const uploadPendingAttachments =
    useCallback(
      async (targetEntryId) => {
        const records =
          pendingAttachmentsRef
            .current;

        if (records.length === 0) {
          return true;
        }

        return uploadRecords(
          records,
          targetEntryId || entryId
        );
      },
      [entryId, uploadRecords]
    );

  const updateAttachmentDraft =
    useCallback(
      (
        attachmentId,
        changes
      ) => {
        setAttachments(
          (current) =>
            current.map(
              (attachment) =>
                getAttachmentId(
                  attachment
                ) === attachmentId
                  ? {
                      ...attachment,
                      ...changes,
                      hasUnsavedMetadata:
                        true
                    }
                  : attachment
            )
        );
      },
      [setAttachments]
    );

  const saveAttachmentMetadata =
    useCallback(
      async (attachmentId) => {
        const attachment =
          attachmentsRef.current.find(
            (candidate) =>
              getAttachmentId(
                candidate
              ) === attachmentId
          );

        if (!attachment) {
          return false;
        }

        setBusyAttachmentId(
          attachmentId
        );
        setError("");

        try {
          const updated =
            await updateJournalAttachment(
              attachmentId,
              {
                caption:
                  attachment.caption ||
                  null,
                altText:
                  attachment.altText ||
                  null
              }
            );

          if (!updated) {
            throw new Error(
              "The server did not return the updated attachment."
            );
          }

          setAttachments(
            (current) =>
              current.map(
                (candidate) =>
                  getAttachmentId(
                    candidate
                  ) === attachmentId
                    ? updated
                    : candidate
              )
          );

          return true;
        } catch (metadataError) {
          setError(
            getJournalAttachmentError(
              metadataError,
              "Attachment details could not be saved."
            )
          );

          return false;
        } finally {
          setBusyAttachmentId(null);
        }
      },
      [setAttachments]
    );

  const toggleAttachmentCover =
    useCallback(
      async (attachmentId) => {
        const attachment =
          attachmentsRef.current.find(
            (candidate) =>
              getAttachmentId(
                candidate
              ) === attachmentId
          );

        if (!attachment) {
          return false;
        }

        setBusyAttachmentId(
          attachmentId
        );
        setError("");

        try {
          const isCover = Boolean(
            attachment.isCover ??
              attachment.is_cover
          );

          const updated = isCover
            ? await removeJournalAttachmentCover(
                attachmentId
              )
            : await setJournalAttachmentCover(
                attachmentId
              );

          if (!updated) {
            throw new Error(
              "The server did not return the updated cover."
            );
          }

          setAttachments(
            (current) =>
              current.map(
                (candidate) => {
                  const candidateId =
                    getAttachmentId(
                      candidate
                    );

                  if (
                    candidateId ===
                    attachmentId
                  ) {
                    return updated;
                  }

                  return isCover
                    ? candidate
                    : {
                        ...candidate,
                        isCover: false,
                        is_cover: false
                      };
                }
              )
          );

          return true;
        } catch (coverError) {
          setError(
            getJournalAttachmentError(
              coverError,
              "The attachment cover could not be changed."
            )
          );

          return false;
        } finally {
          setBusyAttachmentId(null);
        }
      },
      [setAttachments]
    );

  const removeAttachment =
    useCallback(
      async (attachmentId) => {
        setBusyAttachmentId(
          attachmentId
        );
        setError("");

        try {
          await deleteJournalAttachment(
            attachmentId
          );

          setAttachments(
            (current) =>
              current.filter(
                (attachment) =>
                  getAttachmentId(
                    attachment
                  ) !== attachmentId
              )
          );

          return true;
        } catch (deleteError) {
          setError(
            getJournalAttachmentError(
              deleteError,
              "The attachment could not be removed."
            )
          );

          return false;
        } finally {
          setBusyAttachmentId(null);
        }
      },
      [setAttachments]
    );

  const reorderAttachments =
    useCallback(
      async (orderedAttachments) => {
        if (!entryId) {
          return false;
        }

        try {
          const updated =
            await reorderJournalAttachments(
              entryId,
              orderedAttachments
            );

          setAttachments(updated);
          return true;
        } catch (reorderError) {
          setError(
            getJournalAttachmentError(
              reorderError,
              "Attachments could not be reordered."
            )
          );

          return false;
        }
      },
      [entryId, setAttachments]
    );

  const totalCount =
    attachments.length +
    pendingAttachments.length;

  return {
    attachments,
    pendingAttachments,
    loading,
    uploading,
    uploadProgress,
    busyAttachmentId,
    error,
    totalCount,
    hasPendingAttachments:
      pendingAttachments.length > 0,
    remainingSlots:
      Math.max(
        MAX_ATTACHMENTS -
          totalCount,
        0
      ),

    clearError: () =>
      setError(""),
    loadAttachments,
    addFiles,
    updatePendingAttachment,
    removePendingAttachment,
    uploadPendingAttachments,
    updateAttachmentDraft,
    saveAttachmentMetadata,
    toggleAttachmentCover,
    removeAttachment,
    reorderAttachments,
    reset
  };
}
