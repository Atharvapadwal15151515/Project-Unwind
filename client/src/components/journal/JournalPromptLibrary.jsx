import {
  useCallback,
  useEffect,
  useState
} from "react";
import {
  useConfirm
} from "../../context/ConfirmDialogContext";
import {
  BookOpen,
  ChevronRight,
  Edit3,
  History,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X
} from "lucide-react";

import {
  createCustomJournalPrompt,
  deleteCustomJournalPrompt,
  getCustomJournalPrompts,
  getJournalPromptCategories,
  getJournalPromptHistory,
  getJournalPrompts,
  getRandomJournalPrompt,
  recordJournalPromptShown,
  updateCustomJournalPrompt,
  updateCustomJournalPromptStatus
} from "../../services/journalPromptService";

import {
  getPromptText
} from "../../utils/journalUtils";

function getPromptId(prompt) {
  return (
    prompt?.promptId ||
    prompt?.prompt_id
  );
}

function getPromptCategory(prompt) {
  return (
    prompt?.promptCategory ||
    prompt?.prompt_category ||
    "daily_reflection"
  );
}

function getCategoryValue(item) {
  if (typeof item === "string") {
    return item;
  }

  return (
    item?.promptCategory ||
    item?.prompt_category ||
    item?.category ||
    item?.value ||
    ""
  );
}

function formatCategoryLabel(value) {
  if (!value) {
    return "Uncategorized";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getCategoryLabel(item) {
  if (typeof item === "string") {
    return formatCategoryLabel(
      item
    );
  }

  return (
    item?.label ||
    item?.categoryLabel ||
    item?.category_label ||
    formatCategoryLabel(
      getCategoryValue(item)
    )
  );
}

function getPromptCategoryLabel(prompt) {
  const category =
    getPromptCategory(prompt);

  return formatCategoryLabel(
    category
  );
}

function isSystemPrompt(prompt) {
  return Boolean(
    prompt?.isSystem ??
    prompt?.is_system
  );
}

function isActivePrompt(prompt) {
  return (
    prompt?.isActive ??
    prompt?.is_active ??
    true
  );
}

function JournalPromptLibrary({
  open,
  onClose,
  onWrite
}) {
  const confirm = useConfirm();
  const [
    activeTab,
    setActiveTab
  ] = useState("explore");

  const [
    prompts,
    setPrompts
  ] = useState([]);

  const [
    history,
    setHistory
  ] = useState([]);

  const [
    categories,
    setCategories
  ] = useState([]);

  const [
    search,
    setSearch
  ] = useState("");

  const [
    category,
    setCategory
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    actionPromptId,
    setActionPromptId
  ] = useState(null);

  const [
    error,
    setError
  ] = useState("");

  const [
    formOpen,
    setFormOpen
  ] = useState(false);

  const [
    editingPrompt,
    setEditingPrompt
  ] = useState(null);

  const [
  form,
  setForm
] = useState({
  promptText: "",
  promptCategory: "daily_reflection"
});

  function openCreateForm() {
  setEditingPrompt(null);

  const firstCategory =
    categories.length > 0
      ? getCategoryValue(
          categories[0]
        )
      : "daily_reflection";

  setForm({
    promptText: "",
    promptCategory:
      firstCategory
  });

  setFormOpen(true);
}

  const loadCategories =
    useCallback(async () => {
      try {
        const result =
          await getJournalPromptCategories();

        setCategories(
          Array.isArray(result)
            ? result
            : []
        );
      } catch {
        setCategories([]);
      }
    }, []);

  const loadPrompts =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const filters = {
          limit: 100
        };

        if (search.trim()) {
          filters.search =
            search.trim();
        }

        if (category) {
          filters.category =
            category;
        }

        let result;

        if (
          activeTab ===
          "my-prompts"
        ) {
          result =
            await getCustomJournalPrompts(
              filters
            );
        } else {
          result =
            await getJournalPrompts(
              filters
            );
        }

        setPrompts(
          result?.prompts || []
        );
      } catch (loadError) {
        setError(
          loadError?.response?.data
            ?.message ||
          "Journal prompts could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }, [
      activeTab,
      category,
      search
    ]);

  const loadHistory =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await getJournalPromptHistory({
            limit: 100
          });

        setHistory(
          result?.promptHistory ||
          []
        );
      } catch (loadError) {
        setError(
          loadError?.response?.data
            ?.message ||
          "Prompt history could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadCategories();
  }, [
    open,
    loadCategories
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (
      activeTab === "history"
    ) {
      loadHistory();
      return;
    }

    loadPrompts();
  }, [
    open,
    activeTab,
    loadPrompts,
    loadHistory
  ]);

  if (!open) {
    return null;
  }

  async function handleWrite(
    prompt,
    shouldRecord = true
  ) {
    const promptId =
      getPromptId(prompt);

    if (!promptId) {
      return;
    }

    setActionPromptId(
      promptId
    );
    setError("");

    try {
      /*
        Prompts loaded from the library have
        not automatically been recorded as shown.

        Daily and random endpoints already create
        history records themselves.
      */
      if (shouldRecord) {
        await recordJournalPromptShown(
          prompt
        );
      }

      onWrite(prompt);
      onClose();
    } catch (actionError) {
      setError(
        actionError?.response?.data
          ?.message ||
        "This prompt could not be opened."
      );
    } finally {
      setActionPromptId(null);
    }
  }

  async function handleRandom() {
    setLoading(true);
    setError("");

    try {
      const result =
        await getRandomJournalPrompt();

      if (result?.prompt) {
        /*
          Random endpoint already records the
          prompt in journal_prompt_history.
        */
        onWrite(
          result.prompt
        );

        onClose();
      }
    } catch (randomError) {
      setError(
        randomError?.response?.data
          ?.message ||
        "A random prompt could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
  setEditingPrompt(null);

  const firstCategory =
    categories.length > 0
      ? getCategoryValue(
          categories[0]
        )
      : "daily_reflection";

  setForm({
    promptText: "",
    promptCategory: firstCategory
  });

  setFormOpen(true);
}

  function openEditForm(prompt) {
  setEditingPrompt(prompt);

  setForm({
    promptText:
      getPromptText(prompt),

    promptCategory:
      getPromptCategory(prompt)
  });

  setFormOpen(true);
}

  function closeForm() {
  setFormOpen(false);
  setEditingPrompt(null);

  setForm({
    promptText: "",
    promptCategory:
      "daily_reflection"
  });
}

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    const promptText =
      form.promptText.trim();

    if (
      promptText.length < 3
    ) {
      setError(
        "Prompt must contain at least 3 characters."
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      if (editingPrompt) {
        await updateCustomJournalPrompt(
          editingPrompt,
          {
            promptText,

            promptCategory:
              form.promptCategory
          }
        );
      } else {
        await createCustomJournalPrompt({
          promptText,

          promptCategory:
            form.promptCategory
        });
      }

      closeForm();

      setActiveTab(
        "my-prompts"
      );

      await loadPrompts();
    } catch (submitError) {
      setError(
        submitError?.response?.data
          ?.message ||
        "Your prompt could not be saved."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(
    prompt
  ) {
    const promptId =
      getPromptId(prompt);

    setActionPromptId(
      promptId
    );

    try {
      await updateCustomJournalPromptStatus(
        prompt,
        !isActivePrompt(prompt)
      );

      await loadPrompts();
    } catch (toggleError) {
      setError(
        toggleError?.response?.data
          ?.message ||
        "Prompt status could not be changed."
      );
    } finally {
      setActionPromptId(null);
    }
  }

  async function handleDelete(
    prompt
  ) {
    const confirmed =
  await confirm({
    title: "Delete custom prompt?",
    message:
      "This custom journal prompt will be permanently deleted.",
    confirmText: "Delete prompt",
    tone: "danger"
  });

    if (!confirmed) {
      return;
    }

    const promptId =
      getPromptId(prompt);

    setActionPromptId(
      promptId
    );

    try {
      await deleteCustomJournalPrompt(
        prompt
      );

      await loadPrompts();
    } catch (deleteError) {
      setError(
        deleteError?.response?.data
          ?.message ||
        "The prompt could not be deleted."
      );
    } finally {
      setActionPromptId(null);
    }
  }

  return (
    <div
      className="journal-prompt-library-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="journal-prompt-library"
        role="dialog"
        aria-modal="true"
        aria-label="Journal prompts"
      >
        <header className="journal-prompt-library__header">
          <div>
            <span className="journal-prompt-library__eyebrow">
              <Sparkles
                size={16}
              />
              Journal prompts
            </span>

            <h2>
              Find something worth
              reflecting on
            </h2>

            <p>
              Choose an Unwind prompt
              or create one of your own.
            </p>
          </div>

          <button
            type="button"
            className="journal-prompt-library__close"
            onClick={onClose}
            aria-label="Close prompt library"
          >
            <X size={21} />
          </button>
        </header>

        <div className="journal-prompt-library__tabs">
          <button
            type="button"
            className={
              activeTab === "explore"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "explore"
              )
            }
          >
            <BookOpen
              size={16}
            />
            Explore
          </button>

          <button
            type="button"
            className={
              activeTab ===
              "my-prompts"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "my-prompts"
              )
            }
          >
            <Sparkles
              size={16}
            />
            My Prompts
          </button>

          <button
            type="button"
            className={
              activeTab === "history"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "history"
              )
            }
          >
            <History size={16} />
            History
          </button>
        </div>

        {error ? (
          <div className="journal-prompt-library__error">
            {error}
          </div>
        ) : null}

        {activeTab !==
        "history" ? (
          <>
            <div className="journal-prompt-library__toolbar">
              <label className="journal-prompt-library__search">
                <Search
                  size={17}
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Search prompts"
                />
              </label>

              <select
  value={category}
  onChange={(event) =>
    setCategory(
      event.target.value
    )
  }
>
  <option value="">
    All categories
  </option>

  {categories.map(
  (item) => {
    const value =
      getCategoryValue(
        item
      );

    if (!value) {
      return null;
    }

    const label =
      getCategoryLabel(
        item
      );

    return (
      <option
        key={value}
        value={value}
      >
        {label}
        {item?.prompt_count !== undefined
          ? ` (${item.prompt_count})`
          : ""}
      </option>
    );
  }
)}
</select>

              {activeTab ===
              "explore" ? (
                <button
                  type="button"
                  className="journal-prompt-library__random"
                  onClick={
                    handleRandom
                  }
                  disabled={loading}
                >
                  <RefreshCw
                    size={16}
                  />
                  Surprise me
                </button>
              ) : (
                <button
                  type="button"
                  className="journal-prompt-library__create"
                  onClick={
                    openCreateForm
                  }
                >
                  <Plus size={16} />
                  New prompt
                </button>
              )}
            </div>

            {loading ? (
              <div className="journal-prompt-library__loading">
                <LoaderCircle
                  className="journal-spin"
                  size={25}
                />
                Loading prompts...
              </div>
            ) : (
              <div className="journal-prompt-library__grid">
                {prompts.map(
                  (prompt) => {
                    const promptId =
                      getPromptId(
                        prompt
                      );

                    const busy =
                      actionPromptId ===
                      promptId;

                    return (
                      <article
                        key={promptId}
                        className={
                          "journal-prompt-card " +
                          (!isActivePrompt(
                            prompt
                          )
                            ? "is-disabled"
                            : "")
                        }
                      >
                        <div className="journal-prompt-card__meta">
  <span>
    {getPromptCategoryLabel(
      prompt
    )}
  </span>

  <div className="journal-prompt-card__status">
    {!isSystemPrompt(
      prompt
    ) ? (
      <small
        className={
          isActivePrompt(
            prompt
          )
            ? "is-active"
            : "is-disabled"
        }
      >
        {isActivePrompt(
          prompt
        )
          ? "Active"
          : "Disabled"}
      </small>
    ) : (
      <small>
        Unwind
      </small>
    )}
  </div>
</div>

                        <h3>
                          {getPromptText(
                            prompt
                          )}
                        </h3>

                        <div className="journal-prompt-card__actions">
                          <button
                            type="button"
                            className="journal-prompt-card__write"
                            disabled={
                              busy ||
                              !isActivePrompt(
                                prompt
                              )
                            }
                            onClick={() =>
                              handleWrite(
                                prompt
                              )
                            }
                          >
                            {busy ? (
                              <LoaderCircle
                                size={16}
                                className="journal-spin"
                              />
                            ) : (
                              <ChevronRight
                                size={16}
                              />
                            )}

                            Write
                          </button>

                          {!isSystemPrompt(
                            prompt
                          ) ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    prompt
                                  )
                                }
                                aria-label="Edit prompt"
                              >
                                <Edit3
                                  size={15}
                                />
                              </button>

                              <button
  type="button"
  disabled={busy}
  className={
    isActivePrompt(prompt)
      ? "journal-prompt-card__disable"
      : "journal-prompt-card__enable"
  }
  onClick={() =>
    handleToggle(prompt)
  }
>
  {busy ? (
    <LoaderCircle
      size={15}
      className="journal-spin"
    />
  ) : null}

  {isActivePrompt(prompt)
    ? "Disable"
    : "Enable"}
</button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    prompt
                                  )
                                }
                                aria-label="Delete prompt"
                              >
                                <Trash2
                                  size={15}
                                />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </article>
                    );
                  }
                )}

                {!prompts.length ? (
                  <div className="journal-prompt-library__empty">
                    No prompts match
                    these filters.
                  </div>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <div className="journal-prompt-history">
            {loading ? (
              <div className="journal-prompt-library__loading">
                <LoaderCircle
                  size={25}
                  className="journal-spin"
                />

                Loading history...
              </div>
            ) : history.length ? (
              history.map(
                (item) => (
                  <article
                    key={
                      item.promptHistoryId ||
                      item.prompt_history_id
                    }
                    className="journal-prompt-history__item"
                  >
                    <div>
                      <div className="journal-prompt-history__meta">
                        <span>
                          {item
                            .promptCategoryLabel ||
                            "Journal prompt"}
                        </span>

                        <small
                          className={
                            item.wasUsed
                              ? "is-used"
                              : ""
                          }
                        >
                          {item.wasUsed
                            ? "Used"
                            : "Viewed"}
                        </small>
                      </div>

                      <h3>
                        {item.promptText}
                      </h3>

                      {item.shownAt ? (
                        <p>
                          Shown{" "}
                          {new Date(
                            item.shownAt
                          ).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleWrite(
                          {
                            promptId:
                              item.promptId,

                            promptText:
                              item.promptText,

                            promptCategory:
                              item.promptCategory,

                            promptCategoryLabel:
                              item.promptCategoryLabel,

                            isSystem:
                              item.isSystem
                          },
                          true
                        )
                      }
                    >
                      Reuse
                      <ChevronRight
                        size={16}
                      />
                    </button>
                  </article>
                )
              )
            ) : (
              <div className="journal-prompt-library__empty">
                Your prompt history
                will appear here.
              </div>
            )}
          </div>
        )}

        {formOpen ? (
          <div className="journal-prompt-form-backdrop">
            <form
              className="journal-prompt-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="journal-prompt-form__header">
                <div>
                  <small>
                    Personal prompts
                  </small>

                  <h3>
                    {editingPrompt
                      ? "Edit prompt"
                      : "Create a prompt"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Close"
                >
                  <X size={19} />
                </button>
              </div>

              <label>
                Your question or
                reflection
                <textarea
                  rows={5}
                  maxLength={1000}
                  value={
                    form.promptText
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,

                        promptText:
                          event
                            .target
                            .value
                      })
                    )
                  }
                  placeholder="What is something I handled better today than I would have a year ago?"
                  autoFocus
                />
              </label>

              <label>
                Category

               <select
  value={
    form.promptCategory
  }
  onChange={(event) =>
    setForm(
      (current) => ({
        ...current,

        promptCategory:
          event.target.value
      })
    )
  }
>
  {categories.map(
    (item) => {
      const value =
        getCategoryValue(
          item
        );

      if (!value) {
        return null;
      }

      const label =
        getCategoryLabel(
          item
        );

      return (
        <option
          key={value}
          value={value}
        >
          {label}
        </option>
      );
    }
  )}
</select>
              </label>

              <div className="journal-prompt-form__footer">
                <button
                  type="button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <LoaderCircle
                      size={16}
                      className="journal-spin"
                    />
                  ) : null}

                  {editingPrompt
                    ? "Save changes"
                    : "Create prompt"}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default JournalPromptLibrary;