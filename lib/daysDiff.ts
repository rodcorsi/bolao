import config from "../static_data/config.json";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone"; // dependent on utc plugin
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(timezone);

const timeZone = config.timeZone;

export default function daysDiff(
  d1: Date | string | number,
  d2: Date | string | number
): number {
  const date1 = dayjs(d1).tz(timeZone);
  const date2 = dayjs(d2).tz(timeZone);
  return date1.diff(date2, "day");
}
