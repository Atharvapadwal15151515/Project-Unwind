import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoonStar,
  Sunrise,
  X
} from "lucide-react";

import {
  Popover
} from "radix-ui";

import "./UnwindDateTimePicker.css";


const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const WEEKDAYS = [
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa"
];


function pad(value) {
  return String(value)
    .padStart(2, "0");
}


function parseDateTime(value) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}


function toLocalDateTimeValue(date) {
  if (!date) {
    return "";
  }

  return [
    date.getFullYear(),
    "-",
    pad(
      date.getMonth() + 1
    ),
    "-",
    pad(
      date.getDate()
    ),
    "T",
    pad(
      date.getHours()
    ),
    ":",
    pad(
      date.getMinutes()
    )
  ].join("");
}


function formatDisplay(value) {
  const date =
    parseDateTime(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  ).format(date);
}


function getDaysForMonth(
  year,
  month
) {
  const first =
    new Date(
      year,
      month,
      1
    );

  const count =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const result = [];

  for (
    let index = 0;
    index < first.getDay();
    index += 1
  ) {
    result.push(null);
  }

  for (
    let day = 1;
    day <= count;
    day += 1
  ) {
    result.push(
      new Date(
        year,
        month,
        day
      )
    );
  }

  return result;
}


function sameDay(
  first,
  second
) {
  if (
    !first ||
    !second
  ) {
    return false;
  }

  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}


function getTimeIcon(hour) {
  if (
    hour >= 5 &&
    hour < 11
  ) {
    return Sunrise;
  }

  if (
    hour >= 18 ||
    hour < 5
  ) {
    return MoonStar;
  }

  return Clock3;
}


function createNativeLikeEvent(
  name,
  value
) {
  return {
    target: {
      name,
      value
    },

    currentTarget: {
      name,
      value
    }
  };
}


export default function UnwindDateTimePicker({
  name,
  value,
  onChange,
  placeholder =
    "Select date and time",
  disabled = false,
  required = false,
  label = "",
  min,
  max
}) {
  const selectedDate =
    parseDateTime(value);

  const initial =
    selectedDate ||
    new Date();

  const [
    visibleMonth,
    setVisibleMonth
  ] = useState(
    new Date(
      initial.getFullYear(),
      initial.getMonth(),
      1
    )
  );

  const [
    draft,
    setDraft
  ] = useState(
    selectedDate ||
    new Date()
  );

  const [
    mode,
    setMode
  ] = useState("hour");

  const [
  minuteInput,
  setMinuteInput
] = useState(
  pad(
    selectedDate
      ? selectedDate.getMinutes()
      : new Date().getMinutes()
  )
);


  useEffect(() => {
  const parsed =
    parseDateTime(value);

  if (!parsed) {
    return;
  }

  setDraft(parsed);

  setMinuteInput(
    pad(
      parsed.getMinutes()
    )
  );

  setVisibleMonth(
    new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      1
    )
  );
}, [value]);


  const days =
    useMemo(
      () =>
        getDaysForMonth(
          visibleMonth.getFullYear(),
          visibleMonth.getMonth()
        ),
      [visibleMonth]
    );


  const hour12 =
    draft.getHours() % 12 ||
    12;

  const minute =
    draft.getMinutes();

  const isPm =
    draft.getHours() >= 12;

  const TimeIcon =
    getTimeIcon(
      draft.getHours()
    );


  const updateDraftDate = (
    selected
  ) => {
    setDraft(
      (current) => {
        const next =
          new Date(current);

        next.setFullYear(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate()
        );

        return next;
      }
    );
  };


  const updateHour = (
    hour
  ) => {
    setDraft(
      (current) => {
        const next =
          new Date(current);

        let nextHour =
          hour % 12;

        if (isPm) {
          nextHour += 12;
        }

        next.setHours(
          nextHour
        );

        return next;
      }
    );

    setMode("minute");
  };


  const updateMinute = (
  nextMinute
) => {
  const safeMinute =
    Math.max(
      0,
      Math.min(
        59,
        Number(nextMinute)
      )
    );

  setDraft(
    (current) => {
      const next =
        new Date(current);

      next.setMinutes(
        safeMinute
      );

      return next;
    }
  );

  setMinuteInput(
    pad(safeMinute)
  );
};

  const updateMeridiem = (
    nextIsPm
  ) => {
    setDraft(
      (current) => {
        const next =
          new Date(current);

        let hours =
          next.getHours();

        if (
          nextIsPm &&
          hours < 12
        ) {
          hours += 12;
        }

        if (
          !nextIsPm &&
          hours >= 12
        ) {
          hours -= 12;
        }

        next.setHours(hours);

        return next;
      }
    );
  };


  const confirmValue = () => {
    const nextValue =
      toLocalDateTimeValue(
        draft
      );

    if (
      min &&
      nextValue < min
    ) {
      return;
    }

    if (
      max &&
      nextValue > max
    ) {
      return;
    }

    onChange?.(
      createNativeLikeEvent(
        name,
        nextValue
      )
    );
  };


  const clearValue = () => {
    onChange?.(
      createNativeLikeEvent(
        name,
        ""
      )
    );
  };


  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        className="unwind-datetime-trigger"
        disabled={disabled}
      >
        <TimeIcon
          size={18}
        />

        <span
          className={
            value
              ? "unwind-datetime-trigger__value"
              : "unwind-datetime-trigger__value unwind-datetime-trigger__value--placeholder"
          }
        >
          {value
            ? formatDisplay(
                value
              )
            : placeholder}
        </span>

        <CalendarDays
          size={17}
          className="unwind-datetime-trigger__calendar"
        />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="unwind-datetime-popover"
          sideOffset={8}
          collisionPadding={14}
          align="start"
        >
          <div className="unwind-datetime-header">
            <div>
              <small>
                {label ||
                  "Date & time"}
              </small>

              <strong>
                {formatDisplay(
                  toLocalDateTimeValue(
                    draft
                  )
                )}
              </strong>
            </div>

            <Popover.Close
              className="unwind-datetime-close"
            >
              <X size={17} />
            </Popover.Close>
          </div>


          <div className="unwind-datetime-calendar-header">
            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() -
                        1,
                      1
                    )
                )
              }
            >
              <ChevronLeft
                size={18}
              />
            </button>

            <strong>
              {
                MONTHS[
                  visibleMonth.getMonth()
                ]
              }{" "}
              {
                visibleMonth.getFullYear()
              }
            </strong>

            <button
              type="button"
              onClick={() =>
                setVisibleMonth(
                  (current) =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() +
                        1,
                      1
                    )
                )
              }
            >
              <ChevronRight
                size={18}
              />
            </button>
          </div>


          <div className="unwind-datetime-weekdays">
            {WEEKDAYS.map(
              (day) => (
                <span key={day}>
                  {day}
                </span>
              )
            )}
          </div>


          <div className="unwind-datetime-days">
            {days.map(
              (
                day,
                index
              ) => {
                if (!day) {
                  return (
                    <span
                      key={`empty-${index}`}
                    />
                  );
                }

                const active =
                  sameDay(
                    day,
                    draft
                  );

                return (
                  <button
                    key={
                      day.toISOString()
                    }
                    type="button"
                    className={
                      active
                        ? "unwind-datetime-day unwind-datetime-day--active"
                        : "unwind-datetime-day"
                    }
                    onClick={() =>
                      updateDraftDate(
                        day
                      )
                    }
                  >
                    {
                      day.getDate()
                    }
                  </button>
                );
              }
            )}
          </div>


          <div className="unwind-datetime-divider" />


          <div className="unwind-clock-section">
            <div className="unwind-clock-tabs">
              <button
                type="button"
                className={
                  mode ===
                  "hour"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMode("hour")
                }
              >
                {pad(hour12)}
              </button>

              <span>:</span>

            <input
  type="text"
  inputMode="numeric"
  maxLength={2}
  value={minuteInput}
  className={
    mode === "minute"
      ? "unwind-clock-minute-input active"
      : "unwind-clock-minute-input"
  }
  aria-label="Minute"
  onFocus={(event) => {
    setMode("minute");

    event.target.select();
  }}
  onChange={(event) => {
    const raw =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 2);

    setMinuteInput(raw);

    if (
      raw !== "" &&
      Number(raw) <= 59
    ) {
      setDraft(
        (current) => {
          const next =
            new Date(current);

          next.setMinutes(
            Number(raw)
          );

          return next;
        }
      );
    }
  }}
  onBlur={() => {
    if (
      minuteInput === ""
    ) {
      setMinuteInput(
        pad(minute)
      );

      return;
    }

    const parsed =
      Math.max(
        0,
        Math.min(
          59,
          Number(
            minuteInput
          )
        )
      );

    updateMinute(
      parsed
    );
  }}
  onKeyDown={(event) => {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      event.currentTarget.blur();
    }

    if (
      event.key ===
        "ArrowUp" ||
      event.key ===
        "ArrowDown"
    ) {
      event.preventDefault();

      const direction =
        event.key ===
        "ArrowUp"
          ? 1
          : -1;

      updateMinute(
        (
          minute +
          direction +
          60
        ) % 60
      );
    }
  }}
/>

              <div className="unwind-clock-meridiem">
                <button
                  type="button"
                  className={
                    !isPm
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    updateMeridiem(
                      false
                    )
                  }
                >
                  AM
                </button>

                <button
                  type="button"
                  className={
                    isPm
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    updateMeridiem(
                      true
                    )
                  }
                >
                  PM
                </button>
              </div>
            </div>


            <div className="unwind-clock-face">
              <div className="unwind-clock-face__center" />

              {mode ===
              "hour"
                ? Array.from(
                    {
                      length: 12
                    },
                    (
                      _,
                      index
                    ) =>
                      index + 1
                  ).map(
                    (
                      hour,
                      index
                    ) => {
                      const angle =
  hour * 30 - 90;

                      return (
                        <button
                          key={
                            hour
                          }
                          type="button"
                          className={
                            hour ===
                            hour12
                              ? "unwind-clock-number active"
                              : "unwind-clock-number"
                          }
                          style={{
                            "--angle": `${angle}deg`
                          }}
                          onClick={() =>
                            updateHour(
                              hour
                            )
                          }
                        >
                          {
                            hour
                          }
                        </button>
                      );
                    }
                  )
                : [
                    0,
                    5,
                    10,
                    15,
                    20,
                    25,
                    30,
                    35,
                    40,
                    45,
                    50,
                    55
                  ].map(
                    (
                      value,
                      index
                    ) => {
                      const angle =
  (value / 5) * 30 - 90;

                      return (
                        <button
                          key={
                            value
                          }
                          type="button"
                          className={
                            value ===
                            minute
                              ? "unwind-clock-number active"
                              : "unwind-clock-number"
                          }
                          style={{
                            "--angle": `${angle}deg`
                          }}
                          onClick={() =>
                            updateMinute(
                              value
                            )
                          }
                        >
                          {pad(
                            value
                          )}
                        </button>
                      );
                    }
                  )}
            </div>
          </div>


          <div className="unwind-datetime-footer">
            {!required &&
              value && (
                <Popover.Close
                  asChild
                >
                  <button
                    type="button"
                    className="unwind-datetime-clear"
                    onClick={
                      clearValue
                    }
                  >
                    Clear
                  </button>
                </Popover.Close>
              )}

            <div>
              <Popover.Close
                asChild
              >
                <button
                  type="button"
                  className="unwind-datetime-cancel"
                >
                  Cancel
                </button>
              </Popover.Close>

              <Popover.Close
                asChild
              >
                <button
                  type="button"
                  className="unwind-datetime-done"
                  onClick={
                    confirmValue
                  }
                >
                  Done
                </button>
              </Popover.Close>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}