import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  error?: boolean
  success?: boolean
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, error, success, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border-2 transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "hover:scale-110 active:scale-95",
      // Base state
      "border-gray-300 bg-white",
      // Focus state
      "focus-visible:ring-blue-500 focus-visible:border-blue-500",
      // Checked state with animation
      "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white",
      "data-[state=checked]:shadow-md data-[state=checked]:shadow-blue-600/25",
      // Error state
      error && "border-red-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600",
      error && "focus-visible:ring-red-500",
      // Success state
      success && "border-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600",
      success && "focus-visible:ring-green-500",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-current",
        "animate-in zoom-in-50 duration-200"
      )}
    >
      <Check className="h-3 w-3 stroke-[3px]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
