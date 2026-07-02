import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition",
          size === "default" && "px-4 py-2 text-sm",
          size === "sm" && "px-3 py-1.5 text-xs",
          size === "lg" && "px-5 py-2.5 text-base",
          size === "icon" && "h-9 w-9 p-0",
          size === "icon-sm" && "h-7 w-7 p-0",
          variant === "default" &&
            "bg-amber-500 text-black hover:bg-amber-400",
          variant === "outline" &&
            "border border-white/20 bg-transparent text-white",
          variant === "destructive" &&
            "bg-red-500 text-white",
          variant === "ghost" &&
            "bg-transparent text-white",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";