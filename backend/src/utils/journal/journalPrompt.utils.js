import crypto from "crypto";

export const JOURNAL_PROMPT_CATEGORIES = {
  DAILY_REFLECTION:
    "daily_reflection",

  GRATITUDE:
    "gratitude",

  EMOTIONAL_AWARENESS:
    "emotional_awareness",

  STRESS:
    "stress",

  ANXIETY:
    "anxiety",

  SELF_COMPASSION:
    "self_compassion",

  SELF_DISCOVERY:
    "self_discovery",

  RELATIONSHIPS:
    "relationships",

  GOALS:
    "goals",

  GROWTH:
    "growth",

  MINDFULNESS:
    "mindfulness",

  ACHIEVEMENTS:
    "achievements",

  CHALLENGES:
    "challenges",

  FUTURE:
    "future",

  CUSTOM:
    "custom"
};

export const JOURNAL_PROMPT_CATEGORY_LABELS = {
  daily_reflection:
    "Daily Reflection",

  gratitude:
    "Gratitude",

  emotional_awareness:
    "Emotional Awareness",

  stress:
    "Stress Reflection",

  anxiety:
    "Anxiety Reflection",

  self_compassion:
    "Self-Compassion",

  self_discovery:
    "Self-Discovery",

  relationships:
    "Relationships",

  goals:
    "Goals",

  growth:
    "Personal Growth",

  mindfulness:
    "Mindfulness",

  achievements:
    "Achievements",

  challenges:
    "Challenges",

  future:
    "Future Reflection",

  custom:
    "Custom Prompt"
};

export const JOURNAL_PROMPT_LIMITS = {
  MIN_PROMPT_LENGTH: 3,

  MAX_PROMPT_LENGTH: 1000,

  MAX_CATEGORY_LENGTH: 50,

  MAX_SEARCH_LENGTH: 200,

  DEFAULT_RECENT_DAYS: 14,

  MAX_RECENT_DAYS: 365,

  DEFAULT_PAGE_SIZE: 20,

  MAX_PAGE_SIZE: 100
};

export function normalizePromptText(
  promptText
) {
  if (
    promptText === undefined ||
    promptText === null
  ) {
    return "";
  }

  return String(promptText)
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizePromptText(
  promptText
) {
  const normalized =
    normalizePromptText(
      promptText
    );

  return normalized
    .replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    )
    .replace(
      /<[^>]+>/g,
      ""
    )
    .replace(
      /javascript:/gi,
      ""
    )
    .trim();
}

export function normalizePromptCategory(
  category
) {
  if (
    category === undefined ||
    category === null
  ) {
    return JOURNAL_PROMPT_CATEGORIES
      .DAILY_REFLECTION;
  }

  const normalized =
    String(category)
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      )
      .slice(
        0,
        JOURNAL_PROMPT_LIMITS
          .MAX_CATEGORY_LENGTH
      );

  return (
    normalized ||
    JOURNAL_PROMPT_CATEGORIES
      .DAILY_REFLECTION
  );
}

export function normalizePromptSearch(
  search
) {
  if (
    search === undefined ||
    search === null
  ) {
    return null;
  }

  const normalized =
    String(search)
      .replace(/\s+/g, " ")
      .trim()
      .slice(
        0,
        JOURNAL_PROMPT_LIMITS
          .MAX_SEARCH_LENGTH
      );

  return normalized || null;
}

export function validatePromptText(
  promptText
) {
  const normalized =
    sanitizePromptText(
      promptText
    );

  if (!normalized) {
    return {
      isValid: false,
      message:
        "Prompt text is required.",
      value: normalized
    };
  }

  if (
    normalized.length <
    JOURNAL_PROMPT_LIMITS
      .MIN_PROMPT_LENGTH
  ) {
    return {
      isValid: false,
      message:
        `Prompt text must contain at least ${JOURNAL_PROMPT_LIMITS.MIN_PROMPT_LENGTH} characters.`,
      value: normalized
    };
  }

  if (
    normalized.length >
    JOURNAL_PROMPT_LIMITS
      .MAX_PROMPT_LENGTH
  ) {
    return {
      isValid: false,
      message:
        `Prompt text cannot exceed ${JOURNAL_PROMPT_LIMITS.MAX_PROMPT_LENGTH} characters.`,
      value: normalized
    };
  }

  return {
    isValid: true,
    value: normalized
  };
}

export function validatePromptCategory(
  category
) {
  const normalized =
    normalizePromptCategory(
      category
    );

  if (
    normalized.length >
    JOURNAL_PROMPT_LIMITS
      .MAX_CATEGORY_LENGTH
  ) {
    return {
      isValid: false,
      message:
        `Prompt category cannot exceed ${JOURNAL_PROMPT_LIMITS.MAX_CATEGORY_LENGTH} characters.`,
      value: normalized
    };
  }

  if (
    !/^[a-z0-9_]+$/.test(
      normalized
    )
  ) {
    return {
      isValid: false,
      message:
        "Prompt category can contain only lowercase letters, numbers, and underscores.",
      value: normalized
    };
  }

  return {
    isValid: true,
    value: normalized
  };
}

export function getPromptCategoryLabel(
  category
) {
  const normalized =
    normalizePromptCategory(
      category
    );

  if (
    JOURNAL_PROMPT_CATEGORY_LABELS[
      normalized
    ]
  ) {
    return JOURNAL_PROMPT_CATEGORY_LABELS[
      normalized
    ];
  }

  return normalized
    .split("_")
    .filter(Boolean)
    .map(
      capitalizeFirstLetter
    )
    .join(" ");
}

export function isKnownPromptCategory(
  category
) {
  const normalized =
    normalizePromptCategory(
      category
    );

  return Object.values(
    JOURNAL_PROMPT_CATEGORIES
  ).includes(normalized);
}

export function getAllPromptCategories() {
  return Object.values(
    JOURNAL_PROMPT_CATEGORIES
  ).map((category) => ({
    value: category,

    label:
      getPromptCategoryLabel(
        category
      )
  }));
}

export function countPromptWords(
  promptText
) {
  const normalized =
    normalizePromptText(
      promptText
    );

  if (!normalized) {
    return 0;
  }

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

export function estimatePromptReadingTime(
  promptText,
  wordsPerMinute = 200
) {
  const wordCount =
    countPromptWords(
      promptText
    );

  if (wordCount === 0) {
    return 0;
  }

  const readingMinutes =
    wordCount /
    Math.max(
      Number(wordsPerMinute) ||
        200,
      1
    );

  return Number(
    readingMinutes.toFixed(2)
  );
}

export function createPromptFingerprint(
  promptText
) {
  const normalized =
    normalizePromptText(
      promptText
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9\s]/g,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();

  if (!normalized) {
    return null;
  }

  return crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex");
}

export function arePromptsDuplicate(
  firstPrompt,
  secondPrompt
) {
  const firstFingerprint =
    createPromptFingerprint(
      firstPrompt
    );

  const secondFingerprint =
    createPromptFingerprint(
      secondPrompt
    );

  if (
    !firstFingerprint ||
    !secondFingerprint
  ) {
    return false;
  }

  return (
    firstFingerprint ===
    secondFingerprint
  );
}

export function findDuplicatePrompt(
  promptText,
  prompts = []
) {
  if (
    !Array.isArray(prompts)
  ) {
    return null;
  }

  const fingerprint =
    createPromptFingerprint(
      promptText
    );

  if (!fingerprint) {
    return null;
  }

  return (
    prompts.find((prompt) => {
      const existingText =
        prompt.prompt_text ??
        prompt.promptText ??
        "";

      return (
        createPromptFingerprint(
          existingText
        ) === fingerprint
      );
    }) || null
  );
}

export function normalizeRecentDays(
  recentDays
) {
  const numericValue =
    Number(recentDays);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return JOURNAL_PROMPT_LIMITS
      .DEFAULT_RECENT_DAYS;
  }

  return Math.min(
    Math.max(
      Math.floor(
        numericValue
      ),
      1
    ),
    JOURNAL_PROMPT_LIMITS
      .MAX_RECENT_DAYS
  );
}

export function normalizePromptPagination(
  options = {}
) {
  const requestedPage =
    Number(options.page);

  const requestedLimit =
    Number(options.limit);

  const page =
    Number.isInteger(
      requestedPage
    ) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const limit =
    Number.isInteger(
      requestedLimit
    ) &&
    requestedLimit > 0
      ? Math.min(
          requestedLimit,
          JOURNAL_PROMPT_LIMITS
            .MAX_PAGE_SIZE
        )
      : JOURNAL_PROMPT_LIMITS
          .DEFAULT_PAGE_SIZE;

  return {
    page,
    limit,
    offset:
      (page - 1) * limit
  };
}

export function buildPromptPagination({
  page,
  limit,
  total
}) {
  const safePage =
    Math.max(
      Number(page) || 1,
      1
    );

  const safeLimit =
    Math.max(
      Number(limit) ||
        JOURNAL_PROMPT_LIMITS
          .DEFAULT_PAGE_SIZE,
      1
    );

  const safeTotal =
    Math.max(
      Number(total) || 0,
      0
    );

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,

    totalPages:
      safeTotal === 0
        ? 0
        : Math.ceil(
            safeTotal /
            safeLimit
          ),

    hasPreviousPage:
      safePage > 1,

    hasNextPage:
      safePage <
      Math.ceil(
        safeTotal /
        safeLimit
      )
  };
}

export function selectRandomPrompt(
  prompts = [],
  excludedPromptIds = []
) {
  if (
    !Array.isArray(prompts) ||
    prompts.length === 0
  ) {
    return null;
  }

  const excludedIds =
    new Set(
      (
        excludedPromptIds ||
        []
      ).map(String)
    );

  let availablePrompts =
    prompts.filter((prompt) => {
      const promptId =
        prompt.prompt_id ??
        prompt.promptId;

      return (
        promptId &&
        !excludedIds.has(
          String(promptId)
        )
      );
    });

  if (
    availablePrompts.length ===
    0
  ) {
    availablePrompts = prompts;
  }

  const randomIndex =
    crypto.randomInt(
      0,
      availablePrompts.length
    );

  return (
    availablePrompts[
      randomIndex
    ] || null
  );
}

export function generateDailyPromptSeed(
  userId,
  date = new Date()
) {
  const normalizedDate =
    formatPromptDate(date);

  const source =
    `${String(userId || "anonymous")}:${normalizedDate}`;

  const hash =
    crypto
      .createHash("sha256")
      .update(source)
      .digest("hex");

  return parseInt(
    hash.slice(0, 8),
    16
  );
}

export function selectDailyPrompt(
  prompts = [],
  userId,
  date = new Date(),
  excludedPromptIds = []
) {
  if (
    !Array.isArray(prompts) ||
    prompts.length === 0
  ) {
    return null;
  }

  const excludedIds =
    new Set(
      (
        excludedPromptIds ||
        []
      ).map(String)
    );

  let availablePrompts =
    prompts.filter((prompt) => {
      const promptId =
        prompt.prompt_id ??
        prompt.promptId;

      return (
        promptId &&
        !excludedIds.has(
          String(promptId)
        )
      );
    });

  if (
    availablePrompts.length ===
    0
  ) {
    availablePrompts = prompts;
  }

  const sortedPrompts =
    [...availablePrompts].sort(
      (first, second) =>
        String(
          first.prompt_id ??
            first.promptId ??
            ""
        ).localeCompare(
          String(
            second.prompt_id ??
              second.promptId ??
              ""
          )
        )
    );

  const seed =
    generateDailyPromptSeed(
      userId,
      date
    );

  const selectedIndex =
    seed %
    sortedPrompts.length;

  return (
    sortedPrompts[
      selectedIndex
    ] || null
  );
}

export function formatPromptDate(
  date = new Date()
) {
  const normalizedDate =
    date instanceof Date
      ? date
      : new Date(date);

  if (
    Number.isNaN(
      normalizedDate.getTime()
    )
  ) {
    throw new Error(
      "Invalid prompt date."
    );
  }

  const year =
    normalizedDate.getUTCFullYear();

  const month =
    String(
      normalizedDate.getUTCMonth() +
        1
    ).padStart(2, "0");

  const day =
    String(
      normalizedDate.getUTCDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isPromptAvailable(
  prompt,
  userId = null
) {
  if (!prompt) {
    return false;
  }

  const isActive =
    prompt.is_active ??
    prompt.isActive;

  if (isActive === false) {
    return false;
  }

  const isSystem =
    prompt.is_system ??
    prompt.isSystem;

  if (isSystem === true) {
    return true;
  }

  const ownerUserId =
    prompt.user_id ??
    prompt.userId;

  if (!userId) {
    return false;
  }

  return (
    String(ownerUserId) ===
    String(userId)
  );
}

export function filterAccessiblePrompts(
  prompts = [],
  userId
) {
  if (
    !Array.isArray(prompts)
  ) {
    return [];
  }

  return prompts.filter(
    (prompt) =>
      isPromptAvailable(
        prompt,
        userId
      )
  );
}

export function filterPromptsByCategory(
  prompts = [],
  category
) {
  if (
    !Array.isArray(prompts)
  ) {
    return [];
  }

  if (!category) {
    return [...prompts];
  }

  const normalizedCategory =
    normalizePromptCategory(
      category
    );

  return prompts.filter(
    (prompt) =>
      normalizePromptCategory(
        prompt.prompt_category ??
          prompt.promptCategory
      ) === normalizedCategory
  );
}

export function searchPrompts(
  prompts = [],
  search
) {
  if (
    !Array.isArray(prompts)
  ) {
    return [];
  }

  const normalizedSearch =
    normalizePromptSearch(
      search
    );

  if (!normalizedSearch) {
    return [...prompts];
  }

  const searchValue =
    normalizedSearch.toLowerCase();

  return prompts.filter(
    (prompt) => {
      const promptText =
        String(
          prompt.prompt_text ??
            prompt.promptText ??
            ""
        ).toLowerCase();

      const category =
        String(
          prompt.prompt_category ??
            prompt.promptCategory ??
            ""
        ).toLowerCase();

      const categoryLabel =
        getPromptCategoryLabel(
          category
        ).toLowerCase();

      return (
        promptText.includes(
          searchValue
        ) ||
        category.includes(
          searchValue
        ) ||
        categoryLabel.includes(
          searchValue
        )
      );
    }
  );
}

export function formatJournalPrompt(
  prompt
) {
  if (!prompt) {
    return null;
  }

  const promptText =
    prompt.prompt_text ??
    prompt.promptText ??
    "";

  const promptCategory =
    normalizePromptCategory(
      prompt.prompt_category ??
        prompt.promptCategory
    );

  return {
    promptId:
      prompt.prompt_id ??
      prompt.promptId,

    userId:
      prompt.user_id ??
      prompt.userId ??
      null,

    promptText,

    promptCategory,

    promptCategoryLabel:
      getPromptCategoryLabel(
        promptCategory
      ),

    isSystem: Boolean(
      prompt.is_system ??
        prompt.isSystem
    ),

    isActive:
      prompt.is_active ??
        prompt.isActive ??
        true,

    displayOrder: Number(
      prompt.display_order ??
        prompt.displayOrder ??
        0
    ),

    wordCount:
      countPromptWords(
        promptText
      ),

    estimatedReadingMinutes:
      estimatePromptReadingTime(
        promptText
      ),

    createdAt:
      prompt.created_at ??
      prompt.createdAt ??
      null,

    updatedAt:
      prompt.updated_at ??
      prompt.updatedAt ??
      null
  };
}

export function formatJournalPrompts(
  prompts = []
) {
  if (
    !Array.isArray(prompts)
  ) {
    return [];
  }

  return prompts.map(
    formatJournalPrompt
  );
}

export function formatPromptHistory(
  history
) {
  if (!history) {
    return null;
  }

  const promptText =
    history.prompt_text ??
    history.promptText ??
    null;

  const category =
    history.prompt_category ??
    history.promptCategory ??
    null;

  return {
    promptHistoryId:
      history.prompt_history_id ??
      history.promptHistoryId ??
      history.history_id ??
      history.historyId,

    userId:
      history.user_id ??
      history.userId,

    promptId:
      history.prompt_id ??
      history.promptId,

    entryId:
      history.entry_id ??
      history.entryId ??
      null,

    promptText,

    promptCategory:
      category
        ? normalizePromptCategory(
            category
          )
        : null,

    promptCategoryLabel:
      category
        ? getPromptCategoryLabel(
            category
          )
        : null,

    wasUsed: Boolean(
      history.was_used ??
        history.wasUsed
    ),

    shownAt:
      history.shown_at ??
      history.shownAt ??
      history.created_at ??
      history.createdAt ??
      null,

    usedAt:
      history.used_at ??
      history.usedAt ??
      null,

    isSystem:
      history.is_system !==
        undefined
        ? Boolean(
            history.is_system
          )
        : history.isSystem !==
            undefined
          ? Boolean(
              history.isSystem
            )
          : null,

    createdAt:
      history.created_at ??
      history.createdAt ??
      null
  };
}

export function formatPromptHistoryList(
  history = []
) {
  if (
    !Array.isArray(history)
  ) {
    return [];
  }

  return history.map(
    formatPromptHistory
  );
}

export function calculatePromptUsageRate({
  shownCount,
  usedCount
}) {
  const shown =
    Number(shownCount) || 0;

  const used =
    Number(usedCount) || 0;

  if (shown <= 0) {
    return 0;
  }

  return Number(
    (
      (used / shown) *
      100
    ).toFixed(2)
  );
}

export function formatPromptStatistics(
  statistics
) {
  if (!statistics) {
    return {
      totalShown: 0,
      totalUsed: 0,
      totalUnused: 0,
      usageRate: 0,
      uniquePromptsShown: 0,
      uniquePromptsUsed: 0,
      firstShownAt: null,
      lastShownAt: null
    };
  }

  const totalShown =
    Number(
      statistics.total_shown ??
        statistics.totalShown ??
        0
    );

  const totalUsed =
    Number(
      statistics.total_used ??
        statistics.totalUsed ??
        0
    );

  return {
    totalShown,

    totalUsed,

    totalUnused:
      Math.max(
        totalShown -
          totalUsed,
        0
      ),

    usageRate:
      calculatePromptUsageRate({
        shownCount:
          totalShown,

        usedCount:
          totalUsed
      }),

    uniquePromptsShown:
      Number(
        statistics
          .unique_prompts_shown ??
          statistics
            .uniquePromptsShown ??
          0
      ),

    uniquePromptsUsed:
      Number(
        statistics
          .unique_prompts_used ??
          statistics
            .uniquePromptsUsed ??
          0
      ),

    firstShownAt:
      statistics.first_shown_at ??
      statistics.firstShownAt ??
      null,

    lastShownAt:
      statistics.last_shown_at ??
      statistics.lastShownAt ??
      null
  };
}

export function formatMostUsedPrompt(
  prompt
) {
  if (!prompt) {
    return null;
  }

  const formattedPrompt =
    formatJournalPrompt(
      prompt
    );

  const shownCount =
    Number(
      prompt.shown_count ??
        prompt.shownCount ??
        0
    );

  const usedCount =
    Number(
      prompt.used_count ??
        prompt.usedCount ??
        0
    );

  return {
    ...formattedPrompt,

    shownCount,

    usedCount,

    usageRate:
      calculatePromptUsageRate({
        shownCount,
        usedCount
      }),

    lastShownAt:
      prompt.last_shown_at ??
      prompt.lastShownAt ??
      null,

    lastUsedAt:
      prompt.last_used_at ??
      prompt.lastUsedAt ??
      null
  };
}

export function formatMostUsedPrompts(
  prompts = []
) {
  if (
    !Array.isArray(prompts)
  ) {
    return [];
  }

  return prompts.map(
    formatMostUsedPrompt
  );
}

export function groupPromptsByCategory(
  prompts = []
) {
  if (
    !Array.isArray(prompts)
  ) {
    return {};
  }

  return prompts.reduce(
    (
      groupedPrompts,
      prompt
    ) => {
      const category =
        normalizePromptCategory(
          prompt.prompt_category ??
            prompt.promptCategory
        );

      if (
        !groupedPrompts[
          category
        ]
      ) {
        groupedPrompts[
          category
        ] = {
          category,

          label:
            getPromptCategoryLabel(
              category
            ),

          prompts: []
        };
      }

      groupedPrompts[
        category
      ].prompts.push(
        prompt
      );

      return groupedPrompts;
    },
    {}
  );
}

export function sortPrompts(
  prompts = []
) {
  if (
    !Array.isArray(prompts)
  ) {
    return [];
  }

  return [...prompts].sort(
    (first, second) => {
      const firstOrder =
        Number(
          first.display_order ??
            first.displayOrder ??
            0
        );

      const secondOrder =
        Number(
          second.display_order ??
            second.displayOrder ??
            0
        );

      if (
        firstOrder !==
        secondOrder
      ) {
        return (
          firstOrder -
          secondOrder
        );
      }

      const firstCreatedAt =
        new Date(
          first.created_at ??
            first.createdAt ??
            0
        ).getTime();

      const secondCreatedAt =
        new Date(
          second.created_at ??
            second.createdAt ??
            0
        ).getTime();

      return (
        firstCreatedAt -
        secondCreatedAt
      );
    }
  );
}

export function getPromptDifficulty(
  promptText
) {
  const wordCount =
    countPromptWords(
      promptText
    );

  if (wordCount <= 8) {
    return "simple";
  }

  if (wordCount <= 20) {
    return "moderate";
  }

  return "detailed";
}

export function createPromptSnapshot(
  prompt
) {
  if (!prompt) {
    return null;
  }

  return {
    promptId:
      prompt.prompt_id ??
      prompt.promptId,

    promptText:
      normalizePromptText(
        prompt.prompt_text ??
          prompt.promptText
      ),

    promptCategory:
      normalizePromptCategory(
        prompt.prompt_category ??
          prompt.promptCategory
      ),

    isSystem: Boolean(
      prompt.is_system ??
        prompt.isSystem
    )
  };
}

export function capitalizeFirstLetter(
  value
) {
  if (!value) {
    return "";
  }

  const normalized =
    String(value);

  return (
    normalized.charAt(0)
      .toUpperCase() +
    normalized.slice(1)
  );
}