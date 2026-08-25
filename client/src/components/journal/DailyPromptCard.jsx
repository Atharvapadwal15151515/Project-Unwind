import {
  BookOpen,
  ChevronRight,
  Sparkles
} from "lucide-react";

import {
  getPromptText
} from "../../utils/journalUtils";

function DailyPromptCard({
  prompt,
  onWrite,
  onBrowse
}) {
  if (!prompt) {
    return null;
  }

  return (
    <section className="journal-prompt">
      <span className="journal-prompt__icon">
        <Sparkles size={20} />
      </span>

      <div className="journal-prompt__content">
        <small>
          Today&apos;s reflection
        </small>

        <h2>
          {getPromptText(prompt)}
        </h2>
      </div>

      <div className="journal-prompt__actions">
        <button
          type="button"
          className="journal-prompt__browse"
          onClick={onBrowse}
        >
          <BookOpen size={17} />
          Browse prompts
        </button>

        <button
          type="button"
          className="journal-prompt__write"
          onClick={() =>
            onWrite(prompt)
          }
        >
          Write about this
          <ChevronRight size={17} />
        </button>
      </div>
    </section>
  );
}

export default DailyPromptCard;