import * as React from "react"
import { clsx } from "clsx"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={clsx(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500": variant === "primary",
            "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500": variant === "secondary",
            "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500": variant === "outline",
            "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500": variant === "danger",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4": size === "md",
            "h-12 px-6 text-lg": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
