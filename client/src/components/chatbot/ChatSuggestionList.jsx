import {
  ArrowUpRight,
  Sparkles
} from "lucide-react";

function ChatSuggestionList({
  suggestions = [],
  onSelect
}) {
  if (
    !Array.isArray(
      suggestions
    ) ||
    suggestions.length === 0
  ) {
    return null;
  }

  return (
    <div className="chat-suggestions">
      <div className="chat-suggestions__label">
        <Sparkles
          size={13}
        />

        <span>
          Complete your thought
        </span>
      </div>

      <div className="chat-suggestions__list">
        {suggestions.map(
          (
            suggestion
          ) => (
            <button
              key={`${suggestion.source}-${suggestion.tag}-${suggestion.text}`}
              type="button"
              className="chat-suggestion"
              onMouseDown={(
                event
              ) =>
                event.preventDefault()
              }
              onClick={() =>
                onSelect?.(
                  suggestion
                )
              }
            >
              <span className="chat-suggestion__content">
                <strong>
                  {
                    suggestion.text
                  }
                </strong>

                {suggestion.tag && (
                  <small>
                    {
                      suggestion.tag
                    }
                  </small>
                )}
              </span>

              <ArrowUpRight
                size={14}
              />
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default ChatSuggestionList;