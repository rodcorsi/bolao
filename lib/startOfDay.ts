import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone"; // dependent on utc plugin
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function startOfDay(
  date: Date | string | number,
  timeZone: string,
) {
  return dayjs.utc(date).tz(timeZone).startOf("day").valueOf();
}
