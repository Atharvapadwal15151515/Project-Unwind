const HISTORY_KEY =
  "unwind_wellness_history";

const FAVORITES_KEY =
  "unwind_wellness_favorites";

const RECENT_KEY =
  "unwind_wellness_recent";

const MAX_RECENT = 6;

/* =========================================================
   SAFE LOCAL STORAGE
========================================================= */

const readStorage = (
  key,
  fallback = []
) => {
  try {
    const value =
      localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error(
      `Unable to read ${key}:`,
      error
    );

    return fallback;
  }
};

const writeStorage = (
  key,
  value
) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;
  } catch (error) {
    console.error(
      `Unable to save ${key}:`,
      error
    );

    return false;
  }
};

/* =========================================================
   WELLNESS HISTORY
========================================================= */

export const getWellnessHistory =
  () => {
    return readStorage(
      HISTORY_KEY,
      []
    );
  };

export const addWellnessHistoryEntry =
  (activity) => {
    if (!activity) {
      return;
    }

    const history =
      getWellnessHistory();

    const entry = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      ...activity,

      completedAt:
        new Date().toISOString()
    };

    const updatedHistory = [
      entry,
      ...history
    ];

    writeStorage(
      HISTORY_KEY,
      updatedHistory
    );

    addRecentlyUsed({
      toolId:
        activity.toolId,

      toolName:
        activity.toolName,

      route:
        activity.route,

      type:
        activity.type
    });

    return entry;
  };

export const clearWellnessHistory =
  () => {
    writeStorage(
      HISTORY_KEY,
      []
    );
  };

/* =========================================================
   RECENTLY USED
========================================================= */

export const getRecentlyUsed =
  () => {
    return readStorage(
      RECENT_KEY,
      []
    );
  };

export const addRecentlyUsed =
  (tool) => {
    if (
      !tool ||
      !tool.toolId
    ) {
      return;
    }

    const recent =
      getRecentlyUsed();

    const withoutDuplicate =
      recent.filter(
        (item) =>
          item.toolId !==
          tool.toolId
      );

    const updated = [
      {
        ...tool,

        usedAt:
          new Date().toISOString()
      },

      ...withoutDuplicate
    ].slice(
      0,
      MAX_RECENT
    );

    writeStorage(
      RECENT_KEY,
      updated
    );

    return updated;
  };

export const clearRecentlyUsed =
  () => {
    writeStorage(
      RECENT_KEY,
      []
    );
  };

/* =========================================================
   FAVORITES
========================================================= */

export const getWellnessFavorites =
  () => {
    return readStorage(
      FAVORITES_KEY,
      []
    );
  };

export const isWellnessFavorite =
  (toolId) => {
    return getWellnessFavorites()
      .some(
        (item) =>
          item.toolId ===
          toolId
      );
  };

export const addWellnessFavorite =
  (tool) => {
    if (
      !tool ||
      !tool.toolId
    ) {
      return;
    }

    const favorites =
      getWellnessFavorites();

    const exists =
      favorites.some(
        (item) =>
          item.toolId ===
          tool.toolId
      );

    if (exists) {
      return favorites;
    }

    const updated = [
      ...favorites,
      {
        ...tool,

        savedAt:
          new Date().toISOString()
      }
    ];

    writeStorage(
      FAVORITES_KEY,
      updated
    );

    return updated;
  };

export const removeWellnessFavorite =
  (toolId) => {
    const favorites =
      getWellnessFavorites();

    const updated =
      favorites.filter(
        (item) =>
          item.toolId !==
          toolId
      );

    writeStorage(
      FAVORITES_KEY,
      updated
    );

    return updated;
  };

export const toggleWellnessFavorite =
  (tool) => {
    if (
      !tool ||
      !tool.toolId
    ) {
      return false;
    }

    if (
      isWellnessFavorite(
        tool.toolId
      )
    ) {
      removeWellnessFavorite(
        tool.toolId
      );

      return false;
    }

    addWellnessFavorite(
      tool
    );

    return true;
  };

  /* =========================================================
   BACKWARD COMPATIBILITY
   Existing Toolkit hooks still use these names.
========================================================= */

export const addRecentWellnessTool =
  (toolId) => {
    if (!toolId) {
      return [];
    }

    return addRecentlyUsed({
      toolId
    });
  };

export const getRecentWellnessTools =
  () => {
    return getRecentlyUsed();
  };

export const saveWellnessFavorites =
  (favorites) => {
    writeStorage(
      FAVORITES_KEY,
      favorites
    );
  };