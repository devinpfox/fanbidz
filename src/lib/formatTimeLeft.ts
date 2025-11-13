/**
 * Formats time remaining in milliseconds into a human-readable string
 *
 * Rules:
 * - 24+ hours: "Ends in 1d 3h" (days + hours)
 * - 1-24 hours: "Ends in 1h 30m" (hours + minutes)
 * - <1 hour: "Ends in 59m 20s" (minutes + seconds)
 * - 0 or less: "Ended"
 *
 * @param msRemaining - Milliseconds remaining until end time
 * @returns Formatted string like "Ends in 1d 3h" or "Ended"
 */
export function formatTimeLeft(msRemaining: number): string {
  if (msRemaining <= 0) {
    return 'Ended';
  }

  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // 24+ hours: show days + hours
  if (totalSeconds >= 86400) {
    if (hours === 0) {
      return `Ends in ${days}d`;
    }
    return `Ends in ${days}d ${hours}h`;
  }

  // 1-24 hours: show hours + minutes
  if (totalSeconds >= 3600) {
    if (minutes === 0) {
      return `Ends in ${hours}h`;
    }
    return `Ends in ${hours}h ${minutes}m`;
  }

  // <1 hour: show minutes + seconds
  if (totalSeconds >= 60) {
    if (seconds === 0) {
      return `Ends in ${minutes}m`;
    }
    return `Ends in ${minutes}m ${seconds}s`;
  }

  // <1 minute: show seconds only
  return `Ends in ${seconds}s`;
}

/**
 * Formats time remaining in seconds into a human-readable string
 * Convenience wrapper for formatTimeLeft that accepts seconds instead of milliseconds
 */
export function formatTimeLeftFromSeconds(secondsRemaining: number): string {
  return formatTimeLeft(secondsRemaining * 1000);
}
