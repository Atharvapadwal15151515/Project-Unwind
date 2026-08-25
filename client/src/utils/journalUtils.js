import {
  JOURNAL_MOODS
} from "../data/journalOptions";

export function getJournalField(
  item,
  camelCaseKey,
  snakeCaseKey
) {
  return (
    item?.[camelCaseKey] ??
    item?.[snakeCaseKey]
  );
}

export function getJournalEntryId(entry) {
  return getJournalField(
    entry,
    "entryId",
    "entry_id"
  );
}

export function getPromptText(prompt) {
  return (
    getJournalField(
      prompt,
      "promptText",
      "prompt_text"
    ) ||
    prompt?.text ||
    ""
  );
}

export function getTodayDate() {
  const today = new Date();

  const timezoneOffset =
    today.getTimezoneOffset() *
    60 *
    1000;

  return new Date(
    today.getTime() - timezoneOffset
  )
    .toISOString()
    .slice(0, 10);
}

export function getJournalTagId(
  tag
) {
  return getJournalField(
    tag,
    "tagId",
    "tag_id"
  );
}

export function getJournalEmotionId(
  emotion
) {
  return getJournalField(
    emotion,
    "emotionId",
    "emotion_id"
  );
}

export function getJournalActivityId(
  activity
) {
  return getJournalField(
    activity,
    "activityId",
    "activity_id"
  );
}

export function createJournalEditorState(
  entry = null,
  prompt = null
) {
    const entryDate =
    getJournalField(
      entry,
      "entryDate",
      "entry_date"
    ) || getTodayDate();

 return {
  title:
    getJournalField(
      entry,
      "title",
      "title"
    ) || "",

  content:
    getJournalField(
      entry,
      "content",
      "content"
    ) || "",

  moodScore:
    getJournalField(
      entry,
      "moodScore",
      "mood_score"
    ) ?? null,

  moodLabel:
    getJournalField(
      entry,
      "moodLabel",
      "mood_label"
    ) || "",

  entryDate:
    String(entryDate)
      .slice(0, 10),

  promptId: prompt
    ? getJournalField(
        prompt,
        "promptId",
        "prompt_id"
      )
    : getJournalField(
        entry,
        "promptId",
        "prompt_id"
      ) || null,

  promptTextSnapshot: prompt
    ? getPromptText(prompt)
    : getJournalField(
        entry,
        "promptTextSnapshot",
        "prompt_text_snapshot"
      ) || "",

     entryType:
  getJournalField(
    entry,
    "entryType",
    "entry_type"
  ) || "standard",

emotionIds:
  Array.isArray(
    entry?.emotions
  )
    ? entry.emotions
        .map(
          getJournalEmotionId
        )
        .filter(Boolean)
    : [],

tagIds:
  Array.isArray(
    entry?.tags
  )
    ? entry.tags
        .map(
          getJournalTagId
        )
        .filter(Boolean)
    : [],

activityIds:
  Array.isArray(
    entry?.activities
  )
    ? entry.activities
        .map(
          getJournalActivityId
        )
        .filter(Boolean)
    : []
};
}

export function formatJournalDate(value) {
  if (!value) {
    return "Today";
  }

  const normalizedDate =
    String(value).slice(0, 10);

  const date = new Date(
    `${normalizedDate}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  ).format(date);
}

export function getJournalMood(entry) {
  const moodScore = Number(
    getJournalField(
      entry,
      "moodScore",
      "mood_score"
    )
  );

  return JOURNAL_MOODS.find(
    (mood) =>
      mood.score === moodScore
  );
}

export function getJournalStatus(entry) {
  return (
    getJournalField(
      entry,
      "entryStatus",
      "entry_status"
    ) || "draft"
  );
}

export function isJournalFavourite(entry) {
  return Boolean(
    getJournalField(
      entry,
      "isFavourite",
      "is_favourite"
    )
  );
}

export function countJournalWords(
  content = ""
) {
  const normalizedContent =
    content.trim();

  if (!normalizedContent) {
    return 0;
  }

  return normalizedContent
    .split(/\s+/)
    .length;
}