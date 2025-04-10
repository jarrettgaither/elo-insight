import * as React from "react";
import { cn } from "../../lib/utils";

export function Card({ 
  className, 
  children, 
  onClick 
}: { 
  className?: string; 
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return <div className={cn("rounded-lg shadow-md p-4", className)} onClick={onClick}>{children}</div>;
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
