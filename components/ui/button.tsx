"use client";

import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={
          "inline-flex items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:pointer-events-none disabled:opacity-50 " +
          className
        }
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
