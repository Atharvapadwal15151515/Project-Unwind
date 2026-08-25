import {
  Feather,
  LoaderCircle,
  Plus
} from "lucide-react";

import JournalEntryCard
  from "./JournalEntryCard";

import {
  getJournalEntryId
} from "../../utils/journalUtils";

function JournalEntryList({
  entries,
  query,
  loading,
  actionEntryId,
  onCreateEntry,
  onOpenEntry,
  onToggleFavourite
}) {
  if (loading) {
    return (
      <div className="journal-state">
        <LoaderCircle
          className="journal-spin"
          size={30}
        />

        <p>Opening your journal...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="journal-state journal-state--empty">
        <span>
          <Feather size={27} />
        </span>

        <h3>
          {query
            ? "No matching reflections"
            : "Your first page is waiting"}
        </h3>

        <p>
          {query
            ? "Try a different word or clear your search."
            : "There is no right way to journal. Begin with whatever is on your mind."}
        </p>

        <button
          type="button"
          onClick={onCreateEntry}
        >
          <Plus size={17} />
          Start writing
        </button>
      </div>
    );
  }

  return (
    <div className="journal-grid">
      {entries.map((entry) => {
        const id =
          getJournalEntryId(entry);

        return (
          <JournalEntryCard
            key={id}
            entry={entry}
            busy={
              actionEntryId === id
            }
            onOpen={onOpenEntry}
            onToggleFavourite={
              onToggleFavourite
            }
          />
        );
      })}
    </div>
  );
}

export default JournalEntryList;