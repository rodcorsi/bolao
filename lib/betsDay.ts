import startOfDay from "./startOfDay";

export const BETS_DAY_ANCHORS = {
  today: "bets-day-today",
  yesterday: "bets-day-yesterday",
};

export type RelativeBetsDay = "today" | "yesterday" | "future" | "past";

export function getBetsDay(date: Date | string | number, timeZone: string) {
  return startOfDay(date, timeZone);
}

export function getYesterdayBetsDay(today: number, timeZone: string) {
  return startOfDay(today - 1, timeZone);
}

export function getRelativeBetsDay(
  day: number,
  today: number,
  timeZone: string,
): RelativeBetsDay {
  const yesterday = getYesterdayBetsDay(today, timeZone);

  if (day === today) return "today";
  if (day === yesterday) return "yesterday";
  if (day > today) return "future";
  return "past";
}

export function getBetsDayAnchor(relativeDay: RelativeBetsDay) {
  if (relativeDay === "today") return BETS_DAY_ANCHORS.today;
  if (relativeDay === "yesterday") return BETS_DAY_ANCHORS.yesterday;
  return undefined;
}

export function formatBetsDay(
  date: Date | string | number,
  locale: string,
  timeZone: string,
) {
  return new Date(date).toLocaleDateString(locale, {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
