/**
 * Check if value is a plain number string
 */
function isPlainNumber(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value);
}

/**
 * Validate a parsed float is a valid time value
 */
function isValidTime(value: number): boolean {
  return !Number.isNaN(value) && value >= 0;
}

/**
 * Parse time parts (hours, minutes, seconds) into total seconds
 */
function parseTimeParts(parts: string[]): number | null {
  if (parts.length === 1) {
    const num = parseFloat(parts[0]);
    return isValidTime(num) ? num : null;
  }

  if (parts.length === 2) {
    const [min, sec] = [parseFloat(parts[0]), parseFloat(parts[1])];
    return (isValidTime(min) && isValidTime(sec)) ? min * 60 + sec : null;
  }

  if (parts.length === 3) {
    const [hrs, min, sec] = [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
    return (isValidTime(hrs) && isValidTime(min) && isValidTime(sec)) ?
      hrs * 3600 + min * 60 + sec : null;
  }

  return null;
}

/**
 * Parses a single timestamp string to seconds
 * Supports various formats:
 * - "1:23" -> 83 seconds
 * - "00:23.500" -> 23.5 seconds
 * - "45" -> 45 seconds
 * - "1:02:03" -> 3723 seconds (hours:minutes:seconds)
 *
 * @param value - The timestamp string to parse
 * @returns The timestamp in seconds, or null if invalid
 */
export function parseTimestamp(value: string): number | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Check if it's just a number (seconds)
  if (isPlainNumber(trimmed)) {
    const seconds = parseFloat(trimmed);
    return Number.isNaN(seconds) ? null : seconds;
  }

  // Parse time format (HH:MM:SS, MM:SS, or variations)
  const parts = trimmed.split(':');
  if (parts.length < 1 || parts.length > 3) {
    return null;
  }

  return parseTimeParts(parts);
}

/**
 * Parses a timestamp string that may contain pipe-delimited values
 * Examples:
 * - "0:16" -> [16]
 * - "0:16|1:20" -> [16, 80]
 * - "0:16|1:20|2:45" -> [16, 80, 165]
 *
 * @param value - The timestamp string (may be pipe-delimited)
 * @returns Array of timestamps in seconds (empty array if invalid)
 */
export function parseTimestamps(value: string): number[] {
  if (!value || typeof value !== 'string') {
    return [];
  }

  const parts = value.split('|').map((part) => part.trim());
  const timestamps: number[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const part of parts) {
    const parsed = parseTimestamp(part);
    if (parsed !== null) {
      timestamps.push(parsed);
    }
  }

  return timestamps;
}

/**
 * Timestamp precision options for formatting
 */
export type TimestampPrecision = 0 | 1 | 2 | 3;

/**
 * Formats seconds into a human-readable timestamp string
 * Examples (precision=0, default):
 * - 23.5 -> "0:23"
 * - 83 -> "1:23"
 * - 3723 -> "1:02:03"
 *
 * Examples (precision=2, centiseconds):
 * - 23.5 -> "0:23.50"
 * - 83.123 -> "1:23.12"
 *
 * Examples (precision=3, milliseconds):
 * - 23.5 -> "0:23.500"
 * - 83.123 -> "1:23.123"
 *
 * @param seconds - The time in seconds
 * @param precision - Decimal places for fractional seconds (0-3). Default: 0
 * @returns Formatted timestamp string
 */
export function formatTimestamp(seconds: number, precision: TimestampPrecision = 0): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return precision > 0 ? `0:00.${'0'.repeat(precision)}` : '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  let secsFormatted: string;
  if (precision > 0) {
    // Get seconds with fractional part
    const secs = seconds % 60;
    const wholeSecs = Math.floor(secs);
    const fraction = secs - wholeSecs;
    const fractionStr = fraction.toFixed(precision).slice(2); // Remove "0."
    secsFormatted = `${String(wholeSecs).padStart(2, '0')}.${fractionStr}`;
  } else {
    const secs = Math.floor(seconds % 60);
    secsFormatted = String(secs).padStart(2, '0');
  }

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${secsFormatted}`;
  }

  return `${minutes}:${secsFormatted}`;
}
