import {
  useMemo,
  useState
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LogOut,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound
} from "lucide-react";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  changePassword,
  resendVerification
} from "../../services/authService";

import {
  requestAccountDeletionOtp,
  verifyAccountDeletionOtp,
  deleteAccount
} from "../../services/accountService";

import {
  useAuth
} from "../../context/AuthContext";

import "./Setting.css";


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

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


function formatAccountDate(
  value
) {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  ).format(date);
}


/*
|--------------------------------------------------------------------------
| Password Field
|--------------------------------------------------------------------------
*/

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder
}) {
  const [
    visible,
    setVisible
  ] = useState(false);

  return (
    <label
      className="account-settings__field"
      htmlFor={id}
    >
      <span>
        {label}
      </span>

      <div
        className="account-settings__password-control"
      >
        <input
          id={id}
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={onChange}
          autoComplete={
            autoComplete
          }
          placeholder={
            placeholder
          }
        />

        <button
          type="button"
          onClick={() =>
            setVisible(
              (current) =>
                !current
            )
          }
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
        >
          {visible ? (
            <EyeOff
              size={18}
            />
          ) : (
            <Eye
              size={18}
            />
          )}
        </button>
      </div>
    </label>
  );
}


/*
|--------------------------------------------------------------------------
| Account Settings
|--------------------------------------------------------------------------
*/

function Setting() {
  const {
    user,
    logoutEverywhere,
    setUser
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

    /*
|--------------------------------------------------------------------------
| Intro preference
|--------------------------------------------------------------------------
*/

const [
  skipIntro,
  setSkipIntro
] = useState(() => {
  return (
    localStorage.getItem(
      "unwind_skip_intro"
    ) === "true"
  );
});

const handleIntroPreferenceChange =
  (shouldSkip) => {
    setSkipIntro(
      shouldSkip
    );

    localStorage.setItem(
      "unwind_skip_intro",
      String(shouldSkip)
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Password state
  |--------------------------------------------------------------------------
  */

  const [
    passwordForm,
    setPasswordForm
  ] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [
    changingPassword,
    setChangingPassword
  ] = useState(false);

  const [
    passwordMessage,
    setPasswordMessage
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | Sessions
  |--------------------------------------------------------------------------
  */

  const [
    loggingOutAll,
    setLoggingOutAll
  ] = useState(false);

  const [
    sessionMessage,
    setSessionMessage
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | Email verification
  |--------------------------------------------------------------------------
  */

  const [
    resendingVerification,
    setResendingVerification
  ] = useState(false);

  const [
    verificationMessage,
    setVerificationMessage
  ] = useState(null);


  /*
|--------------------------------------------------------------------------
| Delete account
|--------------------------------------------------------------------------
*/

const [
  deleteDialogOpen,
  setDeleteDialogOpen
] = useState(false);

const [
  deleteOtp,
  setDeleteOtp
] = useState("");

const [
  deleteOtpSent,
  setDeleteOtpSent
] = useState(false);

const [
  deleteOtpVerified,
  setDeleteOtpVerified
] = useState(false);

const [
  deletionToken,
  setDeletionToken
] = useState("");

const [
  sendingDeleteOtp,
  setSendingDeleteOtp
] = useState(false);

const [
  verifyingDeleteOtp,
  setVerifyingDeleteOtp
] = useState(false);

const [
  deleteConfirmation,
  setDeleteConfirmation
] = useState("");

const [
  deletingAccount,
  setDeletingAccount
] = useState(false);

const [
  deleteError,
  setDeleteError
] = useState("");

const [
  deleteMessage,
  setDeleteMessage
] = useState("");
  /*
  |--------------------------------------------------------------------------
  | Derived values
  |--------------------------------------------------------------------------
  */

  const securityFocused =
    location.pathname.endsWith(
      "/security"
    );

  const accountStatus =
    useMemo(
      () =>
        user?.account_status ||
        "active",
      [
        user?.account_status
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Live password requirements
  |--------------------------------------------------------------------------
  */

  const passwordRequirements =
    useMemo(
      () => [
        {
          label:
            "At least 8 characters",

          valid:
            passwordForm
              .newPassword
              .length >= 8
        },

        {
          label:
            "One uppercase letter",

          valid:
            /[A-Z]/.test(
              passwordForm
                .newPassword
            )
        },

        {
          label:
            "One lowercase letter",

          valid:
            /[a-z]/.test(
              passwordForm
                .newPassword
            )
        },

        {
          label:
            "One number",

          valid:
            /\d/.test(
              passwordForm
                .newPassword
            )
        },

        {
          label:
            "One special character",

          valid:
            /[@$!%*?&#^()_\-+=]/.test(
              passwordForm
                .newPassword
            )
        }
      ],
      [
        passwordForm
          .newPassword
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Password input
  |--------------------------------------------------------------------------
  */

  const handlePasswordInput =
    (field) =>
    (event) => {
      setPasswordForm(
        (current) => ({
          ...current,

          [field]:
            event.target
              .value
        })
      );

      setPasswordMessage(
        null
      );
    };


  /*
  |--------------------------------------------------------------------------
  | Change password
  |--------------------------------------------------------------------------
  */

  const handleChangePassword =
    async (event) => {
      event.preventDefault();

      setPasswordMessage(
        null
      );

      if (
        passwordForm
          .newPassword !==
        passwordForm
          .confirmPassword
      ) {
        setPasswordMessage({
          type: "error",

          text:
            "New passwords do not match."
        });

        return;
      }

      try {
        setChangingPassword(
          true
        );

        const response =
          await changePassword(
            passwordForm
          );

        setPasswordMessage({
          type: "success",

          text:
            response?.message ||
            "Password changed successfully."
        });

        /*
         * Backend revokes all sessions
         * after password change.
         */

        setUser(null);

        navigate(
          "/login",
          {
            replace: true,

            state: {
              message:
                "Password changed successfully. Please sign in again."
            }
          }
        );
      } catch (error) {
        setPasswordMessage({
          type: "error",

          text:
            getErrorMessage(
              error,
              "Unable to change your password."
            )
        });
      } finally {
        setChangingPassword(
          false
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | Logout all sessions
  |--------------------------------------------------------------------------
  */

  const handleLogoutEverywhere =
    async () => {
      setSessionMessage(
        null
      );

      try {
        setLoggingOutAll(
          true
        );

        await logoutEverywhere();

        navigate(
          "/login",
          {
            replace: true,

            state: {
              message:
                "You have been signed out from all devices."
            }
          }
        );
      } catch (error) {
        setSessionMessage({
          type: "error",

          text:
            getErrorMessage(
              error,
              "Unable to sign out from all devices."
            )
        });
      } finally {
        setLoggingOutAll(
          false
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | Resend verification
  |--------------------------------------------------------------------------
  */

  const handleResendVerification =
    async () => {
      if (
        !user?.email
      ) {
        return;
      }

      setVerificationMessage(
        null
      );

      try {
        setResendingVerification(
          true
        );

        const response =
          await resendVerification(
            user.email
          );

        setVerificationMessage({
          type: "success",

          text:
            response?.message ||
            "Verification email sent."
        });
      } catch (error) {
        setVerificationMessage({
          type: "error",

          text:
            getErrorMessage(
              error,
              "Unable to resend verification email."
            )
        });
      } finally {
        setResendingVerification(
          false
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | Delete modal
  |--------------------------------------------------------------------------
  */

  const closeDeleteDialog =
  () => {
    if (
      deletingAccount ||
      sendingDeleteOtp ||
      verifyingDeleteOtp
    ) {
      return;
    }

    setDeleteDialogOpen(false);

    setDeleteOtp("");
    setDeleteOtpSent(false);
    setDeleteOtpVerified(false);
    setDeletionToken("");

    setDeleteConfirmation("");

    setDeleteError("");
    setDeleteMessage("");
  };


  /*
  |--------------------------------------------------------------------------
  | Delete account
  |--------------------------------------------------------------------------
  */
/*
|--------------------------------------------------------------------------
| Request Delete OTP
|--------------------------------------------------------------------------
*/

const handleRequestDeleteOtp =
  async () => {
    try {
      setSendingDeleteOtp(true);

      setDeleteError("");
      setDeleteMessage("");

      const response =
        await requestAccountDeletionOtp();

      setDeleteOtpSent(true);
      setDeleteOtpVerified(false);
      setDeletionToken("");
      setDeleteOtp("");

      setDeleteMessage(
        response?.message ||
        "Verification code sent to your registered email."
      );
    } catch (error) {
      setDeleteError(
        getErrorMessage(
          error,
          "Unable to send verification code."
        )
      );
    } finally {
      setSendingDeleteOtp(false);
    }
  };


/*
|--------------------------------------------------------------------------
| Verify Delete OTP
|--------------------------------------------------------------------------
*/

const handleVerifyDeleteOtp =
  async () => {
    setDeleteError("");
    setDeleteMessage("");

    if (
      !/^\d{6}$/.test(
        deleteOtp.trim()
      )
    ) {
      setDeleteError(
        "Enter the 6-digit verification code."
      );

      return;
    }

    try {
      setVerifyingDeleteOtp(true);

      const response =
        await verifyAccountDeletionOtp(
          deleteOtp.trim()
        );

      setDeletionToken(
        response.deletionToken
      );

      setDeleteOtpVerified(true);

      setDeleteMessage(
        "Email verified successfully."
      );
    } catch (error) {
      setDeleteOtpVerified(false);
      setDeletionToken("");

      setDeleteError(
        getErrorMessage(
          error,
          "Unable to verify the code."
        )
      );
    } finally {
      setVerifyingDeleteOtp(false);
    }
  };
 const handleDeleteAccount =
  async (event) => {
    event.preventDefault();

    setDeleteError("");

    if (
      !deleteOtpVerified ||
      !deletionToken
    ) {
      setDeleteError(
        "Verify your email before deleting your account."
      );

      return;
    }

    if (
      deleteConfirmation.trim() !==
      "DELETE"
    ) {
      setDeleteError(
        'Type "DELETE" to confirm account deletion.'
      );

      return;
    }

    try {
      setDeletingAccount(true);

      await deleteAccount({
        confirmation: "DELETE",
        deletionToken
      });

      setUser(null);

      navigate(
        "/",
        {
          replace: true
        }
      );
    } catch (error) {
      setDeleteError(
        getErrorMessage(
          error,
          "Unable to delete your account."
        )
      );
    } finally {
      setDeletingAccount(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section
      className="account-settings"
    >
      {/*
      |--------------------------------------------------------------------------
      | Header
      |--------------------------------------------------------------------------
      */}

      <header
        className="account-settings__hero"
      >
        <div>
          <span
            className="account-settings__eyebrow"
          >
            <ShieldCheck
              size={16}
            />

            Your UNWIND account
          </span>

          <h1>
            Account settings
          </h1>

          <p>
            Manage your sign-in
            security, sessions and
            account-level controls.
          </p>
        </div>

        <div
          className="account-settings__hero-badge"
        >
          <span
            className={
              user
                ?.email_verified
                ? "is-verified"
                : "is-pending"
            }
          >
            {user
              ?.email_verified
              ? "Verified"
              : "Verification pending"}
          </span>

          <strong>
            @
            {user?.username ||
              "user"}
          </strong>
        </div>
      </header>


      {/*
      |--------------------------------------------------------------------------
      | Quick navigation
      |--------------------------------------------------------------------------
      */}

      <nav
        className="account-settings__quick-nav"
        aria-label="Account settings sections"
      >
        <a
          href="#account-overview"
        >
          <UserRound
            size={17}
          />

          Account
        </a>

        <a
  href="#experience"
>
  <Sparkles
    size={17}
  />

  Experience
</a>

        <a
          href="#security"
          className={
            securityFocused
              ? "is-active"
              : ""
          }
        >
          <KeyRound
            size={17}
          />

          Security
        </a>

        <a href="#sessions">
          <MonitorSmartphone
            size={17}
          />

          Sessions
        </a>

        <a
          href="#danger-zone"
        >
          <Trash2
            size={17}
          />

          Danger
        </a>
      </nav>


      <div
        className="account-settings__grid"
      >
        <div
          className="account-settings__main"
        >
          {/*
          |--------------------------------------------------------------------------
          | Account overview
          |--------------------------------------------------------------------------
          */}

          <article
            id="account-overview"
            className="account-settings__card"
          >
            <div
              className="account-settings__section-heading"
            >
              <span
                className="account-settings__icon-box"
              >
                <UserRound
                  size={20}
                />
              </span>

              <div>
                <h2>
                  Account overview
                </h2>

                <p>
                  Your core
                  sign-in and
                  account
                  information.
                </p>
              </div>
            </div>

            <div
              className="account-settings__details"
            >
              <div>
                <span>
                  Username
                </span>

                <strong>
                  @
                  {user
                    ?.username ||
                    "Not set"}
                </strong>
              </div>

              <div>
                <span>
                  Email address
                </span>

                <strong>
                  {user?.email ||
                    "Not available"}
                </strong>
              </div>

              <div>
                <span>
                  Account status
                </span>

                <strong
                  className="account-settings__status-text"
                >
                  {accountStatus}
                </strong>
              </div>

              <div>
                <span>
                  Member since
                </span>

                <strong>
                  {formatAccountDate(
                    user
                      ?.created_at
                  )}
                </strong>
              </div>
            </div>

            <div
              className="account-settings__profile-link-row"
            >
              <p>
                Want to change
                your username,
                display name,
                profile photo or
                personal details?
              </p>

              <button
                type="button"
                className="account-settings__button account-settings__button--soft"
                onClick={() =>
                  navigate(
                    "/dashboard/profile"
                  )
                }
              >
                Edit profile
              </button>
            </div>
          </article>

          {/*
|--------------------------------------------------------------------------
| Entrance Experience
|--------------------------------------------------------------------------
*/}

<article
  id="experience"
  className="account-settings__card"
>
  <div
    className="account-settings__section-heading"
  >
    <span
      className="account-settings__icon-box"
    >
      <Sparkles
        size={20}
      />
    </span>

    <div>
      <h2>
        Your entrance
      </h2>

      <p>
        Choose how Unwind
        welcomes you.
      </p>
    </div>
  </div>

  <div
    className="account-settings__entrance-options"
  >
    <button
      type="button"
      className={[
        "account-settings__entrance-option",

        !skipIntro
          ? "is-selected"
          : ""
      ].join(" ")}
      onClick={() =>
        handleIntroPreferenceChange(
          false
        )
      }
      aria-pressed={
        !skipIntro
      }
    >
      <span
        className="account-settings__entrance-art account-settings__entrance-art--scenic"
        aria-hidden="true"
      >
        <span>
          〰
        </span>

        <span>
          〰
        </span>

        <span>
          〰
        </span>

        <span
          className="account-settings__entrance-line"
        />

        <span
          className="account-settings__entrance-dot"
        />
      </span>

      <span
        className="account-settings__entrance-copy"
      >
        <strong>
          Take the scenic way
        </strong>

        <span>
          Play the Unwind intro
          once each session.
        </span>
      </span>

      <span
        className="account-settings__entrance-check"
      >
        {/*
          Selection indicator
        */}
      </span>
    </button>

    <button
      type="button"
      className={[
        "account-settings__entrance-option",

        skipIntro
          ? "is-selected"
          : ""
      ].join(" ")}
      onClick={() =>
        handleIntroPreferenceChange(
          true
        )
      }
      aria-pressed={
        skipIntro
      }
    >
      <span
        className="account-settings__entrance-art account-settings__entrance-art--direct"
        aria-hidden="true"
      >
        <span
          className="account-settings__entrance-straight-line"
        />

        <span
          className="account-settings__entrance-arrow"
        >
          →
        </span>

        <span
          className="account-settings__entrance-dot"
        />
      </span>

      <span
        className="account-settings__entrance-copy"
      >
        <strong>
          Straight in
        </strong>

        <span>
          Skip the intro and
          enter Unwind immediately.
        </span>
      </span>

      <span
        className="account-settings__entrance-check"
      />
    </button>
  </div>

  <p
    className="account-settings__entrance-note"
  >
    {skipIntro
      ? "Straight in is active. Your next visit will skip the intro."
      : "The intro will play once when a new browser session begins."}
  </p>
</article>


          {/*
          |--------------------------------------------------------------------------
          | Email verification
          |--------------------------------------------------------------------------
          */}

          <article
            className="account-settings__card"
          >
            <div
              className="account-settings__section-heading"
            >
              <span
                className="account-settings__icon-box"
              >
                <Mail
                  size={20}
                />
              </span>

              <div>
                <h2>
                  Email
                  verification
                </h2>

                <p>
                  Verified email
                  helps protect
                  account
                  recovery.
                </p>
              </div>
            </div>

            <div
              className="account-settings__verification-row"
            >
              <div>
                <span
                  className={
                    user
                      ?.email_verified
                      ? "account-settings__verification-icon is-verified"
                      : "account-settings__verification-icon is-pending"
                  }
                >
                  {user
                    ?.email_verified ? (
                    <CheckCircle2
                      size={20}
                    />
                  ) : (
                    <AlertTriangle
                      size={20}
                    />
                  )}
                </span>

                <div>
                  <strong>
                    {user
                      ?.email_verified
                      ? "Email verified"
                      : "Email not verified"}
                  </strong>

                  <p>
                    {user?.email}
                  </p>
                </div>
              </div>

              {!user
                ?.email_verified && (
                <button
                  type="button"
                  className="account-settings__button account-settings__button--soft"
                  onClick={
                    handleResendVerification
                  }
                  disabled={
                    resendingVerification
                  }
                >
                  {resendingVerification && (
                    <LoaderCircle
                      size={17}
                      className="account-settings__spinner"
                    />
                  )}

                  Resend verification
                </button>
              )}
            </div>

            {verificationMessage && (
              <div
                className={`account-settings__message account-settings__message--${verificationMessage.type}`}
              >
                {
                  verificationMessage
                    .text
                }
              </div>
            )}
          </article>


          {/*
          |--------------------------------------------------------------------------
          | Change password
          |--------------------------------------------------------------------------
          */}

          <article
            id="security"
            className={[
              "account-settings__card",

              securityFocused
                ? "account-settings__card--focused"
                : ""
            ].join(" ")}
          >
            <div
              className="account-settings__section-heading"
            >
              <span
                className="account-settings__icon-box"
              >
                <KeyRound
                  size={20}
                />
              </span>

              <div>
                <h2>
                  Change password
                </h2>

                <p>
                  Changing your
                  password signs
                  you out from
                  every device.
                </p>
              </div>
            </div>

            <form
              className="account-settings__password-form"
              onSubmit={
                handleChangePassword
              }
            >
              <PasswordField
                id="settings-current-password"
                label="Current password"
                value={
                  passwordForm
                    .currentPassword
                }
                onChange={
                  handlePasswordInput(
                    "currentPassword"
                  )
                }
                autoComplete="current-password"
                placeholder="Enter current password"
              />

              <div
                className="account-settings__field-row"
              >
                <PasswordField
                  id="settings-new-password"
                  label="New password"
                  value={
                    passwordForm
                      .newPassword
                  }
                  onChange={
                    handlePasswordInput(
                      "newPassword"
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Create new password"
                />

                <PasswordField
                  id="settings-confirm-password"
                  label="Confirm new password"
                  value={
                    passwordForm
                      .confirmPassword
                  }
                  onChange={
                    handlePasswordInput(
                      "confirmPassword"
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                />
              </div>

              {passwordForm
                .newPassword && (
                <div
                  className="account-settings__requirements"
                >
                  {passwordRequirements.map(
                    (
                      requirement
                    ) => (
                      <span
                        key={
                          requirement
                            .label
                        }
                        className={
                          requirement
                            .valid
                            ? "is-valid"
                            : ""
                        }
                      >
                        <CheckCircle2
                          size={14}
                        />

                        {
                          requirement
                            .label
                        }
                      </span>
                    )
                  )}
                </div>
              )}

              {passwordMessage && (
                <div
                  className={`account-settings__message account-settings__message--${passwordMessage.type}`}
                >
                  {
                    passwordMessage
                      .text
                  }
                </div>
              )}

              <div
                className="account-settings__form-actions"
              >
                <button
                  type="submit"
                  className="account-settings__button account-settings__button--primary"
                  disabled={
                    changingPassword ||
                    !passwordForm
                      .currentPassword ||
                    !passwordForm
                      .newPassword ||
                    !passwordForm
                      .confirmPassword
                  }
                >
                  {changingPassword ? (
                    <LoaderCircle
                      size={17}
                      className="account-settings__spinner"
                    />
                  ) : (
                    <KeyRound
                      size={17}
                    />
                  )}

                  {changingPassword
                    ? "Changing password…"
                    : "Change password"}
                </button>
              </div>
            </form>
          </article>


          {/*
          |--------------------------------------------------------------------------
          | Sessions
          |--------------------------------------------------------------------------
          */}

          <article
            id="sessions"
            className="account-settings__card"
          >
            <div
              className="account-settings__section-heading"
            >
              <span
                className="account-settings__icon-box"
              >
                <MonitorSmartphone
                  size={20}
                />
              </span>

              <div>
                <h2>
                  Sessions
                </h2>

                <p>
                  End every active
                  UNWIND login
                  associated with
                  your account.
                </p>
              </div>
            </div>

            <div
              className="account-settings__session-panel"
            >
              <div>
                <MonitorSmartphone
                  size={24}
                />

                <div>
                  <strong>
                    Sign out
                    everywhere
                  </strong>

                  <p>
                    You will need
                    to sign in
                    again on this
                    device too.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="account-settings__button account-settings__button--outline"
                onClick={
                  handleLogoutEverywhere
                }
                disabled={
                  loggingOutAll
                }
              >
                {loggingOutAll ? (
                  <LoaderCircle
                    size={17}
                    className="account-settings__spinner"
                  />
                ) : (
                  <LogOut
                    size={17}
                  />
                )}

                {loggingOutAll
                  ? "Signing out…"
                  : "Sign out all devices"}
              </button>
            </div>

            {sessionMessage && (
              <div
                className={`account-settings__message account-settings__message--${sessionMessage.type}`}
              >
                {
                  sessionMessage
                    .text
                }
              </div>
            )}
          </article>


          {/*
          |--------------------------------------------------------------------------
          | Danger zone
          |--------------------------------------------------------------------------
          */}

          <article
            id="danger-zone"
            className="account-settings__card account-settings__card--danger"
          >
            <div
              className="account-settings__section-heading"
            >
              <span
                className="account-settings__icon-box account-settings__icon-box--danger"
              >
                <Trash2
                  size={20}
                />
              </span>

              <div>
                <h2>
                  Danger
                </h2>

                <p>
                  Destructive
                  account actions
                  cannot be undone.
                </p>
              </div>
            </div>

            <div
              className="account-settings__danger-row"
            >
              <div>
                <strong>
                  Delete UNWIND
                  account
                </strong>

                <p>
                  Permanently
                  remove your
                  account and its
                  associated data.
                </p>
              </div>

              <button
                type="button"
                className="account-settings__button account-settings__button--danger"
                onClick={() =>
                  setDeleteDialogOpen(
                    true
                  )
                }
              >
                <Trash2
                  size={17}
                />

                Delete account
              </button>
            </div>
          </article>
        </div>


        {/*
        |--------------------------------------------------------------------------
        | Side cards
        |--------------------------------------------------------------------------
        */}

        <aside
          className="account-settings__aside"
        >
          <div
            className="account-settings__aside-card"
          >
            <ShieldCheck
              size={23}
            />

            <h3>
              Security summary
            </h3>

            <div>
              <span>
                Email
              </span>

              <strong>
                {user
                  ?.email_verified
                  ? "Verified"
                  : "Pending"}
              </strong>
            </div>

            <div>
              <span>
                Password
              </span>

              <strong>
                Protected
              </strong>
            </div>
          </div>


          <div
            className="account-settings__aside-card account-settings__aside-card--muted"
          >
            <CalendarDays
              size={22}
            />

            <h3>
              Account activity
            </h3>

            <p>
              Last sign in
            </p>

            <strong>
              {formatAccountDate(
                user
                  ?.last_login_at
              )}
            </strong>
          </div>
        </aside>
      </div>


      {/*
      |--------------------------------------------------------------------------
      | Delete account modal
      |--------------------------------------------------------------------------
      */}

     {deleteDialogOpen && (
  <div
    className="account-settings__modal-backdrop"
    role="presentation"
    onMouseDown={(event) => {
      if (
        event.target ===
        event.currentTarget
      ) {
        closeDeleteDialog();
      }
    }}
  >
    <div
      className="account-settings__modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <span
        className="account-settings__modal-icon"
      >
        <AlertTriangle
          size={28}
        />
      </span>

      <h2
        id="delete-account-title"
      >
        Delete your
        account?
      </h2>

      <p>
        This action is
        permanent. Verify
        your identity using
        the code sent to your
        registered email, then
        type
        <strong>
          {" DELETE "}
        </strong>
        below to confirm.
      </p>

      <form
        onSubmit={
          handleDeleteAccount
        }
      >
        <div
          className="account-settings__delete-verification"
        >
          {!deleteOtpSent && (
            <button
              type="button"
              className="account-settings__button account-settings__button--outline"
              onClick={
                handleRequestDeleteOtp
              }
              disabled={
                sendingDeleteOtp
              }
            >
              {sendingDeleteOtp ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="account-settings__spinner"
                  />

                  Sending code...
                </>
              ) : (
                <>
                  <Mail
                    size={17}
                  />

                  Send verification code
                </>
              )}
            </button>
          )}

          {deleteOtpSent &&
            !deleteOtpVerified && (
              <>
                <label
                  className="account-settings__field"
                  htmlFor="delete-account-otp"
                >
                  <span>
                    Verification code
                  </span>

                  <input
                    id="delete-account-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={
                      deleteOtp
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            6
                          );

                      setDeleteOtp(
                        value
                      );

                      setDeleteError(
                        ""
                      );
                    }}
                    placeholder="6-digit code"
                    autoComplete="one-time-code"
                  />
                </label>

                <div
                  className="account-settings__delete-otp-actions"
                >
                  <button
                    type="button"
                    className="account-settings__button account-settings__button--outline"
                    onClick={
                      handleVerifyDeleteOtp
                    }
                    disabled={
                      verifyingDeleteOtp ||
                      deleteOtp.length !== 6
                    }
                  >
                    {verifyingDeleteOtp ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="account-settings__spinner"
                        />

                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck
                          size={17}
                        />

                        Verify code
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="account-settings__button account-settings__button--outline"
                    onClick={
                      handleRequestDeleteOtp
                    }
                    disabled={
                      sendingDeleteOtp
                    }
                  >
                    {sendingDeleteOtp
                      ? "Sending..."
                      : "Resend code"}
                  </button>
                </div>
              </>
            )}

          {deleteOtpVerified && (
            <div
              className="account-settings__message account-settings__message--success"
            >
              <CheckCircle2
                size={17}
              />

              Email verified
            </div>
          )}
        </div>

        <label
          className="account-settings__field"
          htmlFor="delete-account-confirmation"
        >
          <span>
            Type DELETE
            to confirm
          </span>

          <input
            id="delete-account-confirmation"
            type="text"
            value={
              deleteConfirmation
            }
            onChange={(
              event
            ) => {
              setDeleteConfirmation(
                event.target.value
              );

              setDeleteError(
                ""
              );
            }}
            placeholder="DELETE"
            autoComplete="off"
            disabled={
              !deleteOtpVerified
            }
          />
        </label>

        {deleteMessage &&
          !deleteError && (
            <div
              className="account-settings__message account-settings__message--success"
            >
              {deleteMessage}
            </div>
          )}

        {deleteError && (
          <div
            className="account-settings__message account-settings__message--error"
          >
            {deleteError}
          </div>
        )}

        <div
          className="account-settings__modal-actions"
        >
          <button
            type="button"
            className="account-settings__button account-settings__button--outline"
            onClick={
              closeDeleteDialog
            }
            disabled={
              deletingAccount ||
              sendingDeleteOtp ||
              verifyingDeleteOtp
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            className="account-settings__button account-settings__button--danger"
            disabled={
              deletingAccount ||
              !deleteOtpVerified ||
              !deletionToken ||
              deleteConfirmation
                .trim() !==
                "DELETE"
            }
          >
            {deletingAccount ? (
              <LoaderCircle
                size={17}
                className="account-settings__spinner"
              />
            ) : (
              <Trash2
                size={17}
              />
            )}

            {deletingAccount
              ? "Deleting…"
              : "Delete permanently"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </section>
  );
}

export default Setting;