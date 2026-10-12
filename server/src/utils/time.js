// Display labels for timestamps, computed on the server so the client renders them as-is.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Whole calendar days between `date` and `now` (0 = same day). */
function daysAgo(date, now) {
  return Math.round((startOfDay(now) - startOfDay(date)) / (24 * HOUR));
}

export function groupLabel(date, now = new Date()) {
  return daysAgo(new Date(date), now) <= 0 ? "Today" : "Earlier";
}

/** "Just now", "12 min ago", "3 h ago", "Yesterday", "Oct 3" or "Oct 3, 2025". */
export function relativeTime(date, now = new Date()) {
  const d = new Date(date);
  const diff = now - d;
  const days = daysAgo(d, now);

  if (diff < MINUTE) return "Just now";
  if (days <= 0) {
    if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
    return `${Math.floor(diff / HOUR)} h ago`;
  }
  if (days === 1) return "Yesterday";

  const options = { month: "short", day: "numeric" };
  if (d.getFullYear() !== now.getFullYear()) options.year = "numeric";
  return d.toLocaleDateString("en-US", options);
}
