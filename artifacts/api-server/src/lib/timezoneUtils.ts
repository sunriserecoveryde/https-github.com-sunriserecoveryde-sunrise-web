/**
 * Timezone utilities for facility-local date handling.
 *
 * Contract:
 *   - Timestamps are stored in UTC
 *   - Facility schedule `date` parameters are YYYY-MM-DD strings
 *     interpreted in the facility's IANA timezone (from sos_facilities.time_zone)
 *   - This module converts a facility-local calendar day to a UTC [from, to) interval
 *   - Never uses browser-local or server-local timezone — always uses explicit IANA tz
 *
 * Algorithm:
 *   To find the UTC instant for midnight on (Y, M, D) in timezone T:
 *   1. Compute UTC midnight reference (Date.UTC(Y, M-1, D, 0, 0, 0))
 *   2. Format that UTC instant with Intl.DateTimeFormat in timezone T
 *   3. Compute the offset: (local_time_as_utc_epoch) - (utc_epoch)
 *   4. Local midnight in UTC = Date.UTC(Y, M-1, D, 0, 0, 0) - offset
 *
 *   Using UTC midnight as the reference point (not local noon) ensures correctness
 *   across DST transitions: US timezone transitions occur at 2 AM local time (~6–9 AM UTC),
 *   never at UTC midnight.
 *
 * Works in Node 18+ using only standard built-ins (Intl.DateTimeFormat).
 * No external packages required.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UtcDayBoundaries {
  /** UTC start of the facility-local calendar day (inclusive) */
  from: Date;
  /** UTC start of the next facility-local calendar day (exclusive) */
  to: Date;
}

// ── Implementation ────────────────────────────────────────────────────────────

const fmt = new Intl.DateTimeFormat("en-US", {
  year:   "numeric",
  month:  "2-digit",
  day:    "2-digit",
  hour:   "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  // timeZone is supplied per-call via a fresh formatter
});

/**
 * Get the UTC offset (in milliseconds) of an IANA timezone at a given UTC instant.
 *
 * Returns: (local_time_interpreted_as_utc) - (actual_utc)
 * e.g. for EST (UTC-5): offset = -18_000_000  (−5h)
 * e.g. for EDT (UTC-4): offset = -14_400_000  (−4h)
 */
function getOffsetMs(utcMs: number, ianaTimezone: string): number {
  const localFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: ianaTimezone,
    year:     "numeric",
    month:    "2-digit",
    day:      "2-digit",
    hour:     "2-digit",
    minute:   "2-digit",
    second:   "2-digit",
    hour12:   false,
  });
  const parts = localFmt.formatToParts(new Date(utcMs));
  const p = (type: string): number =>
    parseInt(parts.find((x) => x.type === type)?.value ?? "0", 10);

  const lY   = p("year");
  const lM   = p("month");
  const lD   = p("day");
  const lH   = p("hour") % 24; // guard: some implementations return 24 for midnight
  const lMin = p("minute");
  const lSec = p("second");

  return Date.UTC(lY, lM - 1, lD, lH, lMin, lSec) - utcMs;
}

/**
 * Find the UTC instant for midnight of (year, month, day) in the given IANA timezone.
 *
 * Uses UTC midnight as the reference to compute the timezone offset.
 * DST transitions in all standard IANA timezones occur in the local morning
 * (e.g. 2 AM), which is well past UTC midnight for any US/EU timezone,
 * so UTC midnight is always an unambiguous reference point.
 */
function localMidnightToUtc(year: number, month: number, day: number, iana: string): Date {
  const utcMidnightRef = Date.UTC(year, month - 1, day, 0, 0, 0);
  const offsetMs = getOffsetMs(utcMidnightRef, iana);
  // local midnight (treated as UTC literal) minus offset = actual UTC for local midnight
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMs);
}

/**
 * Convert a YYYY-MM-DD date string and an IANA timezone identifier
 * to the UTC [from, to) half-open interval bounding that local calendar day.
 *
 * @param date          YYYY-MM-DD string (the calendar date in the facility's timezone)
 * @param ianaTimezone  IANA timezone identifier (e.g. "America/New_York")
 * @returns             { from, to } UTC Date boundaries
 *
 * @throws              Error if `date` is not a valid YYYY-MM-DD string
 * @throws              RangeError if `ianaTimezone` is not a recognised IANA timezone
 *
 * Example:
 *   facilityDayToUtcBoundaries("2026-03-08", "America/New_York")
 *   // Spring-forward day (23-hour local day)
 *   // → { from: 2026-03-08T05:00:00Z, to: 2026-03-09T04:00:00Z }
 *
 *   facilityDayToUtcBoundaries("2026-11-01", "America/New_York")
 *   // Fall-back day (25-hour local day)
 *   // → { from: 2026-11-01T04:00:00Z, to: 2026-11-02T05:00:00Z }
 */
export function facilityDayToUtcBoundaries(
  date: string,
  ianaTimezone: string,
): UtcDayBoundaries {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: "${date}" — expected YYYY-MM-DD`);
  }

  const parts = date.split("-").map(Number) as [number, number, number];
  const [year, month, day] = parts;

  // Validate ranges
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date: "${date}"`);
  }

  // Trigger an early RangeError for unknown timezones before touching the DB
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: ianaTimezone });
  } catch {
    throw new RangeError(`Unknown IANA timezone: "${ianaTimezone}"`);
  }

  const from = localMidnightToUtc(year, month, day, ianaTimezone);

  // Compute next calendar day (handles month/year rollovers correctly)
  const nextDayUtc  = new Date(Date.UTC(year, month - 1, day + 1));
  const to          = localMidnightToUtc(
    nextDayUtc.getUTCFullYear(),
    nextDayUtc.getUTCMonth() + 1,
    nextDayUtc.getUTCDate(),
    ianaTimezone,
  );

  return { from, to };
}
