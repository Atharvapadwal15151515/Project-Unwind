import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Check,
  Edit3,
  LoaderCircle,
  Plus,
  Search,
  Tag,
  Trash2,
  X
} from "lucide-react";
import {
  useConfirm
} from "../../context/ConfirmDialogContext";
import {
  createJournalTag,
  deleteJournalTag,
  getJournalMetadataError,
  getJournalTags,
  updateJournalTag
} from "../../services/journalMetadataService";

function getTagId(tag) {
  return (
    tag?.tagId ||
    tag?.tag_id
  );
}

function getTagName(tag) {
  return (
    tag?.tagName ||
    tag?.tag_name ||
    ""
  );
}

function isSystemTag(tag) {
  return Boolean(
    tag?.isSystem ??
    tag?.is_system
  );
}

function JournalTagSelector({
  selectedIds = [],
  disabled = false,
  onChange
}) {
  const [
    tags,
    setTags
  ] = useState([]);

  const [
    search,
    setSearch
  ] = useState("");

  const [
    newTagName,
    setNewTagName
  ] = useState("");

  const [
    open,
    setOpen
  ] = useState(false);

  const [
    managing,
    setManaging
  ] = useState(false);

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    actionTagId,
    setActionTagId
  ] = useState(null);

  const [
    error,
    setError
  ] = useState("");

  const [
    editingTagId,
    setEditingTagId
  ] = useState(null);

  const [
    editingName,
    setEditingName
  ] = useState("");

  const loadTags =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await getJournalTags();

        setTags(
          Array.isArray(result)
            ? result
            : []
        );
      } catch (loadError) {
        setError(
          getJournalMetadataError(
            loadError,
            "Journal tags could not be loaded."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const selectedSet =
    useMemo(
      () =>
        new Set(
          selectedIds || []
        ),
      [selectedIds]
    );

  const selectedTags =
    useMemo(
      () =>
        tags.filter((tag) =>
          selectedSet.has(
            getTagId(tag)
          )
        ),
      [
        tags,
        selectedSet
      ]
    );
const confirm = useConfirm();
  const visibleTags =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return tags;
      }

      return tags.filter(
        (tag) =>
          getTagName(tag)
            .toLowerCase()
            .includes(
              normalizedSearch
            )
      );
    }, [
      search,
      tags
    ]);

  function toggleTag(tag) {
    if (disabled) {
      return;
    }

    const tagId =
      getTagId(tag);

    if (!tagId) {
      return;
    }

    if (
      selectedSet.has(tagId)
    ) {
      onChange(
        selectedIds.filter(
          (id) =>
            id !== tagId
        )
      );

      return;
    }

    onChange([
      ...selectedIds,
      tagId
    ]);
  }

  function removeSelectedTag(
    tagId
  ) {
    if (disabled) {
      return;
    }

    onChange(
      selectedIds.filter(
        (id) => id !== tagId
      )
    );
  }

  async function handleCreate(
    event
  ) {
    event.preventDefault();

    const name =
      newTagName.trim();

    if (!name) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const createdTag =
        await createJournalTag(
          name
        );

      setNewTagName("");

      await loadTags();

      const createdId =
        getTagId(createdTag);

      /*
        Automatically select a newly
        created custom tag.
      */
      if (
        createdId &&
        !selectedSet.has(
          createdId
        )
      ) {
        onChange([
          ...selectedIds,
          createdId
        ]);
      }
    } catch (createError) {
      setError(
        getJournalMetadataError(
          createError,
          "The tag could not be created."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function beginEdit(tag) {
    setEditingTagId(
      getTagId(tag)
    );

    setEditingName(
      getTagName(tag)
    );

    setError("");
  }

  function cancelEdit() {
    setEditingTagId(null);
    setEditingName("");
  }

  async function saveEdit(
    tag
  ) {
    const tagId =
      getTagId(tag);

    const name =
      editingName.trim();

    if (!name) {
      setError(
        "Tag name cannot be empty."
      );

      return;
    }

    setActionTagId(tagId);
    setError("");

    try {
      await updateJournalTag(
        tag,
        name
      );

      cancelEdit();

      await loadTags();
    } catch (updateError) {
      setError(
        getJournalMetadataError(
          updateError,
          "The tag could not be updated."
        )
      );
    } finally {
      setActionTagId(null);
    }
  }

  async function handleDelete(
    tag
  ) {
    if (
      isSystemTag(tag)
    ) {
      return;
    }

    const confirmed =
  await confirm({
    title: "Delete tag?",
    message: `Delete the tag "${getTagName(
      tag
    )}"?`,
    confirmText: "Delete",
    tone: "danger"
  });

    if (!confirmed) {
      return;
    }

    const tagId =
      getTagId(tag);

    setActionTagId(tagId);
    setError("");

    try {
      await deleteJournalTag(
        tag
      );

      /*
        Remove a deleted tag from
        this entry's current selection.
      */
      if (
        selectedSet.has(tagId)
      ) {
        onChange(
          selectedIds.filter(
            (id) =>
              id !== tagId
          )
        );
      }

      await loadTags();
    } catch (deleteError) {
      setError(
        getJournalMetadataError(
          deleteError,
          "The tag could not be deleted."
        )
      );
    } finally {
      setActionTagId(null);
    }
  }

  return (
    <section className="journal-tags">
      <div className="journal-tags__heading">
        <div>
          <span>
            <Tag size={16} />
            Tags
          </span>

          <small>
            Add topics that help you
            find this reflection later.
          </small>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            setOpen(
              (current) =>
                !current
            )
          }
        >
          <Plus size={15} />

          {open
            ? "Done"
            : "Add tags"}
        </button>
      </div>

      {selectedTags.length ? (
        <div className="journal-tags__selected">
          {selectedTags.map(
            (tag) => {
              const tagId =
                getTagId(tag);

              return (
                <span
                  key={tagId}
                  className="journal-tag-chip"
                >
                  #
                  {getTagName(
                    tag
                  )}

                  <button
                    type="button"
                    disabled={
                      disabled
                    }
                    onClick={() =>
                      removeSelectedTag(
                        tagId
                      )
                    }
                    aria-label={
                      `Remove ${getTagName(
                        tag
                      )}`
                    }
                  >
                    <X
                      size={13}
                    />
                  </button>
                </span>
              );
            }
          )}
        </div>
      ) : (
        <p className="journal-tags__empty-selection">
          No tags added yet.
        </p>
      )}

      {open ? (
        <div className="journal-tags__panel">
          <label className="journal-tags__search">
            <Search size={16} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search tags..."
              disabled={disabled}
            />
          </label>

          {error ? (
            <div className="journal-tags__error">
              {error}
            </div>
          ) : null}

          {loading &&
          !tags.length ? (
            <div className="journal-tags__loading">
              <LoaderCircle
                size={18}
                className="journal-spin"
              />

              Loading tags...
            </div>
          ) : (
            <div className="journal-tags__options">
              {visibleTags.map(
                (tag) => {
                  const tagId =
                    getTagId(tag);

                  const selected =
                    selectedSet.has(
                      tagId
                    );

                  return (
                    <button
                      key={tagId}
                      type="button"
                      disabled={
                        disabled
                      }
                      className={
                        selected
                          ? "is-selected"
                          : ""
                      }
                      onClick={() =>
                        toggleTag(
                          tag
                        )
                      }
                    >
                      <span>
                        #
                        {getTagName(
                          tag
                        )}
                      </span>

                      {selected ? (
                        <Check
                          size={15}
                        />
                      ) : null}
                    </button>
                  );
                }
              )}

              {!visibleTags.length ? (
                <p>
                  No matching tags.
                </p>
              ) : null}
            </div>
          )}

          <form
            className="journal-tags__create"
            onSubmit={
              handleCreate
            }
          >
            <input
              value={newTagName}
              disabled={
                disabled ||
                loading
              }
              onChange={(event) =>
                setNewTagName(
                  event.target
                    .value
                )
              }
              placeholder="Create your own tag..."
              maxLength={50}
            />

            <button
              type="submit"
              disabled={
                disabled ||
                loading ||
                !newTagName.trim()
              }
            >
              <Plus size={15} />
              Create
            </button>
          </form>

          <button
            type="button"
            className="journal-tags__manage-toggle"
            onClick={() =>
              setManaging(
                (current) =>
                  !current
              )
            }
          >
            {managing
              ? "Close tag management"
              : "Manage my tags"}
          </button>

          {managing ? (
            <div className="journal-tags__manager">
              <div className="journal-tags__manager-title">
                My tags
              </div>

              {tags
                .filter(
                  (tag) =>
                    !isSystemTag(
                      tag
                    )
                )
                .map((tag) => {
                  const tagId =
                    getTagId(tag);

                  const editing =
                    editingTagId ===
                    tagId;

                  const busy =
                    actionTagId ===
                    tagId;

                  return (
                    <div
                      key={tagId}
                      className="journal-tags__manager-row"
                    >
                      {editing ? (
                        <>
                          <input
                            value={
                              editingName
                            }
                            disabled={
                              busy
                            }
                            maxLength={
                              50
                            }
                            onChange={(
                              event
                            ) =>
                              setEditingName(
                                event
                                  .target
                                  .value
                              )
                            }
                          />

                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              saveEdit(
                                tag
                              )
                            }
                            aria-label="Save tag"
                          >
                            {busy ? (
                              <LoaderCircle
                                size={
                                  15
                                }
                                className="journal-spin"
                              />
                            ) : (
                              <Check
                                size={
                                  15
                                }
                              />
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={
                              cancelEdit
                            }
                            aria-label="Cancel editing"
                          >
                            <X
                              size={15}
                            />
                          </button>
                        </>
                      ) : (
                        <>
                          <span>
                            #
                            {getTagName(
                              tag
                            )}
                          </span>

                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              beginEdit(
                                tag
                              )
                            }
                            aria-label={
                              `Edit ${getTagName(
                                tag
                              )}`
                            }
                          >
                            <Edit3
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            onClick={() =>
                              handleDelete(
                                tag
                              )
                            }
                            aria-label={
                              `Delete ${getTagName(
                                tag
                              )}`
                            }
                          >
                            {busy ? (
                              <LoaderCircle
                                size={
                                  15
                                }
                                className="journal-spin"
                              />
                            ) : (
                              <Trash2
                                size={
                                  15
                                }
                              />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}

              {!tags.some(
                (tag) =>
                  !isSystemTag(
                    tag
                  )
              ) ? (
                <p className="journal-tags__no-custom">
                  You have not created
                  any personal tags yet.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default JournalTagSelector;