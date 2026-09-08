"use client";

import dayjs, { type Dayjs } from "dayjs";
import {
  DatePicker,
  Form,
  type DatePickerProps,
  type FormItemProps,
} from "antd";

type DateValue = Dayjs | null;

interface DatePickerFieldProps {
  label: string;
  name: FormItemProps["name"];
  rules?: FormItemProps["rules"];
  placeholder?: string;
  pickerProps?: Omit<DatePickerProps, "format" | "value" | "onChange">;
  disabledDate?: DatePickerProps["disabledDate"];
}

const dateFormat = "YYYY-MM-DD";

function toDatePickerValue(value: unknown): DateValue {
  if (dayjs.isDayjs(value)) {
    return value;
  }

  if (typeof value === "string" && value) {
    return dayjs(value, dateFormat);
  }

  return null;
}

function normalizeDatePickerValue(value: unknown) {
  if (dayjs.isDayjs(value)) {
    return value.format(dateFormat);
  }

  return undefined;
}

export function DatePickerField({
  label,
  name,
  rules,
  placeholder,
  pickerProps,
  disabledDate,
}: DatePickerFieldProps) {
  return (
    <Form.Item
      getValueProps={(value: unknown) => ({
        value: toDatePickerValue(value),
      })}
      label={label}
      name={name}
      normalize={normalizeDatePickerValue}
      rules={rules}
    >
      <DatePicker
        className="w-full"
        disabledDate={disabledDate}
        format={dateFormat}
        placeholder={placeholder}
        {...pickerProps}
      />
    </Form.Item>
  );
}
