import {
  BookHeart,
  Feather,
  Plus
} from "lucide-react";

function JournalHero({
  onCreateEntry
}) {
  return (
    <section className="journal-hero">
      <div className="journal-hero__copy">
        <span className="journal-eyebrow">
          <Feather size={14} />
          Your private space
        </span>

        <h1>
          Pause. Reflect. <em>Unwind.</em>
        </h1>

        <p>
          Put your thoughts somewhere gentle.
          Your journal is private, personal,
          and always here when you need it.
        </p>

        <button
          type="button"
          className="journal-primary-button"
          onClick={onCreateEntry}
        >
          <Plus size={18} />
          New journal entry
        </button>
      </div>

      <div
        className="journal-hero__visual"
        aria-hidden="true"
      >
        <div className="journal-orbit journal-orbit--one" />

        <div className="journal-orbit journal-orbit--two" />

        <div className="journal-book">
          <BookHeart size={37} />

          <span>
            one thought
            <br />
            at a time
          </span>
        </div>
      </div>
    </section>
  );
}

export default JournalHero;