import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        type="time"
        className={cn(
          "flex h-10 w-full rounded-md border border-cream-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-charcoal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-charcoal-800 dark:bg-charcoal-950 dark:ring-offset-charcoal-950 dark:placeholder:text-charcoal-400 dark:focus-visible:ring-brand-400",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
TimeInput.displayName = "TimeInput";

export { TimeInput };