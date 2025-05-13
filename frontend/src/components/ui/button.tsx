import * as React from "react";
import { cn } from "../../lib/utils"; // Adjusted import path

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    // Apply different styles based on variant
    const variantStyles = {
      default: 'bg-blue-600 hover:bg-blue-700 text-white',
      outline: 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-100',
      destructive: 'bg-red-600 hover:bg-red-700 text-white'
    };

    // Apply different sizes based on size prop
    const sizeStyles = {
      default: 'px-4 py-2',
      sm: 'px-2 py-1 text-sm',
      lg: 'px-6 py-3 text-lg'
    };

    return (
      <button
        ref={ref}
        className={cn(
          "rounded font-medium", 
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
