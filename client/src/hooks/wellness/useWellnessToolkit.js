import {
  useCallback,
  useMemo,
  useState
} from "react";

import {
  wellnessTools
} from "../../data/wellness/tools";

import {
  getRecommendedToolIds
} from "../../data/wellness/recommendations";

import {
  addRecentWellnessTool,
  getRecentWellnessTools,
  getWellnessFavorites,
  getWellnessHistory,
  saveWellnessFavorites
} from "../../utils/wellnessStorage";

function normalizeFavoriteIds(
  favorites
) {
  return favorites
    .map((item) => {
      if (
        typeof item === "string"
      ) {
        return item;
      }

      return (
        item?.toolId ||
        item?.id ||
        null
      );
    })
    .filter(Boolean);
}

export function useWellnessToolkit() {
  const [
    selectedGoal,
    setSelectedGoal
  ] = useState(null);

  const [
    favorites,
    setFavorites
  ] = useState(() =>
    normalizeFavoriteIds(
      getWellnessFavorites()
    )
  );

  const [
    recent,
    setRecent
  ] = useState(() =>
    getRecentWellnessTools()
  );

  const [
    history,
    setHistory
  ] = useState(() =>
    getWellnessHistory()
  );

  const recommendedTools =
    useMemo(() => {
      if (!selectedGoal) {
        return wellnessTools
          .filter(
            (tool) =>
              tool.featured
          )
          .slice(0, 3);
      }

      const ids =
        getRecommendedToolIds(
          selectedGoal
        );

      return ids
        .map((id) =>
          wellnessTools.find(
            (tool) =>
              tool.id === id
          )
        )
        .filter(Boolean);
    }, [selectedGoal]);

  const favoriteTools =
    useMemo(() => {
      return favorites
        .map((id) =>
          wellnessTools.find(
            (tool) =>
              tool.id === id
          )
        )
        .filter(Boolean);
    }, [favorites]);

  const recentTools =
    useMemo(() => {
      return recent
        .map((entry) => {
          const tool =
            wellnessTools.find(
              (item) =>
                item.id ===
                entry.toolId
            );

          if (!tool) {
            return null;
          }

          return {
            ...tool,
            usedAt:
              entry.usedAt
          };
        })
        .filter(Boolean);
    }, [recent]);

  const toggleFavorite =
    useCallback(
      (toolId) => {
        setFavorites(
          (current) => {
            const exists =
              current.includes(
                toolId
              );

            const next =
              exists
                ? current.filter(
                    (id) =>
                      id !== toolId
                  )
                : [
                    ...current,
                    toolId
                  ];

            saveWellnessFavorites(
              next
            );

            return next;
          }
        );
      },
      []
    );

  const recordToolOpen =
    useCallback(
      (toolId) => {
        const next =
          addRecentWellnessTool(
            toolId
          );

        if (
          Array.isArray(next)
        ) {
          setRecent(next);
        }
      },
      []
    );

  const refreshRecent =
    useCallback(() => {
      setRecent(
        getRecentWellnessTools()
      );
    }, []);

  const refreshHistory =
    useCallback(() => {
      setHistory(
        getWellnessHistory()
      );
    }, []);

  return {
    tools:
      wellnessTools,

    selectedGoal,
    setSelectedGoal,

    recommendedTools,

    favorites,
    favoriteTools,
    toggleFavorite,

    recent,
    recentTools,
    recordToolOpen,
    refreshRecent,

    history,
    refreshHistory,

    isFavorite:
      (toolId) =>
        favorites.includes(
          toolId
        )
  };
}

export default useWellnessToolkit;