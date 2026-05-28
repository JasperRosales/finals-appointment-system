const { AppError } = require('./errors');

function assertIsoDate(value, fieldName = 'date') {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Invalid ${fieldName}`, 'INVALID_DATE');
  }

  return date;
}

function assertCalendarDate(value, fieldName = 'date') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, `Invalid ${fieldName}`, 'INVALID_DATE');
  }

  return value;
}

function toIsoString(value) {
  return new Date(value).toISOString();
}

function toUtcDateOnly(value) {
  const date = new Date(value);

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isAtLeastOneDayBefore(target, now = new Date()) {
  return toUtcDateOnly(target) - toUtcDateOnly(now) >= 24 * 60 * 60 * 1000;
}

function sameUtcDay(left, right) {
  return toUtcDateOnly(left) === toUtcDateOnly(right);
}

function normalizeCalendarDate(value) {
  const date = assertCalendarDate(value, 'date');
  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, 'Invalid date', 'INVALID_DATE');
  }

  return {
    value: date,
    start: parsed,
    end: new Date(parsed.getTime() + 24 * 60 * 60 * 1000)
  };
}

module.exports = {
  assertIsoDate,
  assertCalendarDate,
  toIsoString,
  isAtLeastOneDayBefore,
  sameUtcDay,
  normalizeCalendarDate
};
