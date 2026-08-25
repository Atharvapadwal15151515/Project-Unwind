import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useConfirm
} from "../../context/ConfirmDialogContext";
import {
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";


import {
  createJournalActivity,
  deleteJournalActivity,
  getJournalActivities,
  getJournalMetadataError,
  updateJournalActivity
} from "../../services/journalMetadataService";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getActivityId(
  activity
) {
  return (
    activity?.activityId ||
    activity?.activity_id ||
    null
  );
}


function getActivityName(
  activity
) {
  return (
    activity?.activityName ||
    activity?.activity_name ||
    "Activity"
  );
}


function isSystemActivity(
  activity
) {
  return Boolean(
    activity?.isSystem ??
    activity?.is_system
  );
}


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function JournalActivitySelector({
  selectedIds = [],
  disabled = false,
  onChange
}) {
  const [
    activities,
    setActivities
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
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
    search,
    setSearch
  ] = useState("");


  const [
    newActivityName,
    setNewActivityName
  ] = useState("");


  const [
    editingActivityId,
    setEditingActivityId
  ] = useState(null);


  const [
    editingName,
    setEditingName
  ] = useState("");


  const [
    actionActivityId,
    setActionActivityId
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | Load Activities
  |--------------------------------------------------------------------------
  */

  const loadActivities =
    useCallback(
      async () => {
        setLoading(true);
        setError("");


        try {
          const result =
            await getJournalActivities();


          setActivities(
            Array.isArray(result)
              ? result
              : []
          );
        } catch (
          loadError
        ) {
          setActivities([]);


          setError(
            getJournalMetadataError(
              loadError,
              "Journal activities could not be loaded."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    loadActivities();
  }, [
    loadActivities
  ]);


  /*
  |--------------------------------------------------------------------------
  | Selected Activities
  |--------------------------------------------------------------------------
  */
const confirm =
  useConfirm();
  const selectedSet =
    useMemo(
      () =>
        new Set(
          selectedIds.filter(
            Boolean
          )
        ),
      [
        selectedIds
      ]
    );


  const selectedActivities =
    useMemo(
      () =>
        activities.filter(
          (activityItem) =>
            selectedSet.has(
              getActivityId(
                activityItem
              )
            )
        ),
      [
        activities,
        selectedSet
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const visibleActivities =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();


        if (
          !normalizedSearch
        ) {
          return activities;
        }


        return activities.filter(
          (activityItem) =>
            getActivityName(
              activityItem
            )
              .toLowerCase()
              .includes(
                normalizedSearch
              )
        );
      },
      [
        activities,
        search
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Custom Activities
  |--------------------------------------------------------------------------
  */

  const customActivities =
    useMemo(
      () =>
        activities.filter(
          (activityItem) =>
            !isSystemActivity(
              activityItem
            )
        ),
      [
        activities
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Toggle Activity
  |--------------------------------------------------------------------------
  */

  function toggleActivity(
    activityItem
  ) {
    if (disabled) {
      return;
    }


    const activityId =
      getActivityId(
        activityItem
      );


    if (!activityId) {
      return;
    }


    if (
      selectedSet.has(
        activityId
      )
    ) {
      setError("");


      onChange(
        selectedIds.filter(
          (id) =>
            id !== activityId
        )
      );


      return;
    }


    /*
     * Backend currently allows
     * a maximum of 30 activity IDs.
     */
    if (
      selectedIds.length >=
      30
    ) {
      setError(
        "You can select up to 30 activities for one journal entry."
      );


      return;
    }


    setError("");


    onChange([
      ...selectedIds,
      activityId
    ]);
  }


  /*
  |--------------------------------------------------------------------------
  | Remove Selected Activity
  |--------------------------------------------------------------------------
  */

  function removeSelectedActivity(
    activityId
  ) {
    if (disabled) {
      return;
    }


    setError("");


    onChange(
      selectedIds.filter(
        (id) =>
          id !== activityId
      )
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Create Activity
  |--------------------------------------------------------------------------
  */

  async function handleCreate(
    event
  ) {
    event.preventDefault();


    const activityName =
      newActivityName.trim();


    if (!activityName) {
      return;
    }


    setLoading(true);
    setError("");


    try {
      const createdActivity =
        await createJournalActivity(
          activityName
        );


      setNewActivityName("");


      await loadActivities();


      /*
       * Automatically select
       * newly created activity.
       */
      const createdId =
        getActivityId(
          createdActivity
        );


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
    } catch (
      createError
    ) {
      setError(
        getJournalMetadataError(
          createError,
          "The activity could not be created."
        )
      );
    } finally {
      setLoading(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Edit Activity
  |--------------------------------------------------------------------------
  */

  function beginEdit(
    activityItem
  ) {
    if (
      disabled ||
      isSystemActivity(
        activityItem
      )
    ) {
      return;
    }


    setEditingActivityId(
      getActivityId(
        activityItem
      )
    );


    setEditingName(
      getActivityName(
        activityItem
      )
    );


    setError("");
  }


  function cancelEdit() {
    setEditingActivityId(
      null
    );


    setEditingName("");
  }


  async function saveEdit(
    activityItem
  ) {
    const activityId =
      getActivityId(
        activityItem
      );


    const activityName =
      editingName.trim();


    if (
      !activityId ||
      !activityName
    ) {
      return;
    }


    setActionActivityId(
      activityId
    );


    setError("");


    try {
      await updateJournalActivity(
        activityId,
        activityName
      );


      cancelEdit();


      await loadActivities();
    } catch (
      updateError
    ) {
      setError(
        getJournalMetadataError(
          updateError,
          "The activity could not be updated."
        )
      );
    } finally {
      setActionActivityId(
        null
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Delete Activity
  |--------------------------------------------------------------------------
  */

  async function handleDelete(
    activityItem
  ) {
    if (
      disabled ||
      isSystemActivity(
        activityItem
      )
    ) {
      return;
    }


    const activityId =
      getActivityId(
        activityItem
      );


    if (!activityId) {
      return;
    }


    const confirmed =
  await confirm({
    title: "Delete activity?",
    message: `Delete "${getActivityName(
      activityItem
    )}" from your journal activities?`,
    confirmText: "Delete",
    tone: "danger"
  });


    if (!confirmed) {
      return;
    }


    setActionActivityId(
      activityId
    );


    setError("");


    try {
      await deleteJournalActivity(
        activityId
      );


      /*
       * Also remove it from the
       * current editor selection.
       */
      if (
        selectedSet.has(
          activityId
        )
      ) {
        onChange(
          selectedIds.filter(
            (id) =>
              id !== activityId
          )
        );
      }


      if (
        editingActivityId ===
        activityId
      ) {
        cancelEdit();
      }


      await loadActivities();
    } catch (
      deleteError
    ) {
      setError(
        getJournalMetadataError(
          deleteError,
          "The activity could not be deleted."
        )
      );
    } finally {
      setActionActivityId(
        null
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section className="journal-tags">

      {/* ===================================
          HEADER
         =================================== */}

      <div className="journal-tags__heading">
        <div>
          <span>
            <Activity
              size={16}
            />

            Activities
          </span>


          <small>
            What were you doing around
            the time of this entry?
          </small>
        </div>


        <button
          type="button"
          disabled={
            disabled
          }
          onClick={() =>
            setOpen(
              (current) =>
                !current
            )
          }
        >
          {open ? (
            <>
              Hide

              <ChevronUp
                size={15}
              />
            </>
          ) : (
            <>
              Add activities

              <ChevronDown
                size={15}
              />
            </>
          )}
        </button>
      </div>


      {/* ===================================
          SELECTED ACTIVITIES
         =================================== */}

      {selectedActivities.length ? (
        <div className="journal-tags__selected">
          {selectedActivities.map(
            (activityItem) => {
              const activityId =
                getActivityId(
                  activityItem
                );


              return (
                <span
                  key={
                    activityId
                  }
                  className="journal-tag-chip"
                >
                  {getActivityName(
                    activityItem
                  )}


                  <button
                    type="button"
                    disabled={
                      disabled
                    }
                    aria-label={
                      `Remove ${getActivityName(
                        activityItem
                      )}`
                    }
                    onClick={() =>
                      removeSelectedActivity(
                        activityId
                      )
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
          No activities selected.
        </p>
      )}


      {/* ===================================
          ACTIVITY PANEL
         =================================== */}

      {open ? (
        <div className="journal-tags__panel">

          {/* SEARCH */}

          <label className="journal-tags__search">
            <Search
              size={16}
            />


            <input
              type="search"
              value={
                search
              }
              disabled={
                disabled
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search activities..."
            />
          </label>


          {/* LOADING */}

          {loading ? (
            <div className="journal-tags__loading">
              <LoaderCircle
                size={17}
                className="journal-spin"
              />

              Loading activities...
            </div>
          ) : null}


          {/* ERROR */}

          {error ? (
            <div className="journal-tags__error">
              {error}
            </div>
          ) : null}


          {/* ACTIVITY OPTIONS */}

          {!loading ? (
            <div className="journal-tags__options">
              {visibleActivities.map(
                (activityItem) => {
                  const activityId =
                    getActivityId(
                      activityItem
                    );


                  const selected =
                    selectedSet.has(
                      activityId
                    );


                  return (
                    <button
                      key={
                        activityId
                      }
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
                        toggleActivity(
                          activityItem
                        )
                      }
                    >
                      {selected ? (
                        <Check
                          size={14}
                        />
                      ) : (
                        <Plus
                          size={14}
                        />
                      )}


                      {getActivityName(
                        activityItem
                      )}
                    </button>
                  );
                }
              )}


              {!visibleActivities.length ? (
                <p className="journal-tags__no-custom">
                  No matching activities
                  found.
                </p>
              ) : null}
            </div>
          ) : null}


          {/* ===================================
              CREATE CUSTOM ACTIVITY
             =================================== */}

          <form
            className="journal-tags__create"
            onSubmit={
              handleCreate
            }
          >
            <input
              type="text"
              value={
                newActivityName
              }
              disabled={
                disabled ||
                loading
              }
              maxLength={80}
              onChange={(
                event
              ) =>
                setNewActivityName(
                  event.target.value
                )
              }
              placeholder="Create custom activity..."
            />


            <button
              type="submit"
              disabled={
                disabled ||
                loading ||
                !newActivityName.trim()
              }
            >
              <Plus
                size={15}
              />

              Create
            </button>
          </form>


          {/* ===================================
              MANAGE CUSTOM ACTIVITIES
             =================================== */}

          <button
            type="button"
            className="journal-tags__manage-toggle"
            disabled={
              disabled
            }
            onClick={() =>
              setManaging(
                (current) =>
                  !current
              )
            }
          >
            {managing
              ? "Hide activity manager"
              : "Manage custom activities"}
          </button>


          {managing ? (
            <div className="journal-tags__manager">

              <div className="journal-tags__manager-title">
                Your custom activities
              </div>


              {!customActivities.length ? (
                <p className="journal-tags__no-custom">
                  You have not created any
                  custom activities yet.
                </p>
              ) : null}


              {customActivities.map(
                (activityItem) => {
                  const activityId =
                    getActivityId(
                      activityItem
                    );


                  const editing =
                    editingActivityId ===
                    activityId;


                  const busy =
                    actionActivityId ===
                    activityId;


                  return (
                    <div
                      key={
                        activityId
                      }
                      className="journal-tags__manager-row"
                    >
                      {editing ? (
                        <>
                          <input
                            type="text"
                            value={
                              editingName
                            }
                            disabled={
                              busy
                            }
                            maxLength={80}
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
                              busy ||
                              !editingName.trim()
                            }
                            title="Save activity"
                            onClick={() =>
                              saveEdit(
                                activityItem
                              )
                            }
                          >
                            {busy ? (
                              <LoaderCircle
                                size={14}
                                className="journal-spin"
                              />
                            ) : (
                              <Check
                                size={14}
                              />
                            )}
                          </button>


                          <button
                            type="button"
                            disabled={
                              busy
                            }
                            title="Cancel"
                            onClick={
                              cancelEdit
                            }
                          >
                            <X
                              size={14}
                            />
                          </button>
                        </>
                      ) : (
                        <>
                          <span>
                            {getActivityName(
                              activityItem
                            )}
                          </span>


                          <button
                            type="button"
                            disabled={
                              disabled ||
                              busy
                            }
                            title="Edit activity"
                            onClick={() =>
                              beginEdit(
                                activityItem
                              )
                            }
                          >
                            <Edit3
                              size={14}
                            />
                          </button>


                          <button
                            type="button"
                            disabled={
                              disabled ||
                              busy
                            }
                            title="Delete activity"
                            onClick={() =>
                              handleDelete(
                                activityItem
                              )
                            }
                          >
                            {busy ? (
                              <LoaderCircle
                                size={14}
                                className="journal-spin"
                              />
                            ) : (
                              <Trash2
                                size={14}
                              />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}


export default JournalActivitySelector;