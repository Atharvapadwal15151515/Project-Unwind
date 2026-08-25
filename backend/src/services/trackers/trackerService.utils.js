import AppError from "../../utils/AppError.js";

export function buildPagination(
  rows,
  page,
  limit
) {
  const totalItems =
    rows.length > 0
      ? Number(rows[0].total_items)
      : 0;

  const totalPages =
    totalItems === 0
      ? 0
      : Math.ceil(
          totalItems / limit
        );

  return {
    page,
    limit,
    totalItems,
    totalPages
  };
}

export function removeTotalItems(
  rows
) {
  return rows.map(
    ({
      total_items,
      ...row
    }) => row
  );
}

export function parsePositiveInteger(
  value,
  fallbackValue
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallbackValue;
  }

  const parsedValue =
    Number.parseInt(value, 10);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1
  ) {
    return fallbackValue;
  }

  return parsedValue;
}

export function parseOptionalInteger(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsedValue =
    Number.parseInt(value, 10);

  return Number.isInteger(parsedValue)
    ? parsedValue
    : null;
}

export function parseBooleanQuery(
  value
) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  return (
    value === true ||
    value === "true" ||
    value === "1"
  );
}

export function ensureRecordExists(
  record,
  message
) {
  if (!record) {
    throw new AppError(
      message,
      404
    );
  }

  return record;
}
