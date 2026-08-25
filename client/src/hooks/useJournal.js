import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  archiveJournalEntry,
  autoSaveJournalEntry,
  unarchiveJournalEntry,
  completeJournalEntry,
  createJournalEntry,
  deleteJournalEntry,
  getDailyJournalPrompt,
  getJournalEntries,
  getJournalError,
  toggleJournalFavourite,
  updateJournalEntry
} from "../services/journalService";

import {
  markLatestJournalPromptUsed
} from "../services/journalPromptService";

import {
  createJournalEditorState,
  getJournalEntryId,
  getJournalField,
  isJournalFavourite
} from "../utils/journalUtils";


export function useJournal() {
  const [
    entries,
    setEntries
  ] = useState([]);


  const [
    pagination,
    setPagination
  ] = useState(null);


  const [
    dailyPrompt,
    setDailyPrompt
  ] = useState(null);


  const [
    selectedEntry,
    setSelectedEntry
  ] = useState(null);


  const [
    editor,
    setEditor
  ] = useState(
    createJournalEditorState()
  );


  const [
    query,
    setQuery
  ] = useState("");


  const [
    filter,
    setFilter
  ] = useState("all");


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    saving,
    setSaving
  ] = useState(false);


  const [
    actionEntryId,
    setActionEntryId
  ] = useState(null);


  const [
    error,
    setError
  ] = useState("");


  const [
    editorOpen,
    setEditorOpen
  ] = useState(false);

  /*
|--------------------------------------------------------------------------
| Auto-save refs
|--------------------------------------------------------------------------
|
| Refs are used here because auto-save must always have access to the
| absolute latest editor and entry values, even inside timers/events.
|--------------------------------------------------------------------------
*/

const editorRef =
  useRef(editor);

const selectedEntryRef =
  useRef(selectedEntry);

const editorOpenRef =
  useRef(editorOpen);

const autoSaveTimerRef =
  useRef(null);

const autoSavePromiseRef =
  useRef(null);

const editorDirtyRef =
  useRef(false);

const editorVersionRef =
  useRef(0);

  /*
|--------------------------------------------------------------------------
| Keep refs synchronized with React state
|--------------------------------------------------------------------------
*/

useEffect(() => {
  editorRef.current =
    editor;
}, [
  editor
]);


useEffect(() => {
  selectedEntryRef.current =
    selectedEntry;
}, [
  selectedEntry
]);


useEffect(() => {
  editorOpenRef.current =
    editorOpen;
}, [
  editorOpen
]);


  /*
  |--------------------------------------------------------------------------
  | Load Entries
  |--------------------------------------------------------------------------
  */

  const loadEntries =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const filters = {};

          if (
            query.trim()
          ) {
            filters.search =
              query.trim();
          }

          if (
            filter ===
            "favourites"
          ) {
            filters.isFavourite =
              true;
          }

          if (
            filter ===
            "archived"
          ) {
            filters.entryStatus =
              "archived";
          }

          if (
            filter ===
            "drafts"
          ) {
            filters.entryStatus =
              "draft";
          }

          if (
            filter ===
            "completed"
          ) {
            filters.entryStatus =
              "completed";
          }

          const result =
            await getJournalEntries(
              filters
            );

          setEntries(
            Array.isArray(
              result?.entries
            )
              ? result.entries
              : []
          );

          setPagination(
            result?.pagination ||
            null
          );
        } catch (
          loadError
        ) {
          setEntries([]);
          setPagination(null);

          setError(
            getJournalError(
              loadError,
              "Your journal entries could not be loaded."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        filter,
        query
      ]
    );


  useEffect(() => {
    loadEntries();
  }, [
    loadEntries
  ]);


  /*
  |--------------------------------------------------------------------------
  | Daily Prompt
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let active = true;

    async function loadPrompt() {
      try {
        const prompt =
          await getDailyJournalPrompt();

        if (active) {
          setDailyPrompt(
            prompt
          );
        }
      } catch {
        if (active) {
          setDailyPrompt(
            null
          );
        }
      }
    }

    loadPrompt();

    return () => {
      active = false;
    };
  }, []);


  /*
  |--------------------------------------------------------------------------
  | Stats
  |--------------------------------------------------------------------------
  */

  const stats =
    useMemo(() => {
      const now =
        new Date();


      const thisMonth =
        entries.filter(
          (entry) => {
            const entryDate =
              getJournalField(
                entry,
                "entryDate",
                "entry_date"
              );

            if (!entryDate) {
              return false;
            }


            const date =
              new Date(
                `${String(
                  entryDate
                ).slice(
                  0,
                  10
                )}T12:00:00`
              );


            return (
              date.getMonth() ===
                now.getMonth() &&
              date.getFullYear() ===
                now.getFullYear()
            );
          }
        ).length;


      return {
        total:
          pagination
            ?.totalItems ??
          pagination?.total ??
          entries.length,

        thisMonth,

        favourites:
          entries.filter(
            isJournalFavourite
          ).length
      };
    }, [
      entries,
      pagination
    ]);


  /*
  |--------------------------------------------------------------------------
  | Open New Entry
  |--------------------------------------------------------------------------
  */

  const openNewEntry =
  useCallback(
    (prompt = null) => {
      /*
       * A brand-new editor starts clean.
       *
       * We don't create an empty database
       * entry simply because the editor opened.
       */
      editorDirtyRef.current =
        false;

      editorVersionRef.current =
        0;

      selectedEntryRef.current =
        null;

      const initialEditor =
        createJournalEditorState(
          null,
          prompt
        );

      editorRef.current =
        initialEditor;

      setSelectedEntry(
        null
      );

      setEditor(
        initialEditor
      );

      setError("");

      editorOpenRef.current =
        true;

      setEditorOpen(
        true
      );
    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | Open Existing Entry
  |--------------------------------------------------------------------------
  */

  const openEntry =
  useCallback(
    (entry) => {
      /*
       * Existing Journal starts clean.
       *
       * Auto-save should only happen once
       * the user actually changes something.
       */
      editorDirtyRef.current =
        false;

      editorVersionRef.current =
        0;

      selectedEntryRef.current =
        entry;

      const initialEditor =
        createJournalEditorState(
          entry
        );

      editorRef.current =
        initialEditor;

      setSelectedEntry(
        entry
      );

      setEditor(
        initialEditor
      );

      setError("");

      editorOpenRef.current =
        true;

      setEditorOpen(
        true
      );
    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | Close Editor
  |--------------------------------------------------------------------------
  */

  const closeEditor =
  useCallback(
    () => {
      if (saving) {
        return;
      }

      if (
        autoSaveTimerRef.current
      ) {
        clearTimeout(
          autoSaveTimerRef.current
        );

        autoSaveTimerRef.current =
          null;
      }

      editorOpenRef.current =
        false;

      editorDirtyRef.current =
        false;

      setEditorOpen(
        false
      );

      selectedEntryRef.current =
        null;

      setSelectedEntry(
        null
      );
    },
    [
      saving
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | Editor Field
  |--------------------------------------------------------------------------
  */

  const updateEditorField =
  useCallback(
    (
      field,
      value
    ) => {
      /*
       * Mark the editor as changed.
       */
      editorDirtyRef.current =
        true;

      editorVersionRef.current +=
        1;

      setEditor(
        (
          currentEditor
        ) => {
          const nextEditor = {
            ...currentEditor,

            [field]:
              value
          };

          /*
           * Keep the ref synchronized
           * immediately rather than waiting
           * for the next React render.
           */
          editorRef.current =
            nextEditor;

          return nextEditor;
        }
      );
    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | Mood
  |--------------------------------------------------------------------------
  */

  const selectMood =
  useCallback(
    (mood) => {
      editorDirtyRef.current =
        true;

      editorVersionRef.current +=
        1;

      setEditor(
        (
          currentEditor
        ) => {
          const nextEditor = {
            ...currentEditor,

            moodScore:
              mood.score,

            moodLabel:
              mood.value
          };

          editorRef.current =
            nextEditor;

          return nextEditor;
        }
      );
    },
    []
  );

 /*
|--------------------------------------------------------------------------
| Build Auto-save Payload
|--------------------------------------------------------------------------
*/

const buildAutoSavePayload =
  useCallback(
    (
      currentEditor
    ) => ({
      title:
        currentEditor
          .title ?? "",

      content:
        currentEditor
          .content ?? "",

      entryType:
        currentEditor
          .entryType ||
        "standard",

      moodLabel:
        currentEditor
          .moodLabel ||
        null,

      moodScore:
        currentEditor
          .moodScore ??
        null,

      promptId:
        currentEditor
          .promptId ||
        null,

      promptTextSnapshot:
        currentEditor
          .promptTextSnapshot ||
        null,

      entryDate:
        currentEditor
          .entryDate,

      emotionIds:
        Array.isArray(
          currentEditor
            .emotionIds
        )
          ? currentEditor
              .emotionIds
          : [],

      tagIds:
        Array.isArray(
          currentEditor
            .tagIds
        )
          ? currentEditor
              .tagIds
          : [],

      activityIds:
        Array.isArray(
          currentEditor
            .activityIds
        )
          ? currentEditor
              .activityIds
          : []
    }),
    []
  );


/*
|--------------------------------------------------------------------------
| Does a New Journal Contain Anything Worth Saving?
|--------------------------------------------------------------------------
|
| We deliberately avoid creating empty drafts merely because someone
| opened and immediately closed the Journal editor.
|--------------------------------------------------------------------------
*/

const hasAutoSaveableContent =
  useCallback(
    (
      currentEditor
    ) => {
      const hasTitle =
        Boolean(
          currentEditor
            ?.title
            ?.trim()
        );

      const hasContent =
        Boolean(
          currentEditor
            ?.content
            ?.trim()
        );

      const hasMood =
        currentEditor
          ?.moodScore != null;

      const hasEmotions =
        Array.isArray(
          currentEditor
            ?.emotionIds
        ) &&
        currentEditor
          .emotionIds
          .length > 0;

      const hasTags =
        Array.isArray(
          currentEditor
            ?.tagIds
        ) &&
        currentEditor
          .tagIds
          .length > 0;

      const hasActivities =
        Array.isArray(
          currentEditor
            ?.activityIds
        ) &&
        currentEditor
          .activityIds
          .length > 0;

      const hasVoiceType =
        currentEditor
          ?.entryType ===
        "voice";

      return (
        hasTitle ||
        hasContent ||
        hasMood ||
        hasEmotions ||
        hasTags ||
        hasActivities ||
        hasVoiceType
      );
    },
    []
  );


/*
|--------------------------------------------------------------------------
| Perform Auto-save
|--------------------------------------------------------------------------
*/

const performAutoSave =
  useCallback(
    async ({
      force = false
    } = {}) => {
      /*
       * No active editor.
       */
      if (
        !editorOpenRef.current
      ) {
        return (
          selectedEntryRef.current ||
          null
        );
      }

      /*
       * Nothing changed.
       */
      if (
        !editorDirtyRef.current &&
        !force
      ) {
        return (
          selectedEntryRef.current ||
          null
        );
      }

      const currentEditor =
        editorRef.current;

      if (!currentEditor) {
        return (
          selectedEntryRef.current ||
          null
        );
      }

      /*
       * Do not create completely blank drafts.
       */
      if (
        !selectedEntryRef.current &&
        !hasAutoSaveableContent(
          currentEditor
        )
      ) {
        return null;
      }

      /*
       * If another auto-save is already running,
       * wait for it first.
       */
      if (
        autoSavePromiseRef.current
      ) {
        try {
          await autoSavePromiseRef
            .current;
        } catch {
          /*
           * The previous request already
           * handles its own failure.
           */
        }

        /*
         * If nothing changed while that save
         * was running, we are done.
         */
        if (
          !editorDirtyRef.current &&
          !force
        ) {
          return (
            selectedEntryRef.current ||
            null
          );
        }
      }

      const versionAtStart =
        editorVersionRef.current;

      const payload =
        buildAutoSavePayload(
          editorRef.current
        );

      const savePromise =
        (async () => {
          try {
            let savedEntry =
              null;

            const currentEntry =
              selectedEntryRef
                .current;

            /*
             * ---------------------------------------
             * EXISTING ENTRY
             * ---------------------------------------
             *
             * Use the dedicated backend auto-save
             * endpoint.
             */
            if (
              getJournalEntryId(
                currentEntry
              )
            ) {
              savedEntry =
                await autoSaveJournalEntry(
                  currentEntry,
                  payload
                );
            } else {
              /*
               * ---------------------------------------
               * NEW ENTRY
               * ---------------------------------------
               *
               * The first automatic save has no entry
               * ID yet, so create it as a DRAFT.
               */
              savedEntry =
                await createJournalEntry({
                  ...payload,

                  entryStatus:
                    "draft"
                });
            }

            if (
              !getJournalEntryId(
                savedEntry
              )
            ) {
              throw new Error(
                "The server did not return the auto-saved journal entry."
              );
            }

            /*
             * IMPORTANT:
             *
             * Immediately update the ref.
             *
             * This prevents another request from
             * creating a second draft before React
             * finishes updating its state.
             */
            selectedEntryRef.current =
              savedEntry;

            selectedEntryRef.current =
  savedEntry;

editorDirtyRef.current =
  false;

setSelectedEntry(
  savedEntry
);

            /*
             * Only clear dirty if the user did not
             * type/change anything while this request
             * was running.
             */
            if (
              editorVersionRef.current ===
              versionAtStart
            ) {
              editorDirtyRef.current =
                false;
            }

            return savedEntry;
          } catch (
            autoSaveError
          ) {
            /*
             * Do NOT erase the dirty flag.
             *
             * The next edit / forced flush can retry.
             */
            console.error(
              "Journal auto-save failed:",
              autoSaveError
            );

            return null;
          }
        })();

      autoSavePromiseRef.current =
        savePromise;

      try {
        return await savePromise;
      } finally {
        if (
          autoSavePromiseRef.current ===
          savePromise
        ) {
          autoSavePromiseRef.current =
            null;
        }
      }
    },
    [
      buildAutoSavePayload,
      hasAutoSaveableContent
    ]
  );


/*
|--------------------------------------------------------------------------
| Debounced Auto-save
|--------------------------------------------------------------------------
|
| Auto-save approximately 700ms after the most recent editor change.
|--------------------------------------------------------------------------
*/

useEffect(() => {
  if (
    !editorOpen
  ) {
    return undefined;
  }

  if (
    !editorDirtyRef.current
  ) {
    return undefined;
  }

  if (
    autoSaveTimerRef.current
  ) {
    clearTimeout(
      autoSaveTimerRef.current
    );
  }

  autoSaveTimerRef.current =
    setTimeout(
      () => {
        performAutoSave();
      },
      700
    );

  return () => {
    if (
      autoSaveTimerRef.current
    ) {
      clearTimeout(
        autoSaveTimerRef.current
      );

      autoSaveTimerRef.current =
        null;
    }
  };
}, [
  editor,
  editorOpen,
  performAutoSave
]);


/*
|--------------------------------------------------------------------------
| Browser / Tab Exit Auto-save
|--------------------------------------------------------------------------
|
| Normal debounced auto-save does most of the work.
|
| These events provide a final best-effort save if the user:
|
| - changes tabs
| - minimizes / backgrounds the browser
| - refreshes
| - closes the tab/window
|--------------------------------------------------------------------------
*/

useEffect(() => {
  if (
    !editorOpen
  ) {
    return undefined;
  }

  const flushAutoSave =
    () => {
      if (
        !editorDirtyRef.current
      ) {
        return;
      }

      performAutoSave({
        force: true
      });
    };


  const handleVisibilityChange =
    () => {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        flushAutoSave();
      }
    };


  const handlePageHide =
    () => {
      flushAutoSave();
    };


  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  window.addEventListener(
    "pagehide",
    handlePageHide
  );


  return () => {
    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.removeEventListener(
      "pagehide",
      handlePageHide
    );
  };
}, [
  editorOpen,
  performAutoSave
]);

/*
|--------------------------------------------------------------------------
| Flush Pending Auto-save
|--------------------------------------------------------------------------
|
| Called before closing the Journal modal.
|--------------------------------------------------------------------------
*/

const flushJournalAutoSave =
  useCallback(
    async () => {
      if (
        autoSaveTimerRef.current
      ) {
        clearTimeout(
          autoSaveTimerRef.current
        );

        autoSaveTimerRef.current =
          null;
      }

      if (
        !editorDirtyRef.current
      ) {
        if (
          autoSavePromiseRef.current
        ) {
          try {
            await autoSavePromiseRef
              .current;
          } catch {
            // Already handled.
          }
        }

        return (
          selectedEntryRef.current ||
          null
        );
      }

      return performAutoSave({
        force: true
      });
    },
    [
      performAutoSave
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | Save Entry
  |--------------------------------------------------------------------------
  */

  const saveEntry =
    useCallback(
      async (
        status =
          "completed"
      ) => {
        const hasTitle =
          Boolean(
            editor.title
              .trim()
          );


        const hasContent =
          Boolean(
            editor.content
              .trim()
          );


        /*
         * Standard completed journals
         * should contain written content.
         *
         * Voice journals are allowed to
         * contain audio even when the user
         * does not type text.
         */
        const isVoiceEntry =
          editor.entryType ===
          "voice";


        if (
          status ===
            "completed" &&
          !hasTitle &&
          !hasContent &&
          !isVoiceEntry
        ) {
          setError(
            "Write a title or a few thoughts before saving your entry."
          );

          return null;
        }


        /*
 * Cancel a pending debounced auto-save because
 * the user has explicitly chosen Save draft /
 * Save entry.
 */
if (
  autoSaveTimerRef.current
) {
  clearTimeout(
    autoSaveTimerRef.current
  );

  autoSaveTimerRef.current =
    null;
}


/*
 * If an auto-save request is already running,
 * wait for it.
 *
 * This prevents the manual save from creating
 * another brand-new Journal entry.
 */
if (
  autoSavePromiseRef.current
) {
  try {
    await autoSavePromiseRef
      .current;
  } catch {
    // Auto-save failure is handled separately.
  }
}


setSaving(
  true
);

setError("");


        try {
          /*
           * IMPORTANT FIX:
           *
           * Previously this was:
           *
           * entryType: "standard"
           *
           * That meant EVERY journal was
           * saved as standard even after
           * Voice Journaling changed the
           * editor to entryType = "voice".
           */
          const payload = {
  ...editor,

  /*
   * moodScore:
   * 1 - 5
   *
   * moodLabel:
   * very_low
   * low
   * neutral
   * good
   * very_good
   */
  moodLabel:
    editor.moodLabel ||
    null,

  moodScore:
    editor.moodScore ??
    null,

  entryType:
    editor.entryType ||
    "standard"
};


          let savedEntry =
            null;


          const currentSelectedEntry =
  selectedEntryRef.current ||
  selectedEntry ||
  null;


const creatingNewEntry =
  !getJournalEntryId(
    currentSelectedEntry
  );


          /*
           * Update existing entry.
           */
          if (
  getJournalEntryId(
    currentSelectedEntry
  )
) {
  savedEntry =
    await updateJournalEntry(
      currentSelectedEntry,
      payload
    );

  savedEntry =
    savedEntry ||
    currentSelectedEntry;


            if (
              status ===
              "completed"
            ) {
              const completedEntry =
                await completeJournalEntry(
                  savedEntry
                );


              savedEntry =
                completedEntry ||
                savedEntry;
            }
          } else {
            /*
             * Create brand-new entry.
             */
            savedEntry =
              await createJournalEntry({
                ...payload,

                entryStatus:
                  status
              });
          }


          if (
            !getJournalEntryId(
              savedEntry
            )
          ) {
            throw new Error(
              "The server did not return the saved journal entry."
            );
          }


          /*
           * Prompt history linking.
           *
           * Only record usage when the
           * journal was newly created.
           */
          if (
            creatingNewEntry &&
            editor.promptId
          ) {
            try {
              await markLatestJournalPromptUsed(
                editor.promptId,
                getJournalEntryId(
                  savedEntry
                )
              );
            } catch (
              promptHistoryError
            ) {
              /*
               * Do not fail the journal
               * save because prompt history
               * tracking failed.
               */
              console.error(
                "Prompt usage could not be recorded:",
                promptHistoryError
              );
            }
          }


          /*
           * VERY IMPORTANT:
           *
           * Once a draft is created for
           * Voice Journaling, selectedEntry
           * now points at that real database
           * entry.
           *
           * The next Save action therefore
           * updates the same journal instead
           * of creating another one.
           */
          setSelectedEntry(
            savedEntry
          );


          /*
           * Keep editor entry type aligned
           * with the saved entry.
           */
          setEditor(
            (
              currentEditor
            ) => ({
              ...currentEditor,

              entryType:
                getJournalField(
                  savedEntry,
                  "entryType",
                  "entry_type"
                ) ||
                currentEditor
                  .entryType ||
                "standard"
            })
          );


          return savedEntry;
        } catch (
          saveError
        ) {
          setError(
            getJournalError(
              saveError,
              "Your journal entry could not be saved."
            )
          );


          return null;
        } finally {
          setSaving(
            false
          );
        }
      },
      [
        editor,
        selectedEntry
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Finish Entry Save
  |--------------------------------------------------------------------------
  */

  const finishEntrySave =
    useCallback(
      async () => {
        setEditorOpen(
          false
        );

        setSelectedEntry(
          null
        );


        await loadEntries();
      },
      [
        loadEntries
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Favourite
  |--------------------------------------------------------------------------
  */

  const toggleFavourite =
    useCallback(
      async (
        entry
      ) => {
        const id =
          getJournalEntryId(
            entry
          );


        setActionEntryId(
          id
        );

        setError("");


        try {
          const updatedEntry =
            await toggleJournalFavourite(
              entry
            );


          setEntries(
            (
              currentEntries
            ) =>
              currentEntries.map(
                (
                  currentEntry
                ) =>
                  getJournalEntryId(
                    currentEntry
                  ) === id
                    ? updatedEntry
                    : currentEntry
              )
          );
        } catch (
          actionError
        ) {
          setError(
            getJournalError(
              actionError,
              "Favourite status could not be changed."
            )
          );
        } finally {
          setActionEntryId(
            null
          );
        }
      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | Archive
  |--------------------------------------------------------------------------
  */

  const archiveEntry =
    useCallback(
      async (
        entry
      ) => {
        const id =
          getJournalEntryId(
            entry
          );


        setActionEntryId(
          id
        );

        setError("");


        try {
          await archiveJournalEntry(
            entry
          );


          setEditorOpen(
            false
          );

          setSelectedEntry(
            null
          );


          await loadEntries();
        } catch (
          actionError
        ) {
          setError(
            getJournalError(
              actionError,
              "The journal entry could not be archived."
            )
          );
        } finally {
          setActionEntryId(
            null
          );
        }
      },
      [
        loadEntries
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Restore / Unarchive
  |--------------------------------------------------------------------------
  */

  const restoreEntry =
    useCallback(
      async (
        entry
      ) => {
        const id =
          getJournalEntryId(
            entry
          );


        setActionEntryId(
          id
        );

        setError("");


        try {
          await unarchiveJournalEntry(
  entry
);


          setEditorOpen(
            false
          );

          setSelectedEntry(
            null
          );


          await loadEntries();
        } catch (
          actionError
        ) {
          setError(
            getJournalError(
              actionError,
              "The journal entry could not be unarchived."
            )
          );
        } finally {
          setActionEntryId(
            null
          );
        }
      },
      [
        loadEntries
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const removeEntry =
    useCallback(
      async (
        entry
      ) => {
        const id =
          getJournalEntryId(
            entry
          );


        setActionEntryId(
          id
        );

        setError("");


        try {
          await deleteJournalEntry(
            entry
          );


          setEditorOpen(
            false
          );

          setSelectedEntry(
            null
          );


          await loadEntries();
        } catch (
          actionError
        ) {
          setError(
            getJournalError(
              actionError,
              "The journal entry could not be deleted."
            )
          );
        } finally {
          setActionEntryId(
            null
          );
        }
      },
      [
        loadEntries
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Public Hook API
  |--------------------------------------------------------------------------
  */

  return {
    entries,
    dailyPrompt,
    selectedEntry,
    editor,
    query,
    filter,
    loading,
    saving,
    actionEntryId,
    error,
    editorOpen,
    stats,

    setQuery,
    setFilter,

    clearError:
      () =>
        setError(""),

    loadEntries,

    openNewEntry,
openEntry,
closeEditor,

updateEditorField,
selectMood,

flushJournalAutoSave,

saveEntry,
finishEntrySave,

    toggleFavourite,
    archiveEntry,
    restoreEntry,
    removeEntry
  };
}