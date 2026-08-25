function getMediaUrl(mediaItem) {
  return (
    mediaItem?.secure_url ||
    mediaItem?.media_url ||
    mediaItem?.mediaUrl ||
    mediaItem?.url ||
    mediaItem?.file_url ||
    null
  );
}

function getMediaType(mediaItem) {
  const explicitType =
    mediaItem?.media_type ||
    mediaItem?.mediaType ||
    mediaItem?.resource_type ||
    mediaItem?.type;

  if (
    explicitType === "video" ||
    explicitType?.startsWith("video")
  ) {
    return "video";
  }

  const mimeType =
    mediaItem?.mime_type ||
    mediaItem?.mimeType;

  if (mimeType?.startsWith("video/")) {
    return "video";
  }

  const url = getMediaUrl(mediaItem);

  if (
    /\.(mp4|webm|mov)(\?.*)?$/i.test(
      url || ""
    )
  ) {
    return "video";
  }

  return "image";
}

function PostMedia({ media }) {
  const mediaItems = Array.isArray(media)
    ? media.filter((item) =>
        Boolean(getMediaUrl(item))
      )
    : [];

  if (!mediaItems.length) {
    return null;
  }

  const visibleItems =
    mediaItems.slice(0, 4);

  return (
    <div
      className={`community-post-media community-post-media--${Math.min(
        visibleItems.length,
        4
      )}`}
    >
      {visibleItems.map(
        (mediaItem, index) => {
          const url =
            getMediaUrl(mediaItem);

          const type =
            getMediaType(mediaItem);

          const remaining =
            mediaItems.length - 4;

          return (
            <div
              className="community-post-media__item"
              key={
                mediaItem?.media_id ||
                mediaItem?.public_id ||
                url
              }
            >
              {type === "video" ? (
                <video
                  src={url}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={url}
                  alt={`Community post media ${
                    index + 1
                  }`}
                  loading="lazy"
                />
              )}

              {index === 3 &&
                remaining > 0 && (
                  <span className="community-post-media__remaining">
                    +{remaining}
                  </span>
                )}
            </div>
          );
        }
      )}
    </div>
  );
}

export default PostMedia;