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

export function formatPhaseDate(
  date: Date | string | number,
  locale: string = "pt-BR",
  timeZone: string = "America/Sao_Paulo",
) {
  const dt = new Date(date);
  const day = dt.toLocaleString(locale, { timeZone, day: "2-digit" });
  const month = dt
    .toLocaleString(locale, { timeZone, month: "short" })
    .replace(".", "");
  const time = dt.toLocaleString(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day}/${month} às ${time}`;
}
