import { useState } from "react";
import { motion } from "framer-motion";

import {
  EyeOff,
  Image,
  MessageCircleHeart,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Video
} from "lucide-react";

import { selectCommunityIdentity } from "../../services/communityService";
import { getApiErrorMessage } from "../../services/api";

const feedFilters = [
  {
    value: "all",
    label: "All posts",
    icon: Sparkles
  },
  {
    value: "text",
    label: "Thoughts",
    icon: MessageCircleHeart
  },
  {
    value: "image",
    label: "Images",
    icon: Image
  },
  {
    value: "video",
    label: "Videos",
    icon: Video
  },
  {
    value: "mixed",
    label: "Mixed",
    icon: Image
  }
];

function CommunityHeader({
  communityProfile,
  activeFilter,
  onFilterChange,
  onCreatePost,
  onRefresh,
  refreshing,
  onIdentityChanged
}) {
  const [switchingIdentity, setSwitchingIdentity] =
    useState(false);

  const [identityError, setIdentityError] =
    useState("");

  const [
  anonymousSetupOpen,
  setAnonymousSetupOpen
] = useState(false);

const [
  anonymousAlias,
  setAnonymousAlias
] = useState("");

  const visibleName =
    communityProfile?.visibleName ||
    communityProfile?.visible_name ||
    communityProfile?.profile?.anonymous_alias ||
    communityProfile?.profile?.display_name ||
    "Community member";

  const identityMode =
    communityProfile?.profile?.identity_mode ||
    communityProfile?.identity_mode ||
    "anonymous";

  const nextIdentityMode =
    identityMode === "anonymous"
      ? "username"
      : "anonymous";

  const handleIdentitySwitch =
  async () => {
    /*
     * Switching FROM username
     * TO anonymous requires a
     * choice first.
     */
    if (
      identityMode ===
      "username"
    ) {
      setAnonymousSetupOpen(
        true
      );

      setAnonymousAlias(
        communityProfile
          ?.profile
          ?.anonymous_alias ||
          ""
      );

      setIdentityError(
        ""
      );

      return;
    }

    /*
     * Anonymous -> username
     * can happen immediately.
     */
    try {
      setSwitchingIdentity(
        true
      );

      setIdentityError(
        ""
      );

      const result =
        await selectCommunityIdentity(
          "username"
        );

      onIdentityChanged?.(
        result
      );
    } catch (error) {
      setIdentityError(
        getApiErrorMessage(
          error,
          "Unable to switch community identity."
        )
      );
    } finally {
      setSwitchingIdentity(
        false
      );
    }
  };

  const handleAnonymousSwitch =
  async () => {
    if (
      anonymousAlias &&
      anonymousAlias.trim()
        .length < 3
    ) {
      setIdentityError(
        "Anonymous username must contain at least 3 characters."
      );

      return;
    }

    try {
      setSwitchingIdentity(
        true
      );

      setIdentityError(
        ""
      );

      const result =
        await selectCommunityIdentity(
          "anonymous",
          anonymousAlias
        );

      onIdentityChanged?.(
        result
      );

      setAnonymousSetupOpen(
        false
      );
    } catch (error) {
      setIdentityError(
        getApiErrorMessage(
          error,
          "Unable to switch community identity."
        )
      );
    } finally {
      setSwitchingIdentity(
        false
      );
    }
  };

  return (
    <motion.section
      className="community-header"
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
    >
      <div className="community-header__main">
        <div>
          <span className="community-header__eyebrow">
            <Sparkles size={14} />
            UNWIND Community
          </span>

          <h2>
            A space for honest,
            <span> thoughtful connection.</span>
          </h2>

          <p>
            Share at your own pace, support others
            with kindness and remember that every
            person here has a story beyond the screen.
          </p>
        </div>

        <div className="community-header__identity">
          <span>
            {identityMode === "anonymous" ? (
              <EyeOff size={17} />
            ) : (
              <UserRound size={17} />
            )}
          </span>

          <div>
            <small>Posting as</small>

            <strong>{visibleName}</strong>

            <p>
              {identityMode === "anonymous"
                ? "Anonymous identity"
                : "Username identity"}
            </p>

            <button
              type="button"
              className="community-identity-switch"
              onClick={handleIdentitySwitch}
              disabled={switchingIdentity}
            >
              {switchingIdentity
                ? "Switching…"
                : identityMode === "anonymous"
                  ? "Switch to username"
                  : "Switch to anonymous"}
            </button>
          </div>
        </div>
      </div>

      {anonymousSetupOpen && (
  <motion.div
    className="community-header-anonymous"
    initial={{
      opacity: 0,
      y: -8
    }}
    animate={{
      opacity: 1,
      y: 0
    }}
  >
    <div>
      <strong>
        Choose your anonymous
        username
      </strong>

      <p>
        Leave it empty to keep
        or automatically generate
        an anonymous identity.
      </p>
    </div>

    <div className="community-header-anonymous__input">
      <span>@</span>

      <input
        type="text"
        maxLength={30}
        value={
          anonymousAlias
        }
        placeholder="quiet_mind"
        onChange={(event) =>
          setAnonymousAlias(
            event.target.value
              .replace(
                /[^a-zA-Z0-9_]/g,
                ""
              )
              .slice(
                0,
                30
              )
          )
        }
      />

      <button
        type="button"
        onClick={
          handleAnonymousSwitch
        }
        disabled={
          switchingIdentity
        }
      >
        {switchingIdentity
          ? "Saving…"
          : "Use identity"}
      </button>

      <button
        type="button"
        onClick={() =>
          setAnonymousSetupOpen(
            false
          )
        }
        disabled={
          switchingIdentity
        }
      >
        Cancel
      </button>
    </div>
  </motion.div>
)}

      {identityError && (
        <div className="community-page-alert">
          {identityError}
        </div>
      )}

      <div className="community-header__controls">
        <div className="community-feed-filters">
          {feedFilters.map((filter) => {
            const Icon = filter.icon;

            return (
              <button
                type="button"
                key={filter.value}
                className={
                  activeFilter === filter.value
                    ? "community-feed-filter community-feed-filter--active"
                    : "community-feed-filter"
                }
                onClick={() =>
                  onFilterChange(filter.value)
                }
              >
                <Icon size={15} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        <div className="community-header__actions">
          <button
            type="button"
            className="community-refresh-button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh community feed"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "community-icon-spin"
                  : ""
              }
            />
          </button>

          <button
  type="button"
  className="community-primary-button"
  onClick={() => {
    onCreatePost?.();
  }}
>
  <Plus size={17} />
  Create post
</button>

        </div>
      </div>
    </motion.section>
  );
}

export default CommunityHeader;