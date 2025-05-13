import * as React from "react";
import { cn } from "../../lib/utils";

export interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'default' | 'bordered' | 'flat';
}

export function Card({ 
  className, 
  children, 
  onClick,
  hoverable = false,
  variant = 'default'
}: CardProps) {
  // Apply styles based on variant
  const variantStyles = {
    default: 'bg-white dark:bg-surface-dark shadow-elevated border border-gray-100 dark:border-gray-800',
    bordered: 'bg-white dark:bg-surface-dark border-2 border-gray-200 dark:border-gray-700',
    flat: 'bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800',
  };

  return (
    <div 
      className={cn(
        // Square design as preferred by user
        "p-5", 
        variantStyles[variant],
        hoverable && "transition-all duration-200 hover:shadow-prominent",
        onClick && "cursor-pointer",
        className
      )} 
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardContent({ 
  className, 
  children,
  onClick
}: { 
  className?: string; 
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return <div className={cn("p-4", className)} onClick={onClick}>{children}</div>;
}
