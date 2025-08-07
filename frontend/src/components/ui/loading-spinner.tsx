import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  text?: string
  fullScreen?: boolean
  variant?: "spinner" | "dots" | "pulse"
  color?: "primary" | "secondary" | "success" | "warning" | "danger"
  inline?: boolean
}

export default function LoadingSpinner({ 
  size = "md", 
  className,
  text,
  fullScreen = false,
  variant = "spinner",
  color = "primary",
  inline = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  }

  const colorClasses = {
    primary: "border-t-blue-600",
    secondary: "border-t-gray-600",
    success: "border-t-green-600",
    warning: "border-t-yellow-600",
    danger: "border-t-red-600"
  }

  const dotColorClasses = {
    primary: "bg-blue-600",
    secondary: "bg-gray-600",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    danger: "bg-red-600"
  }

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full animate-pulse",
                  size === "sm" ? "w-1 h-1" : size === "lg" ? "w-3 h-3" : size === "xl" ? "w-4 h-4" : "w-2 h-2",
                  dotColorClasses[color]
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "1s"
                }}
              />
            ))}
          </div>
        )
      case "pulse":
        return (
          <div
            className={cn(
              "animate-pulse rounded-full",
              sizeClasses[size],
              dotColorClasses[color],
              "opacity-60"
            )}
          />
        )
      default:
        return (
          <div
            className={cn(
              "animate-spin rounded-full border-2 border-gray-300",
              sizeClasses[size],
              colorClasses[color],
              className
            )}
          />
        )
    }
  }

  const content = (
    <div className={cn(
      "flex items-center justify-center gap-3",
      inline ? "flex-row" : "flex-col"
    )}>
      {renderSpinner()}
      {text && (
        <p className={cn(
          "text-gray-600 dark:text-gray-400",
          size === "sm" ? "text-xs" : size === "lg" ? "text-base" : size === "xl" ? "text-lg" : "text-sm",
          !inline && "animate-pulse"
        )}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {content}
      </div>
    )
  }

  return content
}
