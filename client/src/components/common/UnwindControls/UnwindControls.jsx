import React, { Children, isValidElement, useId } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp
} from "lucide-react";
import {
  Checkbox,
  Popover,
  RadioGroup,
  Select,
  Slider,
  Switch
} from "radix-ui";

import "./UnwindControls.css";

const EMPTY_VALUE = "__unwind_empty_value__";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeSelectChildren(children) {
  const items = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    if (child.type === "option") {
      const rawValue = child.props.value ?? child.props.children ?? "";
      const value = String(rawValue);

      items.push({
        value,
        label: child.props.children,
        disabled: Boolean(child.props.disabled)
      });

      return;
    }

    if (child.type === "optgroup") {
      const groupItems = [];

      Children.forEach(child.props.children, (option) => {
        if (!isValidElement(option) || option.type !== "option") {
          return;
        }

        const rawValue = option.props.value ?? option.props.children ?? "";

        groupItems.push({
          value: String(rawValue),
          label: option.props.children,
          disabled: Boolean(option.props.disabled)
        });
      });

      items.push({
        group: child.props.label,
        items: groupItems
      });
    }
  });

  return items;
}

function toRadixValue(value) {
  if (value === undefined || value === null || String(value) === "") {
    return EMPTY_VALUE;
  }

  return String(value);
}

function fromRadixValue(value) {
  return value === EMPTY_VALUE ? "" : value;
}

function createNativeLikeEvent({ name, value, checked }) {
  return {
    target: {
      name,
      value,
      checked
    },
    currentTarget: {
      name,
      value,
      checked
    }
  };
}

function SelectItem({ value, children, disabled = false }) {
  return (
    <Select.Item
      className="unwind-select__item"
      value={toRadixValue(value)}
      disabled={disabled}
    >
      <Select.ItemText>{children}</Select.ItemText>

      <Select.ItemIndicator className="unwind-select__indicator">
        <Check size={16} strokeWidth={2.25} />
      </Select.ItemIndicator>
    </Select.Item>
  );
}
const MONTH_NAMES = [
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

const WEEK_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat"
];

function padDatePart(value) {
  return String(value).padStart(
    2,
    "0"
  );
}

function formatDateValue(date) {
  if (!(date instanceof Date)) {
    return "";
  }

  return [
    date.getFullYear(),
    padDatePart(
      date.getMonth() + 1
    ),
    padDatePart(
      date.getDate()
    )
  ].join("-");
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const [
    year,
    month,
    day
  ] = String(value)
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatReadableDate(value) {
  const date =
    parseDateValue(value);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  ).format(date);
}

function isSameCalendarDay(
  first,
  second
) {
  if (!first || !second) {
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

function getCalendarDays(
  year,
  month
) {
  const firstDay =
    new Date(
      year,
      month,
      1
    );

  const lastDay =
    new Date(
      year,
      month + 1,
      0
    );

  const startOffset =
    firstDay.getDay();

  const totalDays =
    lastDay.getDate();

  const days = [];

  for (
    let index = 0;
    index < startOffset;
    index += 1
  ) {
    days.push(null);
  }

  for (
    let day = 1;
    day <= totalDays;
    day += 1
  ) {
    days.push(
      new Date(
        year,
        month,
        day
      )
    );
  }

  while (
    days.length % 7 !== 0
  ) {
    days.push(null);
  }

  return days;
}

function isDateOutsideRange(
  date,
  min,
  max
) {
  const normalized =
    formatDateValue(date);

  if (
    min &&
    normalized < min
  ) {
    return true;
  }

  if (
    max &&
    normalized > max
  ) {
    return true;
  }

  return false;
}
export function UnwindSelect({
  children,
  options,
  value,
  defaultValue,
  onChange,
  onValueChange,
  name,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  className = "",
  triggerClassName = "",
  contentClassName = "",
  ariaLabel,
  id,
  icon: Icon,
  sideOffset = 7,
  variant = "default",
  ...rest
}) {
  const fallbackId = useId();
  const controlId = id || fallbackId;

  const normalizedOptions = options
    ? options.map((option) => ({
        value: String(option.value ?? ""),
        label: option.label,
        disabled: Boolean(option.disabled),
        group: option.group
      }))
    : normalizeSelectChildren(children);

  const handleValueChange = (nextRadixValue) => {
    const nextValue = fromRadixValue(nextRadixValue);

    onValueChange?.(nextValue);
    onChange?.(
      createNativeLikeEvent({
        name,
        value: nextValue
      })
    );
  };

  const rootProps = {
    disabled,
    required,
    onValueChange: handleValueChange
  };

  if (value !== undefined) {
    rootProps.value = toRadixValue(value);
  } else if (defaultValue !== undefined) {
    rootProps.defaultValue = toRadixValue(defaultValue);
  }

  const renderItems = () =>
    normalizedOptions.map((item, index) => {
      if (item.items) {
        return (
          <Select.Group key={`${item.group || "group"}-${index}`}>
            {item.group ? (
              <Select.Label className="unwind-select__group-label">
                {item.group}
              </Select.Label>
            ) : null}

            {item.items.map((option) => (
              <SelectItem
                key={`${option.value}-${String(option.label)}`}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </Select.Group>
        );
      }

      return (
        <SelectItem
          key={`${item.value}-${String(item.label)}`}
          value={item.value}
          disabled={item.disabled}
        >
          {item.label}
        </SelectItem>
      );
    });

  return (
    <span className={cx("unwind-select", className)}>
      <Select.Root {...rootProps} {...rest}>
        <Select.Trigger
          id={controlId}
          className={cx("unwind-select__trigger", triggerClassName)}
          aria-label={ariaLabel || name || placeholder}
        >
          {Icon ? (
            <span className="unwind-select__leading-icon" aria-hidden="true">
              <Icon size={18} />
            </span>
          ) : null}

          <Select.Value placeholder={placeholder} />

          <Select.Icon className="unwind-select__chevron">
            <ChevronDown size={17} strokeWidth={2.2} />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
  className={cx(
    "unwind-select__content",
    variant !== "default" &&
      `unwind-select__content--${variant}`,
    contentClassName
  )}
  position="popper"
  sideOffset={sideOffset}
  collisionPadding={12}
>
            <Select.ScrollUpButton className="unwind-select__scroll-button">
              <ChevronUp size={16} />
            </Select.ScrollUpButton>

            <Select.Viewport className="unwind-select__viewport">
              {renderItems()}
            </Select.Viewport>

            <Select.ScrollDownButton className="unwind-select__scroll-button">
              <ChevronDown size={16} />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </span>
  );
}
export function UnwindDatePicker({
  value = "",
  onChange,
  onValueChange,
  name,
  id,
  placeholder = "Select date",
  min,
  max,
  disabled = false,
  required = false,
  className = "",
  ariaLabel,
  ...rest
}) {
  const fallbackId = useId();

  const controlId =
    id || fallbackId;

  const selectedDate =
    parseDateValue(value);

  const today =
    new Date();

  const initialDate =
    selectedDate || today;

  const [
    visibleMonth,
    setVisibleMonth
  ] = React.useState(
    () =>
      new Date(
        initialDate.getFullYear(),
        initialDate.getMonth(),
        1
      )
  );

  React.useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setVisibleMonth(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      )
    );
  }, [value]);

  const calendarDays =
    getCalendarDays(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth()
    );

  const selectDate = (
    date
  ) => {
    if (
      isDateOutsideRange(
        date,
        min,
        max
      )
    ) {
      return;
    }

    const nextValue =
      formatDateValue(date);

    onValueChange?.(
      nextValue
    );

    onChange?.(
      createNativeLikeEvent({
        name,
        value: nextValue
      })
    );
  };

  const goPreviousMonth =
    () => {
      setVisibleMonth(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth() - 1,
            1
          )
      );
    };

  const goNextMonth =
    () => {
      setVisibleMonth(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            1
          )
      );
    };

  return (
    <Popover.Root>
      <div
        className={cx(
          "unwind-date",
          className
        )}
      >
        <Popover.Trigger
          id={controlId}
          className="unwind-date__trigger"
          disabled={disabled}
          aria-label={
            ariaLabel ||
            name ||
            placeholder
          }
          {...rest}
        >
          <CalendarDays
            size={19}
            className="unwind-date__icon"
          />

          <span
            className={cx(
              "unwind-date__value",
              !value &&
                "unwind-date__value--placeholder"
            )}
          >
            {value
              ? formatReadableDate(
                  value
                )
              : placeholder}
          </span>

          <ChevronDown
            size={17}
            className="unwind-date__chevron"
          />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="unwind-date__content"
            sideOffset={8}
            collisionPadding={12}
            align="start"
          >
            <div className="unwind-date__header">
              <button
                type="button"
                className="unwind-date__nav"
                onClick={
                  goPreviousMonth
                }
                aria-label="Previous month"
              >
                <ChevronLeft
                  size={18}
                />
              </button>

              <strong>
                {
                  MONTH_NAMES[
                    visibleMonth.getMonth()
                  ]
                }{" "}
                {
                  visibleMonth.getFullYear()
                }
              </strong>

              <button
                type="button"
                className="unwind-date__nav"
                onClick={
                  goNextMonth
                }
                aria-label="Next month"
              >
                <ChevronRight
                  size={18}
                />
              </button>
            </div>

            <div className="unwind-date__weekdays">
              {WEEK_DAYS.map(
                (day) => (
                  <span key={day}>
                    {day}
                  </span>
                )
              )}
            </div>

            <div className="unwind-date__grid">
              {calendarDays.map(
                (
                  date,
                  index
                ) => {
                  if (!date) {
                    return (
                      <span
                        key={`empty-${index}`}
                        className="unwind-date__empty"
                      />
                    );
                  }

                  const selected =
                    isSameCalendarDay(
                      date,
                      selectedDate
                    );

                  const isToday =
                    isSameCalendarDay(
                      date,
                      today
                    );

                  const unavailable =
                    isDateOutsideRange(
                      date,
                      min,
                      max
                    );

                  return (
                    <Popover.Close
                      key={
                        formatDateValue(
                          date
                        )
                      }
                      asChild
                    >
                      <button
                        type="button"
                        disabled={
                          unavailable
                        }
                        className={cx(
                          "unwind-date__day",
                          selected &&
                            "is-selected",
                          isToday &&
                            "is-today"
                        )}
                        onClick={() =>
                          selectDate(
                            date
                          )
                        }
                      >
                        {
                          date.getDate()
                        }
                      </button>
                    </Popover.Close>
                  );
                }
              )}
            </div>

            <div className="unwind-date__footer">
              <Popover.Close
                asChild
              >
                <button
                  type="button"
                  className="unwind-date__today"
                  onClick={() =>
                    selectDate(
                      today
                    )
                  }
                  disabled={
                    isDateOutsideRange(
                      today,
                      min,
                      max
                    )
                  }
                >
                  Today
                </button>
              </Popover.Close>

              {value && (
                <Popover.Close
                  asChild
                >
                  <button
                    type="button"
                    className="unwind-date__clear"
                    onClick={() => {
                      onValueChange?.(
                        ""
                      );

                      onChange?.(
                        createNativeLikeEvent({
                          name,
                          value: ""
                        })
                      );
                    }}
                  >
                    Clear
                  </button>
                </Popover.Close>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>

        {required && (
          <input
            type="hidden"
            name={name}
            value={value}
            required
          />
        )}
      </div>
    </Popover.Root>
  );
}
export function UnwindCheckbox({
  checked,
  defaultChecked,
  onChange,
  onCheckedChange,
  name,
  id,
  disabled = false,
  required = false,
  label,
  description,
  className = "",
  ...rest
}) {
  const fallbackId = useId();
  const controlId = id || fallbackId;

  const handleCheckedChange = (nextChecked) => {
    const booleanValue = nextChecked === true;

    onCheckedChange?.(booleanValue);
    onChange?.(
      createNativeLikeEvent({
        name,
        value: booleanValue ? "on" : "",
        checked: booleanValue
      })
    );
  };

  return (
    <label
      className={cx(
        "unwind-checkbox-row",
        disabled && "is-disabled",
        className
      )}
      htmlFor={controlId}
    >
      <Checkbox.Root
        id={controlId}
        name={name}
        className="unwind-checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        required={required}
        {...rest}
      >
        <Checkbox.Indicator className="unwind-checkbox__indicator">
          <Check size={14} strokeWidth={2.7} />
        </Checkbox.Indicator>
      </Checkbox.Root>

      {label || description ? (
        <span className="unwind-control-copy">
          {label ? <span className="unwind-control-copy__label">{label}</span> : null}
          {description ? (
            <span className="unwind-control-copy__description">{description}</span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}

export function UnwindSwitch({
  checked,
  defaultChecked,
  onChange,
  onCheckedChange,
  name,
  id,
  disabled = false,
  label,
  description,
  className = "",
  ...rest
}) {
  const fallbackId = useId();
  const controlId = id || fallbackId;

  const handleCheckedChange = (nextChecked) => {
    onCheckedChange?.(nextChecked);
    onChange?.(
      createNativeLikeEvent({
        name,
        value: nextChecked ? "on" : "",
        checked: nextChecked
      })
    );
  };

  return (
    <label
      className={cx(
        "unwind-switch-row",
        disabled && "is-disabled",
        className
      )}
      htmlFor={controlId}
    >
      {(label || description) && (
        <span className="unwind-control-copy">
          {label ? <span className="unwind-control-copy__label">{label}</span> : null}
          {description ? (
            <span className="unwind-control-copy__description">{description}</span>
          ) : null}
        </span>
      )}

      <Switch.Root
        id={controlId}
        name={name}
        className="unwind-switch"
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={handleCheckedChange}
        disabled={disabled}
        {...rest}
      >
        <Switch.Thumb className="unwind-switch__thumb" />
      </Switch.Root>
    </label>
  );
}

export function UnwindRadioGroup({
  options = [],
  value,
  defaultValue,
  onChange,
  onValueChange,
  name,
  disabled = false,
  className = "",
  orientation = "vertical",
  ...rest
}) {
  const handleValueChange = (nextValue) => {
    onValueChange?.(nextValue);
    onChange?.(
      createNativeLikeEvent({
        name,
        value: nextValue
      })
    );
  };

  return (
    <RadioGroup.Root
      className={cx(
        "unwind-radio-group",
        `unwind-radio-group--${orientation}`,
        className
      )}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      orientation={orientation}
      {...rest}
    >
      {options.map((option) => {
        const optionId = `${name || "unwind-radio"}-${String(option.value)}`;

        return (
          <label
            key={String(option.value)}
            className={cx(
              "unwind-radio-row",
              option.disabled && "is-disabled"
            )}
            htmlFor={optionId}
          >
            <RadioGroup.Item
              id={optionId}
              className="unwind-radio"
              value={String(option.value)}
              disabled={option.disabled}
            >
              <RadioGroup.Indicator className="unwind-radio__indicator" />
            </RadioGroup.Item>

            <span className="unwind-control-copy">
              <span className="unwind-control-copy__label">{option.label}</span>
              {option.description ? (
                <span className="unwind-control-copy__description">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </RadioGroup.Root>
  );
}

export function UnwindSlider({
  value,
  defaultValue,
  onChange,
  onValueChange,
  name,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = "",
  showValue = false,
  formatValue = (current) => current,
  ...rest
}) {
  const normalizedValue = Array.isArray(value)
    ? value
    : value !== undefined
      ? [Number(value)]
      : undefined;

  const normalizedDefaultValue = Array.isArray(defaultValue)
    ? defaultValue
    : defaultValue !== undefined
      ? [Number(defaultValue)]
      : [min];

  const currentValue = normalizedValue?.[0] ?? normalizedDefaultValue?.[0] ?? min;

  const handleValueChange = (nextValues) => {
    const nextValue = nextValues[0];

    onValueChange?.(nextValue, nextValues);
    onChange?.(
      createNativeLikeEvent({
        name,
        value: String(nextValue)
      })
    );
  };

  return (
    <div className={cx("unwind-slider-wrap", className)}>
      <Slider.Root
        className="unwind-slider"
        value={normalizedValue}
        defaultValue={normalizedDefaultValue}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        {...rest}
      >
        <Slider.Track className="unwind-slider__track">
          <Slider.Range className="unwind-slider__range" />
        </Slider.Track>

        <Slider.Thumb
          className="unwind-slider__thumb"
          aria-label={name || "Slider value"}
        />
      </Slider.Root>

      {showValue ? (
        <output className="unwind-slider__value">
          {formatValue(currentValue)}
        </output>
      ) : null}
    </div>
  );
}
