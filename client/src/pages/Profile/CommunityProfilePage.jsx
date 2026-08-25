import {
  ArrowLeft,
  CalendarDays,
  Flag,
  LoaderCircle,
  ShieldCheck,
  UserRound
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  useAuth
} from "../../context/AuthContext";

import {
  getCommunityUserProfile
} from "../../services/profileService";

import {
  getApiErrorMessage
} from "../../services/api";

import ReportModal
  from "../../components/reports/ReportModal";

import "./CommunityProfilePage.css";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getCurrentUserId(
  user
) {
  return (
    user?.user_id ??
    user?.userId ??
    user?.id ??
    null
  );
}

function formatJoinedDate(
  value
) {
  if (
    !value
  ) {
    return null;
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toLocaleDateString(
    [],
    {
      month:
        "long",

      year:
        "numeric"
    }
  );
}

function getInitials(
  name
) {
  const normalized =
    String(
      name ||
        "U"
    ).trim();

  return normalized
    .split(
      /\s+/
    )
    .slice(
      0,
      2
    )
    .map(
      (
        part
      ) =>
        part
          .charAt(
            0
          )
          .toUpperCase()
    )
    .join(
      ""
    );
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

function CommunityProfilePage() {
  const {
    userId
  } = useParams();

  const navigate =
    useNavigate();

  const {
    user
  } = useAuth();

  const currentUserId =
    getCurrentUserId(
      user
    );

  const [
    profile,
    setProfile
  ] = useState(
    null
  );

  const [
    loading,
    setLoading
  ] = useState(
    true
  );

  const [
    error,
    setError
  ] = useState(
    ""
  );

  /*
  |--------------------------------------------------------------------------
  | Report state
  |--------------------------------------------------------------------------
  */

  const [
    reportOpen,
    setReportOpen
  ] = useState(
    false
  );

  /*
  |--------------------------------------------------------------------------
  | Own profile?
  |--------------------------------------------------------------------------
  */

  const isOwnProfile =
    useMemo(
      () =>
        Boolean(
          currentUserId &&
            userId &&
            String(
              currentUserId
            ) ===
              String(
                userId
              )
        ),

      [
        currentUserId,
        userId
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Load profile
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      let cancelled =
        false;

      const loadProfile =
        async () => {
          if (
            !userId
          ) {
            setError(
              "User profile could not be found."
            );

            setLoading(
              false
            );

            return;
          }

          try {
            setLoading(
              true
            );

            setError(
              ""
            );

            const result =
              await getCommunityUserProfile(
                userId
              );

            if (
              !cancelled
            ) {
              setProfile(
                result
              );
            }
          } catch (
            requestError
          ) {
            if (
              cancelled
            ) {
              return;
            }

            setProfile(
              null
            );

            setError(
              getApiErrorMessage(
                requestError,

                "Unable to load this community profile."
              )
            );
          } finally {
            if (
              !cancelled
            ) {
              setLoading(
                false
              );
            }
          }
        };

      loadProfile();

      return () => {
        cancelled =
          true;
      };
    },
    [
      userId
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (
    loading
  ) {
    return (
      <div className="community-profile-page">
        <div className="community-profile-loading">
          <LoaderCircle
            size={30}
            className="community-icon-spin"
          />

          <strong>
            Loading profile…
          </strong>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (
    error ||
    !profile
  ) {
    return (
      <div className="community-profile-page">
        <div className="community-profile-error">
          <span>
            <UserRound
              size={27}
            />
          </span>

          <h2>
            Profile unavailable
          </h2>

          <p>
            {error ||
              "This community profile is not available."}
          </p>

          <button
            type="button"

            onClick={() =>
              navigate(
                "/dashboard/community"
              )
            }
          >
            Return to Community
          </button>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Profile values
  |--------------------------------------------------------------------------
  */

  const {
    visibleName =
      "Community member",

    identityMode,

    profileImageUrl,

    bio,

    joinedAt
  } = profile;

  const formattedJoined =
    formatJoinedDate(
      joinedAt
    );

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="community-profile-page">
      {/* ===============================================================
          TOP BAR
      =============================================================== */}

      <header className="community-profile-topbar">
        <button
          type="button"

          className="community-profile-back"

          onClick={() =>
            navigate(
              -1
            )
          }

          aria-label="Go back"
        >
          <ArrowLeft
            size={18}
          />
        </button>

        <div>
          <span>
            Community profile
          </span>

          <strong>
            {visibleName}
          </strong>
        </div>
      </header>

      {/* ===============================================================
          PROFILE
      =============================================================== */}

      <main className="community-profile-content">
        <section className="community-profile-hero">
          <div className="community-profile-hero__background" />

          <div className="community-profile-main">
            {/* =========================================================
                AVATAR
            ========================================================= */}

            <div className="community-profile-avatar">
              {profileImageUrl ? (
                <img
                  src={
                    profileImageUrl
                  }

                  alt={`${visibleName} profile`}
                />
              ) : (
                <span>
                  {getInitials(
                    visibleName
                  )}
                </span>
              )}
            </div>

            {/* =========================================================
                IDENTITY
            ========================================================= */}

            <div className="community-profile-identity">
              <div className="community-profile-name-row">
                <h1>
                  {visibleName}
                </h1>

                <span
                  className="community-profile-verified"

                  title="UNWIND community member"
                >
                  <ShieldCheck
                    size={16}
                  />
                </span>
              </div>

              <p className="community-profile-type">
                {identityMode ===
                "anonymous"
                  ? "Anonymous community identity"
                  : "Community member"}
              </p>

              {bio ? (
                <p className="community-profile-bio">
                  {bio}
                </p>
              ) : (
                <p className="community-profile-bio community-profile-bio--empty">
                  No bio added yet.
                </p>
              )}

              <div className="community-profile-meta">
                {formattedJoined && (
                  <span>
                    <CalendarDays
                      size={14}
                    />

                    Joined{" "}
                    {formattedJoined}
                  </span>
                )}
              </div>
            </div>

            {/* =========================================================
                ACTIONS
            ========================================================= */}

            <div className="community-profile-actions">
              {isOwnProfile ? (
                /*
                |----------------------------------------------------------
                | Current user's own profile
                |----------------------------------------------------------
                */

                <button
                  type="button"

                  className="community-profile-own-button"

                  onClick={() =>
                    navigate(
                      "/dashboard/settings"
                    )
                  }
                >
                  This is your profile
                </button>
              ) : (
                /*
                |----------------------------------------------------------
                | Another community member
                |----------------------------------------------------------
                */

                <>
                  <span className="community-profile-dm-note">
                    Private messages can
                    be started from
                    Community Chat.
                  </span>

                  <button
                    type="button"

                    className="community-profile-report-button"

                    onClick={() =>
                      setReportOpen(
                        true
                      )
                    }
                  >
                    <Flag
                      size={15}
                    />

                    Report member
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ===============================================================
            INFORMATION
        =============================================================== */}

        <section className="community-profile-info-grid">
          {/* =============================================================
              COMMUNITY IDENTITY
          ============================================================= */}

          <article className="community-profile-info-card">
            <span className="community-profile-info-card__icon">
              <UserRound
                size={20}
              />
            </span>

            <div>
              <span>
                Community identity
              </span>

              <h3>
                {identityMode ===
                "anonymous"
                  ? "Anonymous"
                  : "Username"}
              </h3>

              <p>
                This is the identity this
                person has chosen to use
                across UNWIND Community.
              </p>
            </div>
          </article>

          {/* =============================================================
              PRIVACY
          ============================================================= */}

          <article className="community-profile-info-card">
            <span className="community-profile-info-card__icon">
              <ShieldCheck
                size={20}
              />
            </span>

            <div>
              <span>
                Privacy
              </span>

              <h3>
                Community profile
              </h3>

              <p>
                Only information intended
                for Community is shown
                here. Personal wellness
                information remains
                private.
              </p>
            </div>
          </article>
        </section>
      </main>

      {/* ===============================================================
          REPORT COMMUNITY MEMBER

          targetType = user
          targetId = actual user UUID
          reportedUserId = same user UUID

          This means the report will be recorded against the community
          member and appear inside Safety & Reports.
      =============================================================== */}

      {!isOwnProfile && (
        <ReportModal
          open={
            reportOpen
          }

          targetType="user"

          targetId={
            userId
          }

          reportedUserId={
            userId
          }

          targetLabel="community member"

          targetName={
            visibleName
          }

          onClose={() =>
            setReportOpen(
              false
            )
          }

          onReported={() => {}}
        />
      )}
    </div>
  );
}

export default CommunityProfilePage;