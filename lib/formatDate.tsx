import config from "../static_data/config.json";
const locale = config.locale;
const optionsDateFormat: Intl.DateTimeFormatOptions = {
  timeZone: config.timeZone,
  day: "numeric",
  month: "2-digit",
  year: "numeric",
  hour12: false,
  hour: "numeric",
  minute: "2-digit",
};

export function formatDateTime(date: Date | string) {
  const dt = new Date(date);
  return dt.toLocaleString(locale, optionsDateFormat);
}
