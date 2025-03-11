import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn("w-full p-2 rounded border border-gray-400 bg-gray-700 text-white", className)}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
