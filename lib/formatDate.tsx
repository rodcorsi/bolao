const locale = "pt-BR";
const optionsDateFormat: Intl.DateTimeFormatOptions = {
  timeZone: "America/Sao_Paulo",
  day: "numeric",
  month: "2-digit",
  year: "numeric",
};

const optionsTimeFormat: Intl.DateTimeFormatOptions = {
  timeZone: "America/Sao_Paulo",
  hour12: false,
  hour: "numeric",
  minute: "2-digit",
};

export function formatDateTime(date: Date | string) {
  const dt = new Date(date);
  return (
    dt.toLocaleDateString(locale, optionsDateFormat) +
    " " +
    dt.toLocaleTimeString(locale, optionsTimeFormat)
  );
}
