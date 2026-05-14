export function formatDateTime(
  date: Date | string | number,
  locale: string = "en-US",
  timeZone: string = "UTC"
) {
  const dt = new Date(date);
  const optionsDateFormat: Intl.DateTimeFormatOptions = {
    timeZone,
    day: "numeric",
    month: "2-digit",
    year: "numeric",
    hour12: false,
    hour: "numeric",
    minute: "2-digit",
  };
  return dt.toLocaleString(locale, optionsDateFormat);
}
