import {
  useState
} from "react";

import {
  motion
} from "framer-motion";

import {
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound
} from "lucide-react";

import {
  selectCommunityIdentity
} from "../../services/communityService";

import {
  getApiErrorMessage
} from "../../services/api";

const identityOptions = [
  {
    value: "username",

    title:
      "Use my username",

    description:
      "People will see your UNWIND username on posts and comments.",

    icon:
      UserRound
  },

  {
    value: "anonymous",

    title:
      "Stay anonymous",

    description:
      "Choose an anonymous username or let UNWIND create one for you.",

    icon:
      EyeOff
  }
];

function CommunityIdentitySetup({
  onComplete
}) {
  const [
    selectedMode,
    setSelectedMode
  ] = useState(
    "anonymous"
  );

  const [
    anonymousAlias,
    setAnonymousAlias
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const handleAliasChange = (
    event
  ) => {
    /*
     * Keep the same characters
     * allowed by the backend:
     *
     * letters
     * numbers
     * underscores
     */
    const cleanedValue =
      event.target.value.replace(
        /[^a-zA-Z0-9_]/g,
        ""
      );

    setAnonymousAlias(
      cleanedValue.slice(
        0,
        30
      )
    );

    setError("");
  };

  const handleContinue =
    async () => {
      if (
        selectedMode ===
          "anonymous" &&
        anonymousAlias &&
        anonymousAlias.length <
          3
      ) {
        setError(
          "Anonymous username must contain at least 3 characters."
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        const result =
          await selectCommunityIdentity(
            selectedMode,
            selectedMode ===
              "anonymous"
              ? anonymousAlias
              : null
          );

        onComplete(
          result
        );
      } catch (
        requestError
      ) {
        setError(
          getApiErrorMessage(
            requestError,
            "Unable to create your community identity."
          )
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <section className="community-identity-page">
      <motion.div
        className="community-identity-card"
        initial={{
          opacity: 0,
          y: 24,
          scale: 0.97
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1
        }}
      >
        <span className="community-identity-card__icon">
          <Sparkles
            size={24}
          />
        </span>

        <span className="community-identity-card__eyebrow">
          Your community
          identity
        </span>

        <h2>
          Choose how you
          would like to be
          seen.
        </h2>

        <p>
          Participate using
          your UNWIND username
          or an anonymous
          identity. Your
          private account
          information remains
          hidden from other
          community members.
        </p>

        <div className="community-identity-options">
          {identityOptions.map(
            (option) => {
              const Icon =
                option.icon;

              const selected =
                selectedMode ===
                option.value;

              return (
                <motion.button
                  type="button"
                  key={
                    option.value
                  }
                  className={`community-identity-option ${
                    selected
                      ? "community-identity-option--selected"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedMode(
                      option.value
                    );

                    setError(
                      ""
                    );
                  }}
                  whileHover={{
                    y: -4
                  }}
                  whileTap={{
                    scale: 0.98
                  }}
                >
                  <span>
                    <Icon
                      size={21}
                    />
                  </span>

                  <div>
                    <strong>
                      {
                        option.title
                      }
                    </strong>

                    <p>
                      {
                        option.description
                      }
                    </p>
                  </div>

                  <i>
                    {selected ? (
                      <Eye
                        size={16}
                      />
                    ) : null}
                  </i>
                </motion.button>
              );
            }
          )}
        </div>

        {selectedMode ===
          "anonymous" && (
          <motion.div
            className="community-anonymous-name"
            initial={{
              opacity: 0,
              y: -5
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
          >
            <div className="community-anonymous-name__heading">
              <div>
                <strong>
                  Anonymous
                  username
                </strong>

                <p>
                  Optional — leave
                  this empty and
                  UNWIND will
                  generate one for
                  you.
                </p>
              </div>

              <EyeOff
                size={18}
              />
            </div>

            <div className="community-anonymous-name__input">
              <span>
                @
              </span>

              <input
                type="text"
                value={
                  anonymousAlias
                }
                maxLength={30}
                placeholder="quiet_mind"
                autoComplete="off"
                spellCheck="false"
                onChange={
                  handleAliasChange
                }
              />

              {anonymousAlias && (
                <button
                  type="button"
                  aria-label="Clear anonymous username"
                  onClick={() =>
                    setAnonymousAlias(
                      ""
                    )
                  }
                >
                  <RefreshCw
                    size={14}
                  />
                </button>
              )}
            </div>

            <div className="community-anonymous-name__meta">
              <span>
                Letters, numbers
                and underscores
                only
              </span>

              <span>
                {
                  anonymousAlias.length
                }
                /30
              </span>
            </div>
          </motion.div>
        )}

        <div className="community-identity-card__privacy">
          <ShieldCheck
            size={19}
          />

          <p>
            You can change your
            identity mode later.
            Existing posts retain
            the identity used when
            they were created.
          </p>
        </div>

        {error && (
          <div className="community-form-error">
            {error}
          </div>
        )}

        <button
          type="button"
          className="community-primary-button"
          onClick={
            handleContinue
          }
          disabled={
            loading
          }
        >
          {loading
            ? "Preparing your community space…"
            : "Continue to the community"}

          {!loading && (
            <ArrowRight
              size={17}
            />
          )}
        </button>
      </motion.div>
    </section>
  );
}

export default CommunityIdentitySetup;