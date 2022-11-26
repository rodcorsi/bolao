import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone"; // dependent on utc plugin
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const timeZone = "America/Sao_Paulo";
export default function startOfDay(date: Date | string | number = Date.now()) {
  const dt = dayjs(date).tz(timeZone);
  return dt.startOf("day").toDate().getTime();
}
