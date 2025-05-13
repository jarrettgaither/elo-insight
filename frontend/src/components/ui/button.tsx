import * as React from "react";
import { cn } from "../../lib/utils"; // Adjusted import path

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'link' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading = false, ...props }, ref) => {
    // Apply different styles based on variant
    const variantStyles = {
      default: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm transition-colors',
      secondary: 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm transition-colors',
      outline: 'bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-50 transition-colors dark:hover:bg-primary-950/30 dark:text-primary-400',
      ghost: 'bg-transparent hover:bg-gray-100 text-content-primary dark:hover:bg-gray-800 dark:text-content-primaryDark',
      destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors',
      link: 'bg-transparent text-primary-500 hover:underline underline-offset-4 p-0 h-auto dark:text-primary-400',
    };

    // Apply different sizes based on size prop
    const sizeStyles = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 py-1 text-sm',
      lg: 'h-12 px-6 py-3 text-lg',
      icon: 'h-10 w-10 p-0 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        className={cn(
          "font-medium select-none", // Square design as preferred by user
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40", 
          "disabled:opacity-50 disabled:pointer-events-none",
          isLoading && "relative text-transparent transition-none hover:text-transparent",
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
