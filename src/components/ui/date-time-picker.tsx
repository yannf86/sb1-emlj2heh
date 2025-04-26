import * as React from "react";
import { DateInput } from "./date-input";
import { TimeInput } from "./time-input";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const DateTimePicker = React.forwardRef<HTMLDivElement, DateTimePickerProps>(
  ({ date, time, onDateChange, onTimeChange, label, error, required, className, disabled }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {label && (
          <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
            {label}
          </Label>
        )}
        <div className="grid grid-cols-2 gap-2">
          <DateInput
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            error={!!error}
            disabled={disabled}
          />
          <TimeInput
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            error={!!error}
            disabled={disabled}
          />
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
DateTimePicker.displayName = "DateTimePicker";

export { DateTimePicker };