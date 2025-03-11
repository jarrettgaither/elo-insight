import * as React from "react";
import { cn } from "../../lib/utils"; // Adjusted import path

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-bold", className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
