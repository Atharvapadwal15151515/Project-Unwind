import {
  BookHeart,
  CalendarDays,
  Heart
} from "lucide-react";

function JournalStatItem({
  icon,
  value,
  label
}) {
  return (
    <div>
      <span>{icon}</span>

      <p>
        <strong>{value}</strong>
        {label}
      </p>
    </div>
  );
}

function JournalStats({ stats }) {
  return (
    <section
      className="journal-summary"
      aria-label="Journal summary"
    >
      <JournalStatItem
        icon={<BookHeart size={18} />}
        value={stats.total}
        label="Total entries"
      />

      <JournalStatItem
        icon={<CalendarDays size={18} />}
        value={stats.thisMonth}
        label="This month"
      />

      <JournalStatItem
        icon={<Heart size={18} />}
        value={stats.favourites}
        label="Favourites shown"
      />
    </section>
  );
}

export default JournalStats;