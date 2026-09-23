// Date formatting identical to the original date-fns output, computed from the
// calendar date so server and client render the same text in every timezone.
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
  "December",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parts(isoDate: string) {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, weekday };
}

/** "Dec 14, 2025" (date-fns `MMM d, yyyy`). */
export function formatShortDate(isoDate: string) {
  const { y, m, d } = parts(isoDate);
  return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
}

/** "Sunday, December 14, 2025" (date-fns `EEEE, MMMM d, yyyy`). */
export function formatLongDate(isoDate: string) {
  const { y, m, d, weekday } = parts(isoDate);
  return `${DAYS[weekday]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}
