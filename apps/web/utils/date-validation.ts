import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import type { DatePickerProps } from "antd";

export const disableFutureDates: NonNullable<
  DatePickerProps<Dayjs>["disabledDate"]
> = (currentDate) => currentDate.isAfter(dayjs(), "day");
