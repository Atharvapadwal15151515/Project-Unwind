import {
  useEffect,
  useMemo,
  useState
} from "react";


import {
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  LoaderCircle,
  Search,
  X
} from "lucide-react";


import {
  getJournalEmotions,
  getJournalMetadataError
} from "../../services/journalMetadataService";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getEmotionId(
  emotion
) {
  return (
    emotion?.emotionId ||
    emotion?.emotion_id ||
    null
  );
}


function getEmotionName(
  emotion
) {
  return (
    emotion?.emotionName ||
    emotion?.emotion_name ||
    "Emotion"
  );
}


function getEmotionCategory(
  emotion
) {
  return (
    emotion?.emotionCategory ||
    emotion?.emotion_category ||
    "general"
  );
}


function formatCategory(
  value
) {
  if (!value) {
    return "Other";
  }


  return String(value)
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function JournalEmotionSelector({
  selectedIds = [],
  disabled = false,
  onChange
}) {
  const [
    emotions,
    setEmotions
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
    search,
    setSearch
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Load emotions
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let active = true;


    async function loadEmotions() {
      setLoading(true);

      setError("");


      try {
        const result =
          await getJournalEmotions();


        if (!active) {
          return;
        }


        setEmotions(
          Array.isArray(result)
            ? result
            : []
        );
      } catch (
        loadError
      ) {
        if (!active) {
          return;
        }


        setEmotions([]);


        setError(
          getJournalMetadataError(
            loadError,
            "Journal emotions could not be loaded."
          )
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }


    loadEmotions();


    return () => {
      active = false;
    };
  }, []);


  /*
  |--------------------------------------------------------------------------
  | Selected IDs
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | Selected emotions
  |--------------------------------------------------------------------------
  */

  const selectedEmotions =
    useMemo(
      () =>
        emotions.filter(
          (emotion) =>
            selectedSet.has(
              getEmotionId(
                emotion
              )
            )
        ),
      [
        emotions,
        selectedSet
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredEmotions =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();


      if (
        !normalizedSearch
      ) {
        return emotions;
      }


      return emotions.filter(
        (emotion) => {
          const name =
            getEmotionName(
              emotion
            )
              .toLowerCase();


          const category =
            getEmotionCategory(
              emotion
            )
              .toLowerCase();


          return (
            name.includes(
              normalizedSearch
            ) ||
            category.includes(
              normalizedSearch
            )
          );
        }
      );
    }, [
      emotions,
      search
    ]);


  /*
  |--------------------------------------------------------------------------
  | Group emotions
  |--------------------------------------------------------------------------
  */

  const groupedEmotions =
    useMemo(() => {
      return filteredEmotions.reduce(
        (
          groups,
          emotion
        ) => {
          const category =
            getEmotionCategory(
              emotion
            );


          if (
            !groups[category]
          ) {
            groups[
              category
            ] = [];
          }


          groups[
            category
          ].push(
            emotion
          );


          return groups;
        },
        {}
      );
    }, [
      filteredEmotions
    ]);


  /*
  |--------------------------------------------------------------------------
  | Toggle emotion
  |--------------------------------------------------------------------------
  */

  function toggleEmotion(
    emotion
  ) {
    if (disabled) {
      return;
    }


    const emotionId =
      getEmotionId(
        emotion
      );


    if (!emotionId) {
      return;
    }


    if (
      selectedSet.has(
        emotionId
      )
    ) {
      onChange(
        selectedIds.filter(
          (id) =>
            id !== emotionId
        )
      );


      return;
    }


    /*
     * Backend allows a maximum
     * of 5 emotions per entry.
     */
    if (
      selectedIds.length >=
      5
    ) {
      setError(
        "You can select up to 5 emotions for one journal entry."
      );


      return;
    }


    setError("");


    onChange([
      ...selectedIds,
      emotionId
    ]);
  }


  /*
  |--------------------------------------------------------------------------
  | Remove emotion
  |--------------------------------------------------------------------------
  */

  function removeEmotion(
    emotionId
  ) {
    if (disabled) {
      return;
    }


    setError("");


    onChange(
      selectedIds.filter(
        (id) =>
          id !== emotionId
      )
    );
  }


  return (
    <section className="journal-emotions">
      {/* ===================================
          HEADER
         =================================== */}

      <div className="journal-emotions__heading">
        <div>
          <span>
            <Heart
              size={16}
            />

            Emotions
          </span>

          <small>
            Choose up to 5 emotions
            that describe how you feel.
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
              Add emotions

              <ChevronDown
                size={15}
              />
            </>
          )}
        </button>
      </div>


      {/* ===================================
          SELECTED
         =================================== */}

      {selectedEmotions.length ? (
        <div className="journal-emotions__selected">
          {selectedEmotions.map(
            (emotion) => {
              const emotionId =
                getEmotionId(
                  emotion
                );


              return (
                <span
                  key={emotionId}
                  className="journal-emotion-chip"
                >
                  {getEmotionName(
                    emotion
                  )}


                  <button
                    type="button"
                    disabled={
                      disabled
                    }
                    aria-label={
                      `Remove ${getEmotionName(
                        emotion
                      )}`
                    }
                    onClick={() =>
                      removeEmotion(
                        emotionId
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
        <p className="journal-emotions__empty">
          No emotions selected.
        </p>
      )}


      {/* ===================================
          PANEL
         =================================== */}

      {open ? (
        <div className="journal-emotions__panel">
          <label className="journal-emotions__search">
            <Search
              size={16}
            />


            <input
              type="search"
              value={search}
              disabled={
                disabled
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search emotions..."
            />
          </label>


          <div className="journal-emotions__count">
            {selectedIds.length}
            /5 selected
          </div>


          {error ? (
            <div className="journal-emotions__error">
              {error}
            </div>
          ) : null}


          {loading ? (
            <div className="journal-emotions__loading">
              <LoaderCircle
                size={18}
                className="journal-spin"
              />

              Loading emotions...
            </div>
          ) : null}


          {!loading &&
          !emotions.length ? (
            <div className="journal-emotions__empty-library">
              No journal emotions are
              available.
            </div>
          ) : null}


          {!loading &&
          emotions.length ? (
            <div className="journal-emotions__groups">
              {Object.entries(
                groupedEmotions
              ).map(
                ([
                  category,
                  categoryEmotions
                ]) => (
                  <div
                    key={
                      category
                    }
                    className="journal-emotions__group"
                  >
                    <div className="journal-emotions__category">
                      {formatCategory(
                        category
                      )}
                    </div>


                    <div className="journal-emotions__options">
                      {categoryEmotions.map(
                        (
                          emotion
                        ) => {
                          const emotionId =
                            getEmotionId(
                              emotion
                            );


                          const selected =
                            selectedSet.has(
                              emotionId
                            );


                          return (
                            <button
                              key={
                                emotionId
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
                                toggleEmotion(
                                  emotion
                                )
                              }
                            >
                              <span>
                                {getEmotionName(
                                  emotion
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
                    </div>
                  </div>
                )
              )}


              {!Object.keys(
                groupedEmotions
              ).length ? (
                <p className="journal-emotions__no-results">
                  No matching
                  emotions.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}


export default JournalEmotionSelector;