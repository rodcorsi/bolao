export function formatDateTime(
  date: Date | string | number,
  locale: string = "pt-BR",
  timeZone: string = "America/Sao_Paulo",
) {
  const dt = new Date(date);
  const optionsDateFormat: Intl.DateTimeFormatOptions = {
    timeZone,
    day: "numeric",
    month: "2-digit",
    year: "numeric",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  };
  return dt.toLocaleString(locale, optionsDateFormat);
}
