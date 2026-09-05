import {
  CheckCircle2,
  CupSoda,
  Droplets,
  Minus,
  Plus,
  Undo2
} from "lucide-react";

import {
  useState
} from "react";
import ButtonLoader
  from "../common/AppStates/ButtonLoader";

const defaultAmounts = [
  250,
  500,
  750,
  1000
];

function getContainerId(
  container
) {
  return (
    container
      ?.water_container_id ||
    container
      ?.waterContainerId ||
    container?.id
  );
}

function getContainerName(
  container
) {
  return (
    container?.container_name ||
    container?.containerName ||
    "Container"
  );
}

function getContainerAmount(
  container
) {
  return Number(
    container?.amount_ml ??
      container?.amountMl ??
      0
  );
}

function WaterTrackerCard({
  total,
  containers,
  canRemove = false,
  saving,
  removing,
  onAddWater,
  onRemoveLastWater
}) {
  const goal = 2500;

  const percentage =
    Math.min(
      Math.round(
        (
          (Number(total) || 0) /
          goal
        ) * 100
      ),
      100
    );

  const [
    customAmount,
    setCustomAmount
  ] = useState("");

  const [
    localMessage,
    setLocalMessage
  ] = useState("");

  const [
  activeAmount,
  setActiveAmount
] = useState(null);

  const handleAdd =
  async (
    amountMl,
    waterContainerId = null,
    containerType = null
  ) => {
    const numericAmount =
      Number(amountMl);

    setLocalMessage("");
    setActiveAmount(
      numericAmount
    );

    try {
      await onAddWater({
        amountMl:
          numericAmount,

        waterContainerId,
        containerType
      });

      setCustomAmount("");

      setLocalMessage(
        `${numericAmount} ml added`
      );

      window.setTimeout(
        () =>
          setLocalMessage(
            ""
          ),
        1800
      );
    } catch {
      // Global tracker error is
      // displayed by TrackersPage.
    } finally {
      setActiveAmount(null);
    }
  };

  const handleRemove =
    async () => {
      setLocalMessage("");

      try {
        const removedLog =
          await onRemoveLastWater();

        const removedAmount =
          Number(
            removedLog?.amount_ml ??
              removedLog?.amountMl ??
              0
          );

        setLocalMessage(
          removedAmount
            ? `${removedAmount} ml removed`
            : "Last water entry removed"
        );

        window.setTimeout(
          () =>
            setLocalMessage(
              ""
            ),
          1800
        );
      } catch {
        // Global tracker error is
        // displayed by TrackersPage.
      }
    };

  return (
    <article className="tracker-card tracker-card--water">
      <header className="tracker-card__header">
        <div>
          <span className="tracker-card__eyebrow">
            <Droplets
              size={14}
            />
            Hydration
          </span>

          <h2>
            Water intake
          </h2>

          <p>
            Small sips throughout
            the day count.
          </p>
        </div>

        <span className="water-percentage">
          {percentage}%
        </span>
      </header>

      <div className="water-progress">
        <div className="water-progress__visual">
          <span
            style={{
              height:
                `${percentage}%`
            }}
          />

          <Droplets
            size={35}
          />
        </div>

        <div className="water-progress__details">
          <strong>
            {Number(total) || 0}
            <small> ml</small>
          </strong>

          <p>
            of {goal} ml daily goal
          </p>

          <div>
            <span
              style={{
                width:
                  `${percentage}%`
              }}
            />
          </div>
        </div>
      </div>

     {localMessage && (
  <div
    className="water-feedback water-feedback--success"
    role="status"
    aria-live="polite"
  >
    <CheckCircle2 size={16} />
    {localMessage}
  </div>
)}

      <div className="water-correction-row">
        <span>
          Quick add
        </span>

        <button
          type="button"
          className="water-remove-button"
          disabled={
            saving ||
            removing ||
            !canRemove
          }
          onClick={
            handleRemove
          }
          title={
            canRemove
              ? "Remove the most recent water entry"
              : "No water entry to remove"
          }
        >
         {removing ? (
  <ButtonLoader
    label="Removing…"
    size="small"
  />
) : (
  <>
    <Undo2 size={15} />
    Undo last
  </>
)}

          Undo last
        </button>
      </div>

      <div className="water-quick-actions">
        {defaultAmounts.map(
          (amount) => (
            <button
              type="button"
              key={amount}
              onClick={() =>
                handleAdd(
                  amount,
                  null,
                  "quick_add"
                )
              }
              disabled={
                saving ||
                removing
              }
            >
             {saving &&
activeAmount === amount ? (
  <ButtonLoader
    label={`${amount} ml`}
    size="small"
  />
) : (
  <>
    <Plus size={14} />
    {amount} ml
  </>
)}
            </button>
          )
        )}
      </div>

      {containers.length > 0 && (
        <div className="water-containers">
          <span>
            Your containers
          </span>

          <div>
            {containers.map(
              (container) => {
                const id =
                  getContainerId(
                    container
                  );

                const amount =
                  getContainerAmount(
                    container
                  );

                return (
                  <button
                    type="button"
                    key={id}
                    disabled={
                      saving ||
                      removing ||
                      !amount
                    }
                    onClick={() =>
                      handleAdd(
                        amount,
                        id,
                        getContainerName(
                          container
                        )
                      )
                    }
                  >
                   {saving &&
activeAmount === amount ? (
  <ButtonLoader
    label={`Adding ${amount} ml…`}
    size="small"
  />
) : (
  <>
    <CupSoda size={17} />

    <span>
      <strong>
        {getContainerName(
          container
        )}
      </strong>

      <small>
        {amount} ml
      </small>
    </span>
  </>
)}
                    
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      <form
        className="water-custom-add"
        aria-busy={saving}
        disabled={
  saving || removing
}
        onSubmit={(
          event
        ) => {
          event.preventDefault();

          if (
            Number(
              customAmount
            ) > 0
          ) {
            handleAdd(
              customAmount,
              null,
              "custom"
            );
          }
        }}
      >
        <label>
          <span>
            Custom amount
          </span>

          <input
            type="number"
            min="1"
            max="10000"
            value={
              customAmount
            }
            placeholder="Amount in ml"
            onChange={(
              event
            ) =>
              setCustomAmount(
                event.target
                  .value
              )
            }
          />
        </label>

        <button
          type="submit"
          disabled={
            saving ||
            removing ||
            Number(
              customAmount
            ) < 1
          }
        >
         {saving &&
activeAmount ===
  Number(customAmount) ? (
  <ButtonLoader
    label="Adding water…"
    size="small"
  />
) : (
  <>
    <Plus size={16} />
    Add water
  </>
)}
        </button>
      </form>

      <div className="water-minus-explanation">
        <Minus size={14} />

        <span>
          Undo removes your latest
          water entry instead of
          creating an invalid negative
          amount.
        </span>
      </div>
    </article>
  );
}

export default WaterTrackerCard;