import JournalEntryList
  from "./JournalEntryList";

import JournalToolbar
  from "./JournalToolbar";

function JournalLibrary({
  entries,
  query,
  filter,
  loading,
  actionEntryId,
  onQueryChange,
  onFilterChange,
  onCreateEntry,
  onOpenEntry,
  onToggleFavourite
}) {
  return (
    <section className="journal-library">
      <JournalToolbar
        entries={entries}
        query={query}
        filter={filter}
        onQueryChange={
          onQueryChange
        }
        onFilterChange={
          onFilterChange
        }
      />

      <JournalEntryList
        entries={entries}
        query={query}
        loading={loading}
        actionEntryId={
          actionEntryId
        }
        onCreateEntry={
          onCreateEntry
        }
        onOpenEntry={
          onOpenEntry
        }
        onToggleFavourite={
          onToggleFavourite
        }
      />
    </section>
  );
}

export default JournalLibrary;