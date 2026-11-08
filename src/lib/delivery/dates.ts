/**
 * Delivery date computation — timezone-aware, no external date library.
 *
 * All dates are ISO strings (YYYY-MM-DD). The city's IANA timezone is used
 * to determine "today" and whether the cutoff time has passed.
 */
import type { DeliverySettings } from "@/types/domain";

/* ---------- Internal helpers ---------- */

/** Get the current date string in a given IANA timezone. */
function todayIn(tz: string, now: Date): string {
  return now.toLocaleDateString("en-CA", { timeZone: tz }); // en-CA → YYYY-MM-DD
}

/** Get the current HH:MM in a given IANA timezone. */
function timeIn(tz: string, now: Date): string {
  return now.toLocaleTimeString("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Add `days` calendar days to an ISO date string. */
function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Day-of-week (0 = Sunday) for an ISO date string. */
function dayOfWeek(iso: string): number {
  return new Date(iso + "T00:00:00Z").getUTCDay();
}

/** True if `iso` is on or after `from` and on or before `to`. */
function inRange(iso: string, from: string, to: string): boolean {
  return iso >= from && iso <= to;
}

/**
 * Advance `iso` to the next date that falls on an allowed delivery day
 * and is not a blackout date. Stops after 400 iterations (> 1 year) as a
 * safety valve.
 */
function nextAllowedDate(
  iso: string,
  deliveryDays: number[],
  blackoutDates: string[],
): string {
  const blackoutSet = new Set(blackoutDates);
  let candidate = iso;
  for (let i = 0; i < 400; i++) {
    if (deliveryDays.includes(dayOfWeek(candidate)) && !blackoutSet.has(candidate)) {
      return candidate;
    }
    candidate = addDays(candidate, 1);
  }
  // Fallback — should never happen with reasonable settings.
  return candidate;
}

/* ---------- Public API ---------- */

/**
 * Earliest date a delivery can be scheduled for.
 *
 * Logic:
 * 1. Start from "today" in the city's timezone.
 * 2. If the current time is past `cutoffTime`, move to tomorrow.
 * 3. Add `minLeadDays`.
 * 4. Skip forward past any blackout dates or non-delivery days.
 */
export function getEarliestDeliveryDate(
  settings: DeliverySettings,
  cityTimezone: string,
  now: Date = new Date(),
): string {
  const today = todayIn(cityTimezone, now);
  const currentTime = timeIn(cityTimezone, now);

  // If past cutoff, the "order day" is tomorrow.
  const orderDay =
    currentTime >= settings.cutoffTime ? addDays(today, 1) : today;

  // Add minimum lead days.
  const earliest = addDays(orderDay, settings.minLeadDays);

  // Skip to the next allowed delivery day.
  return nextAllowedDate(earliest, settings.deliveryDays, settings.blackoutDates);
}

/**
 * Latest date a delivery can be scheduled for.
 * Computed as `maxAdvanceDays` from today (not from earliest).
 */
export function getLatestDeliveryDate(
  settings: DeliverySettings,
  now: Date = new Date(),
): string {
  // We don't need the timezone for the latest — it's just "today + maxAdvanceDays"
  // using UTC as a conservative base.
  const today = now.toISOString().slice(0, 10);
  return addDays(today, settings.maxAdvanceDays);
}

/**
 * Check whether a specific date is a valid delivery date.
 */
export function isValidDeliveryDate(
  date: string,
  settings: DeliverySettings,
  cityTimezone: string,
  now: Date = new Date(),
): boolean {
  const earliest = getEarliestDeliveryDate(settings, cityTimezone, now);
  const latest = getLatestDeliveryDate(settings, now);

  if (!inRange(date, earliest, latest)) return false;
  if (!settings.deliveryDays.includes(dayOfWeek(date))) return false;
  if (settings.blackoutDates.includes(date)) return false;

  return true;
}

/**
 * Returns all valid delivery dates between earliest and latest.
 * Useful for rendering a date picker with only selectable dates.
 */
export function getAvailableDates(
  settings: DeliverySettings,
  cityTimezone: string,
  now: Date = new Date(),
): string[] {
  const earliest = getEarliestDeliveryDate(settings, cityTimezone, now);
  const latest = getLatestDeliveryDate(settings, now);
  const blackoutSet = new Set(settings.blackoutDates);

  const dates: string[] = [];
  let cursor = earliest;

  while (cursor <= latest) {
    if (
      settings.deliveryDays.includes(dayOfWeek(cursor)) &&
      !blackoutSet.has(cursor)
    ) {
      dates.push(cursor);
    }
    cursor = addDays(cursor, 1);
  }

  return dates;
}
