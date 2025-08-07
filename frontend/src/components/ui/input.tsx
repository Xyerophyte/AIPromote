import * as React from "react"
import { clsx } from "clsx"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  floatingLabel?: boolean
  success?: boolean
  loading?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, loading, label, floatingLabel = false, id, value, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(!!value || !!props.defaultValue)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value)
      props.onChange?.(e)
    }

    React.useEffect(() => {
      setHasValue(!!value)
    }, [value])

    const shouldFloatLabel = floatingLabel && (isFocused || hasValue)

    if (floatingLabel) {
      return (
        <div className="relative">
          <input
            type={type}
            id={inputId}
            value={value}
            className={cn(
              "peer h-12 w-full rounded-lg border-2 bg-white px-4 pt-6 pb-2 text-sm transition-all duration-300 ease-out",
              "placeholder-transparent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              // Base state
              "border-gray-300 text-gray-900",
              // Focus state with glow effect
              "focus:border-blue-500 focus:shadow-glow focus:[--glow-color:rgba(59,130,246,0.25)]",
              // Error state
              error && "border-red-500 focus:border-red-500 focus:shadow-glow focus:[--glow-color:rgba(239,68,68,0.25)] text-red-900",
              // Success state
              success && "border-green-500 focus:border-green-500 focus:shadow-glow focus:[--glow-color:rgba(34,197,94,0.25)] text-green-900",
              // Loading state
              loading && "opacity-70 cursor-wait",
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-4 transition-all duration-300 ease-out pointer-events-none",
                "origin-left transform font-medium",
                shouldFloatLabel
                  ? "top-2 text-xs scale-75 text-blue-600"
                  : "top-1/2 -translate-y-1/2 text-sm text-gray-500",
                error && shouldFloatLabel && "text-red-600",
                success && shouldFloatLabel && "text-green-600"
              )}
            >
              {label}
            </label>
          )}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
          {/* Validation icons */}
          {!loading && error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {!loading && success && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {/* Animated validation feedback */}
          {(error || success) && (
            <div className="mt-2 animate-slide-up">
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {typeof success === 'string' ? success : 'Valid input'}
                </p>
              )}
            </div>
          )}
        </div>
      )
    }

    // Standard input with label above
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 transition-colors duration-200">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            id={inputId}
            value={value}
            className={cn(
              "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm transition-all duration-300 ease-out",
              "placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              // Base state
              "border-gray-300 text-gray-900",
              // Focus state with glow effect
              "focus:border-blue-500 focus:shadow-glow focus:[--glow-color:rgba(59,130,246,0.15)]",
              // Hover state
              "hover:border-gray-400 focus:hover:border-blue-500",
              // Error state
              error && "border-red-500 focus:border-red-500 focus:shadow-glow focus:[--glow-color:rgba(239,68,68,0.15)]",
              // Success state
              success && "border-green-500 focus:border-green-500 focus:shadow-glow focus:[--glow-color:rgba(34,197,94,0.15)]",
              // Loading state
              loading && "opacity-70 cursor-wait",
              className
            )}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
          {/* Validation icons */}
          {!loading && error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {!loading && success && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>
        {/* Animated validation feedback */}
        {(error || success) && (
          <div className="animate-slide-up">
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {typeof success === 'string' ? success : 'Valid input'}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
