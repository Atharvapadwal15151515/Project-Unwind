function TrackerSkeleton() {
  return (
    <div className="trackers-page">
      <div className="tracker-skeleton tracker-skeleton--hero" />

      <div className="trackers-overview-grid">
        <div className="tracker-skeleton tracker-skeleton--overview" />
        <div className="tracker-skeleton tracker-skeleton--overview" />
      </div>

      <div className="trackers-main-grid">
        {Array.from({
          length: 4
        }).map((_, index) => (
          <div
            key={index}
            className="tracker-skeleton tracker-skeleton--card"
          />
        ))}
      </div>
    </div>
  );
}

export default TrackerSkeleton;