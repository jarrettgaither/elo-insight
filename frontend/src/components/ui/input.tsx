import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error, icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-content-tertiary dark:text-content-tertiaryDark pointer-events-none">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full h-10 px-3 py-2", // Square design as requested
          "border-2 border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-surface-dark",
          "text-content-primary dark:text-content-primaryDark",
          "placeholder:text-content-tertiary dark:placeholder:text-content-tertiaryDark",
          "focus:outline-none focus:border-primary-500 dark:focus:border-primary-400",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-500 focus:border-red-500 dark:border-red-500 dark:focus:border-red-500",
          icon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";

export { Input };
