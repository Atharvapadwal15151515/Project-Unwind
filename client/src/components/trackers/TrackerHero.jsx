import {
  CalendarDays,
  RefreshCw,
  Sparkles
} from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(
    `${dateValue}T12:00:00`
  );

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  ).format(date);
}

function TrackerHero({
  displayName,
  selectedDate,
  onDateChange,
  refreshing,
  onRefresh
}) {
  return (
    <section className="tracker-hero">
      <div className="tracker-hero__content">
        <span className="tracker-hero__eyebrow">
          <Sparkles size={15} />
          Daily wellness
        </span>

        <h1>
          {getGreeting()},{" "}
          <span>{displayName}</span>
        </h1>

        <p>
          Take a moment to notice how your body
          and mind are feeling today.
        </p>

        <div className="tracker-hero__controls">
          <label className="tracker-date-picker">
            <CalendarDays size={17} />

            <span>
              {formatDate(selectedDate)}
            </span>

            <input
              type="date"
              value={selectedDate}
              max={new Date()
                .toISOString()
                .slice(0, 10)}
              onChange={(event) =>
                onDateChange(event.target.value)
              }
            />
          </label>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "trackers-icon-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing…"
              : "Refresh today"}
          </button>
        </div>
      </div>

      <div className="tracker-hero__visual">
        <span className="tracker-hero__ring tracker-hero__ring--outer" />
        <span className="tracker-hero__ring tracker-hero__ring--middle" />

        <span className="tracker-hero__ring tracker-hero__ring--inner">
          Breathe
        </span>
      </div>

      <span className="tracker-hero__orb tracker-hero__orb--one" />
      <span className="tracker-hero__orb tracker-hero__orb--two" />
    </section>
  );
}

export default TrackerHero;