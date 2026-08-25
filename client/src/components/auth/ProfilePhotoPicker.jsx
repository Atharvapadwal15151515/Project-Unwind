import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Camera,
  ImagePlus,
  Trash2,
  UserRound
} from "lucide-react";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

function ProfilePhotoPicker({
  file,
  onChange,
  error,
  onError
}) {
  const inputRef = useRef(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl =
      URL.createObjectURL(file);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const handleFileSelection = (event) => {
    const selectedFile =
      event.target.files?.[0];

    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        selectedFile.type
      )
    ) {
      onError(
        "Choose a JPEG, PNG or WebP image."
      );

      return;
    }

    if (
      selectedFile.size > MAX_FILE_SIZE
    ) {
      onError(
        "Profile photo must be smaller than 5 MB."
      );

      return;
    }

    onError("");
    onChange(selectedFile);
  };

  const removeImage = () => {
    onChange(null);
    onError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <section className="profile-photo-picker">
      <div className="profile-photo-picker__preview">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Selected profile preview"
          />
        ) : (
          <UserRound size={35} />
        )}

        <button
          type="button"
          className="profile-photo-picker__camera"
          onClick={() =>
            inputRef.current?.click()
          }
          aria-label="Choose profile photo"
        >
          <Camera size={16} />
        </button>
      </div>

      <div className="profile-photo-picker__content">
        <div>
          <strong>Profile photo</strong>

          <p>
            Add a friendly photo so people can
            recognise you. This is optional.
          </p>
        </div>

        <div className="profile-photo-picker__actions">
          <button
            type="button"
            className="profile-photo-picker__upload"
            onClick={() =>
              inputRef.current?.click()
            }
          >
            <ImagePlus size={16} />

            {file
              ? "Change photo"
              : "Choose photo"}
          </button>

          {file && (
            <button
              type="button"
              className="profile-photo-picker__remove"
              onClick={removeImage}
            >
              <Trash2 size={15} />
              Remove
            </button>
          )}
        </div>

        <small>
          JPEG, PNG or WebP. Maximum 5 MB.
        </small>

        {file && (
          <span className="profile-photo-picker__filename">
            {file.name}
          </span>
        )}

        {error && (
          <span className="profile-photo-picker__error">
            {error}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelection}
        hidden
      />
    </section>
  );
}

export default ProfilePhotoPicker;