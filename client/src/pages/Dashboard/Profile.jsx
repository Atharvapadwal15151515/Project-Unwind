import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  CircleUserRound,
  Edit3,
  ImagePlus,
  LoaderCircle,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X
} from "lucide-react";
import {
  useNavigate
} from "react-router-dom";
import {
  useAuth
} from "../../context/AuthContext";

import {
  removeProfilePicture,
  updateProfile,
  uploadProfilePicture
} from "../../services/profileService";

import "./Profile.css";

const GENDER_OPTIONS = [
  {
    value: "male",
    label: "Male"
  },
  {
    value: "female",
    label: "Female"
  },
  {
    value: "non_binary",
    label: "Non-binary"
  },
  {
    value:
      "prefer_not_to_say",
    label:
      "Prefer not to say"
  },
  {
    value: "other",
    label: "Other"
  }
];

const OCCUPATION_OPTIONS = [
  {
    value: "student",
    label: "Student"
  },
  {
    value:
      "working_professional",
    label:
      "Working professional"
  },
  {
    value:
      "self_employed",
    label:
      "Self-employed"
  },
  {
    value:
      "business_owner",
    label:
      "Business owner"
  },
  {
    value: "homemaker",
    label: "Homemaker"
  },
  {
    value: "retired",
    label: "Retired"
  },
  {
    value: "unemployed",
    label: "Unemployed"
  },
  {
    value: "other",
    label: "Other"
  }
];

function readUserField(
  user,
  snakeCase,
  camelCase
) {
  return (
    user?.[snakeCase] ??
    user?.[camelCase] ??
    ""
  );
}

function formatDateForInput(
  value
) {
  if (!value) {
    return "";
  }

  const text =
    String(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return text;
  }

  if (
    /^\d{4}-\d{2}-\d{2}T/.test(
      text
    )
  ) {
    return text.slice(
      0,
      10
    );
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

function createFormFromUser(
  user
) {
  return {
    username:
      user?.username || "",

    fullName:
      readUserField(
        user,
        "full_name",
        "fullName"
      ),

    displayName:
      readUserField(
        user,
        "display_name",
        "displayName"
      ),

    dateOfBirth:
      formatDateForInput(
        readUserField(
          user,
          "date_of_birth",
          "dateOfBirth"
        )
      ),

    gender:
      readUserField(
        user,
        "gender",
        "gender"
      ),

    occupationType:
      readUserField(
        user,
        "occupation_type",
        "occupationType"
      )
  };
}

function getDisplayName(
  user
) {
  return (
    readUserField(
      user,
      "display_name",
      "displayName"
    ) ||
    readUserField(
      user,
      "full_name",
      "fullName"
    ) ||
    user?.username ||
    "User"
  );
}

function getInitials(
  user
) {
  return getDisplayName(
    user
  )
    .split(" ")
    .filter(Boolean)
    .slice(
      0,
      2
    )
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}

function getProfileImage(
  user
) {
  return (
    user?.profile_image_url ||
    user?.profileImageUrl ||
    null
  );
}

function getOptionLabel(
  options,
  value
) {
  return (
    options.find(
      (option) =>
        option.value ===
        value
    )?.label ||
    "Not added yet"
  );
}

function getErrorMessage(
  error,
  fallback
) {
  const validationIssues =
    error?.response?.data
      ?.errors;

  if (
    Array.isArray(
      validationIssues
    ) &&
    validationIssues.length >
      0
  ) {
    return (
      validationIssues[0]
        ?.message ||
      fallback
    );
  }

  return (
    error?.response?.data
      ?.message ||
    error?.message ||
    fallback
  );
}

function Profile() {
  const {
    user,
    refreshUser
  } = useAuth();
    const navigate =
    useNavigate();

  const fileInputRef =
    useRef(null);

  const [
    editing,
    setEditing
  ] = useState(false);

  const [
    form,
    setForm
  ] = useState(() =>
    createFormFromUser(
      user
    )
  );

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    uploadingPhoto,
    setUploadingPhoto
  ] = useState(false);

  const [
    removingPhoto,
    setRemovingPhoto
  ] = useState(false);

  const [
    message,
    setMessage
  ] = useState(null);

  useEffect(
    () => {
      if (!editing) {
        setForm(
          createFormFromUser(
            user
          )
        );
      }
    },
    [
      user,
      editing
    ]
  );

  const profileImage =
    getProfileImage(
      user
    );

  const fullName =
    readUserField(
      user,
      "full_name",
      "fullName"
    );

  const displayName =
    getDisplayName(
      user
    );

  const gender =
    readUserField(
      user,
      "gender",
      "gender"
    );

  const occupationType =
    readUserField(
      user,
      "occupation_type",
      "occupationType"
    );

  const dateOfBirth =
    formatDateForInput(
      readUserField(
        user,
        "date_of_birth",
        "dateOfBirth"
      )
    );

  const profileCompletion =
    useMemo(
      () => {
        const values = [
          fullName,

          readUserField(
            user,
            "display_name",
            "displayName"
          ),

          dateOfBirth,
          gender,
          occupationType,
          profileImage
        ];

        const completed =
          values.filter(
            Boolean
          ).length;

        return Math.round(
          (
            completed /
            values.length
          ) *
            100
        );
      },
      [
        user,
        fullName,
        dateOfBirth,
        gender,
        occupationType,
        profileImage
      ]
    );

  const handleChange = (
    event
  ) => {
    const {
      name,
      value
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value
      })
    );
  };

  const showMessage = (
    type,
    text
  ) => {
    setMessage({
      type,
      text
    });
  };

  const handleStartEditing =
    () => {
      setForm(
        createFormFromUser(
          user
        )
      );

      setMessage(null);

      setEditing(true);
    };

  const handleCancelEditing =
    () => {
      setForm(
        createFormFromUser(
          user
        )
      );

      setMessage(null);

      setEditing(false);
    };

  const handleSave =
  async (event) => {
    event.preventDefault();

    const trimmedUsername =
      form.username.trim();

    const trimmedFullName =
      form.fullName.trim();

    if (
      trimmedUsername.length >
      30
    ) {
      showMessage(
        "error",
        "Username cannot exceed 30 characters."
      );

      return;
    }

    if (
      !/^[a-zA-Z0-9_]+$/.test(
        trimmedUsername
      )
    ) {
      showMessage(
        "error",
        "Username can only contain letters, numbers and underscores."
      );

      return;
    }

    if (
      trimmedFullName.length <
      2
    ) {
      showMessage(
        "error",
        "Full name must be at least 2 characters."
      );

      return;
    }

    if (
      trimmedDisplayName &&
      trimmedDisplayName.length <
        2
    ) {
      showMessage(
        "error",
        "Display name must be at least 2 characters or left empty."
      );

      return;
    }
        form.fullName.trim();

      const trimmedDisplayName =
        form.displayName.trim();

      if (
        trimmedFullName.length <
        2
      ) {
        showMessage(
          "error",
          "Full name must be at least 2 characters."
        );

        return;
      }

      if (
        trimmedDisplayName &&
        trimmedDisplayName.length <
          2
      ) {
        showMessage(
          "error",
          "Display name must be at least 2 characters or left empty."
        );

        return;
      }

      try {
        setSaving(true);

        setMessage(null);

        await updateProfile({
  username:
    trimmedUsername,

  fullName:
    trimmedFullName,

  displayName:
    trimmedDisplayName ||
    null,

  dateOfBirth:
    form.dateOfBirth ||
    null,

  gender:
    form.gender ||
    null,

  occupationType:
    form.occupationType ||
    null
});

        await refreshUser();

        setEditing(false);

        showMessage(
          "success",
          "Your profile has been updated."
        );
      } catch (error) {
        showMessage(
          "error",
          getErrorMessage(
            error,
            "Unable to update your profile."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const handlePhotoSelection =
    async (event) => {
      const file =
        event.target
          .files?.[0];

      event.target.value =
        "";

      if (!file) {
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        showMessage(
          "error",
          "Please choose a JPEG, PNG, or WebP image."
        );

        return;
      }

      if (
        file.size >
        5 *
          1024 *
          1024
      ) {
        showMessage(
          "error",
          "Profile picture must be smaller than 5 MB."
        );

        return;
      }

      try {
        setUploadingPhoto(
          true
        );

        setMessage(null);

        await uploadProfilePicture(
          file
        );

        await refreshUser();

        showMessage(
          "success",
          "Profile picture updated."
        );
      } catch (error) {
        showMessage(
          "error",
          getErrorMessage(
            error,
            "Unable to upload your profile picture."
          )
        );
      } finally {
        setUploadingPhoto(
          false
        );
      }
    };

  const handleRemovePhoto =
    async () => {
      if (!profileImage) {
        return;
      }

      try {
        setRemovingPhoto(
          true
        );

        setMessage(null);

        await removeProfilePicture();

        await refreshUser();

        showMessage(
          "success",
          "Profile picture removed."
        );
      } catch (error) {
        showMessage(
          "error",
          getErrorMessage(
            error,
            "Unable to remove your profile picture."
          )
        );
      } finally {
        setRemovingPhoto(
          false
        );
      }
    };

  const photoBusy =
    uploadingPhoto ||
    removingPhoto;

  return (
    <motion.section
      className="profile-page"
      initial={{
        opacity: 0,
        y: 12
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.35
      }}
    >
      <header className="profile-page__heading">
        <div>
          <span className="profile-page__eyebrow">
            <Sparkles
              size={14}
            />

            Your space
          </span>

          <h1>
            My Profile
          </h1>

          <p>
            Keep your UNWIND
            identity personal,
            comfortable, and
            up to date.
          </p>
        </div>

        {!editing && (
          <motion.button
            type="button"
            className="profile-button profile-button--primary"
            onClick={
              handleStartEditing
            }
            whileTap={{
              scale: 0.97
            }}
          >
            <Edit3
              size={17}
            />

            Edit profile
          </motion.button>
        )}
      </header>

      <AnimatePresence
        mode="wait"
      >
        {message && (
          <motion.div
            className={`profile-alert profile-alert--${message.type}`}
            initial={{
              opacity: 0,
              y: -8
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              y: -8
            }}
            role="status"
          >
            {message.type ===
            "success" ? (
              <Check
                size={17}
              />
            ) : (
              <X
                size={17}
              />
            )}

            <span>
              {message.text}
            </span>

            <button
              type="button"
              onClick={() =>
                setMessage(
                  null
                )
              }
              aria-label="Dismiss message"
            >
              <X
                size={15}
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="profile-layout">
        <aside className="profile-sidebar-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {profileImage ? (
                <img
                  src={
                    profileImage
                  }
                  alt={`${displayName} profile`}
                />
              ) : (
                <span>
                  {getInitials(
                    user
                  )}
                </span>
              )}
            </div>

            <button
              type="button"
              className="profile-avatar__camera"
              onClick={() =>
                fileInputRef
                  .current
                  ?.click()
              }
              disabled={
                photoBusy
              }
              aria-label="Change profile picture"
            >
              {uploadingPhoto ? (
                <LoaderCircle
                  size={17}
                  className="profile-spin"
                />
              ) : (
                <Camera
                  size={17}
                />
              )}
            </button>
          </div>

          <input
            ref={
              fileInputRef
            }
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={
              handlePhotoSelection
            }
            hidden
          />

          <h2>
            {displayName}
          </h2>

          <p className="profile-handle">
            @
            {user?.username ||
              "user"}
          </p>

          <div className="profile-status-pill">
            <ShieldCheck
              size={15}
            />

            {user?.email_verified
              ? "Verified account"
              : "UNWIND account"}
          </div>

          <div className="profile-photo-actions">
            <button
              type="button"
              className="profile-photo-action"
              onClick={() =>
                fileInputRef
                  .current
                  ?.click()
              }
              disabled={
                photoBusy
              }
            >
              <ImagePlus
                size={16}
              />

              {profileImage
                ? "Change photo"
                : "Add photo"}
            </button>

            {profileImage && (
              <button
                type="button"
                className="profile-photo-action profile-photo-action--danger"
                onClick={
                  handleRemovePhoto
                }
                disabled={
                  photoBusy
                }
              >
                {removingPhoto ? (
                  <LoaderCircle
                    size={16}
                    className="profile-spin"
                  />
                ) : (
                  <Trash2
                    size={16}
                  />
                )}

                Remove
              </button>
            )}
          </div>

          <div className="profile-completion">
            <div className="profile-completion__top">
              <span>
                Profile
                completion
              </span>

              <strong>
                {
                  profileCompletion
                }
                %
              </strong>
            </div>

            <div
              className="profile-completion__track"
              aria-label={`Profile ${profileCompletion}% complete`}
            >
              <motion.span
                initial={{
                  width: 0
                }}
                animate={{
                  width: `${profileCompletion}%`
                }}
                transition={{
                  duration: 0.6,
                  ease:
                    "easeOut"
                }}
              />
            </div>

            <small>
              Complete your
              profile so UNWIND
              can feel more like
              your own space.
            </small>
          </div>
        </aside>

        <div className="profile-main-column">
          <section className="profile-card">
            <div className="profile-card__header">
              <div className="profile-card__title">
                <span>
                  <CircleUserRound
                    size={19}
                  />
                </span>

                <div>
                  <h2>
                    Personal
                    information
                  </h2>

                  <p>
                    The details
                    attached to
                    your UNWIND
                    profile.
                  </p>
                </div>
              </div>

              {editing && (
                <span className="profile-editing-badge">
                  <Edit3
                    size={13}
                  />

                  Editing
                </span>
              )}
            </div>

            {editing ? (
              <form
                className="profile-form"
                onSubmit={
                  handleSave
                }
              >
                <div className="profile-form-grid">
                  <label className="profile-field">
                    <span>
                      Full name
                    </span>

                    <label className="profile-field">
  <span>
    Username
  </span>

  <div className="profile-input-wrap">
    <UserRound
      size={17}
    />

    <input
      type="text"
      name="username"
      value={
        form.username
      }
      onChange={
        handleChange
      }
      minLength={3}
      maxLength={30}
      autoComplete="username"
      spellCheck={false}
      placeholder="Choose your username"
      required
    />
  </div>

  <small className="profile-field__hint">
    Letters, numbers and
    underscores only.
  </small>
</label>

                    <div className="profile-input-wrap">
                      <UserRound
                        size={17}
                      />

                      <input
                        type="text"
                        name="fullName"
                        value={
                          form.fullName
                        }
                        onChange={
                          handleChange
                        }
                        minLength={
                          2
                        }
                        maxLength={
                          100
                        }
                        autoComplete="name"
                        required
                      />
                    </div>
                  </label>

                  <label className="profile-field">
                    <span>
                      Display name
                    </span>

                    <div className="profile-input-wrap">
                      <BadgeCheck
                        size={17}
                      />

                      <input
                        type="text"
                        name="displayName"
                        value={
                          form.displayName
                        }
                        onChange={
                          handleChange
                        }
                        maxLength={
                          100
                        }
                        placeholder="How should we call you?"
                      />
                    </div>
                  </label>

                  <label className="profile-field">
                    <span>
                      Date of birth
                    </span>

                    <div className="profile-input-wrap">
                      <CalendarDays
                        size={17}
                      />

                      <input
                        type="date"
                        name="dateOfBirth"
                        value={
                          form.dateOfBirth
                        }
                        onChange={
                          handleChange
                        }
                        max={new Date()
                          .toISOString()
                          .slice(
                            0,
                            10
                          )}
                      />
                    </div>
                  </label>

                  <label className="profile-field">
                    <span>
                      Gender
                    </span>

                    <div className="profile-input-wrap">
                      <CircleUserRound
                        size={17}
                      />

                      <select
                        name="gender"
                        value={
                          form.gender
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="">
                          Prefer not
                          to add
                        </option>

                        {GENDER_OPTIONS.map(
                          (
                            option
                          ) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {
                                option.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </label>

                  <label className="profile-field profile-field--wide">
                    <span>
                      Occupation
                    </span>

                    <div className="profile-input-wrap">
                      <BriefcaseBusiness
                        size={17}
                      />

                      <select
                        name="occupationType"
                        value={
                          form.occupationType
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="">
                          Prefer not
                          to add
                        </option>

                        {OCCUPATION_OPTIONS.map(
                          (
                            option
                          ) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {
                                option.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </label>
                </div>

                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="profile-button profile-button--secondary"
                    onClick={
                      handleCancelEditing
                    }
                    disabled={
                      saving
                    }
                  >
                    <X
                      size={17}
                    />

                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="profile-button profile-button--primary"
                    disabled={
                      saving
                    }
                  >
                    {saving ? (
                      <LoaderCircle
                        size={17}
                        className="profile-spin"
                      />
                    ) : (
                      <Save
                        size={17}
                      />
                    )}

                    {saving
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-detail-grid">
                <div className="profile-detail">
                  <span className="profile-detail__icon">
                    <UserRound
                      size={18}
                    />
                  </span>

                  <div>
                    <small>
                      Full name
                    </small>

                    <strong>
                      {fullName ||
                        "Not added yet"}
                    </strong>
                  </div>
                </div>

                <div className="profile-detail">
                  <span className="profile-detail__icon">
                    <BadgeCheck
                      size={18}
                    />
                  </span>

                  <div>
                    <small>
                      Display
                      name
                    </small>

                    <strong>
                      {readUserField(
                        user,
                        "display_name",
                        "displayName"
                      ) ||
                        "Not added yet"}
                    </strong>
                  </div>
                </div>

                <div className="profile-detail">
                  <span className="profile-detail__icon">
                    <CalendarDays
                      size={18}
                    />
                  </span>

                  <div>
                    <small>
                      Date of
                      birth
                    </small>

                    <strong>
                      {dateOfBirth
                        ? new Date(
                            `${dateOfBirth}T00:00:00`
                          ).toLocaleDateString(
                            undefined,
                            {
                              day: "numeric",
                              month:
                                "long",
                              year:
                                "numeric"
                            }
                          )
                        : "Not added yet"}
                    </strong>
                  </div>
                </div>

                <div className="profile-detail">
                  <span className="profile-detail__icon">
                    <CircleUserRound
                      size={18}
                    />
                  </span>

                  <div>
                    <small>
                      Gender
                    </small>

                    <strong>
                      {getOptionLabel(
                        GENDER_OPTIONS,
                        gender
                      )}
                    </strong>
                  </div>
                </div>

                <div className="profile-detail profile-detail--wide">
                  <span className="profile-detail__icon">
                    <BriefcaseBusiness
                      size={18}
                    />
                  </span>

                  <div>
                    <small>
                      Occupation
                    </small>

                    <strong>
                      {getOptionLabel(
                        OCCUPATION_OPTIONS,
                        occupationType
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="profile-card profile-card--account">
            <div className="profile-card__header">
              <div className="profile-card__title">
                <span>
                  <ShieldCheck
                    size={19}
                  />
                </span>

                <div>
                  <h2>
                    Account
                    identity
                  </h2>

                  <p>
                    Login
                    information is
                    managed securely
                    by your UNWIND
                    account.
                  </p>
                </div>
              </div>
            </div>

            <div className="profile-account-grid">
              <div className="profile-account-item">
                <span>
                  <Mail
                    size={18}
                  />
                </span>

                <div>
                  <small>
                    Email address
                  </small>

                  <strong>
                    {user?.email ||
                      "—"}
                  </strong>
                </div>

                {user?.email_verified && (
                  <em>
                    <BadgeCheck
                      size={14}
                    />

                    Verified
                  </em>
                )}
              </div>

              <div className="profile-account-item">
                <span>
                  <UserRound
                    size={18}
                  />
                </span>

                <div>
                  <small>
                    Username
                  </small>

                  <strong>
                    @
                    {user?.username ||
                      "user"}
                  </strong>
                </div>
              </div>
            </div>
          </section>
                    {user?.role === "admin" && (
            <section className="profile-card profile-card--admin">

              <div className="profile-card__header">

                <div className="profile-card__title">

                  <span>
                    <ShieldCheck
                      size={19}
                    />
                  </span>

                  <div>
                    <h2>
                      Administration
                    </h2>

                    <p>
                      Your account has
                      administrator access
                      to UNWIND.
                    </p>
                  </div>

                </div>

              </div>


              <div className="profile-admin-access">

                <div className="profile-admin-access__info">

                  <div className="profile-admin-access__icon">
                    <ShieldCheck
                      size={21}
                    />
                  </div>

                  <div>
                    <strong>
                      UNWIND Admin Panel
                    </strong>

                    <p>
                      Review reports,
                      manage users,
                      moderate testimonials,
                      and inspect audit logs.
                    </p>
                  </div>

                </div>


                <button
                  type="button"
                  className="profile-button profile-button--primary"
                  onClick={() =>
                    navigate(
                      "/admin"
                    )
                  }
                >
                  <ShieldCheck
                    size={17}
                  />

                  Open Admin Panel
                </button>

              </div>

            </section>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default Profile;